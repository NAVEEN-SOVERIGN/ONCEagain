from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.models.screening import ScreeningSession
from app.models.questionnaire import QuestionnaireResponse
from app.models.clinical_assessment import ClinicalAssessment
from app.models.functional_test import FunctionalTest, FunctionalTestResult
from app.models.sensor import SensorDevice, SensorRecording, SensorSample
from app.models.feature import MovementFeature
from app.domain.sensor_adapter import SimulatedSensorAdapter
from app.domain.camera_processor import MockCameraProcessor
from app.services.autoflag_service import AutoFlaggingService
from app.services.red_flag_service import RedFlagService
from app.services.risk_service import RiskAssessmentService
from app.services.audit_service import AuditService

class SimulationService:
    """
    Development & demonstration simulation service.
    Generates realistic clinical, questionnaire, functional test, IMU sensor stream,
    and camera pose feature data passing through the exact same ingestion and
    scoring pipelines as real hardware.
    """
    @staticmethod
    def run_full_simulation(db: Session, scenario: str = "ELEVATED_RISK", operator_name: str = "Health Worker Demo") -> Dict[str, Any]:
        # Scenario configurations: LOW_RISK, ELEVATED_RISK, PROBABLE_OA, RED_FLAG
        is_impaired = scenario in ["ELEVATED_RISK", "PROBABLE_OA", "RED_FLAG"]
        is_probable = scenario in ["PROBABLE_OA", "RED_FLAG"]
        has_red_flag = scenario == "RED_FLAG"

        # 1. Create Simulated Patient
        pt_name = "Simulated " + ("Rani Sharma" if scenario == "LOW_RISK" else ("Bipul Gogoi" if scenario == "ELEVATED_RISK" else "Deben Das"))
        pt_age = 34 if scenario == "LOW_RISK" else (52 if scenario == "ELEVATED_RISK" else 63)
        pt_height = 162.0
        pt_weight = 58.0 if scenario == "LOW_RISK" else (76.0 if scenario == "ELEVATED_RISK" else 84.0)
        pt_bmi = round(pt_weight / ((pt_height/100)**2), 1)
        
        patient = Patient(
            patient_identifier=f"SIM-{scenario[:3]}-{datetime.now().strftime('%H%M%S')}",
            name=pt_name,
            age=pt_age,
            sex="FEMALE" if scenario == "LOW_RISK" else "MALE",
            height=pt_height,
            weight=pt_weight,
            bmi=pt_bmi,
            occupation="Farmer / Manual Laborer" if is_impaired else "Teacher",
            family_history="Maternal history of knee OA" if is_probable else "None reported",
            previous_joint_injury=True if is_impaired else False
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

        # 2. Start Screening Session
        screening = ScreeningSession(
            patient_id=patient.id,
            operator_name=operator_name,
            camp_location="Assam Community Health Center",
            screening_status="IN_PROGRESS"
        )
        db.add(screening)
        db.commit()
        db.refresh(screening)

        # 3. Ingest Questionnaire (KOOS-OA Items)
        q_items = [
            ("P1", "How often do you experience knee pain?", 1.0 if not is_impaired else (3.0 if not is_probable else 4.0), "Mild" if not is_impaired else "Severe"),
            ("P2", "Knee pain when walking on flat surface", 0.0 if not is_impaired else (2.0 if not is_probable else 4.0), "None" if not is_impaired else "Moderate"),
            ("S1", "Knee stiffness in the morning", 0.0 if not is_impaired else (2.0 if not has_red_flag else 4.0), "None" if not is_impaired else "Moderate"),
            ("A1", "Difficulty descending stairs", 1.0 if not is_impaired else (3.0 if not is_probable else 4.0), "Slight" if not is_impaired else "Severe"),
            ("A2", "Difficulty rising from sitting position", 0.0 if not is_impaired else (3.0 if not is_probable else 4.0), "None" if not is_impaired else "Severe")
        ]
        for code, text, val, lbl in q_items:
            qr = QuestionnaireResponse(
                screening_session_id=screening.id,
                questionnaire_type="KOOS_OA",
                question_code=code,
                question_text=text,
                response_value=val,
                response_label=lbl
            )
            db.add(qr)
        db.commit()

        # 4. Ingest Guided Clinical Assessment
        clinical = ClinicalAssessment(
            screening_session_id=screening.id,
            morning_stiffness_minutes=15 if (is_impaired and not has_red_flag) else (75 if has_red_flag else 0),
            joint_swelling=True if (is_probable or has_red_flag) else False,
            pain_nrs_score=2 if not is_impaired else (5 if not is_probable else (9 if has_red_flag else 7)),
            knee_flexion_rom_deg=135.0 if not is_impaired else (110.0 if not is_probable else 98.0),
            knee_extension_rom_deg=0.0 if not is_impaired else -5.0,
            crepitus_present=True if is_impaired else False,
            joint_line_tenderness=True if is_probable else False,
            alignment_observation="NORMAL" if not is_impaired else ("VARUS" if is_probable else "NORMAL"),
            clinician_notes="Acute hot knee swelling, fever, patient unable to bear full weight." if has_red_flag else (
                "Bilateral joint line tenderness, audible crepitation on flexion." if is_probable else "Slight stiffness reported after resting."
            )
        )
        db.add(clinical)
        db.commit()

        # 5. Ingest Functional Tests (TUG, Squat, Alignment, Step-Up, Step-Down)
        tests_meta = [
            ("TUG", 8.2 if not is_impaired else (11.4 if not is_probable else 14.8), [("tug_time", 8.2 if not is_impaired else (11.4 if not is_probable else 14.8), "s")]),
            ("SQUAT", 5.0, [
                ("squat_depth_deg", 90.0 if not is_impaired else (72.0 if not is_probable else 65.0), "deg"),
                ("bilateral_asymmetry_pct", 6.0 if not is_impaired else (18.5 if not is_probable else 24.0), "%")
            ]),
            ("ALIGNMENT", 3.0, [("q_angle_estimate_deg", 13.5 if not is_impaired else 19.2, "deg")]),
            ("STEP_UP", 4.0, [("asymmetry_index", 5.0 if not is_impaired else 22.0, "%")]),
            ("STEP_DOWN", 4.0, [("hesitation_time_sec", 0.2 if not is_impaired else 0.9, "s")])
        ]
        
        sensor_adapter = SimulatedSensorAdapter()
        camera_processor = MockCameraProcessor()
        
        # Ensure a simulated SensorDevice exists
        device = db.query(SensorDevice).filter(SensorDevice.device_id == "SIM-IMU-01").first()
        if not device:
            device = SensorDevice(device_id="SIM-IMU-01", device_type="IMU_6AXIS", firmware_version="sim-1.0", status="STREAMING")
            db.add(device)
            db.commit()
            db.refresh(device)

        for test_type, duration, metrics in tests_meta:
            ft = FunctionalTest(
                screening_session_id=screening.id,
                test_type=test_type,
                status="COMPLETED",
                duration_seconds=duration,
                quality_status="PASSED",
                result_summary={"source": "simulated_pipeline"}
            )
            db.add(ft)
            db.flush()

            for m_name, m_val, m_unit in metrics:
                ft_res = FunctionalTestResult(
                    functional_test_id=ft.id,
                    metric_name=m_name,
                    metric_value=m_val,
                    unit=m_unit,
                    side="BILATERAL",
                    quality_flag="VALID"
                )
                db.add(ft_res)

            # Ingest simulated sensor recording & samples for TUG and Squat
            if test_type in ["TUG", "SQUAT"]:
                rec = SensorRecording(
                    screening_session_id=screening.id,
                    sensor_device_id=device.id,
                    sensor_type="IMU",
                    sampling_rate_hz=50.0,
                    recording_status="COMPLETED"
                )
                db.add(rec)
                db.flush()
                
                raw_samples = sensor_adapter.generate_or_read_samples(
                    duration_sec=duration,
                    sampling_rate_hz=50.0,
                    test_type=test_type,
                    severity="IMPAIRED" if is_impaired else "NORMAL"
                )
                for s in raw_samples[:100]: # save representative window
                    db.add(SensorSample(
                        sensor_recording_id=rec.id,
                        timestamp_ms=s["timestamp_ms"],
                        accel_x=s["accel_x"],
                        accel_y=s["accel_y"],
                        accel_z=s["accel_z"],
                        gyro_x=s["gyro_x"],
                        gyro_y=s["gyro_y"],
                        gyro_z=s["gyro_z"]
                    ))

            # Ingest camera movement features
            cam_data = camera_processor.process_movement_frame(test_type, {"simulate_impairment": is_impaired})
            if "max_knee_flexion_deg" in cam_data:
                db.add(MovementFeature(
                    screening_session_id=screening.id,
                    functional_test_id=ft.id,
                    feature_name="max_knee_flexion_deg",
                    feature_value=cam_data["max_knee_flexion_deg"],
                    unit="deg",
                    source="CAMERA_ESTIMATE"
                ))
            if "dynamic_valgus_displacement_index" in cam_data:
                db.add(MovementFeature(
                    screening_session_id=screening.id,
                    functional_test_id=ft.id,
                    feature_name="dynamic_valgus_displacement_index",
                    feature_value=cam_data["dynamic_valgus_displacement_index"],
                    unit="index",
                    source="CAMERA_ESTIMATE"
                ))

        db.commit()

        # 6. Run Auto-Flagging Engine
        flags = AutoFlaggingService.evaluate_and_store_flags(db, screening.id)

        # 7. Run Independent Red-Flag Engine
        red_flags = RedFlagService.evaluate_red_flags(db, screening.id, user_id=operator_name)

        # 8. Run 3-Tier Risk Engine
        risk = RiskAssessmentService.calculate_and_save_risk(db, screening.id, user_id=operator_name)

        AuditService.log(db, "ScreeningSession", screening.id, "SIMULATE", operator_name, {
            "scenario": scenario,
            "risk_tier": risk.risk_tier if risk else None,
            "red_flags_count": len(red_flags)
        })

        return {
            "screening_id": screening.id,
            "patient_id": patient.id,
            "patient_identifier": patient.patient_identifier,
            "scenario": scenario,
            "risk_tier": risk.risk_tier if risk else None,
            "risk_score": risk.risk_score if risk else 0.0,
            "flags_count": len(flags),
            "red_flags_count": len(red_flags)
        }
