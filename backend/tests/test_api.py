def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_patient_crud(client):
    payload = {
        "name": "Biren Das",
        "age": 55,
        "sex": "MALE",
        "height": 165.0,
        "weight": 78.0,
        "occupation": "Agriculture",
        "family_history": "Mother had joint pain",
        "previous_joint_injury": True
    }
    res = client.post("/api/v1/patients", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Biren Das"
    assert data["bmi"] == round(78.0 / ((165.0/100)**2), 1)
    assert data["patient_identifier"].startswith("NER-PT-")
    patient_id = data["id"]

    # Get patient
    get_res = client.get(f"/api/v1/patients/{patient_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Biren Das"

def test_screening_session_workflow(client):
    # 1. Create Patient
    pt_res = client.post("/api/v1/patients", json={
        "name": "Lakshmi Borah",
        "age": 48,
        "sex": "FEMALE",
        "height": 158.0,
        "weight": 62.0,
        "previous_joint_injury": False
    })
    pt_id = pt_res.json()["id"]

    # 2. Start Screening
    sc_res = client.post("/api/v1/screenings", json={
        "patient_id": pt_id,
        "operator_name": "Nurse Anjali",
        "camp_location": "Tezpur PHC"
    })
    assert sc_res.status_code == 201
    sc_id = sc_res.json()["id"]
    assert sc_res.json()["screening_status"] == "IN_PROGRESS"

    # 3. Submit Questionnaire
    q_res = client.post("/api/v1/questionnaires/batch", json={
        "screening_session_id": sc_id,
        "questionnaire_type": "KOOS_OA",
        "items": [
            {"question_code": "P1", "question_text": "Pain frequency", "response_value": 2.0, "response_label": "Moderate"},
            {"question_code": "S1", "question_text": "Morning stiffness", "response_value": 2.0, "response_label": "Mild"}
        ]
    })
    assert q_res.status_code == 201
    assert len(q_res.json()) == 2

    # 4. Save Clinical Assessment
    ca_res = client.post("/api/v1/clinical-assessments", json={
        "screening_session_id": sc_id,
        "morning_stiffness_minutes": 20,
        "joint_swelling": False,
        "pain_nrs_score": 4,
        "knee_flexion_rom_deg": 125.0,
        "crepitus_present": True,
        "joint_line_tenderness": True,
        "alignment_observation": "NORMAL",
        "clinician_notes": "Mild crepitus on right knee"
    })
    assert ca_res.status_code == 201
    assert ca_res.json()["crepitus_present"] is True

    # 5. Record Functional Test (TUG)
    ft_res = client.post("/api/v1/functional-tests", json={
        "screening_session_id": sc_id,
        "test_type": "TUG",
        "duration_seconds": 11.2,
        "quality_status": "PASSED",
        "results": [
            {"metric_name": "tug_time", "metric_value": 11.2, "unit": "s", "side": "BILATERAL", "quality_flag": "VALID"}
        ]
    })
    assert ft_res.status_code == 201
    assert ft_res.json()["test_type"] == "TUG"

    # 6. Evaluate Auto Flags
    flags_res = client.post(f"/api/v1/flags/evaluate/{sc_id}")
    assert flags_res.status_code == 200
    flags = flags_res.json()
    flag_codes = [f["flag_code"] for f in flags]
    assert "PALPABLE_CREPITUS_PRESENT" in flag_codes
    assert "TUG_PROLONGED" in flag_codes

    # 7. Check Red Flags
    rf_res = client.post(f"/api/v1/red-flags/check/{sc_id}")
    assert rf_res.status_code == 200
    # No red flags for uncomplicated mild case
    assert len(rf_res.json()) == 0

    # 8. Calculate 3-Tier Risk
    risk_res = client.post(f"/api/v1/risk-assessments/calculate/{sc_id}")
    assert risk_res.status_code == 200
    risk = risk_res.json()
    assert risk["risk_tier"] in ["TIER_2_ELEVATED_RISK", "TIER_3_PROBABLE_OA"]
    assert len(risk["contributing_features"]) > 0

    # 9. Health Worker Review & Approval
    rev_res = client.post("/api/v1/reviews", json={
        "screening_session_id": sc_id,
        "final_result": "CONFIRMED_TIER_2",
        "reviewed_by": "Dr. Pranjal Saikia",
        "review_notes": "Agreed with automated risk markers. Recommend quadriceps strengthening and 3-month review."
    })
    assert rev_res.status_code == 201
    assert rev_res.json()["final_result"] == "CONFIRMED_TIER_2"

    # 10. Generate Report
    rep_res = client.post(f"/api/v1/reports/generate/{sc_id}")
    assert rep_res.status_code == 201
    rep = rep_res.json()
    assert rep["report_data"]["patient"]["name"] == "Lakshmi Borah"
    assert rep["report_data"]["health_worker_review"]["final_decision"] == "CONFIRMED_TIER_2"

    # 11. List Reports
    list_rep = client.get("/api/v1/reports")
    assert list_rep.status_code == 200
    assert len(list_rep.json()) >= 1

def test_red_flag_escalation_detection(client):
    # Register patient
    pt_res = client.post("/api/v1/patients", json={
        "name": "Hemanta Deka",
        "age": 60,
        "sex": "MALE",
        "height": 168.0,
        "weight": 72.0
    })
    pt_id = pt_res.json()["id"]

    # Start screening
    sc_res = client.post("/api/v1/screenings", json={
        "patient_id": pt_id,
        "operator_name": "Dr. Barman"
    })
    sc_id = sc_res.json()["id"]

    # Add clinical assessment with acute hot joint & prolonged stiffness > 60 min
    client.post("/api/v1/clinical-assessments", json={
        "screening_session_id": sc_id,
        "morning_stiffness_minutes": 90,
        "joint_swelling": True,
        "pain_nrs_score": 9,
        "knee_flexion_rom_deg": 90.0,
        "clinician_notes": "Acute hot joint, fever, erythema, severe unremitting night pain."
    })

    # Check red flags
    rf_res = client.post(f"/api/v1/red-flags/check/{sc_id}")
    assert rf_res.status_code == 200
    rfs = rf_res.json()
    assert len(rfs) >= 2
    codes = [rf["flag_code"] for rf in rfs]
    assert "RED_FLAG_SEPTIC_INFLAMMATORY_HOT_JOINT" in codes
    assert "RED_FLAG_INFLAMMATORY_STIFFNESS" in codes

def test_sensor_stream_and_quality_check(client):
    # Test stream generation
    stream_res = client.get("/api/v1/sensors/generate-stream?test_type=TUG&duration_sec=4.0&severity=NORMAL")
    assert stream_res.status_code == 200
    data = stream_res.json()
    assert data["sample_count"] == 200
    assert len(data["samples"]) == 200

    # Test artifact injection triggers clipping
    spike_res = client.get("/api/v1/sensors/generate-stream?test_type=TUG&duration_sec=4.0&inject_artifact=true")
    assert spike_res.status_code == 200
    spike_samples = spike_res.json()["samples"]
    # Check that peak accel_z > 60
    assert any(s["accel_z"] > 60 for s in spike_samples)

