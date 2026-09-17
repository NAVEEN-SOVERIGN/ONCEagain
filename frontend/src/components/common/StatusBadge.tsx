import React from 'react';
import type { ScreeningStatus } from '../../api/types';

interface StatusBadgeProps {
  status?: ScreeningStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'IN_PROGRESS', size = 'md' }) => {
  let label = status;
  let badgeClass = 'badge-neutral';
  let dotColor = 'var(--text-faint)';

  switch (status) {
    case 'IN_PROGRESS':
      label = 'In Progress';
      badgeClass = 'badge-active';
      dotColor = 'var(--accent-secondary)';
      break;
    case 'COMPLETED':
      label = 'Data Completed';
      badgeClass = 'badge-neutral';
      dotColor = 'var(--text-secondary)';
      break;
    case 'REVIEWED':
      label = 'Clinician Reviewed';
      badgeClass = 'badge-tier1';
      dotColor = 'var(--tier1-text)';
      break;
    case 'QUALITY_INSUFFICIENT':
      label = 'Quality Insufficient';
      badgeClass = 'badge-tier3';
      dotColor = 'var(--tier3-text)';
      break;
    default:
      label = status.replace(/_/g, ' ');
      break;
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
      }}
    >
      <span style={{ color: dotColor, fontSize: '9px' }}>●</span>
      <span>{label}</span>
    </span>
  );
};
