import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ScreeningSession, Patient, RiskAssessment } from '../api/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskBadge } from '../components/common/RiskBadge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Search, Plus, Filter, FileText } from 'lucide-react';
import { NavItem } from '../components/layout/Sidebar';

interface ScreeningListPageProps {
  onSelectSession: (session: ScreeningSession) => void;
  onNavigate: (tab: NavItem) => void;
}

export const ScreeningListPage: React.FC<ScreeningListPageProps> = ({ onSelectSession, onNavigate }) => {
  const [screenings, setScreenings] = useState<ScreeningSession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [risks, setRisks] = useState<Record<string, RiskAssessment>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [scList, ptList] = await Promise.all([api.getScreenings(), api.getPatients()]);
      setScreenings(scList);
      setPatients(ptList);

      const riskMap: Record<string, RiskAssessment> = {};
      for (const sc of scList) {
        try {
          const r = await api.getRisk(sc.id);
          if (r) riskMap[sc.id] = r;
        } catch {}
      }
      setRisks(riskMap);
    } catch (err) {
      console.error('Failed to load screenings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredScreenings = screenings.filter((sc) => {
    if (statusFilter !== 'ALL' && sc.screening_status !== statusFilter) return false;
    const r = risks[sc.id];
    if (riskFilter !== 'ALL') {
      if (!r && riskFilter !== 'UNSTRATIFIED') return false;
      if (r && r.risk_tier !== riskFilter) return false;
    }
    const pt = patients.find((p) => p.id === sc.patient_id);
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (pt && (pt.name.toLowerCase().includes(q) || pt.patient_identifier.toLowerCase().includes(q))) ||
      sc.id.toLowerCase().includes(q) ||
      (sc.operator_name && sc.operator_name.toLowerCase().includes(q)) ||
      (sc.camp_location && sc.camp_location.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Primary Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Screening Sessions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            Historical screening records stored locally in SQLite.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={() => onNavigate('new-screening')}
        >
          + New Screening
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search patient, ID, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              width: '100%',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-secondary)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Data Completed</option>
              <option value="REVIEWED">Clinician Reviewed</option>
              <option value="QUALITY_INSUFFICIENT">Quality Insufficient</option>
            </select>
          </div>

          {/* Risk Tier Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontSize: '12.5px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="TIER_1_LOW_RISK">Tier 1: Low Risk</option>
            <option value="TIER_2_ELEVATED_RISK">Tier 2: Elevated Risk</option>
            <option value="TIER_3_PROBABLE_OA">Tier 3: Probable OA</option>
          </select>
        </div>
      </div>

      {/* Clinical Table Container */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Loading local screening sessions...
          </div>
        ) : filteredScreenings.length === 0 ? (
          <EmptyState
            title="No screening sessions found"
            description={
              search || statusFilter !== 'ALL' || riskFilter !== 'ALL'
                ? 'No records match the current filter criteria.'
                : 'No community screenings have been recorded in this catchment area yet.'
            }
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => onNavigate('new-screening')}
              >
                Initiate New Screening
              </Button>
            }
          />
        ) : (
          <table className="clinical-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Patient ID</th>
                <th>Patient</th>
                <th>Date &amp; Time</th>
                <th>Camp / Location</th>
                <th>Status</th>
                <th>Risk Tier</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScreenings.map((sc) => {
                const pt = patients.find((p) => p.id === sc.patient_id);
                const risk = risks[sc.id];

                return (
                  <tr key={sc.id}>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12.5px',
                        color: 'var(--accent-secondary-hover)',
                        fontWeight: 500,
                      }}
                    >
                      {pt ? pt.patient_identifier : sc.patient_id.slice(0, 8)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pt ? pt.name : 'Unknown Patient'}
                      </div>
                      {pt && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {pt.age} yrs • {pt.sex}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {new Date(sc.started_at).toLocaleDateString()}{' '}
                      <span style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>
                        {new Date(sc.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-body)' }}>
                      {sc.camp_location || 'Community Center'}
                    </td>
                    <td>
                      <StatusBadge status={sc.screening_status} size="sm" />
                    </td>
                    <td>
                      <RiskBadge tier={risk?.risk_tier} score={risk?.risk_score} size="sm" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<FileText size={13} />}
                        onClick={() => onSelectSession(sc)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
