import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ScreeningSession, Patient, RiskAssessment, RedFlag } from '../api/types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Metric } from '../components/common/Metric';
import { Button } from '../components/common/Button';
import { Section } from '../components/common/Section';
import { ScreeningDisclaimer } from '../components/common/ScreeningDisclaimer';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  AlertOctagon,
  Clock,
  AlertTriangle,
  Activity,
  Plus,
  ChevronRight,
  CheckCircle,
  Database,
  Cpu,
  HardDrive,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { NavItem } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavItem, context?: any) => void;
  onRunSimulation?: (scenario: string) => void;
}

interface RedFlagQueueItem {
  screening: ScreeningSession;
  patient?: Patient;
  redFlag: RedFlag;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [screenings, setScreenings] = useState<ScreeningSession[]>([]);
  const [risks, setRisks] = useState<Record<string, RiskAssessment>>({});
  const [reviews, setReviews] = useState<Record<string, boolean>>({});
  const [activeRedFlags, setActiveRedFlags] = useState<RedFlagQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<{ status: string; database: string }>({
    status: 'healthy',
    database: 'sqlite_ready',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [ptData, scData] = await Promise.all([api.getPatients(), api.getScreenings()]);
      setPatients(ptData);
      setScreenings(scData);

      const ptMap: Record<string, Patient> = {};
      ptData.forEach((p) => {
        ptMap[p.id] = p;
      });

      const riskMap: Record<string, RiskAssessment> = {};
      const reviewMap: Record<string, boolean> = {};
      const redFlagList: RedFlagQueueItem[] = [];

      // Query risks, reviews, and red flags for screenings
      await Promise.all(
        scData.map(async (sc) => {
          try {
            const r = await api.getRisk(sc.id);
            if (r) riskMap[sc.id] = r;
          } catch {}

          try {
            const rev = await api.getReview(sc.id);
            if (rev && rev.id) reviewMap[sc.id] = true;
          } catch {}

          try {
            const flags = await api.getRedFlags(sc.id);
            if (flags && Array.isArray(flags)) {
              flags
                .filter((f) => f.detected)
                .forEach((rf) => {
                  redFlagList.push({
                    screening: sc,
                    patient: ptMap[sc.patient_id],
                    redFlag: rf,
                  });
                });
            }
          } catch {}
        })
      );

      setRisks(riskMap);
      setReviews(reviewMap);
      setActiveRedFlags(redFlagList);

      try {
        const h = await api.checkHealth();
        if (h) setSystemHealth(h);
      } catch {}
    } catch (err) {
      console.error('Failed to load clinical dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter clinical operational attention queues
  // 1. Red Flags: activeRedFlags
  // 2. Pending Health-Worker Reviews: COMPLETED status without review
  const pendingReviewSessions = screenings.filter(
    (s) => s.screening_status === 'COMPLETED' && !reviews[s.id]
  );

  // 3. Quality Failures: QUALITY_INSUFFICIENT
  const qualityFailureSessions = screenings.filter(
    (s) => s.screening_status === 'QUALITY_INSUFFICIENT'
  );

  // 4. Active In-Progress Screenings: IN_PROGRESS
  const inProgressSessions = screenings.filter((s) => s.screening_status === 'IN_PROGRESS');

  const allAttentionQueuesEmpty =
    !loading &&
    activeRedFlags.length === 0 &&
    pendingReviewSessions.length === 0 &&
    qualityFailureSessions.length === 0 &&
    inProgressSessions.length === 0;

  // General statistics scoped to local database / current camp
  const totalPatients = patients.length;
  const completedScreenings = screenings.filter(
    (s) => s.screening_status === 'COMPLETED' || s.screening_status === 'REVIEWED' || reviews[s.id]
  ).length;

  let tier1Count = 0;
  let tier2Count = 0;
  let tier3Count = 0;

  Object.values(risks).forEach((r) => {
    if (r.risk_tier === 'TIER_1_LOW_RISK') tier1Count++;
    else if (r.risk_tier === 'TIER_2_ELEVATED_RISK') tier2Count++;
    else if (r.risk_tier === 'TIER_3_PROBABLE_OA') tier3Count++;
  });

  const recentScreenings = [...screenings].slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Scope & Attention Header Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Clinical Operational Workstation
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                background: 'var(--accent-primary-subtle)',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              ATTENTION QUEUES
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
            }}
          >
            <span>
              <strong>Scope:</strong> Mobile Camp Unit #3 (Assam Catchment)
            </span>
            <span>•</span>
            <span>
              <strong>Temporal Window:</strong> Today / Active Screening Shift
            </span>
            <span>•</span>
            <span>
              <strong>Storage:</strong> Local Standalone SQLite Database
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw size={13} />}
            onClick={loadData}
            title="Refresh local operational queues"
          >
            Refresh Queues
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => onNavigate('new-screening')}
          >
            Start New Screening
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Activity size={14} />}
            onClick={() => onNavigate('sensors')}
          >
            Live IMU Scope
          </Button>
        </div>
      </div>

      {/* SECTION 1: ATTENTION QUEUES (What requires my attention?) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
            Active Clinical Attention Queues
          </h3>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            Prioritized by clinical severity: Red Flags → Reviews → Quality → In-Progress
          </span>
        </div>

        {/* If all attention queues are clear */}
        {allAttentionQueuesEmpty && (
          <div
            style={{
              background: 'var(--tier1-bg)',
              border: '1px solid var(--tier1-border)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <CheckCircle size={22} color="var(--tier1-text)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--tier1-text)' }}>
                All current screenings are up to date.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-body)', marginTop: '2px' }}>
                Zero active red flags, zero pending health-worker reviews, and zero data quality failures in the local database.
              </div>
            </div>
          </div>
        )}

        {/* PRIORITY QUEUE 1: RED FLAGS (Immediate escalation) */}
        {activeRedFlags.length > 0 && (
          <div
            style={{
              background: '#fff1f2',
              border: '1.5px solid var(--redflag-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertOctagon size={18} color="var(--redflag-text)" strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--redflag-text)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Priority 1: Active Red Flags ({activeRedFlags.length}) — Immediate Physician Referral Required
                </span>
              </div>
              <ProvenanceBadge source="CLINICAL_ESCALATION" size="xs" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeRedFlags.map((item, idx) => (
                <div
                  key={`${item.screening.id}-${idx}`}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--redflag-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {item.patient?.name || 'Unknown Patient'}
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        ({item.patient?.patient_identifier || item.screening.patient_id.slice(0, 8)})
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#fff',
                          background: 'var(--redflag-text)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {item.redFlag.severity} ESCALATION
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--redflag-text)', marginTop: '3px', fontWeight: 600 }}>
                      {item.redFlag.flag_name} ({item.redFlag.flag_code})
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <strong>Action Required:</strong> {item.redFlag.action_required || 'Refer immediately for physical medical evaluation.'}
                    </div>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    icon={<ChevronRight size={13} />}
                    onClick={() => onNavigate('screenings', { sessionId: item.screening.id })}
                  >
                    Open Session
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRIORITY QUEUE 2: PENDING HEALTH-WORKER REVIEWS */}
        {pendingReviewSessions.length > 0 && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--tier2-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--tier2-text)" />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--tier2-text)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Priority 2: Pending Health-Worker Reviews ({pendingReviewSessions.length}) — Awaiting Determination
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Requires Attending Clinician Review &amp; Sign-Off
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pendingReviewSessions.slice(0, 4).map((sc) => {
                const pt = patients.find((p) => p.id === sc.patient_id);
                const r = risks[sc.id];

                return (
                  <div
                    key={sc.id}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {pt?.name || 'Unknown Patient'}
                        </span>
                        <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          ID: {pt?.patient_identifier || sc.id.slice(0, 8)}
                        </span>
                        <StatusBadge status="AWAITING_REVIEW" size="sm" />
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Completed at: {sc.completed_at ? new Date(sc.completed_at).toLocaleTimeString() : 'Recently'} • Operator: {sc.operator_name || 'Health Worker'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <RiskBadge tier={r?.risk_tier} score={r?.risk_score} size="sm" />
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<ChevronRight size={13} />}
                        onClick={() => onNavigate('screenings', { sessionId: sc.id })}
                      >
                        Review &amp; Sign-Off
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRIORITY QUEUE 3: QUALITY FAILURES */}
        {qualityFailureSessions.length > 0 && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#b45309" />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#b45309',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Priority 3: Data Quality Failures ({qualityFailureSessions.length}) — Repeat Trial Required
                </span>
              </div>
              <ProvenanceBadge source="SENSOR_DERIVED" validationLevel="PROVISIONAL" size="xs" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {qualityFailureSessions.map((sc) => {
                const pt = patients.find((p) => p.id === sc.patient_id);
                return (
                  <div
                    key={sc.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #fef08a',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {pt?.name || 'Unknown Patient'}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ID: {pt?.patient_identifier || sc.id.slice(0, 8)}
                      </span>
                      <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '2px' }}>
                        Sensor signal saturation or movement artifact detected during mobility protocol.
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('screenings', { sessionId: sc.id })}
                    >
                      Repeat Protocol
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRIORITY QUEUE 4: ACTIVE IN-PROGRESS SCREENINGS */}
        {inProgressSessions.length > 0 && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="var(--accent-secondary)" />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Priority 4: Active In-Progress Screenings ({inProgressSessions.length})
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Sessions started but not yet completed
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {inProgressSessions.map((sc) => {
                const pt = patients.find((p) => p.id === sc.patient_id);
                return (
                  <div
                    key={sc.id}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {pt?.name || 'Unknown Patient'}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ID: {pt?.patient_identifier || sc.id.slice(0, 8)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        Started: {new Date(sc.started_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate('screenings', { sessionId: sc.id })}
                    >
                      Resume Screening
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: GENERAL COHORT STATISTICS (Explicitly Scoped: Current Camp / Local Database) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
            General Cohort Statistics
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Scope: Current Camp Mobile Unit #3 • Local Database
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px',
          }}
        >
          <Metric
            label="Total Catchment"
            value={totalPatients}
            subtext="Registered patients in camp"
            status="default"
          />
          <Metric
            label="Completed Protocols"
            value={completedScreenings}
            subtext="Data collection finalized"
            status="default"
          />
          <Metric
            label="Tier 1 — Low Risk"
            value={tier1Count}
            subtext="Joint education protocol"
            status="default"
          />
          <Metric
            label="Tier 2 — Elevated Markers"
            value={tier2Count}
            subtext="Exercise & 3-mo follow-up"
            status={tier2Count > 0 ? 'attention' : 'default'}
          />
          <Metric
            label="Tier 3 — Probable OA"
            value={tier3Count}
            subtext="Priority clinical exam"
            status={tier3Count > 0 ? 'attention' : 'default'}
          />
        </div>
      </div>

      {/* SECTION 3: RECENT SCREENING ARCHIVE (Compact Table) */}
      <Section
        title="Recent Screenings Archive"
        subtitle="Last 5 records in local database (Mobile Unit #3)."
        action={
          <Button variant="secondary" size="sm" onClick={() => onNavigate('screenings')}>
            View All Screenings
          </Button>
        }
      >
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Loading local records...
          </div>
        ) : recentScreenings.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No screenings recorded in this session yet.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Session Timestamp</th>
                  <th>Screening Status</th>
                  <th>Automated Tier</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentScreenings.map((sc) => {
                  const pt = patients.find((p) => p.id === sc.patient_id);
                  const r = risks[sc.id];
                  const hasReview = reviews[sc.id];

                  return (
                    <tr key={sc.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-secondary-hover)' }}>
                        {pt ? pt.patient_identifier : sc.patient_id.slice(0, 8)}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {pt ? pt.name : 'Unknown Patient'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(sc.started_at).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge
                          status={sc.screening_status}
                          isReviewed={hasReview}
                          size="sm"
                        />
                      </td>
                      <td>
                        <RiskBadge tier={r?.risk_tier} score={r?.risk_score} size="sm" />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onNavigate('screenings', { sessionId: sc.id })}
                        >
                          View Session
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* SECTION 4: COMPACT OPERATIONAL SYSTEM HEALTH */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}
        >
          Workstation Operational Health
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={15} color="var(--tier1-text)" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Database: SQLite 3
              </div>
              <div style={{ fontSize: '11px', color: 'var(--tier1-text)' }}>
                {systemHealth.database === 'sqlite_ready' ? 'Connected & Healthy' : 'Operational'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={15} color="var(--accent-primary)" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Sensor: 6-Axis IMU
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                BLE / Serial Interface Ready
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={15} color="var(--tier1-text)" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Storage: Local Standalone
              </div>
              <div style={{ fontSize: '11px', color: 'var(--tier1-text)' }}>
                Disk Write Persistent
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={15} color="var(--tier1-text)" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Application: v1.0.0
              </div>
              <div style={{ fontSize: '11px', color: 'var(--tier1-text)' }}>
                Offline Screening Workstation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Clinical Screening Disclaimer */}
      <ScreeningDisclaimer compact={false} includeReviewRequirement={true} />
    </div>
  );
};
