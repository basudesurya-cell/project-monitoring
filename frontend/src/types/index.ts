export interface SHAPDriver {
  feature: string;
  impact: string;
  direction: string;
  explanation: string;
}

export interface ProgressMilestonePoint {
  milestone: string;
  date: string;
  planned_progress: number;
  actual_progress?: number | null;
  projected_progress?: number | null;
  gap?: number | null;
  phase: string;
}

export interface ScheduleDelayAnalysis {
  is_delay_detected: boolean;
  delay_days: number;
  progress_gap: number;
  planned_progress: number;
  actual_progress: number;
  planned_completion_date?: string | null;
  actual_completion_date?: string | null;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  problem: string;
  root_metrics: string;
  visualization: string;
  recommended_action: string;
  recommendations: string[];
  trajectory: ProgressMilestonePoint[];
}

export interface BudgetWaterfallData {
  original_cost: number;
  cumulative_expenditure: number;
  revised_cost: number;
  cost_escalation: number;
  cost_overrun_pct: number;
  financial_burn_pct: number;
  unspent_budget: number;
  cost_efficiency_index: number;
}

export interface BurnVsProgressPoint {
  stage: string;
  time_label: string;
  financial_burn_pct: number;
  physical_progress_pct: number;
  decoupling_gap: number;
}

export interface MilestoneSlippagePoint {
  milestone: string;
  planned_period: string;
  slippage_months: number;
  status: string;
  primary_impediment: string;
}

export interface BottleneckFactor {
  factor: string;
  impact_score: number;
  status: string;
  details: string;
}

export interface AvailableGraphItem {
  id: string;
  title: string;
  icon: string;
  category: string;
  description: string;
}

export interface ProblemDiagnostics {
  problem_type: 'COST_OVERRUN' | 'SCHEDULE_DELAY' | 'DUAL_ESCALATION' | 'IMPLEMENTATION_BOTTLENECK' | 'ON_TRACK';
  problem_title: string;
  root_metrics_summary: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  recommended_action: string;
  recommendations: string[];
  default_graph_id: string;
  available_graphs: AvailableGraphItem[];
  progress_curve: ProgressMilestonePoint[];
  budget_waterfall: BudgetWaterfallData;
  burn_vs_progress: BurnVsProgressPoint[];
  milestone_slippage: MilestoneSlippagePoint[];
  bottleneck_factors: BottleneckFactor[];
  is_delay_detected?: boolean;
  delay_days?: number;
  progress_gap?: number;
  planned_progress?: number;
  actual_progress?: number;
  planned_completion_date?: string | null;
  actual_completion_date?: string | null;
  trajectory?: ProgressMilestonePoint[];
  problem?: string;
  root_metrics?: string;
  visualization?: string;
}

export interface Project {
  id: number;
  project_id: string;
  project_name: string;
  ministry: string;
  sector: string;
  implementing_agency?: string;
  state_location?: string;
  original_cost: number;
  revised_cost: number;
  cumulative_expenditure: number;
  original_doc?: string;
  revised_doc?: string;
  physical_progress: number;
  cost_overrun_pct: number;
  cost_overrun_flag: boolean;
  delay_months: number;
  delay_flag: boolean;
  expenditure_progress_ratio: number;
  risk_score: number;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  project_status?: 'ONGOING_ON_TRACK' | 'DELAYED' | 'CRITICAL_WATCHLIST' | 'AHEAD_OF_SCHEDULE';
  is_confirmed_problem?: boolean;
  is_predictive_warning?: boolean;
  confidence_level?: 'HIGH' | 'MEDIUM' | 'LOW';
  risk_type_label?: string;
  shap_drivers?: string;
  delay_reasons?: string;
  milestones_total: number;
  milestones_completed: number;
  data_provenance: string;
  created_at?: string;
  updated_at?: string;
  schedule_delay?: ScheduleDelayAnalysis;
  diagnostics?: ProblemDiagnostics;
  problem_archetype?: string;
  problem_title?: string;
  problem_severity?: string;
  root_metrics_summary?: string;
  planned_progress?: number;
  progress_deficit_gap?: number;
  financial_burn_pct?: number;
  burn_progress_decoupling_gap?: number;
  row_land_acquisition_risk?: number;
  environmental_clearances_risk?: number;
  utility_shifting_risk?: number;
  contractor_solvency_risk?: number;
  contractual_arbitration_risk?: number;
  mandated_action?: string;
  prescriptive_recommendations?: string;
}

export interface PaginatedProjects {
  items: Project[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SectorSummary {
  sector: string;
  project_count: number;
  total_revised_cost: number;
  avg_cost_overrun_pct: number;
  avg_delay_months: number;
  avg_risk_score: number;
}

export interface MinistrySummary {
  ministry: string;
  project_count: number;
  total_revised_cost: number;
  critical_count: number;
}

export interface PortfolioSummary {
  total_projects: number;
  total_original_cost: number;
  total_revised_cost: number;
  total_expenditure: number;
  total_cost_escalation: number;
  avg_cost_overrun_pct: number;
  avg_delay_months: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  sectors: SectorSummary[];
  top_ministries: MinistrySummary[];
  provenance_breakdown: Record<string, number>;
}

export interface EarlyWarningProject {
  project_id: string;
  project_name: string;
  ministry: string;
  sector: string;
  revised_cost: number;
  cost_overrun_pct: number;
  delay_months: number;
  risk_score: number;
  risk_tier: string;
  primary_driver: string;
  confidence_level?: 'HIGH' | 'MEDIUM' | 'LOW';
  is_confirmed_problem?: boolean;
  is_predictive_warning?: boolean;
  risk_type_label?: string;
  project_status?: string;
  implementing_agency?: string;
  delay_days?: number;
  progress_gap?: number;
  schedule_delay_severity?: string;
  schedule_delay_action?: string;
  schedule_delay?: ScheduleDelayAnalysis;
  problem_type?: string;
  problem_archetype?: string;
  problem_title?: string;
  problem_severity?: string;
  root_metrics_summary?: string;
  planned_progress?: number;
  progress_deficit_gap?: number;
  financial_burn_pct?: number;
  burn_progress_decoupling_gap?: number;
  row_land_acquisition_risk?: number;
  environmental_clearances_risk?: number;
  utility_shifting_risk?: number;
  contractor_solvency_risk?: number;
  contractual_arbitration_risk?: number;
  mandated_action?: string;
  prescriptive_recommendations?: string;
  delay_reasons?: string;
  diagnostics?: ProblemDiagnostics;
}

export interface DistributionMetric {
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  iqr: number;
}

export interface DescriptiveStatisticsResponse {
  total_projects: number;
  scope: string;
  metrics: {
    original_cost: DistributionMetric;
    revised_cost: DistributionMetric;
    cumulative_expenditure: DistributionMetric;
    physical_progress: DistributionMetric;
    cost_overrun_pct: DistributionMetric;
    delay_months: DistributionMetric;
    risk_score: DistributionMetric;
  };
  status_distribution: Record<string, number>;
  confirmed_problem_count: number;
  predictive_warning_count: number;
  interpretation: string;
}

export interface PeerBenchmark {
  project_id: string;
  project_name: string;
  sector: string;
  cost_band: string;
  project_cost_overrun_pct: number;
  sector_avg_cost_overrun_pct: number;
  project_delay_months: number;
  sector_avg_delay_months: number;
  project_progress: number;
  sector_avg_progress: number;
  project_risk_score: number;
  sector_avg_risk_score: number;
  percentile_rank_in_sector: number;
}

export interface CUFFeatureImportance {
  feature_name: string;
  cuf_field_code: string;
  importance_score: number;
  correlation_with_overrun: string;
  category: string;
}

export interface ProposedMissingVariable {
  variable_name: string;
  dimension: string;
  expected_predictive_lift: string;
  data_source_proposal: string;
  justification: string;
}

export interface CUFGapAnalysis {
  existing_cuf_features: CUFFeatureImportance[];
  proposed_missing_variables: ProposedMissingVariable[];
  summary_insight: string;
}

export interface ModelMetricItem {
  model_name: string;
  model_type: string;
  target_variable: string;
  r2_score?: number;
  rmse?: number;
  mae?: number;
  mape?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  training_samples: number;
  test_samples: number;
  notes?: string;
}

export interface ModelBenchmark {
  metrics: ModelMetricItem[];
  comparison_summary: string;
  recommended_model: string;
}

export interface AssistantResponse {
  answer: string;
  grounding_data: Record<string, unknown>;
  suggested_followups: string[];
}

export interface DataQualityLogItem {
  id: number;
  project_id: string;
  issue_type: string;
  description: string;
  field_name?: string;
  raw_value?: string;
  logged_at?: string;
}

export interface FieldInterventionNote {
  project_id: string;
  author_role: string;
  action_type: 'CLEARANCE_EXPEDITED' | 'RETENDERING_ISSUED' | 'FUNDS_DISBURSED' | 'PRAGATI_ESCALATED' | 'GENERAL_NOTE';
  note_text: string;
  timestamp: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: 'analyst' | 'officer' | 'admin';
  department?: string;
  agency?: string;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  role: 'analyst' | 'officer' | 'admin';
}

export interface StateSummary {
  state: string;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  delayed_projects: number;
}

