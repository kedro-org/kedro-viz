"""Database management layer based on SQLAlchemy"""

from pathlib import Path
from typing import Tuple

from sqlalchemy import create_engine
from sqlalchemy.engine.base import Engine
from sqlalchemy.orm import sessionmaker


def create_db_engine(
    session_store_location: Path,
) -> Tuple[Engine, sessionmaker]:
    """SQLAlchemy connection to a SQLite DB"""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, session_local
