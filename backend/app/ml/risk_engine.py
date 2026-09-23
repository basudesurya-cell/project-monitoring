import json
from typing import Dict, Any, List, Tuple


def calculate_composite_risk_score(
    cost_overrun_pct: float,
    delay_months: float,
    original_cost: float,
    revised_cost: float,
    cumulative_expenditure: float,
    physical_progress: float,
    delay_reasons: str = "",
    milestones_total: int = 5,
    milestones_completed: int = 0
) -> Tuple[float, str, List[Dict[str, Any]]]:
    """
    Computes a 0-100 composite risk score and SHAP-equivalent feature attribution drivers
    adhering to SRS FR-5.1 & FR-5.2.
    """
    drivers = []

    # 1. Cost Escalation Component (Weight: 40%)
    cost_pts = 0.0
    if cost_overrun_pct > 50:
        cost_pts = 40.0
        drivers.append({
            "feature": "Severe Cost Escalation",
            "impact": "+40.0",
            "direction": "HIGH_RISK",
            "explanation": f"Anticipated cost escalation of {cost_overrun_pct:.1f}% drastically exceeds baseline approval."
        })
    elif cost_overrun_pct > 25:
        cost_pts = 25.0 + (cost_overrun_pct - 25) * 0.6
        drivers.append({
            "feature": "Substantial Cost Overrun",
            "impact": f"+{cost_pts:.1f}",
            "direction": "MODERATE_RISK",
            "explanation": f"Anticipated cost overrun of {cost_overrun_pct:.1f}% exceeds 25% tolerance threshold."
        })
    elif cost_overrun_pct > 5:
        cost_pts = 10.0 + (cost_overrun_pct - 5) * 0.75
        drivers.append({
            "feature": "Moderate Cost Overrun",
            "impact": f"+{cost_pts:.1f}",
            "direction": "LOW_RISK",
            "explanation": f"Moderate budget deviation of {cost_overrun_pct:.1f}% recorded."
        })
    else:
        cost_pts = max(0.0, cost_overrun_pct * 1.5)
        if cost_pts > 0:
            drivers.append({
                "feature": "Stable Budget",
                "impact": f"+{cost_pts:.1f}",
                "direction": "MINIMAL_RISK",
                "explanation": "Budget variance is within acceptable margins (<5%)."
            })

    # 2. Schedule Slippage Component (Weight: 35%)
    delay_pts = 0.0
    if delay_months > 36:
        delay_pts = 35.0
        drivers.append({
            "feature": "Protracted Schedule Delay",
            "impact": "+35.0",
            "direction": "HIGH_RISK",
            "explanation": f"Commissioning deadline has slipped by {delay_months:.1f} months (>3 years)."
        })
    elif delay_months > 18:
        delay_pts = 20.0 + (delay_months - 18) * 0.83
        drivers.append({
            "feature": "Critical Milestone Slippage",
            "impact": f"+{delay_pts:.1f}",
            "direction": "HIGH_RISK",
            "explanation": f"Timeline delayed by {delay_months:.1f} months, impacting operational readiness."
        })
    elif delay_months > 6:
        delay_pts = 8.0 + (delay_months - 6) * 1.0
        drivers.append({
            "feature": "Moderate Timeline Delay",
            "impact": f"+{delay_pts:.1f}",
            "direction": "MODERATE_RISK",
            "explanation": f"Schedule delayed by {delay_months:.1f} months."
        })
    elif delay_months > 0:
        delay_pts = delay_months * 1.3
        drivers.append({
            "feature": "Minor Schedule Friction",
            "impact": f"+{delay_pts:.1f}",
            "direction": "LOW_RISK",
            "explanation": f"Slight delay of {delay_months:.1f} months observed."
        })

    # 3. Financial Burn vs. Physical Progress Discrepancy (Weight: 15%)
    financial_burn_pct = (cumulative_expenditure / max(revised_cost, 0.01)) * 100.0
    burn_diff = financial_burn_pct - physical_progress
    divergence_pts = 0.0

    if burn_diff > 25:
        divergence_pts = 15.0
        drivers.append({
            "feature": "Expenditure-Progress Decoupling",
            "impact": "+15.0",
            "direction": "HIGH_RISK",
            "explanation": f"Financial burn ({financial_burn_pct:.1f}%) exceeds physical progress ({physical_progress:.1f}%) by {burn_diff:.1f}%."
        })
    elif burn_diff > 10:
        divergence_pts = 8.0 + (burn_diff - 10) * 0.45
        drivers.append({
            "feature": "Financial Burn Discrepancy",
            "impact": f"+{divergence_pts:.1f}",
            "direction": "MODERATE_RISK",
            "explanation": f"Expenditure rate ({financial_burn_pct:.1f}%) is trending ahead of on-site progress ({physical_progress:.1f}%)."
        })
    elif burn_diff < -15:
        # Progress ahead of financial payments (generally good or billing lag)
        divergence_pts = 2.0
    else:
        divergence_pts = max(0.0, burn_diff * 0.2)

    # 4. Bottlenecks & Milestone Shortfall (Weight: 10%)
    governance_pts = 0.0
    reasons_lower = (delay_reasons or "").lower()
    high_impact_causes = ["land acquisition", "environmental clearance", "litigation", "court", "contractor default"]
    matched_causes = [c for c in high_impact_causes if c in reasons_lower]

    if matched_causes:
        governance_pts += min(6.0, len(matched_causes) * 3.0)
        drivers.append({
            "feature": "Structural Bottlenecks",
            "impact": f"+{governance_pts:.1f}",
            "direction": "MODERATE_RISK",
            "explanation": f"Explicit delays reported: {', '.join(matched_causes).title()}."
        })

    if milestones_total > 0:
        completion_ratio = milestones_completed / milestones_total
        if completion_ratio < 0.3 and delay_months > 6:
            shortfall_pts = 4.0
            governance_pts += shortfall_pts
            drivers.append({
                "feature": "Low Milestone Completion",
                "impact": f"+{shortfall_pts:.1f}",
                "direction": "MODERATE_RISK",
                "explanation": f"Only {milestones_completed}/{milestones_total} milestones achieved despite project maturity."
            })

    governance_pts = min(10.0, governance_pts)

    # Composite aggregation bounded to [0, 100]
    raw_score = cost_pts + delay_pts + divergence_pts + governance_pts
    final_score = round(min(100.0, max(0.0, raw_score)), 1)

    # Tier mapping
    if final_score >= 75.0:
        tier = "CRITICAL"
    elif final_score >= 50.0:
        tier = "HIGH"
    elif final_score >= 25.0:
        tier = "MEDIUM"
    else:
        tier = "LOW"

    # Sort drivers by absolute impact descending
    drivers.sort(key=lambda d: float(d["impact"].replace("+", "").replace("-", "")), reverse=True)

    return final_score, tier, drivers
