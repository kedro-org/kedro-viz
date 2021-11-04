"""Data model to represent run data from a Kedro Session."""
# pylint: disable=too-few-public-methods

from sqlalchemy import Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.types import JSON

Base = declarative_base()


class RunModel(Base):
    """Data model to represent run data from a Kedro Session."""

    __tablename__ = "runs"

    id = Column(String, primary_key=True, index=True)
    blob = Column(JSON)

    class Config:
        """Supports data model to map to ORM objects"""

        orm_mode = True
