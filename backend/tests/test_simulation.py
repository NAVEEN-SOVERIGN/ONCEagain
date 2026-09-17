def test_full_simulation_scenarios(client):
    # Test all 4 simulation scenarios
    scenarios = ["LOW_RISK", "ELEVATED_RISK", "PROBABLE_OA", "RED_FLAG"]
    
    for sc in scenarios:
        res = client.post("/api/v1/simulation/run", json={"scenario": sc, "operator_name": "Test Operator"})
        assert res.status_code == 201
        data = res.json()
        assert data["scenario"] == sc
        assert "screening_id" in data
        
        sc_id = data["screening_id"]
        
        # Verify screening detail endpoint returns full composite data
        detail_res = client.get(f"/api/v1/screenings/{sc_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert len(detail["functional_tests"]) == 5
        assert detail["risk_assessment"] is not None
        
        if sc == "LOW_RISK":
            assert detail["risk_assessment"]["risk_tier"] == "TIER_1_LOW_RISK"
        elif sc == "PROBABLE_OA":
            assert detail["risk_assessment"]["risk_tier"] == "TIER_3_PROBABLE_OA"
        elif sc == "RED_FLAG":
            assert len(detail["red_flags"]) > 0
            assert any(rf["severity"] == "CRITICAL" for rf in detail["red_flags"])
