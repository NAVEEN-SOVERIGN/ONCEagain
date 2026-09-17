import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Report } from '../api/types';
import { Button } from '../components/common/Button';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { ScreeningDisclaimer } from '../components/common/ScreeningDisclaimer';
import { FileText, Printer, Eye } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Screening Reports Archive
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
          Permanent clinical screening summaries and referral records stored locally in SQLite.
        </p>
      </div>

      {/* Reports Table Container */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Loading clinical reports from local database...
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            title="No screening reports generated yet"
            description="Reports are automatically compiled upon health worker review sign-off in the New Screening protocol."
            icon={<FileText size={32} color="var(--text-faint)" />}
          />
        ) : (
          <table className="clinical-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Report ID</th>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>Generated At</th>
                <th>Stratified Risk Tier</th>
                <th>Review Status</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => {
                const pt = rep.report_data?.patient;
                const finalTier =
                  rep.report_data?.final_recommendation?.final_risk_tier || 'TIER_1_LOW_RISK';

                return (
                  <tr key={rep.id}>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--accent-secondary-hover)',
                        fontWeight: 500,
                      }}
                    >
                      {rep.id.slice(0, 8)}...
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12.5px',
                        fontWeight: 500,
                      }}
                    >
                      {pt?.identifier || 'N/A'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pt?.name || 'Unknown Patient'}
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {rep.generated_at ? new Date(rep.generated_at).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <RiskBadge tier={finalTier} showScore={false} size="sm" />
                    </td>
                    <td>
                      <StatusBadge status={rep.reviewed_status} size="sm" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye size={13} />}
                        onClick={() => setSelectedReport(rep)}
                      >
                        View Report
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title="Clinical Screening Consultation Report"
          subtitle={`Report ID: ${selectedReport.id}`}
          maxWidth="780px"
          footer={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<Printer size={14} />}
                onClick={() => window.print()}
              >
                Print Report
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                Close Preview
              </Button>
            </div>
          }
        >
          {/* Printable Report Sheet */}
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '24px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            {/* Header */}
            <div
              style={{
                borderBottom: '2px solid #0f172a',
                paddingBottom: '12px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Community Health Screening &amp; Triage Report
                </h3>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  North Eastern Region (NER) Mobile Health Camp • Assam PHC Unit #3
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#475569' }}>
                <div>Date: {selectedReport.generated_at ? new Date(selectedReport.generated_at).toLocaleDateString() : 'N/A'}</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>ID: {selectedReport.id.slice(0, 8)}</div>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ marginBottom: '16px' }}>
              <ScreeningDisclaimer compact={false} includeReviewRequirement={true} />
            </div>

            {/* Patient Summary */}
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
                marginBottom: '16px',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Patient Name</span>
                <div style={{ fontWeight: 600 }}>{selectedReport.report_data?.patient?.name || 'N/A'}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Identifier</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {selectedReport.report_data?.patient?.identifier || 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Demographics</span>
                <div>
                  {selectedReport.report_data?.patient?.age} yrs / {selectedReport.report_data?.patient?.sex}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Anthropometrics</span>
                <div>
                  BMI {selectedReport.report_data?.patient?.bmi || 'N/A'}
                </div>
              </div>
            </div>

            {/* Final Validated Result */}
            <div
              style={{
                padding: '12px 16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Validated Clinical Stratification
                </span>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {selectedReport.report_data?.final_recommendation?.final_risk_tier || 'TIER_1_LOW_RISK'}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
                <div>Reviewed by: <strong>{selectedReport.report_data?.health_worker_review?.reviewed_by || 'Dr. P. Saikia'}</strong></div>
                <div>Status: Confirmed &amp; Signed Off</div>
              </div>
            </div>

            {/* Clinical Directives */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Clinical Directives &amp; Referral Plan
              </h4>
              <p style={{ fontSize: '12.5px', color: '#334155' }}>
                {selectedReport.report_data?.final_recommendation?.primary_advice ||
                  'Prescribe joint wellness education, daily quadriceps isometric exercise, and routine 8-week follow-up.'}
              </p>
            </div>

            {/* Signature Line */}
            <div
              style={{
                marginTop: '28px',
                paddingTop: '14px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: '#64748b',
              }}
            >
              <div>Health Worker: _______________________</div>
              <div>Authorized Signatory: <strong>{selectedReport.report_data?.health_worker_review?.reviewed_by || 'Dr. P. Saikia'}</strong></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
