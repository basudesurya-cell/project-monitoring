import React, { useState, useMemo } from 'react';
import {
  Gauge,
  RotateCcw
} from 'lucide-react';
import type { PortfolioSummary } from '../types';

interface ScenarioLabViewProps {
  summary: PortfolioSummary | null;
}

export const ScenarioLabView: React.FC<ScenarioLabViewProps> = ({ summary }) => {
  // Sliders state
  const [inflationShock, setInflationShock] = useState<number>(0); // -10% to +30%
  const [weatherLagMonths, setWeatherLagMonths] = useState<number>(0); // 0 to 12 months
  const [clearanceFastTrack, setClearanceFastTrack] = useState<number>(0); // 0 to 18 months reduction
  const [contractorEfficiency, setContractorEfficiency] = useState<number>(100); // 50% to 150%

  // Presets
  const applyPreset = (preset: 'baseline' | 'monsoon' | 'commodity' | 'reforms') => {
    if (preset === 'baseline') {
      setInflationShock(0);
      setWeatherLagMonths(0);
      setClearanceFastTrack(0);
      setContractorEfficiency(100);
    } else if (preset === 'monsoon') {
      setInflationShock(5);
      setWeatherLagMonths(6);
      setClearanceFastTrack(0);
      setContractorEfficiency(80);
    } else if (preset === 'commodity') {
      setInflationShock(18);
      setWeatherLagMonths(2);
      setClearanceFastTrack(0);
      setContractorEfficiency(90);
    } else if (preset === 'reforms') {
      setInflationShock(0);
      setWeatherLagMonths(0);
      setClearanceFastTrack(10);
      setContractorEfficiency(130);
    }
  };

  // Base metrics from summary or defaults
  const baseCostEscalation = summary?.total_cost_escalation || 541000; // in Cr
  const baseAvgDelay = summary?.avg_delay_months || 36.4;
  const baseCriticalCount = summary?.critical_risk_count || 438;

  // Dynamic simulation calculations
  const simulatedCostEscalation = useMemo(() => {
    const inflationImpact = baseCostEscalation * (1 + inflationShock / 100);
    const delayCostImpact = (weatherLagMonths - clearanceFastTrack * 0.4) * 1200;
    const efficiencyFactor = contractorEfficiency < 100 ? (100 - contractorEfficiency) * 800 : -(contractorEfficiency - 100) * 400;
    return Math.max(0, Math.round(inflationImpact + delayCostImpact + efficiencyFactor));
  }, [baseCostEscalation, inflationShock, weatherLagMonths, clearanceFastTrack, contractorEfficiency]);

  const simulatedAvgDelay = useMemo(() => {
    const netDelay = baseAvgDelay + weatherLagMonths - clearanceFastTrack;
    const effDelayDelta = (100 - contractorEfficiency) * 0.12;
    return Math.max(0, parseFloat((netDelay + effDelayDelta).toFixed(1)));
  }, [baseAvgDelay, weatherLagMonths, clearanceFastTrack, contractorEfficiency]);

  const simulatedCriticalCount = useMemo(() => {
    let delta = 0;
    if (inflationShock > 0) delta += Math.round(inflationShock * 4.5);
    if (weatherLagMonths > 0) delta += weatherLagMonths * 12;
    if (clearanceFastTrack > 0) delta -= clearanceFastTrack * 14;
    if (contractorEfficiency < 100) delta += (100 - contractorEfficiency) * 1.8;
    if (contractorEfficiency > 100) delta -= (contractorEfficiency - 100) * 1.5;
    return Math.max(50, Math.round(baseCriticalCount + delta));
  }, [baseCriticalCount, inflationShock, weatherLagMonths, clearanceFastTrack, contractorEfficiency]);

  const costDelta = simulatedCostEscalation - baseCostEscalation;
  const delayDelta = simulatedAvgDelay - baseAvgDelay;

  return (
    <div style={{ padding: '24px 28px 40px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gauge size={20} color="#0F172A" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Scenario Lab: What-If Predictive Simulation Workbench
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
              Simulate macroeconomic stress tests, environmental anomalies, and policy intervention levers to forecast portfolio risk.
            </p>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => applyPreset('baseline')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Baseline</span>
            </button>
            <button
              onClick={() => applyPreset('monsoon')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#475569',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⛈️ Monsoon Shock
            </button>
            <button
              onClick={() => applyPreset('commodity')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#475569',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📈 Steel/Cement Surge (+18%)
            </button>
            <button
              onClick={() => applyPreset('reforms')}
              className="btn-primary"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.76rem'
              }}
            >
              🚀 PRAGATI Reform Lever
            </button>
          </div>
        </div>
      </div>

      {/* Simulated Outcomes KPI Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        {/* Simulated Cost Escalation */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Simulated Cost Escalation</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
            ₹ {simulatedCostEscalation.toLocaleString()} Cr
          </div>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: costDelta > 0 ? '#EF4444' : costDelta < 0 ? '#10B981' : '#64748B' }}>
            {costDelta > 0 ? `+₹ ${costDelta.toLocaleString()} Cr (+${((costDelta / baseCostEscalation) * 100).toFixed(1)}%)` :
             costDelta < 0 ? `-₹ ${Math.abs(costDelta).toLocaleString()} Cr (-${((Math.abs(costDelta) / baseCostEscalation) * 100).toFixed(1)}%)` :
             'Matches baseline'}
          </div>
        </div>

        {/* Simulated Delay Months */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Simulated Avg Delay</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
            {simulatedAvgDelay} months
          </div>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: delayDelta > 0 ? '#EF4444' : delayDelta < 0 ? '#10B981' : '#64748B' }}>
            {delayDelta > 0 ? `+${delayDelta.toFixed(1)} months slippage` :
             delayDelta < 0 ? `${delayDelta.toFixed(1)} months recovered` :
             'Matches baseline'}
          </div>
        </div>

        {/* Critical Risk Population */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Simulated Critical Projects</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: simulatedCriticalCount > baseCriticalCount ? '#EF4444' : '#10B981' }}>
            {simulatedCriticalCount} projects
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
            Baseline: {baseCriticalCount} projects
          </div>
        </div>
      </div>

      {/* Two Column Control Workbench */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, 1fr)', gap: '20px' }}>
        {/* Left: Simulation Parameter Sliders */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Macro & Operational Simulation Levers
          </h3>

          {/* Slider 1: Inflation Shock */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Wholesale Price / Commodity Shock:</span>
              <span style={{ fontWeight: 700, color: inflationShock > 0 ? '#EF4444' : '#10B981' }}>
                {inflationShock > 0 ? `+${inflationShock}%` : `${inflationShock}%`}
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="30"
              value={inflationShock}
              onChange={(e) => setInflationShock(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#0F172A' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Impacts cement, steel, bitumen, and equipment procurement packages.
            </span>
          </div>

          {/* Slider 2: Weather & Monsoon Delay */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Monsoon / Extreme Weather Extension:</span>
              <span style={{ fontWeight: 700, color: weatherLagMonths > 0 ? '#EF4444' : '#64748B' }}>
                +{weatherLagMonths} months
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              value={weatherLagMonths}
              onChange={(e) => setWeatherLagMonths(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#0F172A' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Extends work suspension periods in flood-prone and coastal railway/highway zones.
            </span>
          </div>

          {/* Slider 3: Fast-Track Clearance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>RoW & Forest Clearance Acceleration:</span>
              <span style={{ fontWeight: 700, color: '#10B981' }}>
                -{clearanceFastTrack} months
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="18"
              value={clearanceFastTrack}
              onChange={(e) => setClearanceFastTrack(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#0F172A' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Applies single-window PARIVESH and PMO PRAGATI resolution speedup.
            </span>
          </div>

          {/* Slider 4: Contractor Efficiency */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Contractor Mobilization Efficiency:</span>
              <span style={{ fontWeight: 700, color: contractorEfficiency >= 100 ? '#10B981' : '#F59E0B' }}>
                {contractorEfficiency}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={contractorEfficiency}
              onChange={(e) => setContractorEfficiency(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#0F172A' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Reflects labor capacity, sub-contractor solvency, and equipment availability.
            </span>
          </div>
        </div>

        {/* Right: Sector Sensitivity Insights */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Sectoral Sensitivity & Exposure
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              {
                sector: 'Railways (432 Projects)',
                sensitivity: 'High Sensitivity to Steel & RoW',
                exposure: inflationShock > 10 ? 'Severe Exposure' : 'Moderate Exposure',
                color: inflationShock > 10 ? '#EF4444' : '#F59E0B'
              },
              {
                sector: 'Road Transport & Highways (610 Projects)',
                sensitivity: 'High Sensitivity to Bitumen & Monsoon',
                exposure: weatherLagMonths > 3 ? 'Critical Flooding Risk' : 'Normal Operations',
                color: weatherLagMonths > 3 ? '#EF4444' : '#10B981'
              },
              {
                sector: 'Petroleum & Natural Gas (148 Projects)',
                sensitivity: 'High Sensitivity to EPC Specialized Piping',
                exposure: contractorEfficiency < 80 ? 'Vendor Bottleneck' : 'Stable Capacity',
                color: contractorEfficiency < 80 ? '#F59E0B' : '#10B981'
              },
              {
                sector: 'Power & Transmission (98 Projects)',
                sensitivity: 'High Sensitivity to Forest De-notification',
                exposure: clearanceFastTrack >= 6 ? 'Significant Timeline Gain' : 'Persistent Regulatory Lag',
                color: clearanceFastTrack >= 6 ? '#10B981' : '#F59E0B'
              }
            ].map((s, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>{s.sector}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>{s.exposure}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '4px' }}>
                  {s.sensitivity}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
