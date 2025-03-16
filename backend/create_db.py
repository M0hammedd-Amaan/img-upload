from app import app, db
from models import User, Image

with app.app_context():
    db.drop_all()     # 🔥 Drops all existing tables (careful!)
    db.create_all()   # Creates new tables

    print("✅ Database tables created!")
