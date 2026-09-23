from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from .labeling import parse_date_safely
from .schedule_delay import compute_schedule_delay_analysis


def compute_problem_diagnostics(project: Any) -> Dict[str, Any]:
    """
    Comprehensive problem diagnostic engine adhering to SIH26103 & SRS v2.0.
    Identifies the project's exact problem archetype and generates dedicated,
    problem-specific multi-graph datasets:
    1. SCHEDULE_DELAY: Planned vs Actual S-Curve + Milestone Slippage Waterfall
    2. COST_OVERRUN: Budget Escalation Waterfall + Financial Burn vs Physical Progress Decoupling
    3. DUAL_ESCALATION: Compound risk with both Budget Waterfall & Progress S-Curve
    4. IMPLEMENTATION_BOTTLENECK: Bottleneck Factor Attribution + Milestone Funnel
    5. ON_TRACK: Baseline Progress & Peer Comparison
    """
    original_cost = float(getattr(project, "original_cost", 0.0) or 0.0)
    revised_cost = float(getattr(project, "revised_cost", 0.0) or 0.0)
    cumulative_expenditure = float(getattr(project, "cumulative_expenditure", 0.0) or 0.0)
    physical_progress = float(getattr(project, "physical_progress", 0.0) or 0.0)
    cost_overrun_pct = float(getattr(project, "cost_overrun_pct", 0.0) or 0.0)
    delay_months = float(getattr(project, "delay_months", 0.0) or 0.0)
    delay_reasons = str(getattr(project, "delay_reasons", "") or "")
    milestones_total = int(getattr(project, "milestones_total", 5) or 5)
    milestones_completed = int(getattr(project, "milestones_completed", 0) or 0)
    original_doc = getattr(project, "original_doc", None)
    revised_doc = getattr(project, "revised_doc", None)

    # Base schedule delay analysis
    schedule_data = compute_schedule_delay_analysis(project)
    delay_days = schedule_data.get("delay_days", 0)
    progress_gap = schedule_data.get("progress_gap", 0.0)
    planned_progress = schedule_data.get("planned_progress", 0.0)

    # Financial figures
    cost_escalation = max(0.0, round(revised_cost - original_cost, 2))
    financial_burn_pct = round((cumulative_expenditure / max(revised_cost, 0.01)) * 100.0, 1)
    unspent_budget = max(0.0, round(revised_cost - cumulative_expenditure, 2))
    cost_efficiency = round(physical_progress / max(financial_burn_pct, 0.1), 2)
    burn_diff = round(financial_burn_pct - physical_progress, 1)

    # Check if project has direct problem diagnostic fields from Excel dataset
    db_archetype = getattr(project, "problem_archetype", None)
    db_title = getattr(project, "problem_title", None)
    db_severity = getattr(project, "problem_severity", None)
    db_summary = getattr(project, "root_metrics_summary", None)
    db_action = getattr(project, "mandated_action", None)
    db_recs = getattr(project, "prescriptive_recommendations", None)

    # 1. Determine Problem Archetype
    reasons_lower = delay_reasons.lower()
    has_bottleneck_causes = any(k in reasons_lower for k in [
        "land acquisition", "clearance", "forest", "wildlife", "litigation", "court", "contractor", "row"
    ])

    if db_archetype:
        problem_type = db_archetype
        problem_title = db_title or (
            "Compound Risk: Schedule Delay & Severe Budget Escalation" if problem_type == "DUAL_ESCALATION" else
            "Cost Overrun & Budget Escalation" if problem_type == "COST_OVERRUN" else
            "Schedule Delay & Milestone Slippage" if problem_type == "SCHEDULE_DELAY" else
            "Implementation Bottleneck & Statutory Stalemate" if problem_type == "IMPLEMENTATION_BOTTLENECK" else
            "Monitoring Baseline & Milestone Oversight"
        )
        root_metrics_summary = db_summary or f"+{delay_days}d Slippage · -{progress_gap}% Gap · +₹{cost_escalation:,.0f} Cr Escalation"
        severity = db_severity or ("Critical" if cost_overrun_pct >= 30 or delay_days >= 300 else "High")
        default_graph_id = "budget_waterfall" if problem_type in ("COST_OVERRUN", "DUAL_ESCALATION") else "progress_curve"
        recommended_action = db_action or (
            "Inter-Ministerial Cabinet Review + Restructuring" if problem_type == "DUAL_ESCALATION" else
            "Revised Cost Committee (RCC) Audit + Expenditure Freeze" if problem_type == "COST_OVERRUN" else
            "Field Task Force + Milestone Catch-Up Plan"
        )
        if db_recs:
            recommendations = [r.strip() for r in db_recs.split(";") if r.strip()]
        else:
            recommendations = [
                f"Convene joint review between {getattr(project, 'ministry', 'Ministry')} and Cabinet Secretariat on approved cost ceiling of ₹{revised_cost:,.0f} Cr.",
                f"Conduct technical audit into expenditure-progress decoupling (burn {financial_burn_pct}% vs physical progress {physical_progress}%).",
                f"Fix mandatory catch-up milestone deadlines with revised completion target {revised_doc or 'TBD'}."
            ]
    # Rule 1: Compound Dual Escalation (Both cost and schedule are severely compromised)
    elif cost_overrun_pct >= 20.0 and (delay_days >= 180 or delay_months >= 12.0):
        problem_type = "DUAL_ESCALATION"
        problem_title = "Compound Risk: Schedule Delay & Severe Budget Escalation"
        default_graph_id = "budget_waterfall"
        root_metrics_summary = f"+{delay_days}d Slippage · -{progress_gap}% Gap · +₹{cost_escalation:,.0f} Cr (+{cost_overrun_pct}%) Escalation"
        severity = "Critical"
        recommended_action = "Inter-Ministerial Cabinet Review + Restructuring"
        recommendations = [
            f"Convene joint review between {getattr(project, 'ministry', 'Ministry')} and Cabinet Secretariat on approved cost ceiling of ₹{revised_cost:,.0f} Cr.",
            f"Conduct technical audit into expenditure-progress decoupling (burn {financial_burn_pct}% vs physical progress {physical_progress}%).",
            f"Fix mandatory catch-up milestone deadlines with revised completion target {revised_doc or 'TBD'}."
        ]
    # Rule 2: Cost Overrun dominant (Severe cost escalation overshadows or precedes schedule)
    elif (cost_overrun_pct >= 15.0 and (cost_overrun_pct >= delay_months * 1.5 or delay_months < 6.0)) or (cost_overrun_pct >= 10.0 and delay_months < 3.0):
        problem_type = "COST_OVERRUN"
        problem_title = "Cost Overrun & Budget Escalation"
        default_graph_id = "budget_waterfall"
        root_metrics_summary = f"+₹{cost_escalation:,.0f} Cr Escalation (+{cost_overrun_pct}%) · Exp Burn: {financial_burn_pct}%"
        if cost_overrun_pct >= 40.0:
            severity = "Critical"
            recommended_action = "Revised Cost Committee (RCC) Audit + Expenditure Freeze"
        elif cost_overrun_pct >= 20.0:
            severity = "High"
            recommended_action = "Financial Audit + Scope Rationalization"
        else:
            severity = "Medium"
            recommended_action = "Expenditure Review & Contingency Monitoring"
        recommendations = [
            f"Submit project to Revised Cost Committee (RCC) to audit scope creep and price escalation (+₹{cost_escalation:,.0f} Cr).",
            f"Scrutinize contractor billings where financial burn ({financial_burn_pct}%) diverges from on-site progress ({physical_progress}%).",
            "Cap non-essential package expenditures and enforce revised sanction caps."
        ]
    # Rule 3: Schedule Delay dominant (Time slippage is the primary defect with modest cost variance)
    elif ((delay_days >= 90 or delay_months >= 6.0) and (delay_months >= cost_overrun_pct * 0.8 or cost_overrun_pct < 10.0)) or (delay_days >= 60 and cost_overrun_pct < 10.0):
        problem_type = "SCHEDULE_DELAY"
        problem_title = "Schedule Delay & Milestone Slippage"
        default_graph_id = "progress_curve"
        root_metrics_summary = f"{delay_days} Delay Days · -{progress_gap}% Progress Gap · DOC Slippage"
        severity = schedule_data.get("severity", "High")
        recommended_action = schedule_data.get("recommended_action", "Escalate + Recovery Plan")
        recommendations = schedule_data.get("recommendations", [
            f"Escalate to {getattr(project, 'ministry', 'Ministry')} nodal officers.",
            "Field bottleneck investigation into delayed clearances.",
            "Structured Recovery Plan with milestone catch-up commitment."
        ])
    # Rule 4: Fallback for moderate cost overrun
    elif cost_overrun_pct >= 10.0:
        problem_type = "COST_OVERRUN"
        problem_title = "Cost Overrun & Budget Escalation"
        default_graph_id = "budget_waterfall"
        root_metrics_summary = f"+₹{cost_escalation:,.0f} Cr Escalation (+{cost_overrun_pct}%) · Exp Burn: {financial_burn_pct}%"
        severity = "Medium"
        recommended_action = "Expenditure Review & Contingency Monitoring"
        recommendations = [
            f"Submit project to Revised Cost Committee (RCC) to audit scope creep and price escalation (+₹{cost_escalation:,.0f} Cr).",
            f"Scrutinize contractor billings where financial burn ({financial_burn_pct}%) diverges from on-site progress ({physical_progress}%)."
        ]
    # Rule 5: Fallback for moderate schedule delay
    elif delay_days >= 60 or delay_months >= 3.0 or progress_gap >= 10.0:
        problem_type = "SCHEDULE_DELAY"
        problem_title = "Schedule Delay & Milestone Slippage"
        default_graph_id = "progress_curve"
        root_metrics_summary = f"{delay_days} Delay Days · -{progress_gap}% Progress Gap · DOC Slippage"
        severity = schedule_data.get("severity", "Medium")
        recommended_action = schedule_data.get("recommended_action", "Escalate + Recovery Plan")
        recommendations = schedule_data.get("recommendations", [
            f"Escalate to {getattr(project, 'ministry', 'Ministry')} nodal officers.",
            "Structured Recovery Plan with milestone catch-up commitment."
        ])
    # Rule 6: Implementation Bottleneck (Explicit delay causes with incomplete milestones)
    elif has_bottleneck_causes and (milestones_completed < milestones_total or physical_progress < 80.0):
        problem_type = "IMPLEMENTATION_BOTTLENECK"
        problem_title = "Implementation Bottleneck & Statutory Stalemate"
        default_graph_id = "bottleneck_factors"
        root_metrics_summary = f"Clearance/RoW Stalemate · {milestones_completed}/{milestones_total} Milestones Met"
        severity = "High" if physical_progress < 50.0 else "Medium"
        recommended_action = "Field Task Force + State Chief Secretary Intervention"
        recommendations = [
            f"Establish dedicated task force with State Administration for Right of Way (RoW) and land handovers.",
            f"Address documented blockers: {delay_reasons or 'Forest clearances & utility shifting'}.",
            "Fast-track contractor plant and machinery deployment with milestone-linked advances."
        ]
    else:
        problem_type = "ON_TRACK"
        problem_title = "Monitoring Baseline & Milestone Oversight"
        default_graph_id = "progress_curve"
        root_metrics_summary = f"{physical_progress}% Progress · Budget ₹{revised_cost:,.0f} Cr · Nominal Variance"
        severity = "Low"
        recommended_action = "Routine Field Monitoring"
        recommendations = [
            "Maintain standard monthly physical progress reporting.",
            "Monitor intermediate critical-path activities according to baseline schedule."
        ]

    # =========================================================================
    # DEDICATED GRAPH 1: BUDGET ESCALATION & SANCTION WATERFALL
    # =========================================================================
    budget_waterfall = {
        "original_cost": original_cost,
        "cumulative_expenditure": cumulative_expenditure,
        "revised_cost": revised_cost,
        "cost_escalation": cost_escalation,
        "cost_overrun_pct": cost_overrun_pct,
        "financial_burn_pct": financial_burn_pct,
        "unspent_budget": unspent_budget,
        "cost_efficiency_index": cost_efficiency
    }

    # =========================================================================
    # DEDICATED GRAPH 2: FINANCIAL BURN VS PHYSICAL PROGRESS DECOUPLING CURVE
    # =========================================================================
    dt_orig = parse_date_safely(original_doc)
    dt_rev = parse_date_safely(revised_doc)
    start_year = (dt_orig.year - 4) if dt_orig else 2022

    burn_vs_progress: List[Dict[str, Any]] = [
        {
            "stage": "Project Inception",
            "time_label": f"FY {start_year}",
            "financial_burn_pct": 0.0,
            "physical_progress_pct": 0.0,
            "decoupling_gap": 0.0
        },
        {
            "stage": "Clearances & Tenders",
            "time_label": f"FY {start_year + 1}",
            "financial_burn_pct": round(min(financial_burn_pct * 0.35, 25.0), 1),
            "physical_progress_pct": round(min(physical_progress * 0.30, 20.0), 1),
            "decoupling_gap": round(max(0.0, (min(financial_burn_pct * 0.35, 25.0)) - (min(physical_progress * 0.30, 20.0))), 1)
        },
        {
            "stage": "Civil Groundwork",
            "time_label": f"FY {start_year + 2}",
            "financial_burn_pct": round(min(financial_burn_pct * 0.70, 60.0), 1),
            "physical_progress_pct": round(min(physical_progress * 0.65, 50.0), 1),
            "decoupling_gap": round(max(0.0, (min(financial_burn_pct * 0.70, 60.0)) - (min(physical_progress * 0.65, 50.0))), 1)
        },
        {
            "stage": "Active Benchmark (Today)",
            "time_label": "Apr 2026",
            "financial_burn_pct": financial_burn_pct,
            "physical_progress_pct": physical_progress,
            "decoupling_gap": burn_diff
        },
        {
            "stage": "Revised Completion Target",
            "time_label": dt_rev.strftime("%b %Y") if dt_rev else "Target DOC",
            "financial_burn_pct": 100.0,
            "physical_progress_pct": 100.0,
            "decoupling_gap": 0.0
        }
    ]

    # =========================================================================
    # DEDICATED GRAPH 3: PLANNED VS ACTUAL PROGRESS S-CURVE
    # =========================================================================
    progress_curve = schedule_data.get("trajectory", [])

    # =========================================================================
    # DEDICATED GRAPH 4: MILESTONE SCHEDULE SLIPPAGE WATERFALL
    # =========================================================================
    m_delay_m = max(0.0, delay_months)
    milestone_slippage: List[Dict[str, Any]] = [
        {
            "milestone": "Land Handover & Statutory Clearances",
            "planned_period": "Months 0 - 12",
            "slippage_months": round(min(m_delay_m * 0.35, 8.0), 1),
            "status": "Delayed" if m_delay_m > 3 else "Completed",
            "primary_impediment": "Forest / Wildlife & RoW clearance" if has_bottleneck_causes else "Procedural review"
        },
        {
            "milestone": "Civil & Structural Execution",
            "planned_period": "Months 12 - 30",
            "slippage_months": round(min(m_delay_m * 0.50, 14.0), 1),
            "status": "Critical Slip" if m_delay_m > 12 else "In Progress",
            "primary_impediment": "Contractor mobilization & utility shifting"
        },
        {
            "milestone": "Equipment & Systems Commissioning",
            "planned_period": "Months 30 - 42",
            "slippage_months": round(min(m_delay_m * 0.75, 20.0), 1),
            "status": "Projected Slip" if m_delay_m > 6 else "Pending",
            "primary_impediment": "Equipment supply chain & testing"
        },
        {
            "milestone": "Final Operational Commissioning (DOC)",
            "planned_period": original_doc or "Original DOC",
            "slippage_months": round(m_delay_m, 1),
            "status": "Slipped to " + (revised_doc or "Revised Target"),
            "primary_impediment": f"Total timeline deviation of {delay_days} days"
        }
    ]

    # =========================================================================
    # DEDICATED GRAPH 5: BOTTLENECK FACTOR ATTRIBUTION (RADAR/BARS)
    # Uses 5 Component Risk dimensions from the Excel Dataset
    # =========================================================================
    db_row = getattr(project, "row_land_acquisition_risk", None)
    db_env = getattr(project, "environmental_clearances_risk", None)
    db_util = getattr(project, "utility_shifting_risk", None)
    db_solv = getattr(project, "contractor_solvency_risk", None)
    db_arb = getattr(project, "contractual_arbitration_risk", None)

    row_score = int(db_row) if db_row is not None else (85 if "land" in reasons_lower or "row" in reasons_lower else (45 if delay_months > 12 else 15))
    env_score = int(db_env) if db_env is not None else (80 if "clearance" in reasons_lower or "forest" in reasons_lower else (40 if delay_months > 6 else 10))
    util_score = int(db_util) if db_util is not None else (75 if "utility" in reasons_lower or "shifting" in reasons_lower else (35 if delay_months > 9 else 15))
    solv_score = int(db_solv) if db_solv is not None else (88 if "contractor" in reasons_lower else (55 if cost_overrun_pct > 25 else 20))
    arb_score = int(db_arb) if db_arb is not None else (90 if "litigation" in reasons_lower or "court" in reasons_lower or "arbitration" in reasons_lower else 10)

    bottleneck_factors: List[Dict[str, Any]] = [
        {
            "factor": "Right of Way (RoW) & Land Acquisition",
            "impact_score": row_score,
            "status": "Critical Blocker" if row_score >= 70 else ("Moderate Friction" if row_score >= 40 else "Low Risk"),
            "details": "Contiguous parcel acquisition & landowner compensation settlement" if row_score >= 50 else "Land acquisition largely completed"
        },
        {
            "factor": "Environmental & Statutory Clearances",
            "impact_score": env_score,
            "status": "Pending Clearance" if env_score >= 70 else ("In Scrutiny" if env_score >= 40 else "Clearances Secured"),
            "details": "Pending Stage-II forest clearance / wildlife sanctuary NOC" if env_score >= 50 else "Statutory clearances secured"
        },
        {
            "factor": "Utility Shifting & State Allocations",
            "impact_score": util_score,
            "status": "State Intervention Required" if util_score >= 60 else ("Coordination Active" if util_score >= 35 else "Routine"),
            "details": "Power transmission lines, pipelines & water canal diversion" if util_score >= 40 else "No major utility encumbrances"
        },
        {
            "factor": "Contractor Solvency & Equipment Mobilization",
            "impact_score": solv_score,
            "status": "Severe Cashflow Distress" if solv_score >= 75 else ("Under-mobilized" if solv_score >= 45 else "Adequate Deployment"),
            "details": "Contractor working capital distress / plant & machinery mobilization" if solv_score >= 50 else "Vendor performance acceptable"
        },
        {
            "factor": "Contractual Arbitration & Legal Disputes",
            "impact_score": arb_score,
            "status": "Sub Judice / Arbitral Tribunal" if arb_score >= 70 else ("Claims Pending" if arb_score >= 35 else "No Active Disputes"),
            "details": "High Court stay orders, contract variations, or arbitration tribunal" if arb_score >= 40 else "No legal impediments"
        }
    ]

    # Available graphs list for the UI selector
    available_graphs = [
        {
            "id": "progress_curve",
            "title": "Planned vs Actual Progress S-Curve",
            "icon": "TrendingUp",
            "category": "Schedule",
            "description": "Compares planned baseline trajectory against actual physical execution with progress gap deficit."
        },
        {
            "id": "budget_waterfall",
            "title": "Budget Escalation & Sanction Breakdown",
            "icon": "DollarSign",
            "category": "Cost",
            "description": "Compares Approved Sanctioned Budget, Cumulative Expenditure, and Revised Cost with escalation delta."
        },
        {
            "id": "burn_vs_progress",
            "title": "Expenditure Burn vs Physical Progress Decoupling",
            "icon": "Zap",
            "category": "Cost & Execution",
            "description": "Exposes cost inefficiency where financial expenditure outpaces physical completion on site."
        },
        {
            "id": "milestone_slippage",
            "title": "Milestone Schedule Slippage Waterfall",
            "icon": "Clock",
            "category": "Schedule",
            "description": "Tracks timeline slippage in months across discrete project lifecycle milestones."
        },
        {
            "id": "bottleneck_factors",
            "title": "Bottleneck Factor Risk Attribution",
            "icon": "AlertTriangle",
            "category": "Governance",
            "description": "Evaluates severity across RoW, clearances, utility shifting, contractor solvency, and litigation."
        }
    ]

    return {
        "problem_type": problem_type,
        "problem_title": problem_title,
        "root_metrics_summary": root_metrics_summary,
        "severity": severity,
        "recommended_action": recommended_action,
        "recommendations": recommendations,
        "default_graph_id": default_graph_id,
        "available_graphs": available_graphs,
        # Multi-graph datasets
        "progress_curve": progress_curve,
        "budget_waterfall": budget_waterfall,
        "burn_vs_progress": burn_vs_progress,
        "milestone_slippage": milestone_slippage,
        "bottleneck_factors": bottleneck_factors,
        # Backwards compatibility fields for schedule_delay
        "is_delay_detected": schedule_data.get("is_delay_detected", False),
        "delay_days": delay_days,
        "progress_gap": progress_gap,
        "planned_progress": planned_progress,
        "actual_progress": physical_progress,
        "planned_completion_date": original_doc,
        "actual_completion_date": revised_doc,
        "trajectory": progress_curve,
        "problem": problem_title,
        "root_metrics": root_metrics_summary,
        "visualization": "Problem-Specific Multi-Graph Diagnostics"
    }
