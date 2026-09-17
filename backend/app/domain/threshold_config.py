"""
Configuration-driven threshold system.
IMPORTANT: All thresholds are explicitly marked as PROVISIONAL or RESEARCH_DERIVED.
They MUST NOT be represented as clinically validated diagnostic thresholds.
"""

THRESHOLDS = {
    "BMI_OVERWEIGHT": {
        "value": 25.0,
        "direction": "ABOVE",
        "severity": "LOW",
        "status": "RESEARCH_DERIVED",
        "name": "Elevated BMI Marker",
        "explanation": "BMI >= 25.0 kg/m² increases mechanical load on knee cartilage."
    },
    "BMI_OBESE": {
        "value": 27.5,
        "direction": "ABOVE",
        "severity": "MEDIUM",
        "status": "RESEARCH_DERIVED",
        "name": "High Mechanical Load (BMI >= 27.5)",
        "explanation": "BMI >= 27.5 kg/m² represents significant joint overload risk in Asian/community cohorts."
    },
    "TUG_PROLONGED": {
        "value": 10.0,
        "direction": "ABOVE",
        "severity": "MEDIUM",
        "status": "PROVISIONAL",
        "name": "Prolonged TUG Completion Time",
        "explanation": "Timed Up and Go took > 10.0 seconds, indicating functional mobility hesitation."
    },
    "TUG_HIGH_IMPAIRMENT": {
        "value": 13.5,
        "direction": "ABOVE",
        "severity": "HIGH",
        "status": "RESEARCH_DERIVED",
        "name": "Severely Impaired TUG Mobility",
        "explanation": "TUG time > 13.5 seconds suggests marked functional gait and transfer limitations."
    },
    "SQUAT_DEPTH_RESTRICTED": {
        "value": 75.0,  # degrees of knee flexion
        "direction": "BELOW",
        "severity": "MEDIUM",
        "status": "PROVISIONAL",
        "name": "Restricted Squat Flexion Depth",
        "explanation": "Squat depth < 75° indicates reduced knee flexion range of motion or functional hesitation."
    },
    "SQUAT_ASYMMETRY": {
        "value": 15.0,  # percent
        "direction": "ABOVE",
        "severity": "MEDIUM",
        "status": "PROVISIONAL",
        "name": "Significant Squat Bilateral Asymmetry",
        "explanation": "Left-right load or kinematic asymmetry > 15% during squat movement."
    },
    "DYNAMIC_VALGUS_ESTIMATE": {
        "value": 12.0,  # estimated frontal medial knee displacement in degrees or index
        "direction": "ABOVE",
        "severity": "MEDIUM",
        "status": "PROVISIONAL",
        "name": "Dynamic Knee Valgus Estimate",
        "explanation": "Camera-derived medial knee collapse during functional descent (research estimate)."
    },
    "MORNING_STIFFNESS_OA": {
        "value": 30,  # minutes
        "direction": "BELOW",
        "severity": "MEDIUM",
        "status": "RESEARCH_DERIVED",
        "name": "Characteristic OA Morning Stiffness",
        "explanation": "Morning joint stiffness lasting <= 30 minutes is a classic clinical OA hallmark."
    },
    "MORNING_STIFFNESS_INFLAMMATORY": {
        "value": 60,  # minutes
        "direction": "ABOVE",
        "severity": "HIGH",
        "status": "RESEARCH_DERIVED",
        "name": "Prolonged Inflammatory Morning Stiffness",
        "explanation": "Morning stiffness exceeding 60 minutes raises suspicion for inflammatory arthropathy."
    },
    "KNEE_FLEXION_ROM_RESTRICTED": {
        "value": 115.0,  # degrees
        "direction": "BELOW",
        "severity": "MEDIUM",
        "status": "PROVISIONAL",
        "name": "Reduced Active Knee Flexion",
        "explanation": "Active knee flexion < 115 degrees indicates functional range restriction."
    }
}
