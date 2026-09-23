import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  RefreshCw, 
  CheckCircle, 
  Database, 
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import type { SectorSummary, DataQualityLogItem } from '../types';

interface DataIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: SectorSummary[];
  onRefreshData: () => void;
}

export const DataIngestModal: React.FC<DataIngestModalProps> = ({
  isOpen,
  onClose,
  sectors,
  onRefreshData
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [provenance, setProvenance] = useState<string>('REAL');
  const [retrainSector, setRetrainSector] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [qualityLogs, setQualityLogs] = useState<DataQualityLogItem[]>([]);

  if (!isOpen) return null;

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setStatusMessage('Uploading and parsing CUF dataset...');

    try {
      const res = await api.uploadDataset(selectedFile, provenance);
      setStatusMessage(`Success! Ingested ${res.records_processed} records. ${res.records_flagged_anomalies} anomalies logged.`);
      setSelectedFile(null);
      onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setStatusMessage(`Upload failed: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('This will reseed the official MoSPI April 2026 baseline dataset (~1,981 projects). Continue?')) return;
    setIsProcessing(true);
    setStatusMessage('Seeding official MoSPI April 2026 benchmark dataset and retraining models...');

    try {
      const res = await api.reseedBaseline();
      setStatusMessage(`Benchmark dataset restored: ${res.records_processed} projects seeded.`);
      onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reseed failed';
      setStatusMessage(`Reseed failed: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLiveRetrain = async () => {
    setIsProcessing(true);
    setStatusMessage(`Retraining ML models and statistical baselines for sector: '${retrainSector}'...`);

    try {
      const res = await api.retrainModels(retrainSector);
      setStatusMessage(`Retraining complete for ${retrainSector}! ${res.records_trained} samples trained.`);
      onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retrain failed';
      setStatusMessage(`Retrain failed: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchQualityLogs = async () => {
    try {
      const logs = await api.getQualityLogs();
      setQualityLogs(logs);
    } catch {
      // Graceful fallback
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '24px'
    }}>
      <div 
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-modal)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} color="var(--accent-cyan)" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Data Management & Model Operations
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Ingest custom CUF datasets, restore official benchmarks, and trigger live sector model retraining
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Alert */}
          {statusMessage && (
            <div style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} color="var(--accent-cyan)" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Section 1: Upload Custom Dataset */}
          <div className="glass-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <UploadCloud size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                1. Ingest Custom Project Dataset (CSV, Excel, JSON)
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Upload real PAIMANA report exports. The normalization engine automatically canonicalizes column names, computes cost and schedule overrun ground-truth labels, and logs schema anomalies.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <input
                id="dataset-file-input"
                type="file"
                accept=".csv,.xlsx,.xls,.json,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  flex: '1 1 200px'
                }}
              />

              <select
                value={provenance}
                onChange={(e) => setProvenance(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem'
                }}
              >
                <option value="REAL">Provenance: REAL (MoSPI Actual)</option>
                <option value="REAL_BENCHMARK">Provenance: REAL_BENCHMARK</option>
                <option value="SYNTHETIC">Provenance: SYNTHETIC (Augmented)</option>
              </select>

              <button
                id="submit-upload-btn"
                className="btn-primary"
                onClick={handleFileUpload}
                disabled={!selectedFile || isProcessing}
                style={{ opacity: (!selectedFile || isProcessing) ? 0.5 : 1 }}
              >
                <UploadCloud size={15} />
                <span>Upload & Process</span>
              </button>
            </div>
          </div>

          {/* Section 2: On-Demand Sector Retraining (SRS FR-3.3 Live Judge Stress-Test) */}
          <div className="glass-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Cpu size={18} color="#818CF8" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                2. Live On-Demand Sector Model Retraining (SRS FR-3.3)
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Fulfills live judge stress-test requirement: isolate any sector (e.g. Railways, Highways, Power) and retrain the Gradient Boosting and baseline models live on demand.
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                id="retrain-sector-select"
                value={retrainSector}
                onChange={(e) => setRetrainSector(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  flex: 1
                }}
              >
                <option value="ALL">All Portfolio Sectors (Combined)</option>
                {sectors.map((s, i) => (
                  <option key={i} value={s.sector}>{s.sector} ({s.project_count} projects)</option>
                ))}
              </select>

              <button
                id="trigger-retrain-btn"
                className="btn-secondary"
                onClick={handleLiveRetrain}
                disabled={isProcessing}
                style={{ padding: '8px 18px', borderColor: 'rgba(99, 102, 241, 0.4)' }}
              >
                <Cpu size={15} color="#818CF8" />
                <span>Retrain Live</span>
              </button>
            </div>
          </div>

          {/* Section 3: Baseline Reseeder */}
          <div className="glass-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  3. Restore MoSPI April 2026 Benchmark Portfolio (~1,981 projects)
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Resets the database with the official MoSPI distribution (₹37.13L Cr original / ₹42.78L Cr revised).
                </p>
              </div>
              <button
                id="reseed-benchmark-btn"
                className="btn-secondary"
                onClick={handleReseed}
                disabled={isProcessing}
                style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <RefreshCw size={14} />
                <span>Reseed Benchmark</span>
              </button>
            </div>
          </div>

          {/* Quality Audit Logs Trigger */}
          <div>
            <button
              onClick={fetchQualityLogs}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', width: '100%', justifyContent: 'center' }}
            >
              <span>View Data Quality & Anomaly Logs (FR-1.3)</span>
            </button>
            {qualityLogs.length > 0 && (
              <div style={{ marginTop: '10px', maxHeight: '140px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', fontSize: '0.72rem', border: '1px solid var(--border-subtle)' }}>
                {qualityLogs.map((l, i) => (
                  <div key={i} style={{ marginBottom: '6px', color: '#F87171' }}>
                    [{l.issue_type}] {l.project_id}: {l.description}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'var(--bg-secondary)'
        }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 18px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
