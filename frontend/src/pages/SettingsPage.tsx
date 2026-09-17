import React, { useState } from 'react';
import { api } from '../api/client';
import { SimulationResult } from '../api/types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Section } from '../components/common/Section';
import { RiskBadge } from '../components/common/RiskBadge';
import { Database, CheckCircle } from 'lucide-react';
import { NavItem } from '../components/layout/Sidebar';

interface SettingsPageProps {
  onNavigate: (tab: NavItem, context?: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [operator, setOperator] = useState('Dr. P. Saikia (Community MO)');
  const [campLocation, setCampLocation] = useState('Assam PHC Community Camp #3');
  const [simulating, setSimulating] = useState(false);
  const [lastSimResult, setLastSimResult] = useState<SimulationResult | null>(null);

  const handleRunSim = async (scenario: string) => {
    setSimulating(true);
    setLastSimResult(null);
    try {
      const res = await api.runSimulation(scenario, operator);
      setLastSimResult(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Workstation Settings &amp; Offline Diagnostics
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
          Local SQLite database status, camp parameters, and offline hardware pipeline testing.
        </p>
      </div>

      {/* Offline Database Status Section */}
      <Section
        title="System Status &amp; Offline Architecture"
        subtitle="Verification of zero-cloud, standalone local device operation."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--tier1-bg)',
              border: '1px solid var(--tier1-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--tier1-text)',
            }}
          >
            <Database size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Standalone SQLite Database Engine
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--tier1-text)', fontWeight: 600 }}>
              ● ACTIVE &amp; OPERATIONAL (SQLITE 3 WITH ALEMBIC MIGRATIONS)
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12.5px' }}>
          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Database File</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: '2px', color: 'var(--accent-primary)' }}>
              backend/data/oa_screening.db
            </div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>ORM / Migrations</span>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>
              SQLAlchemy 2.x + Alembic
            </div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Internet Requirement</span>
            <div style={{ fontWeight: 600, color: 'var(--tier1-text)', marginTop: '2px' }}>
              0% (100% Offline Capable)
            </div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Cloud Sync</span>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Local Standalone Mode (No Cloud)
            </div>
          </div>
        </div>
      </Section>

      {/* Camp Deployment Configuration */}
      <Section
        title="Active Camp Deployment Parameters"
        subtitle="Health worker identity and mobile camp station identifier."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '720px' }}>
          <Input
            label="Active Camp Location / Unit Identifier"
            value={campLocation}
            onChange={(e) => setCampLocation(e.target.value)}
            helperText="Recorded on all new screening session headers and printed reports."
          />

          <Input
            label="Default Reviewing Health Worker / Medical Officer"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            helperText="Default signatory assigned to clinical sign-off determinations."
          />
        </div>
      </Section>

      {/* Simulation & Clinical Verification Suite */}
      <Section
        title="Clinical Scenario Simulation &amp; Pipeline Testing"
        subtitle="Generate synthetic patient cohorts and 6-axis IMU movement packets to test triage rules without hardware."
      >
        {simulating && (
          <div style={{ color: 'var(--accent-secondary)', fontSize: '13px', marginBottom: '10px', fontWeight: 600 }}>
            Simulating patient demographics, KOOS scores, and IMU sensor stream...
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <button
            type="button"
            onClick={() => handleRunSim('LOW_RISK')}
            disabled={simulating}
            style={scenarioButtonStyle}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--tier1-text)', fontSize: '10px' }}>●</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Scenario 1: Low Risk</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Healthy adult (46y). Fast TUG (&lt;10s), normal ROM (&gt;130°). Resolves to Tier 1.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleRunSim('ELEVATED_RISK')}
            disabled={simulating}
            style={scenarioButtonStyle}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--tier2-text)', fontSize: '10px' }}>●</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Scenario 2: Elevated Markers</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Manual worker (58y). TUG 13.4s, mild crepitus, BMI 28.5. Resolves to Tier 2.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleRunSim('PROBABLE_OA')}
            disabled={simulating}
            style={scenarioButtonStyle}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--tier3-text)', fontSize: '10px' }}>●</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Scenario 3: Probable OA</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Elderly farmer (67y). TUG 17.5s, restricted flexion (102°), varus alignment. Resolves to Tier 3.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleRunSim('RED_FLAG_SEPTIC')}
            disabled={simulating}
            style={scenarioButtonStyle}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--redflag-text)', fontSize: '10px' }}>●</span>
              <strong style={{ fontSize: '13px', color: 'var(--redflag-text)' }}>Scenario 4: Red Flag Alert</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Hot swollen joint, unremitting rest pain, zero weight bearing. Bypasses triage to urgent escalation.
            </p>
          </button>
        </div>

        {/* Simulation Output Card */}
        {lastSimResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <CheckCircle size={15} color="var(--tier1-text)" />
                <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
                  Simulation Finished: {lastSimResult.patient_identifier} ({lastSimResult.scenario.replace(/_/g, ' ')})
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Session ID: {lastSimResult.screening_id.slice(0, 8)}... • Automated Stratification:
                <span style={{ marginLeft: '6px' }}>
                  <RiskBadge tier={lastSimResult.risk_tier} score={lastSimResult.risk_score} size="sm" />
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('screenings', { sessionId: lastSimResult.screening_id })}
            >
              View Generated Session
            </Button>
          </div>
        )}
      </Section>
    </div>
  );
};

const scenarioButtonStyle: React.CSSProperties = {
  padding: '12px 14px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, background-color 150ms ease',
};
