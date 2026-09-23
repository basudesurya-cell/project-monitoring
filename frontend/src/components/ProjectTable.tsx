import React from 'react';
import { ChevronLeft, ChevronRight, Eye, ArrowUpDown } from 'lucide-react';
import type { Project } from '../types';

interface ProjectTableProps {
  projects: Project[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onSelectProject: (p: Project) => void;
  loading: boolean;
  sortBy: string;
  sortOrder: string;
  onSort: (col: string) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  total,
  page,
  perPage,
  totalPages,
  onPageChange,
  onSelectProject,
  loading,
  sortBy,
  sortOrder,
  onSort
}) => {
  const getRiskBadge = (tier: string) => {
    switch (tier) {
      case 'CRITICAL':
        return <span className="badge-critical" style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>CRITICAL</span>;
      case 'HIGH':
        return <span className="badge-high" style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>HIGH</span>;
      case 'MEDIUM':
        return <span className="badge-medium" style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>MEDIUM</span>;
      default:
        return <span className="badge-low" style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>LOW</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'var(--risk-critical)';
    if (score >= 50) return 'var(--risk-high)';
    if (score >= 25) return 'var(--risk-medium)';
    return 'var(--risk-low)';
  };

  return (
    <div style={{ padding: '0 28px 24px 28px' }}>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {/* Table Header Controls */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{projects.length > 0 ? (page - 1) * perPage + 1 : 0} - {Math.min(page * perPage, total)}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{total.toLocaleString()}</strong> projects
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Click row or "Inspect" to view SHAP risk attribution & peer benchmarking
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Project ID & Details</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sector & Agency</th>
                <th 
                  onClick={() => onSort('revised_cost')}
                  style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Approved / Revised Cost</span>
                    <ArrowUpDown size={12} />
                    {sortBy === 'revised_cost' && <span style={{ color: '#0F172A' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  onClick={() => onSort('delay_months')}
                  style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Delay (Months)</span>
                    <ArrowUpDown size={12} />
                    {sortBy === 'delay_months' && <span style={{ color: '#0F172A' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Physical Progress</th>
                <th 
                  onClick={() => onSort('risk_score')}
                  style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Composite Risk</span>
                    <ArrowUpDown size={12} />
                    {sortBy === 'risk_score' && <span style={{ color: '#0F172A' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading infrastructure projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No projects match the current filter criteria.
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const hasOverrun = p.cost_overrun_pct > 0;
                  const scoreColor = getScoreColor(p.risk_score);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProject(p)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Code & Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {p.project_id}
                          </span>
                          {p.project_status && p.project_status !== 'CRITICAL_WATCHLIST' && (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              background: p.project_status === 'DELAYED' ? 'rgba(245, 158, 11, 0.15)' :
                                          p.project_status === 'AHEAD_OF_SCHEDULE' ? '#F1F5F9' : 'rgba(16, 185, 129, 0.15)',
                              color: p.project_status === 'DELAYED' ? '#f59e0b' :
                                     p.project_status === 'AHEAD_OF_SCHEDULE' ? '#0F172A' : '#10b981',
                              border: `1px solid ${
                                p.project_status === 'DELAYED' ? 'rgba(245, 158, 11, 0.3)' :
                                p.project_status === 'AHEAD_OF_SCHEDULE' ? '#E2E8F0' : 'rgba(16, 185, 129, 0.3)'
                              }`
                            }}>
                              {p.project_status.replace(/_/g, ' ')}
                            </span>
                          )}
                          {p.is_predictive_warning && (
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              background: '#F1F5F9',
                              color: '#334155',
                              border: '1px solid #CBD5E1'
                            }}>
                              PREDICTIVE SIGNAL
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {p.project_name}
                        </div>
                        {/* Detected Problem Tag if Critical or Problem Flagged */}
                        {(p.problem_title || p.risk_score >= 75 || p.is_confirmed_problem || p.is_predictive_warning || p.cost_overrun_pct > 10 || p.delay_months > 6) && (
                          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: p.cost_overrun_pct > 15 && p.delay_months > 6 ? 'rgba(239, 68, 68, 0.12)' : p.cost_overrun_pct > 10 ? 'rgba(249, 115, 22, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: p.cost_overrun_pct > 15 && p.delay_months > 6 ? '#ef4444' : p.cost_overrun_pct > 10 ? '#f97316' : '#f59e0b',
                              border: `1px solid ${p.cost_overrun_pct > 15 && p.delay_months > 6 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                            }}>
                              Problem: {p.problem_title || p.diagnostics?.problem_title || (p.cost_overrun_pct > 15 && p.delay_months > 6 ? 'Compound Dual Escalation' : p.cost_overrun_pct > 10 ? 'Budget Escalation' : 'Schedule Slippage')}
                            </span>
                            {p.root_metrics_summary && (
                              <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                                📊 {p.root_metrics_summary}
                              </span>
                            )}
                            {p.delay_reasons && (
                              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.delay_reasons}>
                                🛑 {p.delay_reasons}
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          State: <span style={{ color: 'var(--text-secondary)' }}>{p.state_location || 'Multi-State'}</span>
                          {p.confidence_level && (
                            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>
                              • Confidence: <strong style={{ color: p.confidence_level === 'HIGH' ? '#059669' : '#d97706' }}>{p.confidence_level}</strong>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sector & Agency */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.sector}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {p.implementing_agency || p.ministry}
                        </div>
                      </td>

                      {/* Cost */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>₹{p.revised_cost.toLocaleString()} Cr</strong>
                          {hasOverrun && (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#F59E0B',
                              background: 'rgba(245, 158, 11, 0.15)',
                              padding: '1px 5px',
                              borderRadius: '4px'
                            }}>
                              +{p.cost_overrun_pct}%
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Approved: ₹{p.original_cost.toLocaleString()} Cr
                        </div>
                      </td>

                      {/* Delay */}
                      <td style={{ padding: '14px 16px' }}>
                        {p.delay_months > 0 ? (
                          <div>
                            <span style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: p.delay_months > 24 ? 'var(--risk-critical)' : '#F97316'
                            }}>
                              +{p.delay_months} months
                            </span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              DOC: {p.revised_doc || 'TBD'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 600 }}>
                            On Schedule
                          </span>
                        )}
                      </td>

                      {/* Progress */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                          <div style={{
                            flex: 1,
                            height: '6px',
                            background: 'rgba(0, 0, 0, 0.08)',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${p.physical_progress}%`,
                              height: '100%',
                              background: '#0F172A',
                              borderRadius: '9999px'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {p.physical_progress}%
                          </span>
                        </div>
                      </td>

                      {/* Composite Risk */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: scoreColor,
                            fontFamily: 'var(--font-heading)'
                          }}>
                            {p.risk_score}
                          </div>
                          {getRiskBadge(p.risk_tier)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(p);
                          }}
                        >
                          <Eye size={13} color="#0F172A" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Page <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem', opacity: page <= 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem', opacity: page >= totalPages ? 0.4 : 1 }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
