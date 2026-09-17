import React from 'react';
import { RiskTier } from '../../api/types';

interface RiskBadgeProps {
  tier?: RiskTier | string | null;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  tier,
  score,
  showScore = true,
  size = 'md',
}) => {
  if (!tier) {
    return (
      <span className="badge badge-neutral" style={{ fontSize: size === 'sm' ? '11px' : '12px' }}>
        <span style={{ color: 'var(--text-faint)' }}>●</span> Not Stratified
      </span>
    );
  }

  let label = 'Low Risk';
  let badgeClass = 'badge-tier1';
  let dotColor = 'var(--tier1-text)';

  if (tier === 'TIER_1_LOW_RISK' || tier.includes('TIER_1') || tier.toLowerCase().includes('low')) {
    label = 'Low Risk';
    badgeClass = 'badge-tier1';
    dotColor = 'var(--tier1-text)';
  } else if (tier === 'TIER_2_ELEVATED_RISK' || tier.includes('TIER_2') || tier.toLowerCase().includes('elevated')) {
    label = 'Elevated Risk Markers';
    badgeClass = 'badge-tier2';
    dotColor = 'var(--tier2-text)';
  } else if (tier === 'TIER_3_PROBABLE_OA' || tier.includes('TIER_3') || tier.toLowerCase().includes('probable')) {
    label = 'Probable OA Pattern';
    badgeClass = 'badge-tier3';
    dotColor = 'var(--tier3-text)';
  }

  const fontSize = size === 'lg' ? '13px' : size === 'sm' ? '11px' : '12px';
  const padding = size === 'lg' ? '4px 10px' : size === 'sm' ? '1px 6px' : '2px 8px';

  return (
    <span
      className={`badge ${badgeClass}`}
      style={{
        fontSize,
        padding,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
      title="Preliminary screening stratification — requires clinician review"
    >
      <span style={{ color: dotColor, fontSize: '10px' }}>●</span>
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            opacity: 0.9,
            marginLeft: '2px',
          }}
        >
          {score.toFixed(0)} / 100
        </span>
      )}
    </span>
  );
};
