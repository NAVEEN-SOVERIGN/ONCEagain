from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class SensorAdapter(ABC):
    @abstractmethod
    def generate_or_read_samples(self, duration_sec: float, sampling_rate_hz: float, test_type: str) -> List[Dict[str, float]]:
        """Ingests or generates streaming sensor samples (accel_x/y/z, gyro_x/y/z, timestamp_ms)."""
        pass

class CameraProcessor(ABC):
    @abstractmethod
    def process_movement_frame(self, test_type: str, patient_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Processes camera pose landmarks and calculates estimated kinematic joint angles."""
        pass

class FeatureExtractor(ABC):
    @abstractmethod
    def extract_features(self, test_type: str, raw_samples: List[Dict[str, float]], camera_data: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Extracts biomechanical movement features from sensor and camera recordings."""
        pass

class AutoFlaggingEngine(ABC):
    @abstractmethod
    def evaluate_flags(self, clinical_data: Dict[str, Any], questionnaire_data: Dict[str, Any], movement_features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Evaluates auto-flags based on transparent configurable thresholds."""
        pass

class RiskEngine(ABC):
    @abstractmethod
    def calculate_risk(self, patient_profile: Dict[str, Any], flags: List[Dict[str, Any]], features: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates three-tier risk stratification with contributing feature explanations."""
        pass

class RedFlagEngine(ABC):
    @abstractmethod
    def check_red_flags(self, clinical_data: Dict[str, Any], questionnaire_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Evaluates independent clinical red flags requiring immediate medical escalation."""
        pass

class ReportGenerator(ABC):
    @abstractmethod
    def generate_report(self, screening_summary: Dict[str, Any]) -> Dict[str, Any]:
        """Generates dual patient-facing and clinician triage reports."""
        pass

class SyncService(ABC):
    @abstractmethod
    def prepare_encrypted_bundle(self, session_id: str) -> Dict[str, Any]:
        """Prepares encrypted payload for optional future cloud synchronization."""
        pass
