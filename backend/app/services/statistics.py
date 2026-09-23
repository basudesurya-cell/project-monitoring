import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models import Project


def calculate_distribution_metric(series: pd.Series) -> Dict[str, float]:
    """Computes descriptive statistical distribution metrics (mean, median, std, quartiles)."""
    if series.empty:
        return {
            "count": 0, "mean": 0.0, "median": 0.0, "std": 0.0,
            "min": 0.0, "max": 0.0, "p25": 0.0, "p75": 0.0, "iqr": 0.0
        }

    clean = series.dropna()
    p25 = float(clean.quantile(0.25))
    p75 = float(clean.quantile(0.75))

    return {
        "count": int(clean.count()),
        "mean": round(float(clean.mean()), 2),
        "median": round(float(clean.median()), 2),
        "std": round(float(clean.std()), 2) if len(clean) > 1 else 0.0,
        "min": round(float(clean.min()), 2),
        "max": round(float(clean.max()), 2),
        "p25": round(p25, 2),
        "p75": round(p75, 2),
        "iqr": round(p75 - p25, 2)
    }


def compute_portfolio_descriptive_statistics(
    session: Session,
    sector_filter: Optional[str] = None,
    ministry_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fulfills SRS v2.0 Section 4.2 (FR-2.1 - FR-2.4):
    Computes rigorous descriptive statistics for cost, expenditure, progress,
    and overrun distributions across the portfolio and specific sectors.
    """
    query = session.query(Project)
    if sector_filter and sector_filter != "ALL":
        query = query.filter(Project.sector == sector_filter)
    if ministry_filter and ministry_filter != "ALL":
        query = query.filter(Project.ministry == ministry_filter)

    projects = query.all()
    if not projects:
        return {"total_projects": 0, "metrics": {}, "distributions": {}}

    data = [{
        "original_cost": p.original_cost,
        "revised_cost": p.revised_cost,
        "cumulative_expenditure": p.cumulative_expenditure,
        "physical_progress": p.physical_progress,
        "cost_overrun_pct": p.cost_overrun_pct,
        "delay_months": p.delay_months,
        "risk_score": p.risk_score,
        "status": p.project_status or "ONGOING_ON_TRACK",
        "is_confirmed": p.is_confirmed_problem,
        "is_predictive": p.is_predictive_warning
    } for p in projects]

    df = pd.DataFrame(data)

    metrics = {
        "original_cost": calculate_distribution_metric(df["original_cost"]),
        "revised_cost": calculate_distribution_metric(df["revised_cost"]),
        "cumulative_expenditure": calculate_distribution_metric(df["cumulative_expenditure"]),
        "physical_progress": calculate_distribution_metric(df["physical_progress"]),
        "cost_overrun_pct": calculate_distribution_metric(df["cost_overrun_pct"]),
        "delay_months": calculate_distribution_metric(df["delay_months"]),
        "risk_score": calculate_distribution_metric(df["risk_score"]),
    }

    # Status breakdown
    status_counts = df["status"].value_counts().to_dict()

    # Confirmed vs Predictive (FR-5.3 & NFR-9)
    confirmed_count = int(df["is_confirmed"].sum())
    predictive_warning_count = int(df["is_predictive"].sum())

    return {
        "total_projects": len(df),
        "scope": f"Sector: {sector_filter or 'ALL'} | Ministry: {ministry_filter or 'ALL'}",
        "metrics": metrics,
        "status_distribution": status_counts,
        "confirmed_problem_count": confirmed_count,
        "predictive_warning_count": predictive_warning_count,
        "interpretation": (
            f"Of {len(df)} monitored projects, {confirmed_count} have confirmed active overrun/delay, "
            f"while {predictive_warning_count} are currently active/on-track on paper but exhibit elevated "
            "model-based predictive risk signals requiring preventive management."
        )
    }
