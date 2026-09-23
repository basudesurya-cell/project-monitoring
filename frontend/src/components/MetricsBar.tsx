import React from 'react';
import { 
  Building, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ShieldAlert
} from 'lucide-react';
import type { PortfolioSummary } from '../types';

interface MetricsBarProps {
  summary: PortfolioSummary | null;
  loading: boolean;
  onSelectCriticalWarnings?: () => void;
  onSelectPortfolio?: () => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ 
  summary, 
  loading,
  onSelectCriticalWarnings,
  onSelectPortfolio
}) => {
  const formatCr = (val: number = 0) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh Cr`;
    }
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
  };

  const cards = [
    {
      id: 'metric-card-portfolio',
      title: 'Monitored Portfolio',
      value: summary ? `${summary.total_projects.toLocaleString()}` : '1,981',
      unit: 'Projects (≥ ₹150 Cr)',
      change: '17 Ministries · 22 Sectors',
      icon: Building,
      accent: '#0F172A',
      onClick: onSelectPortfolio
    },
    {
      id: 'metric-card-original-cost',
      title: 'Original Approved Cost',
      value: summary ? formatCr(summary.total_original_cost) : '₹37.13 Lakh Cr',
      unit: 'Baseline Sanctioned Outlay',
      change: 'Sanctioned Commitments',
      icon: DollarSign,
      accent: '#0F172A'
    },
    {
      id: 'metric-card-revised-cost',
      title: 'Anticipated Revised Cost',
      value: summary ? formatCr(summary.total_revised_cost) : '₹42.78 Lakh Cr',
      unit: summary ? `+${formatCr(summary.total_cost_escalation)} (+${summary.avg_cost_overrun_pct}%)` : '+₹5.65 Lakh Cr',
      change: 'Escalation Detected',
      isEscalation: true,
      icon: TrendingUp,
      accent: '#0F172A'
    },
    {
      id: 'metric-card-cumulative-expenditure',
      title: 'Cumulative Expenditure',
      value: summary ? formatCr(summary.total_expenditure) : '₹20.36 Lakh Cr',
      unit: summary && summary.total_revised_cost > 0 
        ? `${((summary.total_expenditure / summary.total_revised_cost) * 100).toFixed(1)}% Financial Burn`
        : '47.6% Financial Burn',
      change: 'Funds Disbursed',
      icon: Clock,
      accent: '#0F172A'
    },
    {
      id: 'metric-card-critical-early-warnings',
      title: 'Critical Early Warnings',
      value: summary ? `${summary.critical_risk_count}` : '148',
      unit: summary ? `+${summary.high_risk_count} High Risk Projects` : 'Immediate Review',
      change: 'Intervention Required',
      isAlert: true,
      isInteractive: true,
      actionText: 'Triage Problems 🚨',
      icon: ShieldAlert,
      accent: '#DC2626',
      onClick: onSelectCriticalWarnings
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      padding: '24px 28px 12px 28px'
    }}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isClickable = !!card.onClick;

        return (
          <div
            key={idx}
            id={card.id}
            onClick={card.onClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            className="glass-card"
            style={{
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              cursor: isClickable ? 'pointer' : 'default',
              border: card.isAlert ? '1px solid #FECACA' : '1px solid #E2E8F0',
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (isClickable) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.borderColor = card.isAlert ? '#DC2626' : '#CBD5E1';
              }
            }}
            onMouseLeave={(e) => {
              if (isClickable) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = card.isAlert ? '#FECACA' : '#E2E8F0';
              }
            }}
            onKeyDown={(e) => {
              if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                card.onClick?.();
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.title}
                </span>
                {card.isAlert && (
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'var(--risk-critical-bg)',
                    color: 'var(--risk-critical)',
                    border: '1px solid var(--risk-critical-border)'
                  }}>
                    PRIORITY
                  </span>
                )}
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: card.isAlert ? '#FEF2F2' : '#F1F5F9',
                border: card.isAlert ? '1px solid #FECACA' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.isAlert ? '#DC2626' : '#475569'
              }}>
                <Icon size={16} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: card.isAlert ? '#DC2626' : '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {loading ? '...' : card.value}
              </div>

              {card.actionText && (
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#DC2626',
                  background: '#FEF2F2',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid #FECACA',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>{card.actionText}</span>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
              fontSize: '0.75rem',
              color: card.isAlert ? '#DC2626' : '#64748B'
            }}>
              {card.isAlert && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />}
              <span style={{ fontWeight: 500 }}>{card.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
