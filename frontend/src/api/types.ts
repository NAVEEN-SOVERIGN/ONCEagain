// TypeScript data models mirroring backend Pydantic schemas

export type RiskTier = 'TIER_1_LOW_RISK' | 'TIER_2_ELEVATED_RISK' | 'TIER_3_PROBABLE_OA';

export type ScreeningStatus = 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'QUALITY_INSUFFICIENT';

export type QualityStatus = 'PASSED' | 'QUALITY_INSUFFICIENT';

export type TestType = 'TUG' | 'SQUAT' | 'ALIGNMENT' | 'STEP_UP' | 'STEP_DOWN';

export interface Patient {
  id: string;
  patient_identifier: string;
  name: string;
  age: number;
  sex: string; // MALE, FEMALE, OTHER
  height: number; // cm
  weight: number; // kg
  bmi: number;
  occupation?: string | null;
  family_history?: string | null;
  previous_joint_injury: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PatientCreate {
  name: string;
  age: number;
  sex: string;
  height: number;
  weight: number;
  occupation?: string;
  family_history?: string;
  previous_joint_injury?: boolean;
}

export interface ScreeningSession {
  id: string;
  patient_id: string;
  started_at: string;
  completed_at?: string | null;
  screening_status: ScreeningStatus;
  operator_name?: string | null;
  camp_location?: string | null;
  device_metadata?: Record<string, any>;
  patient?: Patient;
}

export interface ScreeningSessionCreate {
  patient_id: string;
  operator_name?: string;
  camp_location?: string;
  device_metadata?: Record<string, any>;
}

export interface QuestionnaireItem {
  question_code: string;
  question_text: string;
  response_value: number;
  response_label?: string;
}

export interface QuestionnaireBatchInput {
  screening_session_id: string;
  questionnaire_type: string;
  items: QuestionnaireItem[];
}

export interface QuestionnaireResponseItem {
  id: string;
  screening_session_id: string;
  questionnaire_type: string;
  question_code: string;
  question_text: string;
  response_value: number;
  response_label?: string | null;
  created_at?: string;
}

export interface ClinicalAssessmentCreate {
  screening_session_id: string;
  morning_stiffness_minutes?: number;
  joint_swelling?: boolean;
  pain_nrs_score?: number;
  knee_flexion_rom_deg?: number;
  knee_extension_rom_deg?: number;
  crepitus_present?: boolean;
  joint_line_tenderness?: boolean;
  alignment_observation?: string;
  clinician_notes?: string;
}

export interface ClinicalAssessment {
  id: string;
  screening_session_id: string;
  morning_stiffness_minutes: number;
  joint_swelling: boolean;
  pain_nrs_score: number;
  knee_flexion_rom_deg?: number | null;
  knee_extension_rom_deg?: number | null;
  crepitus_present: boolean;
  joint_line_tenderness: boolean;
  alignment_observation: string;
  clinician_notes?: string | null;
  created_at?: string;
}

export interface FunctionalTestResultCreate {
  metric_name: string;
  metric_value: number;
  unit: string;
  side?: string;
  quality_flag?: string;
}

export interface FunctionalTestCreate {
  screening_session_id: string;
  test_type: TestType;
  duration_seconds?: number;
  quality_status?: string;
  result_summary?: Record<string, any>;
  results?: FunctionalTestResultCreate[];
}

export interface FunctionalTestResult {
  id: string;
  functional_test_id: string;
  metric_name: string;
  metric_value: number;
  unit: string;
  side?: string | null;
  quality_flag: string;
}

export interface FunctionalTest {
  id: string;
  screening_session_id: string;
  test_type: TestType;
  status: string;
  duration_seconds?: number | null;
  quality_status: string;
  result_summary?: Record<string, any>;
  results: FunctionalTestResult[];
  created_at?: string;
}

export interface SensorDevice {
  id: string;
  device_id: string;
  device_type: string;
  firmware_version?: string | null;
  status: string;
  created_at?: string;
}

export interface SensorSample {
  timestamp_ms: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
}

export interface SensorRecording {
  id: string;
  screening_session_id: string;
  sensor_device_id?: string | null;
  sensor_type: string;
  sampling_rate_hz: number;
  recording_status: string;
  created_at?: string;
}

export interface AutoFlag {
  id: string;
  screening_session_id: string;
  category: string;
  flag_code: string;
  flag_name: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detected_value?: number | null;
  threshold_value?: number | null;
  direction?: string | null;
  explanation: string;
  status_level: 'PROVISIONAL' | 'RESEARCH_DERIVED' | 'VALIDATED';
  source: string;
  created_at?: string;
}

export interface ContributingFeature {
  feature: string;
  value: any;
  weight: number;
  direction: string;
  explanation: string;
}

export interface RiskAssessment {
  id: string;
  screening_session_id: string;
  risk_tier: RiskTier;
  risk_score: number;
  model_version: string;
  contributing_features: ContributingFeature[];
  explanation: string;
  status: string;
  generated_at?: string;
}

export interface RedFlag {
  id: string;
  screening_session_id: string;
  flag_code: string;
  flag_name: string;
  severity: 'URGENT' | 'CRITICAL';
  detected: boolean;
  explanation: string;
  action_required: string;
  created_at?: string;
}

export interface HealthWorkerReviewCreate {
  screening_session_id: string;
  final_result: string;
  reviewed_by: string;
  review_notes?: string;
  override_reason?: string;
}

export interface HealthWorkerReview {
  id: string;
  screening_session_id: string;
  automated_result: string;
  final_result: string;
  reviewed_by: string;
  review_notes?: string | null;
  override_reason?: string | null;
  reviewed_at?: string;
}

export interface Report {
  id: string;
  screening_session_id: string;
  report_type: string;
  report_data: Record<string, any>;
  reviewed_status: string;
  generated_at?: string;
}

export interface SimulationResult {
  screening_id: string;
  patient_id: string;
  patient_identifier: string;
  scenario: string;
  risk_tier: RiskTier;
  risk_score: number;
  flags_count: number;
  red_flags_count: number;
}
