"""
DEPRECATED: This monolithic entrypoint has been replaced by the modular architecture in backend/app/main.py.
For backward compatibility with any hardcoded imports, we alias the app here.

To run the application, please use:
uvicorn backend.app.main:app --reload
"""

from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
