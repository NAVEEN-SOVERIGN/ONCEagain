import React from 'react';

interface MetricProps {
  label: string;
  value: string | number;
  subtext?: string;
  status?: 'default' | 'attention' | 'critical' | 'success';
  icon?: React.ReactNode;
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  subtext,
  status = 'default',
  icon,
}) => {
  const statusBorder =
    status === 'critical'
      ? 'var(--redflag-border)'
      : status === 'attention'
      ? 'var(--tier2-border)'
      : status === 'success'
      ? 'var(--tier1-border)'
      : 'var(--border-default)';

  const valueColor =
    status === 'critical'
      ? 'var(--redflag-text)'
      : status === 'attention'
      ? 'var(--tier2-text)'
      : status === 'success'
      ? 'var(--tier1-text)'
      : 'var(--text-primary)';

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${statusBorder}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ color: 'var(--text-faint)' }}>{icon}</span>}
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: valueColor,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subtext && (
        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {subtext}
        </span>
      )}
    </div>
  );
};
