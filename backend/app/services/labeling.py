from datetime import datetime
from typing import Optional, Tuple, Dict, Any, List


def parse_date_safely(date_str: str) -> Optional[datetime]:
    """Attempts to parse standard date strings YYYY-MM-DD or DD-MM-YYYY."""
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%Y", "%b %Y", "%B %Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None


def calculate_delay_months(original_doc: str, revised_doc: str) -> float:
    """Calculates difference in months between original and revised Date of Commissioning."""
    dt_orig = parse_date_safely(original_doc)
    dt_rev = parse_date_safely(revised_doc)

    if not dt_orig or not dt_rev:
        return 0.0

    delta_days = (dt_rev - dt_orig).days
    months = round(delta_days / 30.4375, 1)
    return max(0.0, months)


def compute_ground_truth_labels(
    original_cost: float,
    revised_cost: float,
    original_doc: str,
    revised_doc: str,
    cumulative_expenditure: float = 0.0,
    physical_progress: float = 0.0,
    cost_threshold_pct: float = 0.0,
    delay_threshold_months: float = 0.0
) -> Dict[str, Any]:
    """
    Computes ground truth targets and risk scores adhering strictly to SRS FR-2.1 and FR-2.2.
    """
    orig_cost = max(original_cost, 0.01)
    rev_cost = max(revised_cost, orig_cost)

    cost_overrun_pct = round(((rev_cost - orig_cost) / orig_cost) * 100.0, 2)
    cost_overrun_flag = cost_overrun_pct > cost_threshold_pct

    delay_months = calculate_delay_months(original_doc, revised_doc)
    delay_flag = delay_months > delay_threshold_months

    exp_ratio = (cumulative_expenditure / rev_cost * 100.0) if rev_cost > 0 else 0.0
    expenditure_progress_ratio = round(exp_ratio / max(physical_progress, 1.0), 2)

    # Status classification
    if delay_months > 18.0 or cost_overrun_pct > 30.0:
        project_status = "CRITICAL_WATCHLIST"
    elif delay_months > 3.0 or cost_overrun_pct > 5.0:
        project_status = "DELAYED"
    elif physical_progress >= 95.0:
        project_status = "COMMISSIONED"
    elif physical_progress > 60.0 and exp_ratio < physical_progress:
        project_status = "AHEAD_OF_SCHEDULE"
    else:
        project_status = "ONGOING_ON_TRACK"

    # Dual problem / predictive signal (FR-5.3 & NFR-9)
    is_confirmed = cost_overrun_pct > 10.0 or delay_months > 6.0
    # Predictive warning applies if high burn velocity or structural bottlenecks exist even if officially on track
    is_predictive = (not is_confirmed) and (expenditure_progress_ratio > 1.35 or exp_ratio - physical_progress > 15.0)

    if is_confirmed:
        risk_type_label = "CONFIRMED_DEFICIT"
    elif is_predictive:
        risk_type_label = "PREDICTIVE_SIGNAL"
    else:
        risk_type_label = "LOW_RISK"

    confidence_level = "HIGH" if (cost_overrun_pct > 20.0 or delay_months > 12.0 or physical_progress > 80.0) else "MEDIUM"

    return {
        "cost_overrun_pct": cost_overrun_pct,
        "cost_overrun_flag": cost_overrun_flag,
        "delay_months": delay_months,
        "delay_flag": delay_flag,
        "expenditure_progress_ratio": expenditure_progress_ratio,
        "project_status": project_status,
        "is_confirmed_problem": is_confirmed,
        "is_predictive_warning": is_predictive,
        "confidence_level": confidence_level,
        "risk_type_label": risk_type_label
    }
