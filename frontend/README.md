# PAIMANA Insight — Frontend Application

Modern React 19 + TypeScript dashboard built with Vite for the **PAIMANA Insight (SIH26103)** central infrastructure project monitoring system.

## Overview
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS Design Tokens & Glassmorphism (`src/index.css`)
- **Icons**: Lucide React (`lucide-react`)
- **Charts**: Recharts (`recharts`)
- **API Client**: Axios (`axios`)

## Available Views & Features
1. **Executive Dashboard** (`DashboardView.tsx`): Macro portfolio indicators, sector cost allocations, and risk tier distributions.
2. **Projects Explorer** (`ProjectTable.tsx`, `FilterPanel.tsx`): Real-time search, multi-faceted filtering, and sorting.
3. **Risk Signals & Early Warnings** (`EarlyWarnings.tsx`): Prioritized watchlist ranking projects by financial exposure.
4. **Project Deep-Dive Diagnostics** (`ProjectDetailModal.tsx`): 5-chart diagnostics, milestone schedules, and SHAP risk driver analysis.
5. **SLA Monitoring** (`SlaMonitoringView.tsx`): Escalation timelines and compliance monitoring.
6. **Geospatial View** (`GeospatialView.tsx`): Geographic distribution of infrastructure projects.
7. **Document Analyzer** (`DocumentAnalyzerView.tsx`): Ingestion and parsing diagnostics.
8. **Interventions & Scenario Lab** (`InterventionsView.tsx`, `ScenarioLabView.tsx`): Predictive what-if simulations and recovery planning.
9. **Grounded AI Intelligence Assistant** (`AssistantDrawer.tsx`): Zero-hallucination interactive querying over computed portfolio metrics.
10. **Data Ingestion & Admin Audit** (`DataIngestModal.tsx`, `AdminAuditModal.tsx`): Upload datasets and review data quality logs.

## Getting Started

### Development
```bash
npm install
npm run dev
```
The dashboard runs at `http://localhost:5173/` and proxies/calls the FastAPI backend at `http://127.0.0.1:8000`.

### Production Build & Lint
```bash
npm run lint
npm run build
```
