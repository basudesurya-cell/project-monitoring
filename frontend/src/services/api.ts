import axios from 'axios';
import type {
  PortfolioSummary,
  PaginatedProjects,
  Project,
  PeerBenchmark,
  EarlyWarningProject,
  CUFGapAnalysis,
  ModelBenchmark,
  AssistantResponse,
  DescriptiveStatisticsResponse,
  DataQualityLogItem,
  ScheduleDelayAnalysis,
  ProblemDiagnostics,
  AuthUser,
  LoginCredentials,
  StateSummary
} from '../types';

const API_BASE = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

export const api = {
  // Authentication
  login: async (credentials: LoginCredentials): Promise<{ status: string; token: string; user: AuthUser }> => {
    const res = await client.post('/auth/login', credentials);
    return res.data;
  },

  // Summary & Portfolio
  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    const res = await client.get<PortfolioSummary>('/projects/summary');
    return res.data;
  },

  // Descriptive Statistics Profiling (SRS v2.0 FR-2.1 - FR-2.4)
  getDescriptiveStatistics: async (sector?: string, ministry?: string): Promise<DescriptiveStatisticsResponse> => {
    const params: Record<string, string> = {};
    if (sector && sector !== 'ALL') params.sector = sector;
    if (ministry && ministry !== 'ALL') params.ministry = ministry;
    const res = await client.get<DescriptiveStatisticsResponse>('/projects/statistics', { params });
    return res.data;
  },

  // Projects List
  getProjects: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    ministry?: string;
    sector?: string;
    risk_tier?: string;
    status?: string;
    risk_type?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<PaginatedProjects> => {
    const res = await client.get<PaginatedProjects>('/projects', { params });
    return res.data;
  },

  // Single Project Detail
  getProject: async (id: string | number): Promise<Project> => {
    const res = await client.get<Project>(`/projects/${id}`);
    return res.data;
  },

  // Schedule Delay Detection & Trajectory
  getScheduleDelay: async (id: string | number): Promise<ScheduleDelayAnalysis> => {
    const res = await client.get<ScheduleDelayAnalysis>(`/projects/${id}/schedule-delay`);
    return res.data;
  },

  // Problem Diagnostics & Multi-Graph Datasets
  getProjectDiagnostics: async (id: string | number): Promise<ProblemDiagnostics> => {
    const res = await client.get<ProblemDiagnostics>(`/projects/${id}/diagnostics`);
    return res.data;
  },

  // Peer Benchmark
  getPeerBenchmark: async (id: string): Promise<PeerBenchmark> => {
    const res = await client.get<PeerBenchmark>(`/projects/${id}/benchmark`);
    return res.data;
  },

  // Early Warnings
  getEarlyWarnings: async (params?: { min_risk_score?: number; sector?: string; risk_tier?: string; limit?: number }): Promise<EarlyWarningProject[]> => {
    const res = await client.get<EarlyWarningProject[]>('/alerts', { params });
    return res.data;
  },

  // Analytics
  getCUFGapAnalysis: async (): Promise<CUFGapAnalysis> => {
    const res = await client.get<CUFGapAnalysis>('/analytics/cuf-gap');
    return res.data;
  },

  getModelBenchmark: async (): Promise<ModelBenchmark> => {
    const res = await client.get<ModelBenchmark>('/analytics/model-benchmark');
    return res.data;
  },

  // ML Retrain
  retrainModels: async (sector: string = 'ALL') => {
    const res = await client.post('/ml/retrain', null, { params: { sector } });
    return res.data;
  },

  // Ingestion & Seeder
  uploadDataset: async (file: File, provenance: string = 'REAL') => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/ingest/upload', formData, {
      params: { provenance },
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  reseedBaseline: async () => {
    const res = await client.post('/ingest/reseed');
    return res.data;
  },

  getQualityLogs: async (limit: number = 50): Promise<DataQualityLogItem[]> => {
    const res = await client.get<DataQualityLogItem[]>('/ingest/quality-logs', {
      params: { limit: Math.max(5, limit) }
    });
    return res.data;
  },

  // Assistant Query
  queryAssistant: async (query: string): Promise<AssistantResponse> => {
    const res = await client.post<AssistantResponse>('/assistant/query', { query });
    return res.data;
  },

  // Report Export Services (SRS v2.0 FR-13.2)
  downloadProjectReport: async (format: 'csv' | 'json', filters?: Record<string, string | undefined>) => {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'ALL') params.append(k, v);
      });
    }
    const response = await client.get(`/reports/export-projects?${params.toString()}`, {
      responseType: 'blob'
    });
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([response.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paimana_projects_export_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  downloadAlertsReport: async () => {
    const response = await client.get('/reports/export-alerts?format=csv', {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paimana_early_warnings_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Geospatial State Summary
  getStateSummary: async (): Promise<StateSummary[]> => {
    const res = await client.get<StateSummary[]>('/projects/state-summary');
    return res.data;
  }
};
