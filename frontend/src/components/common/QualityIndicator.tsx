import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

interface QualityIndicatorProps {
  label: string;
  status: 'valid' | 'warning' | 'failed' | 'pending';
  value?: string | number;
  expected?: string | number;
  note?: string;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  label,
  status,
  value,
  expected,
  note,
}) => {
  const config = {
    valid: {
      color: 'var(--tier1-text)',
      bg: 'var(--tier1-bg)',
      border: 'var(--tier1-border)',
      Icon: Check,
      text: 'Valid',
    },
    warning: {
      color: 'var(--tier2-text)',
      bg: 'var(--tier2-bg)',
      border: 'var(--tier2-border)',
      Icon: AlertTriangle,
      text: 'Warning',
    },
    failed: {
      color: 'var(--redflag-text)',
      bg: 'var(--redflag-bg)',
      border: 'var(--redflag-border)',
      Icon: X,
      text: 'Failed',
    },
    pending: {
      color: 'var(--text-secondary)',
      bg: 'var(--bg-subtle)',
      border: 'var(--border-default)',
      Icon: Check,
      text: 'Pending',
    },
  }[status];

  const IconComp = config.Icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-default)',
        fontSize: '13px',
      }}
    >
      <div>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        {note && <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{note}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {value !== undefined && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-body)' }}>
            {value} {expected !== undefined && <span style={{ color: 'var(--text-secondary)' }}>/ {expected}</span>}
          </span>
        )}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11.5px',
            fontWeight: 600,
            background: config.bg,
            color: config.color,
            border: `1px solid ${config.border}`,
          }}
        >
          <IconComp size={12} strokeWidth={2.5} />
          <span>{config.text}</span>
        </span>
      </div>
    </div>
  );
};
