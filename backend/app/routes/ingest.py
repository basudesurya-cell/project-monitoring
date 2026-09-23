import io
import pandas as pd
from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Project, DataQualityLog
from ..schemas import IngestResponse
from ..services.ingestion import ingest_records_from_df
from ..services.seeder import generate_mospi_benchmark_dataset
from ..ml.pipeline import train_and_evaluate_models

router = APIRouter(prefix="/api/ingest", tags=["ingestion"])


@router.post("/upload", response_model=IngestResponse)
async def upload_dataset_file(
    file: UploadFile = File(...),
    provenance: str = Query("REAL", description="Provenance tag per Constraint C-2 (REAL, SYNTHETIC, etc.)"),
    retrain_after: bool = Query(True, description="Automatically retrain ML models on new data"),
    db: Session = Depends(get_db)
):
    """
    Accepts CSV or JSON dataset files, normalizes CUF fields, computes labels,
    logs anomalies, and persists records into database (SRS FR-1.1 - FR-1.4).
    """
    filename = (file.filename or "").lower()
    content = await file.read()

    try:
        if filename.endswith(".csv") or filename.endswith(".txt"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(content))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, Excel, or JSON.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file contains no records.")

    result = ingest_records_from_df(df, db, provenance=provenance)

    if retrain_after and db.query(Project).count() >= 30:
        try:
            train_and_evaluate_models(db, "ALL")
        except Exception:
            pass

    return IngestResponse(
        status="success",
        records_processed=result["processed"],
        records_inserted=result["inserted_or_updated"],
        records_flagged_anomalies=result["anomalies_flagged"],
        message=f"Successfully ingested {result['processed']} records with provenance '{provenance}'."
    )


@router.post("/reseed", response_model=IngestResponse)
def reseed_baseline_dataset(db: Session = Depends(get_db)):
    """
    Re-generates and seeds the official MoSPI April 2026 baseline dataset (~1,981 projects).
    """
    count = generate_mospi_benchmark_dataset(db, target_count=1981)
    train_and_evaluate_models(db, "ALL")

    return IngestResponse(
        status="success",
        records_processed=count,
        records_inserted=count,
        records_flagged_anomalies=0,
        message=f"Successfully seeded {count} MoSPI April 2026 benchmark projects and trained ML models."
    )


@router.get("/quality-logs")
def get_data_quality_logs(
    limit: int = Query(50, ge=5, le=200),
    db: Session = Depends(get_db)
):
    """
    Returns data quality anomaly logs (SRS FR-1.3).
    """
    logs = db.query(DataQualityLog).order_by(desc(DataQualityLog.logged_at)).limit(limit).all()
    results = []
    for log_rec in logs:
        log: Any = log_rec
        results.append({
            "id": log.id,
            "project_id": log.project_id,
            "issue_type": log.issue_type,
            "description": log.description,
            "field_name": log.field_name,
            "raw_value": log.raw_value,
            "logged_at": log.logged_at.isoformat() if log.logged_at else None
        })
    return results
