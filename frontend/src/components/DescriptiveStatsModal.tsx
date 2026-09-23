import React, { useEffect, useState } from 'react';
import { 
  X, 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert,
  HelpCircle,
  Layers
} from 'lucide-react';
import type { DescriptiveStatisticsResponse } from '../types';
import { api } from '../services/api';

interface DescriptiveStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sector?: string;
  ministry?: string;
}

export const DescriptiveStatsModal: React.FC<DescriptiveStatsModalProps> = ({
  isOpen,
  onClose,
  sector,
  ministry,
}) => {
  const [stats, setStats] = useState<DescriptiveStatisticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      api.getDescriptiveStatistics(sector, ministry)
        .then((res) => setStats(res))
        .catch(() => {
          setError('Failed to compute descriptive statistics. Please try again.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, sector, ministry]);

  if (!isOpen) return null;

  const metricLabels: Record<string, { title: string; unit: string; desc: string }> = {
    original_cost: { title: 'Original Sanctioned Cost', unit: '₹ Cr', desc: 'Baseline budget distribution (FR-2.1)' },
    revised_cost: { title: 'Revised / Current Cost', unit: '₹ Cr', desc: 'Current escalated commitment distribution (FR-2.1)' },
    cumulative_expenditure: { title: 'Cumulative Expenditure', unit: '₹ Cr', desc: 'Actual funds booked to date (FR-2.2)' },
    physical_progress: { title: 'Physical Progress', unit: '%', desc: 'Recorded on-ground milestone completion (FR-2.2)' },
    cost_overrun_pct: { title: 'Cost Escalation Overrun', unit: '%', desc: 'Percentage escalation over original sanction (FR-2.3)' },
    delay_months: { title: 'Schedule Slippage Delay', unit: 'Months', desc: 'Net recorded slippage beyond original DOC (FR-2.3)' },
    risk_score: { title: 'Composite Risk Score', unit: 'Pts', desc: 'Calibrated predictive score 0-100 (FR-2.4)' },
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: '#0F172A',
              border: '1px solid #0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <BarChart3 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Descriptive Statistical Profiling
                </h2>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  fontWeight: 600
                }}>
                  SRS v2.0 FR-2.1 – 2.4
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {stats ? stats.scope : 'Computing distribution metrics...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '1.75rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {loading && (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Calculating portfolio distributions (mean, median, std, quartiles, IQR)...</p>
            </div>
          )}

          {error && (
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171'
            }}>
              {error}
            </div>
          )}

          {stats && !loading && (
            <>
              {/* Dual-State Categorization Banner (FR-5.3 & NFR-9) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444'
                  }}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#f87171', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Confirmed Project Problems
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                      {stats.confirmed_problem_count.toLocaleString()}
                      <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                        ({Math.round((stats.confirmed_problem_count / stats.total_projects) * 100)}%)
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Active recorded deficits: cost overrun &gt; 10% or schedule delay &gt; 6 months.
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    background: '#F1F5F9',
                    color: '#0F172A'
                  }}>
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#0F172A', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Predictive Early Warnings
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                      {stats.predictive_warning_count.toLocaleString()}
                      <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                        ({Math.round((stats.predictive_warning_count / stats.total_projects) * 100)}%)
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Latent risk signals: high expenditure velocity divergence while officially on-track.
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981'
                  }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Healthy / On Track Projects
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                      {(stats.total_projects - stats.confirmed_problem_count - stats.predictive_warning_count).toLocaleString()}
                      <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                        ({Math.max(0, Math.round(((stats.total_projects - stats.confirmed_problem_count - stats.predictive_warning_count) / stats.total_projects) * 100))}%)
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Synchronized spend & progress within normal tolerance boundaries.
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Lifecycle Distribution (FR-1.2 & FR-8.3) */}
              <div style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Layers size={18} color="var(--primary-color)" />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Project Status Lifecycle Distribution
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {Object.entries(stats.status_distribution).map(([status, count]) => {
                    let badgeColor = '#3b82f6';
                    let bg = 'rgba(59, 130, 246, 0.1)';
                    if (status === 'CRITICAL_WATCHLIST') {
                      badgeColor = '#ef4444';
                      bg = 'rgba(239, 68, 68, 0.15)';
                    } else if (status === 'DELAYED') {
                      badgeColor = '#f59e0b';
                      bg = 'rgba(245, 158, 11, 0.15)';
                    } else if (status === 'ONGOING_ON_TRACK') {
                      badgeColor = '#10b981';
                      bg = 'rgba(16, 185, 129, 0.15)';
                    } else if (status === 'AHEAD_OF_SCHEDULE') {
                      badgeColor = '#06b6d4';
                      bg = 'rgba(6, 182, 212, 0.15)';
                    }
                    const pct = Math.round((count / stats.total_projects) * 100);
                    return (
                      <div key={status} style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: bg,
                        border: `1px solid ${badgeColor}40`
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: badgeColor }}>
                          {status.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {count.toLocaleString()}
                          <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                            ({pct}%)
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: badgeColor, borderRadius: '2px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rigorous Statistical Distribution Metrics Table (FR-2.1 - FR-2.4) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} color="var(--primary-color)" />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Parametric & Non-Parametric Distribution Profiling
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    IQR = Interquartile Range (75th - 25th percentile)
                  </span>
                </div>

                <div style={{
                  overflowX: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-tertiary)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Metric Variable</th>
                        <th style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Unit</th>
                        <th style={{ padding: '0.85rem 0.75rem', color: 'var(--text-primary)', fontWeight: 700 }}>Mean (μ)</th>
                        <th style={{ padding: '0.85rem 0.75rem', color: 'var(--text-primary)', fontWeight: 700 }}>Median</th>
                        <th style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Std Dev (σ)</th>
                        <th style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>25th %ile (Q1)</th>
                        <th style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>75th %ile (Q3)</th>
                        <th style={{ padding: '0.85rem 0.75rem', color: '#818cf8', fontWeight: 700 }}>IQR</th>
                        <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Range (Min - Max)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.metrics).map(([key, m], idx) => {
                        const info = metricLabels[key] || { title: key, unit: '', desc: '' };
                        return (
                          <tr 
                            key={key}
                            style={{ 
                              borderBottom: idx < Object.keys(stats.metrics).length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                            }}
                          >
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{info.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{info.desc}</div>
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>{info.unit}</td>
                            <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {m.mean.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: '#38bdf8' }}>
                              {m.median.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>
                              ±{m.std.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>
                              {m.p25.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>
                              {m.p75.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#a78bfa' }}>
                              {m.iqr.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {m.min.toLocaleString()} — {m.max.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Methodological Guidance & Disclaimers (FR-7.4 & NFR-9) */}
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <HelpCircle size={20} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--accent-indigo)' }}>Decision-Support Calibration Notice (FR-7.4 & NFR-9): </strong>
                  Descriptive statistical distributions model empirical cost escalation and schedule variance across MoSPI infrastructure portfolios.
                  Early warning indicators represent probabilistic decision-support signals designed to prioritize executive scrutiny, not deterministic certainty.
                  Confirmed problems reflect verified financial escalations and DOC delays already audited in official reports.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          background: 'var(--bg-secondary)'
        }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            Close Profiler
          </button>
        </div>
      </div>
    </div>
  );
};
