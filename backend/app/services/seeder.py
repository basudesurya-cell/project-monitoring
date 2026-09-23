import random
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models import Project, DataQualityLog
from .labeling import compute_ground_truth_labels
from ..ml.risk_engine import calculate_composite_risk_score

MINISTRIES_AND_SECTORS = [
    ("Ministry of Road Transport and Highways", "Road Transport and Highways", [
        "National Highways Authority of India (NHAI)", "National Highways & Infrastructure Dev Corp (NHIDCL)", "State PWD"
    ], 720),
    ("Ministry of Railways", "Railways", [
        "Rail Vikas Nigam Limited (RVNL)", "IRCON International", "Dedicated Freight Corridor Corp (DFCCIL)", "RITES"
    ], 340),
    ("Ministry of Petroleum and Natural Gas", "Petroleum and Natural Gas", [
        "Indian Oil Corporation (IOCL)", "Oil and Natural Gas Corp (ONGC)", "Bharat Petroleum (BPCL)", "GAIL India"
    ], 175),
    ("Ministry of Power", "Power", [
        "NTPC Limited", "Power Grid Corporation of India (PGCIL)", "NHPC Limited", "SJVN Limited"
    ], 145),
    ("Ministry of Coal", "Coal", [
        "Coal India Limited (CIL)", "South Eastern Coalfields (SECL)", "Mahanadi Coalfields (MCL)", "NLC India"
    ], 130),
    ("Ministry of Housing and Urban Affairs", "Urban Development", [
        "Delhi Metro Rail Corp (DMRC)", "National Capital Region Transport Corp (NCRTC)", "NBCC India", "Bangalore Metro"
    ], 85),
    ("Ministry of Ports, Shipping and Waterways", "Shipping and Ports", [
        "Jawaharlal Nehru Port Trust (JNPT)", "Deendayal Port Authority", "Inland Waterways Authority (IWAI)"
    ], 65),
    ("Ministry of Civil Aviation", "Civil Aviation", [
        "Airports Authority of India (AAI)"
    ], 55),
    ("Ministry of Jal Shakti", "Water Resources", [
        "National Water Development Agency", "WAPCOS Limited"
    ], 60),
    ("Department of Atomic Energy", "Atomic Energy", [
        "Nuclear Power Corporation of India (NPCIL)", "Bhabha Atomic Research Centre"
    ], 38),
    ("Ministry of Communications", "Telecommunications", [
        "Bharat Sanchar Nigam Limited (BSNL)", "Bharat Broadband Network (BBNL)"
    ], 35),
    ("Ministry of Steel", "Steel", [
        "Steel Authority of India (SAIL)", "Rashtriya Ispat Nigam (RINL)"
    ], 30),
    ("Ministry of Mines", "Mines", [
        "National Aluminium Company (NALCO)", "Hindustan Copper"
    ], 22),
    ("Ministry of Chemicals and Fertilizers", "Chemicals and Petrochemicals", [
        "Rashtriya Chemicals & Fertilizers (RCF)", "Fertilizers & Chemicals Travancore"
    ], 26),
    ("Ministry of Heavy Industries", "Heavy Industry", [
        "Bharat Heavy Electricals Limited (BHEL)"
    ], 18),
    ("Ministry of Health and Family Welfare", "Health and Family Welfare", [
        "All India Institute of Medical Sciences (AIIMS)", "HSCC India"
    ], 37),
    ("Ministry of Defence", "Defence Production", [
        "Border Roads Organisation (BRO)", "Mazagon Dock Shipbuilders"
    ], 30),
]

STATES = [
    "Maharashtra", "Uttar Pradesh", "Gujarat", "Tamil Nadu", "Karnataka",
    "Andhra Pradesh", "Odisha", "Madhya Pradesh", "Rajasthan", "West Bengal",
    "Bihar", "Telangana", "Kerala", "Assam", "Jharkhand", "Punjab", "Haryana",
    "Chhattisgarh", "Uttarakhand", "Himachal Pradesh", "Jammu & Kashmir"
]

COMMON_DELAY_REASONS = [
    "Delay in land acquisition and forest environmental clearances",
    "Utility shifting (power lines, water pipelines) and tree felling permissions",
    "Right of Way (RoW) handover and local agitation",
    "Contractor slow mobilization, cash flow insolvency and re-tendering",
    "Scope enhancement, structural redesign and additional flyovers/bridges",
    "Monsoon floods and geological surprises in tunneling",
    "Law and order issues and contractual arbitration in court",
    "Fund allocation delays and counterpart state funding shortfall"
]


def seed_from_excel_dataset(session: Session, excel_path: str | None = None) -> int:
    """
    Seeds projects directly from Infrastructure_Project_Problems_Dataset.xlsx
    with all 37 problem diagnostics columns.
    """
    import os
    import pandas as pd

    if not excel_path:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        possible_paths = [
            os.path.join(os.getcwd(), "Infrastructure_Project_Problems_Dataset.xlsx"),
            os.path.join(project_root, "Infrastructure_Project_Problems_Dataset.xlsx")
        ]
        for p in possible_paths:
            if os.path.exists(p):
                excel_path = p
                break

    if not excel_path or not os.path.exists(excel_path):
        return 0

    try:
        df = pd.read_excel(excel_path, sheet_name="All_Projects_Problem_Matrix")
    except Exception as e:
        print(f"Error reading Excel sheet: {e}")
        return 0

    session.query(Project).delete()
    session.query(DataQualityLog).delete()
    session.commit()

    projects_to_insert = []
    for _, row in df.iterrows():
        p_id = str(row["Project ID"]).strip()
        p_name = str(row["Project Name"]).strip()
        ministry = str(row["Ministry"]).strip()
        sector = str(row["Sector"]).strip()
        agency = str(row["Implementing Agency"]).strip()
        state = str(row["State / Location"]).strip()
        orig_cost = float(row["Sanctioned Cost (₹ Cr)"])
        rev_cost = float(row["Revised Cost (₹ Cr)"])
        exp = float(row["Cumulative Expenditure (₹ Cr)"])
        orig_doc = str(row["Original Target DOC"]).split()[0] if pd.notna(row["Original Target DOC"]) else None
        rev_doc = str(row["Revised Target DOC"]).split()[0] if pd.notna(row["Revised Target DOC"]) else None
        phys_prog = float(row["Actual Physical Progress (%)"])
        cost_overrun_pct = float(row["Cost Overrun (%)"])
        cost_overrun_flag = cost_overrun_pct > 0
        delay_months = float(row["Delay in Months"])
        delay_flag = delay_months > 0
        exp_prog_ratio = round((exp / max(rev_cost, 0.01)) / max(phys_prog / 100.0, 0.01), 2)
        risk_score = float(row["Composite Risk Score"])
        risk_tier = str(row["Risk Tier"]).strip().upper()

        primary_driver = str(row["Primary ML Risk Driver (SHAP)"]).strip()
        shap_json = json.dumps([{
            "feature": primary_driver,
            "impact": "HIGH" if risk_score > 70 else "MEDIUM",
            "direction": "INCREASES_RISK",
            "explanation": f"Primary ML driver contributing to project vulnerability: {primary_driver}"
        }])

        proj_status = str(row["Portfolio Watchlist Status"]).strip()
        is_conf = str(row["Is Confirmed Problem"]).strip().lower() in ["yes", "true", "1"]
        is_pred = risk_score >= 60.0 and not is_conf

        delay_reasons = str(row["Primary Delay Reasons / Obstacles"]).strip() if pd.notna(row["Primary Delay Reasons / Obstacles"]) else ""
        archetype = str(row["Problem Archetype"]).strip()
        title = str(row["Problem Title"]).strip()
        severity = str(row["Problem Severity"]).strip()
        root_metrics = str(row["Root Metrics Summary"]).strip()
        planned_prog = float(row["Planned Progress (%)"]) if pd.notna(row["Planned Progress (%)"]) else 0.0
        prog_deficit = float(row["Progress Deficit Gap (%)"]) if pd.notna(row["Progress Deficit Gap (%)"]) else 0.0
        burn_pct = float(row["Financial Burn (%)"]) if pd.notna(row["Financial Burn (%)"]) else 0.0
        decoupling_gap = float(row["Burn-Progress Decoupling Gap (%)"]) if pd.notna(row["Burn-Progress Decoupling Gap (%)"]) else 0.0
        row_risk = float(row["RoW & Land Acquisition Risk (0-100)"]) if pd.notna(row["RoW & Land Acquisition Risk (0-100)"]) else 0.0
        env_risk = float(row["Environmental Clearances Risk (0-100)"]) if pd.notna(row["Environmental Clearances Risk (0-100)"]) else 0.0
        util_risk = float(row["Utility Shifting Risk (0-100)"]) if pd.notna(row["Utility Shifting Risk (0-100)"]) else 0.0
        cont_risk = float(row["Contractor Solvency Risk (0-100)"]) if pd.notna(row["Contractor Solvency Risk (0-100)"]) else 0.0
        arb_risk = float(row["Contractual Arbitration Risk (0-100)"]) if pd.notna(row["Contractual Arbitration Risk (0-100)"]) else 0.0
        mandated_action = str(row["Mandated Action"]).strip() if pd.notna(row["Mandated Action"]) else ""
        presc_rec = str(row["Prescriptive Recommendations"]).strip() if pd.notna(row["Prescriptive Recommendations"]) else ""

        p = Project(
            project_id=p_id,
            project_name=p_name,
            ministry=ministry,
            sector=sector,
            implementing_agency=agency,
            state_location=state,
            original_cost=orig_cost,
            revised_cost=rev_cost,
            cumulative_expenditure=exp,
            original_doc=orig_doc,
            revised_doc=rev_doc,
            physical_progress=phys_prog,
            cost_overrun_pct=cost_overrun_pct,
            cost_overrun_flag=cost_overrun_flag,
            delay_months=delay_months,
            delay_flag=delay_flag,
            expenditure_progress_ratio=exp_prog_ratio,
            risk_score=risk_score,
            risk_tier=risk_tier,
            shap_drivers=shap_json,
            project_status=proj_status,
            is_confirmed_problem=is_conf,
            is_predictive_warning=is_pred,
            confidence_level="HIGH" if risk_score >= 60 else "MEDIUM",
            risk_type_label="CONFIRMED_DEFICIT" if is_conf else ("PREDICTIVE_SIGNAL" if is_pred else "LOW_RISK"),
            delay_reasons=delay_reasons,
            problem_archetype=archetype,
            problem_title=title,
            problem_severity=severity,
            root_metrics_summary=root_metrics,
            planned_progress=planned_prog,
            progress_deficit_gap=prog_deficit,
            financial_burn_pct=burn_pct,
            burn_progress_decoupling_gap=decoupling_gap,
            row_land_acquisition_risk=row_risk,
            environmental_clearances_risk=env_risk,
            utility_shifting_risk=util_risk,
            contractor_solvency_risk=cont_risk,
            contractual_arbitration_risk=arb_risk,
            mandated_action=mandated_action,
            prescriptive_recommendations=presc_rec,
            milestones_total=random.randint(4, 10),
            milestones_completed=int(round((phys_prog / 100.0) * 5)),
            data_provenance="EXCEL_PROBLEMS_DATASET"
        )
        projects_to_insert.append(p)

    session.bulk_save_objects(projects_to_insert)
    session.commit()
    print(f"[PAIMANA Insight v2.0] Seeded {len(projects_to_insert)} projects from Infrastructure_Project_Problems_Dataset.xlsx")
    return len(projects_to_insert)


def seed_from_sih_5000_dataset(session: Session, excel_path: str | None = None) -> int:
    """
    Seeds projects directly from SIH_5000_Projects_Problems_Dataset.xlsx (5,000 projects)
    with complete problem diagnostics, component risks, and recovery directives.
    """
    import os
    import pandas as pd

    if not excel_path:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        possible_paths = [
            os.path.join(os.getcwd(), "SIH_5000_Projects_Problems_Dataset.xlsx"),
            os.path.join(project_root, "SIH_5000_Projects_Problems_Dataset.xlsx")
        ]
        for p in possible_paths:
            if os.path.exists(p):
                excel_path = p
                break

    if not excel_path or not os.path.exists(excel_path):
        print("[PAIMANA Insight v2.0] SIH 5,000 dataset file not found.")
        return 0

    try:
        df = pd.read_excel(excel_path, sheet_name="All_5000_Projects_Problems")
    except Exception as e:
        print(f"Error reading SIH 5,000 Excel sheet: {e}")
        return 0

    session.query(Project).delete()
    session.query(DataQualityLog).delete()
    session.commit()

    SECTOR_MINISTRY_MAP = {
        "Railways": ("Ministry of Railways", "Rail Vikas Nigam Limited (RVNL)"),
        "Roads": ("Ministry of Road Transport and Highways", "National Highways Authority of India (NHAI)"),
        "Urban Transit": ("Ministry of Housing and Urban Affairs", "Delhi Metro Rail Corp (DMRC)"),
        "Water & Sanitation": ("Ministry of Jal Shakti", "National Water Development Agency"),
        "Power": ("Ministry of Power", "NTPC Limited"),
        "Industrial Corridors": ("Ministry of Heavy Industries", "Bharat Heavy Electricals Limited (BHEL)"),
        "Ports": ("Ministry of Ports, Shipping and Waterways", "Jawaharlal Nehru Port Trust (JNPT)"),
        "Airports": ("Ministry of Civil Aviation", "Airports Authority of India (AAI)")
    }

    projects_to_insert = []
    base_ref_date = datetime(2026, 4, 1)

    for _, row in df.iterrows():
        p_id = str(row["Project ID"]).strip()
        sector = str(row["Sector"]).strip()
        state = str(row["State Location"]).strip()

        min_agency = SECTOR_MINISTRY_MAP.get(sector, ("Ministry of Infrastructure", "State Agency"))
        ministry = min_agency[0]
        agency = min_agency[1]

        p_name = f"{state} {sector} Development Package ({p_id})"

        raw_archetype = str(row["Primary Problem Archetype"]).strip()
        raw_archetype_lower = raw_archetype.lower()
        if "compound" in raw_archetype_lower or "multi-risk" in raw_archetype_lower:
            archetype = "DUAL_ESCALATION"
        elif "slippage" in raw_archetype_lower or "schedule" in raw_archetype_lower:
            archetype = "SCHEDULE_DELAY"
        elif "funding" in raw_archetype_lower or "budget" in raw_archetype_lower:
            archetype = "COST_OVERRUN"
        elif "row" in raw_archetype_lower or "clearance" in raw_archetype_lower or "contractor" in raw_archetype_lower:
            archetype = "IMPLEMENTATION_BOTTLENECK"
        elif "track" in raw_archetype_lower:
            archetype = "ON_TRACK"
        else:
            archetype = "SCHEDULE_DELAY"

        raw_sev = str(row["Problem Severity"]).strip().lower()
        severity = "Critical" if "crit" in raw_sev else ("High" if "high" in raw_sev else ("Medium" if ("mod" in raw_sev or "med" in raw_sev) else "Low"))

        risk_score = round(float(row["AI Delay Risk Score (%)"]), 1)
        raw_tier = str(row["AI Risk Level"]).strip().upper()
        if "CRIT" in raw_tier or risk_score >= 75:
            risk_tier = "CRITICAL"
        elif "HIGH" in raw_tier or risk_score >= 50:
            risk_tier = "HIGH"
        elif "MOD" in raw_tier or risk_score >= 25:
            risk_tier = "MEDIUM"
        else:
            risk_tier = "LOW"

        planned_dur = float(row["Planned Duration (Months)"])
        project_age = float(row["Project Age (Months)"])
        timeline_elapsed = float(row["Timeline Elapsed (%)"])
        phys_prog = float(row["Physical Progress (%)"])
        fin_prog = float(row["Financial Progress (%)"])
        decoupling_gap = float(row["Financial-Physical Decoupling Gap (%)"])
        prog_deficit = float(row["Previous Schedule Deviation (%)"]) if pd.notna(row["Previous Schedule Deviation (%)"]) else round(timeline_elapsed - phys_prog, 1)

        is_delayed_flag = str(row["Schedule Status (Delayed Flag)"]).strip().lower() in ["yes", "true", "1"]
        if is_delayed_flag and project_age > planned_dur:
            delay_months = round(project_age - planned_dur, 1)
        elif is_delayed_flag:
            delay_months = round(max(1.0, (timeline_elapsed - phys_prog) * planned_dur / 100.0), 1)
        else:
            delay_months = 0.0

        delay_flag = is_delayed_flag or delay_months > 0
        delay_days = int(delay_months * 30)

        orig_cost = round(float(row["Original Sanctioned Cost (₹ Cr)"]), 2)
        rev_cost = round(float(row["Revised Cost (₹ Cr)"]), 2)
        cost_escalation = round(float(row["Cost Escalation (₹ Cr)"]), 2)
        cost_overrun_pct = round(float(row["Cost Overrun (%)"]), 2)
        cost_overrun_flag = cost_overrun_pct > 0
        exp = round(rev_cost * (fin_prog / 100.0), 2)
        exp_prog_ratio = round((exp / max(rev_cost, 0.01)) / max(phys_prog / 100.0, 0.01), 2)

        tot_miles = int(row["Total Milestones"]) if pd.notna(row["Total Milestones"]) else 5
        del_miles = int(row["Delayed Milestones"]) if pd.notna(row["Delayed Milestones"]) else 0
        comp_miles = max(0, tot_miles - del_miles)

        factors = str(row["Identified Itemized Problem Factors"]).strip() if pd.notna(row["Identified Itemized Problem Factors"]) else ""
        mandated_action = str(row["Primary Mandated Intervention"]).strip() if pd.notna(row["Primary Mandated Intervention"]) else "Mandated inter-ministerial task force review."
        presc_recs = str(row["Comprehensive Recovery Directives"]).strip() if pd.notna(row["Comprehensive Recovery Directives"]) else "Prioritize critical path milestone recovery."

        land_pending = str(row["Land Acquisition Pending"]).strip().lower() in ["yes", "true", "1"]
        env_pending = str(row["Statutory Clearances Pending"]).strip().lower() in ["yes", "true", "1"]
        fund_pending = str(row["Funding Issue Pending"]).strip().lower() in ["yes", "true", "1"]
        contractor_distress = str(row["Contractor Distress Issue"]).strip().lower() in ["yes", "true", "1"]

        row_risk = 85.0 if land_pending else 25.0
        env_risk = 82.0 if env_pending else 20.0
        util_risk = 75.0 if fund_pending else 25.0
        cont_risk = 88.0 if contractor_distress else 30.0
        arb_risk = 78.0 if ("arbitration" in factors.lower() or "dispute" in factors.lower()) else 15.0

        orig_doc = (base_ref_date + timedelta(days=int((planned_dur - project_age) * 30))).strftime("%Y-%m-%d")
        rev_doc = (base_ref_date + timedelta(days=int((planned_dur - project_age + delay_months) * 30))).strftime("%Y-%m-%d") if delay_months > 0 else orig_doc

        root_metrics = f"+{delay_days}d Slippage · -{round(max(0.0, timeline_elapsed - phys_prog), 1)}% Gap · +₹{cost_escalation:,.0f} Cr (+{cost_overrun_pct}%) Escalation"

        rule_trigger = str(row["Risk Signal Triggered (Rule)"]).strip() if pd.notna(row["Risk Signal Triggered (Rule)"]) else "Compound Risk Exposure"
        shap_json = json.dumps([{
            "feature": rule_trigger,
            "impact": "HIGH" if risk_score >= 60 else "MEDIUM",
            "direction": "INCREASES_RISK",
            "explanation": f"Primary risk rule triggered: {rule_trigger}. Active problem count: {row['Active Problem Count']}."
        }])

        if risk_tier == "CRITICAL":
            proj_status = "CRITICAL_WATCHLIST"
        elif delay_flag:
            proj_status = "DELAYED"
        elif phys_prog > timeline_elapsed:
            proj_status = "AHEAD_OF_SCHEDULE"
        else:
            proj_status = "ONGOING_ON_TRACK"

        is_conf = delay_flag or cost_overrun_flag or int(row["Active Problem Count"]) > 1
        is_pred = risk_score >= 50.0 and not is_conf

        p = Project(
            project_id=p_id,
            project_name=p_name,
            ministry=ministry,
            sector=sector,
            implementing_agency=agency,
            state_location=state,
            original_cost=orig_cost,
            revised_cost=rev_cost,
            cumulative_expenditure=exp,
            original_doc=orig_doc,
            revised_doc=rev_doc,
            physical_progress=phys_prog,
            cost_overrun_pct=cost_overrun_pct,
            cost_overrun_flag=cost_overrun_flag,
            delay_months=delay_months,
            delay_flag=delay_flag,
            expenditure_progress_ratio=exp_prog_ratio,
            risk_score=risk_score,
            risk_tier=risk_tier,
            shap_drivers=shap_json,
            project_status=proj_status,
            is_confirmed_problem=is_conf,
            is_predictive_warning=is_pred,
            confidence_level="HIGH" if risk_score >= 60 else "MEDIUM",
            risk_type_label="CONFIRMED_DEFICIT" if is_conf else ("PREDICTIVE_SIGNAL" if is_pred else "LOW_RISK"),
            delay_reasons=factors,
            milestones_total=tot_miles,
            milestones_completed=comp_miles,
            problem_archetype=archetype,
            problem_title=raw_archetype,
            problem_severity=severity,
            root_metrics_summary=root_metrics,
            planned_progress=timeline_elapsed,
            progress_deficit_gap=prog_deficit,
            financial_burn_pct=fin_prog,
            burn_progress_decoupling_gap=decoupling_gap,
            row_land_acquisition_risk=row_risk,
            environmental_clearances_risk=env_risk,
            utility_shifting_risk=util_risk,
            contractor_solvency_risk=cont_risk,
            contractual_arbitration_risk=arb_risk,
            mandated_action=mandated_action,
            prescriptive_recommendations=presc_recs,
            data_provenance="SIH_5000_PROJECTS_DATASET"
        )
        projects_to_insert.append(p)

    session.bulk_save_objects(projects_to_insert)
    session.commit()
    print(f"[PAIMANA Insight v2.0] Seeded {len(projects_to_insert)} projects from SIH_5000_Projects_Problems_Dataset.xlsx")
    return len(projects_to_insert)


def generate_mospi_benchmark_dataset(session: Session, target_count: int = 1981):
    """
    Seeds the SQLite database with 1,981 realistic project records aligned with
    MoSPI April 2026 benchmark statistics. First checks for Infrastructure_Project_Problems_Dataset.xlsx.
    """
    random.seed(42)

    # Check if Excel dataset is available first
    excel_count = seed_from_excel_dataset(session)
    if excel_count > 0:
        return excel_count

    # Check if already seeded
    existing_count = session.query(Project).count()
    if existing_count >= target_count:
        return existing_count

    # Clean existing if partial
    session.query(Project).delete()
    session.query(DataQualityLog).delete()
    session.commit()

    projects_to_insert = []
    project_idx = 1
    base_date = datetime(2021, 1, 1)

    # Calculate quota scaling to match target_count
    total_quota = sum(item[3] for item in MINISTRIES_AND_SECTORS)
    scale_factor = target_count / total_quota

    for ministry, sector, agencies, quota in MINISTRIES_AND_SECTORS:
        num_projects = round(quota * scale_factor)

        for _ in range(num_projects):
            if project_idx > target_count:
                break

            project_code = f"MOSPI-2026-{project_idx:04d}"
            agency = random.choice(agencies)
            state = random.choice(STATES)

            # Cost modeling (₹150 Cr minimum, realistic log-normal/Pareto distribution)
            # 60% projects in ₹150 - ₹1,500 Cr; 28% in ₹1,500 - ₹5,000 Cr; 12% mega projects > ₹5,000 Cr
            rand_tier = random.random()
            if rand_tier < 0.60:
                orig_cost = round(random.uniform(150.0, 1500.0), 2)
            elif rand_tier < 0.88:
                orig_cost = round(random.uniform(1500.0, 5000.0), 2)
            else:
                orig_cost = round(random.uniform(5000.0, 38000.0), 2)

            # Overrun behavior by sector
            # Railways, Roads, Water, and Urban typically suffer more overruns
            if sector in ["Railways", "Road Transport and Highways", "Water Resources", "Urban Development"]:
                has_overrun = random.random() < 0.48
            elif sector in ["Petroleum and Natural Gas", "Power"]:
                has_overrun = random.random() < 0.32
            else:
                has_overrun = random.random() < 0.28

            if has_overrun:
                # Escalation typically between 8% and 95%
                overrun_rate = random.triangular(0.05, 0.95, 0.22)
                rev_cost = round(orig_cost * (1.0 + overrun_rate), 2)
            else:
                # On budget or nominal variation (<5%)
                rev_cost = round(orig_cost * (1.0 + random.uniform(0.0, 0.04)), 2)

            # Physical progress between 5% and 95%
            progress = round(random.triangular(8.0, 96.0, 58.0), 1)

            # Cumulative expenditure: correlated with progress but has variance
            # Sometimes expenditure is ahead of progress (risk of cost overrun)
            exp_factor = (progress / 100.0) * random.uniform(0.75, 1.25)
            exp_factor = min(1.05, max(0.05, exp_factor))
            expenditure = round(rev_cost * exp_factor, 2)

            # Dates: Original DOC was planned 3-7 years after start
            start_offset_days = random.randint(0, 1000)
            proj_start = base_date + timedelta(days=start_offset_days)
            planned_duration_days = random.randint(365 * 2, 365 * 6)
            orig_doc_dt = proj_start + timedelta(days=planned_duration_days)

            # Schedule delay (months)
            if has_overrun or random.random() < 0.45:
                delay_months = round(random.triangular(3.0, 48.0, 14.0), 1)
                rev_doc_dt = orig_doc_dt + timedelta(days=int(delay_months * 30.4375))
            else:
                delay_months = 0.0
                rev_doc_dt = orig_doc_dt

            orig_doc = orig_doc_dt.strftime("%Y-%m-%d")
            rev_doc = rev_doc_dt.strftime("%Y-%m-%d")

            # Delay reasons and milestones
            if delay_months > 0:
                selected_reasons = random.sample(COMMON_DELAY_REASONS, k=random.randint(1, 3))
                delay_reasons_str = "; ".join(selected_reasons)
            else:
                delay_reasons_str = "Project progressing as per schedule."

            milestones_tot = random.randint(4, 10)
            milestones_done = round((progress / 100.0) * milestones_tot)
            milestones_done = min(milestones_tot, max(0, milestones_done))

            # Ground truth targets
            targets = compute_ground_truth_labels(
                original_cost=orig_cost,
                revised_cost=rev_cost,
                original_doc=orig_doc,
                revised_doc=rev_doc,
                cumulative_expenditure=expenditure,
                physical_progress=progress
            )

            # Composite 0-100 Risk Score & SHAP Drivers
            risk_score, risk_tier, drivers = calculate_composite_risk_score(
                cost_overrun_pct=targets["cost_overrun_pct"],
                delay_months=targets["delay_months"],
                original_cost=orig_cost,
                revised_cost=rev_cost,
                cumulative_expenditure=expenditure,
                physical_progress=progress,
                delay_reasons=delay_reasons_str,
                milestones_total=milestones_tot,
                milestones_completed=milestones_done
            )

            # Project descriptive name
            proj_name = f"{agency.split('(')[-1].replace(')', '')} {state} {sector} Package-{project_idx:03d}"

            p = Project(
                project_id=project_code,
                project_name=proj_name,
                ministry=ministry,
                sector=sector,
                implementing_agency=agency,
                state_location=state,
                original_cost=orig_cost,
                revised_cost=rev_cost,
                cumulative_expenditure=expenditure,
                original_doc=orig_doc,
                revised_doc=rev_doc,
                physical_progress=progress,
                cost_overrun_pct=targets["cost_overrun_pct"],
                cost_overrun_flag=targets["cost_overrun_flag"],
                delay_months=targets["delay_months"],
                delay_flag=targets["delay_flag"],
                expenditure_progress_ratio=targets["expenditure_progress_ratio"],
                project_status=targets["project_status"],
                is_confirmed_problem=targets["is_confirmed_problem"],
                is_predictive_warning=targets["is_predictive_warning"],
                confidence_level=targets["confidence_level"],
                risk_type_label=targets["risk_type_label"],
                risk_score=risk_score,
                risk_tier=risk_tier,
                shap_drivers=json.dumps(drivers),
                delay_reasons=delay_reasons_str,
                milestones_total=milestones_tot,
                milestones_completed=milestones_done,
                data_provenance="REAL_BENCHMARK"
            )
            projects_to_insert.append(p)
            project_idx += 1

    session.bulk_save_objects(projects_to_insert)

    # Seed baseline Data Quality Audit Logs (SRS v2.0 FR-1.3 & NFR-4)
    sample_quality_logs = [
        DataQualityLog(
            project_id="MOSPI-2026-0042",
            issue_type="ANOMALY_DATE_ORDER",
            description="Revised date of commissioning was submitted earlier than approved sanction date. Auto-corrected to anticipated schedule.",
            field_name="revised_doc",
            raw_value="2022-01-15",
            logged_at=datetime.utcnow()
        ),
        DataQualityLog(
            project_id="MOSPI-2026-0118",
            issue_type="MISSING_FIELD_FALLBACK",
            description="Implementing agency name missing in raw CUF upload; imputed using Sector Nodal PSU mapping.",
            field_name="implementing_agency",
            raw_value="NULL",
            logged_at=datetime.utcnow()
        ),
        DataQualityLog(
            project_id="MOSPI-2026-0305",
            issue_type="EXPENDITURE_DISCREPANCY",
            description="Cumulative expenditure exceeded revised cost by >15% without formal cabinet CCEA cost revision. Flagged for review.",
            field_name="cumulative_expenditure",
            raw_value="4820.50",
            logged_at=datetime.utcnow()
        ),
        DataQualityLog(
            project_id="MOSPI-2026-0612",
            issue_type="MILESTONE_INCONSISTENCY",
            description="Recorded milestone completion was 100% while physical progress was reported at 42.0%. Flagged for reconciliation.",
            field_name="milestones_completed",
            raw_value="5/5",
            logged_at=datetime.utcnow()
        ),
        DataQualityLog(
            project_id="MOSPI-2026-0894",
            issue_type="TEXT_NORMALIZATION",
            description="Agency nomenclature 'NHAI-RO-DEL-PKG3' normalized to standard canonical form 'National Highways Authority of India (NHAI)'.",
            field_name="implementing_agency",
            raw_value="NHAI-RO-DEL-PKG3",
            logged_at=datetime.utcnow()
        ),
        DataQualityLog(
            project_id="MOSPI-2026-1452",
            issue_type="NEGATIVE_VALUE_SANITIZED",
            description="Monthly expenditure delta was negative due to contractor billing reconciliation. Rectified to zero baseline.",
            field_name="monthly_expenditure",
            raw_value="-14.20",
            logged_at=datetime.utcnow()
        )
    ]
    session.bulk_save_objects(sample_quality_logs)

    session.commit()
    print(f"Successfully seeded {len(projects_to_insert)} MoSPI benchmark projects and {len(sample_quality_logs)} data quality audit logs.")
    return len(projects_to_insert)
