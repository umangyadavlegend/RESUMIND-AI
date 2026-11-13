import os
import sys

# Compute directory paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

# Ensure backend directory is in sys.path so 'app' and its modules resolve
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Import the FastAPI ASGI application
from app.main import app

# Expose app for Vercel Serverless Python runtime
__all__ = ["app"]
