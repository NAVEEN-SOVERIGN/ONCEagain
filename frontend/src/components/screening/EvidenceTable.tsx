import React from 'react';
import { ContributingFeature, AutoFlag } from '../../api/types';
import { ProvenanceBadge, ProvenanceSource } from '../common/ProvenanceBadge';

interface EvidenceTableProps {
  features?: ContributingFeature[];
  autoFlags?: AutoFlag[];
}

interface EvidenceRow {
  finding: string;
  observedValue: string;
  threshold: string;
  weight: number;
  explanation: string;
  provenance: ProvenanceSource;
  validationLevel?: string;
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({ features = [], autoFlags = [] }) => {
  if (features.length === 0 && autoFlags.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
        No contributing clinical or biomechanical risk markers recorded.
      </div>
    );
  }

  // Helper to deduce reference threshold and provenance from feature text/code
  const parseFeatureRow = (cf: ContributingFeature): EvidenceRow => {
    const featLower = cf.feature.toLowerCase();
    let threshold = 'Reference range';
    let provenance: ProvenanceSource = 'AUTOMATED_MARKER';
    let displayVal = cf.value !== null && cf.value !== undefined ? String(cf.value) : 'Detected';

    if (featLower.includes('age')) {
      threshold = '≥ 45–55 yrs';
      provenance = 'PATIENT_REPORTED';
      if (typeof cf.value === 'number') displayVal = `${cf.value} years`;
    } else if (featLower.includes('bmi')) {
      threshold = '≥ 25.0 kg/m²';
      provenance = 'CLINICIAN_OBSERVED';
      if (typeof cf.value === 'number') displayVal = `${cf.value} kg/m²`;
    } else if (featLower.includes('injury')) {
      threshold = 'No joint trauma';
      provenance = 'PATIENT_REPORTED';
      displayVal = cf.value ? 'Reported trauma' : 'None';
    } else if (featLower.includes('crepitus')) {
      threshold = 'Absent (smooth gliding)';
      provenance = 'CLINICIAN_OBSERVED';
      displayVal = cf.value ? 'Audible / Palpable' : 'Absent';
    } else if (featLower.includes('stiffness')) {
      threshold = '≤ 30 minutes';
      provenance = 'PATIENT_REPORTED';
      if (typeof cf.value === 'number') displayVal = `${cf.value} min`;
    } else if (featLower.includes('tug') || featLower.includes('timed up')) {
      threshold = '< 10.0–12.0 s';
      provenance = 'SENSOR_DERIVED';
      if (typeof cf.value === 'number') displayVal = `${cf.value} s`;
    } else if (featLower.includes('squat')) {
      threshold = '< 15% asymmetry';
      provenance = 'SENSOR_DERIVED';
      if (typeof cf.value === 'number') displayVal = `${cf.value}%`;
    } else if (featLower.includes('valgus') || featLower.includes('q-angle') || featLower.includes('alignment')) {
      threshold = '12°–18° neutral';
      provenance = 'CLINICIAN_OBSERVED';
      if (typeof cf.value === 'number') displayVal = `${cf.value}°`;
    } else if (featLower.includes('rom') || featLower.includes('flexion')) {
      threshold = '≥ 125° flexion';
      provenance = 'CLINICIAN_OBSERVED';
      if (typeof cf.value === 'number') displayVal = `${cf.value}°`;
    } else if (featLower.includes('pain') || featLower.includes('nrs')) {
      threshold = '< 3 / 10 mild';
      provenance = 'PATIENT_REPORTED';
      if (typeof cf.value === 'number') displayVal = `${cf.value} / 10`;
    }

    // Clean explanation to maintain strict clinical screening language
    let cleanExp = cf.explanation || 'Screening marker contributing to overall joint risk tier.';
    cleanExp = cleanExp
      .replace(/diagnosed with/gi, 'demonstrates screening markers for')
      .replace(/suffers from/gi, 'exhibits risk markers of')
      .replace(/causes disease/gi, 'is an associated risk factor for');

    return {
      finding: cf.feature,
      observedValue: displayVal,
      threshold,
      weight: cf.weight,
      explanation: cleanExp,
      provenance,
    };
  };

  const rows: EvidenceRow[] = features.map(parseFeatureRow);

  return (
    <div className="table-container" style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <table className="clinical-table">
        <thead>
          <tr>
            <th style={{ width: '22%' }}>Finding / Risk Marker</th>
            <th style={{ width: '14%' }}>Observed Value</th>
            <th style={{ width: '15%' }}>Reference Limit</th>
            <th style={{ width: '12%' }}>Score Weight</th>
            <th style={{ width: '22%' }}>Clinical Screening Rationale</th>
            <th style={{ width: '15%', textAlign: 'right' }}>Evidence Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                {r.finding}
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--accent-secondary-hover)', fontWeight: 600 }}>
                {r.observedValue}
              </td>
              <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {r.threshold}
              </td>
              <td>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: r.weight > 10 ? 'var(--redflag-text)' : 'var(--text-primary)',
                    background: r.weight > 10 ? 'var(--redflag-bg)' : 'var(--bg-subtle)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  +{r.weight.toFixed(1)} pts
                </span>
              </td>
              <td style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.35 }}>
                {r.explanation}
              </td>
              <td style={{ textAlign: 'right' }}>
                <ProvenanceBadge source={r.provenance} size="xs" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
