import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ClinicalFindingProps {
  label: string;
  detectedValue: string | number;
  threshold?: string | number;
  direction?: 'ABOVE_MAX' | 'BELOW_MIN' | 'ANOMALOUS' | string;
  explanation?: string;
  source?: string;
  isFlagged?: boolean;
}

export const ClinicalFinding: React.FC<ClinicalFindingProps> = ({
  label,
  detectedValue,
  threshold,
  direction,
  explanation,
  source,
  isFlagged = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '10px 14px',
        background: isFlagged ? 'var(--tier2-bg)' : 'var(--bg-surface)',
        border: `1px solid ${isFlagged ? 'var(--tier2-border)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        fontSize: '13px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isFlagged ? (
            <AlertTriangle size={14} color="var(--tier2-text)" />
          ) : (
            <CheckCircle size={14} color="var(--tier1-text)" />
          )}
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
          {source && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                background: 'var(--bg-subtle)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
              }}
            >
              {source}
            </span>
          )}
          {direction && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--tier2-text)',
                fontWeight: 600,
              }}
            >
              ({direction.replace(/_/g, ' ')})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: isFlagged ? 'var(--tier2-text)' : 'var(--text-primary)',
            }}
          >
            {detectedValue}
          </span>
          {threshold !== undefined && (
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              (Ref: {threshold})
            </span>
          )}
        </div>
      </div>

      {explanation && (
        <p style={{ fontSize: '12px', color: isFlagged ? 'var(--tier2-text)' : 'var(--text-secondary)', marginTop: '2px' }}>
          {explanation}
        </p>
      )}
    </div>
  );
};
