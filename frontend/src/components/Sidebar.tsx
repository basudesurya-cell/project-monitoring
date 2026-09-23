import React from 'react';
import {
  LayoutGrid,
  ClipboardList,
  AlertTriangle,
  Sliders,
  Map,
  FileSearch,
  Archive,
  ShieldCheck,
  Gauge,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export type NavItemId =
  | 'dashboard'
  | 'projects'
  | 'risk-signals'
  | 'sla-monitoring'
  | 'geospatial-view'
  | 'document-analyzer'
  | 'saved-analyses'
  | 'interventions'
  | 'scenario-lab'
  | 'workspace-settings';

interface SidebarProps {
  activeNav: NavItemId;
  onSelectNav: (id: NavItemId) => void;
  earlyWarningCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const handleNavClick = (id: NavItemId) => {
    onSelectNav(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isNavActive = (id: NavItemId) => activeNav === id;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 48,
            display: 'block'
          }}
        />
      )}

      {/* Main Persistent Sidebar */}
      <aside
        id="paimana-sidebar"
        className={`paimana-sidebar ${isOpenMobile ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          width: isCollapsed ? '72px' : '260px',
          minWidth: isCollapsed ? '72px' : '260px',
          height: '100vh',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          zIndex: 49,
          userSelect: 'none',
          transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Brand Header & Hide Toggle */}
        <div
          style={{
            padding: isCollapsed ? '20px 10px 16px 10px' : '22px 18px 18px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            flexDirection: isCollapsed ? 'column' : 'row',
            gap: isCollapsed ? '10px' : '0',
            borderBottom: isCollapsed ? '1px solid #F1F5F9' : 'none'
          }}
        >
          {/* Logo & Brand Identity */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: isCollapsed ? 'pointer' : 'default'
            }}
            onClick={isCollapsed ? onToggleCollapse : undefined}
            title={isCollapsed ? 'Click to expand sidebar' : undefined}
          >
            {/* Executive Badge Icon */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
                flexShrink: 0
              }}
            >
              {/* White ECG / Pulse waveform line */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>

            {/* Brand Titles (Shown when open) */}
            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    letterSpacing: '0.06em',
                    lineHeight: 1.15
                  }}
                >
                  PAIMANA
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    color: '#64748B',
                    fontWeight: 400,
                    marginTop: '1px'
                  }}
                >
                  Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Hide / Expand Toggle Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {onToggleCollapse && (
              <button
                id="sidebar-hide-toggle-btn"
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Expand sidebar (show name and icons)' : 'Hide sidebar (show just icons)'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
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
                {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            )}

            {/* Close button on mobile */}
            {isOpenMobile && (
              <button
                onClick={onCloseMobile}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sections Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isCollapsed ? '10px 8px 20px 8px' : '10px 14px 20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: isCollapsed ? '14px' : '20px'
          }}
        >
          {/* SECTION 1: Monitoring */}
          <div>
            {!isCollapsed ? (
              <div
                style={{
                  padding: '4px 12px 8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#64748B',
                  letterSpacing: '0.01em'
                }}
              >
                Monitoring
              </div>
            ) : (
              <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 8px 8px 8px' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavItem
                icon={<LayoutGrid size={19} />}
                label="Dashboard"
                isActive={isNavActive('dashboard')}
                isCollapsed={isCollapsed}
                onClick={() => handleNavClick('dashboard')}
              />

              <NavItem
                icon={<ClipboardList size={19} />}
                label="Projects"
                isActive={isNavActive('projects')}
                isCollapsed={isCollapsed}
                onClick={() => handleNavClick('projects')}
              />

              <NavItem
                icon={<AlertTriangle size={19} />}
                label="Risk signals"
                isActive={isNavActive('risk-signals')}
                isCollapsed={isCollapsed}
                onClick={() => handleNavClick('risk-signals')}
              />

              <NavItem
                icon={<Sliders size={19} />}
                label="SLA monitoring"
                isActive={isNavActive('sla-monitoring')}
                isCollapsed={isCollapsed}
                onClick={() => handleNavClick('sla-monitoring')}
              />

              <NavItem
                icon={<Map size={19} />}
                label="Geospatial view"
                isActive={isNavActive('geospatial-view')}
                isCollapsed={isCollapsed}
                onClick={() => handleNavClick('geospatial-view')}
              />
            </div>
          </div>

          {/* SECTION 2: Documents */}
          <div>
            {!isCollapsed ? (
              <div
                style={{
                  padding: '4px 12px 8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#64748B',
                  letterSpacing: '0.01em'
                }}
              >
                Documents
              </div>
            ) : (
              <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 8px 8px 8px' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavItem
                icon={<FileSearch size={19} />}
                label="Document analyzer"
                isActive={isNavActive('document-analyzer')}
                isCollapsed={isCollapsed}
                onClick={() => handleNavClick('document-analyzer')}
              />

              <NavItem
                icon={<Archive size={19} />}
                label="Saved analyses"
                isActive={isNavActive('saved-analyses')}
                isCollapsed={isCollapsed}
                onClick={() => handleNavClick('saved-analyses')}
              />
            </div>
          </div>

          {/* SECTION 3: Decisions */}
          <div>
            {!isCollapsed ? (
              <div
                style={{
                  padding: '4px 12px 8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#64748B',
                  letterSpacing: '0.01em'
                }}
              >
                Decisions
              </div>
            ) : (
              <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 8px 8px 8px' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavItem
                icon={<ShieldCheck size={19} />}
                label="Interventions"
                isActive={isNavActive('interventions')}
                isCollapsed={isCollapsed}
                onClick={() => handleNavClick('interventions')}
              />

              <NavItem
                icon={<Gauge size={19} />}
                label="Scenario lab"
                isActive={isNavActive('scenario-lab')}
                isCollapsed={isCollapsed}
                onClick={() => handleNavClick('scenario-lab')}
              />
            </div>
          </div>
        </div>

        {/* Pinned Bottom Section: Workspace Settings & Toggle Footer */}
        <div
          style={{
            padding: isCollapsed ? '12px 8px' : '14px 14px 16px 14px',
            borderTop: '1px solid #E5E7EB',
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <NavItem
            icon={<Settings size={19} />}
            label="Workspace settings"
            isActive={isNavActive('workspace-settings')}
            isCollapsed={isCollapsed}
            onClick={() => handleNavClick('workspace-settings')}
          />

          {/* Expanded Bottom Toggle Banner */}
          {!isCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid transparent',
                backgroundColor: 'transparent',
                color: '#64748B',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.color = '#0F172A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              <ChevronLeft size={16} />
              <span>Hide sidebar</span>
            </button>
          )}

          {isCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '32px',
                margin: '0 auto',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: '#64748B',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed?: boolean;
  badge?: number | string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  isActive,
  isCollapsed = false,
  badge,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        width: isCollapsed ? '46px' : '100%',
        height: isCollapsed ? '46px' : 'auto',
        margin: isCollapsed ? '0 auto' : '0',
        padding: isCollapsed ? '0' : '10px 14px',
        borderRadius: '8px',
        border: isActive ? '1px solid #E2E8F0' : '1px solid transparent',
        backgroundColor: isActive ? '#F1F5F9' : 'transparent',
        color: isActive ? '#0F172A' : '#475569',
        cursor: 'pointer',
        fontSize: '0.92rem',
        fontWeight: isActive ? 600 : 500,
        textAlign: isCollapsed ? 'center' : 'left',
        transition: 'all 0.15s ease',
        outline: 'none',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#F8FAFC';
          e.currentTarget.style.color = '#0F172A';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#475569';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '12px', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isActive ? '#0F172A' : '#64748B',
            transition: 'color 0.15s ease'
          }}
        >
          {icon}
        </span>
        {!isCollapsed && <span style={{ lineHeight: 1 }}>{label}</span>}
      </div>

      {/* Badge when open */}
      {!isCollapsed && badge !== undefined && (
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: isActive ? '#E2E8F0' : '#F1F5F9',
            color: isActive ? '#0F172A' : '#64748B'
          }}
        >
          {badge}
        </span>
      )}

      {/* Little indicator dot when collapsed and has badge */}
      {isCollapsed && badge !== undefined && (
        <span
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#DC2626'
          }}
        />
      )}
    </button>
  );
};
