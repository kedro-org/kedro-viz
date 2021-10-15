from pathlib import Path
from kedro.framework.session.store import BaseSessionStore
from sqlalchemy.orm import Session
from kedro_viz.database import create_db_engine
from kedro_viz.models.session import KedroSession


def get_db(session_class):
    try:
        db = session_class()
        yield db
    finally:
        db.close()

class SessionStore(BaseSessionStore):
    """Stores the session data on disk using `shelve` package."""

    @property
    def location(self) -> Path:
        return Path(self._path).expanduser().resolve() / "session_store.db"


    def save(self):
        """Save the session store info on db ."""

        engine, session_class = create_db_engine(self.location)
        db = next(get_db(session_class))
        session_store_data = KedroSession(
            id=self._session_id,
            blob=f"{self}"
        )
        db.add(session_store_data)
        db.commit()
        
  
