"""Data model to represent Kedro Session.
Named KedroSession to avoid confusion with sqlalchemy Session
and fastapi Session.
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class KedroSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    blob = Column(String)

    class Config:
        orm_mode = True
