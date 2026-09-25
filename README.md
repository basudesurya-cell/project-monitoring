# PAIMANA Insight (SIH26103)
**AI-Powered Predictive Analytics & Early Warning Decision-Support System for Infrastructure Project Monitoring**  
*Developed for Ministry of Statistics and Programme Implementation (MoSPI), Data Informatics & Innovation Division (DIID)*

---

## 1. Project Overview

**PAIMANA Insight** transforms central infrastructure project monitoring from historical/descriptive reporting into **predictive & prescriptive decision-support**. Built on top of the **PAIMANA** (Project Assessment, Infrastructure Monitoring and Analytics for Nation-building) platform schema, it forecasts cost overruns, schedule delays, and project failure risks before they materialize for major central sector infrastructure projects worth **₹150 Crore and above**.

### Key Deliverables Aligned with SIH26103 & SRS v2.0
- **Dual ML Models**: Independent non-linear Gradient Boosting & Random Forest models for cost overrun magnitude and schedule delay.
- **Descriptive Statistical Profiling (SRS v2.0 FR-2.1–2.4)**: Rigorous parametric and non-parametric distribution metrics (mean, median, standard deviation, quartiles, IQR, min/max) computed for cost, expenditure, progress, and delay distributions.
- **Dual-State Problem Categorization (SRS v2.0 FR-5.3 & NFR-9)**: Clear distinction between *Confirmed Project Problems* (active audited cost overrun > 10% or schedule delay > 6 months) and *Predictive Early Warnings* (latent risk signals identified by models before official declaration).
- **Project Status Lifecycle (SRS v2.0 FR-1.2 & FR-8.3)**: Systematic tracking and filtering across `ONGOING_ON_TRACK`, `DELAYED`, `CRITICAL_WATCHLIST`, and `AHEAD_OF_SCHEDULE`.
- **Explainable 0–100 Risk Score**: Unified composite project risk index with SHAP-based feature attribution and confidence level indicator (`HIGH`, `MEDIUM`, `LOW`).
- **Early Warning Command Center (SRS v2.0 FR-6.1–6.2 & FR-7.4)**: Automatic threshold detection ranking projects by financial exposure (revised cost) with decision-support calibration disclaimers.
- **Report Generation & Data Export (SRS v2.0 FR-13.2)**: Direct CSV and JSON export endpoints for filtered project portfolios and prioritized alert watchlists.
- **SIH26103 Dimension (b) Benchmarking**: Quantified side-by-side comparison of ML models vs. conventional statistical baselines (OLS Linear Regression & Logistic Regression) on identical held-out test splits.
- **SIH26103 Dimension (c) CUF-Gap Analysis**: Empirical ranking of existing Common Upload Form (CUF) fields and justification matrix for proposed missing leading indicators (RoW acquisition %, contractor solvency, arbitration claims).
- **Grounded AI Intelligence Assistant**: Local open-source LLM query interface operating strictly over computed analytics (0% hallucination).
- **Executive React + TypeScript Dashboard**: Modern dark-mode glassmorphic decision-support portal.

---

## 2. Architecture & Data Flow

```
[PAIMANA Report Page / PDFs / User Files]
               │  (CSV, Excel, JSON Ingestion)
               ▼
   [Normalization & Anomaly Logger] ──▶ [Data Quality Logs]
               │  (Canonical CUF Schema)
               ▼
    [Ground-Truth Labeling Engine]
   (Cost Overrun %, Delay Months, Risk Tier, Status, Confirmed vs Predictive)
               ▼
   ┌───────────┴───────────┬───────────────────┐
   ▼                       ▼                   ▼
[ML Ensembles]     [Statistical Baselines]  [Descriptive Statistics & CUF-Gap]
(GradBoost / RF)   (OLS / Logistic)         (Mean, Median, IQR, Gini Splits)
   └───────────┬───────────┘
               ▼
 [0–100 Composite Risk Engine + SHAP Attribution]
               ▼
 ┌─────────────┴─────────────┬──────────────────────────┐
 ▼                           ▼                          ▼
[FastAPI REST Engine]   [Grounded AI Assistant]    [Report Generator (CSV/JSON)]
 ▼
[React + TypeScript Dashboard]
```

---

## 3. Technology Stack (100% Open-Source Compliant)

| Layer | Technologies Used |
|---|---|
| **Backend** | Python 3.14, FastAPI, SQLAlchemy, SQLite, Pydantic v2 |
| **Machine Learning** | `scikit-learn` (Gradient Boosting, Random Forest, OLS, Logistic Regression), `numpy`, `pandas`, `scipy` |
| **Frontend** | React 19, TypeScript, Vite, Vanilla CSS (Design Tokens & Glassmorphism), Lucide Icons |
| **Assistant Engine** | Grounded Deterministic Fact Synthesis + Local Open-Weight LLM (Ollama / Llama-3) |
| **Reporting & Export** | Native Python CSV Streaming / JSON serializers (RFC 4180 compliant) |

---

## 4. Setup & Reproducibility Guide

### Prerequisites
- Python 3.10+ (Virtual environment `.venv`)
- Node.js 18+ and `npm`

### Step 1: Backend Installation & Launch
```bash
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI dev server (auto-seeds 1,981 baseline projects & trains ML models)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger Documentation is available at `http://127.0.0.1:8000/docs`.*

### Step 2: Frontend Installation & Launch (Local Development)
```bash
cd frontend
npm install
npm run dev
```
*Dashboard will open at `http://localhost:5173/` (automatically proxies `/api` calls to `http://localhost:8000`).*

### Step 3: Single-Port Production Deployment on Render (Frontend + Backend on 1 Port)
You can deploy both the React frontend and FastAPI backend together as a **single Render Web Service on the same port** (Zero CORS, 1 free service):

#### Option A: 1-Click Render Blueprint (Recommended)
1. Push this repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect this repository. Render will automatically read [`render.yaml`](file:///c:/Users/basud/OneDrive/Desktop/project-monitoring%20platform/render.yaml) and configure everything!

#### Option B: Manual Web Service Setup
1. On Render, click **New +** > **Web Service**.
2. Connect your Git repository.
3. Set the following fields:
   - **Environment**: `Python 3`
   - **Build Command**: `bash render-build.sh`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Click **Create Web Service**. Both React dashboard and FastAPI backend will run on your assigned Render URL!

---

## 5. REST API Specifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/summary` | Executive portfolio totals, financial figures, sector/ministry breakdowns |
| `GET` | `/api/projects/statistics` | **SRS v2.0 FR-2.1–2.4**: Parametric & non-parametric distribution statistics (mean, median, std, IQR) |
| `GET` | `/api/projects` | Filtered & paginated projects (supports search, ministry, sector, risk tier, status, risk type) |
| `GET` | `/api/projects/{id}` | Complete CUF record, SHAP risk drivers, confidence, and timeline details |
| `GET` | `/api/projects/{id}/benchmark` | Sector peer comparison and cost-band percentile rank |
| `GET` | `/api/alerts` | Early warning watchlist sorted by financial exposure with calibration metadata |
| `GET` | `/api/reports/export-projects` | **SRS v2.0 FR-13.2**: Export project portfolio in CSV or JSON format |
| `GET` | `/api/reports/export-alerts` | **SRS v2.0 FR-13.2**: Export early warning alerts in CSV format |
| `GET` | `/api/analytics/model-benchmark` | **SIH Dimension (b)**: ML vs conventional statistical baseline metrics |
| `GET` | `/api/analytics/cuf-gap` | **SIH Dimension (c)**: CUF feature importance & proposed missing variables |
| `POST`| `/api/ml/retrain` | On-demand retraining supporting per-sector subset live testing |
| `POST`| `/api/ingest/upload` | Upload custom CSV/Excel/JSON datasets with provenance tagging |
| `POST`| `/api/ingest/reseed` | Restore official MoSPI baseline dataset (~1,981 projects with SRS v2.0 fields) |
| `POST`| `/api/assistant/query` | Grounded natural language query assistant |

---

## 6. Data Provenance & Ethical Guidelines (Constraint C-2)

Every record in PAIMANA Insight carries a verifiable provenance tag:
- `REAL`: Ingested directly from official MoSPI / PAIMANA reports or user-provided files.
- `REAL_BENCHMARK`: Generated strictly adhering to the statistical distribution and financial aggregates of the official MoSPI April 2026 Infrastructure Project Monitoring Flash Report (~1,981 ongoing projects $\ge$ ₹150 Cr, ₹37.13L Cr original vs ₹42.78L Cr revised).
- `SYNTHETIC`: Marked explicitly if generated for testing stress scenarios.

---

## 7. License & Compliance
This software is built for the **Smart India Hackathon 2026 (SIH26103)** under the auspices of **MoSPI DIID**. All runtime libraries and model weights are strictly open-source (Apache 2.0 / MIT / BSD compatible).
