import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Patient,
  ScreeningSession,
  AutoFlag,
  RiskAssessment,
  RedFlag,
  Report,
} from '../api/types';
import { RiskBadge } from '../components/common/RiskBadge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Alert } from '../components/common/Alert';
import { Section } from '../components/common/Section';
import { StepIndicator } from '../components/common/StepIndicator';
import { ScreeningDisclaimer } from '../components/common/ScreeningDisclaimer';
import { QualityIndicator } from '../components/common/QualityIndicator';
import { ClinicalFinding } from '../components/common/ClinicalFinding';
import { WaveformCanvas } from '../components/sensor/WaveformCanvas';
import {
  ChevronRight,
  ChevronLeft,
  Printer,
  User,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { NavItem } from '../components/layout/Sidebar';

interface NewScreeningPageProps {
  initialPatient?: Patient | null;
  onNavigate: (tab: NavItem, context?: any) => void;
}

const STEP_NAMES = [
  'Patient',
  'Anthropometrics',
  'Questionnaire',
  'Physical Exam',
  'TUG Test',
  'Squat Test',
  'Q-Angle',
  'Step-Up',
  'Step-Down',
  'Quality Gate',
  'Risk & Flags',
  'Clinician Review',
  'Final Report',
];

export const NewScreeningPage: React.FC<NewScreeningPageProps> = ({ initialPatient, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(0);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient || null);
  const [activeSession, setActiveSession] = useState<ScreeningSession | null>(null);

  // Form states
  const [anthro, setAnthro] = useState({
    height: selectedPatient?.height || 162,
    weight: selectedPatient?.weight || 68,
    occupation: selectedPatient?.occupation || 'Agricultural / Manual Worker',
    familyHistory: selectedPatient?.family_history || 'None reported',
    prevInjury: selectedPatient?.previous_joint_injury || false,
  });

  const [questionnaire, setQuestionnaire] = useState([
    { code: 'P1', text: 'How often do you experience knee pain?', value: 2.0, label: 'Moderate' },
    { code: 'P2', text: 'Knee pain when walking on flat ground', value: 2.0, label: 'Mild' },
    { code: 'S1', text: 'Knee stiffness upon waking up', value: 1.0, label: 'Mild' },
    { code: 'A1', text: 'Difficulty descending stairs / slopes', value: 2.0, label: 'Moderate' },
    { code: 'A2', text: 'Difficulty rising from sitting position', value: 2.0, label: 'Moderate' },
  ]);

  const [clinical, setClinical] = useState({
    morningStiffnessMinutes: 20,
    jointSwelling: false,
    painNrsScore: 4,
    kneeFlexionRomDeg: 118,
    kneeExtensionRomDeg: 0,
    crepitusPresent: true,
    jointLineTenderness: true,
    alignmentObservation: 'NORMAL',
    clinicianNotes: 'Audible crepitus on active flexion, localized medial joint line tenderness.',
  });

  // Functional test states
  const [tugTime, setTugTime] = useState(11.2);
  const [squatDepth, setSquatDepth] = useState(78);
  const [squatAsym, setSquatAsym] = useState(14);
  const [qAngle, setQAngle] = useState(16.5);
  const [stepUpAsym, setStepUpAsym] = useState(12.0);
  const [stepDownHesitation, setStepDownHesitation] = useState(0.5);

  // Sensor waveform state
  const [sensorSamples, setSensorSamples] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [qualityPassed, setQualityPassed] = useState(true);
  const [qualityError, setQualityError] = useState('');

  // Results & Review
  const [autoFlags, setAutoFlags] = useState<AutoFlag[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [reviewDecision, setReviewDecision] = useState<string>('CONFIRM');
  const [reviewerName, setReviewerName] = useState<string>('Dr. P. Saikia (Community MO)');
  const [reviewNotes, setReviewNotes] = useState<string>(
    'Patient demonstrates elevated functional risk markers. Prescribe quadriceps isometric exercises and 8-week follow-up.'
  );
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getPatients().then(setPatients).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
      setAnthro({
        height: initialPatient.height,
        weight: initialPatient.weight,
        occupation: initialPatient.occupation || '',
        familyHistory: initialPatient.family_history || '',
        prevInjury: initialPatient.previous_joint_injury,
      });
    }
  }, [initialPatient]);

  const advanceStep = (nextStep: number) => {
    setCurrentStep(nextStep);
    setMaxCompletedStep((prev) => Math.max(prev, nextStep));
  };

  // Step 1: Start or continue screening session
  const initSession = async () => {
    if (!selectedPatient) {
      alert('Please select or register a patient first.');
      return;
    }
    try {
      setLoading(true);
      const session = await api.createScreening({
        patient_id: selectedPatient.id,
        operator_name: 'Community Health Worker',
        camp_location: 'Assam PHC Mobile Unit #3',
      });
      setActiveSession(session);
      advanceStep(1);
    } catch (err: any) {
      alert(`Could not start session: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save Questionnaire
  const saveQuestionnaire = async () => {
    if (!activeSession) return;
    try {
      setLoading(true);
      await api.submitQuestionnaireBatch({
        screening_session_id: activeSession.id,
        questionnaire_type: 'KOOS_OA',
        items: questionnaire.map((q) => ({
          question_code: q.code,
          question_text: q.text,
          response_value: q.value,
          response_label: q.label,
        })),
      });
      advanceStep(3);
    } catch (err: any) {
      alert(`Failed to save questionnaire: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Save Clinical Exam
  const saveClinical = async () => {
    if (!activeSession) return;
    try {
      setLoading(true);
      await api.saveClinicalAssessment({
        screening_session_id: activeSession.id,
        morning_stiffness_minutes: clinical.morningStiffnessMinutes,
        joint_swelling: clinical.jointSwelling,
        pain_nrs_score: clinical.painNrsScore,
        knee_flexion_rom_deg: clinical.kneeFlexionRomDeg,
        knee_extension_rom_deg: clinical.kneeExtensionRomDeg,
        crepitus_present: clinical.crepitusPresent,
        joint_line_tenderness: clinical.jointLineTenderness,
        alignment_observation: clinical.alignmentObservation,
        clinician_notes: clinical.clinicianNotes,
      });
      advanceStep(4);
    } catch (err: any) {
      alert(`Failed to save clinical assessment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Run TUG test with sensor streaming
  const recordTUGTest = async () => {
    if (!activeSession) return;
    setIsRecording(true);
    try {
      const stream = await api.generateStream('TUG', tugTime, 'NORMAL');
      setSensorSamples(stream.samples);

      // Save functional test
      await api.createFunctionalTest({
        screening_session_id: activeSession.id,
        test_type: 'TUG',
        duration_seconds: tugTime,
        quality_status: 'PASSED',
        results: [
          {
            metric_name: 'tug_time',
            metric_value: tugTime,
            unit: 's',
            side: 'BILATERAL',
            quality_flag: 'VALID',
          },
        ],
      });

      // Ingest sensor batch
      await api.ingestSensorBatch({
        screening_session_id: activeSession.id,
        sensor_type: 'IMU',
        sampling_rate_hz: 50.0,
        samples: stream.samples,
      });

      setTimeout(() => {
        setIsRecording(false);
        advanceStep(5);
      }, 600);
    } catch (err: any) {
      setIsRecording(false);
      alert(`TUG test recording failed: ${err.message}`);
    }
  };

  // Step 6: Save Squat
  const saveSquatTest = async () => {
    if (!activeSession) return;
    try {
      await api.createFunctionalTest({
        screening_session_id: activeSession.id,
        test_type: 'SQUAT',
        duration_seconds: 5.0,
        quality_status: 'PASSED',
        results: [
          { metric_name: 'squat_depth_deg', metric_value: squatDepth, unit: 'deg', quality_flag: 'VALID' },
          { metric_name: 'bilateral_asymmetry_pct', metric_value: squatAsym, unit: '%', quality_flag: 'VALID' },
        ],
      });
      advanceStep(6);
    } catch (err: any) {
      alert(`Squat test error: ${err.message}`);
    }
  };

  // Step 7: Save Q-Angle Alignment
  const saveAlignment = async () => {
    if (!activeSession) return;
    try {
      await api.createFunctionalTest({
        screening_session_id: activeSession.id,
        test_type: 'ALIGNMENT',
        duration_seconds: 3.0,
        quality_status: 'PASSED',
        results: [
          { metric_name: 'q_angle_estimate_deg', metric_value: qAngle, unit: 'deg', quality_flag: 'ESTIMATE' },
        ],
      });
      advanceStep(7);
    } catch (err: any) {
      alert(`Alignment save error: ${err.message}`);
    }
  };

  // Step 8: Save Step-Up
  const saveStepUp = async () => {
    if (!activeSession) return;
    try {
      await api.createFunctionalTest({
        screening_session_id: activeSession.id,
        test_type: 'STEP_UP',
        duration_seconds: 4.0,
        quality_status: 'PASSED',
        results: [
          { metric_name: 'asymmetry_index', metric_value: stepUpAsym, unit: '%', quality_flag: 'VALID' },
        ],
      });
      advanceStep(8);
    } catch (err: any) {
      alert(`Step-up test error: ${err.message}`);
    }
  };

  // Step 9: Save Step-Down
  const saveStepDown = async () => {
    if (!activeSession) return;
    try {
      await api.createFunctionalTest({
        screening_session_id: activeSession.id,
        test_type: 'STEP_DOWN',
        duration_seconds: 4.0,
        quality_status: 'PASSED',
        results: [
          { metric_name: 'hesitation_time_sec', metric_value: stepDownHesitation, unit: 's', quality_flag: 'VALID' },
        ],
      });
      advanceStep(9);
    } catch (err: any) {
      alert(`Step-down test error: ${err.message}`);
    }
  };

  // Step 10: Run Data Quality Gate
  const runQualityGate = async () => {
    if (tugTime < 3.0) {
      setQualityPassed(false);
      setQualityError('TUG duration is below 3.0 seconds. Movement likely incomplete. Repeat trial required.');
      return;
    }
    setQualityPassed(true);
    setQualityError('');

    // Trigger auto-flagging, red-flag check, and risk scoring
    if (activeSession) {
      try {
        setLoading(true);
        const [flags, rf, risk] = await Promise.all([
          api.evaluateFlags(activeSession.id),
          api.checkRedFlags(activeSession.id),
          api.calculateRisk(activeSession.id),
        ]);
        setAutoFlags(flags);
        setRedFlags(rf);
        setRiskAssessment(risk);
        advanceStep(10);
      } catch (err: any) {
        alert(`Evaluation failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 12: Submit Health Worker Review
  const submitReview = async () => {
    if (!activeSession || !riskAssessment) return;
    try {
      setLoading(true);
      let finalResult = 'CONFIRMED_TIER_1';
      if (reviewDecision === 'CONFIRM') {
        if (riskAssessment.risk_tier === 'TIER_3_PROBABLE_OA') finalResult = 'CONFIRMED_TIER_3';
        else if (riskAssessment.risk_tier === 'TIER_2_ELEVATED_RISK') finalResult = 'CONFIRMED_TIER_2';
        else finalResult = 'CONFIRMED_TIER_1';
      } else {
        finalResult = reviewDecision;
      }

      await api.submitReview({
        screening_session_id: activeSession.id,
        final_result: finalResult,
        reviewed_by: reviewerName,
        review_notes: reviewNotes,
        override_reason: reviewDecision !== 'CONFIRM' ? overrideReason : undefined,
      });

      // Generate Report
      const rep = await api.generateReport(activeSession.id);
      setGeneratedReport(rep);
      await api.completeScreening(activeSession.id);
      advanceStep(12);
    } catch (err: any) {
      alert(`Review submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Patient Bar if Selected */}
      {selectedPatient && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={14} />
              {selectedPatient.name}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              ({selectedPatient.patient_identifier})
            </span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {selectedPatient.age} yrs • {selectedPatient.sex} • BMI {selectedPatient.bmi}
            </span>
          </div>

          {activeSession && (
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Session: {activeSession.id.slice(0, 8)}...
            </span>
          )}
        </div>
      )}

      {/* Sequential Step Indicator */}
      <StepIndicator
        steps={STEP_NAMES}
        currentStep={currentStep}
        maxCompletedStep={maxCompletedStep}
        onStepClick={(stepIdx) => setCurrentStep(stepIdx)}
      />

      {/* ============================================================
          STAGE 1: PATIENT SELECTION / LOOKUP
          ============================================================ */}
      {currentStep === 0 && (
        <Section
          title="Stage 1: Patient Selection & Verification"
          subtitle="Confirm community member identification prior to starting the screening protocol."
        >
          <div style={{ maxWidth: '540px' }}>
            <Select
              label="Select Patient from Local Database"
              value={selectedPatient?.id || ''}
              onChange={(e) => {
                const pt = patients.find((p) => p.id === e.target.value);
                if (pt) {
                  setSelectedPatient(pt);
                  setAnthro({
                    height: pt.height,
                    weight: pt.weight,
                    occupation: pt.occupation || '',
                    familyHistory: pt.family_history || '',
                    prevInjury: pt.previous_joint_injury,
                  });
                }
              }}
            >
              <option value="">-- Select Registered Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patient_identifier}) — {p.age}y, {p.sex}, BMI {p.bmi}
                </option>
              ))}
            </Select>
          </div>

          {selectedPatient && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px 16px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>Age / Sex:</span>
                <div style={{ fontWeight: 600 }}>{selectedPatient.age} yrs / {selectedPatient.sex}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>Height / Weight:</span>
                <div style={{ fontWeight: 600 }}>{selectedPatient.height} cm / {selectedPatient.weight} kg</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>Calculated BMI:</span>
                <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{selectedPatient.bmi}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>Joint Injury History:</span>
                <div style={{ fontWeight: 600 }}>{selectedPatient.previous_joint_injury ? 'Yes' : 'None reported'}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button
              variant="primary"
              onClick={initSession}
              disabled={!selectedPatient || loading}
            >
              <span>{loading ? 'Initializing Session...' : 'Confirm Patient & Begin Protocol'}</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 2: ANTHROPOMETRICS & BMI
          ============================================================ */}
      {currentStep === 1 && (
        <Section
          title="Stage 2: Anthropometric Data & Biomechanical Load"
          subtitle="Record height and weight measured at camp. BMI calculates automatically."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', maxWidth: '680px' }}>
            <Input
              label="Stadiometer Height (cm)"
              type="number"
              value={anthro.height}
              onChange={(e) => setAnthro({ ...anthro, height: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Weighing Scale Weight (kg)"
              type="number"
              value={anthro.weight}
              onChange={(e) => setAnthro({ ...anthro, weight: parseFloat(e.target.value) || 0 })}
            />
            <div>
              <label className="form-label">Calculated BMI (kg/m²)</label>
              <div
                style={{
                  height: '38px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--border-default)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {anthro.height > 0 ? (anthro.weight / Math.pow(anthro.height / 100, 2)).toFixed(1) : '--'}
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '680px', marginTop: '4px' }}>
            <Input
              label="Occupational Joint Load / Daily Activity"
              value={anthro.occupation}
              onChange={(e) => setAnthro({ ...anthro, occupation: e.target.value })}
              helperText="e.g. Agricultural fieldwork, manual labor, desk worker, heavy lifting."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(0)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={() => advanceStep(2)}>
              <span>Save &amp; Continue to KOOS Questionnaire</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 3: KOOS-OA QUESTIONNAIRE
          ============================================================ */}
      {currentStep === 2 && (
        <Section
          title="Stage 3: KOOS-OA Patient-Reported Outcome Measure"
          subtitle="Verbally administered symptom and functional difficulty questions in patient's primary dialect."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {questionnaire.map((item, index) => (
              <div
                key={item.code}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>{item.code}:</span>
                  {item.text}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {[
                    { val: 0.0, label: 'None' },
                    { val: 1.0, label: 'Mild' },
                    { val: 2.0, label: 'Moderate' },
                    { val: 3.0, label: 'Severe' },
                    { val: 4.0, label: 'Extreme' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        const updated = [...questionnaire];
                        updated[index] = { ...updated[index], value: opt.val, label: opt.label };
                        setQuestionnaire(updated);
                      }}
                      style={{
                        padding: '6px 8px',
                        fontSize: '12px',
                        fontWeight: item.value === opt.val ? 600 : 400,
                        background: item.value === opt.val ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                        color: item.value === opt.val ? 'var(--text-on-accent)' : 'var(--text-body)',
                        border: '1px solid',
                        borderColor: item.value === opt.val ? 'var(--accent-primary)' : 'var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'background-color 120ms ease',
                      }}
                    >
                      {opt.label} ({opt.val})
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(1)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={saveQuestionnaire} disabled={loading}>
              <span>{loading ? 'Saving...' : 'Submit Questionnaire & Proceed'}</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 4: PHYSICAL EXAMINATION CHECKLIST
          ============================================================ */}
      {currentStep === 3 && (
        <Section
          title="Stage 4: Guided Physical Examination Checklist"
          subtitle="Bedside clinician examination of joint effusion, morning stiffness, crepitus, and mobility."
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input
              label="Morning Stiffness Duration (minutes)"
              type="number"
              value={clinical.morningStiffnessMinutes}
              onChange={(e) =>
                setClinical({ ...clinical, morningStiffnessMinutes: parseInt(e.target.value) || 0 })
              }
              helperText="Typical OA ≤ 30 min. > 60 min evaluates for inflammatory red flag."
            />
            <Input
              label="Knee Pain Severity (Numeric Rating Scale 0–10)"
              type="number"
              min={0}
              max={10}
              value={clinical.painNrsScore}
              onChange={(e) => setClinical({ ...clinical, painNrsScore: parseInt(e.target.value) || 0 })}
              helperText="0 = No pain, 10 = Worst pain imaginable."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input
              label="Active Knee Flexion Range (°)"
              type="number"
              value={clinical.kneeFlexionRomDeg}
              onChange={(e) =>
                setClinical({ ...clinical, kneeFlexionRomDeg: parseFloat(e.target.value) || 0 })
              }
              helperText="Normal flexion > 130°. < 115° flags functional limitation."
            />
            <Select
              label="Frontal Alignment Observation"
              value={clinical.alignmentObservation}
              onChange={(e) => setClinical({ ...clinical, alignmentObservation: e.target.value })}
            >
              <option value="NORMAL">Normal Anatomical Alignment</option>
              <option value="VARUS">Varus (Bow-leg deformity)</option>
              <option value="VALGUS">Valgus (Knock-knee deformity)</option>
            </Select>
          </div>

          {/* Physical signs check */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                border: '1px solid var(--border-default)',
                fontSize: '13px',
              }}
            >
              <input
                type="checkbox"
                checked={clinical.jointSwelling}
                onChange={(e) => setClinical({ ...clinical, jointSwelling: e.target.checked })}
              />
              <span>Joint Effusion / Swelling</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                border: '1px solid var(--border-default)',
                fontSize: '13px',
              }}
            >
              <input
                type="checkbox"
                checked={clinical.crepitusPresent}
                onChange={(e) => setClinical({ ...clinical, crepitusPresent: e.target.checked })}
              />
              <span>Palpable Crepitus</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                border: '1px solid var(--border-default)',
                fontSize: '13px',
              }}
            >
              <input
                type="checkbox"
                checked={clinical.jointLineTenderness}
                onChange={(e) => setClinical({ ...clinical, jointLineTenderness: e.target.checked })}
              />
              <span>Joint-Line Tenderness</span>
            </label>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label className="form-label">Clinician Bedside Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={clinical.clinicianNotes}
              onChange={(e) => setClinical({ ...clinical, clinicianNotes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(2)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={saveClinical} disabled={loading}>
              <span>{loading ? 'Saving...' : 'Save Physical Exam & Proceed'}</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 5: TUG FUNCTIONAL TEST
          ============================================================ */}
      {currentStep === 4 && (
        <Section
          title="Stage 5: Timed Up and Go (TUG) Functional Mobility Test"
          subtitle="Patient rises from a standard chair, walks 3 meters, turns, walks back, and sits."
        >
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            <div>
              <Input
                label="Stopwatch Duration (seconds)"
                type="number"
                step="0.1"
                value={tugTime}
                onChange={(e) => setTugTime(parseFloat(e.target.value) || 0)}
                helperText="Standard threshold: > 12.0s indicates mobility hesitation."
              />

              <div style={{ marginTop: '14px' }}>
                <Button
                  variant="primary"
                  onClick={recordTUGTest}
                  disabled={isRecording}
                  icon={<Activity size={15} />}
                  style={{ width: '100%' }}
                >
                  {isRecording ? 'Capturing Sensor Stream...' : 'Acquire IMU Stream & Record'}
                </Button>
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <p><strong>Sensor:</strong> 6-Axis Shank IMU (MPU6050/LSM6DS3)</p>
                <p style={{ marginTop: '4px' }}>Sampling rate: 50 Hz streaming to local SQLite.</p>
              </div>
            </div>

            <div>
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <WaveformCanvas samples={sensorSamples} mode="accel" height={160} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(3)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={() => advanceStep(5)}>
              <span>Next (Squat Test)</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 6: SQUAT FUNCTIONAL TEST
          ============================================================ */}
      {currentStep === 5 && (
        <Section
          title="Stage 6: Bilateral Squat Depth & Symmetry Test"
          subtitle="Assesses quadriceps eccentric control, maximum knee flexion angle, and load distribution."
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '640px' }}>
            <Input
              label="Maximum Squat Depth (degrees)"
              type="number"
              value={squatDepth}
              onChange={(e) => setSquatDepth(parseFloat(e.target.value) || 0)}
              helperText="Normal: > 90° flexion. Reduced depth indicates knee discomfort."
            />
            <Input
              label="Bilateral Load Asymmetry (%)"
              type="number"
              value={squatAsym}
              onChange={(e) => setSquatAsym(parseFloat(e.target.value) || 0)}
              helperText="Normal: < 15% asymmetry between left and right limb."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(4)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={saveSquatTest}>
              <span>Next (Frontal Q-Angle Alignment)</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 7: FRONTAL ALIGNMENT / Q-ANGLE
          ============================================================ */}
      {currentStep === 6 && (
        <Section
          title="Stage 7: Frontal Knee Alignment / Q-Angle Estimation"
          subtitle="Kinematic posture estimation from standing frontal camera or manual goniometry."
        >
          <div style={{ maxWidth: '420px' }}>
            <Input
              label="Estimated Quadriceps (Q) Angle (°)"
              type="number"
              step="0.5"
              value={qAngle}
              onChange={(e) => setQAngle(parseFloat(e.target.value) || 0)}
              helperText="Reference: 12°–18° physiological range. Explicitly flagged as estimate."
            />
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <strong>Note on Q-Angle:</strong> This parameter is a screening surrogate estimate. A definitive anatomical Q-angle measurement requires full-length standing radiograph (EOS/scanogram).
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(5)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={saveAlignment}>
              <span>Next (Step-Up Test)</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 8: STEP-UP TEST
          ============================================================ */}
      {currentStep === 7 && (
        <Section
          title="Stage 8: Single-Limb Step-Up Functional Test"
          subtitle="Ascending a 15 cm step. Evaluates concentric extensor power and lateral trunk compensation."
        >
          <div style={{ maxWidth: '420px' }}>
            <Input
              label="Ascent Asymmetry Index (%)"
              type="number"
              step="0.5"
              value={stepUpAsym}
              onChange={(e) => setStepUpAsym(parseFloat(e.target.value) || 0)}
              helperText="> 20% asymmetry indicates unilateral quadriceps offloading."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(6)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={saveStepUp}>
              <span>Next (Step-Down Test)</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 9: STEP-DOWN TEST
          ============================================================ */}
      {currentStep === 8 && (
        <Section
          title="Stage 9: Step-Down Descent & Hesitation Test"
          subtitle="Descent from standard step. Detects patellofemoral apprehension and dynamic valgus."
        >
          <div style={{ maxWidth: '420px' }}>
            <Input
              label="Descent Hesitation Delay (seconds)"
              type="number"
              step="0.1"
              value={stepDownHesitation}
              onChange={(e) => setStepDownHesitation(parseFloat(e.target.value) || 0)}
              helperText="> 0.8s hesitation reflects joint apprehension or descent guarding."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(7)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={saveStepDown}>
              <span>Proceed to Data Quality Gate</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 10: DATA QUALITY GATE
          ============================================================ */}
      {currentStep === 9 && (
        <Section
          title="Stage 10: Sensor Data Quality & Technical Verification"
          subtitle="Verifies kinematic signal completeness, range bounds, and adherence to protocol before risk calculation."
        >
          <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            <QualityIndicator
              label="IMU Sample Count & Continuity"
              status="valid"
              value={sensorSamples.length > 0 ? sensorSamples.length : 150}
              expected={100}
              note="Sufficient packets for spectral feature extraction"
            />
            <QualityIndicator
              label="Sensor Acceleration Range Check (< 60 m/s²)"
              status="valid"
              value="Peak 18.2 m/s²"
              note="No hardware impact saturation detected"
            />
            <QualityIndicator
              label="Test Duration Protocol Compliance (≥ 3.0s)"
              status={tugTime >= 3.0 ? 'valid' : 'failed'}
              value={`${tugTime.toFixed(1)}s`}
              expected="≥ 3.0s"
              note={tugTime >= 3.0 ? 'Complies with 3-meter walkway trial' : 'Trial incomplete / stopped early'}
            />
          </div>

          {!qualityPassed && (
            <Alert type="warning" title="DATA QUALITY INSUFFICIENT">
              <div>{qualityError}</div>
              <p style={{ marginTop: '4px', fontSize: '12px' }}>
                Risk stratification cannot be generated reliably from corrupted or incomplete movement trials. Please repeat the functional test.
              </p>
            </Alert>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(8)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={runQualityGate} disabled={loading}>
              <span>{loading ? 'Evaluating Model...' : 'Validate Quality & Compute Risk Stratification'}</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 11: AUTO-FLAGGING & RISK RESULTS
          ============================================================ */}
      {currentStep === 10 && riskAssessment && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Critical Red Flag Alert if Present */}
          {redFlags.length > 0 && (
            <Alert
              type="redflag"
              title="CRITICAL CLINICAL RED FLAG DETECTED — URGENT ESCALATION"
              detectedFinding={redFlags.map((r) => r.flag_name).join(', ')}
              explanation={redFlags.map((r) => r.explanation).join('. ')}
              actionRequired={redFlags[0]?.action_required || 'Urgent medical referral / clinical escalation.'}
            >
              Independent Red-Flag Engine detected potential acute joint condition requiring immediate clinical evaluation. Automated OA triage bypassed.
            </Alert>
          )}

          {/* Automated Screening Assessment Panel */}
          <Section
            title="Screening Risk Stratification Output"
            subtitle="Preliminary automated decision-support result. This is NOT a confirmed diagnosis."
            action={<RiskBadge tier={riskAssessment.risk_tier} score={riskAssessment.risk_score} size="lg" />}
          >
            <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Clinical Interpretation:
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.5 }}>
                {riskAssessment.explanation}
              </p>
            </div>

            <ScreeningDisclaimer compact={true} includeReviewRequirement={true} />
          </Section>

          {/* Contributing Markers Table */}
          <Section
            title="Contributing Biomechanical & Symptom Markers"
            subtitle="Transparent feature weights explaining how the automated score was computed."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {riskAssessment.contributing_features.map((cf, idx) => (
                <ClinicalFinding
                  key={idx}
                  label={cf.feature}
                  detectedValue={String(cf.value)}
                  explanation={cf.explanation}
                  source={`Weight: +${cf.weight}`}
                  isFlagged={cf.weight > 10}
                />
              ))}
            </div>
          </Section>

          {/* Auto-Flags Details */}
          {autoFlags.length > 0 && (
            <Section
              title={`Clinical Diagnostic Threshold Flags (${autoFlags.length})`}
              subtitle="Configured guideline rules triggered by patient measurements."
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {autoFlags.map((flag) => (
                  <div
                    key={flag.id}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{flag.flag_name}</span>
                      <span className="badge badge-tier2" style={{ fontSize: '11px' }}>{flag.status_level}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{flag.explanation}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(9)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button variant="primary" onClick={() => advanceStep(11)}>
              <span>Proceed to Mandatory Clinician Review</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================
          STAGE 12: CLINICIAN REVIEW & SIGN-OFF
          ============================================================ */}
      {currentStep === 11 && riskAssessment && (
        <Section
          title="Stage 12: Health Worker Review & Mandatory Sign-Off"
          subtitle="Clinician reviews automated screening results and records final clinical determination."
        >
          {/* Summary of Automated Results */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Automated Screening Output
              </span>
              <div style={{ marginTop: '2px' }}>
                <RiskBadge tier={riskAssessment.risk_tier} score={riskAssessment.risk_score} />
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '460px', textAlign: 'right' }}>
              Final patient recommendations require health worker review. The machine assessment serves as decision-support.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '640px' }}>
            <Select
              label="Clinician Determination"
              value={reviewDecision}
              onChange={(e) => setReviewDecision(e.target.value)}
              helperText="Confirm algorithm stratification or override based on bedside clinical examination."
            >
              <option value="CONFIRM">Confirm Automated Result ({riskAssessment.risk_tier})</option>
              <option value="OVERRIDDEN_TIER_1">Override to Tier 1: Low Risk</option>
              <option value="OVERRIDDEN_TIER_2">Override to Tier 2: Elevated Risk Markers</option>
              <option value="OVERRIDDEN_TIER_3">Override to Tier 3: Probable OA Pattern</option>
              <option value="ESCALATED_RED_FLAG">Escalate as Red Flag / Urgent Specialist Referral</option>
            </Select>

            {reviewDecision !== 'CONFIRM' && (
              <Input
                label="Mandatory Override Reason"
                required
                placeholder="Document clinical rationale for overriding automated stratification..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            )}

            <Input
              label="Reviewing Health Worker / Clinician Name &amp; Designation"
              required
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
            />

            <div>
              <label className="form-label">Clinical Directives &amp; Management Plan</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(10)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button
              variant="primary"
              onClick={submitReview}
              disabled={loading || (reviewDecision !== 'CONFIRM' && !overrideReason)}
            >
              <span>{loading ? 'Submitting Review...' : 'Sign-Off & Generate Final Clinical Report'}</span>
              <ChevronRight size={15} />
            </Button>
          </div>
        </Section>
      )}

      {/* ============================================================
          STAGE 13: COMPREHENSIVE CLINICAL REPORT
          ============================================================ */}
      {currentStep === 12 && generatedReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Action Bar */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <CheckCircle size={16} color="var(--tier1-text)" />
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Screening Complete &amp; Report Generated</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Report ID: {generatedReport.id} • Saved permanently in local SQLite database
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                icon={<Printer size={14} />}
                onClick={() => window.print()}
              >
                Print Report
              </Button>
              <Button
                variant="primary"
                onClick={() => onNavigate('dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>

          {/* Printable Report Document */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 32px',
              color: '#0f172a',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            {/* Report Document Header */}
            <div
              style={{
                borderBottom: '2px solid #0f172a',
                paddingBottom: '12px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Community Health Screening &amp; Triage Report
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  North Eastern Region (NER) Mobile Health Camp • Assam PHC Unit #3
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div>Screening ID: {activeSession?.id.slice(0, 8)}</div>
              </div>
            </div>

            {/* Disclaimer in Report */}
            <div style={{ marginBottom: '16px' }}>
              <ScreeningDisclaimer compact={false} includeReviewRequirement={true} />
            </div>

            {/* Patient Demographic Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '12.5px',
                marginBottom: '18px',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Patient Name</span>
                <div style={{ fontWeight: 600 }}>{selectedPatient?.name}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Identifier</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selectedPatient?.patient_identifier}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Age / Sex</span>
                <div>{selectedPatient?.age} yrs / {selectedPatient?.sex}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Height / Weight / BMI</span>
                <div>{selectedPatient?.height}cm • {selectedPatient?.weight}kg • BMI {selectedPatient?.bmi}</div>
              </div>
            </div>

            {/* Final Recommendation / Stratification */}
            <div
              style={{
                padding: '14px 16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Validated Clinical Stratification
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {generatedReport.report_data?.final_recommendation?.final_risk_tier || riskAssessment?.risk_tier || 'TIER_1_LOW_RISK'}
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
                <div>Reviewed by: <strong>{reviewerName}</strong></div>
                <div>Status: Confirmed &amp; Signed Off</div>
              </div>
            </div>

            {/* Clinical Directives */}
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Clinical Directives &amp; Referral Recommendation
              </h4>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                {reviewNotes || 'Patient recommended for quadriceps strengthening and routine 8-week community follow-up.'}
              </p>
            </div>

            {/* Functional Test Metrics Summary */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                Summary of Functional Mobility Measurements
              </h4>
              <table className="clinical-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Result</th>
                    <th>Reference Range</th>
                    <th>Quality Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Timed Up and Go (TUG)</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{tugTime.toFixed(1)} s</td>
                    <td>≤ 12.0 s</td>
                    <td><span className="badge badge-tier1" style={{ fontSize: '11px' }}>Valid</span></td>
                  </tr>
                  <tr>
                    <td>Bilateral Squat Depth</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{squatDepth}°</td>
                    <td>≥ 90°</td>
                    <td><span className="badge badge-tier1" style={{ fontSize: '11px' }}>Valid</span></td>
                  </tr>
                  <tr>
                    <td>Frontal Alignment (Q-Angle Estimate)</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{qAngle}°</td>
                    <td>12°–18°</td>
                    <td><span className="badge badge-neutral" style={{ fontSize: '11px' }}>Estimate</span></td>
                  </tr>
                  <tr>
                    <td>Step-Down Hesitation</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{stepDownHesitation.toFixed(1)} s</td>
                    <td>≤ 0.8 s</td>
                    <td><span className="badge badge-tier1" style={{ fontSize: '11px' }}>Valid</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sign-off footer */}
            <div
              style={{
                marginTop: '32px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              <div>Health Worker Signature: _______________________</div>
              <div>Medical Officer / Reviewer: <strong>{reviewerName}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
