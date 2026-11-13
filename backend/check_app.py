import os
print("Step 1: Setting env")
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
print("Step 2: importing Base, engine")
from app.core.database import Base, engine
print("Step 3: Base.metadata.create_all(bind=engine)")
Base.metadata.create_all(bind=engine)
print("Step 4: importing app")
from app.main import app
print("Step 5: App imported successfully!")
