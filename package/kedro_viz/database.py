"""Database management layer based on SQLAlchemy"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
# from kedro_viz.integrations.kedro.session_store import SessionStore

def create_db_engine():
    # print(SessionStore.location)
    SQLALCHEMY_DATABASE_URL = "sqlite:///./data/session_store.db"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, SessionLocal
