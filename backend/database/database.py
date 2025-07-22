from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config.settings import settings

DATABASE_URL = settings.DATABASE_URL

# Create the database engine (establish connection with the database)
engine = create_engine(DATABASE_URL, echo=True, future=True)

# Create a session factory (create local sessions for CRUD operations)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Export Base for easy import elsewhere
from database.models.base import Base