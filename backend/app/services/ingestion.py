import io
import json
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models import Project, DataQualityLog
from .labeling import compute_ground_truth_labels
from ..ml.risk_engine import calculate_composite_risk_score

COLUMN_MAPPINGS = {
    # Variations of project id
    "project_id": ["project_id", "project_code", "cuf_id", "proj_id", "id", "project id", "project code"],
    "project_name": ["project_name", "name", "project_title", "title", "project name", "work_name"],
    "ministry": ["ministry", "ministry_name", "department", "central_ministry", "ministry / department"],
    "sector": ["sector", "sub_sector", "sector_name", "infrastructure_sector"],
    "implementing_agency": ["implementing_agency", "agency", "psu", "executing_agency", "contractor_authority"],
    "state_location": ["state_location", "state", "location", "states", "region"],
    "original_cost": ["original_cost", "approved_cost", "sanctioned_cost", "baseline_cost", "cost_approved"],
    "revised_cost": ["revised_cost", "anticipated_cost", "latest_cost", "current_cost", "cost_revised"],
    "cumulative_expenditure": ["cumulative_expenditure", "expenditure", "spent", "total_expenditure", "financial_expenditure"],
    "original_doc": ["original_doc", "original_commissioning_date", "approved_doc", "doc_original", "planned_date"],
    "revised_doc": ["revised_doc", "revised_commissioning_date", "anticipated_doc", "doc_revised", "target_date"],
    "physical_progress": ["physical_progress", "progress_pct", "progress", "completion_pct", "physical_progress_pct"],
    "delay_reasons": ["delay_reasons", "reasons_for_delay", "bottlenecks", "delay_factors", "remarks"],
    "milestones_total": ["milestones_total", "total_milestones"],
    "milestones_completed": ["milestones_completed", "completed_milestones"]
}


def normalize_column_name(col: str) -> str:
    cleaned = col.strip().lower().replace("-", "_").replace(" ", "_").replace("/", "_")
    for canonical, variations in COLUMN_MAPPINGS.items():
        if cleaned in [v.lower().replace("-", "_").replace(" ", "_").replace("/", "_") for v in variations]:
            return canonical
    return cleaned


def ingest_records_from_df(df: pd.DataFrame, session: Session, provenance: str = "REAL") -> Dict[str, Any]:
    """
    Ingests and normalizes project records from a pandas DataFrame, logging anomalies per FR-1.3.
    """
    # Normalize headers
    col_map = {orig: normalize_column_name(orig) for orig in df.columns}
    df = df.rename(columns=col_map)

    processed_count = 0
    inserted_count = 0
    anomalies_count = 0

    for idx, row in df.iterrows():
        processed_count += 1
        row_dict = row.to_dict()

        proj_id = str(row_dict.get("project_id", f"PRJ-UP-{idx+1}")).strip()
        proj_name = str(row_dict.get("project_name", f"Infrastructure Project {idx+1}")).strip()
        ministry = str(row_dict.get("ministry", "Ministry of Road Transport and Highways")).strip()
        sector = str(row_dict.get("sector", "Road Transport and Highways")).strip()
        agency = str(row_dict.get("implementing_agency", "NHAI")).strip()
        state = str(row_dict.get("state_location", "Multi-State")).strip()

        # Parse costs with anomaly checks
        try:
            orig_cost = float(row_dict.get("original_cost", 150.0))
            if orig_cost < 150.0:
                # Flag CUF threshold check
                session.add(DataQualityLog(
                    project_id=proj_id,
                    issue_type="BELOW_CUF_THRESHOLD",
                    description=f"Project original cost ₹{orig_cost} Cr is below the ₹150 Cr threshold.",
                    field_name="original_cost",
                    raw_value=str(orig_cost)
                ))
                anomalies_count += 1
        except (ValueError, TypeError):
            orig_cost = 150.0
            session.add(DataQualityLog(
                project_id=proj_id,
                issue_type="INVALID_NUMERIC",
                description="Unable to parse original cost, defaulted to ₹150 Cr.",
                field_name="original_cost",
                raw_value=str(row_dict.get("original_cost"))
            ))
            anomalies_count += 1

        try:
            rev_cost = float(row_dict.get("revised_cost", orig_cost))
        except (ValueError, TypeError):
            rev_cost = orig_cost

        try:
            expenditure = float(row_dict.get("cumulative_expenditure", 0.0))
        except (ValueError, TypeError):
            expenditure = 0.0

        try:
            progress = float(row_dict.get("physical_progress", 0.0))
            if progress < 0 or progress > 100:
                session.add(DataQualityLog(
                    project_id=proj_id,
                    issue_type="PROGRESS_OUT_OF_BOUNDS",
                    description=f"Physical progress {progress}% is outside [0, 100] range.",
                    field_name="physical_progress",
                    raw_value=str(progress)
                ))
                progress = max(0.0, min(100.0, progress))
                anomalies_count += 1
        except (ValueError, TypeError):
            progress = 0.0

        orig_doc = str(row_dict.get("original_doc", "2025-12-31")).strip()
        rev_doc = str(row_dict.get("revised_doc", orig_doc)).strip()
        delay_reasons = str(row_dict.get("delay_reasons", "")).strip()

        try:
            milestones_tot = int(row_dict.get("milestones_total", 5))
            milestones_done = int(row_dict.get("milestones_completed", int(round(progress / 20.0))))
        except (ValueError, TypeError):
            milestones_tot = 5
            milestones_done = 0

        # Compute ground truth labels
        targets = compute_ground_truth_labels(
            original_cost=orig_cost,
            revised_cost=rev_cost,
            original_doc=orig_doc,
            revised_doc=rev_doc,
            cumulative_expenditure=expenditure,
            physical_progress=progress
        )

        # Compute risk score & drivers
        risk_score, risk_tier, drivers = calculate_composite_risk_score(
            cost_overrun_pct=targets["cost_overrun_pct"],
            delay_months=targets["delay_months"],
            original_cost=orig_cost,
            revised_cost=rev_cost,
            cumulative_expenditure=expenditure,
            physical_progress=progress,
            delay_reasons=delay_reasons,
            milestones_total=milestones_tot,
            milestones_completed=milestones_done
        )

        # Upsert into database
        existing = session.query(Project).filter(Project.project_id == proj_id).first()
        if existing:
            existing.project_name = proj_name
            existing.ministry = ministry
            existing.sector = sector
            existing.implementing_agency = agency
            existing.state_location = state
            existing.original_cost = orig_cost
            existing.revised_cost = rev_cost
            existing.cumulative_expenditure = expenditure
            existing.original_doc = orig_doc
            existing.revised_doc = rev_doc
            existing.physical_progress = progress
            existing.cost_overrun_pct = targets["cost_overrun_pct"]
            existing.cost_overrun_flag = targets["cost_overrun_flag"]
            existing.delay_months = targets["delay_months"]
            existing.delay_flag = targets["delay_flag"]
            existing.expenditure_progress_ratio = targets["expenditure_progress_ratio"]
            existing.project_status = targets["project_status"]
            existing.is_confirmed_problem = targets["is_confirmed_problem"]
            existing.is_predictive_warning = targets["is_predictive_warning"]
            existing.confidence_level = targets["confidence_level"]
            existing.risk_type_label = targets["risk_type_label"]
            existing.risk_score = risk_score
            existing.risk_tier = risk_tier
            existing.shap_drivers = json.dumps(drivers)
            existing.delay_reasons = delay_reasons
            existing.milestones_total = milestones_tot
            existing.milestones_completed = milestones_done
            existing.data_provenance = provenance
        else:
            p = Project(
                project_id=proj_id,
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
                delay_reasons=delay_reasons,
                milestones_total=milestones_tot,
                milestones_completed=milestones_done,
                data_provenance=provenance
            )
            session.add(p)
            inserted_count += 1

    session.commit()
    return {
        "processed": processed_count,
        "inserted_or_updated": processed_count,
        "anomalies_flagged": anomalies_count
    }
