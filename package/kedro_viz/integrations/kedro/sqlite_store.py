"""kedro_viz.intergrations.kedro.sqlite_store is a child of BaseSessionStore
which stores sessions data in the SQLite database"""

import json
import getpass
import uuid
import os
import logging
import fsspec
import time 
from pathlib import Path
from typing import Any, Generator, List

from kedro.framework.session.store import BaseSessionStore
from kedro.io.core import get_protocol_and_path

from sqlalchemy import create_engine, MetaData, event
from sqlalchemy.orm import sessionmaker

from kedro_viz.database import create_db_engine
from kedro_viz.models.experiment_tracking import Base, RunModel, UserRunDetailsModel

logger = logging.getLogger(__name__)


def get_db(session_class: sessionmaker) -> Generator:
    """Makes connection to the database"""
    try:
        database = session_class()
        yield database
    finally:
        database.close()

def _get_dbname():
        try:
            return f'{getpass.getuser()}.db'
        
        except Exception as exc:  # pylint: disable=broad-except
            unique_id = uuid.uuid4()
            logger.warning(
                """Something went wrong with getting the username. Generated unique id %s for 
                 for user's database name  Exception: %s""",
                unique_id,exc,
            )
            return f'{unique_id}.db'


def _is_json_serializable(obj: Any):
    try:
        json.dumps(obj)
        return True
    except (TypeError, OverflowError):
        return False

class SQLiteStore(BaseSessionStore):
    """Stores the session data on the sqlite db."""

    @property
    def location(self) -> Path:
        """Returns location of the sqlite_store database"""
        return Path(self._path) / "session_store.db"

    @property
    def remote_location(self) -> Path:
        """Returns location of the sqlite_store database"""
        return self._remote_path

    def to_json(self) -> str:
        """Returns session_store information in json format after converting PosixPath to string"""
        session_dict = {}
        for key, value in self.data.items():
            if key == "git":
                try:
                    import git  # pylint: disable=import-outside-toplevel

                    branch = git.Repo(search_parent_directories=True).active_branch
                    value["branch"] = branch.name
                except ImportError as exc:  # pragma: no cover
                    logger.warning("%s:%s", exc.__class__.__name__, exc.msg)

            if _is_json_serializable(value):
                session_dict[key] = value
            else:
                session_dict[key] = str(value)
        return json.dumps(session_dict)
    
    def on_commit_sync(self, _):
        self.sync()

    def save(self):
        """Save the session store info on db ."""
        engine, session_class = create_db_engine(self.location)
        Base.metadata.create_all(bind=engine)
        database = next(get_db(session_class))
        event.listen(database, 'after_commit', self.on_commit_sync)

        session_store_data = RunModel(id=self._session_id, blob=self.to_json())
        try:
            database.add(session_store_data)
            database.commit()
        except Exception as e:
            pass
        finally:
            database.close()

    def upload(self):
        """Upload the session store db to s3"""
        protocol, _ = get_protocol_and_path(self._remote_path)
        db_name = _get_dbname()
        fs = fsspec.filesystem(protocol)
        with open(self.location, 'rb') as file:
            with fs.open(f'{self._remote_path}/{db_name}', 'wb') as s3f:
                s3f.write(file.read())
    
    def download(self) -> List[str]:
        """Download all the dbs from an s3 locations"""
        protocol, _ = get_protocol_and_path(self._remote_path)
        fs = fsspec.filesystem(protocol)
        databases = fs.glob(f"{self._remote_path}/*.db")
        databases_location = []
        for database in databases:
            database_name = os.path.basename(database)
            with fs.open(database, 'rb') as file:
                db_data = file.read()
            db_loc = f'{self._path}/{database_name}'
            with open(db_loc,'wb') as temp_db:
                temp_db.write(db_data)
            databases_location.append(db_loc)
        return databases_location
    def merge(self, databases_location: List[str]): 
        "Merge all dbs to the local session_store.db"
        engine, session_class = create_db_engine(self.location)
        Base.metadata.create_all(bind=engine)
        database = next(get_db(session_class))

        temp_engine = None
        for db_loc in databases_location:

            if temp_engine: 
                temp_engine.dispose()
            temp_engine = create_engine(f'sqlite:///{db_loc}')
            with temp_engine.connect() as database_conn:
                db_metadata = MetaData()
                db_metadata.reflect(bind=temp_engine)
                for table_name, table_obj in db_metadata.tables.items():
                    if table_name == 'runs':
                        data = database_conn.execute(table_obj.select()).fetchall()
                        for row in data:
                            row_dict = row._asdict()
                            session_store_data = RunModel(**row_dict)
                            try:
                                database.add(session_store_data)
                                database.commit()
                            except Exception as e:
                                database.rollback()
                                pass
                            finally: 
                                database.close()
                    if table_name == 'user_run_details' and _get_dbname() in db_loc:
                        data = database_conn.execute(table_obj.select()).fetchall()
                        for row in data:
                            row_dict = row._asdict()
                            user_details_data = UserRunDetailsModel(**row_dict)
                            try:
                                database.add(user_details_data)
                                database.commit()
                            except Exception as e:
                                database.rollback()
                            finally: 
                                database.close()
            temp_engine.dispose()
            os.remove(db_loc)

    def sync(self):
        if self.remote_location:
            downloaded_dbs = self.download()
            self.merge(downloaded_dbs)   
            self.upload() 







            
            


   

    

