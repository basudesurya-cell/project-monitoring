import React from 'react';
import {
  Archive,
  BarChart3,
  Download
} from 'lucide-react';
import { AnalyticsView } from './AnalyticsView';

interface SavedAnalysesViewProps {
  onOpenStatsModal: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export const SavedAnalysesView: React.FC<SavedAnalysesViewProps> = ({
  onOpenStatsModal,
  onExportCsv,
  onExportJson
}) => {
  const savedReports = [
    {
      id: 'REP_01',
      title: 'Portfolio Descriptive Statistical Profiling (FR-2.1 - 2.4)',
      date: 'April 2026 Audit Baseline',
      desc: 'Parametric & non-parametric distribution metrics (mean, median, IQR, skewness, kurtosis) across 1,981 central projects.',
      action: 'Open Profiler',
      onClick: onOpenStatsModal
    },
    {
      id: 'REP_02',
      title: 'MoSPI CUF Gap & Leading Indicators Diagnostic',
      date: 'Generated April 2026',
      desc: 'Comparative assessment of Common Upload Form variables vs missing leading indicators (statutory clearances, contractor liquidity).',
      action: 'View Below',
      onClick: undefined
    },
    {
      id: 'REP_03',
      title: 'Machine Learning Ensembles vs OLS Linear Baselines',
      date: 'Held-Out Test Split',
      desc: 'Side-by-side R², RMSE, MAE, and classification F1 benchmarking validating ML predictive superiority.',
      action: 'View Below',
      onClick: undefined
    }
  ];

  return (
    <div style={{ padding: '24px 28px 40px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Archive size={20} color="#0F172A" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Saved Analyses & Empirical Research Repository
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
              Access standardized MoSPI statistical profiling models, CUF sufficiency diagnostics, and export analytical snapshots.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onExportCsv}
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
              <Download size={15} />
              <span>Export CSV Snapshot</span>
            </button>
            <button
              onClick={onExportJson}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem'
              }}
            >
              <Download size={15} />
              <span>Export JSON Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Saved Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {savedReports.map((r) => (
          <div
            key={r.id}
            className="glass-card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#0F172A', fontWeight: 700 }}>{r.id}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{r.date}</span>
              </div>
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
                {r.title}
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '6px', lineHeight: 1.4 }}>
                {r.desc}
              </p>
            </div>

            {r.onClick && (
              <button
                onClick={r.onClick}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem'
                }}
              >
                <BarChart3 size={15} />
                <span>{r.action}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Embedded Deep Analytics: ML vs Baseline & CUF Gap Analysis */}
      <div>
        <AnalyticsView />
      </div>
    </div>
  );
};
