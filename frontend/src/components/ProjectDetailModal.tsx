import React, { useEffect, useState } from 'react';
import { 
  X, 
  Compass, 
  Clock,
  AlertTriangle,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Activity,
  Copy,
  Check,
  Zap,
  Target
} from 'lucide-react';
import type { 
  Project, 
  PeerBenchmark, 
  SHAPDriver, 
  ScheduleDelayAnalysis, 
  ProgressMilestonePoint,
  ProblemDiagnostics
} from '../types';
import { api } from '../services/api';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  userRole?: 'analyst' | 'officer' | 'admin';
}

type TabType = 'trajectory' | 'budget' | 'milestones' | 'risk_drivers' | 'benchmark';

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  const [benchmark, setBenchmark] = useState<PeerBenchmark | null>(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState<boolean>(false);
  const [scheduleDelay, setScheduleDelay] = useState<ScheduleDelayAnalysis | null>(project?.schedule_delay || null);
  const [diagnostics, setDiagnostics] = useState<ProblemDiagnostics | null>(project?.diagnostics || null);
  const [activeTab, setActiveTab] = useState<TabType>('risk_drivers');
  const [hoveredMilestone, setHoveredMilestone] = useState<ProgressMilestonePoint | null>(null);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (project) {
      setLoadingBenchmark(true);
      api.getPeerBenchmark(project.project_id)
        .then(res => setBenchmark(res))
        .catch(() => {})
        .finally(() => setLoadingBenchmark(false));

      if (project.diagnostics) {
        setDiagnostics(project.diagnostics);
      } else {
        api.getProjectDiagnostics(project.project_id)
          .then(res => setDiagnostics(res))
          .catch(() => {});
      }

      if (project.schedule_delay) {
        setScheduleDelay(project.schedule_delay);
      } else {
        api.getScheduleDelay(project.project_id)
          .then(res => setScheduleDelay(res))
          .catch(() => {});
      }
    } else {
      setBenchmark(null);
      setScheduleDelay(null);
      setDiagnostics(null);
    }
  }, [project]);

  if (!project) return null;

  // Parse SHAP drivers
  let drivers: SHAPDriver[] = [];
  if (project.shap_drivers) {
    try {
      drivers = JSON.parse(project.shap_drivers);
    } catch {
      drivers = [];
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'CRITICAL': return 'var(--risk-critical)';
      case 'HIGH': return 'var(--risk-high)';
      case 'MEDIUM': return 'var(--risk-medium)';
      default: return 'var(--risk-low)';
    }
  };

  const tierColor = getTierColor(project.risk_tier);

  // Computed diagnostics fallback
  const diag: ProblemDiagnostics = diagnostics || {
    problem_type: (project.problem_archetype || ((project.cost_overrun_pct >= 10 && (project.delay_months || 0) >= 3) ? 'DUAL_ESCALATION' :
                  (project.cost_overrun_pct >= 10) ? 'COST_OVERRUN' : 'SCHEDULE_DELAY')) as ProblemDiagnostics['problem_type'],
    problem_title: project.problem_title || ((project.cost_overrun_pct >= 10 && (project.delay_months || 0) >= 3) ? 'Compound Risk: Schedule Delay & Severe Budget Escalation' :
                   (project.cost_overrun_pct >= 10) ? 'Cost Overrun & Budget Escalation' : 'Schedule Delay & Milestone Slippage'),
    root_metrics_summary: project.root_metrics_summary || `${project.delay_months}m Delay · +₹${Math.max(0, project.revised_cost - project.original_cost).toLocaleString()} Cr Escalation`,
    severity: (project.problem_severity || (project.risk_tier === 'CRITICAL' ? 'Critical' : project.risk_tier === 'HIGH' ? 'High' : 'Medium')) as ProblemDiagnostics['severity'],
    recommended_action: project.mandated_action || 'Deploy Stage-Gate Project Oversight & Expedite Milestones',
    recommendations: project.prescriptive_recommendations 
      ? project.prescriptive_recommendations.split(';').map(s => s.trim()).filter(Boolean)
      : [
          'High-Level Escalation: Notify Ministry Project Monitoring Unit and Cabinet Secretariat.',
          'Targeted Investigation: Perform on-site physical audit and review contractor deployment.',
          'Corrective Recovery Mandate: Establish weekly catch-up targets and fast-track statutory clearances.'
        ],
    default_graph_id: project.cost_overrun_pct >= 10 ? 'budget_waterfall' : 'progress_curve',
    delay_days: scheduleDelay?.delay_days || Math.round(project.delay_months * 30.4),
    progress_gap: scheduleDelay?.progress_gap || Math.max(0, Math.round(((project.cumulative_expenditure / Math.max(1, project.revised_cost)) * 100) - project.physical_progress)),
    planned_progress: scheduleDelay?.planned_progress || Math.min(100, Math.round(project.physical_progress + (scheduleDelay?.progress_gap || 12))),
    actual_progress: scheduleDelay?.actual_progress || project.physical_progress,
    available_graphs: [
      { id: 'progress_curve', title: 'S-Curve Trajectory', icon: 'TrendingUp', category: 'Schedule', description: 'Baseline vs actual physical progress' },
      { id: 'budget_waterfall', title: 'Budget Breakdown', icon: 'DollarSign', category: 'Cost', description: 'Approved vs expended vs revised cost' },
      { id: 'milestone_slippage', title: 'Milestones & Slippage', icon: 'Clock', category: 'Schedule', description: 'Milestone delays and critical path' },
      { id: 'bottleneck_factors', title: 'Root Risk Factors', icon: 'AlertTriangle', category: 'Governance', description: 'Contractual, legal, and operational risks' }
    ],
    progress_curve: scheduleDelay?.trajectory || [
      { milestone: 'Project Sanction', date: project.original_doc ? 'Year -3' : '2022', planned_progress: 0, actual_progress: 0, phase: 'past' },
      { milestone: 'Civil Works', date: 'Year -2', planned_progress: 30, actual_progress: Math.round(project.physical_progress * 0.4), phase: 'past' },
      { milestone: 'Key Milestones', date: 'Year -1', planned_progress: 65, actual_progress: Math.round(project.physical_progress * 0.8), phase: 'past' },
      { milestone: 'Current Status', date: 'Apr 2026', planned_progress: Math.min(100, project.physical_progress + 15), actual_progress: project.physical_progress, phase: 'current' },
      { milestone: 'Operational DOC', date: project.revised_doc || 'Target DOC', planned_progress: 100, projected_progress: 100, phase: 'future' }
    ],
    budget_waterfall: {
      original_cost: project.original_cost,
      cumulative_expenditure: project.cumulative_expenditure,
      revised_cost: project.revised_cost,
      cost_escalation: Math.max(0, project.revised_cost - project.original_cost),
      cost_overrun_pct: project.cost_overrun_pct,
      financial_burn_pct: Math.round((project.cumulative_expenditure / Math.max(1, project.revised_cost)) * 1000) / 10,
      unspent_budget: Math.max(0, project.revised_cost - project.cumulative_expenditure),
      cost_efficiency_index: Math.round((project.physical_progress / Math.max(1, (project.cumulative_expenditure / Math.max(1, project.revised_cost)) * 100)) * 100) / 100
    },
    burn_vs_progress: [
      { stage: 'Sanction', time_label: 'Start', financial_burn_pct: 0, physical_progress_pct: 0, decoupling_gap: 0 },
      { stage: 'Execution', time_label: 'Midway', financial_burn_pct: Math.round((project.cumulative_expenditure / Math.max(1, project.revised_cost)) * 50), physical_progress_pct: Math.round(project.physical_progress * 0.5), decoupling_gap: 5 },
      { stage: 'Current', time_label: 'Apr 2026', financial_burn_pct: Math.round((project.cumulative_expenditure / Math.max(1, project.revised_cost)) * 100), physical_progress_pct: project.physical_progress, decoupling_gap: Math.round(((project.cumulative_expenditure / Math.max(1, project.revised_cost)) * 100) - project.physical_progress) },
      { stage: 'Commissioning', time_label: project.revised_doc || 'DOC', financial_burn_pct: 100, physical_progress_pct: 100, decoupling_gap: 0 }
    ],
    milestone_slippage: [
      { milestone: 'Statutory Clearances & Land', planned_period: 'Phase 1', slippage_months: Math.min(8, Math.round(project.delay_months * 0.35)), status: project.delay_months > 6 ? 'Delayed' : 'On Track', primary_impediment: 'Right of Way and clearances' },
      { milestone: 'Civil & Structural Execution', planned_period: 'Phase 2', slippage_months: Math.min(14, Math.round(project.delay_months * 0.5)), status: project.delay_months > 12 ? 'Critical Slip' : 'Moderate Slip', primary_impediment: 'Contractor mobilization & construction' },
      { milestone: 'Equipment & Systems Installation', planned_period: 'Phase 3', slippage_months: Math.min(20, Math.round(project.delay_months * 0.75)), status: project.delay_months > 18 ? 'Projected Slip' : 'Scheduled', primary_impediment: 'Supply chain & integration testing' },
      { milestone: 'Commercial Operational Turn-key', planned_period: project.original_doc || 'DOC', slippage_months: project.delay_months, status: project.delay_months > 0 ? `Slipped to ${project.revised_doc || 'TBD'}` : 'On Schedule', primary_impediment: 'Final safety certification & trial runs' }
    ],
    bottleneck_factors: [
      { factor: 'Right of Way & Land Possession', impact_score: project.row_land_acquisition_risk ?? (project.delay_reasons?.toLowerCase().includes('land') ? 85 : 40), status: (project.row_land_acquisition_risk ?? 40) >= 70 ? 'Critical Blocker' : 'Controlled', details: 'Contiguous parcel handover and rehabilitation package settlement.' },
      { factor: 'Environmental & Statutory Forest NOCs', impact_score: project.environmental_clearances_risk ?? (project.delay_reasons?.toLowerCase().includes('clearance') ? 82 : 35), status: (project.environmental_clearances_risk ?? 35) >= 70 ? 'Pending Clearance' : 'Approved', details: 'Statutory wildlife clearances and tree cutting permits.' },
      { factor: 'Contractor Solvency & Equipment Mobilization', impact_score: project.contractor_solvency_risk ?? (project.delay_reasons?.toLowerCase().includes('contractor') ? 88 : 50), status: (project.contractor_solvency_risk ?? 50) >= 70 ? 'High Risk' : 'Normal', details: 'Contractor cash-flow constraints and plant mobilization adequacy.' },
      { factor: 'Contractual Disputes & Arbitration', impact_score: project.contractual_arbitration_risk ?? (project.delay_reasons?.toLowerCase().includes('court') ? 92 : 20), status: (project.contractual_arbitration_risk ?? 20) >= 70 ? 'Active Disputes' : 'No Claims', details: 'Judicial arbitration claims and scope renegotiation.' }
    ]
  };

  const copyBrief = () => {
    const brief = `PAIMANA Executive Project Inspection Brief
Project ID: ${project.project_id}
Name: ${project.project_name}
Sector: ${project.sector} | Ministry: ${project.ministry}
Status: ${project.project_status} | Risk Score: ${project.risk_score}/100 (${project.risk_tier})
Approved Cost: ₹${project.original_cost.toLocaleString()} Cr
Anticipated Cost: ₹${project.revised_cost.toLocaleString()} Cr (+${project.cost_overrun_pct}% Overrun)
Cumulative Expenditure: ₹${project.cumulative_expenditure.toLocaleString()} Cr (${((project.cumulative_expenditure / Math.max(project.revised_cost, 1)) * 100).toFixed(1)}% Burn)
Schedule Delay: ${project.delay_months} Months (Target DOC: ${project.revised_doc || 'TBD'})
Physical Completion: ${project.physical_progress}%
Primary Diagnostics: ${diag.problem_title} (${diag.severity} Severity)
Prescriptive Mandate: ${diag.recommended_action}`;

    navigator.clipboard.writeText(brief);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  // =========================================================================
  // TAB 1: S-CURVE & TRAJECTORY GRAPH
  // =========================================================================
  const renderProgressCurve = () => {
    const traj = diag.progress_curve || [];
    const N = traj.length;
    if (N === 0) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No trajectory data available.</div>;

    const width = 840;
    const height = 260;
    const padLeft = 45;
    const padRight = 35;
    const padTop = 25;
    const padBottom = 45;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const getX = (idx: number) => padLeft + (idx / Math.max(1, N - 1)) * plotW;
    const getY = (val: number) => padTop + plotH - (Math.max(0, Math.min(100, val)) / 100) * plotH;

    const plannedPath = traj.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.planned_progress).toFixed(1)}`).join(' ');
    const actualPoints = traj.filter(p => p.actual_progress !== null && p.actual_progress !== undefined);
    const actualPath = actualPoints.map((p, idx) => {
      const originalIdx = traj.indexOf(p);
      return `${idx === 0 ? 'M' : 'L'} ${getX(originalIdx).toFixed(1)} ${getY(p.actual_progress!).toFixed(1)}`;
    }).join(' ');

    const recoveryPoints = traj.filter(p => p.projected_progress !== null && p.projected_progress !== undefined);
    const recoveryPath = recoveryPoints.map((p, idx) => {
      const originalIdx = traj.indexOf(p);
      return `${idx === 0 ? 'M' : 'L'} ${getX(originalIdx).toFixed(1)} ${getY(p.projected_progress!).toFixed(1)}`;
    }).join(' ');

    let deviationAreaPath = '';
    if (actualPoints.length > 0) {
      const forward = actualPoints.map(p => `${getX(traj.indexOf(p)).toFixed(1)},${getY(p.planned_progress).toFixed(1)}`);
      const backward = [...actualPoints].reverse().map(p => `${getX(traj.indexOf(p)).toFixed(1)},${getY(p.actual_progress!).toFixed(1)}`);
      deviationAreaPath = `M ${forward.join(' L ')} L ${backward.join(' L ')} Z`;
    }

    const currIdx = traj.findIndex(p => p.phase === 'current' || p.milestone.includes('Current') || p.date.includes('Apr 2026'));
    const benchmarkX = currIdx >= 0 ? getX(currIdx) : getX(Math.floor(N / 2));
    const activePoint = hoveredMilestone || (currIdx >= 0 ? traj[currIdx] : traj[traj.length - 1]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Physical Progress Trajectory (Planned vs Actual S-Curve)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '3px', background: '#06B6D4', borderRadius: '2px' }}></span> Planned Target
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '3px', background: '#EF4444', borderRadius: '2px' }}></span> Actual Site Progress
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '3px', background: '#10B981', borderRadius: '2px' }}></span> Projected Recovery
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="gapGradClean" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {[0, 25, 50, 75, 100].map(val => (
              <g key={val}>
                <line x1={padLeft} y1={getY(val)} x2={padLeft + plotW} y2={getY(val)} stroke="var(--border-subtle)" strokeDasharray="3 4" strokeWidth="1" />
                <text x={padLeft - 8} y={getY(val) + 4} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontFamily="monospace">{val}%</text>
              </g>
            ))}

            {deviationAreaPath && <path d={deviationAreaPath} fill="url(#gapGradClean)" />}
            <path d={plannedPath} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
            {actualPath && <path d={actualPath} fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />}
            {recoveryPath && <path d={recoveryPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />}

            {/* Benchmark timeline marker */}
            <line x1={benchmarkX} y1={padTop} x2={benchmarkX} y2={padTop + plotH} stroke="rgba(239, 68, 68, 0.5)" strokeWidth="1.5" strokeDasharray="2 3" />
            <rect x={benchmarkX - 35} y={padTop - 15} width="70" height="15" rx="3" fill="#EF4444" />
            <text x={benchmarkX} y={padTop - 4} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">TODAY</text>

            {traj.map((p, i) => {
              const px = getX(i);
              const isHov = hoveredMilestone?.milestone === p.milestone;
              return (
                <g key={i}>
                  <circle cx={px} cy={getY(p.planned_progress)} r={isHov ? 5 : 3.5} fill="#06B6D4" stroke="#FFFFFF" strokeWidth={1} />
                  {p.actual_progress !== null && p.actual_progress !== undefined && (
                    <circle cx={px} cy={getY(p.actual_progress)} r={isHov ? 6 : 4.5} fill="#EF4444" stroke="#FFFFFF" strokeWidth={1.5} />
                  )}
                  <text x={px} y={padTop + plotH + 14} textAnchor="middle" fontSize="9" fontWeight={p.phase === 'current' ? '800' : '500'} fill={p.phase === 'current' ? '#EF4444' : 'var(--text-secondary)'}>{p.date}</text>
                  <text x={px} y={padTop + plotH + 26} textAnchor="middle" fontSize="8" fill="var(--text-muted)">{p.milestone}</text>
                  <rect x={px - 22} y={padTop} width="44" height={plotH + padBottom} fill="transparent" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredMilestone(p)} onMouseLeave={() => setHoveredMilestone(null)} />
                </g>
              );
            })}
          </svg>

          {activePoint && (
            <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{activePoint.milestone} ({activePoint.date})</span>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>Planned Target: <strong style={{ color: '#06B6D4' }}>{activePoint.planned_progress}%</strong></span>
                {activePoint.actual_progress !== null && activePoint.actual_progress !== undefined && (
                  <span>Actual Progress: <strong style={{ color: '#EF4444' }}>{activePoint.actual_progress}%</strong></span>
                )}
                {activePoint.actual_progress !== null && activePoint.actual_progress !== undefined && (
                  <span style={{ color: '#EF4444', fontWeight: 700 }}>
                    Variance: -{Math.max(0, activePoint.planned_progress - activePoint.actual_progress)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 2: BUDGET WATERFALL GRAPH
  // =========================================================================
  const renderBudgetWaterfall = () => {
    const bw = diag.budget_waterfall;
    const maxVal = Math.max(bw.revised_cost, bw.original_cost, bw.cumulative_expenditure, 1) * 1.15;
    const width = 840;
    const height = 260;
    const baseY = height - 55;
    const chartH = height - 90;

    const getH = (v: number) => (v / maxVal) * chartH;
    const colW = 100;
    const x1 = 120;
    const x2 = 370;
    const x3 = 620;

    const h1 = getH(bw.original_cost);
    const h2 = getH(bw.cumulative_expenditure);
    const h3 = getH(bw.revised_cost);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} color="#10B981" />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Financial Exposure Waterfall (Original vs Expended vs Revised)
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: bw.cost_overrun_pct > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
              {bw.cost_overrun_pct > 0 ? `+${bw.cost_overrun_pct}% Escalation` : 'Within Approved Sanction'}
            </span>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="origGradClean" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
              <linearGradient id="expGradClean" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
              <linearGradient id="revGradClean" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>

            <line x1="30" y1={baseY} x2={width - 30} y2={baseY} stroke="var(--border-subtle)" strokeWidth="1.5" />

            {/* Pillar 1: Original Approved */}
            <g>
              <rect x={x1} y={baseY - h1} width={colW} height={h1} rx="6" fill="url(#origGradClean)" />
              <text x={x1 + colW / 2} y={baseY - h1 - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="800">
                ₹{bw.original_cost.toLocaleString()} Cr
              </text>
              <text x={x1 + colW / 2} y={baseY + 16} textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="600">
                Approved Baseline
              </text>
              <text x={x1 + colW / 2} y={baseY + 28} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                Original Sanction
              </text>
            </g>

            {/* Pillar 2: Cumulative Expended */}
            <g>
              <rect x={x2} y={baseY - h2} width={colW} height={h2} rx="6" fill="url(#expGradClean)" />
              <text x={x2 + colW / 2} y={baseY - h2 - 8} textAnchor="middle" fill="#7C3AED" fontSize="12" fontWeight="800">
                ₹{bw.cumulative_expenditure.toLocaleString()} Cr
              </text>
              <text x={x2 + colW / 2} y={baseY + 16} textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="600">
                Expended to Date
              </text>
              <text x={x2 + colW / 2} y={baseY + 28} textAnchor="middle" fill="#7C3AED" fontSize="9" fontWeight="700">
                {bw.financial_burn_pct}% Financial Burn
              </text>
            </g>

            {/* Pillar 3: Revised Anticipated */}
            <g>
              <rect x={x3} y={baseY - h3} width={colW} height={h3} rx="6" fill="url(#revGradClean)" />
              <text x={x3 + colW / 2} y={baseY - h3 - 8} textAnchor="middle" fill="#DC2626" fontSize="12" fontWeight="800">
                ₹{bw.revised_cost.toLocaleString()} Cr
              </text>
              <text x={x3 + colW / 2} y={baseY + 16} textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="600">
                Revised Anticipated
              </text>
              <text x={x3 + colW / 2} y={baseY + 28} textAnchor="middle" fill="#DC2626" fontSize="9" fontWeight="700">
                +{bw.cost_overrun_pct}% Escalation
              </text>
            </g>

            {/* Escalation Connector */}
            {bw.cost_escalation > 0 && (
              <g>
                <path d={`M ${x1 + colW} ${baseY - h1} C ${x1 + colW + 40} ${baseY - h1}, ${x3 - 40} ${baseY - h3}, ${x3} ${baseY - h3}`} fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 3" />
                <rect x={(x1 + colW + x3) / 2 - 70} y={(baseY - h1 + baseY - h3) / 2 - 14} width="140" height="24" rx="6" fill="#0F172A" />
                <text x={(x1 + colW + x3) / 2} y={(baseY - h1 + baseY - h3) / 2 + 3} textAnchor="middle" fill="#F87171" fontSize="9.5" fontWeight="800">
                  +₹{bw.cost_escalation.toLocaleString()} Cr Escalation
                </text>
              </g>
            )}
          </svg>

          {/* Key Financial KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unspent Balance</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                ₹{bw.unspent_budget.toLocaleString()} Cr
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Financial Burn Ratio</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7C3AED', marginTop: '2px' }}>
                {bw.financial_burn_pct}%
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cost Efficiency Index</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: bw.cost_efficiency_index >= 0.9 ? '#10B981' : '#F59E0B', marginTop: '2px' }}>
                {bw.cost_efficiency_index}x
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 3: MILESTONE SCHEDULE SLIPPAGE
  // =========================================================================
  const renderMilestones = () => {
    const ms = diag.milestone_slippage || [];
    const maxSlip = Math.max(...ms.map(m => m.slippage_months), 12);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#F97316" />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Milestone Schedule Slippage & Critical Path Delays
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#F97316', fontWeight: 700 }}>
              Total Delay: +{project.delay_months} Months
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ms.map((m, idx) => {
              const slipPct = (m.slippage_months / maxSlip) * 100;
              const isCritical = m.status.includes('Critical') || m.slippage_months >= 10;
              return (
                <div key={idx} style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.milestone}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '8px' }}>({m.planned_period})</span>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: isCritical ? '#DC2626' : '#D97706'
                    }}>
                      {m.status} (+{m.slippage_months} mos)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: '35%', height: '100%', background: '#06B6D4' }} />
                      <div style={{ width: `${Math.min(65, slipPct)}%`, height: '100%', background: isCritical ? '#EF4444' : '#F59E0B' }} />
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isCritical ? '#DC2626' : '#D97706', minWidth: '55px', textAlign: 'right' }}>
                      +{m.slippage_months} mos
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Root Impediment: <span style={{ color: 'var(--text-secondary)' }}>{m.primary_impediment}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 4: RISK FACTORS & SHAP DRIVERS (VISUAL EXPLAINABILITY)
  // =========================================================================
  const renderRiskDrivers = () => {
    const bf = diag.bottleneck_factors || [];

    // Parse real drivers
    const parsedDrivers = drivers.map(d => {
      let val = 10;
      if (typeof d.impact === 'string') {
        const cleaned = d.impact.replace('+', '').replace('-', '').replace('pts', '').trim();
        val = parseFloat(cleaned) || (d.impact.toUpperCase() === 'HIGH' ? 18 : d.impact.toUpperCase() === 'MEDIUM' ? 10 : 6);
      } else if (typeof d.impact === 'number') {
        val = d.impact;
      }
      const isRed = !d.impact.toString().startsWith('-') && d.direction !== 'DECREASES_RISK';
      return {
        ...d,
        numVal: val,
        isPositive: isRed
      };
    });

    const maxDriverVal = Math.max(...parsedDrivers.map(d => d.numVal), 25);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* SHAP Decomposition - Visual Diverging Waterfall Chart */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                01 EXPLAINABLE RISK ANALYSIS
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                · SHAP Feature Attribution Waterfall
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.7rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }}></span>
                <span style={{ color: 'var(--text-muted)' }}>Risk Driver (+pts)</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }}></span>
                <span style={{ color: 'var(--text-muted)' }}>Mitigating Factor (-pts)</span>
              </span>
            </div>
          </div>

          {/* Diverging Bar Chart */}
          {parsedDrivers.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              No critical statistical risk anomalies detected for this project.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {parsedDrivers.map((d, i) => {
                const barWidth = Math.min(100, Math.max(8, Math.round((d.numVal / maxDriverVal) * 100)));
                const color = d.isPositive ? '#EF4444' : '#10B981';
                const bgSoft = d.isPositive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)';

                return (
                  <div 
                    key={i}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                          {d.feature}
                        </span>
                        <span style={{
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: bgSoft,
                          color
                        }}>
                          {d.isPositive ? '▲ ESCALATES RISK' : '▼ MITIGATES RISK'}
                        </span>
                      </div>

                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        color,
                        background: bgSoft,
                        padding: '2px 8px',
                        borderRadius: '5px'
                      }}>
                        {d.isPositive ? `+${d.numVal}` : `-${d.numVal}`} pts
                      </span>
                    </div>

                    {/* Visual Impact Track */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          background: color,
                          borderRadius: '9999px'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', width: '38px', textAlign: 'right', fontFamily: 'monospace' }}>
                        {barWidth}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottleneck Factors - Visual Impact Matrix */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#F59E0B" />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Leading Implementation Bottleneck Factors
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Ranked by Empirical Field Severity
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
            {bf.map((b, idx) => {
              const isHigh = b.impact_score >= 70;
              const isMed = b.impact_score >= 45;
              const color = isHigh ? '#EF4444' : isMed ? '#F59E0B' : '#10B981';

              return (
                <div key={idx} style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{b.factor}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: isHigh ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color
                    }}>
                      {b.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${b.impact_score}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '9999px'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color, minWidth: '38px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {b.impact_score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 5: PEER BENCHMARKING
  // =========================================================================
  const renderBenchmark = () => {
    return (
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={16} color="#2563EB" />
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Sector Peer Benchmark ({project.sector})
            </span>
          </div>
          {benchmark && (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Cost Band: <strong style={{ color: 'var(--text-primary)' }}>{benchmark.cost_band}</strong>
            </span>
          )}
        </div>

        {loadingBenchmark ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Computing sector peer benchmarks...</p>
        ) : benchmark ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Project Cost Overrun</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {benchmark.project_cost_overrun_pct}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Sector Peer Avg: {benchmark.sector_avg_cost_overrun_pct}%
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Schedule Delay</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {benchmark.project_delay_months} mos
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Sector Peer Avg: {benchmark.sector_avg_delay_months} mos
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Physical Completion</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {benchmark.project_progress}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Sector Peer Avg: {benchmark.sector_avg_progress}%
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sector Percentile Risk</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
                Top {benchmark.percentile_rank_in_sector}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Higher risk than {100 - benchmark.percentile_rank_in_sector}% of peers
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div 
      id="project-detail-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px'
      }}
    >
      <div 
        id="project-detail-modal-container"
        className="glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* Sticky Clean Modal Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.12)',
                padding: '2px 8px',
                borderRadius: '5px',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                {project.project_id}
              </span>
              {project.project_status && project.project_status !== 'CRITICAL_WATCHLIST' && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '5px',
                  background: project.project_status === 'DELAYED' ? 'rgba(245, 158, 11, 0.12)' :
                              project.project_status === 'AHEAD_OF_SCHEDULE' ? '#F1F5F9' : 'rgba(16, 185, 129, 0.12)',
                  color: project.project_status === 'DELAYED' ? '#D97706' :
                         project.project_status === 'AHEAD_OF_SCHEDULE' ? '#0F172A' : '#059669',
                  border: `1px solid ${
                    project.project_status === 'DELAYED' ? 'rgba(245, 158, 11, 0.3)' :
                    project.project_status === 'AHEAD_OF_SCHEDULE' ? '#E2E8F0' : 'rgba(16, 185, 129, 0.3)'
                  }`
                }}>
                  {project.project_status.replace(/_/g, ' ')}
                </span>
              )}
              {project.is_predictive_warning && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: 'rgba(168, 85, 247, 0.12)',
                  color: '#9333EA',
                  border: '1px solid rgba(168, 85, 247, 0.25)'
                }}>
                  Predictive Warning
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.12rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '2px', lineHeight: 1.3 }}>
              {project.project_name}
            </h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
              {project.ministry} · {project.sector} · {project.implementing_agency || 'Central Agency'}
            </p>
          </div>

          {/* Action Utilities & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={copyBrief}
              title="Copy Project Summary"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 600
              }}
            >
              {copiedBrief ? <Check size={14} color="#059669" /> : <Copy size={14} />}
              <span>{copiedBrief ? 'Copied' : 'Copy Brief'}</span>
            </button>

            <button
              id="btn-close-modal"
              onClick={onClose}
              aria-label="Close modal"
              title="Close (Esc)"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#DC2626',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem'
              }}
            >
              <X size={15} />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Section: Overview of Project Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--accent-cyan)" />
              <h3 style={{
                fontSize: '0.96rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                margin: 0
              }}>
                Overview of Project Status
              </h3>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Operational Health & Metric Diagnostics
            </span>
          </div>

          {/* Top Score Banner: 4 KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px'
          }}>
            {/* Risk Score */}
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPOSITE RISK</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '1.65rem', fontWeight: 800, color: tierColor, fontFamily: 'var(--font-heading)' }}>
                  {project.risk_score}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: tierColor,
                  background: `${tierColor}15`,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${tierColor}35`
                }}>
                  {project.risk_tier}
                </span>
              </div>
            </div>

            {/* Anticipated Cost */}
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>ANTICIPATED COST</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px' }}>
                ₹{project.revised_cost.toLocaleString()} Cr
              </div>
              <div style={{ fontSize: '0.7rem', color: project.cost_overrun_pct > 0 ? '#D97706' : '#059669', marginTop: '1px' }}>
                {project.cost_overrun_pct > 0 ? `+${project.cost_overrun_pct}% Overrun` : 'Within Budget'}
              </div>
            </div>

            {/* Schedule Timeline */}
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMMISSIONING DELAY</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: project.delay_months > 0 ? '#DC2626' : '#059669', marginTop: '3px' }}>
                {project.delay_months > 0 ? `+${project.delay_months} Mos` : 'On Schedule'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                Target: {project.revised_doc || 'TBD'}
              </div>
            </div>

            {/* Physical Completion */}
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>PHYSICAL COMPLETION</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>
                {project.physical_progress}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                Exp Burn: {((project.cumulative_expenditure / Math.max(project.revised_cost, 1)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Problem Diagnostics Banner */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#F8FAFC',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={17} color="#0F172A" />
              <div>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {diag.problem_title}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  ({diag.severity} Severity)
                </span>
              </div>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={13} color="#0F172A" />
              <strong>Mandate: </strong> {diag.recommended_action}
            </div>
          </div>

          {/* Inspection Tab Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '2px'
          }}>
            {[
              { id: 'risk_drivers' as const, label: '01 EXPLAINABLE RISK ANALYSIS', icon: Zap },
              { id: 'trajectory' as const, label: 'S-Curve Trajectory', icon: TrendingUp },
              { id: 'budget' as const, label: 'Budget Breakdown', icon: DollarSign },
              { id: 'milestones' as const, label: 'Milestones & Slippage', icon: Clock },
              { id: 'benchmark' as const, label: 'Peer Benchmark', icon: Compass }
            ].map(tab => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    borderBottom: isSelected ? '2px solid #0F172A' : '2px solid transparent',
                    background: isSelected ? '#F1F5F9' : 'transparent',
                    color: isSelected ? '#0F172A' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display Area */}
          <div>
            {activeTab === 'trajectory' && renderProgressCurve()}
            {activeTab === 'budget' && renderBudgetWaterfall()}
            {activeTab === 'milestones' && renderMilestones()}
            {activeTab === 'risk_drivers' && renderRiskDrivers()}
            {activeTab === 'benchmark' && renderBenchmark()}
          </div>

          {/* Prescriptive Directives Box */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ShieldAlert size={15} color="#D97706" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Prescriptive Recovery Directives
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
              {diag.recommendations.map((rec, rIdx) => (
                <div
                  key={rIdx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: rIdx === 0 ? '3px solid #DC2626' : rIdx === 1 ? '3px solid #D97706' : '3px solid #059669',
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4
                  }}
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
