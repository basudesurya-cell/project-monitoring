import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw,
  BarChart2,
  Download
} from 'lucide-react';
import type { SectorSummary, MinistrySummary } from '../types';

interface FilterPanelProps {
  userRole?: 'analyst' | 'officer' | 'admin';
  activeTab?: 'projects' | 'alerts' | 'analytics';
  setActiveTab?: (tab: 'projects' | 'alerts' | 'analytics') => void;
  search: string;
  setSearch: (s: string) => void;
  selectedMinistry: string;
  setSelectedMinistry: (m: string) => void;
  selectedSector: string;
  setSelectedSector: (s: string) => void;
  selectedRiskTier: string;
  setSelectedRiskTier: (r: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  selectedRiskType: string;
  setSelectedRiskType: (t: string) => void;
  sectors: SectorSummary[];
  ministries: MinistrySummary[];
  onResetFilters: () => void;
  earlyWarningCount?: number;
  onOpenStatsModal: () => void;
  onExportProjects: (format: 'csv' | 'json') => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  userRole = 'officer',
  search,
  setSearch,
  selectedMinistry,
  setSelectedMinistry,
  selectedSector,
  setSelectedSector,
  selectedRiskTier,
  setSelectedRiskTier,
  selectedStatus,
  setSelectedStatus,
  selectedRiskType,
  setSelectedRiskType,
  sectors,
  ministries,
  onResetFilters,
  onOpenStatsModal,
  onExportProjects
}) => {
  const [exporting, setExporting] = useState<boolean>(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      await onExportProjects(format);
    } finally {
      setExporting(false);
    }
  };
  return (
    <div style={{ padding: '0 28px 16px 28px' }}>
      {/* Action Controls & Reset */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Portfolio Projects
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="btn-statistical-profiling"
            onClick={onOpenStatsModal}
            className="btn-primary"
            style={{
              padding: '7px 14px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BarChart2 size={16} />
            <span>Statistical Profiling</span>
          </button>

          <button
            id="btn-export-csv"
            disabled={exporting}
            onClick={() => handleExport('csv')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* Reset button */}
          {(selectedMinistry !== 'ALL' || selectedSector !== 'ALL' || selectedRiskTier !== 'ALL' || selectedStatus !== 'ALL' || selectedRiskType !== 'ALL' || search) && (
            <button
              onClick={onResetFilters}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-secondary)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: '1 1 200px',
            minWidth: '200px'
          }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              id="search-input"
              type="text"
              placeholder="Search by Code (e.g. MOSPI-0012), Name, Agency, State..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px 8px 36px',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
            />
          </div>

          {/* Ministry Dropdown */}
          <select
            id="ministry-select"
            value={selectedMinistry}
            onChange={e => setSelectedMinistry(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px'
            }}
          >
            <option value="ALL">All Ministries (17)</option>
            {ministries.map((m, i) => (
              <option key={i} value={m.ministry}>{m.ministry} ({m.project_count})</option>
            ))}
          </select>

          {/* Sector Dropdown */}
          <select
            id="sector-select"
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px'
            }}
          >
            <option value="ALL">All Sectors (22)</option>
            {sectors.map((s, i) => (
              <option key={i} value={s.sector}>{s.sector} ({s.project_count})</option>
            ))}
          </select>

          {/* Project Status Dropdown (SRS v2.0 FR-1.2 & FR-8.3) */}
          <select
            id="status-select"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '170px'
            }}
          >
            <option value="ALL">All Statuses (Lifecycle)</option>
            <option value="ONGOING_ON_TRACK">🟢 Ongoing (On Track)</option>
            <option value="DELAYED">🟠 Delayed Slippage</option>
            <option value="CRITICAL_WATCHLIST">🔴 Critical Watchlist</option>
            <option value="AHEAD_OF_SCHEDULE">🔵 Ahead of Schedule</option>
          </select>

          {/* Problem Type: Confirmed Deficit vs Predictive Early Warning (FR-5.3 & NFR-9) */}
          <select
            id="risk-type-select"
            value={selectedRiskType}
            onChange={e => setSelectedRiskType(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '180px'
            }}
          >
            <option value="ALL">All Problem Types (FR-5.3)</option>
            <option value="CRITICAL_EARLY_WARNING">🚨 Critical Early Warnings (Score ≥ 75)</option>
            <option value="CONFIRMED">🔴 Confirmed Problems Only</option>
            <option value="PREDICTIVE">🟣 Predictive Early Warnings</option>
          </select>

          {/* Risk Tier Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '6px', fontWeight: 600 }}>Risk Tier:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(tier => {
              const isActive = selectedRiskTier === tier;
              const color = tier === 'CRITICAL' ? 'var(--risk-critical)' : tier === 'HIGH' ? 'var(--risk-high)' : tier === 'MEDIUM' ? 'var(--risk-medium)' : tier === 'LOW' ? 'var(--risk-low)' : 'var(--text-secondary)';
              const bg = tier === 'CRITICAL' ? 'var(--risk-critical-bg)' : tier === 'HIGH' ? 'var(--risk-high-bg)' : tier === 'MEDIUM' ? 'var(--risk-medium-bg)' : tier === 'LOW' ? 'var(--risk-low-bg)' : 'rgba(0, 0, 0, 0.05)';

              return (
                <button
                  key={tier}
                  id={`tier-filter-${tier.toLowerCase()}`}
                  onClick={() => setSelectedRiskTier(tier)}
                  style={{
                    background: isActive ? bg : 'transparent',
                    color: isActive ? color : 'var(--text-muted)',
                    border: isActive ? `1px solid ${color}` : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

      {/* Project Officer: Implementing Agency Quick-Bar */}
      {userRole === 'officer' && (
        <div style={{
          marginTop: '10px',
          padding: '10px 16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.74rem', color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Project Officer Agency Quick-Focus:</span>
          </span>
          {[
            { label: 'All Agencies', query: '' },
            { label: 'NHAI (Roads)', query: 'National Highways Authority of India (NHAI)' },
            { label: 'RVNL (Railways)', query: 'Rail Vikas Nigam Limited (RVNL)' },
            { label: 'NTPC (Power)', query: 'NTPC Limited' },
            { label: 'IOCL (Petroleum)', query: 'Indian Oil Corporation (IOCL)' },
            { label: 'Coal India', query: 'Coal India Limited (CIL)' },
            { label: 'DMRC (Metro)', query: 'Delhi Metro Rail Corp (DMRC)' },
            { label: 'State PWD', query: 'State PWD' }
          ].map((item, idx) => {
            const isSelected = (!item.query && !search) || (item.query && search === item.query);
            return (
              <button
                key={idx}
                id={`officer-agency-btn-${idx}`}
                onClick={() => setSearch(item.query)}
                style={{
                  background: isSelected ? '#0F172A' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  border: isSelected ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
