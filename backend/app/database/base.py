from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models so Alembic can discover metadata from a single Base object.
from app.database import models as _models  # noqa: E402,F401
