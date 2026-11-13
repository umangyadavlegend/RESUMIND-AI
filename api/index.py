import os
import sys

# Ensure api directory is at the head of sys.path so 'app' package resolves cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import the FastAPI ASGI application from app.main
from app.main import app

# Expose app for Vercel Serverless Python runtime
__all__ = ["app"]
