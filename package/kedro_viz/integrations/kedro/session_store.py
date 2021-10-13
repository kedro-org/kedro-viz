from multiprocessing import Lock
from pathlib import Path
from typing import Any, Dict
from kedro_viz.database import create_db_engine
from kedro.framework.session.store import BaseSessionStore
from sqlalchemy.orm import Session
from kedro_viz.models.session import KedroSession, Base

def get_db():
    try:
        engine, session_class = create_db_engine()
        Base.metadata.create_all(bind=engine)
        db = session_class()
        yield db
    finally:
        db.close()

class SessionStore(BaseSessionStore):
    """Stores the session data on disk using `shelve` package."""

    @property
    def location(self) -> Path:
        return Path(self._path).expanduser().resolve() / "session_store.db"

    def save(self, db: Session = next(get_db())):
        """Save the session store info on db ."""

        session_store_data = KedroSession(
            id=self._session_id,
            blob=f"{self}"
        )
        
        db.add(session_store_data)
        db.commit()
