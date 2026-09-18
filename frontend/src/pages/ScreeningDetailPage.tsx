import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ScreeningSession,
  Patient,
  ClinicalAssessment,
  FunctionalTest,
  RiskAssessment,
  RedFlag,
  HealthWorkerReview,
} from '../api/types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Section } from '../components/common/Section';
import { Alert } from '../components/common/Alert';
import { ScreeningDisclaimer } from '../components/common/ScreeningDisclaimer';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { EvidenceTable } from '../components/screening/EvidenceTable';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';

interface ScreeningDetailPageProps {
  session: ScreeningSession;
  onBack: () => void;
}

export const ScreeningDetailPage: React.FC<ScreeningDetailPageProps> = ({ session, onBack }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinical, setClinical] = useState<ClinicalAssessment | null>(null);
  const [tests, setTests] = useState<FunctionalTest[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [review, setReview] = useState<HealthWorkerReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const pt = await api.getPatient(session.patient_id);
        setPatient(pt);

        const [c, t, rf, r, rev] = await Promise.allSettled([
          api.getClinicalAssessment(session.id),
          api.getFunctionalTests(session.id),
          api.getRedFlags(session.id),
          api.getRisk(session.id),
          api.getReview(session.id),
        ]);

        if (c.status === 'fulfilled') setClinical(c.value);
        if (t.status === 'fulfilled') setTests(t.value);
        if (rf.status === 'fulfilled') setRedFlags(rf.value);
        if (r.status === 'fulfilled') setRisk(r.value);
        if (rev.status === 'fulfilled') setReview(rev.value);
      } catch (err) {
        console.error('Error loading screening details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [session]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading screening session record from local SQLite...
      </div>
    );
  }

  const isReviewed = review !== null && review.id !== undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowLeft size={15} />}
          onClick={onBack}
        >
          Back to Sessions List
        </Button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <StatusBadge
            status={session.screening_status}
            isReviewed={isReviewed}
          />
          {risk && <RiskBadge tier={risk.risk_tier} score={risk.risk_score} />}
        </div>
      </div>

      {/* Critical Red Flag Alert if Detected */}
      {redFlags.length > 0 && (
        <Alert
          type="redflag"
          title="CRITICAL CLINICAL RED FLAG DETECTED — URGENT CLINICAL ESCALATION"
          detectedFinding={redFlags.map((r) => r.flag_name).join(', ')}
          explanation={redFlags.map((r) => r.explanation).join('. ')}
          actionRequired={redFlags[0]?.action_required || 'Urgent medical referral / clinical escalation.'}
        >
          Independent Red-Flag Safety Engine detected potential acute joint condition requiring immediate clinical evaluation. Routine screening triage pathway bypassed.
        </Alert>
      )}

      {/* Patient & Session Master Header */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            Patient
          </span>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {patient?.name || 'Unknown Patient'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-secondary-hover)', marginTop: '1px' }}>
            {patient?.patient_identifier}
          </div>
        </div>

        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            Demographics
          </span>
          <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
            {patient?.age} yrs • {patient?.sex}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
            BMI {patient?.bmi} ({patient?.height}cm / {patient?.weight}kg)
          </div>
        </div>

        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            Camp Location &amp; Scope
          </span>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} color="var(--accent-primary)" />
            {session.camp_location || 'Assam Mobile Camp Unit #3'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
            Operator: {session.operator_name || 'Health Worker'}
          </div>
        </div>

        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            Session Timing &amp; State
          </span>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} color="var(--text-secondary)" />
            {new Date(session.started_at).toLocaleDateString()} {new Date(session.started_at).toLocaleTimeString()}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Session ID: {session.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Two Column Layout: Clinical Bedside Assessment & Functional Tests */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Clinical Bedside Findings */}
        <Section
          title="Physical Examination Checklist"
          subtitle="Clinician-observed musculoskeletal examination parameters."
          action={<ProvenanceBadge source="CLINICIAN_OBSERVED" size="xs" />}
        >
          {clinical ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Morning Stiffness:</span>
                <span style={{ fontWeight: 600 }}>{clinical.morning_stiffness_minutes} minutes</span>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Knee Pain Score (NRS 0–10):</span>
                <span style={{ fontWeight: 600 }}>{clinical.pain_nrs_score} / 10</span>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Knee Flexion ROM:</span>
                <span style={{ fontWeight: 600 }}>{clinical.knee_flexion_rom_deg}°</span>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Frontal Alignment:</span>
                <span style={{ fontWeight: 600 }}>{clinical.alignment_observation}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Joint Effusion / Swelling:</span>
                <span style={{ fontWeight: 600 }}>{clinical.joint_swelling ? 'Present' : 'Absent'}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Palpable Crepitus:</span>
                <span style={{ fontWeight: 600 }}>{clinical.crepitus_present ? 'Present' : 'Absent'}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Joint-Line Tenderness:</span>
                <span style={{ fontWeight: 600 }}>{clinical.joint_line_tenderness ? 'Present' : 'Absent'}</span>
              </div>
              {clinical.clinician_notes && (
                <div style={{ marginTop: '8px', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Clinician Notes:</div>
                  <div style={{ fontSize: '12.5px', marginTop: '2px' }}>{clinical.clinician_notes}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No physical exam record saved.</div>
          )}
        </Section>

        {/* Functional Movement Tests */}
        <Section
          title="Functional Mobility Tests"
          subtitle="Objective kinematic and timed test results."
          action={<ProvenanceBadge source="SENSOR_DERIVED" size="xs" />}
        >
          {tests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tests.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.test_type} Test</span>
                    <span className="badge badge-tier1" style={{ fontSize: '11px' }}>{t.quality_status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Duration: {t.duration_seconds}s
                  </div>
                  {t.results && t.results.length > 0 && (
                    <div style={{ marginTop: '6px', borderTop: '1px solid var(--border-default)', paddingTop: '4px' }}>
                      {t.results.map((r, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{r.metric_name}:</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {r.metric_value} {r.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No functional test records found.</div>
          )}
        </Section>
      </div>

      {/* Automated Risk Stratification Model Output */}
      {risk && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                AUTOMATED SCREENING ASSESSMENT
              </div>

              {/* Prominent Screening Tier */}
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color:
                    risk.risk_tier === 'TIER_3_PROBABLE_OA'
                      ? 'var(--tier3-text)'
                      : risk.risk_tier === 'TIER_2_ELEVATED_RISK'
                      ? 'var(--tier2-text)'
                      : 'var(--tier1-text)',
                  marginTop: '4px',
                }}
              >
                {risk.risk_tier === 'TIER_1_LOW_RISK' && 'Tier 1 — Low Risk'}
                {risk.risk_tier === 'TIER_2_ELEVATED_RISK' && 'Tier 2 — Elevated Risk Markers'}
                {risk.risk_tier === 'TIER_3_PROBABLE_OA' && 'Tier 3 — Probable OA Pattern'}
              </div>

              {/* Secondary Numerical Risk Score */}
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginTop: '3px',
                }}
              >
                Calculated Screening Score:{' '}
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {risk.risk_score}
                </strong>{' '}
                / 100 • Engine Version: {risk.model_version}
              </div>
            </div>

            {/* Clear Disclaimer Tag */}
            <div
              style={{
                padding: '8px 14px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Screening result — not a diagnosis.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Objective biomarker synthesis to guide clinical examination
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginTop: '16px',
              marginBottom: '16px',
              borderLeft: '3px solid var(--accent-primary)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              Screening Marker Interpretation:
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-body)', lineHeight: 1.45, margin: 0 }}>
              {risk.explanation}
            </p>
          </div>

          {/* Structured Evidence Table */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
              Structured Contributing Findings
            </div>
            <EvidenceTable features={risk.contributing_features} />
          </div>
        </div>
      )}

      {/* HEALTH-WORKER REVIEW SECTION (Unmistakable Visual Contrast) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Clinical Review &amp; Sign-Off Workflow
        </h3>

        {review ? (
          <div
            style={{
              background: '#ffffff',
              border: '2px solid var(--accent-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 22px',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-default)',
                paddingBottom: '10px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#ffffff',
                    background: 'var(--accent-primary)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  FINAL HEALTH-WORKER REVIEW
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Clinical Determination Verified &amp; Signed
                </span>
              </div>
              <ProvenanceBadge source="CLINICIAN_OBSERVED" size="sm" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Final Clinical Determination
                </span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-primary)', marginTop: '2px' }}>
                  {review.final_result}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Reviewing Attending Clinician
                </span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {review.reviewed_by}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Review Timestamp
                </span>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : 'Recorded'}
                </div>
              </div>
            </div>

            {review.review_notes && (
              <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Directives &amp; Treatment Plan:</span>
                <div style={{ fontSize: '12.5px', marginTop: '2px', color: 'var(--text-primary)' }}>{review.review_notes}</div>
              </div>
            )}

            {review.override_reason && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 700 }}>Mandatory Override Rationale:</span>
                <div style={{ fontSize: '12.5px', marginTop: '2px', color: '#92400e' }}>{review.override_reason}</div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--tier2-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Clock size={20} color="var(--tier2-text)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--tier2-text)' }}>
                Awaiting Attending Clinician Review &amp; Determination
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                This screening session has finalized data collection, but requires medical worker sign-off before final triage referral.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <ScreeningDisclaimer compact={false} includeReviewRequirement={true} />
    </div>
  );
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '4px 0',
  borderBottom: '1px solid var(--border-default)',
};
