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
  Sparkles,
  ExternalLink,
  Code,
  Check,
  Copy,
  Zap,
} from 'lucide-react';

interface PhysioPodDashboardPageProps {
  onNavigate?: (tab: NavItem, context?: any) => void;
}

export const PhysioPodDashboardPage: React.FC<PhysioPodDashboardPageProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<'LIVE' | 'DEMO'>('LIVE');
  const [endpointUrl, setEndpointUrl] = useState('http://192.168.4.1/api/session/latest');
  const [autoPoll, setAutoPoll] = useState(true);
  const [pollIntervalSec, setPollIntervalSec] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [pollDurationMs, setPollDurationMs] = useState<number | null>(null);
  const [response, setResponse] = useState<PhysioPodHardwareResponse | null>(null);
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

  const fetchPodData = async (currentMode = mode, customUrl = endpointUrl) => {
    setLoading(true);
    setError(null);
    const startT = performance.now();
    try {
      // If mode is LIVE, allowFallback is false so we strictly show real hardware or tell the user to connect
      const isDemo = currentMode === 'DEMO';
      const allowFallback = isDemo; // strictly false when in live mode!
      const res = await api.getPhysioPodLatest(customUrl, isDemo, allowFallback);
      setResponse(res);
      setLastPolledAt(new Date());
      setPollDurationMs(Math.round(performance.now() - startT));
    } catch (err: any) {
      setError(err.message || 'Error communicating with Physio Pod service');
      setPollDurationMs(Math.round(performance.now() - startT));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodData(mode, endpointUrl);
  }, [mode]);

  useEffect(() => {
    if (autoPoll) {
      pollIntervalRef.current = setInterval(() => {
        fetchPodData(mode, endpointUrl);
      }, pollIntervalSec * 1000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [autoPoll, mode, endpointUrl, pollIntervalSec]);

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
    if (!selectedScreeningId || !sessionData) return;
    setSavingTest(true);
    try {
      const res = await api.savePhysioPodTest(selectedScreeningId, sessionData);
      setSavedSuccessMessage(
        `Session test saved successfully! ID: ${res.functional_test_id.slice(0, 8)}... (${res.duration_seconds}s recording duration)`
      );
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingTest(false);
    }
  };

  const copyRawPayload = () => {
    const raw = (response?.data as any)?._raw_hardware || response?.data;
    navigator.clipboard.writeText(JSON.stringify(raw, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const isLiveConnected = response?.source === 'esp32_hardware_live' && response?.connected === true;
  const isAwaitingLive = mode === 'LIVE' && !isLiveConnected;
  const sessionData: PhysioPodSessionData | undefined = response?.data;

  // Filtered trials
  const filteredTrials = useMemo(() => {
    if (!sessionData?.trials) return [];
    return sessionData.trials.filter((trial) => {
      if (filterSide !== 'ALL' && trial.side.toUpperCase() !== filterSide) return false;
      if (filterPod !== 'ALL' && trial.pod_id !== filterPod) return false;
      return true;
    });
  }, [sessionData?.trials, filterSide, filterPod]);

  const asymmetryPct = sessionData?.sides?.asymmetry?.asymmetry_index_pct ?? 0;
  const isElevatedAsymmetry = Math.abs(asymmetryPct) > 15;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner: Mode & Hardware Link Status */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: isLiveConnected
            ? '2px solid var(--tier1-border)'
            : '1px solid var(--border-default)',
          padding: '16px 20px',
          boxShadow: isLiveConnected ? '0 0 12px rgba(16, 185, 129, 0.15)' : 'var(--shadow-subtle)',
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
                Physio Pods (6x) Hardware Telemetry Deck
              </h1>
              <ProvenanceBadge source="HARDWARE_STREAM" />
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Synchronized 6-pod bilateral motor reaction & latency telemetry deck (Left: Pods 1-3 | Right: Pods 4-6).
            </p>
          </div>

          {/* Mode Switcher Pills & Save Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Mode Toggle Button Group */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--bg-subtle)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <button
                type="button"
                onClick={() => setMode('LIVE')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: mode === 'LIVE' ? 600 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === 'LIVE' ? 'var(--accent-primary)' : 'transparent',
                  color: mode === 'LIVE' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                }}
              >
                <Zap size={13} />
                Live Hardware
              </button>

              <button
                type="button"
                onClick={() => setMode('DEMO')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: mode === 'DEMO' ? 600 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === 'DEMO' ? 'var(--accent-secondary)' : 'transparent',
                  color: mode === 'DEMO' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                }}
              >
                <Sparkles size={13} />
                Demo Dataset
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Save size={14} />}
              onClick={openSaveModal}
              disabled={!sessionData}
            >
              Save to Screening
            </Button>
          </div>
        </div>

        {/* Dynamic Hardware Connection Alert Status Banner */}
        {mode === 'LIVE' && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: isLiveConnected ? 'var(--tier1-bg)' : 'var(--tier2-bg)',
              border: `1px solid ${isLiveConnected ? 'var(--tier1-border)' : 'var(--tier2-border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isLiveConnected ? 'var(--tier1-text)' : 'var(--tier2-text)',
                  boxShadow: isLiveConnected ? '0 0 8px var(--tier1-text)' : 'none',
                  display: 'inline-block',
                }}
              />
              <div>
                <strong style={{ fontSize: '13px', color: isLiveConnected ? 'var(--tier1-text)' : 'var(--tier2-text)' }}>
                  {isLiveConnected
                    ? 'REAL ESP32 HARDWARE CONNECTED — STREAMING LIVE PHYSICAL POD DATA'
                    : 'AWAITING ESP32 WI-FI CONNECTION (CONNECT TO PHYSIOPOD AP)'}
                </strong>
                <div style={{ fontSize: '11.5px', color: 'var(--text-body)', marginTop: '2px' }}>
                  {isLiveConnected
                    ? `Device: ${sessionData?.device_id || 'ESP32'} | Endpoint: ${response?.ip_endpoint} | Response time: ${pollDurationMs}ms`
                    : `Please connect your computer to the ESP32 Wi-Fi network. Auto-probing: ${endpointUrl}`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCw size={13} className={loading ? 'spin' : ''} />}
                onClick={() => fetchPodData(mode, endpointUrl)}
                disabled={loading}
              >
                {loading ? 'Probing...' : 'Probe Hardware Now'}
              </Button>
            </div>
          </div>
        )}

        {/* Hardware Endpoint & Auto-Poll Controls Bar */}
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
              <span>Auto-Poll</span>
            </label>

            <select
              className="form-input"
              style={{ fontSize: '11.5px', padding: '4px 6px' }}
              value={pollIntervalSec}
              onChange={(e) => setPollIntervalSec(Number(e.target.value))}
              disabled={!autoPoll}
            >
              <option value={1}>Every 1s (Ultra Fast)</option>
              <option value={2}>Every 2s (Recommended)</option>
              <option value={3}>Every 3s</option>
              <option value={5}>Every 5s</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              icon={<Code size={13} />}
              onClick={() => setShowRawJson(!showRawJson)}
              title="View the raw unparsed JSON payload from ESP32"
            >
              {showRawJson ? 'Hide Raw JSON' : 'Inspect Raw JSON'}
            </Button>

            {lastPolledAt && (
              <span style={{ fontSize: '11px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                Refreshed: {lastPolledAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Collapsible Raw JSON Inspector */}
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
                Raw ESP32 Hardware Payload (Actual Wire Data)
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
              {JSON.stringify((response?.data as any)?._raw_hardware || response?.data || response, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '8px 12px',
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
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* When waiting for live hardware connection */}
      {isAwaitingLive && !sessionData && (
        <div
          className="clinical-card"
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--tier2-bg)',
              color: 'var(--tier2-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={24} className="spin" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Listening for Physio Pod ESP32 Hardware...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', marginTop: '6px' }}>
              Connect your computer to the Wi-Fi network emitted by your Physio Pod (e.g. <code>PhysioPod_AP</code>).
              Once connected, live hardware telemetry will appear here automatically.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <Button
              variant="primary"
              size="sm"
              icon={<RotateCw size={13} className={loading ? 'spin' : ''} />}
              onClick={() => fetchPodData('LIVE', endpointUrl)}
              disabled={loading}
            >
              {loading ? 'Probing ESP32...' : 'Retry Connection'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles size={13} />}
              onClick={() => setMode('DEMO')}
            >
              Switch to Demo Dataset
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      {sessionData && (
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
              Total Trials / Stimuli
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {sessionData.total_trials}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                ({sessionData.duration_sec}s test)
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Valid Hits: <strong style={{ color: 'var(--text-primary)' }}>
                {(sessionData.sides.left.hits + sessionData.sides.right.hits)}
              </strong>{' '}
              / Misses:{' '}
              <span style={{ color: 'var(--tier2-text)' }}>
                {(sessionData.sides.left.misses + sessionData.sides.right.misses)}
              </span>
            </div>
          </div>

          {/* Card 2: Left Mean Reaction Time */}
          <div className="clinical-card" style={{ padding: '14px 16px', borderLeft: '3px solid var(--accent-secondary)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>
              Left Leg Mean RT (Pods 1-3)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {Math.round(sessionData.sides.left.avg_reaction_time_ms)}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>ms</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Hit Rate: <strong style={{ color: 'var(--tier1-text)' }}>{sessionData.sides.left.hit_rate_pct}%</strong> | Range:{' '}
              {sessionData.sides.left.min_reaction_time_ms}-{sessionData.sides.left.max_reaction_time_ms}ms
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
              {Math.round(sessionData.sides.right.avg_reaction_time_ms)}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>ms</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Hit Rate: <strong style={{ color: 'var(--tier1-text)' }}>{sessionData.sides.right.hit_rate_pct}%</strong> | Range:{' '}
              {sessionData.sides.right.min_reaction_time_ms}-{sessionData.sides.right.max_reaction_time_ms}ms
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
              {asymmetryPct > 0 ? `+${asymmetryPct.toFixed(1)}%` : `${asymmetryPct.toFixed(1)}%`}
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
                ? `Deficit: ${sessionData.sides.asymmetry.slower_side} side slower (>15% threshold)`
                : 'Symmetric bilateral response (within normal variance)'}
            </div>
          </div>
        </div>
      )}

      {/* Bilateral Comparison Panel */}
      {sessionData && (
        <Section
          title="Bilateral Quadriceps & Kinetic Asymmetry Analysis"
          subtitle="Direct comparison between left (Pods 1-3) and right (Pods 4-6) motor reaction and proprioceptive latency."
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
                    {sessionData.sides.left.avg_reaction_time_ms.toFixed(1)} ms
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Success / Hit Rate:</span>
                  <span style={{ color: 'var(--tier1-text)', fontWeight: 600 }}>
                    {sessionData.sides.left.hits} / {sessionData.sides.left.hits + sessionData.sides.left.misses} (
                    {sessionData.sides.left.hit_rate_pct}%)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fastest Pod:</span>
                  <span>Pod {sessionData.sides.left.fastest_pod || 1}</span>
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
                {Math.abs(sessionData.sides.asymmetry.reaction_time_diff_ms).toFixed(0)} ms
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
                  transform: sessionData.sides.asymmetry.slower_side === 'RIGHT' ? 'rotate(0deg)' : 'rotate(180deg)',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                {sessionData.sides.asymmetry.slower_side} deficit
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
                    {sessionData.sides.right.avg_reaction_time_ms.toFixed(1)} ms
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Success / Hit Rate:</span>
                  <span style={{ color: 'var(--tier1-text)', fontWeight: 600 }}>
                    {sessionData.sides.right.hits} / {sessionData.sides.right.hits + sessionData.sides.right.misses} (
                    {sessionData.sides.right.hit_rate_pct}%)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fastest Pod:</span>
                  <span>Pod {sessionData.sides.right.fastest_pod || 4}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Interpretation Alert */}
          {sessionData.sides.asymmetry.clinical_note && (
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
                {sessionData.sides.asymmetry.clinical_note}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Six-Pod Hardware Table & Latency Visualization */}
      {sessionData && (
        <Section
          title="6-Pod Hardware Performance Matrix"
          subtitle="Individual device sensor calibration, latency, and success rates."
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
                {sessionData.pods.map((pod) => {
                  const isRight = pod.side.toUpperCase() === 'RIGHT';
                  const rt = pod.avg_reaction_time_ms;
                  let bandColor = 'var(--tier1-text)';
                  let bandLabel = 'Optimal (<350ms)';
                  if (rt > 420) {
                    bandColor = 'var(--tier3-text)';
                    bandLabel = 'Markedly Delayed (>420ms)';
                  } else if (rt > 350) {
                    bandColor = 'var(--tier2-text)';
                    bandLabel = 'Mild Delay (350-420ms)';
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
                      <td style={{ fontWeight: 600, color: 'var(--tier1-text)' }}>{pod.hit_rate_pct}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px' }}>
                        {pod.avg_reaction_time_ms.toFixed(1)} ms
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: bandColor }}>
                          {bandLabel}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {pod.min_reaction_time_ms} - {pod.max_reaction_time_ms} ms
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
              Latency Profile Across 6 Pods (Reference Target: 350 ms)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
              {sessionData.pods.map((pod) => {
                const rt = pod.avg_reaction_time_ms;
                const isRight = pod.side.toUpperCase() === 'RIGHT';
                // normalize height up to 550ms
                const heightPct = Math.min(100, Math.max(20, (rt / 550) * 100));
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
                          transition: 'height 400ms ease',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: isOverThreshold ? 'var(--tier2-text)' : 'var(--text-primary)',
                      }}
                    >
                      {Math.round(rt)} ms
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* Trial Event Log */}
      {sessionData && (
        <Section
          title={`Detailed Trial Stream (${filteredTrials.length} of ${sessionData.trials.length} trials)`}
          subtitle="Sequential event sequence recorded during the Physio Pod motor execution protocol."
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
                              background: trial.target_color || '#3b82f6',
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
                Attach Physio Pod Test to Patient Screening
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Persists the 6-pod session into SQLite as a verified Functional Test with provenance tag{' '}
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
                    <strong>Test Type:</strong> PHYSIO_POD (6x Reaction Latency Deck)
                  </div>
                  <div>
                    <strong>Recorded Duration:</strong> {sessionData?.duration_sec} seconds
                  </div>
                  <div>
                    <strong>Trials Count:</strong> {sessionData?.total_trials} stimuli
                  </div>
                  <div>
                    <strong>Bilateral Asymmetry:</strong> {asymmetryPct.toFixed(1)}% (
                    {sessionData?.sides?.asymmetry?.slower_side} deficit)
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
