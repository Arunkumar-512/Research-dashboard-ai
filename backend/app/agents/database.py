import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Neon connection string
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL not found in environment variables.\n"
        "Please add DATABASE_URL=postgresql://... to your .env file"
    )

# Configure engine for Neon
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "sslmode": "require",  # Neon requires SSL
    },
    echo=False,  # Set to True to see SQL queries
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=300,  # Recycle connections every 5 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class ResearchThread(Base):
    __tablename__ = "research_threads"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, nullable=False)
    report_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    """Initialize the database, creating all tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database connected successfully to Neon PostgreSQL")
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        print("\nTroubleshooting tips:")
        print("1. Check your DATABASE_URL in .env file")
        print("2. Make sure your Neon database is active")
        print("3. Verify your password is correct")
        print("4. Check if your IP is allowed in Neon settings")
        raise

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()