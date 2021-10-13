"""Database management layer based on SQLAlchemy"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from kedro_viz.data_access import data_access_manager

def create_db_engine():
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{data_access_manager.session_store_location}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, SessionLocal


