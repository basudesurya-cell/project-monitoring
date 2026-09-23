import React from 'react';
import {
  Settings,
  UploadCloud,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  HardHat,
  BarChart3
} from 'lucide-react';
import type { PortfolioSummary } from '../types';

interface WorkspaceSettingsViewProps {
  userRole: 'analyst' | 'officer' | 'admin';
  setUserRole: (role: 'analyst' | 'officer' | 'admin') => void;
  onOpenIngest: () => void;
  summary: PortfolioSummary | null;
  onRefreshAll: () => void;
}

export const WorkspaceSettingsView: React.FC<WorkspaceSettingsViewProps> = ({
  userRole,
  setUserRole,
  onOpenIngest,
  summary,
  onRefreshAll
}) => {
  return (
    <div style={{ padding: '24px 28px 40px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="#0F172A" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Workspace Settings & DIID MLOps Governance
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
              Manage data ingestion pipelines, model retraining cycles, access authorities, and system health.
            </p>
          </div>

          <button
            onClick={onRefreshAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh Workspace State</span>
          </button>
        </div>
      </div>

      {/* Role Authority Selection */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
          Operational Persona & Authority Matrix
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {[
            {
              id: 'analyst' as const,
              title: 'IPMD Analyst (MoSPI Central)',
              subtitle: 'Macro oversight, statistical profiling, PMO reporting',
              icon: BarChart3,
              color: '#0F172A',
              bg: '#F1F5F9'
            },
            {
              id: 'officer' as const,
              title: 'Project Officers (Ministry & PSU)',
              subtitle: 'Field execution, milestone triage, bottleneck resolution',
              icon: HardHat,
              color: '#D97706',
              bg: '#FFFBEB'
            },
            {
              id: 'admin' as const,
              title: 'System Admin (DIID Informatics)',
              subtitle: 'Data ingestion, schema governance, model retraining',
              icon: ShieldCheck,
              color: '#EF4444',
              bg: '#FEF2F2'
            }
          ].map((r) => {
            const isSelected = userRole === r.id;
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                onClick={() => setUserRole(r.id)}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: isSelected ? `2px solid ${r.color}` : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? r.bg : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={18} color={r.color} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{r.title}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={16} color={r.color} />}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: 1.4 }}>
                  {r.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ingestion & MLOps Governance Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Data Ingestion Pipeline */}
        <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={20} color="#0F172A" />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              MoSPI CUF Ingestion Pipeline
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
            Upload raw Common Upload Form (.xlsx / .csv) monthly flash data to execute automated canonical schema normalization.
          </p>
          <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.74rem' }}>
            <div>Loaded Projects: <strong>{summary?.total_projects || 1981}</strong></div>
            <div style={{ marginTop: '4px' }}>Dataset Baseline: <strong>April 2026 Real MoSPI Benchmark</strong></div>
          </div>
          <button
            onClick={onOpenIngest}
            className="btn-primary"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UploadCloud size={16} />
            <span>Launch Ingestion Pipeline Modal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
