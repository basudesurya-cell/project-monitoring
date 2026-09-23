import json
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Project
from ..schemas import EarlyWarningProject
from ..services.schedule_delay import compute_schedule_delay_analysis
from ..services.problem_diagnostics import compute_problem_diagnostics

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=List[EarlyWarningProject])
def get_early_warning_alerts(
    min_risk_score: float = Query(50.0, ge=0.0, le=100.0),
    limit: int = Query(50, ge=1, le=200),
    sector: Optional[str] = None,
    risk_tier: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns early warning project alerts ranked by financial exposure (revised cost)
    adhering to SRS FR-6.1 and FR-6.2, enriched with automated problem diagnostics and multi-graph data.
    """
    score_val = getattr(min_risk_score, "default", min_risk_score)
    limit_val = getattr(limit, "default", limit)

    query = db.query(Project).filter(Project.risk_score >= score_val)

    if sector and sector != "ALL":
        query = query.filter(Project.sector == sector)

    if risk_tier and risk_tier != "ALL":
        query = query.filter(Project.risk_tier == risk_tier)

    # Rank by financial exposure (revised cost descending)
    flagged_projects = query.order_by(desc(Project.revised_cost)).limit(limit_val).all()

    results = []
    for p_record in flagged_projects:
        p: Any = p_record
        # Extract primary driver
        primary_driver = "Cumulative risk threshold exceeded."
        if p.shap_drivers:
            try:
                drivers_list = json.loads(str(p.shap_drivers))
                if drivers_list and len(drivers_list) > 0:
                    primary_driver = drivers_list[0].get("feature", drivers_list[0].get("explanation", primary_driver))
            except Exception:
                pass

        # Compute schedule delay analytics
        delay_info: Any = compute_schedule_delay_analysis(p)
        # Compute problem diagnostics
        diag_info: Any = compute_problem_diagnostics(p)

        results.append(EarlyWarningProject(
            project_id=p.project_id,
            project_name=p.project_name,
            ministry=p.ministry,
            sector=p.sector,
            revised_cost=p.revised_cost,
            cost_overrun_pct=p.cost_overrun_pct,
            delay_months=p.delay_months,
            risk_score=p.risk_score,
            risk_tier=p.risk_tier,
            primary_driver=primary_driver,
            confidence_level=p.confidence_level or "HIGH",
            is_confirmed_problem=bool(p.is_confirmed_problem),
            is_predictive_warning=bool(p.is_predictive_warning),
            risk_type_label=p.risk_type_label or "CONFIRMED_DEFICIT",
            project_status=p.project_status or "DELAYED",
            implementing_agency=p.implementing_agency,
            delay_days=delay_info["delay_days"],
            progress_gap=delay_info["progress_gap"],
            schedule_delay_severity=diag_info["severity"],
            schedule_delay_action=diag_info["recommended_action"],
            schedule_delay=delay_info,
            problem_type=p.problem_archetype or diag_info["problem_type"],
            problem_archetype=p.problem_archetype or diag_info["problem_type"],
            problem_title=p.problem_title or diag_info["problem_title"],
            problem_severity=p.problem_severity or diag_info["severity"],
            root_metrics_summary=p.root_metrics_summary or diag_info.get("root_metrics_summary"),
            planned_progress=p.planned_progress,
            progress_deficit_gap=p.progress_deficit_gap,
            financial_burn_pct=p.financial_burn_pct,
            row_land_acquisition_risk=p.row_land_acquisition_risk,
            environmental_clearances_risk=p.environmental_clearances_risk,
            utility_shifting_risk=p.utility_shifting_risk,
            contractor_solvency_risk=p.contractor_solvency_risk,
            contractual_arbitration_risk=p.contractual_arbitration_risk,
            mandated_action=p.mandated_action,
            prescriptive_recommendations=p.prescriptive_recommendations,
            delay_reasons=p.delay_reasons,
            diagnostics=diag_info
        ))

    return results
