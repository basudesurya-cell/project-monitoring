import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  FileCheck
} from 'lucide-react';
import type { Project } from '../types';

interface InterventionsViewProps {
  projects?: Project[];
  onSelectProject?: (project: Project) => void;
}

export const InterventionsView: React.FC<InterventionsViewProps> = () => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<string>('ROW_CLEARANCE');
  const [activeMemo, setActiveMemo] = useState<string | null>(null);

  const playbooks = [
    {
      id: 'ROW_CLEARANCE',
      title: 'Fast-Track Land Acquisition & RoW Clearance',
      category: 'Statutory & Land',
      targetBottleneck: 'Section 11 Gazette notifications & Right-of-Way disputes',
      expectedImpact: 'Reduces timeline slippage by 12 - 18 months',
      recommendedAuthority: 'Cabinet Secretariat / PRAGATI Inter-Ministerial Review',
      steps: [
        'Form joint District Collectorate & Nodal Ministry Fast-Track Taskforce.',
        'Deposit enhanced compensation in escrow accounts under RFCTLARR Act Section 30.',
        'Obtain provisional RoW handover for non-encumbered stretches to begin civil works.'
      ]
    },
    {
      id: 'CONTRACTOR_SUPPORT',
      title: 'Contractor Liquidity & Mobilization Restructuring',
      category: 'Commercial & Financial',
      targetBottleneck: 'Contractor cash-flow insolvency and labor demobilization',
      expectedImpact: 'Reactivates stalled civil works packages within 30 days',
      recommendedAuthority: 'Ministry Project Authority & Designated Public Sector Bank',
      steps: [
        'Establish tripartite escrow mechanism to route bill disbursements directly to labor and sub-contractors.',
        'Release 75% of undisputed pending milestone claims against bank guarantees.',
        'Re-baseline milestone schedule with liquidated damages conditional waiver.'
      ]
    },
    {
      id: 'FOREST_ENVIRONMENTAL',
      title: 'PARIVESH Single-Window Environmental Fast-Track',
      category: 'Regulatory Approval',
      targetBottleneck: 'Forest Advisory Committee (FAC) & Wildlife clearance delays',
      expectedImpact: 'Compresses clearance appraisal from 180 to 45 days',
      recommendedAuthority: 'MoEFCC Nodal Officer & State Forest Department',
      steps: [
        'Submit online compensatory afforestation (CA) land mutation certificate.',
        'Trigger Stage-I deemed approval pathway for linear infrastructure corridors.',
        'Convene special monthly State Level Environment Impact Assessment Authority (SEIAA) hearing.'
      ]
    },
    {
      id: 'RCE_PIB_SANCTION',
      title: 'Revised Cost Estimates (RCE) Stage-Gate Approval',
      category: 'Executive & Budgetary',
      targetBottleneck: 'Cost escalation exceeding 20% requiring CCEA/PIB re-sanction',
      expectedImpact: 'Unfreezes budgetary allocations and prevents contractor idling claims',
      recommendedAuthority: 'Public Investment Board (PIB) / Ministry of Finance (DEA)',
      steps: [
        'Finalize revised cost escalation justification incorporating SHAP feature drivers.',
        'Submit expedited RCE proposal to Integrated Finance Division (IFD).',
        'Secure CCEA ex-post facto approval with conditional phased disbursement.'
      ]
    }
  ];

  const currentPlaybook = playbooks.find((p) => p.id === selectedPlaybook) || playbooks[0];

  const handleGenerateMemo = () => {
    setActiveMemo(
      `GOVERNMENT OF INDIA\nMINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION\nInfrastructure & Project Monitoring Division (IPMD)\n\nOFFICE MEMORANDUM\nSubject: Implementation of Prescriptive Intervention — ${currentPlaybook.title}\n\n1. Reference is invited to the high-risk infrastructure monitoring report.\n2. In view of empirical risk signals identified in central projects, the competent authority has recommended the immediate execution of ${currentPlaybook.title}.\n3. Expected Slippage Mitigation: ${currentPlaybook.expectedImpact}.\n4. Action Steps Assigned:\n${currentPlaybook.steps.map((s, i) => `   (${i + 1}) ${s}`).join('\n')}\n\nSubmitted for inter-ministerial concurrence and field execution.`
    );
  };

  return (
    <div style={{ padding: '24px 28px 40px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#0F172A" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Corrective Interventions & Policy Playbooks
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
              Empirically grounded decision-support playbooks designed to mitigate delay bottlenecks and curtail cost escalations across central projects.
            </p>
          </div>

          <button
            onClick={handleGenerateMemo}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem'
            }}
          >
            <FileCheck size={16} />
            <span>Generate Escalation Memo</span>
          </button>
        </div>
      </div>

      {/* Playbooks Selection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {playbooks.map((pb) => {
          const isSelected = selectedPlaybook === pb.id;
          return (
            <div
              key={pb.id}
              onClick={() => {
                setSelectedPlaybook(pb.id);
                setActiveMemo(null);
              }}
              className="glass-card"
              style={{
                padding: '18px',
                cursor: 'pointer',
                border: isSelected ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0F172A' }}>
                  {pb.category}
                </span>
                <span style={{ padding: '3px', borderRadius: '4px', background: isSelected ? '#E2E8F0' : '#F1F5F9' }}>
                  <Zap size={14} color={isSelected ? '#0F172A' : '#64748B'} />
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                {pb.title}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: 1.4 }}>
                Impact: <strong style={{ color: '#0F172A' }}>{pb.expectedImpact}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Playbook Detailed Execution Blueprint */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.74rem', color: '#0F172A', fontWeight: 700, textTransform: 'uppercase' }}>
              Standard Operating Procedure (SOP)
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: '4px 0 0 0' }}>
              {currentPlaybook.title}
            </h3>
          </div>
          <div style={{ background: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.74rem', color: '#475569' }}>
            Nodal Authority: <strong>{currentPlaybook.recommendedAuthority}</strong>
          </div>
        </div>

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 16px', borderRadius: '8px', fontSize: '0.8rem', color: '#92400E' }}>
          <strong>Primary Target Bottleneck:</strong> {currentPlaybook.targetBottleneck}
        </div>

        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
            Prescribed Milestone Action Protocol:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentPlaybook.steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generated Memo Display */}
        {activeMemo && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Draft Office Memorandum:
            </div>
            <pre
              style={{
                backgroundColor: '#0F172A',
                color: '#E2E8F0',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace'
              }}
            >
              {activeMemo}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
