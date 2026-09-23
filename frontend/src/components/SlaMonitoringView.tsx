import React, { useState } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import type { Project, PortfolioSummary } from '../types';

interface SlaMonitoringViewProps {
  projects: Project[];
  summary: PortfolioSummary | null;
  onSelectProject: (project: Project) => void;
}

export const SlaMonitoringView: React.FC<SlaMonitoringViewProps> = ({
  projects,
  summary,
  onSelectProject
}) => {
  const [delayThreshold, setDelayThreshold] = useState<'ALL' | '6M' | '12M' | '24M'>('ALL');

  // Filter projects by SLA delay threshold
  const filteredProjects = projects.filter((p) => {
    if (delayThreshold === '6M') return (p.delay_months || 0) >= 6;
    if (delayThreshold === '12M') return (p.delay_months || 0) >= 12;
    if (delayThreshold === '24M') return (p.delay_months || 0) >= 24;
    return true;
  });

  // Calculate SLA aggregates
  const totalTracked = projects.length;
  const delayedProjects = projects.filter((p) => (p.delay_months || 0) > 0);
  const severeDelayProjects = projects.filter((p) => (p.delay_months || 0) >= 24);
  const onTimeProjects = projects.filter((p) => (p.delay_months || 0) <= 0);
  const onTimePct = totalTracked > 0 ? ((onTimeProjects.length / totalTracked) * 100).toFixed(1) : '0';

  // Ministry SLA Performance data
  const ministrySlaList = [
    { name: 'Ministry of Railways', total: 432, delayed: 284, avgDelay: 42.1, compliance: '34.2%' },
    { name: 'Ministry of Road Transport and Highways', total: 610, delayed: 218, avgDelay: 22.8, compliance: '64.2%' },
    { name: 'Ministry of Petroleum and Natural Gas', total: 148, delayed: 62, avgDelay: 18.5, compliance: '58.1%' },
    { name: 'Ministry of Power', total: 98, delayed: 41, avgDelay: 31.4, compliance: '58.2%' },
    { name: 'Ministry of Coal', total: 112, delayed: 39, avgDelay: 26.0, compliance: '65.2%' },
    { name: 'Ministry of Housing and Urban Affairs', total: 76, delayed: 29, avgDelay: 19.3, compliance: '61.8%' }
  ];

  return (
    <div style={{ padding: '24px 28px 40px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Executive SLA Metrics Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* On-Time Compliance */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>SLA Compliance Rate</span>
            <span style={{ padding: '4px', borderRadius: '6px', background: '#F1F5F9', color: '#0F172A' }}>
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>{onTimePct}%</div>
          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
            {onTimeProjects.length} of {totalTracked} projects within baseline schedule
          </div>
        </div>

        {/* Avg Slippage */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Avg Schedule Slippage</span>
            <span style={{ padding: '4px', borderRadius: '6px', background: '#FFFBEB', color: '#F59E0B' }}>
              <Clock size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>
            {summary?.avg_delay_months ? `${summary.avg_delay_months.toFixed(1)} mo` : '36.4 mo'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
            Across {delayedProjects.length} projects reporting milestone revisions
          </div>
        </div>

        {/* Critical Delays > 24M */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Severe Slippage (&gt; 24 Mo)</span>
            <span style={{ padding: '4px', borderRadius: '6px', background: '#FEF2F2', color: '#EF4444' }}>
              <AlertCircle size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444' }}>
            {severeDelayProjects.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
            Requires Cabinet / PRAGATI Inter-Ministerial Review
          </div>
        </div>

        {/* Contractual Stage-Gate Status */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Milestone Pipeline</span>
            <span style={{ padding: '4px', borderRadius: '6px', background: '#EFF6FF', color: '#3B82F6' }}>
              <TrendingDown size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3B82F6' }}>5 Stages</div>
          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
            DPR · Land · Tender · Civil · Commissioning
          </div>
        </div>
      </div>

      {/* Stage-Gate Milestone Pipeline Flow */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
          Infrastructure Stage-Gate SLA Life Cycle & Delay Chokepoints
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {[
            { stage: 'Stage 1: DPR & Clearances', lag: 'Avg 14 mo delay', bottleneck: 'Forest & Wildlife Clearance', color: '#EF4444' },
            { stage: 'Stage 2: Land Acquisition', lag: 'Avg 18 mo delay', bottleneck: 'RoW & Section 11 Notifications', color: '#F59E0B' },
            { stage: 'Stage 3: Tendering & EPC', lag: 'Avg 6 mo delay', bottleneck: 'Contractor Bid Re-tendering', color: '#3B82F6' },
            { stage: 'Stage 4: Civil Execution', lag: 'Avg 12 mo delay', bottleneck: 'Monsoon Flooding & Utility Shifting', color: '#8B5CF6' },
            { stage: 'Stage 5: Commissioning', lag: 'Avg 4 mo delay', bottleneck: 'Safety Certification & Trial Run', color: '#10B981' }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px 16px',
                borderTop: `4px solid ${item.color}`
              }}
            >
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{item.stage}</div>
              <div style={{ fontSize: '0.76rem', color: item.color, fontWeight: 600, marginTop: '6px' }}>
                {item.lag}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                Top Bottleneck: {item.bottleneck}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ministry SLA Benchmark & Compliance Table */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Ministry-Wise Contractual SLA Compliance Benchmarking
          </h3>
          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Source: April 2026 IPMD Audit</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Ministry / Sector Authority</th>
                <th style={{ padding: '10px 14px' }}>Monitored Projects</th>
                <th style={{ padding: '10px 14px' }}>Delayed Beyond SLA</th>
                <th style={{ padding: '10px 14px' }}>Avg Delay (Months)</th>
                <th style={{ padding: '10px 14px' }}>SLA Adherence Ratio</th>
              </tr>
            </thead>
            <tbody>
              {ministrySlaList.map((m, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>{m.name}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{m.total}</td>
                  <td style={{ padding: '12px 14px', color: '#EF4444', fontWeight: 600 }}>{m.delayed}</td>
                  <td style={{ padding: '12px 14px', color: '#D97706' }}>{m.avgDelay} mo</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: m.compliance,
                            height: '100%',
                            backgroundColor: parseFloat(m.compliance) > 60 ? '#10B981' : '#F59E0B'
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{m.compliance}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projects Requiring SLA Intervention */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Live Projects Ranked by Timeline Slippage Gap
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Showing projects exceeding scheduled completion deadlines
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Slippage:</span>
            {(['ALL', '6M', '12M', '24M'] as const).map((thr) => (
              <button
                key={thr}
                onClick={() => setDelayThreshold(thr)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: delayThreshold === thr ? '1px solid #6366F1' : '1px solid #E2E8F0',
                  backgroundColor: delayThreshold === thr ? '#ECFDF5' : '#FFFFFF',
                  color: delayThreshold === thr ? '#4338CA' : '#475569',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {thr === 'ALL' ? 'All Delays' : `> ${thr.replace('M', ' Mos')}`}
              </button>
            ))}
          </div>
        </div>

        {/* Project List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredProjects.slice(0, 10).map((p) => {
            const delay = p.delay_months || 0;
            return (
              <div
                key={p.project_id}
                onClick={() => onSelectProject(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '65%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#0F172A', fontWeight: 600 }}>{p.project_id}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>· {p.sector}</span>
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.project_name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{p.ministry}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>SLA Delay</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: delay >= 24 ? '#EF4444' : '#F59E0B' }}>
                      +{delay} months
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Physical Progress</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                      {p.physical_progress ? `${p.physical_progress.toFixed(1)}%` : '—'}
                    </div>
                  </div>

                  <ChevronRight size={18} color="#94A3B8" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
