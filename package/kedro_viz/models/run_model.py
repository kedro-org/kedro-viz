"""Data model to represent run data from a Kedro Session.
Named RunModel to avoid confusion with sqlalchemy Session
and fastapi Session.
"""
# pylint: disable=missing-class-docstring
# pylint: disable=too-few-public-methods

from sqlalchemy import Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.types import JSON

Base = declarative_base()


class RunModel(Base):
    __tablename__ = "runs"

    id = Column(String, primary_key=True, index=True)
    blob = Column(JSON)

    class Config:
        orm_mode = True
