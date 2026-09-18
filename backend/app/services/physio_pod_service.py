import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.functional_test import FunctionalTest, FunctionalTestResult

# In-memory store for real-time pushed sessions from ESP32
LATEST_PUSHED_HARDWARE_SESSION: Optional[Dict[str, Any]] = None
LAST_PUSHED_AT: Optional[datetime] = None

def get_empty_hardware_session(device_id: str = "ESP32-PHYSIO-POD-DECK") -> Dict[str, Any]:
    """
    Returns a clean zero-state schema with zero mock data.
    Used when sensors are first connected before trials are performed.
    """
    pod_names = {
        1: "Pod 1 (Left Lower / Anterior)",
        2: "Pod 2 (Left Lateral)",
        3: "Pod 3 (Left Medial / Pivot)",
        4: "Pod 4 (Right Lower / Anterior)",
        5: "Pod 5 (Right Lateral)",
        6: "Pod 6 (Right Medial / Pivot)",
    }
    pods = []
    for pod_id in range(1, 7):
        side = "LEFT" if pod_id in [1, 2, 3] else "RIGHT"
        pods.append({
            "pod_id": pod_id,
            "name": pod_names[pod_id],
            "side": side,
            "hits": 0,
            "misses": 0,
            "wrong": 0,
            "total_stimuli": 0,
            "hit_rate_pct": 0.0,
            "avg_reaction_time_ms": 0.0,
            "min_reaction_time_ms": 0.0,
            "max_reaction_time_ms": 0.0,
            "battery_pct": 100,
            "rssi_dbm": 0,
            "status": "READY"
        })

    return {
        "session_id": f"LIVE-POD-{int(datetime.now().timestamp())}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "device_id": device_id,
        "firmware_version": "esp32-live-hardware",
        "duration_sec": 0.0,
        "total_trials": 0,
        "sides": {
            "left": {
                "total_trials": 0,
                "hits": 0,
                "misses": 0,
                "wrong": 0,
                "hit_rate_pct": 0.0,
                "avg_reaction_time_ms": 0.0,
                "min_reaction_time_ms": 0.0,
                "max_reaction_time_ms": 0.0,
                "fastest_pod": 1
            },
            "right": {
                "total_trials": 0,
                "hits": 0,
                "misses": 0,
                "wrong": 0,
                "hit_rate_pct": 0.0,
                "avg_reaction_time_ms": 0.0,
                "min_reaction_time_ms": 0.0,
                "max_reaction_time_ms": 0.0,
                "fastest_pod": 4
            },
            "asymmetry": {
                "reaction_time_diff_ms": 0.0,
                "asymmetry_index_pct": 0.0,
                "slower_side": "SYMMETRIC",
                "clinical_note": "Awaiting patient trial stimuli on hardware pods."
            }
        },
        "pods": pods,
        "trials": [],
        "_raw_hardware": {}
    }

def normalize_hardware_payload(raw_data: Any) -> Dict[str, Any]:
    """
    Normalizes real JSON from the physical ESP32 into the 6-pod bilateral schema.
    Every metric is strictly calculated from the REAL incoming hardware data.
    Zero mock numbers.
    """
    if not isinstance(raw_data, dict):
        if isinstance(raw_data, list):
            raw_data = {"trials": raw_data}
        else:
            raw_data = {}

    session_id = raw_data.get("session_id") or raw_data.get("id") or f"LIVE-POD-{int(datetime.now().timestamp())}"
    timestamp = raw_data.get("timestamp") or datetime.now(timezone.utc).isoformat()
    device_id = raw_data.get("device_id") or raw_data.get("device") or "ESP32-PHYSIO-POD-DECK"
    firmware_version = raw_data.get("firmware_version") or raw_data.get("version") or "esp32-v1.0"
    duration_sec = float(raw_data.get("duration_sec") or raw_data.get("duration") or 0.0)

    # Extract trials from physical hardware
    trials_in = raw_data.get("trials") or raw_data.get("data") or raw_data.get("events") or []
    trials: List[Dict[str, Any]] = []

    for idx, t in enumerate(trials_in):
        if isinstance(t, dict):
            p_id = int(t.get("pod_id") or t.get("pod") or t.get("id") or 1)
            side = str(t.get("side") or ("LEFT" if p_id in [1, 2, 3] else "RIGHT")).upper()
            rt = float(t.get("reaction_time_ms") or t.get("reaction_time") or t.get("rt") or t.get("time_ms") or 0.0)
            result = str(t.get("result") or t.get("status") or ("HIT" if rt > 0 and rt < 2000 else "MISS")).upper()
            time_offset = int(t.get("time_offset_ms") or t.get("time_offset") or (idx * 1000))
            color = str(t.get("target_color") or t.get("color") or "GREEN")

            trials.append({
                "trial_num": int(t.get("trial_num") or (idx + 1)),
                "time_offset_ms": time_offset,
                "pod_id": p_id,
                "side": side,
                "target_color": color,
                "reaction_time_ms": round(rt, 1),
                "result": result
            })

    # Pod structure
    pod_names = {
        1: "Pod 1 (Left Lower / Anterior)",
        2: "Pod 2 (Left Lateral)",
        3: "Pod 3 (Left Medial / Pivot)",
        4: "Pod 4 (Right Lower / Anterior)",
        5: "Pod 5 (Right Lateral)",
        6: "Pod 6 (Right Medial / Pivot)",
    }

    pods_in = raw_data.get("pods")
    pods: List[Dict[str, Any]] = []

    if isinstance(pods_in, list) and len(pods_in) == 6:
        for p in pods_in:
            p_id = int(p.get("pod_id") or p.get("id") or 1)
            side = str(p.get("side") or ("LEFT" if p_id in [1, 2, 3] else "RIGHT")).upper()
            hits = int(p.get("hits") or 0)
            misses = int(p.get("misses") or 0)
            wrong = int(p.get("wrong") or 0)
            total = int(p.get("total_stimuli") or (hits + misses + wrong))
            hit_rate = float(p.get("hit_rate_pct") or ((hits / total * 100.0) if total > 0 else 0.0))
            avg_rt = float(p.get("avg_reaction_time_ms") or p.get("mean_rt") or p.get("reaction_time_ms") or 0.0)
            min_rt = float(p.get("min_reaction_time_ms") or p.get("min_rt") or avg_rt)
            max_rt = float(p.get("max_reaction_time_ms") or p.get("max_rt") or avg_rt)

            pods.append({
                "pod_id": p_id,
                "name": str(p.get("name") or pod_names.get(p_id, f"Pod {p_id}")),
                "side": side,
                "hits": hits,
                "misses": misses,
                "wrong": wrong,
                "total_stimuli": total,
                "hit_rate_pct": round(hit_rate, 1),
                "avg_reaction_time_ms": round(avg_rt, 1),
                "min_reaction_time_ms": round(min_rt, 1),
                "max_reaction_time_ms": round(max_rt, 1),
                "battery_pct": int(p.get("battery_pct") or p.get("battery") or 100),
                "rssi_dbm": int(p.get("rssi_dbm") or p.get("rssi") or 0),
                "status": str(p.get("status") or ("ONLINE" if hits > 0 or total > 0 else "READY"))
            })
    else:
        # Build strictly from incoming trials
        for pod_id in range(1, 7):
            side = "LEFT" if pod_id in [1, 2, 3] else "RIGHT"
            pod_trials = [t for t in trials if t["pod_id"] == pod_id]
            hits = len([t for t in pod_trials if t["result"] == "HIT"])
            misses = len([t for t in pod_trials if t["result"] == "MISS"])
            wrong = len([t for t in pod_trials if t["result"] == "WRONG"])
            total = len(pod_trials)
            valid_rts = [t["reaction_time_ms"] for t in pod_trials if t["result"] == "HIT" and t["reaction_time_ms"] > 0]
            avg_rt = sum(valid_rts) / len(valid_rts) if valid_rts else 0.0
            min_rt = min(valid_rts) if valid_rts else 0.0
            max_rt = max(valid_rts) if valid_rts else 0.0

            pods.append({
                "pod_id": pod_id,
                "name": pod_names[pod_id],
                "side": side,
                "hits": hits,
                "misses": misses,
                "wrong": wrong,
                "total_stimuli": total,
                "hit_rate_pct": round((hits / total * 100.0) if total > 0 else 0.0, 1),
                "avg_reaction_time_ms": round(avg_rt, 1),
                "min_reaction_time_ms": round(min_rt, 1),
                "max_reaction_time_ms": round(max_rt, 1),
                "battery_pct": 100,
                "rssi_dbm": 0,
                "status": "ONLINE" if total > 0 else "READY"
            })

    # Compute Sides Statistics
    left_pods = [p for p in pods if p["side"] == "LEFT"]
    right_pods = [p for p in pods if p["side"] == "RIGHT"]

    left_hits = sum(p["hits"] for p in left_pods)
    left_misses = sum(p["misses"] for p in left_pods)
    left_wrong = sum(p["wrong"] for p in left_pods)
    left_total = left_hits + left_misses + left_wrong

    left_rts = [p["avg_reaction_time_ms"] for p in left_pods if p["avg_reaction_time_ms"] > 0]
    left_avg_rt = (sum(left_rts) / len(left_rts)) if left_rts else 0.0
    left_min_rt = min([p["min_reaction_time_ms"] for p in left_pods if p["min_reaction_time_ms"] > 0], default=0.0)
    left_max_rt = max([p["max_reaction_time_ms"] for p in left_pods], default=0.0)

    right_hits = sum(p["hits"] for p in right_pods)
    right_misses = sum(p["misses"] for p in right_pods)
    right_wrong = sum(p["wrong"] for p in right_pods)
    right_total = right_hits + right_misses + right_wrong

    right_rts = [p["avg_reaction_time_ms"] for p in right_pods if p["avg_reaction_time_ms"] > 0]
    right_avg_rt = (sum(right_rts) / len(right_rts)) if right_rts else 0.0
    right_min_rt = min([p["min_reaction_time_ms"] for p in right_pods if p["min_reaction_time_ms"] > 0], default=0.0)
    right_max_rt = max([p["max_reaction_time_ms"] for p in right_pods], default=0.0)

    # Bilateral Asymmetry calculation
    if left_avg_rt > 0 and right_avg_rt > 0:
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
                f"Mild bilateral asymmetry ({asymmetry_pct:.1f}%). {slower_side.capitalize()} extremity exhibits slight delay within early compensatory limits."
            )
        else:
            clinical_note = (
                f"Bilateral motor symmetry preserved ({asymmetry_pct:.1f}% asymmetry, within normal physiological variance <8%)."
            )
    else:
        diff_ms = 0.0
        asymmetry_pct = 0.0
        slower_side = "SYMMETRIC"
        clinical_note = "Awaiting bilateral pod hits to calculate motor asymmetry."

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
                "hit_rate_pct": round((left_hits / left_total * 100.0) if left_total > 0 else 0.0, 1),
                "avg_reaction_time_ms": round(left_avg_rt, 1),
                "min_reaction_time_ms": round(left_min_rt, 1),
                "max_reaction_time_ms": round(left_max_rt, 1),
                "fastest_pod": min((p for p in left_pods if p["avg_reaction_time_ms"] > 0), key=lambda x: x["avg_reaction_time_ms"], default={"pod_id": 1})["pod_id"]
            },
            "right": {
                "total_trials": right_total,
                "hits": right_hits,
                "misses": right_misses,
                "wrong": right_wrong,
                "hit_rate_pct": round((right_hits / right_total * 100.0) if right_total > 0 else 0.0, 1),
                "avg_reaction_time_ms": round(right_avg_rt, 1),
                "min_reaction_time_ms": round(right_min_rt, 1),
                "max_reaction_time_ms": round(right_max_rt, 1),
                "fastest_pod": min((p for p in right_pods if p["avg_reaction_time_ms"] > 0), key=lambda x: x["avg_reaction_time_ms"], default={"pod_id": 4})["pod_id"]
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
    def get_clean_baseline(device_id: str = "ESP32-PHYSIO-POD-DECK") -> Dict[str, Any]:
        """Returns clean zero-state without mock data."""
        return get_empty_hardware_session(device_id=device_id)

    @staticmethod
    def record_pushed_session(payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Stores live hardware session sent directly by ESP32 HTTP Client push.
        Zero mock data — strictly parses the actual incoming payload.
        """
        global LATEST_PUSHED_HARDWARE_SESSION, LAST_PUSHED_AT
        normalized = normalize_hardware_payload(payload)
        LATEST_PUSHED_HARDWARE_SESSION = normalized
        LAST_PUSHED_AT = datetime.now(timezone.utc)
        return normalized

    @staticmethod
    def fetch_live_session(
        url: str = "http://192.168.4.1/api/session/latest",
        timeout_sec: float = 2.0
    ) -> Dict[str, Any]:
        """
        Reads session directly from the physical ESP32 over Wi-Fi.
        If ESP32 pushed data recently (< 30 seconds), returns the pushed session.
        Otherwise polls the ESP32 endpoint.
        Returns connected=False with clear error if hardware is unreachable.
        ZERO mock fallback.
        """
        global LATEST_PUSHED_HARDWARE_SESSION, LAST_PUSHED_AT

        # Check if hardware recently pushed directly
        if LATEST_PUSHED_HARDWARE_SESSION and LAST_PUSHED_AT:
            age_sec = (datetime.now(timezone.utc) - LAST_PUSHED_AT).total_seconds()
            if age_sec < 30.0:
                return {
                    "source": "esp32_hardware_live",
                    "connected": True,
                    "ip_endpoint": "http-push-stream",
                    "age_seconds": round(age_sec, 1),
                    "data": LATEST_PUSHED_HARDWARE_SESSION
                }

        # Candidate URLs in case path differs slightly on ESP32 firmware
        urls_to_try = [url]
        if "192.168.4.1" in url or "192.168." in url:
            base = url.split("/")[0] + "//" + url.split("/")[2]
            for candidate_path in ["/api/session/latest", "/session", "/data", "/api/latest", "/status", "/"]:
                candidate = f"{base}{candidate_path}"
                if candidate not in urls_to_try:
                    urls_to_try.append(candidate)

        last_error = "Connection timed out"
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

        # Hardware is disconnected / unreachable
        return {
            "source": "esp32_hardware_offline",
            "connected": False,
            "ip_endpoint": url,
            "error": f"ESP32 hardware not detected at {url} ({last_error}). Please ensure computer Wi-Fi is connected to PhysioPod AP.",
            "data": None
        }

    @staticmethod
    def save_to_functional_test(db: Session, screening_session_id: str, session_data: Dict[str, Any]) -> FunctionalTest:
        """
        Persists the real 6-pod hardware agility session as an objective FunctionalTest in SQLite.
        """
        sides = session_data.get("sides", {})
        left = sides.get("left", {})
        right = sides.get("right", {})
        asym = sides.get("asymmetry", {})

        duration = float(session_data.get("duration_sec", 0.0))

        test = FunctionalTest(
            screening_session_id=screening_session_id,
            test_type="PHYSIO_POD",
            status="COMPLETED",
            duration_seconds=duration,
            quality_status="PASSED",
            result_summary={
                "device_id": session_data.get("device_id", "ESP32-PHYSIO-POD-DECK"),
                "total_trials": session_data.get("total_trials", 0),
                "asymmetry_index_pct": asym.get("asymmetry_index_pct", 0.0),
                "slower_side": asym.get("slower_side", "SYMMETRIC"),
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
