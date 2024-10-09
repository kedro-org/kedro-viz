"""Database management layer based on SQLAlchemy"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from kedro_viz.models.experiment_tracking import Base

def make_db_session_factory(session_store_location: str) -> sessionmaker:
    """SQLAlchemy connection to a SQLite DB with WAL mode enabled."""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
    )

    # Apply PRAGMA settings for WAL mode.
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL;"))
        conn.execute(text("PRAGMA synchronous=NORMAL;"))
        conn.execute(text("PRAGMA busy_timeout=30000;"))  # 30 seconds timeout for locks

    # Create the database tables if they do not exist.
    Base.metadata.create_all(bind=engine)

    # Return a session factory bound to the engine.
    return sessionmaker(bind=engine)
