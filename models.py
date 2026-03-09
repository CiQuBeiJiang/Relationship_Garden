import os
import json
import math
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

Base = declarative_base()

class Person(Base):
    __tablename__ = 'people'

    id = Column(Integer, primary_key=True)
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
    def completeness_score(self):
        """Calculate profile completeness out of 100 with Exponential Decay on dynamic fields."""
        score = 0
        now = datetime.utcnow()
        lambda_decay = 0.001899 # Base e ~ halves every 365 days
        
        # 1. Static Traits (No Decay)
        if self.birthday: score += 20
        
        inter_len = len(self.interactions)
        if inter_len >= 2: score += 30
        elif inter_len == 1: score += 15
        
        # 2. Dynamic Traits (Exponential Decay)
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
    def needs_verification(self):
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
    __tablename__ = 'interactions'

    id = Column(Integer, primary_key=True)
    person_id = Column(Integer, ForeignKey('people.id'), nullable=False)
    date = Column(Date, nullable=False, default=datetime.utcnow().date)
    raw_text = Column(Text, nullable=False)
    quality_score = Column(Integer, nullable=False)
    tags = Column(Text, nullable=True)

    person = relationship("Person", back_populates="interactions")

def inject_seed_data(session):
    if session.query(Person).count() == 0:
        # Seed 1: Li Si with dynamically decaying timestamp (366 days ago)
        decayed_date = datetime.utcnow() - timedelta(days=366)
        
        seed_person = Person(
            name="李四（科协学弟）",
            base_interval=30,
            last_contact_date=datetime.now().date(),
            birthday=datetime.strptime("2005-10-12", "%Y-%m-%d").date(),
            
            # Dynamic traits pre-aged to trigger Low Confidence List
            preferences="喜欢钻研算法、对摄影感兴趣",
            preferences_updated_at=decayed_date,
            
            similarities_and_differences="都对数据科学感兴趣，但他偏爱后端，我偏爱全栈",
            similarities_updated_at=decayed_date,
            
            affection_score=90,
            group_name="校园科协",
            tags="潜质,内向,摄影",
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
        
        print("Injected Seed Data (with decayed timestamps) for 李四.")

def init_db(db_path='sqlite:///app.db'):
    db_file_path = db_path.replace('sqlite:///', '')
    if os.path.exists(db_file_path):
        os.remove(db_file_path)
        print(f"Deleted old database at {db_file_path} for clean V5 start.")
        
    engine = create_engine(db_path, echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    
    with Session() as session:
        inject_seed_data(session)
        
    return engine, Session

if __name__ == '__main__':
    # Test DB init
    init_db()
    print("Database initialized successfully.")
