import pytest

def test_physio_pod_demo_mode_endpoint(client):
    response = client.get("/api/v1/sensors/esp32/latest?demo_mode=true")
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "demo_mode"
    # In demo mode, connected is False to indicate no physical hardware is bound
    assert data["connected"] is False
    session_data = data["data"]
    assert session_data["total_trials"] == 28
    assert len(session_data["pods"]) == 6
    assert "left" in session_data["sides"]
    assert "right" in session_data["sides"]
    assert "asymmetry" in session_data["sides"]
    assert session_data["sides"]["asymmetry"]["asymmetry_index_pct"] > 0

def test_physio_pod_live_fallback_endpoint(client):
    response = client.get("/api/v1/sensors/esp32/latest?demo_mode=false")
    assert response.status_code == 200
    data = response.json()
    # When physical hardware at 192.168.4.1 is unreachable, simulated fallback is returned
    assert data["source"] in ["simulated_hardware_fallback", "esp32_hardware_live"]
    assert len(data["data"]["pods"]) == 6

def test_physio_pod_save_to_screening(client):
    # 1. Create patient and screening session
    p_res = client.post("/api/v1/patients", json={
        "name": "Physio Subject",
        "age": 58,
        "sex": "FEMALE",
        "height": 155.0,
        "weight": 68.0,
        "previous_joint_injury": True
    })
    assert p_res.status_code == 201
    patient_id = p_res.json()["id"]

    s_res = client.post("/api/v1/screenings", json={
        "patient_id": patient_id,
        "operator_name": "Physiotherapist Raj",
        "camp_location": "Guwahati Health Post"
    })
    assert s_res.status_code == 201
    screening_id = s_res.json()["id"]

    # 2. Fetch pod data
    pod_res = client.get("/api/v1/sensors/esp32/latest?demo_mode=true")
    assert pod_res.status_code == 200
    pod_data = pod_res.json()["data"]

    # 3. Save pod test to screening session
    save_res = client.post("/api/v1/sensors/esp32/save", json={
        "screening_session_id": screening_id,
        "session_data": pod_data
    })
    assert save_res.status_code == 200
    save_data = save_res.json()
    assert save_data["status"] == "saved"
    assert save_data["test_type"] == "PHYSIO_POD"
    assert save_data["duration_seconds"] == pod_data["duration_sec"]
    assert "functional_test_id" in save_data
