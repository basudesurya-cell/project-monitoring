import React, { useEffect, useState } from 'react';
import { 
  Layers, 
  Cpu, 
  Database
} from 'lucide-react';
import type { CUFGapAnalysis, ModelBenchmark } from '../types';
import { api } from '../services/api';

export const AnalyticsView: React.FC = () => {
  const [cufData, setCufData] = useState<CUFGapAnalysis | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<ModelBenchmark | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCUFGapAnalysis(), api.getModelBenchmark()])
      .then(([cuf, bench]) => {
        setCufData(cuf);
        setBenchmarkData(bench);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px 28px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Generating comparative benchmarking & CUF-gap analytics...
      </div>
    );
  }

  return (
    <div style={{ padding: '0 28px 32px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SECTION 1: SIH26103 Dimension (b) - ML vs Statistical Baseline Benchmarking */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={20} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                SIH26103 Dimension (b): Machine Learning vs. Statistical Baselines
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Quantified side-by-side performance evaluation of Advanced ML Ensembles vs Conventional Ordinary Least Squares (OLS) Linear & Logistic Baselines trained on identical held-out test splits.
            </p>
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            background: '#F1F5F9',
            color: '#0F172A',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0'
          }}>
            Mandatory PS Dimension
          </span>
        </div>

        {/* Comparison Summary Banner */}
        {benchmarkData && (
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)'
          }}>
            <strong>Evaluation Insight:</strong> {benchmarkData.comparison_summary}
          </div>
        )}

        {/* Metrics Comparison Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Model Architecture</th>
                <th style={{ padding: '12px 16px' }}>Methodology Type</th>
                <th style={{ padding: '12px 16px' }}>Target Outcome</th>
                <th style={{ padding: '12px 16px' }}>R² Goodness-of-Fit</th>
                <th style={{ padding: '12px 16px' }}>RMSE</th>
                <th style={{ padding: '12px 16px' }}>MAE</th>
                <th style={{ padding: '12px 16px' }}>Classification Acc / F1</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData?.metrics.map((m, idx) => {
                const isML = m.model_type === 'ML_MODEL';
                return (
                  <tr 
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isML ? '#F8FAFC' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: isML ? '#0F172A' : 'var(--text-primary)' }}>{m.model_name}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.notes}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isML ? '#F1F5F9' : 'rgba(0, 0, 0, 0.05)',
                        color: isML ? '#0F172A' : 'var(--text-secondary)'
                      }}>
                        {m.model_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>
                      <code>{m.target_variable}</code>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {m.r2_score !== undefined && m.r2_score !== null ? (
                        <strong style={{ color: m.r2_score > 0.6 ? '#10B981' : '#F59E0B' }}>
                          {(m.r2_score * 100).toFixed(1)}%
                        </strong>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>
                      {m.rmse ? `±${m.rmse}` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>
                      {m.mae ? `±${m.mae}` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {m.accuracy ? (
                        <span style={{ color: '#10B981', fontWeight: 600 }}>
                          {(m.accuracy * 100).toFixed(1)}% (F1: {m.f1_score})
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SIH26103 Dimension (c) - CUF Gap Analysis & Missing Variables */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="#0F172A" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                SIH26103 Dimension (c): CUF Field Sufficiency & Missing Variables Framework
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Diagnostic evaluation of existing Common Upload Form (CUF) variables vs proposed high-impact leading indicators recommended for inclusion by MoSPI.
            </p>
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            background: '#F1F5F9',
            color: '#0F172A',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0'
          }}>
            Policy Diagnostic
          </span>
        </div>

        {/* Existing CUF Ranking */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            A. Existing CUF Fields Ranked by Empirical Feature Importance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {cufData?.existing_cuf_features.map((item, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                    {item.cuf_field_code}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
                    {(item.importance_score * 100).toFixed(1)}% split weight
                  </span>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '4px' }}>
                  {item.feature_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Category: <span style={{ color: 'var(--text-secondary)' }}>{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proposed Missing Variables Matrix */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            B. Proposed Additional Variables NOT Currently in CUF (Justification & Data Source)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cufData?.proposed_missing_variables.map((p, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  borderLeft: '4px solid #0F172A'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#F1F5F9',
                      color: '#0F172A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {idx + 1}
                    </span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{p.variable_name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({p.dimension})</span>
                  </div>

                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#10B981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {p.expected_predictive_lift}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px' }}>
                  {p.justification}
                </p>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={13} color="var(--accent-cyan)" />
                  <span><strong>Integration Pipeline:</strong> {p.data_source_proposal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
