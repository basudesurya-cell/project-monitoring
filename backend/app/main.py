from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SessionLocal, Base
from .models import Project
from .routes import projects, alerts, analytics, ml, ingest, assistant, reports, auth

# Create all database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        count = db.query(Project).count()
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

# Enable CORS for React frontend
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


@app.get("/")
def root():
    return {
        "system": "PAIMANA Insight",
        "problem_statement": "SIH26103",
        "organization": "MoSPI DIID",
        "status": "online",
        "documentation": "/docs"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "SQLite",
        "version": "1.0.0"
    }