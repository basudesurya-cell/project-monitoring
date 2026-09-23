import io
import csv
import json
from typing import Optional, Any
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Project

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/export-projects")
def export_projects_report(
    format: str = Query("csv", pattern="^(csv|json)$"),
    sector: Optional[str] = None,
    ministry: Optional[str] = None,
    status: Optional[str] = None,
    risk_tier: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Fulfills SRS v2.0 Section 4.13 (FR-13.2):
    Exports filtered project-monitoring and risk records to CSV or JSON format.
    """
    query = db.query(Project)
    if sector and sector != "ALL":
        query = query.filter(Project.sector == sector)
    if ministry and ministry != "ALL":
        query = query.filter(Project.ministry == ministry)
    if status and status != "ALL":
        query = query.filter(Project.project_status == status)
    if risk_tier and risk_tier != "ALL":
        query = query.filter(Project.risk_tier == risk_tier)

    projects = query.all()

    if format == "json":
        data = [
            {
                "project_id": p.project_id,
                "project_name": p.project_name,
                "ministry": p.ministry,
                "sector": p.sector,
                "implementing_agency": p.implementing_agency,
                "state_location": p.state_location,
                "original_cost_cr": p.original_cost,
                "revised_cost_cr": p.revised_cost,
                "cost_overrun_pct": p.cost_overrun_pct,
                "cumulative_expenditure_cr": p.cumulative_expenditure,
                "original_doc": p.original_doc,
                "revised_doc": p.revised_doc,
                "delay_months": p.delay_months,
                "physical_progress_pct": p.physical_progress,
                "project_status": p.project_status,
                "risk_score": p.risk_score,
                "risk_tier": p.risk_tier,
                "is_confirmed_problem": p.is_confirmed_problem,
                "is_predictive_warning": p.is_predictive_warning,
                "confidence_level": p.confidence_level,
                "data_provenance": p.data_provenance
            }
            for p in projects
        ]
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=paimana_portfolio_report.json"}
        )

    # CSV Generation
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Project ID", "Project Name", "Ministry", "Sector", "Agency", "State",
        "Original Cost (₹ Cr)", "Revised Cost (₹ Cr)", "Cost Overrun (%)",
        "Expenditure (₹ Cr)", "Original DOC", "Revised DOC", "Delay (Months)",
        "Progress (%)", "Project Status", "Risk Score (0-100)", "Risk Tier",
        "Confirmed Deficit", "Predictive Signal", "Confidence", "Provenance"
    ])

    for p_record in projects:
        p: Any = p_record
        writer.writerow([
            p.project_id,
            p.project_name,
            p.ministry,
            p.sector,
            p.implementing_agency or "",
            p.state_location or "",
            p.original_cost,
            p.revised_cost,
            p.cost_overrun_pct,
            p.cumulative_expenditure,
            p.original_doc or "",
            p.revised_doc or "",
            p.delay_months,
            p.physical_progress,
            p.project_status,
            p.risk_score,
            p.risk_tier,
            "YES" if p.is_confirmed_problem else "NO",
            "YES" if p.is_predictive_warning else "NO",
            p.confidence_level,
            p.data_provenance
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=paimana_portfolio_report.csv"}
    )


@router.get("/export-alerts")
def export_alerts_report(
    min_risk_score: float = Query(50.0),
    db: Session = Depends(get_db)
):
    """
    Fulfills SRS v2.0 Section 4.13 (FR-13.2):
    Exports early warning intervention candidates ranked by financial exposure to CSV.
    """
    score_val = getattr(min_risk_score, "default", min_risk_score)
    alerts = db.query(Project).filter(Project.risk_score >= score_val).order_by(Project.revised_cost.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Priority Rank", "Project ID", "Project Name", "Ministry", "Sector",
        "Financial Exposure (Revised Cost ₹ Cr)", "Original Cost (₹ Cr)", "Cost Overrun (%)",
        "Schedule Delay (Months)", "Risk Score (0-100)", "Risk Tier",
        "Risk Nature", "Confidence Level", "Status"
    ])

    for idx, p_item in enumerate(alerts, 1):
        p: Any = p_item
        nature = "CONFIRMED PROBLEM" if p.is_confirmed_problem else "PREDICTIVE EARLY WARNING"
        writer.writerow([
            idx,
            p.project_id,
            p.project_name,
            p.ministry,
            p.sector,
            p.revised_cost,
            p.original_cost,
            p.cost_overrun_pct,
            p.delay_months,
            p.risk_score,
            p.risk_tier,
            nature,
            p.confidence_level,
            p.project_status
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=paimana_early_warning_alerts.csv"}
    )
