from typing import Optional, List, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, case
from ..database import get_db
from ..models import Project
from ..schemas import (
    ProjectResponse,
    PaginatedProjectsResponse,
    PortfolioSummaryResponse,
    SectorSummary,
    MinistrySummary,
    PeerBenchmarkResponse,
    DescriptiveStatisticsResponse,
    ScheduleDelayAnalysis,
    ProblemDiagnosticsResponse,
    StateSummaryResponse
)
from ..services.benchmarking import compute_peer_benchmark
from ..services.statistics import compute_portfolio_descriptive_statistics
from ..services.schedule_delay import compute_schedule_delay_analysis
from ..services.problem_diagnostics import compute_problem_diagnostics

router = APIRouter(prefix="/api/projects", tags=["projects"])


# ── State-name normalisation map ──────────────────────────────────────
_STATE_ALIASES: dict[str, str] = {
    "ap": "Andhra Pradesh", "andhra": "Andhra Pradesh",
    "ar": "Arunachal Pradesh", "arunachal": "Arunachal Pradesh",
    "as": "Assam",
    "br": "Bihar",
    "cg": "Chhattisgarh", "chattisgarh": "Chhattisgarh",
    "ga": "Goa",
    "gj": "Gujarat",
    "hr": "Haryana",
    "hp": "Himachal Pradesh", "himachal": "Himachal Pradesh",
    "jh": "Jharkhand",
    "ka": "Karnataka",
    "kl": "Kerala",
    "mp": "Madhya Pradesh",
    "mh": "Maharashtra",
    "mn": "Manipur",
    "ml": "Meghalaya",
    "mz": "Mizoram",
    "nl": "Nagaland",
    "or": "Odisha", "orissa": "Odisha",
    "pb": "Punjab",
    "rj": "Rajasthan",
    "sk": "Sikkim",
    "tn": "Tamil Nadu", "tamilnadu": "Tamil Nadu",
    "ts": "Telangana",
    "tr": "Tripura",
    "up": "Uttar Pradesh",
    "uk": "Uttarakhand", "uttaranchal": "Uttarakhand",
    "wb": "West Bengal", "w.b.": "West Bengal", "west bengal": "West Bengal",
    "dl": "Delhi", "new delhi": "Delhi",
    "jk": "Jammu & Kashmir", "j&k": "Jammu & Kashmir", "jammu and kashmir": "Jammu & Kashmir",
    "la": "Ladakh",
    "ch": "Chandigarh",
    "dn": "Dadra & Nagar Haveli and Daman & Diu",
    "dd": "Dadra & Nagar Haveli and Daman & Diu",
    "py": "Puducherry", "pondicherry": "Puducherry",
    "lk": "Lakshadweep",
    "an": "Andaman & Nicobar Islands", "andaman": "Andaman & Nicobar Islands",
}


def _normalise_state(raw: str | None) -> str | None:
    """Return a canonical state name, or None if unresolvable."""
    if not raw:
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    key = cleaned.lower()
    if key in _STATE_ALIASES:
        return _STATE_ALIASES[key]
    # Title-case it as-is (already a full name)
    return cleaned.title()


@router.get("/state-summary", response_model=List[StateSummaryResponse])
def get_state_summary(db: Session = Depends(get_db)):
    """
    Returns per-state aggregated project counts broken down by
    active / completed / delayed status for the geospatial map.
    """
    rows = db.query(
        Project.state_location,
        func.count(Project.id).label("total"),
        func.sum(case(
            (Project.project_status.in_(["ONGOING_ON_TRACK", "AHEAD_OF_SCHEDULE"]), 1),
            else_=0
        )).label("active"),
        func.sum(case(
            (Project.physical_progress >= 99.0, 1),
            else_=0
        )).label("completed"),
        func.sum(case(
            (Project.project_status.in_(["DELAYED", "CRITICAL_WATCHLIST"]), 1),
            else_=0
        )).label("delayed"),
    ).filter(
        Project.state_location.isnot(None),
        Project.state_location != ""
    ).group_by(Project.state_location).all()

    # Aggregate rows that normalise to the same state name
    merged: dict[str, dict] = {}
    for raw_state, total, active, completed, delayed in rows:
        name = _normalise_state(raw_state)
        if not name:
            continue
        if name not in merged:
            merged[name] = {"total": 0, "active": 0, "completed": 0, "delayed": 0}
        merged[name]["total"] += total
        merged[name]["active"] += int(active or 0)
        merged[name]["completed"] += int(completed or 0)
        merged[name]["delayed"] += int(delayed or 0)

    return [
        StateSummaryResponse(
            state=state,
            total_projects=vals["total"],
            active_projects=vals["active"],
            completed_projects=vals["completed"],
            delayed_projects=vals["delayed"],
        )
        for state, vals in sorted(merged.items())
    ]


@router.get("/statistics", response_model=DescriptiveStatisticsResponse)
def get_portfolio_statistics(
    sector: Optional[str] = None,
    ministry: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Fulfills SRS v2.0 Section 4.2 (FR-2.1 - FR-2.4):
    Returns descriptive statistical profiling for cost, expenditure, progress,
    and overrun distributions.
    """
    return compute_portfolio_descriptive_statistics(db, sector, ministry)


@router.get("/summary", response_model=PortfolioSummaryResponse)
def get_portfolio_summary(db: Session = Depends(get_db)):
    """
    Returns executive portfolio overview statistics (SRS FR-9.1).
    """
    total_projects = db.query(Project).count()
    if total_projects == 0:
        return PortfolioSummaryResponse(
            total_projects=0,
            total_original_cost=0.0,
            total_revised_cost=0.0,
            total_expenditure=0.0,
            total_cost_escalation=0.0,
            avg_cost_overrun_pct=0.0,
            avg_delay_months=0.0,
            critical_risk_count=0,
            high_risk_count=0,
            medium_risk_count=0,
            low_risk_count=0,
            sectors=[],
            top_ministries=[],
            provenance_breakdown={}
        )

    # Aggregations
    totals: Any = db.query(
        func.sum(Project.original_cost),
        func.sum(Project.revised_cost),
        func.sum(Project.cumulative_expenditure),
        func.avg(Project.cost_overrun_pct),
        func.avg(Project.delay_months)
    ).first() or (0.0, 0.0, 0.0, 0.0, 0.0)

    total_orig = round(totals[0] or 0.0, 2)
    total_rev = round(totals[1] or 0.0, 2)
    total_exp = round(totals[2] or 0.0, 2)
    total_escalation = round(max(0.0, total_rev - total_orig), 2)
    avg_overrun = round(totals[3] or 0.0, 2)
    avg_delay = round(totals[4] or 0.0, 1)

    # Risk tiers count
    crit_count = db.query(Project).filter(Project.risk_tier == "CRITICAL").count()
    high_count = db.query(Project).filter(Project.risk_tier == "HIGH").count()
    med_count = db.query(Project).filter(Project.risk_tier == "MEDIUM").count()
    low_count = db.query(Project).filter(Project.risk_tier == "LOW").count()

    # Sector Breakdown
    sector_rows = db.query(
        Project.sector,
        func.count(Project.id),
        func.sum(Project.revised_cost),
        func.avg(Project.cost_overrun_pct),
        func.avg(Project.delay_months),
        func.avg(Project.risk_score)
    ).group_by(Project.sector).order_by(desc(func.count(Project.id))).all()

    sectors = [
        SectorSummary(
            sector=row[0],
            project_count=row[1],
            total_revised_cost=round(row[2] or 0.0, 2),
            avg_cost_overrun_pct=round(row[3] or 0.0, 2),
            avg_delay_months=round(row[4] or 0.0, 1),
            avg_risk_score=round(row[5] or 0.0, 1)
        )
        for row in sector_rows
    ]

    # Ministry Breakdown
    min_rows = db.query(
        Project.ministry,
        func.count(Project.id),
        func.sum(Project.revised_cost)
    ).group_by(Project.ministry).order_by(desc(func.sum(Project.revised_cost))).limit(10).all()

    top_ministries = []
    for row in min_rows:
        c_count = db.query(Project).filter(
            Project.ministry == row[0],
            Project.risk_tier == "CRITICAL"
        ).count()
        top_ministries.append(MinistrySummary(
            ministry=row[0],
            project_count=row[1],
            total_revised_cost=round(row[2] or 0.0, 2),
            critical_count=c_count
        ))

    # Provenance counts
    prov_rows = db.query(Project.data_provenance, func.count(Project.id)).group_by(Project.data_provenance).all()
    provenance_map = {row[0]: row[1] for row in prov_rows}

    return PortfolioSummaryResponse(
        total_projects=total_projects,
        total_original_cost=total_orig,
        total_revised_cost=total_rev,
        total_expenditure=total_exp,
        total_cost_escalation=total_escalation,
        avg_cost_overrun_pct=avg_overrun,
        avg_delay_months=avg_delay,
        critical_risk_count=crit_count,
        high_risk_count=high_count,
        medium_risk_count=med_count,
        low_risk_count=low_count,
        sectors=sectors,
        top_ministries=top_ministries,
        provenance_breakdown=provenance_map
    )


@router.get("", response_model=PaginatedProjectsResponse)
def list_projects(
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=5, le=200),
    search: Optional[str] = None,
    ministry: Optional[str] = None,
    sector: Optional[str] = None,
    risk_tier: Optional[str] = None,
    status: Optional[str] = None,
    risk_type: Optional[str] = None,
    sort_by: Optional[str] = "risk_score",
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db)
):
    """
    Returns filtered and paginated project records (SRS v2.0 FR-1.2, FR-8.3, FR-9.2, FR-9.3).
    Supports status lifecycle filtering and confirmed vs predictive problem types.
    """
    query = db.query(Project)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(
            Project.project_id.ilike(s),
            Project.project_name.ilike(s),
            Project.implementing_agency.ilike(s),
            Project.state_location.ilike(s)
        ))

    if ministry and ministry != "ALL":
        query = query.filter(Project.ministry == ministry)

    if sector and sector != "ALL":
        query = query.filter(Project.sector == sector)

    if risk_tier and risk_tier != "ALL":
        query = query.filter(Project.risk_tier == risk_tier.upper())

    if status and status != "ALL":
        query = query.filter(Project.project_status == status.upper())

    if risk_type and risk_type != "ALL":
        if risk_type.upper() == "CONFIRMED":
            query = query.filter(Project.is_confirmed_problem == True)
        elif risk_type.upper() == "PREDICTIVE":
            query = query.filter(Project.is_predictive_warning == True)
        elif risk_type.upper() in ("CRITICAL_EARLY_WARNING", "CRITICAL_WARNING"):
            query = query.filter(Project.risk_score >= 75.0)

    # Sorting
    field_name = sort_by or "risk_score"
    sort_column = getattr(Project, field_name, Project.risk_score)
    order_val = (sort_order or "desc").lower()
    if order_val == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    page_val = getattr(page, "default", page)
    per_page_val = getattr(per_page, "default", per_page)

    total = query.count()
    items_list: Any = query.offset((page_val - 1) * per_page_val).limit(per_page_val).all()
    total_pages = (total + per_page_val - 1) // per_page_val if per_page_val > 0 else 1

    return PaginatedProjectsResponse(
        items=items_list,
        total=total,
        page=page_val,
        per_page=per_page_val,
        total_pages=total_pages
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_details(project_id: str, db: Session = Depends(get_db)):
    """
    Returns full CUF details and SHAP driver analysis for a single project (SRS FR-9.2).
    """
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        # Fallback to integer primary key check
        try:
            p_id = int(project_id)
            project = db.query(Project).filter(Project.id == p_id).first()
        except ValueError:
            pass

    if not project:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found.")

    resp: Any = ProjectResponse.model_validate(project)
    resp.diagnostics = compute_problem_diagnostics(project)
    resp.schedule_delay = compute_schedule_delay_analysis(project)
    return resp


@router.get("/{project_id}/diagnostics", response_model=ProblemDiagnosticsResponse)
def get_project_diagnostics(project_id: str, db: Session = Depends(get_db)):
    """
    Returns problem-specific diagnostics, problem classification, and multi-graph datasets
    (Budget Waterfall, Burn vs Progress Decoupling, Progress S-Curve, Milestone Slippage, Bottleneck Attribution).
    """
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        try:
            p_id = int(project_id)
            project = db.query(Project).filter(Project.id == p_id).first()
        except ValueError:
            pass

    if not project:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found.")

    return compute_problem_diagnostics(project)


@router.get("/{project_id}/schedule-delay", response_model=ScheduleDelayAnalysis)
def get_project_schedule_delay(project_id: str, db: Session = Depends(get_db)):
    """
    Returns automated Schedule Delay detection, Delay Days, Progress Gap,
    severity, recommended action, and Planned vs Actual Progress trajectory.
    """
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        try:
            p_id = int(project_id)
            project = db.query(Project).filter(Project.id == p_id).first()
        except ValueError:
            pass

    if not project:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found.")

    return compute_schedule_delay_analysis(project)


@router.get("/{project_id}/benchmark", response_model=PeerBenchmarkResponse)
def get_project_benchmark(project_id: str, db: Session = Depends(get_db)):
    """
    Returns peer benchmark comparison against sector and cost band (SRS FR-7.1).
    """
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        try:
            p_id = int(project_id)
            project = db.query(Project).filter(Project.id == p_id).first()
        except ValueError:
            pass

    if not project:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found.")

    return compute_peer_benchmark(project, db)

