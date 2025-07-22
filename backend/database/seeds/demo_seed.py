from sqlalchemy.orm import Session
from database.models.demos import Demo

def seed_demo_data(db: Session):
    demos = [
        {"title": "Demo 1", "description": "Demo 1 description"},
        {"title": "Demo 2", "description": "Demo 2 description"},
        {"title": "Demo 3", "description": "Demo 3 description"}
    ]
    for d in demos:
        if not db.query(Demo).filter_by(title=d["title"]).first():
            db.add(Demo(**d))
    db.commit()
