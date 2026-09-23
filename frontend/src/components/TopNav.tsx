import React from 'react';
import {
  Menu,
  UploadCloud,
  ShieldCheck,
  BarChart3,
  HardHat,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from 'lucide-react';
import type { NavItemId } from './Sidebar';
import type { AuthUser } from '../types';

interface TopNavProps {
  activeNav: NavItemId;
  userRole: 'analyst' | 'officer' | 'admin';
  setUserRole: (role: 'analyst' | 'officer' | 'admin') => void;
  onOpenIngest: () => void;
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  earlyWarningCount?: number;
  totalProjects?: number;
  authUser?: AuthUser | null;
  onLogout?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeNav,
  userRole,
  setUserRole,
  onOpenIngest,
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  totalProjects = 1981,
  authUser,
  onLogout
}) => {
  // Navigation Title Mapping
  const getNavMeta = (id: NavItemId) => {
    switch (id) {
      case 'dashboard':
        return {
          section: 'Monitoring',
          title: 'Executive Portfolio Dashboard',
          subtitle: `Macro oversight across ${totalProjects.toLocaleString()} central infrastructure projects`
        };
      case 'projects':
        return {
          section: 'Monitoring',
          title: 'Central Projects Explorer',
          subtitle: 'Search, filter, and inspect project health, cost overruns, and milestones'
        };
      case 'risk-signals':
        return {
          section: 'Monitoring',
          title: 'Risk Signals & Early Warnings',
          subtitle: 'Projects exceeding critical risk thresholds requiring proactive triage'
        };
      case 'sla-monitoring':
        return {
          section: 'Monitoring',
          title: 'SLA & Milestone Monitoring',
          subtitle: 'Track completion timelines, contract milestones, and schedule slippage gaps'
        };
      case 'geospatial-view':
        return {
          section: 'Monitoring',
          title: 'Geospatial & Regional Corridors',
          subtitle: 'Regional distribution, state-level risk heatmaps, and spatial project density'
        };
      case 'document-analyzer':
        return {
          section: 'Documents',
          title: 'AI Document & DPR Analyzer',
          subtitle: 'Grounded intelligence extracting risk clauses, cost estimates, and MoSPI flash reports'
        };
      case 'saved-analyses':
        return {
          section: 'Documents',
          title: 'Saved Analyses & Statistical Profiler',
          subtitle: 'Distribution profiling (FR-2), CUF sufficiency rankings, and exported evaluation artifacts'
        };
      case 'interventions':
        return {
          section: 'Decisions',
          title: 'Intervention Matrix & Action Playbooks',
          subtitle: 'Targeted policy playbooks for land clearances, contractor mobilization, and stage-gate releases'
        };
      case 'scenario-lab':
        return {
          section: 'Decisions',
          title: 'Scenario Lab & Stress Testing',
          subtitle: 'What-If simulations on cost escalation shocks, weather anomalies, and delay buffers'
        };
      case 'workspace-settings':
        return {
          section: 'System',
          title: 'Workspace Settings & MLOps Governance',
          subtitle: 'Data ingestion pipeline, model retraining controls, DataQualityLog auditing, and roles'
        };
    }
  };

  const meta = getNavMeta(activeNav);

  const roles = [
    { id: 'analyst' as const, label: 'Analyst', icon: BarChart3, color: '#0F172A' },
    { id: 'officer' as const, label: 'Officer', icon: HardHat, color: '#0F172A' },
    { id: 'admin' as const, label: 'Admin', icon: ShieldCheck, color: '#DC2626' }
  ];

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '14px 28px',
        position: 'sticky',
        top: 0,
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}
    >
      {/* Left: Desktop Collapse Toggle, Mobile Toggle & Breadcrumb / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="mobile-sidebar-toggle"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <Menu size={20} />
        </button>

        {/* Desktop Sidebar Hide Toggle Button in TopNav */}
        {onToggleSidebarCollapse && (
          <button
            onClick={onToggleSidebarCollapse}
            className="desktop-sidebar-toggle"
            title={isSidebarCollapsed ? 'Expand sidebar (show name and icon)' : 'Hide sidebar (show just icons)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '7px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#64748B',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#64748B';
            }}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}

        <div>
          {/* Breadcrumb */}
          <div
            style={{
              fontSize: '0.74rem',
              color: '#64748B',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{meta.section}</span>
            <span>/</span>
            <span style={{ color: '#0F172A', fontWeight: 600 }}>{meta.title.split(' ')[0]}</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#0F172A',
              margin: '2px 0 0 0',
              lineHeight: 1.2
            }}
          >
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right: Role Switcher & Action Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F1F5F9',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0'
          }}
        >
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = userRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setUserRole(r.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 11px',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                  color: isSelected ? '#0F172A' : '#64748B',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions & User Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Ingest Button */}
          <button
            onClick={onOpenIngest}
            title="Upload MoSPI CUF / Data Ingestion"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 11px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <UploadCloud size={15} />
            <span className="hide-on-mobile">Ingest</span>
          </button>

          {/* User Profile Badge if authenticated */}
          {authUser && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '20px',
                fontSize: '0.78rem'
              }}
              title={`Logged in as ${authUser.name} (${authUser.email})`}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: authUser.role === 'admin' ? '#DC2626' : '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {authUser.name.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{authUser.name.split(' ')[0]}</span>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{authUser.agency || authUser.department}</span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out of PAIMANA"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 11px',
                borderRadius: '9px',
                border: '1px solid #FCA5A5',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE2E2';
                e.currentTarget.style.borderColor = '#F87171';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FEF2F2';
                e.currentTarget.style.borderColor = '#FCA5A5';
              }}
            >
              <LogOut size={14} />
              <span className="hide-on-mobile">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
