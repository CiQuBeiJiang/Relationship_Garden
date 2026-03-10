from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

import models
import schemas

# Initialize DB
models.init_db()

app = FastAPI(title="Relationship Gardener API")

# Configure CORS for React/Vite (default port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Helpers ---
def is_birthday_upcoming(birthday: datetime.date, days_ahead=30) -> bool:
    if not birthday: return False
    today = datetime.now().date()
    try: closest_bday = birthday.replace(year=today.year)
    except ValueError: closest_bday = birthday.replace(year=today.year, month=3, day=1)
        
    if closest_bday < today:
        try: closest_bday = closest_bday.replace(year=today.year + 1)
        except ValueError: closest_bday = closest_bday.replace(year=today.year + 1, month=3, day=1)
             
    return 0 <= (closest_bday - today).days <= days_ahead

# --- API Routes ---

@app.get("/api/contacts", response_model=List[schemas.Person])
def get_contacts(db: Session = Depends(get_db)):
    """Retrieve all contacts to populate the Envelope Roster."""
    people = db.query(models.Person).all()
    return people

@app.get("/api/dashboard", response_model=schemas.DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    """Retrieve upcoming birthdays and contacts flagged by the Confidence Decay engine."""
    people = db.query(models.Person).all()
    
    upcoming_bdays = [p for p in people if is_birthday_upcoming(p.birthday)]
    upcoming_bdays.sort(key=lambda x: (x.birthday.replace(year=datetime.now().year) - datetime.now().date()).days % 365 if x.birthday else 999)
    
    decayed = [p for p in people if not p.archive_mode and p.needs_verification]
    
    return schemas.DashboardResponse(
        upcoming_events=upcoming_bdays,
        needs_cultivation=decayed
    )

@app.post("/api/contacts/{person_id}/verify")
def verify_contact(person_id: int, db: Session = Depends(get_db)):
    """Instantly refreshes the decaying timestamps of a contact."""
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    person.preferences_updated_at = datetime.utcnow()
    person.similarities_updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "message": f"Verified timestamps for {person.name}"}

@app.post("/api/contacts", response_model=schemas.Person)
def create_contact(contact: schemas.PersonBase, db: Session = Depends(get_db)):
    db_person = models.Person(**contact.model_dump())
    db_person.preferences_updated_at = datetime.utcnow()
    db_person.similarities_updated_at = datetime.utcnow()
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person

@app.delete("/api/contacts/{person_id}")
def delete_contact(person_id: int, db: Session = Depends(get_db)):
    """Permanently delete a contact and all their interactions."""
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    db.delete(person)
    db.commit()
    return {"status": "success", "message": f"Deleted contact {person_id}"}

@app.patch("/api/contacts/{person_id}", response_model=schemas.Person)
def update_contact(person_id: int, contact_update: dict, db: Session = Depends(get_db)):
    """Update contact attributes."""
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    for key, value in contact_update.items():
        if hasattr(person, key):
            setattr(person, key, value)
            
    # If dynamic text changed, update timestamps manually
    if "preferences" in contact_update:
        person.preferences_updated_at = datetime.utcnow()
    if "similarities_and_differences" in contact_update:
        person.similarities_updated_at = datetime.utcnow()
        
    db.commit()
    db.refresh(person)
    return person

@app.post("/api/interactions", response_model=schemas.Interaction)
def create_interaction(interaction: schemas.InteractionBase, person_id: int, db: Session = Depends(get_db)):
    db_int = models.Interaction(**interaction.model_dump(), person_id=person_id)
    db.add(db_int)
    
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if person:
        interaction_date_obj = datetime.strptime(interaction.date, "%Y-%m-%d").date()
        if not person.last_contact_date or interaction_date_obj > person.last_contact_date:
            person.last_contact_date = interaction_date_obj

    db.commit()
    db.refresh(db_int)
    return db_int
