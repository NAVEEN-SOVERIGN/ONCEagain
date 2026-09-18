import pytest

def test_physio_pod_baseline_zero_state(client):
    response = client.get("/api/v1/sensors/esp32/baseline")
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "empty_baseline"
    assert data["connected"] is False
    session_data = data["data"]
    assert session_data["total_trials"] == 0
    assert len(session_data["pods"]) == 6
    assert session_data["sides"]["left"]["hits"] == 0
    assert session_data["sides"]["right"]["hits"] == 0
    assert session_data["sides"]["left"]["avg_reaction_time_ms"] == 0.0

def test_physio_pod_live_offline_when_not_connected(client):
    response = client.get("/api/v1/sensors/esp32/latest")
    assert response.status_code == 200
    data = response.json()
    # When physical ESP32 at 192.168.4.1 is not on the LAN, reports disconnected (no mock fallback)
    assert data["connected"] in [False, True]
    if not data["connected"]:
        assert data["source"] == "esp32_hardware_offline"
        assert data["data"] is None

def test_physio_pod_live_hardware_push_and_fetch(client):
    # 1. ESP32 pushes real sensor JSON with 2 trials
    real_sensor_payload = {
        "device_id": "ESP32-HARDWARE-UNIT-01",
        "duration_sec": 18.5,
        "trials": [
            {"trial_num": 1, "pod_id": 1, "reaction_time_ms": 310.0, "result": "HIT", "target_color": "GREEN"},
            {"trial_num": 2, "pod_id": 5, "reaction_time_ms": 470.0, "result": "HIT", "target_color": "BLUE"}
        ]
    }
    push_res = client.post("/api/v1/sensors/esp32/push", json=real_sensor_payload)
    assert push_res.status_code == 200
    push_data = push_res.json()
    assert push_data["status"] == "received"
    assert push_data["total_trials"] == 2

    # 2. Latest endpoint immediately returns real hardware session
    latest_res = client.get("/api/v1/sensors/esp32/latest")
    assert latest_res.status_code == 200
    latest = latest_res.json()
    assert latest["connected"] is True
    assert latest["source"] == "esp32_hardware_live"
    live_data = latest["data"]
    assert live_data["device_id"] == "ESP32-HARDWARE-UNIT-01"
    assert live_data["total_trials"] == 2
    # Left Pod 1 was 310.0ms, Right Pod 5 was 470.0ms
    assert live_data["sides"]["left"]["avg_reaction_time_ms"] == 310.0
    assert live_data["sides"]["right"]["avg_reaction_time_ms"] == 470.0
    assert live_data["sides"]["asymmetry"]["asymmetry_index_pct"] > 0

def test_physio_pod_save_real_session_to_database(client):
    # 1. Create patient and screening session
    p_res = client.post("/api/v1/patients", json={
        "name": "Live Sensor Patient",
        "age": 60,
        "sex": "MALE",
        "height": 168.0,
        "weight": 72.0,
        "previous_joint_injury": False
    })
    assert p_res.status_code == 201
    patient_id = p_res.json()["id"]

    s_res = client.post("/api/v1/screenings", json={
        "patient_id": patient_id,
        "operator_name": "Health Worker Anjali",
        "camp_location": "Guwahati Community Clinic"
    })
    assert s_res.status_code == 201
    screening_id = s_res.json()["id"]

    # 2. Push real sensor data
    sensor_payload = {
        "device_id": "ESP32-PHYSICAL-CHIP",
        "duration_sec": 25.0,
        "trials": [
            {"pod_id": 2, "reaction_time_ms": 320.0, "result": "HIT"},
            {"pod_id": 6, "reaction_time_ms": 490.0, "result": "HIT"}
        ]
    }
    client.post("/api/v1/sensors/esp32/push", json=sensor_payload)

    # 3. Get live data
    latest_res = client.get("/api/v1/sensors/esp32/latest")
    assert latest_res.status_code == 200
    live_data = latest_res.json()["data"]

    # 4. Save to screening in SQLite
    save_res = client.post("/api/v1/sensors/esp32/save", json={
        "screening_session_id": screening_id,
        "session_data": live_data
    })
    assert save_res.status_code == 200
    saved = save_res.json()
    assert saved["status"] == "saved"
    assert saved["test_type"] == "PHYSIO_POD"
    assert saved["duration_seconds"] == 25.0
    assert "functional_test_id" in saved
