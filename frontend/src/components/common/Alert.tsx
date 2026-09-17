import React from 'react';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface AlertProps {
  type?: 'redflag' | 'warning' | 'info' | 'success';
  title?: string;
  children: React.ReactNode;
  actionRequired?: string;
  detectedFinding?: string;
  explanation?: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  actionRequired,
  detectedFinding,
  explanation,
  className = '',
}) => {
  if (type === 'redflag') {
    return (
      <div
        className={className}
        style={{
          background: 'var(--redflag-bg)',
          border: '2px solid var(--redflag-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          color: 'var(--redflag-text)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <AlertOctagon size={20} color="#dc2626" />
          <h4 style={{ color: '#991b1b', fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em' }}>
            {title || 'CRITICAL CLINICAL ALERT — RED FLAG DETECTED'}
          </h4>
        </div>

        {detectedFinding && (
          <div style={{ fontSize: '13.5px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600 }}>Detected: </span>
            <span>{detectedFinding}</span>
          </div>
        )}

        {explanation && (
          <div style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600 }}>Clinical Implication: </span>
            <span>{explanation}</span>
          </div>
        )}

        {actionRequired && (
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              background: '#fee2e2',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              marginTop: '8px',
              border: '1px solid #fca5a5',
            }}
          >
            Required Action: {actionRequired}
          </div>
        )}

        {children && <div style={{ marginTop: '8px', fontSize: '13px' }}>{children}</div>}
      </div>
    );
  }

  const styles = {
    warning: {
      bg: 'var(--tier2-bg)',
      border: '1px solid var(--tier2-border)',
      color: 'var(--tier2-text)',
      Icon: AlertTriangle,
    },
    success: {
      bg: 'var(--tier1-bg)',
      border: '1px solid var(--tier1-border)',
      color: 'var(--tier1-text)',
      Icon: CheckCircle2,
    },
    info: {
      bg: 'var(--accent-secondary-subtle)',
      border: '1px solid #bae6fd',
      color: 'var(--accent-secondary-hover)',
      Icon: Info,
    },
  }[type];

  const IconComponent = styles.Icon;

  return (
    <div
      className={className}
      style={{
        background: styles.bg,
        border: styles.border,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        color: styles.color,
        marginBottom: '16px',
        fontSize: '13px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <IconComponent size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          {title && <div style={{ fontWeight: 600, marginBottom: '2px' }}>{title}</div>}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};
