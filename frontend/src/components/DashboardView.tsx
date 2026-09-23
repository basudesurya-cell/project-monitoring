import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Layers,
  ChevronRight
} from 'lucide-react';
import { MetricsBar } from './MetricsBar';
import type { NavItemId } from './Sidebar';
import type { PortfolioSummary, EarlyWarningProject } from '../types';

interface DashboardViewProps {
  summary: PortfolioSummary | null;
  loadingSummary: boolean;
  alerts: EarlyWarningProject[];
  onNavigate: (tab: NavItemId) => void;
  onSelectProjectId: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  loadingSummary,
  alerts,
  onNavigate,
  onSelectProjectId
}) => {
  return (
    <div style={{ padding: '24px 28px 40px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Executive KPI Metrics Bar */}
      <MetricsBar
        summary={summary}
        loading={loadingSummary}
        onSelectCriticalWarnings={() => onNavigate('risk-signals')}
        onSelectPortfolio={() => onNavigate('projects')}
      />

      {/* Two Column Grid: Critical Risk Triage & Sectoral Capital Allocation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, 1fr)', gap: '20px' }}>
        {/* Left: Critical Risk Signals Spotlight */}
        <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#EF4444" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                High-Exposure Risk Signals
              </h3>
            </div>
            <button
              onClick={() => onNavigate('risk-signals')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0F172A',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All ({alerts.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <p style={{ fontSize: '0.76rem', color: '#64748B', margin: 0 }}>
            Prioritized by financial exposure (revised cost) and multi-factor ML risk scores.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.slice(0, 5).map((a) => (
              <div
                key={a.project_id}
                onClick={() => onSelectProjectId(a.project_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '65%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#0F172A', fontWeight: 600 }}>{a.project_id}</span>
                    <span style={{ fontSize: '0.68rem', color: '#64748B' }}>· {a.sector}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.project_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                    {a.delay_months > 0 && (
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#EA580C',
                        background: 'rgba(234, 88, 12, 0.1)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        ⏱️ +{a.delay_months}m slippage
                      </span>
                    )}
                    {a.cost_overrun_pct > 0 && (
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#DC2626',
                        background: 'rgba(220, 38, 38, 0.1)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        📈 +{a.cost_overrun_pct}% overrun
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: a.risk_score >= 75 ? '#DC2626' : '#D97706',
                      background: a.risk_score >= 75 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}>
                      {a.risk_tier}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#DC2626' }}>
                    Risk: {a.risk_score.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    ₹ {a.revised_cost.toLocaleString()} Cr
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sector Outlay & Escalation Share */}
        <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#0F172A" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Top Capital Expenditure Sectors
              </h3>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0F172A',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Explore</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {summary?.sectors?.slice(0, 6).map((s, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>{s.sector}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {s.project_count} projects · Avg Overrun: +{s.avg_cost_overrun_pct?.toFixed(1)}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                    ₹ {Math.round(s.total_revised_cost || 0).toLocaleString()} Cr
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#D97706' }}>
                    Avg Delay: {s.avg_delay_months?.toFixed(1)} mo
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
