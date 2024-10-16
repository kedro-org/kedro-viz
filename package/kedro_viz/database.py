"""Database management layer based on SQLAlchemy"""

import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from kedro_viz.models.experiment_tracking import Base


def configure_wal_for_azure(engine):
    """Applies WAL mode to SQLite if running in an Azure ML environment."""
    is_azure_ml = any(
        var in os.environ
        for var in [
            "AZUREML_ARM_SUBSCRIPTION",
            "AZUREML_ARM_RESOURCEGROUP",
            "AZUREML_RUN_ID",
        ]
    )
    if is_azure_ml:
        with engine.connect() as conn:
            conn.execute(text("PRAGMA journal_mode=WAL;"))


def make_db_session_factory(session_store_location: str) -> sessionmaker:
    """SQLAlchemy connection to a SQLite DB"""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    # TODO: making db session factory shouldn't depend on models.
    # So want to move the table creation elsewhere ideally.
    # But this means returning engine as well as session class.

    # Check if we are running in an Azure ML environment if so enable WAL mode.
    configure_wal_for_azure(engine)

    # Create the database tables if they do not exist.
    Base.metadata.create_all(bind=engine)

    # Return a session factory bound to the engine.
    return sessionmaker(bind=engine)
