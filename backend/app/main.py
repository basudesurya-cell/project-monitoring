import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import engine, SessionLocal, Base
from .models import Project
from .routes import projects, alerts, analytics, ml, ingest, assistant, reports, auth

# Create all database tables
Base.metadata.create_all(bind=engine)

# Locate frontend/dist directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "frontend", "dist"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        count = db.query(Project).count()
        if count == 0:
            print("[PAIMANA Insight v2.0] Database empty, auto-seeding benchmark dataset...")
            from .services.seeder import generate_mospi_benchmark_dataset
            count = generate_mospi_benchmark_dataset(db)
        print(f"[PAIMANA Insight v2.0] Database initialized with {count} project records.")
    except Exception as e:
        print(f"[PAIMANA Insight v2.0] Startup error: {e}")
    finally:
        db.close()

    yield
    # Shutdown logic if needed


app = FastAPI(
    title="PAIMANA Insight API",
    description="Predictive Analytics & Decision-Support System for Infrastructure Project Monitoring (SIH26103 - SRS v2.0)",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite dev server and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(ml.router)
app.include_router(ingest.router)
app.include_router(assistant.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "SQLite",
        "version": "2.0.0"
    }


# Mount static assets if frontend is built
assets_dir = os.path.join(DIST_DIR, "assets")
if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/")
def root():
    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    return {
        "system": "PAIMANA Insight",
        "problem_statement": "SIH26103",
        "organization": "MoSPI DIID",
        "status": "online",
        "documentation": "/docs"
    }


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Guard: do not intercept API or documentation routes
    if full_path.startswith("api/") or full_path == "api":
        raise HTTPException(status_code=404, detail="API endpoint not found")

    # Serve static file from dist if it exists (e.g., favicon.ico, vite.svg)
    file_path = os.path.join(DIST_DIR, full_path)
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)

    # SPA fallback: return index.html for client-side navigation
    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)

    raise HTTPException(status_code=404, detail="Page not found")