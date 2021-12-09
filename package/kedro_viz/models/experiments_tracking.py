"""Data model to represent run data from a Kedro Session."""
# pylint: disable=too-few-public-methods

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
        """Supports data model to map to ORM objects"""

        orm_mode = True


class UserDetailsModel(Base):
    """Data model to represent user details data specified in a Kedro Viz Session."""

    __tablename__ = "user_details"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    run_id = Column(String, ForeignKey(RunModel.id), unique=True)
    bookmark = Column(Boolean, default=False)
    title = Column(String)
    notes = Column(String)

    class Config:
        """Supports data model to map to ORM objects"""

        orm_mode = True
