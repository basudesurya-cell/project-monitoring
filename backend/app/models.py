from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey
)
from .database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(64), unique=True, index=True, nullable=False)
    project_name = Column(String(255), index=True, nullable=False)
    ministry = Column(String(128), index=True, nullable=False)
    sector = Column(String(128), index=True, nullable=False)
    implementing_agency = Column(String(128), index=True, nullable=True)
    state_location = Column(String(128), index=True, nullable=True)

    # Financials (in ₹ Crore)
    original_cost = Column(Float, nullable=False)
    revised_cost = Column(Float, nullable=False)
    cumulative_expenditure = Column(Float, default=0.0)

    # Schedule
    original_doc = Column(String(32), nullable=True)  # Date of Commissioning
    revised_doc = Column(String(32), nullable=True)
    physical_progress = Column(Float, default=0.0)    # Percentage 0-100

    # Ground-Truth Labels & Derived Analytics
    cost_overrun_pct = Column(Float, default=0.0)     # (revised - original)/original * 100
    cost_overrun_flag = Column(Boolean, default=False)
    delay_months = Column(Float, default=0.0)
    delay_flag = Column(Boolean, default=False)
    expenditure_progress_ratio = Column(Float, default=1.0)

    # AI Risk Scoring & Explainability
    risk_score = Column(Float, default=0.0)           # 0 - 100 Composite
    risk_tier = Column(String(32), default="LOW")     # LOW, MEDIUM, HIGH, CRITICAL
    shap_drivers = Column(Text, default="[]")         # JSON list of top contributing features

    # Governance & Monitoring
    project_status = Column(String(32), default="ONGOING_ON_TRACK", index=True) # ONGOING_ON_TRACK, DELAYED, CRITICAL_WATCHLIST, AHEAD_OF_SCHEDULE
    is_confirmed_problem = Column(Boolean, default=False, index=True)           # SRS v2.0 FR-5.3 & NFR-9: Confirmed existing delay/escalation
    is_predictive_warning = Column(Boolean, default=False, index=True)          # SRS v2.0 FR-5.3 & NFR-9: Model-based latent risk
    confidence_level = Column(String(16), default="HIGH")                       # HIGH, MEDIUM, LOW (FR-7.4)
    risk_type_label = Column(String(64), default="LOW_RISK")                    # CONFIRMED_DEFICIT, PREDICTIVE_SIGNAL, LOW_RISK
    delay_reasons = Column(Text, nullable=True)
    milestones_total = Column(Integer, default=5)
    milestones_completed = Column(Integer, default=0)

    # Problem Diagnostics & Archetypes (from Infrastructure_Project_Problems_Dataset.xlsx)
    problem_archetype = Column(String(64), nullable=True, index=True)
    problem_title = Column(String(255), nullable=True)
    problem_severity = Column(String(32), nullable=True, index=True)
    root_metrics_summary = Column(Text, nullable=True)
    planned_progress = Column(Float, default=0.0)
    progress_deficit_gap = Column(Float, default=0.0)
    financial_burn_pct = Column(Float, default=0.0)
    burn_progress_decoupling_gap = Column(Float, default=0.0)
    row_land_acquisition_risk = Column(Float, default=0.0)
    environmental_clearances_risk = Column(Float, default=0.0)
    utility_shifting_risk = Column(Float, default=0.0)
    contractor_solvency_risk = Column(Float, default=0.0)
    contractual_arbitration_risk = Column(Float, default=0.0)
    mandated_action = Column(Text, nullable=True)
    prescriptive_recommendations = Column(Text, nullable=True)

    # Provenance tracking (Constraint C-2)
    data_provenance = Column(String(32), default="REAL_BENCHMARK")  # REAL, REAL_BENCHMARK, SYNTHETIC, EXCEL_PROBLEMS_DATASET
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DataQualityLog(Base):
    __tablename__ = "data_quality_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(64), index=True, nullable=True)
    issue_type = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    field_name = Column(String(64), nullable=True)
    raw_value = Column(String(255), nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)


class ModelMetric(Base):
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(128), nullable=False)
    model_type = Column(String(64), nullable=False)  # ML_MODEL or STATISTICAL_BASELINE
    target_variable = Column(String(64), nullable=False)
    sector_filter = Column(String(64), default="ALL")
    r2_score = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    training_samples = Column(Integer, default=0)
    test_samples = Column(Integer, default=0)
    trained_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
