"""Database management layer based on SQLAlchemy"""
import os
import s3fs
from pathlib import Path
from typing import Tuple

from sqlalchemy import create_engine, MetaData, Table, select, insert
from sqlalchemy.engine.base import Engine
from sqlalchemy.orm import sessionmaker


def create_db_engine(
    session_store_location: Path,
) -> Tuple[Engine, sessionmaker]:
    """SQLAlchemy connection to a SQLite DB"""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    session_class = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, session_class


def create_merged_db_engine(merged_store_location: Path, s3_store_location: str) ->  Tuple[Engine, sessionmaker]:
    s3 = s3fs.S3FileSystem()
    databases = s3.glob(f"{s3_store_location}/*.db")
    engine = create_engine(f"sqlite:///{merged_store_location}/merged_session_store.db",connect_args={"check_same_thread": False})
    metadata = MetaData()



    for database in databases:
        with s3.open(database, 'rb') as file:
            db_bytes = file.read()
        database_name = os.path.basename(database)
        db_loc = f'{merged_store_location}/{database_name}'
        with open(db_loc, 'wb') as temp_db:
                temp_db.write(db_bytes)
        db_engine = create_engine(f"sqlite:///{db_loc}")
        db_metadata = MetaData()
        db_metadata.reflect(bind=db_engine)
        
        for table in db_metadata.tables.values():
            table.to_metadata(metadata)

    with engine.begin() as target_conn:
        metadata.create_all(bind=engine)
        for database in databases:
            database_name = os.path.basename(database)
            db_loc = f'{merged_store_location}/{database_name}'
            db_engine  = create_engine(f"sqlite:///{db_loc}")
            with db_engine.connect() as database_conn:
                for table_name, table_obj in db_metadata.tables.items():
                    data = database_conn.execute(table_obj.select()).fetchall()

                    for row in data:
                        try:
                            new_table = metadata.tables[table_name]
                            target_conn.execute(new_table.insert().values(row))
                        except Exception as e:
                            print(f"Failed to insert {row}: {e}")
    

    session_class = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, session_class





