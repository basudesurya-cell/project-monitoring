from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Project


def get_cost_band(cost: float) -> str:
    if cost < 500.0:
        return "₹150 Cr - ₹500 Cr (Small)"
    elif cost < 2000.0:
        return "₹500 Cr - ₹2,000 Cr (Medium)"
    elif cost < 5000.0:
        return "₹2,000 Cr - ₹5,000 Cr (Large)"
    else:
        return "> ₹5,000 Cr (Mega Projects)"


def compute_peer_benchmark(project: Project, session: Session) -> dict:
    """
    Benchmarks a project's cost, time, and progress trajectory against
    peer projects in the same sector and cost band (SRS FR-7.1).
    """
    cost_band = get_cost_band(project.revised_cost)

    # Sector aggregate statistics
    sector_peers = session.query(Project).filter(Project.sector == project.sector).all()

    if not sector_peers:
        return {
            "project_id": project.project_id,
            "project_name": project.project_name,
            "sector": project.sector,
            "cost_band": cost_band,
            "project_cost_overrun_pct": project.cost_overrun_pct,
            "sector_avg_cost_overrun_pct": project.cost_overrun_pct,
            "project_delay_months": project.delay_months,
            "sector_avg_delay_months": project.delay_months,
            "project_progress": project.physical_progress,
            "sector_avg_progress": project.physical_progress,
            "project_risk_score": project.risk_score,
            "sector_avg_risk_score": project.risk_score,
            "percentile_rank_in_sector": 50.0
        }

    total_peers = len(sector_peers)
    avg_overrun = sum(p.cost_overrun_pct for p in sector_peers) / total_peers
    avg_delay = sum(p.delay_months for p in sector_peers) / total_peers
    avg_progress = sum(p.physical_progress for p in sector_peers) / total_peers
    avg_risk = sum(p.risk_score for p in sector_peers) / total_peers

    # Percentile rank by risk score within sector
    peers_with_lower_risk = sum(1 for p in sector_peers if p.risk_score < project.risk_score)
    percentile_rank = round((peers_with_lower_risk / total_peers) * 100.0, 1)

    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "sector": project.sector,
        "cost_band": cost_band,
        "project_cost_overrun_pct": round(project.cost_overrun_pct, 2),
        "sector_avg_cost_overrun_pct": round(avg_overrun, 2),
        "project_delay_months": round(project.delay_months, 1),
        "sector_avg_delay_months": round(avg_delay, 1),
        "project_progress": round(project.physical_progress, 1),
        "sector_avg_progress": round(avg_progress, 1),
        "project_risk_score": round(project.risk_score, 1),
        "sector_avg_risk_score": round(avg_risk, 1),
        "percentile_rank_in_sector": percentile_rank
    }
