import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Patient, PatientCreate } from '../api/types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Search, Plus, Play } from 'lucide-react';

interface PatientsPageProps {
  onStartScreening: (patient: Patient) => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({ onStartScreening }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<PatientCreate>({
    name: '',
    age: 50,
    sex: 'FEMALE',
    height: 160,
    weight: 65,
    occupation: 'Agricultural / Fieldwork',
    family_history: 'None reported',
    previous_joint_injury: false,
  });

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPt = await api.createPatient(formData);
      setPatients([newPt, ...patients]);
      setShowModal(false);
      // Reset form
      setFormData({
        name: '',
        age: 50,
        sex: 'FEMALE',
        height: 160,
        weight: 65,
        occupation: 'Agricultural / Fieldwork',
        family_history: 'None reported',
        previous_joint_injury: false,
      });
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  const calculatedBmi =
    formData.height > 0
      ? Number((formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1))
      : 0;

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patient_identifier.toLowerCase().includes(search.toLowerCase()) ||
      (p.occupation && p.occupation.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Primary Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Patient Directory
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            Registered community members in active screening catchment area.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={() => setShowModal(true)}
        >
          Register Patient
        </Button>
      </div>

      {/* Search Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <Search size={16} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search by patient name, identifier, or occupation..."
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

      {/* Patients Clinical Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Loading patients from local SQLite database...
          </div>
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            title="No patients match search criteria"
            description="Register a new community member or adjust the search query."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowModal(true)}
              >
                Register New Patient
              </Button>
            }
          />
        ) : (
          <table className="clinical-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Patient ID</th>
                <th>Full Name</th>
                <th>Age / Sex</th>
                <th>Height / Weight</th>
                <th>BMI</th>
                <th>Occupation / Daily Activity</th>
                <th>Joint Injury</th>
                <th style={{ textAlign: 'right', width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12.5px',
                      color: 'var(--accent-secondary-hover)',
                      fontWeight: 500,
                    }}
                  >
                    {p.patient_identifier}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-body)' }}>
                    {p.age} yrs • {p.sex}
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-body)' }}>
                    {p.height} cm / {p.weight} kg
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        color: p.bmi >= 25.0 ? 'var(--tier2-text)' : 'var(--text-primary)',
                      }}
                    >
                      {p.bmi}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-body)' }}>
                    {p.occupation || 'Fieldwork'}
                  </td>
                  <td>
                    <span
                      className={`badge ${p.previous_joint_injury ? 'badge-tier2' : 'badge-neutral'}`}
                      style={{ fontSize: '11px' }}
                    >
                      {p.previous_joint_injury ? 'Prior Injury' : 'None'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Play size={12} />}
                      onClick={() => onStartScreening(p)}
                    >
                      Start Screening
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register New Community Patient"
        subtitle="Demographic baseline for community screening camp. Identifier is assigned automatically."
      >
        <form onSubmit={handleRegister}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              label="Full Name"
              required
              placeholder="e.g. Maya Baruah"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Age (years)"
                type="number"
                required
                min={18}
                max={110}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
              />

              <Select
                label="Biological Sex"
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <Input
                label="Height (cm)"
                type="number"
                required
                min={80}
                max={230}
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
              />

              <Input
                label="Weight (kg)"
                type="number"
                required
                min={25}
                max={220}
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
              />

              <div>
                <label className="form-label">Calculated BMI</label>
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
                    color: calculatedBmi >= 25.0 ? 'var(--tier2-text)' : 'var(--accent-primary)',
                    border: '1px solid var(--border-default)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {calculatedBmi || '--'}
                </div>
              </div>
            </div>

            <Input
              label="Occupation / Daily Physical Workload"
              placeholder="e.g. Tea garden plucker, weaver, farmer, office work"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />

            <Input
              label="Family History of Joint Pain"
              placeholder="e.g. Mother had severe knee OA, None reported"
              value={formData.family_history}
              onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
            />

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                border: '1px solid var(--border-default)',
                fontSize: '13px',
              }}
            >
              <input
                type="checkbox"
                checked={formData.previous_joint_injury}
                onChange={(e) => setFormData({ ...formData, previous_joint_injury: e.target.checked })}
              />
              <span>History of Prior Knee / Joint Trauma or Surgery</span>
            </label>
          </div>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save &amp; Register Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
