# Offline-First Osteoarthritis (OA) Screening & Risk-Stratification Platform

> **Evidence-Informed Portable Screening System for Decentralized Community Camps in the North Eastern Region (NER), India**

---

## 1. Important Clinical Constraints & Product Specification

> [!IMPORTANT]
> **SCREENING / TRIAGE SYSTEM, NOT A DEFINITIVE DIAGNOSIS**
> - This application is a **screening and triage decision-support tool**, NOT an autonomous diagnostic replacement for specialist orthopedic evaluation or radiography.
> - The system **never labels a patient as definitively having osteoarthritis** based solely on algorithmic output.
> - The primary output is a **Three-Tier Risk Stratification**:
>   1. **Tier 1: Low Risk** — No major OA risk markers detected; preventive wellness education and routine health monitoring.
>   2. **Tier 2: Elevated Risk Markers** — Functional, symptom, or biomechanical load signals present; targeted quadriceps strengthening, physiotherapy referral, and scheduled follow-up.
>   3. **Tier 3: Probable OA Pattern** — Convergent cluster of clinical findings (age, morning stiffness, crepitus, prolonged TUG, restricted flexion, joint line tenderness); clinical doctor examination and selective imaging or specialist referral.
> - **Independent Red-Flag Handling**: Critical presentations (e.g., acute hot erythematous joint, fever, morning stiffness > 60 min, severe nocturnal rest pain, acute inability to bear weight) **bypass** the automated risk score and require urgent same-day medical escalation.
> - **Mandatory Health-Worker Sign-Off**: Automated results must be reviewed, approved, or overridden by a trained health worker before the final recommendation is issued to the patient.

---

## 2. Core Technology Stack

- **Backend**:
  - Python 3.11+
  - FastAPI (REST API with OpenAPI /docs and /redoc)
  - SQLAlchemy 2.x ORM
  - Pydantic v2 (Strict request/response validation)
  - SQLite 3 (`backend/data/oa_screening.db`) as primary offline source of truth
  - Alembic (Database migrations from the ground up)
  - Uvicorn (ASGI server)
  - Pytest & HTTPX TestClient
- **Frontend**:
  - React 19 & TypeScript
  - Vite
  - Lucide React (Clean clinical iconography)
  - Pure Vanilla CSS Design System (`index.css` with dark medical glassmorphism, responsive tables, and typography)
  - High-performance HTML5 Canvas real-time 6-axis IMU waveform visualizer

---

## 3. Directory Structure

```
/Users/apple/Desktop/SIHonceagain/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── da06b5d8d32a_initial_oa_schema.py
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── clinical_assessments.py
│   │   │       ├── features.py
│   │   │       ├── flags.py
│   │   │       ├── functional_tests.py
│   │   │       ├── patients.py
│   │   │       ├── questionnaires.py
│   │   │       ├── red_flags.py
│   │   │       ├── reports.py
│   │   │       ├── reviews.py
│   │   │       ├── risk_assessments.py
│   │   │       ├── router.py
│   │   │       ├── screenings.py
│   │   │       ├── sensors.py
│   │   │       ├── simulation.py
│   │   │       └── sync.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── domain/
│   │   │   ├── camera_processor.py      # Abstract & Mock Camera Processor
│   │   │   ├── interfaces.py            # Interfaces for Sensors, Cameras, Flagging, Risk, Reports
│   │   │   ├── red_flag_engine.py       # Independent Red-Flag Escalation Engine
│   │   │   ├── risk_engine.py           # Weighted 3-Tier Risk Stratification Engine
│   │   │   ├── sensor_adapter.py        # Abstract & Simulated 6-Axis IMU Adapter
│   │   │   └── threshold_config.py      # Configuration-driven research/provisional thresholds
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── audit.py                 # AuditLog for compliance
│   │   │   ├── camera.py                # CameraRecording
│   │   │   ├── clinical_assessment.py   # Bedside exam (stiffness, swelling, ROM, crepitus)
│   │   │   ├── feature.py               # MovementFeature
│   │   │   ├── flag.py                  # AutoFlag
│   │   │   ├── functional_test.py       # FunctionalTest & FunctionalTestResult
│   │   │   ├── patient.py               # Normalized Patient entity
│   │   │   ├── questionnaire.py         # KOOS-OA items
│   │   │   ├── red_flag.py              # RedFlag records
│   │   │   ├── report.py                # Final generated reports
│   │   │   ├── review.py                # Clinician review & sign-off
│   │   │   ├── risk.py                  # RiskAssessment
│   │   │   ├── screening.py             # ScreeningSession root
│   │   │   └── sensor.py                # SensorDevice, SensorRecording, SensorSample
│   │   ├── schemas/                     # Pydantic v2 schemas mirroring all entities
│   │   ├── services/
│   │   │   ├── audit_service.py
│   │   │   ├── autoflag_service.py
│   │   │   ├── feature_extraction_service.py
│   │   │   ├── functional_test_service.py
│   │   │   ├── patient_service.py
│   │   │   ├── quality_service.py       # Dedicated Data Quality Layer
│   │   │   ├── red_flag_service.py
│   │   │   ├── report_service.py
│   │   │   ├── review_service.py
│   │   │   ├── risk_service.py
│   │   │   ├── screening_service.py
│   │   │   ├── simulation_service.py    # Realistic test scenario runner
│   │   │   └── sync_service.py          # Future sync abstraction
│   │   └── utils/
│   │       └── bmi.py
│   ├── data/
│   │   └── oa_screening.db              # Local SQLite database
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_api.py                  # Comprehensive API & workflow tests
│   │   └── test_simulation.py           # Multi-scenario simulation tests
│   ├── alembic.ini
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts                # Typed REST client
│   │   │   └── types.ts                 # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── RiskBadge.tsx        # 3-tier colored risk pills
│   │   │   │   └── StatusBadge.tsx      # Clinical workflow state indicators
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx           # Offline status badge, camp metadata, simulation menu
│   │   │   │   ├── Sidebar.tsx          # Clinical navigation
│   │   │   │   └── Layout.tsx           # Root UI layout
│   │   │   └── sensor/
│   │   │       └── WaveformCanvas.tsx   # Real-time 6-axis Accel & Gyro Canvas waveforms
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx        # Overview KPI stats, risk breakdown, recent sessions
│   │   │   ├── PatientsPage.tsx         # Patient directory, search, quick registration modal
│   │   │   ├── NewScreeningPage.tsx     # 13-stage interactive screening wizard
│   │   │   ├── ScreeningListPage.tsx    # Archive table with status filters
│   │   │   ├── ScreeningDetailPage.tsx  # In-depth clinical breakdown of single session
│   │   │   ├── SensorMonitorPage.tsx    # Live IMU sensor monitoring & waveform visualizer
│   │   │   ├── ReportsPage.tsx          # Report archive & print preview
│   │   │   └── SettingsPage.tsx         # Offline status & 1-click simulation runner
│   │   ├── App.tsx
│   │   ├── index.css                    # Medical design tokens and styling
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Database Normalized Schema Overview

The database uses normalized domain tables rather than dumping unstructured JSON into a single table:
- **`patients`**: Demographics (identifier, name, age, sex, height, weight, BMI, occupation, family history, previous joint injury).
- **`screening_sessions`**: Root screening event linking operator, camp location, started_at, completed_at, and status (`IN_PROGRESS`, `COMPLETED`, `REVIEWED`, `QUALITY_INSUFFICIENT`).
- **`questionnaire_responses`**: Normalized Likert-scale items for KOOS-OA symptoms and functional limitations.
- **`clinical_assessments`**: Bedside physical exam metrics (morning stiffness minutes, visible effusion, NRS pain score, flexion/extension ROM, crepitus, joint-line tenderness, alignment observations, notes).
- **`functional_tests`** & **`functional_test_results`**: Five core functional tests (TUG, Squat, Alignment/Q-angle, Step-Up, Step-Down) with extracted numerical metrics, test duration, and quality status.
- **`sensor_devices`**, **`sensor_recordings`**, **`sensor_samples`**: Hardware registry, session recording metadata, and high-frequency 6-axis accelerometer ($A_x, A_y, A_z$) and gyroscope ($G_x, G_y, G_z$) samples.
- **`movement_features`**: Extracted kinematic variables (flexion depth, asymmetry index, valgus estimate, hesitation duration).
- **`auto_flags`**: Threshold flags categorized as `PROVISIONAL` or `RESEARCH_DERIVED` with measured values, reference limits, directions, and human-readable clinical rationale.
- **`risk_assessments`**: Output of the 3-tier risk engine with numerical score (0-100), risk tier, contributing factor weights, and model version.
- **`red_flags`**: Critical escalation conditions detected independently from the risk score.
- **`health_worker_reviews`**: Mandatory human-in-the-loop review capturing final tier decision (`CONFIRMED_TIER_*` or `OVERRIDDEN_TIER_*` or `ESCALATED_RED_FLAG`), reviewer credentials, notes, and override reasons.
- **`reports`**: Final structured document including dual summaries: patient-facing plain language guidance and clinician technical summary.
- **`audit_logs`**: Immutable security audit trail recording all clinical creations, simulations, and reviews.

---

## 5. Dedicated Data Quality Layer

Before automated auto-flagging or risk scoring occurs, the system evaluates:
1. **Sample Count & Signal Continuity**: Minimum sample count verified (&ge; 100 samples).
2. **Sensor Range Bounds / Clipping**: Rejects trials with extreme drop-off or physical clipping (> 60 m/s² acceleration or > 25 rad/s yaw/pitch/roll).
3. **Recording Duration**: Enforces standardized protocol compliance (e.g. TUG duration &ge; 3.0 seconds).
4. **Camera Framing Confidence**: Validates pose confidence (&ge; 0.70).

If data quality is deficient, the engine **never silently misclassifies the patient**; it flags `QUALITY_INSUFFICIENT` and directs the health worker on which test to repeat.

---

## 6. How Offline Operation Works

1. **Local SQLite Primary Store**: All database transactions are committed to `backend/data/oa_screening.db` on the local filesystem.
2. **Zero Mandatory External Cloud Calls**: Demographics, KOOS scores, functional kinematics, auto-flagging rules, and reports run entirely on the local device.
3. **No External AI Latency or Leakage**: Patient data is never transmitted to cloud APIs (Gemini/OpenAI/cloud databases).
4. **Future Sync Layer Ready**: The `SyncService` architecture is decoupled; when internet connectivity returns, encrypted batches can be pushed to a central repository without altering domain models.

---

## 7. How Simulated Sensors Work

To permit rapid development and verification without requiring physical hardware:
- **`SimulatedSensorAdapter`**: Generates realistic 6-axis IMU time-series curves using biomechanical phase equations (sit-to-stand, 3m walking cadence, peak yaw during turn, return gait, and controlled seating).
- **Pattern Modes**: Supports simulating "Normal / Fluid" gait vs "Impaired / Hesitant" gait with elevated bilateral asymmetry and hesitation times.
- **Artifact Injection**: Injects deliberate clipping spikes (> 90 m/s²) to test the Data Quality Gate.
- **Real-Time Canvas Stream**: Renders $A_x, A_y, A_z$ and $G_x, G_y, G_z$ dynamically at 50 Hz on the frontend canvas.

---

## 8. Local Development Commands

### 1. Setup Python Virtual Environment & Install Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Database Migrations
```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### 3. Start Backend Server
```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

### 4. Setup & Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Web application will be available at:
- Local UI: `http://localhost:5173`

### 5. Run Automated Tests
```bash
cd backend
source venv/bin/activate
pytest tests -v
```

### 6. Build Frontend Production Bundle
```bash
cd frontend
npm run build
```

---

## 9. Next Development Stages

1. **Hardware Bluetooth/BLE Connectivity**: Plug in real ESP32/MPU-6050 or LSM6DS3 sensor firmware using Web Bluetooth API.
2. **On-Device Pose Estimation**: Integrate lightweight client-side MediaPipe or ONNX Runtime pose models to derive real-time knee joint angles directly from local camera frames.
3. **Local Cohort Calibration**: Train empirical logistic regression or decision-tree models on prospectively collected North Eastern Region (NER) patient data.
4. **Multilingual Regional Voice Prompts**: Add Assamese, Bengali, Bodo, and local dialect voice/icon prompts for rural community camps.
