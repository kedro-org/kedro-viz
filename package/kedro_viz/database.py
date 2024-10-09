"""Database management layer based on SQLAlchemy"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from kedro_viz.models.experiment_tracking import Base

import shutil
import os
from pathlib import Path


def make_db_session_factory(session_store_location: str) -> sessionmaker:
    """SQLAlchemy connection to a SQLite DB with WAL mode enabled."""
    # Use a temporary path for database operations to avoid CIFS locks.
    temp_db_path = "/tmp/session_store.db"
    shutil.copy(session_store_location, temp_db_path)

    database_url = f"sqlite:///{temp_db_path}"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
    )

    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL;"))
        conn.execute(text("PRAGMA synchronous=NORMAL;"))
        conn.execute(text("PRAGMA busy_timeout=60000;"))

    Base.metadata.create_all(bind=engine)

    # Copy back the database to persistent location after session operations.
    shutil.copy(temp_db_path, session_store_location)

    return sessionmaker(bind=engine)
