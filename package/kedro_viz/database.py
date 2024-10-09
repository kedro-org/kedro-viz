"""Database management layer based on SQLAlchemy"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from kedro_viz.models.experiment_tracking import Base


def make_db_session_factory(session_store_location: str) -> sessionmaker:
    """SQLAlchemy connection to a SQLite DB"""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})

    # Enable Write-Ahead Logging (WAL)
    with engine.begin() as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA busy_timeout=30000;")  # 30 seconds timeout for locks

    session_class = sessionmaker(engine)
    # TODO: making db session factory shouldn't depend on models.
    # So want to move the table creation elsewhere ideally.
    # But this means returning engine as well as session class.
    Base.metadata.create_all(bind=engine)
    return session_class
