import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../api/client';
import {
  PhysioPodHardwareResponse,
  PhysioPodSessionData,
  ScreeningSession,
} from '../api/types';
import { Button } from '../components/common/Button';
import { Section } from '../components/common/Section';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { NavItem } from '../components/layout/Sidebar';
import {
  Radio,
  RotateCw,
  Save,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Filter,
  ShieldAlert,
  ExternalLink,
  Code,
  Check,
  Copy,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface PhysioPodDashboardPageProps {
  onNavigate?: (tab: NavItem, context?: any) => void;
}

export const PhysioPodDashboardPage: React.FC<PhysioPodDashboardPageProps> = ({ onNavigate }) => {
  const [endpointUrl, setEndpointUrl] = useState('http://192.168.4.1/api/session/latest');
  const [autoPoll, setAutoPoll] = useState(true);
  const [pollIntervalSec, setPollIntervalSec] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [pollDurationMs, setPollDurationMs] = useState<number | null>(null);
  const [response, setResponse] = useState<PhysioPodHardwareResponse | null>(null);
  const [baselineData, setBaselineData] = useState<PhysioPodSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Filters for trial log
  const [filterSide, setFilterSide] = useState<'ALL' | 'LEFT' | 'RIGHT'>('ALL');
  const [filterPod, setFilterPod] = useState<number | 'ALL'>('ALL');

  // Save to Screening Session Modal
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [screenings, setScreenings] = useState<ScreeningSession[]>([]);
  const [selectedScreeningId, setSelectedScreeningId] = useState<string>('');
  const [savingTest, setSavingTest] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Load clean initial zero baseline (no mock data)
  useEffect(() => {
    api.getPhysioPodBaseline()
      .then((res) => {
        setBaselineData(res.data);
      })
      .catch((err) => console.error('Error fetching baseline:', err));
  }, []);

  const fetchLivePodData = async (customUrl = endpointUrl) => {
    setLoading(true);
    setError(null);
    const startT = performance.now();
    try {
      const res = await api.getPhysioPodLatest(customUrl);
      setResponse(res);
      setLastPolledAt(new Date());
      setPollDurationMs(Math.round(performance.now() - startT));
      if (!res.connected && res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Could not communicate with Physio Pod service');
      setPollDurationMs(Math.round(performance.now() - startT));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePodData(endpointUrl);
  }, [endpointUrl]);

  useEffect(() => {
    if (autoPoll) {
      pollIntervalRef.current = setInterval(() => {
        fetchLivePodData(endpointUrl);
      }, pollIntervalSec * 1000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [autoPoll, endpointUrl, pollIntervalSec]);

  const openSaveModal = async () => {
    setSaveModalOpen(true);
    setSavedSuccessMessage(null);
    try {
      const list = await api.getScreenings();
      setScreenings(list);
      if (list.length > 0 && !selectedScreeningId) {
        setSelectedScreeningId(list[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load screenings for pod saving:', err);
    }
  };

  const handleConfirmSave = async () => {
    if (!selectedScreeningId || !activeSession) return;
    setSavingTest(true);
    try {
      const res = await api.savePhysioPodTest(selectedScreeningId, activeSession);
      setSavedSuccessMessage(
        `Real sensor test saved! Test ID: ${res.functional_test_id.slice(0, 8)}... (${res.duration_seconds}s recording duration)`
      );
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingTest(false);
    }
  };

  const copyRawPayload = () => {
    const raw = (response?.data as any)?._raw_hardware || response?.data || response;
    navigator.clipboard.writeText(JSON.stringify(raw, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const isLiveConnected = response?.connected === true && response?.source === 'esp32_hardware_live';

  // If live connected, display live session data; otherwise display clean zero baseline
  const activeSession: PhysioPodSessionData | undefined = isLiveConnected
    ? response?.data
    : baselineData || undefined;

  // Filtered trials
  const filteredTrials = useMemo(() => {
    if (!activeSession?.trials) return [];
    return activeSession.trials.filter((trial) => {
      if (filterSide !== 'ALL' && trial.side.toUpperCase() !== filterSide) return false;
      if (filterPod !== 'ALL' && trial.pod_id !== filterPod) return false;
      return true;
    });
  }, [activeSession?.trials, filterSide, filterPod]);

  const asymmetryPct = activeSession?.sides?.asymmetry?.asymmetry_index_pct ?? 0;
  const isElevatedAsymmetry = Math.abs(asymmetryPct) > 15;
  const hasRecordedTrials = (activeSession?.total_trials || 0) > 0;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner: Real Hardware Sensor Status */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: isLiveConnected
            ? '2px solid var(--tier1-border)'
            : '1px solid var(--border-default)',
          padding: '16px 20px',
          boxShadow: isLiveConnected ? '0 0 14px rgba(16, 185, 129, 0.18)' : 'var(--shadow-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: 'var(--radius-md)',
                  background: isLiveConnected ? 'var(--tier1-bg)' : 'var(--accent-primary-subtle)',
                  color: isLiveConnected ? 'var(--tier1-text)' : 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Radio size={18} strokeWidth={2.2} />
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Physio Pods (6x) Live Hardware Telemetry
              </h1>
              <ProvenanceBadge source="HARDWARE_STREAM" />
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Physical 6-pod motor reaction & latency sensor deck. Live wire data directly from ESP32.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button
              variant="primary"
              size="sm"
              icon={<Save size={14} />}
              onClick={openSaveModal}
              disabled={!isLiveConnected || !hasRecordedTrials}
              title={!isLiveConnected ? 'Connect hardware to save tests' : !hasRecordedTrials ? 'Perform trials before saving' : 'Save to Screening'}
            >
              Save to Screening
            </Button>
          </div>
        </div>

        {/* Real Hardware Connection Status Pill / Diagnostic */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: isLiveConnected ? 'var(--tier1-bg)' : 'var(--tier2-bg)',
            border: `1px solid ${isLiveConnected ? 'var(--tier1-border)' : 'var(--tier2-border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLiveConnected ? (
              <Wifi size={20} color="var(--tier1-text)" />
            ) : (
              <WifiOff size={20} color="var(--tier2-text)" />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isLiveConnected ? 'var(--tier1-text)' : 'var(--tier2-text)',
                    boxShadow: isLiveConnected ? '0 0 8px var(--tier1-text)' : 'none',
                    display: 'inline-block',
                  }}
                />
                <strong style={{ fontSize: '13px', color: isLiveConnected ? 'var(--tier1-text)' : 'var(--tier2-text)' }}>
                  {isLiveConnected
                    ? 'REAL PHYSIO POD SENSORS CONNECTED & RECEIVING LIVE DATA'
                    : 'AWAITING PHYSIO POD WI-FI CONNECTION (NO MOCK DATA)'}
                </strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-body)', marginTop: '3px' }}>
                {isLiveConnected
                  ? `Device ID: ${activeSession?.device_id || 'ESP32'} | Endpoint: ${response?.ip_endpoint} | Last Ping: ${pollDurationMs}ms | Trials: ${activeSession?.total_trials || 0}`
                  : `Please connect your computer to the ESP32 Wi-Fi network (e.g. 'PhysioPod_AP'). Probing target: ${endpointUrl}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCw size={13} className={loading ? 'spin' : ''} />}
              onClick={() => fetchLivePodData(endpointUrl)}
              disabled={loading}
            >
              {loading ? 'Probing...' : 'Check Sensor Connection'}
            </Button>
          </div>
        </div>

        {/* Target URL & Polling Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-default)',
            fontSize: '12.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 360px' }}>
            <label style={{ color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              ESP32 Target URL:
            </label>
            <input
              type="text"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              className="form-input"
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                padding: '5px 8px',
                flex: 1,
                minWidth: '220px',
              }}
              placeholder="http://192.168.4.1/api/session/latest"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEndpointUrl('http://192.168.4.1/api/session/latest')}
              title="Reset to default ESP32 SoftAP IP"
            >
              Default AP
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                userSelect: 'none',
                color: 'var(--text-body)',
              }}
            >
              <input
                type="checkbox"
                checked={autoPoll}
                onChange={(e) => setAutoPoll(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Live Auto-Poll</span>
            </label>

            <select
              className="form-input"
              style={{ fontSize: '11.5px', padding: '4px 6px' }}
              value={pollIntervalSec}
              onChange={(e) => setPollIntervalSec(Number(e.target.value))}
              disabled={!autoPoll}
            >
              <option value={1}>Every 1s (Fast Stream)</option>
              <option value={2}>Every 2s (Standard)</option>
              <option value={3}>Every 3s</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              icon={<Code size={13} />}
              onClick={() => setShowRawJson(!showRawJson)}
              title="View the exact wire JSON received from the ESP32"
            >
              {showRawJson ? 'Hide Wire JSON' : 'Inspect Wire JSON'}
            </Button>

            {lastPolledAt && (
              <span style={{ fontSize: '11px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                Polled: {lastPolledAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Collapsible Wire JSON Inspector */}
        {showRawJson && (
          <div
            style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              maxHeight: '260px',
              overflowY: 'auto',
              position: 'relative',
              border: '1px solid #1e293b',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live ESP32 Wire JSON (Direct Physical Sensor Output)
              </span>
              <button
                type="button"
                onClick={copyRawPayload}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copiedRaw ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                <span>{copiedRaw ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify((response?.data as any)?._raw_hardware || response?.data || response || {}, null, 2)}
            </pre>
          </div>
        )}

        {error && !isLiveConnected && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--tier3-bg)',
              border: '1px solid var(--tier3-border)',
              color: 'var(--tier3-text)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid (Directly Driven by Real Sensor Data) */}
      {activeSession && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
          }}
        >
          {/* Card 1: Total Trials */}
          <div className="clinical-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>
              Recorded Trials / Stimuli
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {activeSession.total_trials}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                ({activeSession.duration_sec.toFixed(1)}s recorded)
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Valid Hits:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {activeSession.sides.left.hits + activeSession.sides.right.hits}
              </strong>{' '}
              / Misses:{' '}
              <span style={{ color: 'var(--tier2-text)' }}>
                {activeSession.sides.left.misses + activeSession.sides.right.misses}
              </span>
            </div>
          </div>

          {/* Card 2: Left Mean Reaction Time */}
          <div className="clinical-card" style={{ padding: '14px 16px', borderLeft: '3px solid var(--accent-secondary)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>
              Left Leg Mean RT (Pods 1-3)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {activeSession.sides.left.avg_reaction_time_ms > 0
                ? `${Math.round(activeSession.sides.left.avg_reaction_time_ms)} ms`
                : '— ms'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Hit Rate:{' '}
              <strong style={{ color: activeSession.sides.left.hit_rate_pct > 0 ? 'var(--tier1-text)' : 'var(--text-secondary)' }}>
                {activeSession.sides.left.hit_rate_pct}%
              </strong>{' '}
              | Hits: {activeSession.sides.left.hits}
            </div>
          </div>

          {/* Card 3: Right Mean Reaction Time */}
          <div
            className="clinical-card"
            style={{
              padding: '14px 16px',
              borderLeft: `3px solid ${isElevatedAsymmetry ? 'var(--tier2-text)' : 'var(--accent-primary)'}`,
            }}
          >
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>
              Right Leg Mean RT (Pods 4-6)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {activeSession.sides.right.avg_reaction_time_ms > 0
                ? `${Math.round(activeSession.sides.right.avg_reaction_time_ms)} ms`
                : '— ms'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Hit Rate:{' '}
              <strong style={{ color: activeSession.sides.right.hit_rate_pct > 0 ? 'var(--tier1-text)' : 'var(--text-secondary)' }}>
                {activeSession.sides.right.hit_rate_pct}%
              </strong>{' '}
              | Hits: {activeSession.sides.right.hits}
            </div>
          </div>

          {/* Card 4: Asymmetry Index */}
          <div
            className="clinical-card"
            style={{
              padding: '14px 16px',
              background: isElevatedAsymmetry ? 'var(--tier2-bg)' : 'var(--bg-surface)',
              borderColor: isElevatedAsymmetry ? 'var(--tier2-border)' : 'var(--border-default)',
            }}
          >
            <div
              style={{
                fontSize: '11.5px',
                color: isElevatedAsymmetry ? 'var(--tier2-text)' : 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Bilateral Asymmetry Index
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: isElevatedAsymmetry ? 'var(--tier2-text)' : 'var(--text-primary)',
                marginTop: '4px',
              }}
            >
              {asymmetryPct > 0 ? `+${asymmetryPct.toFixed(1)}%` : asymmetryPct < 0 ? `${asymmetryPct.toFixed(1)}%` : '0.0%'}
            </div>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: isElevatedAsymmetry ? 'var(--tier2-text)' : 'var(--tier1-text)',
                marginTop: '4px',
              }}
            >
              {isElevatedAsymmetry
                ? `Deficit: ${activeSession.sides.asymmetry.slower_side} side slower (>15% threshold)`
                : hasRecordedTrials
                ? 'Symmetric bilateral response'
                : 'Awaiting sensor hits'}
            </div>
          </div>
        </div>
      )}

      {/* Bilateral Comparison Panel */}
      {activeSession && (
        <Section
          title="Bilateral Quadriceps & Kinetic Asymmetry Analysis"
          subtitle="Real-time reaction latency comparison calculated between left pods (1-3) and right pods (4-6)."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '20px',
              alignItems: 'center',
              padding: '12px 4px',
            }}
          >
            {/* Left Side Details */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                  LEFT LOWER EXTREMITY
                </span>
                <span className="clinical-badge" style={{ fontSize: '11px' }}>
                  Pods 1, 2, 3
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Mean Latency:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>
                    {activeSession.sides.left.avg_reaction_time_ms > 0
                      ? `${activeSession.sides.left.avg_reaction_time_ms.toFixed(1)} ms`
                      : '— ms'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Success / Hit Rate:</span>
                  <span style={{ color: activeSession.sides.left.hit_rate_pct > 0 ? 'var(--tier1-text)' : 'var(--text-secondary)', fontWeight: 600 }}>
                    {activeSession.sides.left.hits} / {activeSession.sides.left.hits + activeSession.sides.left.misses} (
                    {activeSession.sides.left.hit_rate_pct}%)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fastest Pod:</span>
                  <span>Pod {activeSession.sides.left.fastest_pod || 1}</span>
                </div>
              </div>
            </div>

            {/* Asymmetry Gauge / Delta Callout */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '10px 16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Delta
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: isElevatedAsymmetry ? 'var(--tier2-text)' : 'var(--text-primary)',
                }}
              >
                {Math.abs(activeSession.sides.asymmetry.reaction_time_diff_ms).toFixed(0)} ms
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isElevatedAsymmetry ? 'var(--tier2-text)' : 'var(--tier1-text)',
                  marginTop: '2px',
                }}
              >
                {asymmetryPct.toFixed(1)}% asymmetry
              </div>
              <ArrowRight
                size={18}
                color={isElevatedAsymmetry ? 'var(--tier2-text)' : 'var(--text-secondary)'}
                style={{
                  marginTop: '8px',
                  transform: activeSession.sides.asymmetry.slower_side === 'RIGHT' ? 'rotate(0deg)' : 'rotate(180deg)',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                {activeSession.sides.asymmetry.slower_side} deficit
              </span>
            </div>

            {/* Right Side Details */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isElevatedAsymmetry ? 'var(--tier2-text)' : 'var(--accent-primary)',
                  }}
                >
                  RIGHT LOWER EXTREMITY
                </span>
                <span className="clinical-badge" style={{ fontSize: '11px' }}>
                  Pods 4, 5, 6
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Mean Latency:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>
                    {activeSession.sides.right.avg_reaction_time_ms > 0
                      ? `${activeSession.sides.right.avg_reaction_time_ms.toFixed(1)} ms`
                      : '— ms'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Success / Hit Rate:</span>
                  <span style={{ color: activeSession.sides.right.hit_rate_pct > 0 ? 'var(--tier1-text)' : 'var(--text-secondary)', fontWeight: 600 }}>
                    {activeSession.sides.right.hits} / {activeSession.sides.right.hits + activeSession.sides.right.misses} (
                    {activeSession.sides.right.hit_rate_pct}%)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fastest Pod:</span>
                  <span>Pod {activeSession.sides.right.fastest_pod || 4}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Interpretation Alert */}
          {activeSession.sides.asymmetry.clinical_note && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: isElevatedAsymmetry ? 'var(--tier2-bg)' : 'var(--bg-subtle)',
                border: `1px solid ${isElevatedAsymmetry ? 'var(--tier2-border)' : 'var(--border-default)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12.5px',
                color: isElevatedAsymmetry ? 'var(--tier2-text)' : 'var(--text-body)',
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Clinical Assessment: </strong>
                {activeSession.sides.asymmetry.clinical_note}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Six-Pod Hardware Table & Latency Visualization */}
      {activeSession && (
        <Section
          title="6-Pod Hardware Performance Matrix"
          subtitle="Real-time latency and hit status recorded per physical sensor unit."
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="clinical-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Pod Unit</th>
                  <th>Anatomical Side</th>
                  <th>Status</th>
                  <th>Valid Hits</th>
                  <th>Misses</th>
                  <th>Hit Rate</th>
                  <th>Mean Reaction</th>
                  <th>Latency Band</th>
                  <th>Min - Max Range</th>
                </tr>
              </thead>
              <tbody>
                {activeSession.pods.map((pod) => {
                  const isRight = pod.side.toUpperCase() === 'RIGHT';
                  const rt = pod.avg_reaction_time_ms;
                  let bandColor = 'var(--text-secondary)';
                  let bandLabel = 'Standby (Awaiting Hit)';
                  if (rt > 0) {
                    if (rt > 420) {
                      bandColor = 'var(--tier3-text)';
                      bandLabel = 'Markedly Delayed (>420ms)';
                    } else if (rt > 350) {
                      bandColor = 'var(--tier2-text)';
                      bandLabel = 'Mild Delay (350-420ms)';
                    } else {
                      bandColor = 'var(--tier1-text)';
                      bandLabel = 'Optimal (<350ms)';
                    }
                  }

                  return (
                    <tr key={pod.pod_id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              background: isRight ? 'rgba(15, 118, 110, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                              color: isRight ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            {pod.pod_id}
                          </span>
                          <span>{pod.name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: isRight ? 'var(--accent-primary-subtle)' : 'var(--accent-secondary-subtle)',
                            color: isRight ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                          }}
                        >
                          {pod.side}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            color: pod.status === 'ONLINE' ? 'var(--tier1-text)' : 'var(--text-secondary)',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: pod.status === 'ONLINE' ? 'var(--tier1-text)' : 'var(--text-faint)',
                            }}
                          />
                          {pod.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pod.hits}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: pod.misses > 0 ? 'var(--tier2-text)' : 'var(--text-secondary)' }}>
                        {pod.misses}
                      </td>
                      <td style={{ fontWeight: 600, color: pod.hit_rate_pct > 0 ? 'var(--tier1-text)' : 'var(--text-secondary)' }}>
                        {pod.hit_rate_pct}%
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px' }}>
                        {pod.avg_reaction_time_ms > 0 ? `${pod.avg_reaction_time_ms.toFixed(1)} ms` : '—'}
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: bandColor }}>
                          {bandLabel}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {pod.avg_reaction_time_ms > 0
                          ? `${pod.min_reaction_time_ms} - ${pod.max_reaction_time_ms} ms`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Visual Latency Bar Chart */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Latency Profile Across 6 Pods (Target Baseline: 350 ms)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
              {activeSession.pods.map((pod) => {
                const rt = pod.avg_reaction_time_ms;
                const isRight = pod.side.toUpperCase() === 'RIGHT';
                const heightPct = rt > 0 ? Math.min(100, Math.max(15, (rt / 550) * 100)) : 0;
                const isOverThreshold = rt > 400;

                return (
                  <div
                    key={pod.pod_id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'var(--bg-subtle)',
                      padding: '10px 6px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Pod {pod.pod_id}
                    </div>
                    <div style={{ fontSize: '10px', color: isRight ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>
                      {pod.side}
                    </div>
                    {/* Bar visualization */}
                    <div
                      style={{
                        height: '90px',
                        width: '24px',
                        background: 'var(--bg-surface)',
                        borderRadius: '4px',
                        margin: '8px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        overflow: 'hidden',
                        border: '1px solid var(--border-default)',
                        position: 'relative',
                      }}
                    >
                      {/* Target 350ms reference line */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `${(350 / 550) * 100}%`,
                          left: 0,
                          right: 0,
                          height: '1px',
                          borderTop: '1px dashed #94a3b8',
                          zIndex: 2,
                        }}
                      />
                      <div
                        style={{
                          height: `${heightPct}%`,
                          width: '100%',
                          background: isOverThreshold
                            ? 'var(--tier2-text)'
                            : isRight
                            ? 'var(--accent-primary)'
                            : 'var(--accent-secondary)',
                          transition: 'height 300ms ease',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: rt > 0 ? (isOverThreshold ? 'var(--tier2-text)' : 'var(--text-primary)') : 'var(--text-faint)',
                      }}
                    >
                      {rt > 0 ? `${Math.round(rt)} ms` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* Trial Event Log */}
      {activeSession && (
        <Section
          title={`Sequential Trial Log (${filteredTrials.length} trials recorded)`}
          subtitle="Real-time trial sequence received from the Physio Pod hardware."
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} color="var(--text-secondary)" />
              <select
                className="form-input"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                value={filterSide}
                onChange={(e: any) => setFilterSide(e.target.value)}
              >
                <option value="ALL">All Sides</option>
                <option value="LEFT">Left Only (Pods 1-3)</option>
                <option value="RIGHT">Right Only (Pods 4-6)</option>
              </select>
              <select
                className="form-input"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                value={filterPod}
                onChange={(e: any) => setFilterPod(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              >
                <option value="ALL">All Pods</option>
                <option value="1">Pod 1</option>
                <option value="2">Pod 2</option>
                <option value="3">Pod 3</option>
                <option value="4">Pod 4</option>
                <option value="5">Pod 5</option>
                <option value="6">Pod 6</option>
              </select>
            </div>
          }
        >
          {filteredTrials.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No trial events recorded yet. Perform touches on the Physio Pods to record motor latency.
            </div>
          ) : (
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              <table className="clinical-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Trial #</th>
                    <th>Time Offset</th>
                    <th>Target Pod</th>
                    <th>Extremity Side</th>
                    <th>Stimulus</th>
                    <th>Reaction Latency</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrials.map((trial) => {
                    const isHit = trial.result === 'HIT';
                    const isRight = trial.side.toUpperCase() === 'RIGHT';

                    return (
                      <tr key={trial.trial_num}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          #{trial.trial_num}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {(trial.time_offset_ms / 1000).toFixed(2)}s
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>Pod {trial.pod_id}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isRight ? 'var(--accent-primary-subtle)' : 'var(--accent-secondary-subtle)',
                              color: isRight ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                            }}
                          >
                            {trial.side}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: trial.target_color === 'RED' ? '#ef4444' : trial.target_color === 'BLUE' ? '#3b82f6' : '#22c55e',
                              }}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {trial.target_color || 'Standard'}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {trial.reaction_time_ms} ms
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isHit ? 'var(--tier1-bg)' : 'var(--tier2-bg)',
                              color: isHit ? 'var(--tier1-text)' : 'var(--tier2-text)',
                              border: `1px solid ${isHit ? 'var(--tier1-border)' : 'var(--tier2-border)'}`,
                            }}
                          >
                            {trial.result}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* Save Test to Screening Session Modal */}
      {saveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Attach Real Physio Pod Test to Patient Screening
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Persists the live physical 6-pod session into SQLite as a verified Functional Test with provenance tag{' '}
                <ProvenanceBadge source="HARDWARE_STREAM" />.
              </p>
            </div>

            {savedSuccessMessage ? (
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--tier1-bg)',
                  border: '1px solid var(--tier1-border)',
                  color: 'var(--tier1-text)',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>{savedSuccessMessage}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSaveModalOpen(false);
                      setSavedSuccessMessage(null);
                    }}
                  >
                    Done
                  </Button>
                  {onNavigate && selectedScreeningId && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ExternalLink size={14} />}
                      onClick={() => {
                        setSaveModalOpen(false);
                        onNavigate('screenings', { sessionId: selectedScreeningId });
                      }}
                    >
                      View Screening Details
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-body)' }}>
                    Select Screening Session:
                  </label>
                  {screenings.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', padding: '8px 0' }}>
                      No screening sessions found. Please create a new screening session first.
                    </div>
                  ) : (
                    <select
                      className="form-input"
                      value={selectedScreeningId}
                      onChange={(e) => setSelectedScreeningId(e.target.value)}
                      style={{ fontSize: '13px', padding: '8px 10px' }}
                    >
                      {screenings.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          Session #{sc.id.slice(0, 8)} — Patient {sc.patient_id.slice(0, 8)} (
                          {sc.screening_status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div>
                    <strong>Test Type:</strong> PHYSIO_POD (Physical Sensor Deck)
                  </div>
                  <div>
                    <strong>Recorded Duration:</strong> {activeSession?.duration_sec.toFixed(1)} seconds
                  </div>
                  <div>
                    <strong>Trials Count:</strong> {activeSession?.total_trials} stimuli
                  </div>
                  <div>
                    <strong>Bilateral Asymmetry:</strong> {asymmetryPct.toFixed(1)}% (
                    {activeSession?.sides?.asymmetry?.slower_side} deficit)
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSaveModalOpen(false)}
                    disabled={savingTest}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmSave}
                    disabled={savingTest || screenings.length === 0}
                  >
                    {savingTest ? 'Saving to Database...' : 'Confirm & Save to Record'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
