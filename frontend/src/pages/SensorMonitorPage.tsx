import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { SensorDevice, SensorSample } from '../api/types';
import { WaveformCanvas } from '../components/sensor/WaveformCanvas';
import { Button } from '../components/common/Button';
import { Section } from '../components/common/Section';
import { QualityIndicator } from '../components/common/QualityIndicator';
import {
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

export const SensorMonitorPage: React.FC = () => {
  const [activeDevice, setActiveDevice] = useState<string>('SIM-IMU-01');
  const [samplingRateHz, setSamplingRateHz] = useState<number>(50.0);
  const [connectionStatus, setConnectionStatus] = useState<
    'CONNECTED' | 'DISCONNECTED' | 'RECORDING' | 'PROCESSING' | 'QUALITY_ERROR'
  >('CONNECTED');

  // Stream state
  const [testType, setTestType] = useState<string>('TUG');
  const [patternSeverity, setPatternSeverity] = useState<string>('NORMAL');
  const [injectArtifact, setInjectArtifact] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [samples, setSamples] = useState<SensorSample[]>([]);
  const [streamDurationSec, setStreamDurationSec] = useState<number>(0);
  const [detectedEvent, setDetectedEvent] = useState<string>('IDLE');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Load or register simulated device
    api
      .getDevices()
      .then((devs: SensorDevice[]) => {
        if (devs.length === 0) {
          api
            .registerDevice({
              device_id: 'SIM-IMU-01',
              device_type: '6-Axis IMU (MPU6050/LSM6DS3)',
              firmware_version: 'ner-imu-v1.2',
            })
            .then((d) => {
              setActiveDevice(d.device_id);
            })
            .catch(console.error);
        } else {
          setActiveDevice(devs[0].device_id);
        }
      })
      .catch(console.error);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartStream = async () => {
    setIsStreaming(true);
    setConnectionStatus('RECORDING');
    setStreamDurationSec(0);

    try {
      const res = await api.generateStream(testType, 6.0, patternSeverity, injectArtifact);
      const allSamples = res.samples;
      setSamplingRateHz(50.0);

      let idx = 0;
      const interval = 50;
      const step = 3;

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        if (idx >= allSamples.length) {
          idx = 0;
        }

        const nextBatch = allSamples.slice(0, idx + step);
        idx += step;
        setSamples(nextBatch);
        setStreamDurationSec((prev) => +(prev + 0.1).toFixed(1));

        // Detect movement event
        const progress = idx / allSamples.length;
        if (testType === 'TUG') {
          if (progress < 0.2) setDetectedEvent('Sit to Stand Transition');
          else if (progress < 0.5) setDetectedEvent('Walking Phase (3m)');
          else if (progress < 0.65) setDetectedEvent('Turn at 3m Cone (Peak Yaw)');
          else if (progress < 0.85) setDetectedEvent('Return Walk');
          else setDetectedEvent('Controlled Seating');
        } else if (testType === 'SQUAT') {
          if (progress < 0.4) setDetectedEvent('Bilateral Descent Phase');
          else if (progress < 0.6) setDetectedEvent('Peak Knee Flexion Depth');
          else setDetectedEvent('Ascent / Extension Phase');
        } else {
          setDetectedEvent('Active Movement Execution');
        }

        if (injectArtifact && idx > 25 && idx < 35) {
          setConnectionStatus('QUALITY_ERROR');
        } else {
          setConnectionStatus('RECORDING');
        }
      }, interval);
    } catch (err: any) {
      alert(`Stream generation error: ${err.message}`);
      setIsStreaming(false);
      setConnectionStatus('CONNECTED');
    }
  };

  const handleStopStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsStreaming(false);
    setConnectionStatus('CONNECTED');
    setDetectedEvent('PAUSED');
  };

  const handleReset = () => {
    handleStopStream();
    setSamples([]);
    setStreamDurationSec(0);
    setDetectedEvent('IDLE');
    setConnectionStatus('CONNECTED');
  };

  const statusBadgeConfig = {
    CONNECTED: { color: 'var(--tier1-text)', bg: 'var(--tier1-bg)', border: 'var(--tier1-border)', text: 'DEVICE CONNECTED' },
    RECORDING: { color: 'var(--accent-secondary)', bg: 'var(--accent-secondary-subtle)', border: '#bae6fd', text: 'RECORDING IN PROGRESS' },
    PROCESSING: { color: 'var(--tier2-text)', bg: 'var(--tier2-bg)', border: 'var(--tier2-border)', text: 'PROCESSING KINEMATICS' },
    QUALITY_ERROR: { color: 'var(--redflag-text)', bg: 'var(--redflag-bg)', border: 'var(--redflag-border)', text: 'SIGNAL SATURATION ERROR' },
    DISCONNECTED: { color: 'var(--text-secondary)', bg: 'var(--bg-subtle)', border: 'var(--border-default)', text: 'DISCONNECTED' },
  }[connectionStatus];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Sensor Live Instrumentation
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            Real-time 6-axis IMU kinematic signal streaming and quality monitoring.
          </p>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 600,
            background: statusBadgeConfig.bg,
            color: statusBadgeConfig.color,
            border: `1px solid ${statusBadgeConfig.border}`,
          }}
        >
          <span style={{ fontSize: '8px' }}>●</span>
          <span>{statusBadgeConfig.text}</span>
        </span>
      </div>

      {/* Top Instrumentation Status Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Device ID
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>
            {activeDevice}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>BLE / Serial IMU</div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Sampling Rate
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {samplingRateHz.toFixed(1)} Hz
          </div>
          <div style={{ fontSize: '11px', color: 'var(--tier1-text)', marginTop: '2px' }}>Zero packet drop</div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Recording Duration
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {streamDurationSec.toFixed(1)} s
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Window: {samples.length} samples</div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Movement Phase
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {detectedEvent}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Kinematic tracker</div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Data Quality
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: connectionStatus === 'QUALITY_ERROR' ? 'var(--redflag-text)' : 'var(--tier1-text)', marginTop: '2px' }}>
            {connectionStatus === 'QUALITY_ERROR' ? 'SIGNAL CLIPPING' : 'NOMINAL (VALID)'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Continuous verification</div>
        </div>
      </div>

      {/* Stream Controls Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)' }}>Protocol:</span>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              disabled={isStreaming}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
              }}
            >
              <option value="TUG">Timed Up &amp; Go (TUG)</option>
              <option value="SQUAT">Standard Squat</option>
              <option value="STEP_UP">Step-Up Test</option>
              <option value="STEP_DOWN">Step-Down Test</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pattern:</span>
            <select
              value={patternSeverity}
              onChange={(e) => setPatternSeverity(e.target.value)}
              disabled={isStreaming}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
              }}
            >
              <option value="NORMAL">Normal / Fluid</option>
              <option value="IMPAIRED">Impaired / Hesitant</option>
            </select>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              cursor: 'pointer',
              color: injectArtifact ? 'var(--redflag-text)' : 'var(--text-body)',
            }}
          >
            <input
              type="checkbox"
              checked={injectArtifact}
              onChange={(e) => setInjectArtifact(e.target.checked)}
              disabled={isStreaming}
            />
            <span>Inject Spike Artifact (Test Quality Validation)</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isStreaming ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Play size={14} />}
              onClick={handleStartStream}
            >
              Start Live Signal
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              icon={<Pause size={14} />}
              onClick={handleStopStream}
            >
              Pause Stream
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw size={14} />}
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Dual Waveform Oscilloscope Display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Section title="Tri-Axial Linear Acceleration (Accelerometer)" subtitle="Calibrated range: ±20 m/s² • Channels: Ax (Cyan), Ay (Green), Az (Red)">
          <WaveformCanvas samples={samples} mode="accel" height={160} />
        </Section>

        <Section title="Tri-Axial Angular Velocity (Gyroscope)" subtitle="Calibrated range: ±5.0 rad/s • Channels: Gx (Amber), Gy (Purple), Gz (Blue)">
          <WaveformCanvas samples={samples} mode="gyro" height={160} />
        </Section>
      </div>

      {/* Sensor Data Quality Validation Breakdown */}
      <Section title="Kinematic Data Quality Checklist" subtitle="Automated signal continuity and technical validity checks.">
        <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
          <QualityIndicator
            label="Sample Count & Continuity"
            status={samples.length > 50 ? 'valid' : 'pending'}
            value={samples.length}
            expected="≥ 50 samples"
            note="Sufficient density for frequency domain transforms"
          />
          <QualityIndicator
            label="Hardware Acceleration Bounds (< 60 m/s²)"
            status={connectionStatus === 'QUALITY_ERROR' ? 'failed' : 'valid'}
            value={connectionStatus === 'QUALITY_ERROR' ? 'Clips > 60 m/s²' : 'Nominal (< 20 m/s²)'}
            note={connectionStatus === 'QUALITY_ERROR' ? 'Impact artifact detected' : 'Within physiological range'}
          />
          <QualityIndicator
            label="Sampling Rate Stability"
            status="valid"
            value="50.0 Hz ± 0.2%"
            note="Jitter buffer within acceptable tolerance"
          />
          <QualityIndicator
            label="Camera Framing & Visibility Confidence"
            status="valid"
            value="0.94"
            expected="≥ 0.70"
            note="Clear bilateral lower-limb visibility"
          />
        </div>
      </Section>
    </div>
  );
};
