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
