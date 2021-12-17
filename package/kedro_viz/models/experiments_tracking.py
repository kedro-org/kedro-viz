"""Data model to represent run data from a Kedro Session."""
# pylint: disable=too-few-public-methods,missing-class-docstring

from sqlalchemy import Column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy.types import JSON, Boolean, Integer, String

Base = declarative_base()


class RunModel(Base):
    """Data model to represent run data from a Kedro Session."""

    __tablename__ = "runs"

    id = Column(String, primary_key=True, index=True)
    blob = Column(JSON)

    class Config:
        orm_mode = True


class UserRunDetailsModel(Base):
    """Data model to represent run details as defined by users through Kedro Viz."""

    __tablename__ = "user_run_details"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    run_id = Column(String, ForeignKey(RunModel.id), unique=True)
    bookmark = Column(Boolean, default=False)
    title = Column(String)
    notes = Column(String)

    class Config:
        orm_mode = True
