"""Database management layer based on SQLAlchemy"""

from pathlib import Path
from typing import Tuple, Type

from sqlalchemy import create_engine
from sqlalchemy.engine.base import Engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.session import Session


def create_db_engine(
    session_store_location: Path,
) -> Tuple[Engine, Type[Session]]:
    """SQLAlchemy connection to a SQLite DB"""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    session_class = sessionmaker(
        autocommit=False, autoflush=False, expire_on_commit=False, bind=engine
    )
    return engine, session_class
