import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402


app.mount(
    "/",
    StaticFiles(
        directory=ROOT_DIR / "frontend" / "web-build",
        html=True,
        check_dir=False,
    ),
    name="web",
)
