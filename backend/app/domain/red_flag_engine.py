from typing import List, Dict, Any
from app.domain.interfaces import RedFlagEngine

class IndependentRedFlagEngine(RedFlagEngine):
    """
    Evaluates critical red-flag escalation criteria independently from ordinary risk scoring.
    Red flags bypass routine triage and require urgent clinical evaluation.
    """
    def check_red_flags(self, clinical_data: Dict[str, Any], questionnaire_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        flags = []
        
        # 1. Acute Hot, Erythematous Swollen Joint (Septic arthritis or acute crystalline arthropathy)
        swelling = clinical_data.get("joint_swelling", False)
        clinician_notes = (clinical_data.get("clinician_notes") or "").lower()
        if swelling and any(w in clinician_notes for w in ["hot", "fever", "erythema", "warmth", "redness"]):
            flags.append({
                "flag_code": "RED_FLAG_SEPTIC_INFLAMMATORY_HOT_JOINT",
                "flag_name": "Hot / Erythematous Swollen Joint",
                "severity": "CRITICAL",
                "detected": True,
                "explanation": "Acute joint swelling accompanied by heat, erythema or fever raises urgent suspicion for septic arthritis or acute inflammatory crisis.",
                "action_required": "Urgent same-day clinical/orthopedic evaluation. Do not perform strenuous functional testing."
            })
            
        # 2. Prolonged morning stiffness > 60 min (Inflammatory systemic arthropathy)
        stiffness = clinical_data.get("morning_stiffness_minutes", 0)
        if stiffness > 60:
            flags.append({
                "flag_code": "RED_FLAG_INFLAMMATORY_STIFFNESS",
                "flag_name": "Prolonged Morning Stiffness (>60 min)",
                "severity": "URGENT",
                "detected": True,
                "explanation": "Morning stiffness exceeding 60 minutes points away from uncomplicated OA towards rheumatoid or inflammatory arthropathy.",
                "action_required": "Prompt rheumatology or clinical laboratory workup (ESR/CRP, autoantibodies)."
            })
            
        # 3. Severe acute locking / inability to bear weight
        if any(w in clinician_notes for w in ["cannot bear weight", "locked", "unable to walk", "acute trauma", "giving way entirely"]):
            flags.append({
                "flag_code": "RED_FLAG_ACUTE_MECHANICAL_LOCKING",
                "flag_name": "Inability to Bear Weight or Acute Joint Lock",
                "severity": "CRITICAL",
                "detected": True,
                "explanation": "True mechanical block to extension or total weight-bearing intolerance indicates structural derangement.",
                "action_required": "Protect weight-bearing; urgent orthopedic evaluation."
            })
            
        # 4. Severe unremitting nocturnal pain at rest
        pain_score = clinical_data.get("pain_nrs_score", 0)
        if pain_score >= 9 and any(w in clinician_notes for w in ["night pain", "unremitting", "constant severe", "rest pain"]):
            flags.append({
                "flag_code": "RED_FLAG_SEVERE_NOCTURNAL_REST_PAIN",
                "flag_name": "Severe Nocturnal Rest Pain",
                "severity": "URGENT",
                "detected": True,
                "explanation": "Severe unremitting rest pain waking patient at night requires ruling out non-degenerative etiology (e.g. osteonecrosis, neuropathic, malignancy).",
                "action_required": "Physician clinical assessment and diagnostic imaging."
            })
            
        return flags
