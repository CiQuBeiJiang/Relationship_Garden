import os
import json
import math
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

Base = declarative_base()

class Person(Base):
    __tablename__ = 'people'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    base_interval = Column(Integer, default=30)
    last_contact_date = Column(Date, nullable=True)
    
    # V2 & V4 Fields
    birthday = Column(Date, nullable=True)
    affection_score = Column(Integer, default=50) # Range 0-100
    group_name = Column(String, nullable=True)
    tags = Column(Text, nullable=True)
    archive_mode = Column(Boolean, default=False)

    # Dynamic Profile Traits
    preferences = Column(Text, nullable=True)
    preferences_updated_at = Column(DateTime, nullable=True, default=datetime.utcnow)
    
    similarities_and_differences = Column(Text, nullable=True)
    similarities_updated_at = Column(DateTime, nullable=True, default=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="person", cascade="all, delete-orphan")
    
    @property
    def completeness_score(self) -> int:
        """Calculate profile completeness out of 100 with Exponential Decay."""
        score = 0.0
        now = datetime.utcnow()
        lambda_decay = 0.001899 # Base e ~ halves every 365 days
        
        # 1. Static Traits
        if self.birthday: score += 20
        
        inter_len = len(self.interactions)
        if inter_len >= 2: score += 30
        elif inter_len == 1: score += 15
        
        # 2. Dynamic Traits
        if self.preferences and self.preferences.strip() and self.preferences_updated_at:
            days_passed = (now - self.preferences_updated_at).days
            decayed = 20 * math.exp(-lambda_decay * max(0, days_passed))
            score += decayed
            
        if self.similarities_and_differences and self.similarities_and_differences.strip() and self.similarities_updated_at:
            days_passed = (now - self.similarities_updated_at).days
            decayed = 30 * math.exp(-lambda_decay * max(0, days_passed))
            score += decayed
            
        return int(min(math.ceil(score), 100))
        
    @property
    def needs_verification(self) -> str | None:
        """Flag true if dynamic profile traits are decaying significantly (> 365 days old)."""
        now = datetime.utcnow()
        if self.preferences and self.preferences_updated_at:
            if (now - self.preferences_updated_at).days > 365:
                return 'preferences'
        if self.similarities_and_differences and self.similarities_updated_at:
            if (now - self.similarities_updated_at).days > 365:
                return 'similarities_and_differences'
        return None

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("people.id"))
    date = Column(String) # YYYY-MM-DD
    raw_text = Column(Text)
    quality_score = Column(Integer) # 1-100
    mood_score = Column(Integer, default=3) # 1-4
    tags = Column(String, nullable=True) # comma separated

    person = relationship("Person", back_populates="interactions")

def inject_seed_data(session):
    """Seed DB with an artificially aged profile for dashboard verification testing."""
    if session.query(Person).count() == 0:
        decayed_date = datetime.utcnow() - timedelta(days=366)
        
        seed_person = Person(
            name="李四（科协学弟）",
            base_interval=30,
            last_contact_date=datetime.now().date(),
            birthday=datetime.strptime("2005-10-12", "%Y-%m-%d").date(),
            preferences="喜欢钻研算法、对摄影感兴趣",
            preferences_updated_at=decayed_date,
            similarities_and_differences="都对数据科学感兴趣，但他偏爱后端，我偏爱全栈",
            similarities_updated_at=decayed_date,
            affection_score=90,
            group_name="校园科协",
            tags="Flower,潜质,内向,摄影",
            archive_mode=False
        )
        session.add(seed_person)
        session.commit()
        
        seed_interaction = Interaction(
            person_id=seed_person.id,
            date=datetime.now().date(),
            raw_text="开学季招新时聊了很久，潜力很大",
            quality_score=5,
            tags=json.dumps(["开学季", "算法", "招新"])
        )
        session.add(seed_interaction)
        session.commit()
        print("Backend DB: Injected Seed Data for 李四.")

# Configure DB
DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Only recreate for this test scenario if it doesn't exist to ensure tests work
    if not os.path.exists("./app.db"):
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as session:
            inject_seed_data(session)
    else:
        # For this setup task, let's force a wipe to ensure clean state with the new backend
        os.remove("./app.db")
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as session:
            inject_seed_data(session)

if __name__ == "__main__":
    init_db()
