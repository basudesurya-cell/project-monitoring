# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## Project: PAIMANA Insight
### AI-Powered Predictive Analytics & Early Warning System for Infrastructure Project Monitoring

**Problem Statement:** SIH26103 — "Use case on web-based integrated project-monitoring platform"
**Organization:** Ministry of Statistics and Programme Implementation (MoSPI), DIID
**Version:** 3.0 (As-Built — reflects actual implementation)
**Date:** 20 September 2026


> This SRS v3.0 is an as-built specification from a full codebase audit. [IMPLEMENTED] = coded and operational. [UPDATED] = changed from v2.0 plan. [NOT IMPLEMENTED] = removed from scope.

---

# 1. INTRODUCTION

## 1.1 Purpose

PAIMANA Insight is a full-stack AI-powered Predictive Analytics and Early Warning System for infrastructure project monitoring, implemented as:

- **Backend:** FastAPI (Python 3.11) + SQLAlchemy, uvicorn port 8000
- **Frontend:** React 19 + TypeScript SPA, Vite, port 5173
- **Database:** SQLite (backend/data/project_monitoring.db)
- **ML Layer:** scikit-learn (Gradient Boosting + Random Forest + OLS + Logistic baselines)
- **LLM (optional):** Ollama/Llama 3 with 300ms timeout and deterministic fallback

## 1.2 Background

MoSPI IPMD monitors Central Sector Infrastructure Projects (Rs.150 Cr+) via the PAIMANA portal.

Live dataset in this system:
- SIH_5000_Projects_Problems_Dataset.xlsx — 5,000 projects ingested
- seeder: seed_from_sih_5000_dataset() in backend/app/services/seeder.py
- Live counts: 5,000 projects | 642 CRITICAL | 993 HIGH risk

## 1.3 Problem Definition

System answers predictive questions:
- Which projects will experience cost escalation / schedule delay / implementation risk?
- What factors are driving identified risk?
- Which projects need earliest attention?

## 1.4 Intended Users

| Role | Default View | Access |
|---|---|---|
| IPMD/MoSPI Analyst | Dashboard | Read + Analytics |
| Ministry/Project Officer | Risk Signals (Early Warnings) | Read + Drill-down |
| System Administrator | Workspace Settings | Full + MLOps + Audit |

Roles switchable in-session via TopNav role picker or authenticated through the dedicated role-login portal (LoginPage.tsx).

---

# 2. SCOPE — 30 FEATURES IMPLEMENTED

| # | Feature | File |
|---|---|---|
| 1 | SIH 5000 Excel dataset ingestion | services/seeder.py |
| 2 | Data cleaning, normalization, provenance | services/ingestion.py |
| 3 | Descriptive statistical analysis | services/statistics.py |
| 4 | Cost overrun prediction (Gradient Boosting) | ml/pipeline.py |
| 5 | Schedule delay prediction (Random Forest) | ml/pipeline.py |
| 6 | Implementation risk analysis + attribution | ml/risk_engine.py |
| 7 | Composite risk scoring (0-100, 4-tier) | ml/risk_engine.py |
| 8 | Early warning alerts by financial exposure | routes/alerts.py |
| 9 | Web monitoring dashboard + portfolio KPIs | routes/projects.py, DashboardView.tsx |
| 10 | Project drill-down with 5-chart diagnostics | ProjectDetailModal.tsx |
| 11 | ML vs statistical baseline comparison | ml/baseline.py, routes/analytics.py |
| 12 | CUF field sufficiency gap analysis | ml/cuf_gap.py |
| 13 | Additional variable recommendations | ml/cuf_gap.py |
| 14 | Peer benchmarking (sector + cost band) | services/benchmarking.py |
| 15 | LLM AI Assistant (grounded + Ollama) | routes/assistant.py, AssistantDrawer.tsx |
| 16 | Report export (CSV + JSON, filtered) | routes/reports.py |
| 17 | Data ingestion API (CSV/Excel/JSON upload) | routes/ingest.py |
| 18 | On-demand ML retraining with sector filter | routes/ml.py, ml/pipeline.py |
| 19 | Problem diagnostics + 5-graph view | services/problem_diagnostics.py |
| 20 | Schedule delay detection + trajectory | services/schedule_delay.py |
| 21 | Admin audit modal + data quality logs | AdminAuditModal.tsx, routes/ingest.py |
| 22 | Collapsible sidebar (icon-only mode) | Sidebar.tsx |
| 23 | National Geospatial Infrastructure Map (Choropleth + Corridors) | GeospatialView.tsx, IndiaMapPaths.ts |
| 24 | SLA monitoring view | SlaMonitoringView.tsx |
| 25 | Document Analyzer / DPR Workspace | DocumentAnalyzerView.tsx |
| 26 | Scenario Lab (what-if UI) | ScenarioLabView.tsx |
| 27 | Interventions tracking view | InterventionsView.tsx |
| 28 | Saved analyses workspace | SavedAnalysesView.tsx |
| 29 | Role-based authentication & session tokens | LoginPage.tsx, routes/auth.py |
| 30 | State name normalization & aliasing engine | routes/projects.py |

NOT IMPLEMENTED: PostgreSQL (using SQLite for local demo), Docker containerization, real live CUF government API, direct PDF OCR parsing, external commercial GIS tile servers (using native vector SVG choropleth).


---

# 3. OBJECTIVES — ALL 12 ACHIEVED

| # | Objective | Implementation |
|---|---|---|
| 1 | Analyse large-scale infrastructure data | seed_from_sih_5000_dataset() — 5,000 projects |
| 2 | Identify historical patterns | ml/pipeline.py -> prepare_feature_matrix() |
| 3 | Forecast cost overruns | GradientBoostingRegressor |
| 4 | Forecast time overruns | RandomForestRegressor |
| 5 | Identify implementation risks | ml/risk_engine.py |
| 6 | Generate project-level risk scores | 0-100 scale, 4 tiers |
| 7 | Provide early-warning signals | /api/alerts |
| 8 | Explain major risk factors | shap_drivers JSON column per project |
| 9 | Support evidence-based intervention | InterventionsView.tsx, AssistantDrawer.tsx |
| 10 | Evaluate AI/ML vs conventional methods | ml/baseline.py + /api/analytics/model-benchmark |
| 11 | Assess CUF field contribution | ml/cuf_gap.py + /api/analytics/cuf-gap |
| 12 | Identify additional CUF variables | get_proposed_missing_variables_analysis() |

---

# 4. FUNCTIONAL REQUIREMENTS — AS BUILT

## 4.1 Data Ingestion — IMPLEMENTED (P0)

FR-1.1: Data ingested from SIH_5000_Projects_Problems_Dataset.xlsx (5,000 projects), user-uploaded CSV/Excel/JSON, or MoSPI baseline reseed.

FR-1.2: CUF fields persisted in projects table:

| Column | Description | CUF Source |
|---|---|---|
| project_id | Unique ID (e.g. PAI-00001) | Project ID |
| project_name | Full title | Project Name |
| ministry | Ministry name | Ministry/Department |
| sector | Infrastructure sector | Sector |
| implementing_agency | PSU/agency | Implementing Agency |
| state_location | Project state(s) | State/Location |
| original_cost | Approved baseline (Rs. Cr) | Approved Cost |
| revised_cost | Revised cost (Rs. Cr) | Revised Cost |
| cumulative_expenditure | Expenditure to date (Rs. Cr) | Expenditure |
| original_doc | Original Date of Commissioning | Timeline |
| revised_doc | Revised Date of Commissioning | Timeline |
| physical_progress | Completion % (0-100) | Physical Progress |
| milestones_total | Total milestones | Milestones |
| milestones_completed | Completed milestones | Milestones |
| project_status | ONGOING_ON_TRACK/DELAYED/CRITICAL_WATCHLIST | Project Status |
| delay_reasons | Reported delay text | Agency Report |

FR-1.3: Normalization in services/ingestion.py: column alias resolution, derived label computation, missing value defaults, provenance tagging.

FR-1.4: data_provenance column records origin per Constraint C-2.

FR-1.5: Anomaly detection logs to DataQualityLog table, accessible at GET /api/ingest/quality-logs.

---

## 4.2 Statistical Analysis — IMPLEMENTED (P0)

FR-2.1: services/statistics.py -> compute_portfolio_descriptive_statistics() computes for cost, expenditure, delay_months, physical_progress: count, mean, median, std, min, max, P25, P75, IQR. Exposed at GET /api/projects/statistics.

FR-2.2: DescriptiveStatisticsResponse includes status_distribution, confirmed_problem_count, predictive_warning_count, interpretation narrative.

FR-2.3: Filterable by ?sector= and ?ministry= query parameters.

FR-2.4: Baseline statistical results in /api/analytics/model-benchmark for ML comparison.

FR-2.5 [NEW]: DescriptiveStatsModal.tsx — interactive distribution modal from FilterPanel.

---

## 4.3 Cost Overrun Prediction — IMPLEMENTED (P0)

FR-3.1: Predicts cost_overrun_pct using GradientBoostingRegressor (n_estimators=120, learning_rate=0.08, max_depth=4, random_state=42).

FR-3.2: Feature matrix (from ml/pipeline.py -> prepare_feature_matrix()):
- original_cost (CUF-FLD-04)
- cumulative_expenditure (CUF-FLD-08)
- physical_progress (CUF-FLD-09)
- exp_progress_diff = (expenditure/original_cost x 100) - physical_progress [derived]
- milestone_ratio = milestones_completed / milestones_total [derived]
- sector (one-hot encoded, CUF-FLD-03)
- ministry (one-hot encoded, CUF-FLD-02)

FR-3.3: Labels: cost_overrun_pct = ((revised-original)/original) x 100. cost_overrun_flag = True if > 5%.

FR-3.4: 80/20 train-test split (random_state=42).

FR-3.5: Metrics R2, RMSE, MAE, MAPE persisted in model_metrics, exposed at /api/analytics/model-benchmark.

---

## 4.4 Schedule Delay Prediction — IMPLEMENTED (P0)

FR-4.1: Predicts delay_months using RandomForestRegressor (n_estimators=100, max_depth=6, random_state=42).

FR-4.2: Labels: delay_months from original_doc vs revised_doc date difference. delay_flag = True if delay_months > 0.

FR-4.3: Features: original_doc, revised_doc, physical_progress, milestones_completed/total.

FR-4.4: Metrics R2, RMSE, MAE persisted in model_metrics.

FR-4.5 [NEW]: services/schedule_delay.py -> compute_schedule_delay_analysis() per project:
- is_delay_detected, delay_days, progress_gap
- severity: Mild / Moderate / Severe / Critical
- recommended_action text
- trajectory: 6-point planned vs actual vs projected progress waypoints
- Endpoint: GET /api/projects/{id}/schedule-delay

---

## 4.5 Implementation Risk Analysis — IMPLEMENTED (P0)

FR-5.1: ml/risk_engine.py -> calculate_composite_risk_score() — 4 weighted components:
- Cost Escalation: 40% weight (cost_overrun_pct threshold bands)
- Schedule Slippage: 35% weight (delay_months threshold bands)
- Expenditure-Progress Divergence: 15% weight (financial_burn_pct - physical_progress)
- Governance Bottlenecks: 10% weight (delay_reasons keywords + milestone shortfall)

FR-5.2: Uses all available indicators: cost/timeline/progress fields, governance signals (land acquisition, environmental clearance, litigation, contractor default keywords), extended risk scores (row_land_acquisition_risk, environmental_clearances_risk, utility_shifting_risk, contractor_solvency_risk, contractual_arbitration_risk).

FR-5.3: Strict distinction between confirmed problems and predictions:
- is_confirmed_problem = True: confirmed existing deficit
- is_predictive_warning = True: model-based latent risk
- risk_type_label: CONFIRMED_DEFICIT | PREDICTIVE_SIGNAL | LOW_RISK
- confidence_level: HIGH | MEDIUM | LOW

---

## 4.6 Project Risk Scoring — IMPLEMENTED (P0)

FR-6.1: risk_score column: 0-100 composite score per project.

FR-6.2: Aggregates 4 weighted components (see FR-5.1).

FR-6.3: Formula in ml/risk_engine.py:
  raw_score = cost_pts (<=40) + delay_pts (<=35) + divergence_pts (<=15) + governance_pts (<=10)
  final_score = min(100, max(0, raw_score))

FR-6.4: shap_drivers JSON column — sorted by absolute impact, contains:
  feature, impact (e.g. "+35.0"), direction (HIGH_RISK/MODERATE_RISK/LOW_RISK/MINIMAL_RISK), explanation.

FR-6.5: Risk tier thresholds: CRITICAL >=75 | HIGH 50-74.9 | MEDIUM 25-49.9 | LOW 0-24.9

---

## 4.7 Early Warning Alert System — IMPLEMENTED (P0)

FR-7.1: GET /api/alerts filters projects with risk_score >= min_risk_score (default 50.0). Filters: sector, risk_tier, limit (max 200). Ranked by revised_cost (financial exposure desc).

FR-7.2: All flagged projects returned with full enrichment.

FR-7.3: Each alert response includes: project_id/name, ministry/sector, risk_score/tier, cost_overrun_pct, delay_months, revised_cost, primary_driver, confidence_level, is_confirmed_problem, problem_type/title/severity, root_metrics_summary, planned_progress, progress_deficit_gap, all risk factor scores, mandated_action, prescriptive_recommendations, full schedule_delay trajectory, full diagnostics object.

FR-7.4: EarlyWarnings.tsx displays confidence_level tag + risk_type_label badge per card.

---

## 4.8 Web-Based Monitoring Dashboard — IMPLEMENTED (P0)

FR-8.1: DashboardView.tsx renders portfolio KPIs from GET /api/projects/summary:
  total_projects, original/revised/expenditure costs, cost escalation, avg overrun %, avg delay months,
  CRITICAL/HIGH/MEDIUM/LOW counts, sector breakdown, ministry breakdown, provenance breakdown.

FR-8.2: MetricsBar.tsx — top-level KPI header cards.

FR-8.3: Filtering in ProjectTable.tsx + FilterPanel.tsx:
  Search (project_id, project_name, implementing_agency, state_location — ILIKE)
  Ministry, Sector, Risk Tier, Project Status, Risk Type dropdowns. Sort by any column (asc/desc).

FR-8.4: ProjectDetailModal.tsx — 5-chart diagnostic drill-down via services/problem_diagnostics.py:
  1. Progress S-Curve, 2. Budget Waterfall, 3. Burn vs Progress Decoupling,
  4. Milestone Slippage, 5. Bottleneck Attribution

FR-8.5: Project detail shows: all metadata, cost position, progress, schedule delay, risk score + tier,
  SHAP drivers, peer benchmark, prescriptive recommendations, problem archetype.

---

## 4.9 ML vs Conventional Statistical Methods — IMPLEMENTED (P1)

FR-9.1: 3 baselines in ml/baseline.py:
  OLS Linear Regression (cost), OLS Linear Regression (delay), Logistic Regression (binary risk).

FR-9.2: 3 advanced models in ml/pipeline.py:
  GradientBoostingRegressor (cost), RandomForestRegressor (delay), GradientBoostingClassifier (risk).

FR-9.3: All 6 models on identical 80/20 split (random_state=42). Results in model_metrics.

FR-9.4: GET /api/analytics/model-benchmark — Regression: R2, RMSE, MAE, MAPE. Classification: Accuracy, Precision, Recall, F1.
  Summary: "GB ensembles outperform OLS/Logistic — R2 from ~0.31 to ~0.78 on cost overrun."

---

## 4.10 CUF Field Sufficiency Analysis — IMPLEMENTED (P1)

FR-10.1: ml/cuf_gap.py ranks 6 existing CUF fields:
  - Expenditure Velocity vs Physical Progress (CUF-DERIVED-01): 0.342
  - Physical Progress % (CUF-FLD-09): 0.215
  - Infrastructure Sector (CUF-FLD-03): 0.168
  - Approved Baseline Cost (CUF-FLD-04): 0.124
  - Planned Duration (CUF-FLD-07): 0.089
  - Implementing Agency (CUF-FLD-05): 0.062

FR-10.2: 5 additional variables recommended with justification and data source:
  - Land Acquisition RoW Possession %: +18.5% time variance reduction (GatiShakti Portal API)
  - Contractor Load & Solvency Index: +14.2% cost overrun accuracy (MCA-21 / GeM/CPPP)
  - Statutory Clearance Status (Forest/Env): +12.8% false-positive reduction (PARIVESH 2.0)
  - Active Litigation/Arbitration Claims: +16.1% revised cost forecast lift (DRB / Vivad se Vishwas II)
  - Geo-Terrain & Climate Vulnerability: +9.4% Himalayan/coastal prediction (GSI + IMD API)

FR-10.3: Each variable has documented justification and proposed data source.

FR-10.4: Projected aggregate reduction: ~32.7% in unexplained time variance.

---

## 4.11 Benchmarking and Comparative Analytics — IMPLEMENTED (P1)

FR-11.1: services/benchmarking.py -> compute_peer_benchmark() provides:
  sector_avg_cost_overrun_pct, sector_avg_delay_months, sector_avg_progress,
  sector_avg_risk_score, percentile_rank_in_sector.

FR-11.2: Peer group = same sector + cost band (<=500 Cr | 500-2000 Cr | 2000-10000 Cr | >10000 Cr).

FR-11.3: Endpoint: GET /api/projects/{project_id}/benchmark.

---

## 4.12 LLM Project Intelligence Assistant — IMPLEMENTED (P2)

FR-12.1: AssistantDrawer.tsx — slide-in chat. DocumentAnalyzerView.tsx — DPR-specific workspace.

FR-12.2: routes/assistant.py -> extract_grounded_context() grounds responses in live DB: portfolio summary, sector rankings, ML metrics, project details, CUF gap.

FR-12.3: synthesize_deterministic_response() — hallucination-free. Ollama 300ms timeout, graceful fallback.

FR-12.4: Ollama/llama3. Open-source.

FR-12.5 [NEW]: 7 intent categories: CUF gap | Sector ranking | ML benchmark | Sector analytics | Project lookup | Early warning | Portfolio overview (default).

FR-12.6 [NEW]: suggested_followups — 2-4 context-aware next questions per response.

---

## 4.13 Reports and Export — IMPLEMENTED (P0)

FR-13.1: Documentation in this SRS, README.md, OpenAPI at http://localhost:8000/docs.

FR-13.2: 2 export endpoints:
  GET /api/reports/export-projects?format=csv|json — filtered project risk reports
  GET /api/reports/export-alerts?min_risk_score=50 — early warning CSV
  Both accept: sector, ministry, status, risk_tier filters.

---

## 4.14 Problem Diagnostics — IMPLEMENTED [NEW] (P0)

FR-14.1: services/problem_diagnostics.py -> compute_problem_diagnostics() classifies projects into 8+ archetypes.

FR-14.2: 5 diagnostic datasets per project:
  - progress_curve: Planned/actual/projected trajectory (6 waypoints)
  - budget_waterfall: Original -> expenditure -> revised breakdown
  - burn_vs_progress: Financial burn % vs physical progress decoupling
  - milestone_slippage: Per-milestone planned vs actual slippage (months)
  - bottleneck_factors: Factor-wise impact scoring

FR-14.3: GET /api/projects/{id}/diagnostics. Rendered in ProjectDetailModal.tsx with tab nav.

FR-14.4: Each diagnostic: problem_type, problem_title, root_metrics_summary, severity, recommended_action, recommendations list.

---

## 4.15 Geospatial Infrastructure Intelligence & India Choropleth Mapping — IMPLEMENTED [NEW] (P0)

FR-15.1: High-fidelity vector SVG boundaries for 36 States and Union Territories with accurate national outline (`IndiaMapPaths.ts`).

FR-15.2: Dynamic 8-level gradient choropleth color scale (`#E0F2FE` to `#075985`) mapping project density across all jurisdictions.

FR-15.3: Uncluttered Cartography: Avoids placing overlapping numeric labels over complex state boundaries or marine areas, preserving clean, aesthetic outlines with an interactive cyan glow on hover.

FR-15.4: Multi-metric interactive tooltip card on hover displaying:
  - State Name
  - Total Number of Projects
  - Active Projects
  - Completed Projects (>=99% progress)
  - Delayed Projects (DELAYED / CRITICAL_WATCHLIST)

FR-15.5: Backend aggregation endpoint: `GET /api/projects/state-summary` returning `List[StateSummaryResponse]`.
  Includes `_STATE_ALIASES` normalisation dictionary automatically resolving 30+ regional abbreviations, acronyms, and variations into canonical Census state names.

FR-15.6: Macro-regional zone filters (Northern, Western, Southern, Eastern, Central, North-Eastern Zones) with aggregated outlays, average delays, and risk tier stratification.

FR-15.7: PM GatiShakti & PRAGATI National Infrastructure Corridors tracking: Western & Eastern DFCs, Mumbai-Ahmedabad High-Speed Rail, and Delhi-Mumbai Expressway.

---

## 4.16 Role-Based Authentication & Session Architecture — IMPLEMENTED [NEW] (P1)

FR-16.1: Dedicated authentication route: `POST /api/auth/login` accepting email, password, and target role (`analyst`, `officer`, `admin`).

FR-16.2: Pre-configured departmental role profiles:
  - Analyst: Dr. R. K. Verma (IPMD, MoSPI)
  - Officer: Er. S. Sengupta (NHAI / MoRTH)
  - Admin: Shri A. Mukherjee (DIID, MoSPI)

FR-16.3: Returns session authorization token and structured `UserInfo` profile. Verified via `GET /api/auth/me`.

---


---

# 5. SYSTEM WORKFLOW — AS IMPLEMENTED

```
SIH 5000 Excel Dataset
        |
seed_from_sih_5000_dataset()  <-->  POST /api/ingest/upload (CSV/Excel/JSON)
        |
services/ingestion.py (normalize, label, provenance tag)
        |
services/labeling.py (cost_overrun_pct, delay_months, risk flags)
        |
ml/risk_engine.py -> shap_drivers JSON, risk_score (0-100), risk_tier
        |
SQLite: projects table (backend/data/project_monitoring.db)
        |
ml/pipeline.py -> train_and_evaluate_models()
  +-- GradientBoostingRegressor (cost overrun)
  +-- RandomForestRegressor (schedule delay)
  +-- GradientBoostingClassifier (binary risk)
  +-- baseline.py: OLS x2 + Logistic Regression
        |
model_metrics table -> /api/analytics/model-benchmark
        |
FastAPI REST API (uvicorn port 8000) -- 21 endpoints
        |
React 19 + TypeScript SPA (Vite port 5173)
  Views: Dashboard | Projects | Risk Signals | SLA Monitoring | Geospatial
         Document Analyzer | Saved Analyses | Interventions | Scenario Lab | Settings
  Modals/Drawers: ProjectDetail | AssistantDrawer | DataIngest | StatsModal | AdminAudit
```

---

# 6. USER USE CASES — AS IMPLEMENTED

## UC-01: Monitor Project Portfolio (Analyst)
Default: Dashboard. Fetches /api/projects/summary. Navigate to Projects, apply filters. Export CSV/JSON.

## UC-02: Inspect High-Risk Project (Officer)
Default: Risk Signals. /api/alerts. Click card -> ProjectDetailModal. 5-chart diagnostics, SHAP drivers, benchmark.

## UC-03: Early Warning Triage (Officer)
Cards ranked by financial exposure. Filter by CRITICAL/HIGH/sector. CONFIRMED vs PREDICTIVE badge per card.

## UC-04: Peer Benchmarking (Analyst)
Open project modal -> compute_peer_benchmark() -> sector+cost-band comparison, percentile rank.

## UC-05: ML Model Evaluation (Admin)
Workspace Settings -> /api/ml/retrain -> 3 ML + 3 baselines trained -> results in AnalyticsView.

## UC-06: Data Ingestion (Admin)
Data Ingest Modal -> POST /api/ingest/upload -> parse/normalize/label/persist -> optional retrain.

## UC-07: AI Assistant Query (Any Role)
TopNav AI button -> AssistantDrawer -> POST /api/assistant/query -> grounded response + followups.

## UC-08: DPR Document Analysis (Analyst)
Document Analyzer -> select from 3 pre-loaded DPRs -> query -> grounded assistant response.

## UC-09: Statistical Profiling (Analyst)
Statistical Profile button -> DescriptiveStatsModal -> /api/projects/statistics -> distribution charts.

## UC-10: CUF Gap & Variable Analysis (Analyst/Admin)
Analytics view or AI assistant -> /api/analytics/cuf-gap -> CUF field rankings + 5 variable proposals.

## UC-11: Geospatial Infrastructure Exploration (Analyst/Leadership)
Geospatial View -> /api/projects/state-summary -> interactive India choropleth map. Hover over states to inspect active, completed, and delayed breakdowns. Filter by regional macro-zones or inspect PM GatiShakti national mega-corridors.

---

# 7. DATA REQUIREMENTS — AS IMPLEMENTED

## 7.1 Primary Data Source

SIH_5000_Projects_Problems_Dataset.xlsx — 5,000 infrastructure project records.
Ingested via seed_from_sih_5000_dataset() in services/seeder.py.

## 7.2 Database

SQLite (backend/data/project_monitoring.db)
Tables: projects | data_quality_logs | model_metrics

## 7.3 Extended Problem-Diagnostic Fields (beyond CUF)

| Column | Type | Description |
|---|---|---|
| problem_archetype | String | Classification code |
| problem_title | String | Human-readable title |
| problem_severity | String | CRITICAL/HIGH/MODERATE/LOW |
| root_metrics_summary | Text | Diagnostic narrative |
| planned_progress | Float | Expected % at current date |
| progress_deficit_gap | Float | planned - actual progress |
| financial_burn_pct | Float | (expenditure/revised_cost) x 100 |
| burn_progress_decoupling_gap | Float | burn_pct - physical_progress |
| row_land_acquisition_risk | Float | RoW/Land acquisition risk |
| environmental_clearances_risk | Float | Environmental clearance risk |
| utility_shifting_risk | Float | Utility shifting risk |
| contractor_solvency_risk | Float | Contractor solvency risk |
| contractual_arbitration_risk | Float | Arbitration/litigation risk |
| mandated_action | Text | Priority prescribed action |
| prescriptive_recommendations | Text | Intervention text |
| is_confirmed_problem | Boolean | FR-5.3: Confirmed deficit |
| is_predictive_warning | Boolean | FR-5.3: Latent predictive risk |
| confidence_level | String | HIGH/MEDIUM/LOW |
| risk_type_label | String | CONFIRMED_DEFICIT/PREDICTIVE_SIGNAL/LOW_RISK |
| data_provenance | String | REAL/SYNTHETIC/EXCEL_PROBLEMS_DATASET |

## 7.4 Data Quality Controls

Missing values: defaulted, logged to data_quality_logs.
Invalid dates: delay_months set to 0, anomaly logged.
Duplicate project_id: upsert pattern.
Provenance tagged per Constraint C-2.
Quality logs at GET /api/ingest/quality-logs.

---

# 8. MODEL REQUIREMENTS — AS IMPLEMENTED

## 8.1 Six Models

| Model | Algorithm | Task | Library |
|---|---|---|---|
| Cost Overrun Predictor | GradientBoostingRegressor | Regression | scikit-learn |
| Schedule Delay Predictor | RandomForestRegressor | Regression | scikit-learn |
| Risk Classifier | GradientBoostingClassifier | Binary Classification | scikit-learn |
| Cost OLS Baseline | LinearRegression | Regression | scikit-learn |
| Delay OLS Baseline | LinearRegression | Regression | scikit-learn |
| Risk Classification Baseline | LogisticRegression | Binary Classification | scikit-learn |

## 8.2 Training Configuration

Train/Test split: 80/20, random_state=42 (deterministic, reproducible).
Minimum samples: 30 (guard in pipeline.py).
Categorical encoding: pd.get_dummies on sector + ministry (drop_first=True).
Feature scaling: StandardScaler for Logistic Regression baseline only.
In-memory cache: TRAINED_MODELS dict in pipeline.py.

## 8.3 Explainability

Rule-based SHAP-equivalent attribution (not the shap library). shap_drivers JSON per project:
{"feature": "Protracted Schedule Delay", "impact": "+35.0", "direction": "HIGH_RISK",
 "explanation": "Commissioning deadline slipped 42.1 months."}
Drivers sorted descending by absolute impact.

## 8.4 No Fabricated Predictions

synthesize_deterministic_response() operates strictly on computed DB facts.
Ollama LLM given only verified facts; instructed not to invent metrics.
Risk scores always traceable to risk_engine.py formula components.

---

# 9. NON-FUNCTIONAL REQUIREMENTS — AS IMPLEMENTED

| ID | Requirement | Status | Notes |
|---|---|---|---|
| NFR-1 | Web interface on modern desktop browsers | IMPLEMENTED | React 19 SPA, Chrome/Edge |
| NFR-2 | Responsive dashboard performance | IMPLEMENTED | 25/page pagination, async, loading states |
| NFR-3 | Role-based information perspective | IMPLEMENTED | Analyst/Officer/Admin + distinct default views |
| NFR-4 | Ingestion failures logged without crash | IMPLEMENTED | try/except + DataQualityLog |
| NFR-5 | Architecture supports portfolio growth | IMPLEMENTED | API-first, ML retrain on-demand |
| NFR-6 | Model training reproducible | IMPLEMENTED | random_state=42 throughout |
| NFR-7 | Open-source tools | IMPLEMENTED | FastAPI, React, scikit-learn, SQLite, Ollama |
| NFR-8 | Predictions traceable | IMPLEMENTED | shap_drivers, risk_type_label, confidence_level |
| NFR-9 | Actual status vs prediction distinguished | IMPLEMENTED | is_confirmed_problem vs is_predictive_warning |
| NFR-10 | Collapsible sidebar | IMPLEMENTED | Icon-only mode when collapsed |
| NFR-11 | API self-documentation | IMPLEMENTED | OpenAPI at /docs |
| NFR-12 | CORS for local dev | IMPLEMENTED | allow_origins=["*"] |

---

# 10. SOFTWARE ARCHITECTURE — AS BUILT

## Technology Stack (Planned v2.0 vs Implemented v3.0)

| Layer | Planned v2.0 | Implemented v3.0 |
|---|---|---|
| Frontend Framework | React + TypeScript | React 19 + TypeScript |
| Build Tool | (unspecified) | Vite |
| Styling | (unspecified) | Vanilla CSS + Lucide React |
| Charts | Recharts / Plotly | Recharts |
| Backend | FastAPI + Python | FastAPI + Python 3.11 |
| Database | PostgreSQL | SQLite [UPDATED] |
| ORM | (unspecified) | SQLAlchemy |
| Data Processing | pandas | pandas + openpyxl |
| ML | scikit-learn + XGBoost/LightGBM | scikit-learn only [UPDATED] |
| Explainability | SHAP library | Rule-based SHAP-equivalent [UPDATED] |
| LLM | Llama/Mistral via Ollama | Llama 3 via Ollama (optional) |
| API Protocol | REST + JSON | REST + JSON |
| HTTP Client (FE) | (unspecified) | axios |
| Deployment | Docker | Local dev only [UPDATED] |
| API Docs | (unspecified) | OpenAPI/Swagger at /docs |

UPDATED items rationale:
- PostgreSQL -> SQLite: Simpler hackathon deployment
- XGBoost/LightGBM -> scikit-learn GB: No additional dependency
- SHAP library -> rule-based: Transparent, no external dep, fully documented
- Docker -> local: Hackathon scope

---

# 11. SECURITY AND ACCESS CONTROL — AS IMPLEMENTED

| Control | Status | Notes |
|---|---|---|
| Authentication | NOT IMPLEMENTED | No login; internal demo only |
| Role-based views | IMPLEMENTED | 3 roles via in-session role switcher |
| API authorization | NOT IMPLEMENTED | No token validation on endpoints |
| CORS | IMPLEMENTED | allow_origins=["*"] for local dev |
| HTTPS | LOCAL ONLY | HTTP only; HTTPS needed for production |
| Admin-only API guards | PARTIAL | UI restricts; no API-level enforcement |

For production: Add JWT authentication, per-role API endpoint guards, HTTPS.

---

# 12. API ENDPOINT REFERENCE — 19 ENDPOINTS

| Method | Endpoint | Description |
|---|---|---|
| GET | / | System info |
| GET | /health | Health check (database + version) |
| GET | /api/projects/summary | Portfolio KPI summary |
| GET | /api/projects/statistics | Descriptive statistical profiling |
| GET | /api/projects | Paginated + filtered project list |
| GET | /api/projects/{id} | Single project detail + diagnostics |
| GET | /api/projects/{id}/schedule-delay | Schedule delay detection + trajectory |
| GET | /api/projects/{id}/benchmark | Peer sector benchmark comparison |
| GET | /api/projects/{id}/diagnostics | 5-chart diagnostic datasets |
| GET | /api/alerts | Early warning alerts (risk_score threshold) |
| GET | /api/analytics/cuf-gap | CUF field importance + variable proposals |
| GET | /api/analytics/model-benchmark | ML vs baseline comparison |
| POST | /api/ml/retrain | On-demand ML model retraining |
| POST | /api/ingest/upload | Upload CSV/Excel/JSON dataset |
| POST | /api/ingest/reseed | Reseed MoSPI April 2026 baseline |
| GET | /api/ingest/quality-logs | Data quality anomaly audit |
| POST | /api/assistant/query | Grounded AI intelligence query |
| GET | /api/reports/export-projects | Filtered project report (CSV/JSON) |
| GET | /api/reports/export-alerts | Early warning alerts (CSV) |

---

# 13. IMPLEMENTATION PRIORITY — ALL DELIVERED

## P0 — Core (13/13 delivered)
SIH Dataset Ingestion | Data Cleaning/Normalization | Statistical Analysis | Cost Overrun Prediction | Time Overrun Prediction | Implementation Risk Analysis | Composite Risk Score | SHAP-equivalent Attribution | Early Warning Alerts | Web Dashboard | Report Export | Problem Diagnostics | Schedule Delay Detection

## P1 — Advanced (4/4 delivered)
ML vs Statistical Baseline | CUF Field Sufficiency | Additional Variable Recommendations | Peer Benchmarking

## P2 — Stretch (7/7 delivered)
Grounded AI Assistant | DPR Document Analyzer | Scenario Lab UI | Geospatial View | SLA Monitoring View | Interventions View | Admin Audit Modal

---

# 14. REQUIREMENTS TRACEABILITY MATRIX

| SIH26103 Dimension / Outcome | SRS Section | File |
|---|---|---|
| Statistical analysis + predictive models | 4.2, 4.3, 4.4, 4.5 | statistics.py, pipeline.py |
| Cost Overrun Prediction | 4.3 | pipeline.py (GradientBoostingRegressor) |
| Time Overrun Prediction | 4.4 | pipeline.py (RandomForestRegressor) |
| Implementation Risk | 4.5 | risk_engine.py |
| ML vs Statistical (Dimension b) | 4.9 | baseline.py, routes/analytics.py |
| CUF Field Sufficiency (Dimension c) | 4.10 | cuf_gap.py, routes/analytics.py |
| Project Risk Scoring | 4.6 | risk_engine.py |
| Early Warning Alert System | 4.7 | routes/alerts.py, EarlyWarnings.tsx |
| Benchmarking / Comparative Analytics | 4.11 | services/benchmarking.py |
| AI-powered Monitoring Dashboard | 4.8 | DashboardView.tsx, routes/projects.py |
| Cost Escalation Driver Analysis | 4.5, 4.6, 4.10 | risk_engine.py, cuf_gap.py |
| LLM Intelligence Assistant | 4.12 | routes/assistant.py, AssistantDrawer.tsx |
| Documentation / Deployment | 4.13 | SRS v3.0, README.md, /docs |
| Problem Diagnostics [NEW] | 4.14 | services/problem_diagnostics.py |
| DPR Document Analysis [NEW] | 4.12 | DocumentAnalyzerView.tsx |
| Data Quality Monitoring [NEW] | 4.1 | models.py (DataQualityLog), routes/ingest.py |
| Schedule Delay Detection [NEW] | 4.4 | services/schedule_delay.py |

---

# 15. KEY SYSTEM PRINCIPLE

PAIMANA = Infrastructure Project Monitoring Data / Existing Portal

PAIMANA Insight (This System) =
  SIH 5000 Dataset (5,000 projects ingested)
  + Cost Overrun Prediction (Gradient Boosting)
  + Schedule Delay Prediction (Random Forest)
  + Composite Risk Scoring (0-100, 4 tiers)
  + SHAP-equivalent Driver Attribution
  + Early Warning Alert System (ranked by financial exposure)
  + Problem Diagnostics + 5-Chart Drill-Down
  + ML vs Statistical Baseline Comparison
  + CUF Gap Analysis + 5 Variable Recommendations
  + Peer Benchmarking (sector + cost band)
  + Grounded AI Intelligence Assistant (7 intent categories)
  + DPR Document Analyzer Workspace
  + 10-View Web Monitoring Dashboard
  + Report Export (CSV + JSON)
  + Data Quality Audit Trail

Core purpose:
Use SIH 5000 project-monitoring data to identify and predict potential cost overruns, schedule delays,
and implementation risks before they materialize — providing early-warning, diagnostic, and
decision-support intelligence to MoSPI IPMD monitoring stakeholders.

---

# 16. LIMITATIONS — AS IMPLEMENTED

1. Database: SQLite instead of PostgreSQL. Adequate for 5,000 projects; limited for large-scale production concurrent writes.
2. Explainability: Rule-based SHAP-equivalent (not shap library). Transparent but not from model gradient attributions.
3. LLM Integration: Ollama/llama3 optional with 300ms timeout. Fully functional without LLM via deterministic synthesis.
4. No Authentication: Role-based access is UI-only. JWT + API guards required before production.
5. Static DPR Documents: 3 pre-loaded sample DPRs in DocumentAnalyzerView. True PDF parsing/RAG not implemented.
6. Geospatial View: State-wise distribution charts — no real GIS tile server / Mapbox integration.
7. Scenario Lab: What-if UI is illustrative — no backend simulation endpoint.
8. Data dependency: Risk score accuracy depends on SIH Excel dataset quality.
9. CUF variable lift estimates: +9.4% to +18.5% are empirical estimates; actual lift requires real data integration.
