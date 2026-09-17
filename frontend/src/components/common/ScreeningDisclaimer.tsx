import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ScreeningDisclaimerProps {
  compact?: boolean;
  includeReviewRequirement?: boolean;
  className?: string;
}

export const ScreeningDisclaimer: React.FC<ScreeningDisclaimerProps> = ({
  compact = false,
  includeReviewRequirement = true,
  className = '',
}) => {
  if (compact) {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11.5px',
          color: 'var(--text-secondary)',
          background: 'var(--bg-subtle)',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
        }}
      >
        <ShieldAlert size={13} color="var(--accent-primary)" />
        <span>Screening result — not a diagnosis. Clinician review required.</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '10px 14px',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
      }}
    >
      <ShieldAlert size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Triage Decision-Support Notice: </strong>
        This software performs preliminary risk-marker stratification and is NOT an autonomous diagnostic tool.
        {includeReviewRequirement && (
          <span> All findings and recommendations require validation and sign-off by a qualified healthcare professional.</span>
        )}
      </div>
    </div>
  );
};
