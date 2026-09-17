from typing import Dict, Any, List
from app.domain.interfaces import RiskEngine

class RuleBasedRiskEngine(RiskEngine):
    """
    Transparent, interpretable, weighted rule-based 3-tier risk stratification engine.
    Output Tiers:
      - TIER_1_LOW_RISK: Score < 35, no cluster of OA markers
      - TIER_2_ELEVATED_RISK: Score 35-65, moderate symptom or functional flags
      - TIER_3_PROBABLE_OA: Score > 65, multi-factor cluster (age, BMI, stiffness/crepitus, functional limitation)
    
    IMPORTANT: This is a screening/triage tool, NOT a definitive diagnosis.
    """
    def calculate_risk(self, patient_profile: Dict[str, Any], flags: List[Dict[str, Any]], features: List[Dict[str, Any]]) -> Dict[str, Any]:
        score = 0.0
        contributing_features = []
        
        # 1. Age Factor (OA prevalence escalates markedly above 45-50)
        age = patient_profile.get("age", 30)
        if age >= 55:
            score += 18.0
            contributing_features.append({
                "feature": "Age >= 55",
                "value": age,
                "weight": 18.0,
                "direction": "INCREASES_RISK",
                "explanation": "Strong age-related correlation with joint cartilage degradation."
            })
        elif age >= 45:
            score += 10.0
            contributing_features.append({
                "feature": "Age 45-54",
                "value": age,
                "weight": 10.0,
                "direction": "INCREASES_RISK",
                "explanation": "Moderate age-related risk window for early joint changes."
            })
            
        # 2. BMI / Joint Overload
        bmi = patient_profile.get("bmi", 22.0)
        if bmi >= 27.5:
            score += 16.0
            contributing_features.append({
                "feature": "Elevated BMI (>= 27.5 kg/m²)",
                "value": round(bmi, 1),
                "weight": 16.0,
                "direction": "INCREASES_RISK",
                "explanation": "Substantial biomechanical load multiplier on medial tibiofemoral compartment."
            })
        elif bmi >= 25.0:
            score += 8.0
            contributing_features.append({
                "feature": "Overweight BMI (25.0 - 27.4 kg/m²)",
                "value": round(bmi, 1),
                "weight": 8.0,
                "direction": "INCREASES_RISK",
                "explanation": "Moderate mechanical load marker."
            })
            
        # 3. Previous Joint Injury
        if patient_profile.get("previous_joint_injury", False):
            score += 12.0
            contributing_features.append({
                "feature": "Previous Joint Injury",
                "value": True,
                "weight": 12.0,
                "direction": "INCREASES_RISK",
                "explanation": "Post-traumatic joint injury significantly accelerates osteoarthritis changes."
            })
            
        # 4. Process Auto-Flags (Clinical, Functional, Kinematic)
        for flag in flags:
            code = flag.get("flag_code", "")
            sev = flag.get("severity", "MEDIUM")
            
            weight = 10.0 if sev == "HIGH" else (6.0 if sev == "MEDIUM" else 3.0)
            
            # Specific domain weight adjustments
            if "CREPITUS" in code:
                weight = 8.0
            elif "STIFFNESS" in code:
                weight = 9.0
            elif "TUG_PROLONGED" in code or "TUG_HIGH" in code:
                weight = 12.0
            elif "SQUAT_ASYMMETRY" in code:
                weight = 7.0
            elif "VALGUS" in code:
                weight = 6.0
                
            score += weight
            contributing_features.append({
                "feature": flag.get("flag_name", code),
                "value": flag.get("detected_value"),
                "weight": weight,
                "direction": "INCREASES_RISK",
                "explanation": flag.get("explanation", "")
            })
            
        # Cap score at 100
        score = min(100.0, round(score, 1))
        
        # 5. Determine Stratified Risk Tier
        # Check for multi-marker cluster (e.g. Age>=45 + BMI>=25 + Crepitus/Stiffness + Functional flag)
        has_age = age >= 45
        has_bmi = bmi >= 25.0
        has_clinical_oa = any("CREPITUS" in f.get("flag_code", "") or "STIFFNESS" in f.get("flag_code", "") for f in flags)
        has_functional_flag = any("TUG" in f.get("flag_code", "") or "SQUAT" in f.get("flag_code", "") for f in flags)
        
        if score >= 65.0 or (has_age and has_bmi and has_clinical_oa and has_functional_flag):
            risk_tier = "TIER_3_PROBABLE_OA"
            explanation = (
                "Multiple convergent clinical, functional, and biomechanical markers consistent with a clinically "
                "important osteoarthritis risk pattern. Recommended next action: Clinical examination by a doctor/physiotherapist "
                "and selective imaging/specialist referral as indicated. (Note: Screening finding, not a definitive diagnosis)."
            )
        elif score >= 35.0 or len(flags) >= 2:
            risk_tier = "TIER_2_ELEVATED_RISK"
            explanation = (
                "Functional, symptom, or biomechanical risk signals detected. Recommended next action: Targeted physical "
                "therapy, quadriceps strengthening, weight management guidance, and scheduled follow-up monitoring."
            )
        else:
            risk_tier = "TIER_1_LOW_RISK"
            explanation = (
                "No major osteoarthritis risk markers detected. Patient displays preserved functional mobility, joint range, "
                "and biomechanical symmetry. Recommended next action: Routine health monitoring and preventive joint wellness education."
            )
            
        return {
            "risk_tier": risk_tier,
            "risk_score": score,
            "model_version": "rule_v1.0_ner_provisional",
            "contributing_features": contributing_features,
            "explanation": explanation
        }
