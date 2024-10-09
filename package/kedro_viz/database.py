"""Database management layer based on SQLAlchemy"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

from kedro_viz.models.experiment_tracking import Base

def make_db_session_factory(session_store_location: str) -> sessionmaker:
    """SQLAlchemy connection to a SQLite DB with WAL mode enabled."""
    database_url = f"sqlite:///{session_store_location}"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
    )

    # Check if we are running in an Azure ML environment.
    is_azure_ml = any(
        var in os.environ for var in [
            "AZUREML_ARM_SUBSCRIPTION",
            "AZUREML_ARM_RESOURCEGROUP",
            "AZUREML_RUN_ID"
        ]
    )

    # Apply WAL mode only if we are running in Azure ML.
    if is_azure_ml:
        with engine.connect() as conn:
            conn.execute(text("PRAGMA journal_mode=WAL;"))

    # Create the database tables if they do not exist.
    Base.metadata.create_all(bind=engine)

    # Return a session factory bound to the engine.
    return sessionmaker(bind=engine)
