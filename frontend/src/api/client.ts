import {
  Patient,
  PatientCreate,
  ScreeningSession,
  ScreeningSessionCreate,
  QuestionnaireBatchInput,
  QuestionnaireResponseItem,
  ClinicalAssessment,
  ClinicalAssessmentCreate,
  FunctionalTest,
  FunctionalTestCreate,
  SensorDevice,
  SensorRecording,
  SensorSample,
  AutoFlag,
  RiskAssessment,
  RedFlag,
  HealthWorkerReview,
  HealthWorkerReviewCreate,
  Report,
  SimulationResult,
  PhysioPodHardwareResponse,
} from './types';

const API_BASE = 'http://localhost:8000/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errDetail = 'Request failed';
      try {
        const errorData = await res.json();
        errDetail = errorData.detail || JSON.stringify(errorData);
      } catch {
        errDetail = `HTTP ${res.status}: ${res.statusText}`;
      }
      throw new Error(errDetail);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; database: string }>('/../../health'),

  // Patients
  getPatients: () => request<Patient[]>('/patients'),
  getPatient: (id: string) => request<Patient>(`/patients/${id}`),
  createPatient: (data: PatientCreate) =>
    request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Screenings
  getScreenings: (patientId?: string) =>
    request<ScreeningSession[]>(patientId ? `/screenings?patient_id=${patientId}` : '/screenings'),
  getScreening: (id: string) => request<ScreeningSession>(`/screenings/${id}`),
  createScreening: (data: ScreeningSessionCreate) =>
    request<ScreeningSession>('/screenings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  completeScreening: (id: string) =>
    request<ScreeningSession>(`/screenings/${id}/complete`, { method: 'PATCH' }),

  // Questionnaires
  submitQuestionnaireBatch: (data: QuestionnaireBatchInput) =>
    request<QuestionnaireResponseItem[]>('/questionnaires/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getQuestionnaire: (screeningId: string) =>
    request<QuestionnaireResponseItem[]>(`/questionnaires/${screeningId}`),

  // Clinical Assessments
  saveClinicalAssessment: (data: ClinicalAssessmentCreate) =>
    request<ClinicalAssessment>('/clinical-assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getClinicalAssessment: (screeningId: string) =>
    request<ClinicalAssessment>(`/clinical-assessments/${screeningId}`),

  // Functional Tests
  createFunctionalTest: (data: FunctionalTestCreate) =>
    request<FunctionalTest>('/functional-tests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getFunctionalTests: (screeningId: string) =>
    request<FunctionalTest[]>(`/functional-tests/${screeningId}`),

  // Sensors & IMU
  getDevices: () => request<SensorDevice[]>('/sensors/devices'),
  registerDevice: (data: { device_id: string; device_type: string; firmware_version?: string }) =>
    request<SensorDevice>('/sensors/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  ingestSensorBatch: (data: any) =>
    request<SensorRecording>('/sensors/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSensorRecordings: (screeningId: string) =>
    request<SensorRecording[]>(`/sensors/recordings/${screeningId}`),
  getSensorSamples: (recordingId: string, limit: number = 200) =>
    request<SensorSample[]>(`/sensors/samples/${recordingId}?limit=${limit}`),
  generateStream: (testType: string = 'TUG', durationSec: number = 4.0, severity: string = 'NORMAL', injectArtifact: boolean = false) =>
    request<{
      test_type: string;
      duration_sec: number;
      sampling_rate_hz: number;
      severity: string;
      sample_count: number;
      samples: SensorSample[];
    }>(`/sensors/generate-stream?test_type=${testType}&duration_sec=${durationSec}&severity=${severity}&inject_artifact=${injectArtifact}`),

  // Auto Flags
  evaluateFlags: (screeningId: string) =>
    request<AutoFlag[]>(`/flags/evaluate/${screeningId}`, { method: 'POST' }),
  getFlags: (screeningId: string) => request<AutoFlag[]>(`/flags/${screeningId}`),

  // Red Flags
  checkRedFlags: (screeningId: string) =>
    request<RedFlag[]>(`/red-flags/check/${screeningId}`, { method: 'POST' }),
  getRedFlags: (screeningId: string) => request<RedFlag[]>(`/red-flags/${screeningId}`),

  // Risk Assessments
  calculateRisk: (screeningId: string) =>
    request<RiskAssessment>(`/risk-assessments/calculate/${screeningId}`, { method: 'POST' }),
  getRisk: (screeningId: string) => request<RiskAssessment>(`/risk-assessments/${screeningId}`),

  // Health Worker Reviews
  submitReview: (data: HealthWorkerReviewCreate) =>
    request<HealthWorkerReview>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getReview: (screeningId: string) => request<HealthWorkerReview>(`/reviews/${screeningId}`),

  // Reports
  generateReport: (screeningId: string) =>
    request<Report>(`/reports/generate/${screeningId}`, { method: 'POST' }),
  getReport: (screeningId: string) => request<Report>(`/reports/${screeningId}`),
  getReports: () => request<Report[]>('/reports'),

  // Simulation
  runSimulation: (scenario: string = 'ELEVATED_RISK', operatorName: string = 'Health Worker Demo') =>
    request<SimulationResult>('/simulation/run', {
      method: 'POST',
      body: JSON.stringify({ scenario, operator_name: operatorName }),
    }),

  // ESP32 Physio Pod Hardware
  getPhysioPodLatest: (url: string = 'http://192.168.4.1/api/session/latest') =>
    request<PhysioPodHardwareResponse>(`/sensors/esp32/latest?url=${encodeURIComponent(url)}`),
  getPhysioPodBaseline: () =>
    request<PhysioPodHardwareResponse>('/sensors/esp32/baseline'),
  savePhysioPodTest: (screeningId: string, sessionData: any) =>
    request<{ status: string; functional_test_id: string; test_type: string; duration_seconds: number }>('/sensors/esp32/save', {
      method: 'POST',
      body: JSON.stringify({ screening_session_id: screeningId, session_data: sessionData }),
    }),
};

