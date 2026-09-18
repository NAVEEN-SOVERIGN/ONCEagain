/**
 * Canonical data schema for the 6-Pod ESP32 Physio Pod System.
 * 
 * The ESP32 SoftAP (default 192.168.4.1) exposes:
 *   GET /api/session/latest
 * returning JSON matching this exact structure.
 */
const demoSessionData = {
  session_id: "SESSION-ESP32-20260918-001",
  timestamp: "2026-09-18T10:15:30Z",
  device_id: "ESP32-PHYSIO-HUB-01",
  firmware_version: "v2.1.0-softap",
  ip_address: "192.168.4.1",
  protocol_name: "Bilateral Knee Agility & Reaction Protocol",
  duration_sec: 48.6,
  total_trials: 28,

  // Left vs Right Limb Analysis
  sides: {
    left: {
      total_trials: 14,
      hits: 12,
      misses: 1,
      wrong: 1,
      hit_rate_pct: 85.7,
      avg_reaction_time_ms: 438.4,
      min_reaction_time_ms: 312.0,
      max_reaction_time_ms: 590.0,
      fastest_pod: 1
    },
    right: {
      total_trials: 14,
      hits: 10,
      misses: 2,
      wrong: 2,
      hit_rate_pct: 71.4,
      avg_reaction_time_ms: 546.8,
      min_reaction_time_ms: 385.0,
      max_reaction_time_ms: 780.0,
      fastest_pod: 5
    },
    asymmetry: {
      reaction_time_diff_ms: 108.4,
      asymmetry_index_pct: 22.0,
      slower_side: "RIGHT",
      clinical_note: "Noticeable unilateral response delay and hesitation on Right limb (22.0% slower than Left limb). Strongly consistent with right knee joint guarding or antalgic hesitation."
    }
  },

  // 6-Pod Hardware Performance Matrix
  pods: [
    {
      pod_id: 1,
      name: "Pod 1 (Left Lower / Anterior)",
      side: "LEFT",
      hits: 4,
      misses: 0,
      wrong: 0,
      total_stimuli: 4,
      hit_rate_pct: 100.0,
      avg_reaction_time_ms: 412.5,
      min_reaction_time_ms: 312.0,
      max_reaction_time_ms: 490.0,
      battery_pct: 94,
      rssi_dbm: -48,
      status: "ONLINE"
    },
    {
      pod_id: 2,
      name: "Pod 2 (Left Lateral)",
      side: "LEFT",
      hits: 4,
      misses: 1,
      wrong: 0,
      total_stimuli: 5,
      hit_rate_pct: 80.0,
      avg_reaction_time_ms: 435.0,
      min_reaction_time_ms: 340.0,
      max_reaction_time_ms: 540.0,
      battery_pct: 91,
      rssi_dbm: -52,
      status: "ONLINE"
    },
    {
      pod_id: 3,
      name: "Pod 3 (Left Medial / Pivot)",
      side: "LEFT",
      hits: 4,
      misses: 0,
      wrong: 1,
      total_stimuli: 5,
      hit_rate_pct: 80.0,
      avg_reaction_time_ms: 468.2,
      min_reaction_time_ms: 375.0,
      max_reaction_time_ms: 590.0,
      battery_pct: 88,
      rssi_dbm: -50,
      status: "ONLINE"
    },
    {
      pod_id: 4,
      name: "Pod 4 (Right Lower / Anterior)",
      side: "RIGHT",
      hits: 3,
      misses: 1,
      wrong: 1,
      total_stimuli: 5,
      hit_rate_pct: 60.0,
      avg_reaction_time_ms: 572.0,
      min_reaction_time_ms: 420.0,
      max_reaction_time_ms: 780.0,
      battery_pct: 96,
      rssi_dbm: -46,
      status: "ONLINE"
    },
    {
      pod_id: 5,
      name: "Pod 5 (Right Lateral)",
      side: "RIGHT",
      hits: 4,
      misses: 0,
      wrong: 0,
      total_stimuli: 4,
      hit_rate_pct: 100.0,
      avg_reaction_time_ms: 510.4,
      min_reaction_time_ms: 385.0,
      max_reaction_time_ms: 615.0,
      battery_pct: 93,
      rssi_dbm: -54,
      status: "ONLINE"
    },
    {
      pod_id: 6,
      name: "Pod 6 (Right Medial / Pivot)",
      side: "RIGHT",
      hits: 3,
      misses: 1,
      wrong: 1,
      total_stimuli: 5,
      hit_rate_pct: 60.0,
      avg_reaction_time_ms: 558.0,
      min_reaction_time_ms: 410.0,
      max_reaction_time_ms: 710.0,
      battery_pct: 89,
      rssi_dbm: -49,
      status: "ONLINE"
    }
  ],

  // Granular Event Log of Every Single Stimulus Trial
  trials: [
    { trial_num: 1, time_offset_ms: 1200, pod_id: 1, side: "LEFT", target_color: "GREEN", reaction_time_ms: 385, result: "HIT" },
    { trial_num: 2, time_offset_ms: 2850, pod_id: 4, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 590, result: "HIT" },
    { trial_num: 3, time_offset_ms: 4400, pod_id: 2, side: "LEFT", target_color: "BLUE", reaction_time_ms: 410, result: "HIT" },
    { trial_num: 4, time_offset_ms: 6100, pod_id: 5, side: "RIGHT", target_color: "BLUE", reaction_time_ms: 495, result: "HIT" },
    { trial_num: 5, time_offset_ms: 7800, pod_id: 3, side: "LEFT", target_color: "GREEN", reaction_time_ms: 440, result: "HIT" },
    { trial_num: 6, time_offset_ms: 9500, pod_id: 6, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 620, result: "HIT" },
    { trial_num: 7, time_offset_ms: 11100, pod_id: 1, side: "LEFT", target_color: "GREEN", reaction_time_ms: 312, result: "HIT" },
    { trial_num: 8, time_offset_ms: 12900, pod_id: 4, side: "RIGHT", target_color: "RED", reaction_time_ms: 780, result: "WRONG" },
    { trial_num: 9, time_offset_ms: 14700, pod_id: 2, side: "LEFT", target_color: "GREEN", reaction_time_ms: 340, result: "HIT" },
    { trial_num: 10, time_offset_ms: 16400, pod_id: 5, side: "RIGHT", target_color: "BLUE", reaction_time_ms: 385, result: "HIT" },
    { trial_num: 11, time_offset_ms: 18100, pod_id: 3, side: "LEFT", target_color: "RED", reaction_time_ms: 590, result: "WRONG" },
    { trial_num: 12, time_offset_ms: 19800, pod_id: 6, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 710, result: "MISS" },
    { trial_num: 13, time_offset_ms: 21500, pod_id: 1, side: "LEFT", target_color: "BLUE", reaction_time_ms: 460, result: "HIT" },
    { trial_num: 14, time_offset_ms: 23200, pod_id: 4, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 420, result: "HIT" },
    { trial_num: 15, time_offset_ms: 24900, pod_id: 2, side: "LEFT", target_color: "GREEN", reaction_time_ms: 450, result: "HIT" },
    { trial_num: 16, time_offset_ms: 26700, pod_id: 5, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 520, result: "HIT" },
    { trial_num: 17, time_offset_ms: 28400, pod_id: 3, side: "LEFT", target_color: "BLUE", reaction_time_ms: 465, result: "HIT" },
    { trial_num: 18, time_offset_ms: 30100, pod_id: 6, side: "RIGHT", target_color: "RED", reaction_time_ms: 640, result: "WRONG" },
    { trial_num: 19, time_offset_ms: 31900, pod_id: 1, side: "LEFT", target_color: "GREEN", reaction_time_ms: 490, result: "HIT" },
    { trial_num: 20, time_offset_ms: 33600, pod_id: 4, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 850, result: "MISS" },
    { trial_num: 21, time_offset_ms: 35400, pod_id: 2, side: "LEFT", target_color: "GREEN", reaction_time_ms: 540, result: "MISS" },
    { trial_num: 22, time_offset_ms: 37200, pod_id: 5, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 645, result: "HIT" },
    { trial_num: 23, time_offset_ms: 39000, pod_id: 3, side: "LEFT", target_color: "GREEN", reaction_time_ms: 375, result: "HIT" },
    { trial_num: 24, time_offset_ms: 40700, pod_id: 6, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 410, result: "HIT" },
    { trial_num: 25, time_offset_ms: 42500, pod_id: 2, side: "LEFT", target_color: "GREEN", reaction_time_ms: 400, result: "HIT" },
    { trial_num: 26, time_offset_ms: 44200, pod_id: 4, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 505, result: "HIT" },
    { trial_num: 27, time_offset_ms: 45900, pod_id: 3, side: "LEFT", target_color: "GREEN", reaction_time_ms: 395, result: "HIT" },
    { trial_num: 28, time_offset_ms: 47600, pod_id: 6, side: "RIGHT", target_color: "GREEN", reaction_time_ms: 425, result: "HIT" }
  ]
};

// If in Node / CommonJS environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { demoSessionData };
}
