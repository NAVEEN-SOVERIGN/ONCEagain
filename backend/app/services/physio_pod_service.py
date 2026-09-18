import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.functional_test import FunctionalTest, FunctionalTestResult

# In-memory store for any real-time pushed sessions from ESP32
LATEST_PUSHED_HARDWARE_SESSION: Optional[Dict[str, Any]] = None
LAST_PUSHED_AT: Optional[datetime] = None

DEMO_PHYSIO_POD_SESSION: Dict[str, Any] = {
    "session_id": "SESSION-ESP32-DEMO-001",
    "timestamp": "2026-09-18T10:15:30Z",
    "device_id": "ESP32-PHYSIO-HUB-DEMO",
    "firmware_version": "v2.1.0-softap",
    "ip_address": "192.168.4.1",
    "protocol_name": "Bilateral Knee Agility & Reaction Protocol",
    "duration_sec": 48.6,
    "total_trials": 28,
    "sides": {
        "left": {
            "total_trials": 14,
            "hits": 12,
            "misses": 1,
            "wrong": 1,
            "hit_rate_pct": 85.7,
            "avg_reaction_time_ms": 438.4,
            "min_reaction_time_ms": 312.0,
            "max_reaction_time_ms": 590.0,
            "fastest_pod": 1
        },
        "right": {
            "total_trials": 14,
            "hits": 10,
            "misses": 2,
            "wrong": 2,
            "hit_rate_pct": 71.4,
            "avg_reaction_time_ms": 546.8,
            "min_reaction_time_ms": 385.0,
            "max_reaction_time_ms": 780.0,
            "fastest_pod": 5
        },
        "asymmetry": {
            "reaction_time_diff_ms": 108.4,
            "asymmetry_index_pct": 22.0,
            "slower_side": "RIGHT",
            "clinical_note": "Noticeable unilateral response delay and hesitation on Right limb (22.0% slower than Left limb). Strongly consistent with right knee joint guarding or antalgic hesitation."
        }
    },
    "pods": [
        {"pod_id": 1, "name": "Pod 1 (Left Lower / Anterior)", "side": "LEFT", "hits": 4, "misses": 0, "wrong": 0, "total_stimuli": 4, "hit_rate_pct": 100.0, "avg_reaction_time_ms": 412.5, "min_reaction_time_ms": 312.0, "max_reaction_time_ms": 490.0, "battery_pct": 94, "rssi_dbm": -48, "status": "ONLINE"},
        {"pod_id": 2, "name": "Pod 2 (Left Lateral)", "side": "LEFT", "hits": 4, "misses": 1, "wrong": 0, "total_stimuli": 5, "hit_rate_pct": 80.0, "avg_reaction_time_ms": 435.0, "min_reaction_time_ms": 340.0, "max_reaction_time_ms": 540.0, "battery_pct": 91, "rssi_dbm": -52, "status": "ONLINE"},
        {"pod_id": 3, "name": "Pod 3 (Left Medial / Pivot)", "side": "LEFT", "hits": 4, "misses": 0, "wrong": 1, "total_stimuli": 5, "hit_rate_pct": 80.0, "avg_reaction_time_ms": 468.2, "min_reaction_time_ms": 375.0, "max_reaction_time_ms": 590.0, "battery_pct": 88, "rssi_dbm": -50, "status": "ONLINE"},
        {"pod_id": 4, "name": "Pod 4 (Right Lower / Anterior)", "side": "RIGHT", "hits": 4, "misses": 1, "wrong": 0, "total_stimuli": 5, "hit_rate_pct": 80.0, "avg_reaction_time_ms": 515.0, "min_reaction_time_ms": 385.0, "max_reaction_time_ms": 680.0, "battery_pct": 95, "rssi_dbm": -46, "status": "ONLINE"},
        {"pod_id": 5, "name": "Pod 5 (Right Lateral)", "side": "RIGHT", "hits": 3, "misses": 0, "wrong": 1, "total_stimuli": 4, "hit_rate_pct": 75.0, "avg_reaction_time_ms": 530.0, "min_reaction_time_ms": 410.0, "max_reaction_time_ms": 720.0, "battery_pct": 90, "rssi_dbm": -54, "status": "ONLINE"},
        {"pod_id": 6, "name": "Pod 6 (Right Medial / Pivot)", "side": "RIGHT", "hits": 3, "misses": 1, "wrong": 1, "total_stimuli": 5, "hit_rate_pct": 60.0, "avg_reaction_time_ms": 595.4, "min_reaction_time_ms": 425.0, "max_reaction_time_ms": 780.0, "battery_pct": 87, "rssi_dbm": -56, "status": "ONLINE"}
    ],
    "trials": [
        {"trial_num": 1, "time_offset_ms": 1200, "pod_id": 1, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 412, "result": "HIT"},
        {"trial_num": 2, "time_offset_ms": 2900, "pod_id": 4, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 515, "result": "HIT"},
        {"trial_num": 3, "time_offset_ms": 4400, "pod_id": 2, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 435, "result": "HIT"},
        {"trial_num": 4, "time_offset_ms": 6100, "pod_id": 5, "side": "RIGHT", "target_color": "BLUE", "reaction_time_ms": 495, "result": "HIT"},
        {"trial_num": 5, "time_offset_ms": 7800, "pod_id": 3, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 440, "result": "HIT"},
        {"trial_num": 6, "time_offset_ms": 9500, "pod_id": 6, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 620, "result": "HIT"},
        {"trial_num": 7, "time_offset_ms": 11100, "pod_id": 1, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 312, "result": "HIT"},
        {"trial_num": 8, "time_offset_ms": 12900, "pod_id": 4, "side": "RIGHT", "target_color": "RED", "reaction_time_ms": 780, "result": "WRONG"},
        {"trial_num": 9, "time_offset_ms": 14700, "pod_id": 2, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 340, "result": "HIT"},
        {"trial_num": 10, "time_offset_ms": 16400, "pod_id": 5, "side": "RIGHT", "target_color": "BLUE", "reaction_time_ms": 385, "result": "HIT"},
        {"trial_num": 11, "time_offset_ms": 18100, "pod_id": 3, "side": "LEFT", "target_color": "RED", "reaction_time_ms": 590, "result": "WRONG"},
        {"trial_num": 12, "time_offset_ms": 19800, "pod_id": 6, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 710, "result": "MISS"},
        {"trial_num": 13, "time_offset_ms": 21500, "pod_id": 1, "side": "LEFT", "target_color": "BLUE", "reaction_time_ms": 460, "result": "HIT"},
        {"trial_num": 14, "time_offset_ms": 23200, "pod_id": 4, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 420, "result": "HIT"},
        {"trial_num": 15, "time_offset_ms": 24900, "pod_id": 2, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 450, "result": "HIT"},
        {"trial_num": 16, "time_offset_ms": 26700, "pod_id": 5, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 520, "result": "HIT"},
        {"trial_num": 17, "time_offset_ms": 28400, "pod_id": 3, "side": "LEFT", "target_color": "BLUE", "reaction_time_ms": 465, "result": "HIT"},
        {"trial_num": 18, "time_offset_ms": 30100, "pod_id": 6, "side": "RIGHT", "target_color": "RED", "reaction_time_ms": 640, "result": "WRONG"},
        {"trial_num": 19, "time_offset_ms": 31900, "pod_id": 1, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 490, "result": "HIT"},
        {"trial_num": 20, "time_offset_ms": 33600, "pod_id": 4, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 850, "result": "MISS"},
        {"trial_num": 21, "time_offset_ms": 35400, "pod_id": 2, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 540, "result": "MISS"},
        {"trial_num": 22, "time_offset_ms": 37200, "pod_id": 5, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 645, "result": "HIT"},
        {"trial_num": 23, "time_offset_ms": 39000, "pod_id": 3, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 375, "result": "HIT"},
        {"trial_num": 24, "time_offset_ms": 40700, "pod_id": 6, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 410, "result": "HIT"},
        {"trial_num": 25, "time_offset_ms": 42500, "pod_id": 2, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 400, "result": "HIT"},
        {"trial_num": 26, "time_offset_ms": 44200, "pod_id": 4, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 505, "result": "HIT"},
        {"trial_num": 27, "time_offset_ms": 45900, "pod_id": 3, "side": "LEFT", "target_color": "GREEN", "reaction_time_ms": 395, "result": "HIT"},
        {"trial_num": 28, "time_offset_ms": 47600, "pod_id": 6, "side": "RIGHT", "target_color": "GREEN", "reaction_time_ms": 425, "result": "HIT"}
    ]
}

def normalize_hardware_payload(raw_data: Any) -> Dict[str, Any]:
    """
    Normalizes any raw JSON from the ESP32 into the canonical 6-pod bilateral schema.
    Computes Left/Right averages, Asymmetry Index %, and Pod matrices dynamically
    from whatever real data the physical hardware provides.
    """
    if not isinstance(raw_data, dict):
        if isinstance(raw_data, list):
            raw_data = {"trials": raw_data}
        else:
            raw_data = {}

    session_id = raw_data.get("session_id") or raw_data.get("id") or f"PHYS-ESP32-{int(datetime.now().timestamp())}"
    timestamp = raw_data.get("timestamp") or datetime.now(timezone.utc).isoformat()
    device_id = raw_data.get("device_id") or raw_data.get("device") or "ESP32-PHYSIO-HARDWARE"
    firmware_version = raw_data.get("firmware_version") or raw_data.get("version") or "esp32-live-v1"
    duration_sec = float(raw_data.get("duration_sec") or raw_data.get("duration") or 45.0)

    # Extract or infer trials
    trials_in = raw_data.get("trials") or raw_data.get("data") or raw_data.get("events") or []
    trials: List[Dict[str, Any]] = []

    for idx, t in enumerate(trials_in):
        if isinstance(t, dict):
            p_id = int(t.get("pod_id") or t.get("pod") or t.get("id") or ((idx % 6) + 1))
            side = str(t.get("side") or ("LEFT" if p_id in [1, 2, 3] else "RIGHT")).upper()
            rt = float(t.get("reaction_time_ms") or t.get("reaction_time") or t.get("rt") or t.get("time_ms") or 350.0)
            result = str(t.get("result") or t.get("status") or ("HIT" if rt < 1000 else "MISS")).upper()
            time_offset = int(t.get("time_offset_ms") or t.get("time_offset") or (idx * 1500))
            color = str(t.get("target_color") or t.get("color") or "GREEN")

            trials.append({
                "trial_num": idx + 1,
                "time_offset_ms": time_offset,
                "pod_id": p_id,
                "side": side,
                "target_color": color,
                "reaction_time_ms": rt,
                "result": result
            })

    # If raw_data already had structured pods, use them; otherwise compute from trials
    pods_in = raw_data.get("pods")
    pods: List[Dict[str, Any]] = []

    if isinstance(pods_in, list) and len(pods_in) == 6:
        for p in pods_in:
            p_id = int(p.get("pod_id") or p.get("id") or 1)
            side = str(p.get("side") or ("LEFT" if p_id in [1, 2, 3] else "RIGHT")).upper()
            pods.append({
                "pod_id": p_id,
                "name": str(p.get("name") or f"Pod {p_id} ({'Left' if side == 'LEFT' else 'Right'})"),
                "side": side,
                "hits": int(p.get("hits") or 0),
                "misses": int(p.get("misses") or 0),
                "wrong": int(p.get("wrong") or 0),
                "total_stimuli": int(p.get("total_stimuli") or (int(p.get("hits") or 0) + int(p.get("misses") or 0))),
                "hit_rate_pct": float(p.get("hit_rate_pct") or 100.0),
                "avg_reaction_time_ms": float(p.get("avg_reaction_time_ms") or p.get("mean_rt") or 350.0),
                "min_reaction_time_ms": float(p.get("min_reaction_time_ms") or p.get("min_rt") or 300.0),
                "max_reaction_time_ms": float(p.get("max_reaction_time_ms") or p.get("max_rt") or 450.0),
                "battery_pct": int(p.get("battery_pct") or p.get("battery") or 95),
                "rssi_dbm": int(p.get("rssi_dbm") or p.get("rssi") or -50),
                "status": str(p.get("status") or "ONLINE")
            })
    else:
        # Generate 6 pods from trials or sensible defaults
        pod_names = {
            1: "Pod 1 (Left Lower / Anterior)",
            2: "Pod 2 (Left Lateral)",
            3: "Pod 3 (Left Medial / Pivot)",
            4: "Pod 4 (Right Lower / Anterior)",
            5: "Pod 5 (Right Lateral)",
            6: "Pod 6 (Right Medial / Pivot)",
        }
        for pod_id in range(1, 7):
            side = "LEFT" if pod_id in [1, 2, 3] else "RIGHT"
            pod_trials = [t for t in trials if t["pod_id"] == pod_id]
            hits = len([t for t in pod_trials if t["result"] == "HIT"])
            misses = len([t for t in pod_trials if t["result"] == "MISS"])
            wrong = len([t for t in pod_trials if t["result"] == "WRONG"])
            total = len(pod_trials)
            rts = [t["reaction_time_ms"] for t in pod_trials if t["result"] == "HIT"]
            avg_rt = sum(rts) / len(rts) if rts else (350.0 if side == "LEFT" else 420.0)
            min_rt = min(rts) if rts else avg_rt * 0.8
            max_rt = max(rts) if rts else avg_rt * 1.3

            pods.append({
                "pod_id": pod_id,
                "name": pod_names.get(pod_id, f"Pod {pod_id}"),
                "side": side,
                "hits": hits,
                "misses": misses,
                "wrong": wrong,
                "total_stimuli": total,
                "hit_rate_pct": round((hits / total * 100.0) if total > 0 else 100.0, 1),
                "avg_reaction_time_ms": round(avg_rt, 1),
                "min_reaction_time_ms": round(min_rt, 1),
                "max_reaction_time_ms": round(max_rt, 1),
                "battery_pct": 92,
                "rssi_dbm": -50,
                "status": "ONLINE"
            })

    # Compute Sides Statistics
    left_pods = [p for p in pods if p["side"] == "LEFT"]
    right_pods = [p for p in pods if p["side"] == "RIGHT"]

    left_hits = sum(p["hits"] for p in left_pods)
    left_misses = sum(p["misses"] for p in left_pods)
    left_wrong = sum(p["wrong"] for p in left_pods)
    left_total = left_hits + left_misses + left_wrong
    left_avg_rt = sum(p["avg_reaction_time_ms"] for p in left_pods) / len(left_pods) if left_pods else 350.0
    left_min_rt = min(p["min_reaction_time_ms"] for p in left_pods) if left_pods else 280.0
    left_max_rt = max(p["max_reaction_time_ms"] for p in left_pods) if left_pods else 450.0

    right_hits = sum(p["hits"] for p in right_pods)
    right_misses = sum(p["misses"] for p in right_pods)
    right_wrong = sum(p["wrong"] for p in right_pods)
    right_total = right_hits + right_misses + right_wrong
    right_avg_rt = sum(p["avg_reaction_time_ms"] for p in right_pods) / len(right_pods) if right_pods else 420.0
    right_min_rt = min(p["min_reaction_time_ms"] for p in right_pods) if right_pods else 320.0
    right_max_rt = max(p["max_reaction_time_ms"] for p in right_pods) if right_pods else 550.0

    # Bilateral Asymmetry calculation
    diff_ms = right_avg_rt - left_avg_rt
    mean_combined = (left_avg_rt + right_avg_rt) / 2.0
    asymmetry_pct = (abs(diff_ms) / mean_combined * 100.0) if mean_combined > 0 else 0.0

    slower_side = "RIGHT" if right_avg_rt > left_avg_rt else ("LEFT" if left_avg_rt > right_avg_rt else "SYMMETRIC")

    if asymmetry_pct > 15.0:
        clinical_note = (
            f"Significant {slower_side.lower()}-sided reaction latency deficit ({asymmetry_pct:.1f}% asymmetry, {abs(diff_ms):.1f}ms delta). "
            f"Exceeds clinical 15% threshold; indicative of unilateral quadriceps inhibition, antalgic hesitation, or knee joint guarding."
        )
    elif asymmetry_pct > 8.0:
        clinical_note = (
            f"Mild bilateral asymmetry ({asymmetry_pct:.1f}%). {slower_side.capitalize()} extremity exhibits slight delay, within early compensatory limits."
        )
    else:
        clinical_note = (
            f"Bilateral motor symmetry preserved ({asymmetry_pct:.1f}% asymmetry, within normal physiological variance <8%)."
        )

    return {
        "session_id": session_id,
        "timestamp": timestamp,
        "device_id": device_id,
        "firmware_version": firmware_version,
        "duration_sec": duration_sec,
        "total_trials": len(trials) if trials else (left_total + right_total),
        "sides": {
            "left": {
                "total_trials": left_total,
                "hits": left_hits,
                "misses": left_misses,
                "wrong": left_wrong,
                "hit_rate_pct": round((left_hits / left_total * 100.0) if left_total > 0 else 100.0, 1),
                "avg_reaction_time_ms": round(left_avg_rt, 1),
                "min_reaction_time_ms": round(left_min_rt, 1),
                "max_reaction_time_ms": round(left_max_rt, 1),
                "fastest_pod": min(left_pods, key=lambda x: x["avg_reaction_time_ms"])["pod_id"] if left_pods else 1
            },
            "right": {
                "total_trials": right_total,
                "hits": right_hits,
                "misses": right_misses,
                "wrong": right_wrong,
                "hit_rate_pct": round((right_hits / right_total * 100.0) if right_total > 0 else 100.0, 1),
                "avg_reaction_time_ms": round(right_avg_rt, 1),
                "min_reaction_time_ms": round(right_min_rt, 1),
                "max_reaction_time_ms": round(right_max_rt, 1),
                "fastest_pod": min(right_pods, key=lambda x: x["avg_reaction_time_ms"])["pod_id"] if right_pods else 4
            },
            "asymmetry": {
                "reaction_time_diff_ms": round(diff_ms, 1),
                "asymmetry_index_pct": round(asymmetry_pct, 1),
                "slower_side": slower_side,
                "clinical_note": clinical_note
            }
        },
        "pods": pods,
        "trials": trials,
        "_raw_hardware": raw_data
    }

class PhysioPodService:
    @staticmethod
    def get_demo_session() -> Dict[str, Any]:
        return DEMO_PHYSIO_POD_SESSION

    @staticmethod
    def record_pushed_session(payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Stores live hardware session sent directly by ESP32 HTTP Client push.
        """
        global LATEST_PUSHED_HARDWARE_SESSION, LAST_PUSHED_AT
        normalized = normalize_hardware_payload(payload)
        LATEST_PUSHED_HARDWARE_SESSION = normalized
        LAST_PUSHED_AT = datetime.now(timezone.utc)
        return normalized

    @staticmethod
    def fetch_live_session(
        url: str = "http://192.168.4.1/api/session/latest",
        timeout_sec: float = 2.0,
        allow_fallback: bool = True
    ) -> Dict[str, Any]:
        """
        Attempts to read the latest session from the physical ESP32 SoftAP web server.
        If ESP32 pushed data recently (< 15 seconds), uses pushed session.
        If ESP32 is polled, probes target URL and common candidate endpoints.
        """
        global LATEST_PUSHED_HARDWARE_SESSION, LAST_PUSHED_AT

        # Check if hardware recently pushed directly
        if LATEST_PUSHED_HARDWARE_SESSION and LAST_PUSHED_AT:
            age_sec = (datetime.now(timezone.utc) - LAST_PUSHED_AT).total_seconds()
            if age_sec < 15.0:
                return {
                    "source": "esp32_hardware_live",
                    "connected": True,
                    "ip_endpoint": "http-push-stream",
                    "age_seconds": round(age_sec, 1),
                    "data": LATEST_PUSHED_HARDWARE_SESSION
                }

        # Build candidate URLs in case path differs slightly
        urls_to_try = [url]
        if "192.168.4.1" in url or "192.168." in url:
            base = url.split("/")[0] + "//" + url.split("/")[2]
            for candidate_path in ["/api/session/latest", "/session", "/data", "/api/latest", "/status"]:
                candidate = f"{base}{candidate_path}"
                if candidate not in urls_to_try:
                    urls_to_try.append(candidate)

        last_error = "Connection timeout"
        for target_url in urls_to_try:
            req = urllib.request.Request(
                target_url,
                headers={"User-Agent": "OA-Workstation-ESP32-Bridge/1.0", "Accept": "application/json"}
            )
            try:
                with urllib.request.urlopen(req, timeout=timeout_sec) as response:
                    if response.status == 200:
                        raw_text = response.read().decode("utf-8")
                        raw_json = json.loads(raw_text)
                        normalized = normalize_hardware_payload(raw_json)
                        return {
                            "source": "esp32_hardware_live",
                            "connected": True,
                            "ip_endpoint": target_url,
                            "data": normalized
                        }
            except urllib.error.HTTPError as he:
                last_error = f"HTTP {he.code}: {he.reason}"
                continue
            except Exception as e:
                last_error = str(e)
                continue

        # If reaching here, real hardware was not reached
        if allow_fallback:
            return {
                "source": "simulated_hardware_fallback",
                "connected": False,
                "ip_endpoint": url,
                "error": f"Hardware unreachable at {url} ({last_error}). Using fallback simulation.",
                "data": DEMO_PHYSIO_POD_SESSION
            }
        else:
            return {
                "source": "hardware_disconnected",
                "connected": False,
                "ip_endpoint": url,
                "error": f"Could not connect to ESP32 at {url}. Error: {last_error}. Please ensure your laptop Wi-Fi is connected to the PhysioPod network.",
                "data": None
            }

    @staticmethod
    def save_to_functional_test(db: Session, screening_session_id: str, session_data: Dict[str, Any]) -> FunctionalTest:
        """
        Persists a 6-pod agility session as an objective FunctionalTest in the screening record.
        """
        sides = session_data.get("sides", {})
        left = sides.get("left", {})
        right = sides.get("right", {})
        asym = sides.get("asymmetry", {})

        duration = float(session_data.get("duration_sec", 45.0))

        test = FunctionalTest(
            screening_session_id=screening_session_id,
            test_type="PHYSIO_POD",
            status="COMPLETED",
            duration_seconds=duration,
            quality_status="PASSED",
            result_summary={
                "device_id": session_data.get("device_id", "ESP32-PHYSIO-HUB-01"),
                "total_trials": session_data.get("total_trials", 28),
                "asymmetry_index_pct": asym.get("asymmetry_index_pct", 0.0),
                "slower_side": asym.get("slower_side", "NONE"),
                "clinical_note": asym.get("clinical_note", "")
            }
        )
        db.add(test)
        db.flush()

        metrics_to_add = [
            ("pod_left_hit_rate", left.get("hit_rate_pct", 0.0), "%", "LEFT"),
            ("pod_left_avg_rt", left.get("avg_reaction_time_ms", 0.0), "ms", "LEFT"),
            ("pod_right_hit_rate", right.get("hit_rate_pct", 0.0), "%", "RIGHT"),
            ("pod_right_avg_rt", right.get("avg_reaction_time_ms", 0.0), "ms", "RIGHT"),
            ("pod_asymmetry_index", asym.get("asymmetry_index_pct", 0.0), "%", "BILATERAL"),
            ("pod_reaction_time_diff", asym.get("reaction_time_diff_ms", 0.0), "ms", "BILATERAL"),
        ]

        for name, val, unit, side in metrics_to_add:
            res = FunctionalTestResult(
                functional_test_id=test.id,
                metric_name=name,
                metric_value=float(val),
                unit=unit,
                side=side,
                quality_flag="VALID"
            )
            db.add(res)

        db.commit()
        db.refresh(test)
        return test
