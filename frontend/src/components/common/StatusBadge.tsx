import React from 'react';
import type { ScreeningStatus } from '../../api/types';

interface StatusBadgeProps {
  status?: ScreeningStatus | 'AWAITING_REVIEW' | 'CLINICIAN_REVIEWED' | string;
  isReviewed?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'IN_PROGRESS',
  isReviewed,
  size = 'md',
}) => {
  let label = status;
  let badgeClass = 'badge-neutral';
  let dotColor = 'var(--text-faint)';

  // If status is COMPLETED and we know whether it has been reviewed:
  const normalized = status.toUpperCase();

  if (normalized === 'IN_PROGRESS') {
    label = 'In Progress';
    badgeClass = 'badge-active';
    dotColor = 'var(--accent-secondary)';
  } else if (normalized === 'AWAITING_REVIEW' || (normalized === 'COMPLETED' && isReviewed === false)) {
    label = 'Awaiting Review';
    badgeClass = 'badge-tier2';
    dotColor = 'var(--tier2-text)';
  } else if (normalized === 'COMPLETED') {
    label = 'Completed';
    badgeClass = 'badge-neutral';
    dotColor = 'var(--text-secondary)';
  } else if (normalized === 'REVIEWED' || normalized === 'CLINICIAN_REVIEWED' || isReviewed === true) {
    label = 'Clinician Reviewed';
    badgeClass = 'badge-tier1';
    dotColor = 'var(--tier1-text)';
  } else if (normalized === 'QUALITY_INSUFFICIENT') {
    label = 'Quality Insufficient';
    badgeClass = 'badge-tier3';
    dotColor = 'var(--tier3-text)';
  } else {
    label = status.replace(/_/g, ' ');
  }

  const fontSize = size === 'sm' ? '11px' : '12px';
  const padding = size === 'sm' ? '1px 6px' : '2px 8px';

  return (
    <span
      className={`badge ${badgeClass}`}
      style={{
        fontSize,
        padding,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontWeight: 500,
      }}
    >
      <span style={{ color: dotColor, fontSize: '9px' }}>●</span>
      <span>{label}</span>
    </span>
  );
};
