from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class InteractionBase(BaseModel):
    date: str
    raw_text: str
    quality_score: int
    mood_score: Optional[int] = 3
    tags: Optional[str] = None

class InteractionCreate(InteractionBase):
    pass

class Interaction(InteractionBase):
    id: int
    person_id: int
    
    class Config:
        from_attributes = True

class PersonBase(BaseModel):
    name: str
    base_interval: Optional[int] = 30
    last_contact_date: Optional[date] = None
    birthday: Optional[date] = None
    affection_score: Optional[int] = 50
    group_name: Optional[str] = None
    tags: Optional[str] = None
    archive_mode: Optional[bool] = False
    preferences: Optional[str] = None
    similarities_and_differences: Optional[str] = None

class Person(PersonBase):
    id: int
    preferences_updated_at: Optional[datetime] = None
    similarities_updated_at: Optional[datetime] = None
    completeness_score: int
    needs_verification: Optional[str] = None
    interactions: List[Interaction] = []
    
    class Config:
        from_attributes = True
        
class DashboardResponse(BaseModel):
    upcoming_events: List[Person]
    needs_cultivation: List[Person]
