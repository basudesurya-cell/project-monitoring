from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    project_id: str
    project_name: str
    ministry: str
    sector: str
    implementing_agency: Optional[str] = None
    state_location: Optional[str] = None
    original_cost: float
    revised_cost: float
    cumulative_expenditure: float = 0.0
    original_doc: Optional[str] = None
    revised_doc: Optional[str] = None
    physical_progress: float = 0.0
    project_status: str = "ONGOING_ON_TRACK"
    delay_reasons: Optional[str] = None
    milestones_total: int = 5
    milestones_completed: int = 0
    data_provenance: str = "REAL_BENCHMARK"
    problem_archetype: Optional[str] = None
    problem_title: Optional[str] = None
    problem_severity: Optional[str] = None
    root_metrics_summary: Optional[str] = None
    planned_progress: Optional[float] = 0.0
    progress_deficit_gap: Optional[float] = 0.0
    financial_burn_pct: Optional[float] = 0.0
    burn_progress_decoupling_gap: Optional[float] = 0.0
    row_land_acquisition_risk: Optional[float] = 0.0
    environmental_clearances_risk: Optional[float] = 0.0
    utility_shifting_risk: Optional[float] = 0.0
    contractor_solvency_risk: Optional[float] = 0.0
    contractual_arbitration_risk: Optional[float] = 0.0
    mandated_action: Optional[str] = None
    prescriptive_recommendations: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProgressMilestonePoint(BaseModel):
    milestone: str
    date: str
    planned_progress: float
    actual_progress: Optional[float] = None
    projected_progress: Optional[float] = None
    gap: Optional[float] = None
    phase: str = "historical"


class ScheduleDelayAnalysis(BaseModel):
    is_delay_detected: bool
    delay_days: int
    progress_gap: float
    planned_progress: float
    actual_progress: float
    planned_completion_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    severity: str
    problem: str = "Schedule Delay"
    root_metrics: str = "Delay Days + Progress Gap"
    visualization: str = "Planned vs Actual Progress Graph"
    recommended_action: str
    recommendations: List[str]
    trajectory: List[ProgressMilestonePoint]


class BudgetWaterfallData(BaseModel):
    original_cost: float
    cumulative_expenditure: float
    revised_cost: float
    cost_escalation: float
    cost_overrun_pct: float
    financial_burn_pct: float
    unspent_budget: float
    cost_efficiency_index: float


class BurnVsProgressPoint(BaseModel):
    stage: str
    time_label: str
    financial_burn_pct: float
    physical_progress_pct: float
    decoupling_gap: float


class MilestoneSlippagePoint(BaseModel):
    milestone: str
    planned_period: str
    slippage_months: float
    status: str
    primary_impediment: str


class BottleneckFactor(BaseModel):
    factor: str
    impact_score: int
    status: str
    details: str


class AvailableGraphItem(BaseModel):
    id: str
    title: str
    icon: str
    category: str
    description: str


class ProblemDiagnosticsResponse(BaseModel):
    problem_type: str
    problem_title: str
    root_metrics_summary: str
    severity: str
    recommended_action: str
    recommendations: List[str]
    default_graph_id: str
    available_graphs: List[AvailableGraphItem]
    progress_curve: List[ProgressMilestonePoint]
    budget_waterfall: BudgetWaterfallData
    burn_vs_progress: List[BurnVsProgressPoint]
    milestone_slippage: List[MilestoneSlippagePoint]
    bottleneck_factors: List[BottleneckFactor]
    # Backwards compatibility fields for schedule_delay
    is_delay_detected: Optional[bool] = False
    delay_days: Optional[int] = 0
    progress_gap: Optional[float] = 0.0
    planned_progress: Optional[float] = 0.0
    actual_progress: Optional[float] = 0.0
    planned_completion_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    trajectory: Optional[List[ProgressMilestonePoint]] = []
    problem: Optional[str] = None
    root_metrics: Optional[str] = None
    visualization: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    cost_overrun_pct: float
    cost_overrun_flag: bool
    delay_months: float
    delay_flag: bool
    expenditure_progress_ratio: float
    is_confirmed_problem: bool = False
    is_predictive_warning: bool = False
    confidence_level: str = "HIGH"
    risk_type_label: str = "LOW_RISK"
    risk_score: float
    risk_tier: str
    shap_drivers: Optional[str] = "[]"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    schedule_delay: Optional[ScheduleDelayAnalysis] = None
    diagnostics: Optional[ProblemDiagnosticsResponse] = None

    class Config:
        from_attributes = True


class PaginatedProjectsResponse(BaseModel):
    items: List[ProjectResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class SectorSummary(BaseModel):
    sector: str
    project_count: int
    total_revised_cost: float
    avg_cost_overrun_pct: float
    avg_delay_months: float
    avg_risk_score: float


class MinistrySummary(BaseModel):
    ministry: str
    project_count: int
    total_revised_cost: float
    critical_count: int


class PortfolioSummaryResponse(BaseModel):
    total_projects: int
    total_original_cost: float       # In ₹ Cr
    total_revised_cost: float        # In ₹ Cr
    total_expenditure: float         # In ₹ Cr
    total_cost_escalation: float     # revised - original in ₹ Cr
    avg_cost_overrun_pct: float
    avg_delay_months: float
    critical_risk_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    sectors: List[SectorSummary]
    top_ministries: List[MinistrySummary]
    provenance_breakdown: Dict[str, int]


class EarlyWarningProject(BaseModel):
    project_id: str
    project_name: str
    ministry: str
    sector: str
    revised_cost: float              # Financial exposure in ₹ Cr
    cost_overrun_pct: float
    delay_months: float
    risk_score: float
    risk_tier: str
    primary_driver: str
    confidence_level: str = "HIGH"
    is_confirmed_problem: bool = False
    is_predictive_warning: bool = False
    risk_type_label: str = "CONFIRMED_DEFICIT"
    project_status: str = "DELAYED"
    implementing_agency: Optional[str] = None
    delay_days: Optional[int] = None
    progress_gap: Optional[float] = None
    schedule_delay_severity: Optional[str] = None
    schedule_delay_action: Optional[str] = None
    schedule_delay: Optional[ScheduleDelayAnalysis] = None
    problem_type: Optional[str] = None
    problem_archetype: Optional[str] = None
    problem_title: Optional[str] = None
    problem_severity: Optional[str] = None
    root_metrics_summary: Optional[str] = None
    planned_progress: Optional[float] = None
    progress_deficit_gap: Optional[float] = None
    financial_burn_pct: Optional[float] = None
    row_land_acquisition_risk: Optional[float] = None
    environmental_clearances_risk: Optional[float] = None
    utility_shifting_risk: Optional[float] = None
    contractor_solvency_risk: Optional[float] = None
    contractual_arbitration_risk: Optional[float] = None
    mandated_action: Optional[str] = None
    prescriptive_recommendations: Optional[str] = None
    delay_reasons: Optional[str] = None
    diagnostics: Optional[ProblemDiagnosticsResponse] = None


class PeerBenchmarkResponse(BaseModel):
    project_id: str
    project_name: str
    sector: str
    cost_band: str
    project_cost_overrun_pct: float
    sector_avg_cost_overrun_pct: float
    project_delay_months: float
    sector_avg_delay_months: float
    project_progress: float
    sector_avg_progress: float
    project_risk_score: float
    sector_avg_risk_score: float
    percentile_rank_in_sector: float  # e.g., higher than 84% of peers in delay


class CUFFeatureImportance(BaseModel):
    feature_name: str
    cuf_field_code: str
    importance_score: float
    correlation_with_overrun: str
    category: str


class ProposedMissingVariable(BaseModel):
    variable_name: str
    dimension: str
    expected_predictive_lift: str
    data_source_proposal: str
    justification: str


class CUFGapAnalysisResponse(BaseModel):
    existing_cuf_features: List[CUFFeatureImportance]
    proposed_missing_variables: List[ProposedMissingVariable]
    summary_insight: str


class ModelMetricItem(BaseModel):
    model_name: str
    model_type: str
    target_variable: str
    r2_score: Optional[float] = None
    rmse: Optional[float] = None
    mae: Optional[float] = None
    mape: Optional[float] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    training_samples: int
    test_samples: int
    notes: Optional[str] = None


class ModelBenchmarkResponse(BaseModel):
    metrics: List[ModelMetricItem]
    comparison_summary: str
    recommended_model: str


class AssistantQueryRequest(BaseModel):
    query: str
    context_filters: Optional[Dict[str, Any]] = None


class AssistantQueryResponse(BaseModel):
    answer: str
    grounding_data: Dict[str, Any]
    suggested_followups: List[str]


class RetrainRequest(BaseModel):
    sector: Optional[str] = "ALL"


class RetrainResponse(BaseModel):
    status: str
    sector: str
    records_trained: int
    metrics: Dict[str, Any]
    message: str


class IngestResponse(BaseModel):
    status: str
    records_processed: int
    records_inserted: int
    records_flagged_anomalies: int
    message: str


class DistributionMetric(BaseModel):
    count: int
    mean: float
    median: float
    std: float
    min: float
    max: float
    p25: float
    p75: float
    iqr: float


class DescriptiveStatisticsResponse(BaseModel):
    total_projects: int
    scope: str
    metrics: Dict[str, DistributionMetric]
    status_distribution: Dict[str, int]
    confirmed_problem_count: int
    predictive_warning_count: int
    interpretation: str


class StateSummaryResponse(BaseModel):
    state: str
    total_projects: int
    active_projects: int
    completed_projects: int
    delayed_projects: int
