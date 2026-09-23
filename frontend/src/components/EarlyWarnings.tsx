import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Eye, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle
} from 'lucide-react';
import type { EarlyWarningProject } from '../types';
import { api } from '../services/api';

interface EarlyWarningsProps {
  alerts: EarlyWarningProject[];
  loading: boolean;
  onSelectProjectId: (id: string) => void;
  initialCriticalOnly?: boolean;
}

/* ─── Radial Gauge Ring (SVG) ─── */
const RadialGauge: React.FC<{
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  label?: string;
}> = ({ value, max = 100, size = 72, strokeWidth = 6, color, trackColor = 'rgba(0,0,0,0.06)', label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: size > 60 ? '1.1rem' : '0.8rem', fontWeight: 800, color, lineHeight: 1 }}>
          {Math.round(value)}
        </span>
        {label && (
          <span style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 600, marginTop: '1px' }}>{label}</span>
        )}
      </div>
    </div>
  );
};

/* ─── Mini Metric Gauge Card ─── */
const MiniGaugeCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  subtitle?: string;
  gaugeValue: number;
  gaugeMax: number;
  color: string;
  icon: React.ReactNode;
}> = ({ title, value, unit, subtitle, gaugeValue, gaugeMax, color, icon }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    transition: 'border-color 0.15s ease'
  }}>
    <RadialGauge value={gaugeValue} max={gaugeMax} size={56} strokeWidth={5} color={color} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {icon}
        {title}
      </div>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginTop: '2px' }}>
        {typeof value === 'number' && !isNaN(value) ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}{unit}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.66rem', color, fontWeight: 600, marginTop: '1px' }}>{subtitle}</div>
      )}
    </div>
  </div>
);

export const EarlyWarnings: React.FC<EarlyWarningsProps> = ({
  alerts,
  loading,
  onSelectProjectId,
  initialCriticalOnly = true
}) => {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [criticalOnly, setCriticalOnly] = useState<boolean>(initialCriticalOnly);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const handleExportAlerts = async () => {
    setDownloading(true);
    try {
      await api.downloadAlertsReport();
    } catch {
      // Graceful fallback
    } finally {
      setDownloading(false);
    }
  };

  const toggleExpandCard = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Helper to categorize problem type
  const getProblemType = (item: EarlyWarningProject) => {
    if (item.problem_type) return item.problem_type;
    if (item.cost_overrun_pct >= 15 && item.delay_months >= 6) return 'DUAL_ESCALATION';
    if (item.cost_overrun_pct >= 10) return 'COST_OVERRUN';
    return 'SCHEDULE_DELAY';
  };

  // Filter alerts by tier
  const filteredAlerts = useMemo(() => {
    return alerts.filter(item => {
      const isCrit = item.risk_score >= 75 || item.risk_tier === 'CRITICAL';
      if (criticalOnly && !isCrit) return false;
      return true;
    });
  }, [alerts, criticalOnly]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const critCount = filteredAlerts.filter(a => a.risk_score >= 75 || a.risk_tier === 'CRITICAL').length;
    const totalExposure = filteredAlerts.reduce((sum, a) => sum + (a.revised_cost || 0), 0);
    const avgScore = filteredAlerts.length > 0 ? filteredAlerts.reduce((s, a) => s + a.risk_score, 0) / filteredAlerts.length : 0;

    // Find worst sector
    const sectorMap: Record<string, number> = {};
    filteredAlerts.forEach(a => { sectorMap[a.sector] = (sectorMap[a.sector] || 0) + 1; });
    const worstSector = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])[0];

    return { critCount, totalExposure, avgScore, worstSector: worstSector ? `${worstSector[0]} (${worstSector[1]})` : '—' };
  }, [filteredAlerts]);

  return (
    <div style={{ padding: '0 28px 28px 28px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        
        {/* Header with Title & Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Risk Intelligence Center
                </h2>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Real-time threat monitoring · Multi-factor ML risk scoring · Predictive early warnings
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Critical vs All Warnings Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '3px'
            }}>
              <button
                id="btn-filter-critical-only"
                onClick={() => setCriticalOnly(true)}
                style={{
                  background: criticalOnly ? 'var(--risk-critical)' : 'transparent',
                  color: criticalOnly ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '6px 14px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Critical ≥ 75
              </button>
              <button
                id="btn-filter-all-warnings"
                onClick={() => setCriticalOnly(false)}
                style={{
                  background: !criticalOnly ? '#0F172A' : 'transparent',
                  color: !criticalOnly ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '6px 14px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                All Flagged
              </button>
            </div>

            <button
              id="btn-export-alerts-csv"
              disabled={downloading}
              onClick={handleExportAlerts}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              <span>{downloading ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* ─── Summary Stats Strip ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {[
            { label: 'Critical Alerts', value: summaryStats.critCount.toString(), color: '#DC2626' },
            { label: 'Total Exposure', value: `₹${Math.round(summaryStats.totalExposure).toLocaleString()} Cr`, color: '#0F172A' },
            { label: 'Avg Risk Score', value: summaryStats.avgScore.toFixed(1), color: '#0F172A' },
            { label: 'Hotspot Sector', value: summaryStats.worstSector, color: '#0F172A' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '14px 16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: stat.color, marginTop: '2px', lineHeight: 1.2 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Count Notice */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredAlerts.length}</strong> projects matching{' '}
            <strong style={{ color: criticalOnly ? 'var(--risk-critical)' : '#0F172A' }}>
              {criticalOnly ? 'Critical Early Warnings (Score ≥ 75)' : 'All Early Warnings'}
            </strong>
          </div>
        </div>

        {/* List of Early Warning Project Cards */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Evaluating portfolio risk exposure & problem diagnostics...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No projects found matching the selected filter criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredAlerts.map((item, idx) => {
              const isCrit = item.risk_score >= 75 || item.risk_tier === 'CRITICAL';
              const isExpanded = !!expandedCards[item.project_id];
              const pType = getProblemType(item);

              // Calculated escalation figures
              const estimatedEscalation = Math.max(0, Math.round(item.revised_cost * (item.cost_overrun_pct / Math.max(1, 100 + item.cost_overrun_pct))));
              const delayDays = item.delay_days || Math.round(item.delay_months * 30);
              const progressGap = item.progress_gap !== undefined && item.progress_gap !== null ? item.progress_gap : 12;

              // Problem badge
              let pTitle = item.problem_title || 'Schedule Delay & Milestone Slippage';
              let pColor = '#ef4444';
              let pBg = 'rgba(239, 68, 68, 0.10)';
              let pBorder = 'rgba(239, 68, 68, 0.25)';

              if (pType === 'COST_OVERRUN') {
                pTitle = 'Cost Overrun & Budget Escalation';
                pColor = '#ea580c';
                pBg = 'rgba(234, 88, 12, 0.10)';
                pBorder = 'rgba(234, 88, 12, 0.3)';
              } else if (pType === 'DUAL_ESCALATION') {
                pTitle = 'Compound: Schedule + Cost Escalation';
                pColor = '#dc2626';
                pBg = 'rgba(220, 38, 38, 0.12)';
                pBorder = 'rgba(220, 38, 38, 0.35)';
              }

              // Computed metric values
              const lastBurnPoint = item.diagnostics?.burn_vs_progress?.[item.diagnostics.burn_vs_progress.length - 1];
              const plannedProgress = Math.min(100, Math.max(10, item.planned_progress ?? 68));
              const actualProgress = Math.min(100, Math.max(0, lastBurnPoint?.physical_progress_pct ?? Math.max(5, Math.round(plannedProgress - progressGap))));
              const financialBurn = Math.min(100, Math.max(5, item.financial_burn_pct ?? (lastBurnPoint?.financial_burn_pct ?? Math.min(100, Math.round(actualProgress + (item.cost_overrun_pct > 0 ? Math.min(40, Math.round(item.cost_overrun_pct * 0.75)) : 8))))));
              const decouplingGap = lastBurnPoint?.decoupling_gap ?? Math.max(0, Math.round(financialBurn - actualProgress));
              const isDecoupled = decouplingGap >= 10;

              // Risk score color
              const scoreColor = item.risk_score >= 75 ? '#DC2626' : item.risk_score >= 50 ? '#EA580C' : item.risk_score >= 25 ? '#D97706' : '#059669';

              return (
                <div
                  key={item.project_id || idx}
                  className="glass-card"
                  style={{
                    background: 'var(--bg-card)',
                    border: isCrit ? '1px solid var(--risk-critical-border)' : '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '22px',
                    transition: 'all 0.2s ease',
                    boxShadow: isCrit ? '0 4px 20px rgba(239, 68, 68, 0.08)' : '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  {/* ─── Row 1: Identity Header ─── */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Left: Rank + Project Info */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1 1 420px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: isCrit ? 'var(--risk-critical-bg)' : 'var(--risk-high-bg)',
                        color: isCrit ? 'var(--risk-critical)' : 'var(--risk-high)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                        border: isCrit ? '1px solid var(--risk-critical-border)' : '1px solid rgba(234, 88, 12, 0.3)'
                      }}>
                        #{idx + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
                            {item.project_id}
                          </span>
                          {item.is_predictive_warning && (
                            <span style={{
                              fontSize: '0.62rem',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              fontWeight: 700,
                              background: '#F1F5F9',
                              color: '#334155',
                              border: '1px solid #CBD5E1'
                            }}>
                              PREDICTIVE
                            </span>
                          )}
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {item.sector} · {item.ministry}
                          </span>
                        </div>

                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', marginTop: '4px', lineHeight: 1.3 }}>
                          {item.project_name}
                        </div>

                        {/* Problem Badge + Quick Visual Metric Pills */}
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: pBg,
                            color: pColor,
                            border: `1px solid ${pBorder}`
                          }}>
                            {item.problem_title || pTitle}
                          </span>
                          {item.delay_months > 0 && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#FFF7ED',
                              color: '#EA580C',
                              border: '1px solid #FFEDD5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock size={11} />
                              +{item.delay_months}m Delay
                            </span>
                          )}
                          {item.cost_overrun_pct > 0 && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FEE2E2',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <TrendingUp size={11} />
                              +{item.cost_overrun_pct}% Overrun
                            </span>
                          )}
                          {isDecoupled && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#F1F5F9',
                              color: '#0F172A',
                              border: '1px solid #E2E8F0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Zap size={11} />
                              +{decouplingGap}% Decoupled Burn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Financial Exposure + Radial Gauge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Financial Exposure</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1px' }}>
                          ₹{item.revised_cost.toLocaleString()} Cr
                        </div>
                        <div style={{ fontSize: '0.72rem', color: item.cost_overrun_pct > 0 ? '#ea580c' : '#059669', fontWeight: 600 }}>
                          +{item.cost_overrun_pct}% escalation · {item.delay_months} mos delay
                        </div>
                      </div>

                      {/* Radial Risk Score Gauge */}
                      <RadialGauge
                        value={item.risk_score}
                        max={100}
                        size={72}
                        strokeWidth={6}
                        color={scoreColor}
                        label={item.risk_tier}
                      />
                    </div>
                  </div>

                  {/* ─── Row 2: 4-Metric Mini Gauge Dashboard ─── */}
                  <div style={{
                    marginTop: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '10px'
                  }}>
                    <MiniGaugeCard
                      title="Physical Progress"
                      value={actualProgress}
                      unit="%"
                      subtitle={`Target: ${plannedProgress}% · Deficit: ${Math.max(0, plannedProgress - actualProgress)}%`}
                      gaugeValue={actualProgress}
                      gaugeMax={100}
                      color={actualProgress < plannedProgress - 10 ? '#EA580C' : '#059669'}
                      icon={<Activity size={10} />}
                    />
                    <MiniGaugeCard
                      title="Capital Burn"
                      value={financialBurn}
                      unit="%"
                      subtitle={isDecoupled ? `+${decouplingGap}% divergence` : 'Aligned with progress'}
                      gaugeValue={financialBurn}
                      gaugeMax={100}
                      color={isDecoupled ? '#DC2626' : '#059669'}
                      icon={<DollarSign size={10} />}
                    />
                    <MiniGaugeCard
                      title="Schedule Delay"
                      value={item.delay_months}
                      unit=" mos"
                      subtitle={`${delayDays} days total slippage`}
                      gaugeValue={Math.min(item.delay_months, 36)}
                      gaugeMax={36}
                      color={item.delay_months > 12 ? '#DC2626' : item.delay_months > 0 ? '#EA580C' : '#059669'}
                      icon={<Clock size={10} />}
                    />
                    <MiniGaugeCard
                      title="Cost Overrun"
                      value={item.cost_overrun_pct}
                      unit="%"
                      subtitle={estimatedEscalation > 0 ? `+₹${estimatedEscalation.toLocaleString()} Cr escalation` : 'Within budget'}
                      gaugeValue={Math.min(item.cost_overrun_pct, 60)}
                      gaugeMax={60}
                      color={item.cost_overrun_pct > 20 ? '#DC2626' : item.cost_overrun_pct > 0 ? '#EA580C' : '#059669'}
                      icon={<TrendingUp size={10} />}
                    />
                  </div>

                  {/* ─── Expanded Diagnostics: 100% Visual Analytics ─── */}
                  {isExpanded && (() => {
                    const bottleneckFactors = item.diagnostics?.bottleneck_factors && item.diagnostics.bottleneck_factors.length > 0
                      ? item.diagnostics.bottleneck_factors
                      : [
                          { factor: 'Land Acquisition & RoW', impact_score: item.row_land_acquisition_risk || 68 },
                          { factor: 'Regulatory & Clearances', impact_score: item.environmental_clearances_risk || 54 },
                          { factor: 'Utility Shifting', impact_score: item.utility_shifting_risk || 42 },
                          { factor: 'Contractor Solvency', impact_score: item.contractor_solvency_risk || 48 },
                          { factor: 'Contractual Disputes', impact_score: item.contractual_arbitration_risk || 32 }
                        ];

                    return (
                      <div style={{
                        marginTop: '14px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: '#FAFAFA',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        {/* Top: Comparative Trajectory Visualizer */}
                        <div style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '14px 16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Activity size={15} color="#0F172A" />
                              <span>Progress vs Expenditure Divergence Visualizer</span>
                            </div>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: isDecoupled ? '#FEF2F2' : '#F0FDF4',
                              color: isDecoupled ? '#DC2626' : '#16A34A',
                              border: isDecoupled ? '1px solid #FEE2E2' : '1px solid #DCFCE7'
                            }}>
                              {isDecoupled ? `⚠️ Decoupling Spread: +${decouplingGap}%` : '✓ Expenditure Aligned'}
                            </span>
                          </div>

                          {/* 3 Comparative Bars */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                                <span>Target Planned Progress</span>
                                <span style={{ fontWeight: 700, color: '#0F172A' }}>{plannedProgress}%</span>
                              </div>
                              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ width: `${plannedProgress}%`, height: '100%', background: '#64748B', borderRadius: '999px' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                                <span>Actual Physical Progress</span>
                                <span style={{ fontWeight: 700, color: actualProgress < plannedProgress - 10 ? '#EA580C' : '#059669' }}>
                                  {actualProgress}% {plannedProgress > actualProgress ? `(-${plannedProgress - actualProgress}% deficit)` : ''}
                                </span>
                              </div>
                              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${actualProgress}%`,
                                  height: '100%',
                                  background: actualProgress < plannedProgress - 10 ? '#EA580C' : '#059669',
                                  borderRadius: '999px'
                                }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                                <span>Capital Budget Expended (Financial Burn)</span>
                                <span style={{ fontWeight: 700, color: isDecoupled ? '#DC2626' : '#059669' }}>
                                  {financialBurn}% {financialBurn > actualProgress ? `(+${financialBurn - actualProgress}% lead)` : ''}
                                </span>
                              </div>
                              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${financialBurn}%`,
                                  height: '100%',
                                  background: isDecoupled ? '#DC2626' : '#059669',
                                  borderRadius: '999px'
                                }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Bottleneck Factors Severity Distribution */}
                        <div style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '14px 16px'
                        }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                            <AlertTriangle size={15} color="#EA580C" />
                            <span>Bottleneck Factor Severity Distribution</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                            {bottleneckFactors.map((f, fIdx) => {
                              const isCritF = f.impact_score >= 65;
                              const isMedF = f.impact_score >= 40;
                              const fColor = isCritF ? '#DC2626' : isMedF ? '#EA580C' : '#059669';
                              const fBg = isCritF ? '#FEF2F2' : isMedF ? '#FFF7ED' : '#F0FDF4';
                              return (
                                <div key={fIdx} style={{
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #E2E8F0',
                                  background: '#F8FAFC'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {f.factor}
                                    </span>
                                    <span style={{
                                      fontSize: '0.66rem',
                                      fontWeight: 800,
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      background: fBg,
                                      color: fColor
                                    }}>
                                      {f.impact_score}%
                                    </span>
                                  </div>
                                  <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{ width: `${f.impact_score}%`, height: '100%', background: fColor, borderRadius: '999px' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Bottom: Recommended Mitigation Protocol (Action Chips) */}
                        <div style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '14px 16px'
                        }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                            <Zap size={15} color="#0F172A" />
                            <span>Recommended Mitigation Protocol</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                            {[
                              {
                                action: 'Convene IPMD Cost Ceiling Review',
                                priority: 'P1 · Immediate',
                                urgencyColor: '#DC2626',
                                urgencyBg: '#FEF2F2',
                                scope: 'Capex Containment'
                              },
                              {
                                action: 'Expenditure-Progress Audit',
                                priority: 'P2 · 15-Day',
                                urgencyColor: '#EA580C',
                                urgencyBg: '#FFF7ED',
                                scope: 'Decoupling Gap'
                              },
                              {
                                action: 'Enforce Catch-Up Milestone Targets',
                                priority: 'P2 · 30-Day',
                                urgencyColor: '#0F172A',
                                urgencyBg: '#F1F5F9',
                                scope: 'Schedule Recovery'
                              }
                            ].map((act, aIdx) => (
                              <div key={aIdx} style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: act.urgencyBg,
                                    color: act.urgencyColor
                                  }}>
                                    {act.priority}
                                  </span>
                                  <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>{act.scope}</span>
                                </div>
                                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                                  {act.action}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ─── Row 3: Card Actions Footer ─── */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <button
                      onClick={(e) => toggleExpandCard(item.project_id, e)}
                      style={{
                        background: isExpanded ? '#F1F5F9' : 'transparent',
                        border: isExpanded ? '1px solid #CBD5E1' : '1px solid transparent',
                        color: '#0F172A',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      <span>{isExpanded ? 'Hide Visual Diagnostics' : 'Visual Divergence & Bottleneck Analytics'}</span>
                    </button>

                    <button
                      onClick={() => onSelectProjectId(item.project_id)}
                      className="btn-primary"
                      style={{ fontSize: '0.76rem', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye size={14} />
                      <span>Inspect Trajectory</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EarlyWarnings;
