import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, type NavItemId } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { DashboardView } from './components/DashboardView';
import { ProjectTable } from './components/ProjectTable';
import { FilterPanel } from './components/FilterPanel';
import { EarlyWarnings } from './components/EarlyWarnings';
import { SlaMonitoringView } from './components/SlaMonitoringView';
import { GeospatialView } from './components/GeospatialView';
import { DocumentAnalyzerView } from './components/DocumentAnalyzerView';
import { SavedAnalysesView } from './components/SavedAnalysesView';
import { InterventionsView } from './components/InterventionsView';
import { ScenarioLabView } from './components/ScenarioLabView';
import { WorkspaceSettingsView } from './components/WorkspaceSettingsView';

import { ProjectDetailModal } from './components/ProjectDetailModal';
import { DataIngestModal } from './components/DataIngestModal';
import { DescriptiveStatsModal } from './components/DescriptiveStatsModal';
import { LoginPage } from './components/LoginPage';

import { api } from './services/api';
import type { PortfolioSummary, Project, EarlyWarningProject, AuthUser } from './types';

export const App: React.FC = () => {
  // User Authentication Session State (LocalStorage)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('paimana_auth_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Navigation & Role: Default based on saved session or 'risk-signals'
  const [activeNav, setActiveNav] = useState<NavItemId>(() => {
    try {
      const stored = localStorage.getItem('paimana_auth_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'analyst') return 'dashboard';
        if (parsed.role === 'admin') return 'workspace-settings';
        if (parsed.role === 'officer') return 'risk-signals';
      }
    } catch {
      // Ignore localStorage read error
    }
    return 'dashboard';
  });

  const [userRole, setUserRole] = useState<'analyst' | 'officer' | 'admin'>(() => {
    try {
      const stored = localStorage.getItem('paimana_auth_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role) return parsed.role;
      }
    } catch {
      // Ignore localStorage read error
    }
    return 'analyst';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals & Drawers
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isIngestOpen, setIsIngestOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);

  // Portfolio & Projects Data
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<EarlyWarningProject[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters & Sorting
  const [search, setSearch] = useState<string>('');
  const [selectedMinistry, setSelectedMinistry] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedRiskTier, setSelectedRiskTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRiskType, setSelectedRiskType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('risk_score');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Loading States
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);

  // Fetch Portfolio Summary
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await api.getPortfolioSummary();
      setSummary(data);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // Fetch Projects List
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await api.getProjects({
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        ministry: selectedMinistry !== 'ALL' ? selectedMinistry : undefined,
        sector: selectedSector !== 'ALL' ? selectedSector : undefined,
        risk_tier: selectedRiskTier !== 'ALL' ? selectedRiskTier : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        risk_type: selectedRiskType !== 'ALL' ? selectedRiskType : undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setProjects(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingProjects(false);
    }
  }, [page, perPage, search, selectedMinistry, selectedSector, selectedRiskTier, selectedStatus, selectedRiskType, sortBy, sortOrder]);

  // Fetch Early Warnings
  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const data = await api.getEarlyWarnings({
        min_risk_score: 50.0,
        sector: selectedSector !== 'ALL' ? selectedSector : undefined,
        limit: 50
      });
      setAlerts(data);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingAlerts(false);
    }
  }, [selectedSector]);

  // Initial Load
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedMinistry('ALL');
    setSelectedSector('ALL');
    setSelectedRiskTier('ALL');
    setSelectedStatus('ALL');
    setSelectedRiskType('ALL');
    setSortBy('risk_score');
    setSortOrder('desc');
    setPage(1);
  };

  // Export Projects Handler (SRS v2.0 FR-13.2)
  const handleExportProjects = async (format: 'csv' | 'json') => {
    try {
      await api.downloadProjectReport(format, {
        search: search.trim() || undefined,
        ministry: selectedMinistry,
        sector: selectedSector,
        risk_tier: selectedRiskTier,
        status: selectedStatus,
        risk_type: selectedRiskType
      });
    } catch {
      // Graceful fallback
    }
  };

  // Sorting Handler
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Select project by ID
  const handleSelectProjectId = async (id: string) => {
    try {
      const proj = await api.getProject(id);
      setSelectedProject(proj);
    } catch {
      // Graceful fallback
    }
  };

  const handleRefreshAll = () => {
    fetchSummary();
    fetchProjects();
    fetchAlerts();
  };

  // Role Switcher Handler with tailored perspective defaults
  const handleRoleChange = (role: 'analyst' | 'officer' | 'admin') => {
    setUserRole(role);
    if (role === 'officer') {
      setActiveNav('risk-signals');
    } else if (role === 'analyst') {
      setActiveNav('dashboard');
    } else if (role === 'admin') {
      setActiveNav('workspace-settings');
    }
  };

  // User Authentication Handlers
  const handleLogin = (user: AuthUser) => {
    try {
      localStorage.setItem('paimana_auth_session', JSON.stringify(user));
    } catch {
      // Ignore localStorage write error
    }
    setAuthUser(user);
    handleRoleChange(user.role);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('paimana_auth_session');
    } catch {
      // Ignore localStorage removal error
    }
    setAuthUser(null);
  };

  // Unauthenticated Gateway: Render government-grade login interface
  if (!authUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      {/* Persistent Left Sidebar matching reference image */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        earlyWarningCount={alerts.length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Main App Content View Area */}
      <div className="app-main-content">
        {/* Top Navbar with Active Breadcrumb, Role Switcher, and Fast Actions */}
        <TopNav
          activeNav={activeNav}
          userRole={userRole}
          setUserRole={handleRoleChange}
          onOpenIngest={() => setIsIngestOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          earlyWarningCount={alerts.length}
          totalProjects={summary?.total_projects || 1981}
          authUser={authUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Nav View Content */}
        <main style={{ flex: 1, minHeight: 'calc(100vh - 140px)' }}>
          {/* 1. Dashboard View */}
          {activeNav === 'dashboard' && (
            <DashboardView
              summary={summary}
              loadingSummary={loadingSummary}
              alerts={alerts}
              onNavigate={setActiveNav}
              onSelectProjectId={handleSelectProjectId}
            />
          )}

          {/* 2. Projects View */}
          {activeNav === 'projects' && (
            <div>
              <FilterPanel
                userRole={userRole}
                search={search}
                setSearch={(s) => { setSearch(s); setPage(1); }}
                selectedMinistry={selectedMinistry}
                setSelectedMinistry={(m) => { setSelectedMinistry(m); setPage(1); }}
                selectedSector={selectedSector}
                setSelectedSector={(s) => { setSelectedSector(s); setPage(1); }}
                selectedRiskTier={selectedRiskTier}
                setSelectedRiskTier={(r) => { setSelectedRiskTier(r); setPage(1); }}
                selectedStatus={selectedStatus}
                setSelectedStatus={(s) => { setSelectedStatus(s); setPage(1); }}
                selectedRiskType={selectedRiskType}
                setSelectedRiskType={(t) => { setSelectedRiskType(t); setPage(1); }}
                sectors={summary?.sectors || []}
                ministries={summary?.top_ministries || []}
                onResetFilters={handleResetFilters}
                earlyWarningCount={alerts.length}
                onOpenStatsModal={() => setIsStatsModalOpen(true)}
                onExportProjects={handleExportProjects}
              />
              <ProjectTable
                projects={projects}
                total={total}
                page={page}
                perPage={perPage}
                totalPages={totalPages}
                onPageChange={setPage}
                onSelectProject={setSelectedProject}
                loading={loadingProjects}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            </div>
          )}

          {/* 3. Risk Signals View (Active in reference image) */}
          {activeNav === 'risk-signals' && (
            <EarlyWarnings
              alerts={alerts}
              loading={loadingAlerts}
              onSelectProjectId={handleSelectProjectId}
              initialCriticalOnly={selectedRiskTier === 'CRITICAL' || true}
            />
          )}

          {/* 4. SLA Monitoring View */}
          {activeNav === 'sla-monitoring' && (
            <SlaMonitoringView
              projects={projects}
              summary={summary}
              onSelectProject={setSelectedProject}
            />
          )}

          {/* 5. Geospatial View */}
          {activeNav === 'geospatial-view' && (
            <GeospatialView
              projects={projects}
              summary={summary}
              onSelectProject={setSelectedProject}
            />
          )}

          {/* 6. Document Analyzer View */}
          {activeNav === 'document-analyzer' && (
            <DocumentAnalyzerView />
          )}

          {/* 7. Saved Analyses View */}
          {activeNav === 'saved-analyses' && (
            <SavedAnalysesView
              onOpenStatsModal={() => setIsStatsModalOpen(true)}
              onExportCsv={() => handleExportProjects('csv')}
              onExportJson={() => handleExportProjects('json')}
            />
          )}

          {/* 8. Interventions View */}
          {activeNav === 'interventions' && (
            <InterventionsView
              projects={projects}
              onSelectProject={setSelectedProject}
            />
          )}

          {/* 9. Scenario Lab View */}
          {activeNav === 'scenario-lab' && (
            <ScenarioLabView summary={summary} />
          )}

          {/* 10. Workspace Settings View */}
          {activeNav === 'workspace-settings' && (
            <WorkspaceSettingsView
              userRole={userRole}
              setUserRole={handleRoleChange}
              onOpenIngest={() => setIsIngestOpen(true)}
              summary={summary}
              onRefreshAll={handleRefreshAll}
            />
          )}
        </main>

        {/* Unified Footer */}
        <footer
          style={{
            width: '100%',
            padding: '16px 28px',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: '#64748B',
            boxSizing: 'border-box'
          }}
        >
          <span style={{ fontWeight: 600, color: '#0F172A', textAlign: 'center', letterSpacing: '0.01em' }}>
            PAIMANA Intelligence
          </span>
        </footer>
      </div>

      {/* Drill-down Inspection Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          userRole={userRole}
        />
      )}

      {/* Statistical Profiling & Distribution Modal */}
      {isStatsModalOpen && (
        <DescriptiveStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          sector={selectedSector !== 'ALL' ? selectedSector : undefined}
          ministry={selectedMinistry !== 'ALL' ? selectedMinistry : undefined}
        />
      )}

      {/* Data Ingestion & Live Retraining Operations Modal */}
      {isIngestOpen && (
        <DataIngestModal
          isOpen={isIngestOpen}
          onClose={() => setIsIngestOpen(false)}
          sectors={summary?.sectors || []}
          onRefreshData={handleRefreshAll}
        />
      )}
    </div>
  );
};

export default App;
