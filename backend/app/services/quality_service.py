from typing import Dict, Any, List

class QualityService:
    """
    Dedicated Data Quality Layer.
    Verifies sensor sample continuity, realistic ranges, test duration,
    and camera framing confidence.
    Returns QUALITY_INSUFFICIENT if criteria are not met, preventing silent erroneous scoring.
    """
    @staticmethod
    def validate_sensor_samples(samples: List[Dict[str, float]], expected_min_duration_sec: float = 3.0) -> Dict[str, Any]:
        if not samples:
            return {
                "quality_status": "QUALITY_INSUFFICIENT",
                "valid": False,
                "reason": "No sensor samples recorded. Device may have disconnected during movement."
            }
        
        duration = (samples[-1]["timestamp_ms"] - samples[0]["timestamp_ms"]) / 1000.0
        if duration < expected_min_duration_sec:
            return {
                "quality_status": "QUALITY_INSUFFICIENT",
                "valid": False,
                "reason": f"Recording duration ({round(duration, 1)}s) is below required minimum ({expected_min_duration_sec}s). Please repeat the test."
            }
            
        # Check for unrealistic sensor spikes (> 50 m/s^2 or > 20 rad/s)
        for s in samples:
            acc_mag = (s["accel_x"]**2 + s["accel_y"]**2 + s["accel_z"]**2)**0.5
            if acc_mag > 60.0 or abs(s["gyro_x"]) > 25.0 or abs(s["gyro_y"]) > 25.0 or abs(s["gyro_z"]) > 25.0:
                return {
                    "quality_status": "QUALITY_INSUFFICIENT",
                    "valid": False,
                    "reason": "Sensor signal contains extreme clipping or sensor drop-off artifact. Check sensor attachment strap and repeat."
                }
                
        return {
            "quality_status": "PASSED",
            "valid": True,
            "duration_sec": round(duration, 2),
            "sample_count": len(samples)
        }

    @staticmethod
    def validate_camera_framing(camera_data: Dict[str, Any]) -> Dict[str, Any]:
        confidence = camera_data.get("framing_confidence", 1.0)
        if confidence < 0.70:
            return {
                "quality_status": "QUALITY_INSUFFICIENT",
                "valid": False,
                "reason": "Camera pose confidence low. Patient may be out of frame, poorly lit, or obstructed. Recheck tripod position."
            }
        return {
            "quality_status": "PASSED",
            "valid": True,
            "confidence": confidence
        }
