/**
 * Canonical data schema for the 6-Pod ESP32 Physio Pod System.
 * 
 * Empty zero-state baseline without mock data.
 * When hardware connects, live JSON from ESP32 replaces this structure.
 */
const initialEmptySession = {
  session_id: "AWAITING-HARDWARE-CONNECTION",
  timestamp: new Date().toISOString(),
  device_id: "ESP32-PHYSIO-POD-DECK",
  firmware_version: "live-v1",
  ip_address: "192.168.4.1",
  protocol_name: "Physical Pod Bilateral Agility Protocol",
  duration_sec: 0.0,
  total_trials: 0,

  sides: {
    left: {
      total_trials: 0,
      hits: 0,
      misses: 0,
      wrong: 0,
      hit_rate_pct: 0.0,
      avg_reaction_time_ms: 0.0,
      min_reaction_time_ms: 0.0,
      max_reaction_time_ms: 0.0,
      fastest_pod: 1
    },
    right: {
      total_trials: 0,
      hits: 0,
      misses: 0,
      wrong: 0,
      hit_rate_pct: 0.0,
      avg_reaction_time_ms: 0.0,
      min_reaction_time_ms: 0.0,
      max_reaction_time_ms: 0.0,
      fastest_pod: 4
    },
    asymmetry: {
      reaction_time_diff_ms: 0.0,
      asymmetry_index_pct: 0.0,
      slower_side: "SYMMETRIC",
      clinical_note: "Awaiting physical sensor touches on Physio Pods."
    }
  },

  pods: [
    { pod_id: 1, name: "Pod 1 (Left Lower / Anterior)", side: "LEFT", hits: 0, misses: 0, wrong: 0, total_stimuli: 0, hit_rate_pct: 0.0, avg_reaction_time_ms: 0.0, min_reaction_time_ms: 0.0, max_reaction_time_ms: 0.0, battery_pct: 100, status: "READY" },
    { pod_id: 2, name: "Pod 2 (Left Lateral)", side: "LEFT", hits: 0, misses: 0, wrong: 0, total_stimuli: 0, hit_rate_pct: 0.0, avg_reaction_time_ms: 0.0, min_reaction_time_ms: 0.0, max_reaction_time_ms: 0.0, battery_pct: 100, status: "READY" },
    { pod_id: 3, name: "Pod 3 (Left Medial / Pivot)", side: "LEFT", hits: 0, misses: 0, wrong: 0, total_stimuli: 0, hit_rate_pct: 0.0, avg_reaction_time_ms: 0.0, min_reaction_time_ms: 0.0, max_reaction_time_ms: 0.0, battery_pct: 100, status: "READY" },
    { pod_id: 4, name: "Pod 4 (Right Lower / Anterior)", side: "RIGHT", hits: 0, misses: 0, wrong: 0, total_stimuli: 0, hit_rate_pct: 0.0, avg_reaction_time_ms: 0.0, min_reaction_time_ms: 0.0, max_reaction_time_ms: 0.0, battery_pct: 100, status: "READY" },
    { pod_id: 5, name: "Pod 5 (Right Lateral)", side: "RIGHT", hits: 0, misses: 0, wrong: 0, total_stimuli: 0, hit_rate_pct: 0.0, avg_reaction_time_ms: 0.0, min_reaction_time_ms: 0.0, max_reaction_time_ms: 0.0, battery_pct: 100, status: "READY" },
    { pod_id: 6, name: "Pod 6 (Right Medial / Pivot)", side: "RIGHT", hits: 0, misses: 0, wrong: 0, total_stimuli: 0, hit_rate_pct: 0.0, avg_reaction_time_ms: 0.0, min_reaction_time_ms: 0.0, max_reaction_time_ms: 0.0, battery_pct: 100, status: "READY" }
  ],
  trials: []
};
