"""Database management layer based on SQLAlchemy"""
from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker


def create_db_engine():
    SQLALCHEMY_DATABASE_URL = "sqlite:///./data/session.db"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, SessionLocal
