import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ScreeningSession, Patient, RiskAssessment } from '../api/types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Metric } from '../components/common/Metric';
import { Button } from '../components/common/Button';
import { Section } from '../components/common/Section';
import { EmptyState } from '../components/common/EmptyState';
import { ScreeningDisclaimer } from '../components/common/ScreeningDisclaimer';
import {
  Users,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Plus,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { NavItem } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavItem, context?: any) => void;
  onRunSimulation?: (scenario: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [screenings, setScreenings] = useState<ScreeningSession[]>([]);
  const [risks, setRisks] = useState<Record<string, RiskAssessment>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ptData, scData] = await Promise.all([api.getPatients(), api.getScreenings()]);
      setPatients(ptData);
      setScreenings(scData);

      const riskMap: Record<string, RiskAssessment> = {};
      for (const sc of scData) {
        try {
          const r = await api.getRisk(sc.id);
          if (r) riskMap[sc.id] = r;
        } catch {}
      }
      setRisks(riskMap);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute the 5 clinical operational metrics
  const totalPatients = patients.length;
  const screeningsCompleted = screenings.filter((s) => s.screening_status !== 'IN_PROGRESS').length;
  const pendingReviews = screenings.filter((s) => s.screening_status === 'COMPLETED').length;
  const qualityInsufficientCount = screenings.filter((s) => s.screening_status === 'QUALITY_INSUFFICIENT').length;

  let tier1Count = 0;
  let tier2Count = 0;
  let tier3Count = 0;
  let activeRedFlagsCount = 0;

  Object.values(risks).forEach((r) => {
    if (r.risk_tier === 'TIER_1_LOW_RISK') tier1Count++;
    else if (r.risk_tier === 'TIER_2_ELEVATED_RISK') tier2Count++;
    else if (r.risk_tier === 'TIER_3_PROBABLE_OA') tier3Count++;
  });

  // Recent screenings (top 6)
  const recentScreenings = [...screenings].slice(0, 6);

  // Screenings awaiting clinician sign-off
  const awaitingReviewList = screenings.filter((s) => s.screening_status === 'COMPLETED').slice(0, 4);

  const totalStratified = tier1Count + tier2Count + tier3Count;
  const tier1Pct = totalStratified > 0 ? (tier1Count / totalStratified) * 100 : 0;
  const tier2Pct = totalStratified > 0 ? (tier2Count / totalStratified) * 100 : 0;
  const tier3Pct = totalStratified > 0 ? (tier3Count / totalStratified) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Workstation Status Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            NER Community Health Camp • Assam PHC Mobile Unit #3
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            Offline-first early joint risk stratification using validated KOOS questionnaires and functional mobility tests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => onNavigate('new-screening')}
          >
            New Screening
          </Button>
          <Button
            variant="secondary"
            icon={<Activity size={15} />}
            onClick={() => onNavigate('sensors')}
          >
            Live IMU Scope
          </Button>
        </div>
      </div>

      {/* Primary 5 Operational Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}
      >
        <Metric
          label="Total Patients"
          value={totalPatients}
          subtext="Registered in catchment"
          icon={<Users size={18} />}
        />
        <Metric
          label="Screenings Completed"
          value={screeningsCompleted}
          subtext="Protocols finalized"
          status="default"
          icon={<ClipboardCheck size={18} />}
        />
        <Metric
          label="Pending Reviews"
          value={pendingReviews}
          subtext="Awaiting MO sign-off"
          status={pendingReviews > 0 ? 'attention' : 'default'}
          icon={<Clock size={18} />}
        />
        <Metric
          label="Quality Insufficient"
          value={qualityInsufficientCount}
          subtext="Requires re-trial"
          status={qualityInsufficientCount > 0 ? 'attention' : 'default'}
          icon={<AlertTriangle size={18} />}
        />
        <Metric
          label="Active Red Flags"
          value={activeRedFlagsCount}
          subtext="Urgent escalation"
          status={activeRedFlagsCount > 0 ? 'critical' : 'default'}
          icon={<AlertOctagon size={18} />}
        />
      </div>

      {/* Middle Grid: Risk Distribution Summary & Pending Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        {/* Risk Stratification Breakdown */}
        <Section
          title="Screening Risk Stratification Distribution"
          subtitle="Preliminary 3-tier risk markers across current session cohort."
        >
          {/* Visual Distribution Bar */}
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                height: '10px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                display: 'flex',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ width: `${tier1Pct}%`, background: 'var(--tier1-text)', transition: 'width 200ms ease' }} title={`Tier 1: ${tier1Count}`} />
              <div style={{ width: `${tier2Pct}%`, background: 'var(--tier2-text)', transition: 'width 200ms ease' }} title={`Tier 2: ${tier2Count}`} />
              <div style={{ width: `${tier3Pct}%`, background: 'var(--tier3-text)', transition: 'width 200ms ease' }} title={`Tier 3: ${tier3Count}`} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              <span>Total Stratified: {totalStratified} screenings</span>
              <span>Local SQLite Database</span>
            </div>
          </div>

          {/* Tier Counts & Clinical Guidelines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--tier1-bg)',
                border: '1px solid var(--tier1-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
              }}
            >
              <div>
                <strong style={{ color: 'var(--tier1-text)' }}>Tier 1: Low Risk (Preventive)</strong>
                <div style={{ color: 'var(--text-body)', fontSize: '11.5px' }}>Preserved mobility; joint wellness &amp; lifestyle education.</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--tier1-text)' }}>
                {tier1Count}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--tier2-bg)',
                border: '1px solid var(--tier2-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
              }}
            >
              <div>
                <strong style={{ color: 'var(--tier2-text)' }}>Tier 2: Elevated Risk Markers</strong>
                <div style={{ color: 'var(--text-body)', fontSize: '11.5px' }}>Early hesitation / BMI load; targeted exercise &amp; 3-mo follow-up.</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--tier2-text)' }}>
                {tier2Count}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--tier3-bg)',
                border: '1px solid var(--tier3-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
              }}
            >
              <div>
                <strong style={{ color: 'var(--tier3-text)' }}>Tier 3: Probable OA Pattern</strong>
                <div style={{ color: 'var(--text-body)', fontSize: '11.5px' }}>Cluster of age, crepitus, &amp; functional restriction; clinical exam.</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--tier3-text)' }}>
                {tier3Count}
              </span>
            </div>
          </div>
        </Section>

        {/* Pending Reviews / Attention Needed */}
        <Section
          title="Clinician Reviews Requiring Sign-Off"
          subtitle="Screenings with completed data collection awaiting health worker determination."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('screenings')}
            >
              View All
            </Button>
          }
        >
          {awaitingReviewList.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              All completed screening sessions have been reviewed by a health worker.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {awaitingReviewList.map((sc) => {
                const pt = patients.find((p) => p.id === sc.patient_id);
                const r = risks[sc.id];

                return (
                  <div
                    key={sc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12.5px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pt?.name || 'Unknown Patient'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        ID: {pt?.patient_identifier || sc.id.slice(0, 8)} • {new Date(sc.started_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RiskBadge tier={r?.risk_tier} score={r?.risk_score} size="sm" />
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<ChevronRight size={13} />}
                        onClick={() => onNavigate('screenings', { sessionId: sc.id })}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* Recent Screening Sessions Table */}
      <Section
        title="Recent Community Screening Sessions"
        subtitle="Last recorded screening sessions in local SQLite."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('screenings')}
          >
            View Full Archive
          </Button>
        }
      >
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading recent screenings...
          </div>
        ) : recentScreenings.length === 0 ? (
          <EmptyState
            title="No screening sessions recorded yet"
            description="Initiate patient screening to begin collecting clinical mobility and questionnaire markers."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => onNavigate('new-screening')}
              >
                Start New Screening
              </Button>
            }
          />
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                  <th>Screening Risk Tier</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentScreenings.map((sc) => {
                  const pt = patients.find((p) => p.id === sc.patient_id);
                  const r = risks[sc.id];

                  return (
                    <tr key={sc.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--accent-secondary-hover)' }}>
                        {pt ? pt.patient_identifier : sc.patient_id.slice(0, 8)}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pt ? pt.name : 'Unknown Patient'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(sc.started_at).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge status={sc.screening_status} size="sm" />
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
                          View Details
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

      {/* Footer Disclaimer */}
      <ScreeningDisclaimer compact={false} includeReviewRequirement={true} />
    </div>
  );
};
