from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.flag import AutoFlag
from app.models.clinical_assessment import ClinicalAssessment
from app.models.patient import Patient
from app.models.screening import ScreeningSession
from app.models.functional_test import FunctionalTest
from app.domain.threshold_config import THRESHOLDS

class AutoFlaggingService:
    @staticmethod
    def evaluate_and_store_flags(db: Session, screening_session_id: str) -> List[AutoFlag]:
        # Clear existing flags for this session if re-evaluating
        db.query(AutoFlag).filter(AutoFlag.screening_session_id == screening_session_id).delete()
        
        screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_session_id).first()
        if not screening:
            return []
            
        patient = screening.patient
        clinical = screening.clinical_assessment
        tests = db.query(FunctionalTest).filter(FunctionalTest.screening_session_id == screening_session_id).all()
        
        flags = []
        
        # 1. Anthropometric Evaluation
        if patient.bmi >= THRESHOLDS["BMI_OBESE"]["value"]:
            cfg = THRESHOLDS["BMI_OBESE"]
            flags.append(AutoFlag(
                screening_session_id=screening_session_id,
                category="ANTHROPOMETRIC",
                flag_code="BMI_HIGH_MECHANICAL_LOAD",
                flag_name=cfg["name"],
                severity=cfg["severity"],
                detected_value=patient.bmi,
                threshold_value=cfg["value"],
                direction=cfg["direction"],
                explanation=cfg["explanation"],
                threshold_status=cfg["status"],
                source="PATIENT_PROFILE"
            ))
        elif patient.bmi >= THRESHOLDS["BMI_OVERWEIGHT"]["value"]:
            cfg = THRESHOLDS["BMI_OVERWEIGHT"]
            flags.append(AutoFlag(
                screening_session_id=screening_session_id,
                category="ANTHROPOMETRIC",
                flag_code="BMI_ELEVATED_MARKER",
                flag_name=cfg["name"],
                severity=cfg["severity"],
                detected_value=patient.bmi,
                threshold_value=cfg["value"],
                direction=cfg["direction"],
                explanation=cfg["explanation"],
                threshold_status=cfg["status"],
                source="PATIENT_PROFILE"
            ))
            
        if patient.previous_joint_injury:
            flags.append(AutoFlag(
                screening_session_id=screening_session_id,
                category="ANTHROPOMETRIC",
                flag_code="PREVIOUS_JOINT_INJURY_FLAG",
                flag_name="Previous Joint Trauma History",
                severity="MEDIUM",
                direction="PRESENT",
                explanation="Post-traumatic joint injury significantly elevates relative risk of localized OA.",
                threshold_status="RESEARCH_DERIVED",
                source="PATIENT_PROFILE"
            ))

        # 2. Clinical Assessment Evaluation
        if clinical:
            if clinical.crepitus_present:
                flags.append(AutoFlag(
                    screening_session_id=screening_session_id,
                    category="CLINICAL",
                    flag_code="PALPABLE_CREPITUS_PRESENT",
                    flag_name="Joint Crepitus Detected",
                    severity="MEDIUM",
                    direction="PRESENT",
                    explanation="Audible or palpable joint crepitation on active motion indicates articular surface irregularity.",
                    threshold_status="RESEARCH_DERIVED",
                    source="PHYSICAL_EXAM"
                ))
            if clinical.joint_line_tenderness:
                flags.append(AutoFlag(
                    screening_session_id=screening_session_id,
                    category="CLINICAL",
                    flag_code="JOINT_LINE_TENDERNESS",
                    flag_name="Joint Line Tenderness",
                    severity="LOW",
                    direction="PRESENT",
                    explanation="Focal tenderness on the tibiofemoral joint margin.",
                    threshold_status="RESEARCH_DERIVED",
                    source="PHYSICAL_EXAM"
                ))
            if clinical.morning_stiffness_minutes > 0 and clinical.morning_stiffness_minutes <= THRESHOLDS["MORNING_STIFFNESS_OA"]["value"]:
                cfg = THRESHOLDS["MORNING_STIFFNESS_OA"]
                flags.append(AutoFlag(
                    screening_session_id=screening_session_id,
                    category="CLINICAL",
                    flag_code="OA_MORNING_STIFFNESS",
                    flag_name=cfg["name"],
                    severity=cfg["severity"],
                    detected_value=float(clinical.morning_stiffness_minutes),
                    threshold_value=float(cfg["value"]),
                    direction=cfg["direction"],
                    explanation=cfg["explanation"],
                    threshold_status=cfg["status"],
                    source="PHYSICAL_EXAM"
                ))
            if clinical.knee_flexion_rom_deg and clinical.knee_flexion_rom_deg < THRESHOLDS["KNEE_FLEXION_ROM_RESTRICTED"]["value"]:
                cfg = THRESHOLDS["KNEE_FLEXION_ROM_RESTRICTED"]
                flags.append(AutoFlag(
                    screening_session_id=screening_session_id,
                    category="CLINICAL",
                    flag_code="REDUCED_KNEE_FLEXION_ROM",
                    flag_name=cfg["name"],
                    severity=cfg["severity"],
                    detected_value=clinical.knee_flexion_rom_deg,
                    threshold_value=cfg["value"],
                    direction=cfg["direction"],
                    explanation=cfg["explanation"],
                    threshold_status=cfg["status"],
                    source="PHYSICAL_EXAM"
                ))

        # 3. Functional Tests Evaluation
        for t in tests:
            if t.test_type == "TUG" and t.duration_seconds:
                if t.duration_seconds >= THRESHOLDS["TUG_HIGH_IMPAIRMENT"]["value"]:
                    cfg = THRESHOLDS["TUG_HIGH_IMPAIRMENT"]
                    flags.append(AutoFlag(
                        screening_session_id=screening_session_id,
                        category="FUNCTIONAL",
                        flag_code="TUG_SEVERELY_PROLONGED",
                        flag_name=cfg["name"],
                        severity=cfg["severity"],
                        detected_value=t.duration_seconds,
                        threshold_value=cfg["value"],
                        direction=cfg["direction"],
                        explanation=cfg["explanation"],
                        threshold_status=cfg["status"],
                        source="TUG_TEST"
                    ))
                elif t.duration_seconds >= THRESHOLDS["TUG_PROLONGED"]["value"]:
                    cfg = THRESHOLDS["TUG_PROLONGED"]
                    flags.append(AutoFlag(
                        screening_session_id=screening_session_id,
                        category="FUNCTIONAL",
                        flag_code="TUG_PROLONGED",
                        flag_name=cfg["name"],
                        severity=cfg["severity"],
                        detected_value=t.duration_seconds,
                        threshold_value=cfg["value"],
                        direction=cfg["direction"],
                        explanation=cfg["explanation"],
                        threshold_status=cfg["status"],
                        source="TUG_TEST"
                    ))
            
            # Check results attached to the test (e.g. squat asymmetry, valgus estimate)
            for r in t.results:
                if "asymmetry" in r.metric_name.lower() and r.metric_value >= THRESHOLDS["SQUAT_ASYMMETRY"]["value"]:
                    cfg = THRESHOLDS["SQUAT_ASYMMETRY"]
                    flags.append(AutoFlag(
                        screening_session_id=screening_session_id,
                        category="KINEMATIC",
                        flag_code="SQUAT_ASYMMETRY_FLAG",
                        flag_name=cfg["name"],
                        severity=cfg["severity"],
                        detected_value=r.metric_value,
                        threshold_value=cfg["value"],
                        direction=cfg["direction"],
                        explanation=cfg["explanation"],
                        threshold_status=cfg["status"],
                        source=f"{t.test_type}_METRIC"
                    ))
                elif "valgus" in r.metric_name.lower() and r.metric_value >= THRESHOLDS["DYNAMIC_VALGUS_ESTIMATE"]["value"]:
                    cfg = THRESHOLDS["DYNAMIC_VALGUS_ESTIMATE"]
                    flags.append(AutoFlag(
                        screening_session_id=screening_session_id,
                        category="KINEMATIC",
                        flag_code="DYNAMIC_VALGUS_ESTIMATE",
                        flag_name=cfg["name"],
                        severity=cfg["severity"],
                        detected_value=r.metric_value,
                        threshold_value=cfg["value"],
                        direction=cfg["direction"],
                        explanation=cfg["explanation"],
                        threshold_status=cfg["status"],
                        source=f"{t.test_type}_CAMERA_ESTIMATE"
                    ))

        for f in flags:
            db.add(f)
        db.commit()
        return flags
