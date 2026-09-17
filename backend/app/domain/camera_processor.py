from typing import Dict, Any
from app.domain.interfaces import CameraProcessor

class MockCameraProcessor(CameraProcessor):
    """
    Simulated 2D pose estimation engine.
    IMPORTANT: Camera-derived angles (Q-angle, valgus, flexion) are explicitly
    modeled as RESEARCH ESTIMATES, not clinical-grade goniometry.
    """
    def process_movement_frame(self, test_type: str, patient_metadata: Dict[str, Any]) -> Dict[str, Any]:
        is_impaired = patient_metadata.get("simulate_impairment", False)
        
        if test_type == "TUG":
            return {
                "detected_posture": "SIT_TO_STAND_TRANSIT",
                "trunk_lean_angle_deg": 26.5 if is_impaired else 14.2,
                "hip_extension_deg": 145.0 if is_impaired else 172.0,
                "framing_confidence": 0.94,
                "quality_status": "PASSED"
            }
        elif test_type == "SQUAT":
            return {
                "max_knee_flexion_deg": 68.0 if is_impaired else 88.5,
                "dynamic_valgus_displacement_index": 14.2 if is_impaired else 4.1,
                "bilateral_symmetry_pct": 74.0 if is_impaired else 95.0,
                "framing_confidence": 0.92,
                "quality_status": "PASSED"
            }
        elif test_type == "ALIGNMENT":
            return {
                "estimated_q_angle_deg": 19.5 if is_impaired else 13.8,
                "frontal_knee_deviation": "MILD_VALGUS" if is_impaired else "NEUTRAL",
                "framing_confidence": 0.96,
                "quality_status": "PASSED"
            }
        else: # STEP_UP / STEP_DOWN
            return {
                "step_movement_smoothness": 0.62 if is_impaired else 0.91,
                "hesitation_duration_sec": 0.85 if is_impaired else 0.15,
                "knee_tracking_stability_pct": 68.0 if is_impaired else 92.0,
                "framing_confidence": 0.91,
                "quality_status": "PASSED"
            }
