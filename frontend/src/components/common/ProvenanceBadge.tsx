import React from 'react';
import { User, Eye, Activity, Sliders, AlertTriangle } from 'lucide-react';

export type ProvenanceSource =
  | 'PATIENT_REPORTED'
  | 'patient-reported'
  | 'CLINICIAN_OBSERVED'
  | 'clinician-observed'
  | 'SENSOR_DERIVED'
  | 'sensor-derived'
  | 'AUTOMATED_MARKER'
  | 'automated-marker'
  | 'CLINICAL_ESCALATION'
  | 'clinical-escalation';

export type ValidationLevel = 'VALIDATED' | 'RESEARCH_DERIVED' | 'PROVISIONAL';

interface ProvenanceBadgeProps {
  source: ProvenanceSource | string;
  validationLevel?: ValidationLevel | string;
  confidence?: number; // 0 to 1 or 0 to 100
  size?: 'xs' | 'sm' | 'md';
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  source,
  validationLevel,
  confidence,
  size = 'sm',
}) => {
  const normalized = source.toUpperCase().replace(/-/g, '_');

  let label = 'Clinical Evidence';
  let icon = <Eye size={11} />;
  let color = 'var(--text-secondary)';
  let bg = 'var(--bg-subtle)';
  let border = 'var(--border-default)';

  if (normalized.includes('PATIENT')) {
    label = 'Patient-reported';
    icon = <User size={11} />;
    color = '#475569';
    bg = '#f8fafc';
    border = '#cbd5e1';
  } else if (normalized.includes('CLINICIAN') || normalized.includes('EXAM') || normalized.includes('OBSERVED')) {
    label = 'Clinician-observed';
    icon = <Eye size={11} />;
    color = '#0f766e';
    bg = '#f0fdfa';
    border = '#99f6e4';
  } else if (normalized.includes('SENSOR') || normalized.includes('IMU') || normalized.includes('KINEMATIC')) {
    label = 'Sensor-derived';
    icon = <Activity size={11} />;
    color = '#0369a1';
    bg = '#f0f9ff';
    border = '#bae6fd';
  } else if (normalized.includes('ESCALATION') || normalized.includes('RED_FLAG')) {
    label = 'Clinical escalation';
    icon = <AlertTriangle size={11} />;
    color = '#be123c';
    bg = '#fff1f2';
    border = '#fecdd3';
  } else if (normalized.includes('AUTOMATED') || normalized.includes('FLAG') || normalized.includes('ALGORITHM')) {
    label = 'Automated screening marker';
    icon = <Sliders size={11} />;
    color = '#854d0e';
    bg = '#fefce8';
    border = '#fef08a';
  }

  const fontSize = size === 'xs' ? '10px' : size === 'sm' ? '11px' : '12px';
  const padding = size === 'xs' ? '1px 5px' : size === 'sm' ? '2px 7px' : '3px 9px';

  let validationText = '';
  if (validationLevel) {
    if (validationLevel === 'VALIDATED') validationText = ' · Validated';
    else if (validationLevel === 'RESEARCH_DERIVED') validationText = ' · Research-derived';
    else if (validationLevel === 'PROVISIONAL') validationText = ' · Provisional';
  }

  let confidenceText = '';
  if (confidence !== undefined && confidence !== null) {
    const val = confidence > 1 ? Math.round(confidence) : Math.round(confidence * 100);
    confidenceText = ` (${val}%)`;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding,
        fontSize,
        fontWeight: 500,
        color,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-sm)',
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      }}
      title={`Evidence Provenance: ${label}${validationText}${confidenceText}`}
    >
      {icon}
      <span>{label}</span>
      {validationText && (
        <span style={{ opacity: 0.8, fontSize: '10px', fontStyle: 'italic' }}>
          {validationText}
        </span>
      )}
      {confidenceText && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
          {confidenceText}
        </span>
      )}
    </span>
  );
};
