from typing import Optional, List, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ModelMetric
from ..schemas import RetrainResponse, ModelMetricItem
from ..ml.pipeline import train_and_evaluate_models

router = APIRouter(prefix="/api/ml", tags=["machine_learning"])


@router.post("/retrain", response_model=RetrainResponse)
def trigger_retraining(
    sector: Optional[str] = Query("ALL", description="Optional sector to retrain subset on demand (SRS FR-3.3)"),
    db: Session = Depends(get_db)
):
    """
    On-demand model retraining endpoint supporting per-sector subsets (SRS FR-3.3).
    """
    sector_val = getattr(sector, "default", sector)
    result = train_and_evaluate_models(db, sector_filter=sector_val)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return RetrainResponse(
        status="success",
        sector=str(sector_val or "ALL"),
        records_trained=result.get("records_trained", 0),
        metrics=result.get("ml_metrics", {}),
        message=f"Models successfully trained and evaluated for sector filter: '{sector_val}'."
    )


@router.get("/metrics", response_model=List[ModelMetricItem])
def get_metrics(
    sector: Optional[str] = Query("ALL"),
    db: Session = Depends(get_db)
):
    """
    Returns recorded evaluation metrics for ML models and baselines.
    """
    sector_val = getattr(sector, "default", sector)
    metrics = db.query(ModelMetric).filter(ModelMetric.sector_filter == sector_val).all()
    results = []
    for m_record in metrics:
        m: Any = m_record
        results.append(ModelMetricItem(
            model_name=m.model_name,
            model_type=m.model_type,
            target_variable=m.target_variable,
            r2_score=m.r2_score,
            rmse=m.rmse,
            mae=m.mae,
            mape=m.mape,
            accuracy=m.accuracy,
            precision=m.precision,
            recall=m.recall,
            f1_score=m.f1_score,
            training_samples=m.training_samples,
            test_samples=m.test_samples,
            notes=m.notes
        ))
    return results
