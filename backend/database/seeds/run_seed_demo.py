from database import database
from database.seeds.demo_seed import seed_demo_data

def main():
    db = database.SessionLocal()
    if not db.query(database.models.demos.Demo).first():
        seed_demo_data(db)
        print("Demo data seeded!")
    else:
        print("Demo data already exists, skipping seed.")
    db.close()

if __name__ == "__main__":
    main()
