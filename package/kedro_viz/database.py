"""Database management layer based on SQLAlchemy"""
import logging

from pathlib import Path
from typing import Tuple

from sqlalchemy import create_engine
from sqlalchemy.engine.base import Engine
from sqlalchemy.orm import sessionmaker


_CURRENT_DB_VERSION = 1

logger = logging.getLogger(__name__)


def create_db_engine(
    session_store_location: Path,
) -> Tuple[Engine, sessionmaker]:
    """SQLAlchemy connection to a SQLite DB"""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})

    user_db_version = engine.execute("PRAGMA user_version;").fetchone()[0]

    if user_db_version < _CURRENT_DB_VERSION:
        # Run migration script for each version that user is behind.
        # For example, if the user_db_version is 0 and the current_db_version should be 2.
        # We will run the migration scripts "migrations/1.sql" and "migrations/2.sql".
        # Strategy adapted from https://stackoverflow.com/a/998652/1684058
        for version in range(user_db_version + 1, _CURRENT_DB_VERSION + 1):
            with (
                Path(__file__).parent / "migrations" / f"{version}.sql"
            ).open() as migration_file:
                migration_sql = migration_file.read()

            # run the migration and the pragma in the same transaction
            with engine.connect() as connection:
                with connection.begin():
                    logger.info("Running migration: %s", migration_sql)
                    connection.execute(migration_sql)
                    connection.execute(f"PRAGMA user_version = {version};")

    session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, session_local
