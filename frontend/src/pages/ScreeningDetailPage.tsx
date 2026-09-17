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
import { ClinicalFinding } from '../components/common/ClinicalFinding';
import { ScreeningDisclaimer } from '../components/common/ScreeningDisclaimer';
import { ArrowLeft, UserCheck, Calendar, MapPin } from 'lucide-react';

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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <StatusBadge status={session.screening_status} />
          <RiskBadge tier={risk?.risk_tier} score={risk?.risk_score} />
        </div>
      </div>

      {/* Critical Red Flag Alert if Detected */}
      {redFlags.length > 0 && (
        <Alert
          type="redflag"
          title="CRITICAL CLINICAL RED FLAG DETECTED"
          detectedFinding={redFlags.map((r) => r.flag_name).join(', ')}
          explanation={redFlags.map((r) => r.explanation).join('. ')}
          actionRequired={redFlags[0]?.action_required || 'Urgent medical referral / clinical escalation.'}
        >
          Clinical signs require immediate medical review. Routine OA screening pathway suspended.
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
            Camp Location
          </span>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} color="var(--accent-primary)" />
            {session.camp_location || 'Assam Mobile Camp'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
            Op: {session.operator_name || 'Health Worker'}
          </div>
        </div>

        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            Session Timestamp
          </span>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} color="var(--text-secondary)" />
            {new Date(session.started_at).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            ID: {session.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Triage Disclaimer */}
      <ScreeningDisclaimer compact={false} includeReviewRequirement={true} />

      {/* Two Column Layout: Clinical Bedside Assessment & Functional Tests */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Clinical Bedside Findings */}
        <Section title="Physical Examination Checklist" subtitle="Recorded physical examination markers.">
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
        <Section title="Functional Mobility Tests" subtitle="Objective kinematic and timed test results.">
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
        <Section
          title="Automated Screening Risk Stratification"
          subtitle="Model version and contributing risk factor breakdown."
          action={<RiskBadge tier={risk.risk_tier} score={risk.risk_score} />}
        >
          <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Explanation
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '2px', lineHeight: 1.4 }}>
              {risk.explanation}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {risk.contributing_features.map((cf, idx) => (
              <ClinicalFinding
                key={idx}
                label={cf.feature}
                detectedValue={String(cf.value)}
                source={`Weight: +${cf.weight}`}
                explanation={cf.explanation}
                isFlagged={cf.weight > 10}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Health Worker Review Section */}
      <Section
        title="Health Worker Review &amp; Sign-Off Determination"
        subtitle="Mandatory clinician sign-off verifying or overriding automated screening output."
      >
        {review ? (
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600 }}>Final Determination: {review.final_result}</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Reviewed on: {review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : 'N/A'}
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Reviewing Clinician: </span>
              <strong>{review.reviewed_by}</strong>
            </div>

            {review.review_notes && (
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Directives &amp; Notes: </span>
                <span>{review.review_notes}</span>
              </div>
            )}

            {review.override_reason && (
              <div style={{ color: 'var(--tier2-text)' }}>
                <span style={{ fontWeight: 600 }}>Override Reason: </span>
                <span>{review.override_reason}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Awaiting clinician review and sign-off.
          </div>
        )}
      </Section>
    </div>
  );
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '4px 0',
  borderBottom: '1px solid var(--border-default)',
};
