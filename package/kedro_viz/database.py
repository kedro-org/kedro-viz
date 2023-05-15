"""Database management layer based on SQLAlchemy"""
from typing import Tuple

from sqlalchemy import create_engine
from sqlalchemy.engine.base import Engine
from sqlalchemy.orm import sessionmaker


def create_db_engine(
    session_store_location: str,
) -> Tuple[Engine, sessionmaker]:
    """SQLAlchemy connection to a SQLite DB"""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    session_class = sessionmaker(bind=engine)
    return engine, session_class
