import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
import sqlite3
from app.core.database import Base, engine
import app.models

print("Ensuring tables created via Base.metadata.create_all(bind=engine)...")
Base.metadata.create_all(bind=engine)

# Add missing columns to users table if they don't exist
db_path = "resumind.db"
if os.path.exists(db_path):
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    columns = [col[1] for col in cur.execute("PRAGMA table_info(users)").fetchall()]
    print("Existing columns in users table:", columns)
    
    if "is_verified" not in columns:
        print("Adding is_verified column...")
        cur.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
    if "verification_code" not in columns:
        print("Adding verification_code column...")
        cur.execute("ALTER TABLE users ADD COLUMN verification_code VARCHAR(50)")
    if "verification_code_expires_at" not in columns:
        print("Adding verification_code_expires_at column...")
        cur.execute("ALTER TABLE users ADD COLUMN verification_code_expires_at DATETIME")
    
    con.commit()
    con.close()
    print("Database schema migration completed successfully!")
