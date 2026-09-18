import React, { useState } from 'react';
import { Activity, MapPin, User, ChevronDown } from 'lucide-react';
import { api } from '../../api/client';
import { NavItem } from './Sidebar';

interface HeaderProps {
  currentTab?: NavItem;
  onSimulationComplete?: (result: any) => void;
}

const SECTION_NAMES: Record<NavItem, string> = {
  dashboard: 'Workstation Dashboard',
  patients: 'Patient Directory',
  'new-screening': 'New Patient Screening Protocol',
  screenings: 'Screening Sessions Archive',
  sensors: 'Sensor Live Telemetry',
  'physio-pods': 'Physio Pods (6x) — ESP32 Hardware Deck',
  reports: 'Clinical Reports Archive',
  settings: 'System Settings & Offline Diagnostics',
};

export const Header: React.FC<HeaderProps> = ({ currentTab = 'dashboard', onSimulationComplete }) => {
  const [simulating, setSimulating] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);

  const triggerSimulation = async (scenario: string) => {
    setSimulating(true);
    setShowSimMenu(false);
    try {
      const res = await api.runSimulation(scenario, 'Community Health Worker');
      if (onSimulationComplete) {
        onSimulationComplete(res);
      }
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <header
      style={{
        height: '54px',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      {/* Left: Application Branding & Current Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Activity size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              Osteoarthritis Screening &amp; Triage Workstation
            </h1>
          </div>
        </div>

        <span style={{ color: 'var(--border-medium)', fontSize: '13px' }}>|</span>

        <span
          style={{
            fontSize: '12.5px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          {SECTION_NAMES[currentTab] || 'Clinical Workstation'}
        </span>
      </div>

      {/* Right: Operational Status, Camp, Operator, Simulation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Offline-First Local Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--tier1-text)',
            background: 'var(--tier1-bg)',
            border: '1px solid var(--tier1-border)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 500,
          }}
          title="Zero external cloud database dependencies; all operations save locally to SQLite"
        >
          <span style={{ fontSize: '8px' }}>●</span>
          <span>Offline · Local Database</span>
        </div>

        {/* Camp Location */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <MapPin size={13} color="var(--accent-primary)" />
          <span>Assam PHC Mobile Unit #3</span>
        </div>

        {/* Health Worker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <User size={13} color="var(--accent-primary)" />
          <span>Health Worker (Operator)</span>
        </div>

        {/* Demo / Simulation Tools - Visually segregated from primary clinical actions */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowSimMenu(!showSimMenu)}
            disabled={simulating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 9px',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-medium)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            title="Demo / Testing utility: Generates synthetic patient records to verify clinical algorithms and train operators."
          >
            <span style={{ fontSize: '12px' }}>🧪</span>
            <span>{simulating ? 'Simulating...' : 'Demo / Simulation'}</span>
            <ChevronDown size={12} style={{ opacity: 0.7 }} />
          </button>

          {showSimMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '115%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.12)',
                width: '260px',
                zIndex: 60,
                overflow: 'hidden',
                padding: '6px',
              }}
            >
              <div
                style={{
                  padding: '6px 8px 8px 8px',
                  borderBottom: '1px solid var(--border-default)',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Demo &amp; Testing Utility
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                  Generates synthetic patient records for training &amp; triage verification. Not for live patient care.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => triggerSimulation('LOW_RISK')}
                  style={simMenuItemStyle}
                >
                  <span style={{ color: 'var(--tier1-text)', fontSize: '10px' }}>●</span>
                  <span>Synthetic: Tier 1 Low Risk</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerSimulation('ELEVATED_RISK')}
                  style={simMenuItemStyle}
                >
                  <span style={{ color: 'var(--tier2-text)', fontSize: '10px' }}>●</span>
                  <span>Synthetic: Tier 2 Elevated Risk</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerSimulation('PROBABLE_OA')}
                  style={simMenuItemStyle}
                >
                  <span style={{ color: 'var(--tier3-text)', fontSize: '10px' }}>●</span>
                  <span>Synthetic: Tier 3 Probable OA</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerSimulation('RED_FLAG_SEPTIC')}
                  style={simMenuItemStyle}
                >
                  <span style={{ color: 'var(--redflag-text)', fontSize: '10px' }}>●</span>
                  <span>Synthetic: Red Flag Emergency</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const simMenuItemStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '6px 8px',
  fontSize: '12px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  borderRadius: '4px',
  color: 'var(--text-primary)',
};
