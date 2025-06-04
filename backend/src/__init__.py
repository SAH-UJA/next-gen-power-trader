from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import FastAPI
from pathlib import Path
from src.endpoints import ask, trade
import os

app = FastAPI(
    title="Trading API",
    description="API for trading operations and LLM interactions",
    version="1.0.0",
)

current_path = Path(__file__).resolve()
project_root = current_path.parent.parent.parent
frontend_build_path = project_root / "frontend" / "build"

app.mount(
    "/static",
    StaticFiles(directory=frontend_build_path / "static"),
    name="static"
)

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the endpoints
app.include_router(ask.router, prefix="/ask", tags=["Ask"])
app.include_router(trade.router, prefix="/trade", tags=["Trade"])

@app.get("/")
async def serve_react_app():
    index_path = os.path.join(frontend_build_path, "index.html")
    return FileResponse(index_path)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
