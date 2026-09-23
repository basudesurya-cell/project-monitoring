import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import engine, SessionLocal, Base
from backend.app.models import Project, DataQualityLog, ModelMetric
from backend.app.services.seeder import generate_mospi_benchmark_dataset
from backend.app.ml.pipeline import train_and_evaluate_models

def main():
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables with updated SRS v2.0 schema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding 1,981 projects with SRS v2.0 fields...")
        count = generate_mospi_benchmark_dataset(db, target_count=1981)
        print(f"Successfully seeded {count} projects.")

        print("Training ML models and baselines...")
        metrics = train_and_evaluate_models(db, "ALL")
        print("ML training results:", metrics)

        # Verification query
        p = db.query(Project).first()
        print(f"Sample Project: ID={p.project_id}, Status={p.project_status}, Confirmed={p.is_confirmed_problem}, Predictive={p.is_predictive_warning}, Confidence={p.confidence_level}")
        
        status_counts = db.query(Project.project_status, Project.is_confirmed_problem, Project.is_predictive_warning).limit(10).all()
        print(f"Sample 10 projects status breakdown: {status_counts}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
