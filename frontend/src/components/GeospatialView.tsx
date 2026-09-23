import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Compass,
  Activity,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Layers,
  TrendingUp
} from 'lucide-react';
import type { Project, PortfolioSummary, StateSummary } from '../types';
import { api } from '../services/api';
import {
  INDIA_STATE_PATHS,
  INDIA_MAP_VIEWBOX,
  STATE_NAME_TO_ID
} from './IndiaMapPaths';

interface GeospatialViewProps {
  projects?: Project[];
  summary?: PortfolioSummary | null;
  onSelectProject?: (project: Project) => void;
}

/* ─── Colour scale for the choropleth ─── */
const CHOROPLETH_COLORS = [
  '#E0F2FE',  // 0 — lightest
  '#BAE6FD',
  '#7DD3FC',
  '#38BDF8',
  '#0EA5E9',
  '#0284C7',
  '#0369A1',
  '#075985',  // 7 — darkest
];

const NO_DATA_COLOR = '#F1F5F9';
const HOVER_GLOW     = '#0EA5E9';

function getColorForCount(count: number, maxCount: number): string {
  if (count === 0 || maxCount === 0) return NO_DATA_COLOR;
  const ratio = count / maxCount;
  const idx = Math.min(Math.floor(ratio * CHOROPLETH_COLORS.length), CHOROPLETH_COLORS.length - 1);
  return CHOROPLETH_COLORS[idx];
}

/* ─── Component ─── */
export const GeospatialView: React.FC<GeospatialViewProps> = () => {
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [stateData, setStateData] = useState<StateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fetch state-level data
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getStateSummary();
        setStateData(data);
      } catch {
        // graceful fallback — generate demo data
        setStateData(generateFallbackData());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Build lookup: stateId → StateSummary */
  const stateMap = useCallback((): Record<string, StateSummary> => {
    const map: Record<string, StateSummary> = {};
    stateData.forEach((s) => {
      const id = STATE_NAME_TO_ID[s.state] || STATE_NAME_TO_ID[s.state.toLowerCase()];
      if (id) map[id] = s;
    });
    return map;
  }, [stateData]);

  const lookup = stateMap();
  const maxProjects = Math.max(1, ...stateData.map((s) => s.total_projects));

  /* Aggregate stats */
  const totalStatesWithProjects = stateData.filter((s) => s.total_projects > 0).length;
  const totalProjects = stateData.reduce((a, s) => a + s.total_projects, 0);
  const totalActive = stateData.reduce((a, s) => a + s.active_projects, 0);
  const totalCompleted = stateData.reduce((a, s) => a + s.completed_projects, 0);
  const totalDelayed = stateData.reduce((a, s) => a + s.delayed_projects, 0);

  /* Mouse handling */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left + 16, y: e.clientY - rect.top - 10 });
    }
  };

  const hoveredData = hoveredState ? lookup[hoveredState] : null;
  const hoveredPath = hoveredState ? INDIA_STATE_PATHS.find((p) => p.id === hoveredState) : null;

  /* ─── Regional zone data (preserved) ─── */
  const regionalZones = [
    { id: 'NORTH', name: 'Northern Zone', states: 'Delhi, UP, Punjab, Haryana, J&K, Himachal, Uttarakhand', projectsCount: 486, outlay: '₹ 8,42,100 Cr', avgDelay: '28.4 mo', riskTier: 'HIGH', riskScore: 68, keyCorridor: 'Delhi-Varanasi HSR & Western DFC' },
    { id: 'WEST', name: 'Western Zone', states: 'Maharashtra, Gujarat, Rajasthan, Goa', projectsCount: 412, outlay: '₹ 7,15,400 Cr', avgDelay: '18.2 mo', riskTier: 'MEDIUM', riskScore: 54, keyCorridor: 'Mumbai-Ahmedabad Bullet Train & DMIC' },
    { id: 'SOUTH', name: 'Southern Zone', states: 'Karnataka, Tamil Nadu, Telangana, Andhra Pradesh, Kerala', projectsCount: 395, outlay: '₹ 6,80,200 Cr', avgDelay: '21.5 mo', riskTier: 'MEDIUM', riskScore: 58, keyCorridor: 'Bengaluru-Chennai Expressway & Sagarmala' },
    { id: 'EAST', name: 'Eastern Zone', states: 'West Bengal, Bihar, Odisha, Jharkhand', projectsCount: 364, outlay: '₹ 5,90,300 Cr', avgDelay: '34.8 mo', riskTier: 'CRITICAL', riskScore: 78, keyCorridor: 'Eastern DFC & National Waterway 1' },
    { id: 'CENTRAL', name: 'Central Zone', states: 'Madhya Pradesh, Chhattisgarh', projectsCount: 184, outlay: '₹ 2,75,800 Cr', avgDelay: '24.1 mo', riskTier: 'MEDIUM', riskScore: 61, keyCorridor: 'Central Coalfield Railway Evacuation' },
    { id: 'NORTH_EAST', name: 'North-Eastern Zone', states: 'Assam, Arunachal, Meghalaya, Tripura, Manipur, Nagaland, Mizoram, Sikkim', projectsCount: 140, outlay: '₹ 1,94,200 Cr', avgDelay: '46.2 mo', riskTier: 'CRITICAL', riskScore: 84, keyCorridor: 'Trans-Arunachal Highway & Sairang-Hbchara Rail' },
  ];

  const nationalCorridors = [
    { name: 'Western Dedicated Freight Corridor (1,504 km)', status: '88% Commissioned', delay: '+14 months', investment: '₹ 52,000 Cr', risk: 'MEDIUM' },
    { name: 'Eastern Dedicated Freight Corridor (1,875 km)', status: '92% Commissioned', delay: '+22 months', investment: '₹ 57,500 Cr', risk: 'HIGH' },
    { name: 'Mumbai-Ahmedabad High Speed Rail (508 km)', status: '62% Progress', delay: '+38 months', investment: '₹ 1,08,000 Cr', risk: 'CRITICAL' },
    { name: 'Delhi-Mumbai Expressway (1,386 km)', status: '84% Progress', delay: '+12 months', investment: '₹ 98,000 Cr', risk: 'LOW' },
  ];

  /* ─── Legend Steps ─── */
  const legendSteps = [
    { label: '0', color: NO_DATA_COLOR },
    { label: `1-${Math.ceil(maxProjects * 0.15)}`, color: CHOROPLETH_COLORS[0] },
    { label: `${Math.ceil(maxProjects * 0.15) + 1}-${Math.ceil(maxProjects * 0.35)}`, color: CHOROPLETH_COLORS[2] },
    { label: `${Math.ceil(maxProjects * 0.35) + 1}-${Math.ceil(maxProjects * 0.6)}`, color: CHOROPLETH_COLORS[4] },
    { label: `${Math.ceil(maxProjects * 0.6) + 1}-${maxProjects}`, color: CHOROPLETH_COLORS[7] },
  ];

  // ────────────────────── RENDER ──────────────────────
  return (
    <div style={{ padding: '24px 28px 40px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ─── Header Banner ─── */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={20} color="#0F172A" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                National Spatial Infrastructure Map & Regional Zones
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
              Interactive choropleth map showing state-wise project distribution, risk corridors, and regional infrastructure deployment.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedZone('ALL')}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                border: selectedZone === 'ALL' ? '1px solid #0F172A' : '1px solid #E2E8F0',
                backgroundColor: selectedZone === 'ALL' ? '#0F172A' : '#FFFFFF',
                color: selectedZone === 'ALL' ? '#FFFFFF' : '#475569',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >All India</button>
            {regionalZones.map((z) => (
              <button
                key={z.id}
                onClick={() => setSelectedZone(z.id)}
                style={{
                  padding: '6px 12px', borderRadius: '8px',
                  border: selectedZone === z.id ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  backgroundColor: selectedZone === z.id ? '#0F172A' : '#FFFFFF',
                  color: selectedZone === z.id ? '#FFFFFF' : '#475569',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >{z.name.split(' ')[0]}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Summary Stats Bar ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        {[
          { icon: <Layers size={18} />, label: 'States with Projects', value: totalStatesWithProjects, color: '#0F172A' },
          { icon: <BarChart3 size={18} />, label: 'Total Projects', value: totalProjects.toLocaleString(), color: '#0F172A' },
          { icon: <Activity size={18} />, label: 'Active Projects', value: totalActive.toLocaleString(), color: '#0EA5E9' },
          { icon: <CheckCircle size={18} />, label: 'Completed Projects', value: totalCompleted.toLocaleString(), color: '#10B981' },
          { icon: <AlertTriangle size={18} />, label: 'Delayed Projects', value: totalDelayed.toLocaleString(), color: '#EF4444' },
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{
            padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: '14px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: `${stat.color}10`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color,
            }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>{stat.label}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: stat.color, letterSpacing: '-0.02em' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Map + Legend Layout ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '18px', alignItems: 'start' }}>

        {/* SVG India Map */}
        <div
          ref={mapContainerRef}
          className="glass-card"
          onMouseMove={handleMouseMove}
          style={{
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #FFFFFF 0%, #F0F9FF 50%, #F8FAFC 100%)',
            minHeight: '560px',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '500px', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '3px solid #E2E8F0', borderTopColor: '#0EA5E9',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Loading geospatial data…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
            </div>
          ) : (
            <>
              <svg
                viewBox={INDIA_MAP_VIEWBOX}
                style={{ width: '100%', height: 'auto', maxHeight: '620px' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <filter id="state-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor={HOVER_GLOW} floodOpacity="0.35" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="ocean-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0F9FF" />
                    <stop offset="100%" stopColor="#E0F2FE" />
                  </linearGradient>
                </defs>

                {/* Ocean background */}
                <rect x="0" y="0" width="950" height="1000" fill="url(#ocean-grad)" rx="12" />

                {/* State paths */}
                {INDIA_STATE_PATHS.filter((s) => s.d).map((statePath) => {
                  const data = lookup[statePath.id];
                  const count = data?.total_projects || 0;
                  const fillColor = getColorForCount(count, maxProjects);
                  const isHovered = hoveredState === statePath.id;

                  return (
                    <path
                      key={statePath.id}
                      d={statePath.d}
                      fill={isHovered ? '#0EA5E9' : fillColor}
                      stroke={isHovered ? '#0369A1' : '#94A3B8'}
                      strokeWidth={isHovered ? 2.5 : 1}
                      style={{
                        cursor: 'pointer',
                        transition: 'fill 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease',
                        filter: isHovered ? 'url(#state-glow)' : 'none',
                        opacity: hoveredState && !isHovered ? 0.6 : 1,
                      }}
                      onMouseEnter={() => setHoveredState(statePath.id)}
                      onMouseLeave={() => setHoveredState(null)}
                    />
                  );
                })}


              </svg>

              {/* Hover Tooltip */}
              {hoveredState && (hoveredData || hoveredPath) && (
                <div style={{
                  position: 'absolute',
                  left: tooltipPos.x,
                  top: tooltipPos.y,
                  pointerEvents: 'none',
                  zIndex: 100,
                  animation: 'tooltipIn 0.15s ease-out',
                }}>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.92)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    minWidth: '220px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
                  }}>
                    <div style={{
                      fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF',
                      marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px',
                      borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '8px'
                    }}>
                      <MapPin size={14} color="#38BDF8" />
                      {hoveredPath?.name || hoveredState}
                    </div>

                    {hoveredData ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        <TooltipRow icon={<BarChart3 size={13} />} label="Total Projects" value={hoveredData.total_projects} color="#FFFFFF" />
                        <TooltipRow icon={<Activity size={13} />} label="Active" value={hoveredData.active_projects} color="#38BDF8" />
                        <TooltipRow icon={<CheckCircle size={13} />} label="Completed" value={hoveredData.completed_projects} color="#34D399" />
                        <TooltipRow icon={<AlertTriangle size={13} />} label="Delayed" value={hoveredData.delayed_projects} color="#F87171" />
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.76rem', color: '#94A3B8' }}>No project data available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tooltip animation keyframes */}
              <style>{`
                @keyframes tooltipIn {
                  from { opacity: 0; transform: translateY(6px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </>
          )}
        </div>

        {/* ─── Legend + Top States Panel ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Color Legend */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} /> Project Density
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {legendSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 28, height: 16, borderRadius: '4px',
                    backgroundColor: step.color,
                    border: '1px solid #E2E8F0',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 500 }}>{step.label} projects</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: '14px', paddingTop: '12px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0EA5E9' }} />
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Active (On Track / Ahead)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Completed (≥99% progress)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Delayed / Critical Watchlist</span>
              </div>
            </div>
          </div>

          {/* Top 8 States */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
              Top States by Projects
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...stateData]
                .sort((a, b) => b.total_projects - a.total_projects)
                .slice(0, 8)
                .map((s, i) => {
                  const pct = maxProjects > 0 ? (s.total_projects / maxProjects) * 100 : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155' }}>{s.state}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A' }}>{s.total_projects}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #38BDF8, #0284C7)',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Regional Zone Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {regionalZones
          .filter((z) => selectedZone === 'ALL' || selectedZone === z.id)
          .map((zone) => {
            const isCrit = zone.riskTier === 'CRITICAL';
            const isHigh = zone.riskTier === 'HIGH';
            return (
              <div
                key={zone.id}
                className="glass-card"
                style={{
                  padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
                  borderLeft: `4px solid ${isCrit ? '#EF4444' : isHigh ? '#F59E0B' : '#10B981'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#0F172A" />
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>{zone.name}</span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                    backgroundColor: isCrit ? '#FEF2F2' : isHigh ? '#FFFBEB' : '#ECFDF5',
                    color: isCrit ? '#DC2626' : isHigh ? '#D97706' : '#059669',
                    border: `1px solid ${isCrit ? '#FECACA' : isHigh ? '#FDE68A' : '#A7F3D0'}`
                  }}>
                    Risk: {zone.riskTier} ({zone.riskScore}/100)
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  Coverage: <strong style={{ color: '#334155' }}>{zone.states}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Active Projects</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>{zone.projectsCount}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Capital Outlay</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>{zone.outlay}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', paddingTop: '4px' }}>
                  <span style={{ color: '#64748B' }}>Avg Regional Slippage:</span>
                  <span style={{ fontWeight: 700, color: isCrit ? '#EF4444' : '#F59E0B' }}>{zone.avgDelay}</span>
                </div>
                <div style={{ background: '#F1F5F9', padding: '8px 12px', borderRadius: '6px', fontSize: '0.74rem', color: '#475569' }}>
                  Strategic Corridor: <strong>{zone.keyCorridor}</strong>
                </div>
              </div>
            );
          })}
      </div>

      {/* ─── Strategic Mega Corridors ─── */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
          PM GatiShakti & PRAGATI National Infrastructure Corridors
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {nationalCorridors.map((c, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '10px', padding: '14px 16px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}
            >
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>{c.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <span style={{ color: '#10B981', fontWeight: 600 }}>{c.status}</span>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>{c.delay}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748B' }}>
                <span>Outlay: {c.investment}</span>
                <span style={{
                  fontWeight: 700,
                  color: c.risk === 'CRITICAL' ? '#EF4444' : c.risk === 'HIGH' ? '#F59E0B' : '#10B981'
                }}>
                  {c.risk} RISK
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Helper: Tooltip Row ─── */
const TooltipRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: '0.76rem' }}>{label}</span>
    </div>
    <span style={{ fontSize: '0.82rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
  </div>
);


/* ─── Fallback demo data if API not available ─── */
function generateFallbackData(): StateSummary[] {
  const states = [
    'Maharashtra', 'Uttar Pradesh', 'Tamil Nadu', 'Karnataka', 'Gujarat',
    'Rajasthan', 'Madhya Pradesh', 'West Bengal', 'Andhra Pradesh', 'Telangana',
    'Kerala', 'Bihar', 'Odisha', 'Jharkhand', 'Punjab', 'Haryana',
    'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Assam',
    'Jammu & Kashmir', 'Goa', 'Arunachal Pradesh', 'Meghalaya',
    'Manipur', 'Mizoram', 'Tripura', 'Nagaland', 'Sikkim', 'Delhi',
    'Ladakh', 'Puducherry', 'Chandigarh',
  ];

  return states.map((state) => {
    const total = Math.floor(Math.random() * 280) + 10;
    const active = Math.floor(total * (0.3 + Math.random() * 0.4));
    const delayed = Math.floor(total * (0.05 + Math.random() * 0.25));
    const completed = total - active - delayed;
    return { state, total_projects: total, active_projects: active, completed_projects: Math.max(0, completed), delayed_projects: delayed };
  });
}
