"""Database management layer based on SQLAlchemy"""

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from kedro_viz.models.experiment_tracking import Base


def create_db_engine(
    session_store_location: Path,
) -> sessionmaker:
    """SQLAlchemy connection to a SQLite DB"""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    session_class = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    return session_class
