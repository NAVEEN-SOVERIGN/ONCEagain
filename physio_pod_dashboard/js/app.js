/**
 * Physio Pod Dashboard Application Logic
 * 
 * Supports both standalone DEMO_MODE and direct live ESP32 SoftAP fetching.
 */

// Configuration Defaults
let DEMO_MODE = false;
let ESP32_API_URL = "http://192.168.4.1/api/session/latest";

let currentSession = null;
let currentTrialFilter = "ALL";
let pollInterval = null;

// DOM Elements
const modeSelect = document.getElementById("mode-select");
const esp32UrlInput = document.getElementById("esp32-url");
const btnFetch = document.getElementById("btn-fetch");
const autoPollCheck = document.getElementById("auto-poll");
const hardwareBadge = document.getElementById("hardware-badge");
const sessionClock = document.getElementById("session-clock");
const connectionAlert = document.getElementById("connection-alert");

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadSession();
});

function setupEventListeners() {
  if (modeSelect) {
    modeSelect.addEventListener("change", (e) => {
      DEMO_MODE = e.target.value === "DEMO";
      loadSession();
    });
  }

  esp32UrlInput.addEventListener("change", (e) => {
    ESP32_API_URL = e.target.value.trim();
  });

  btnFetch.addEventListener("click", () => {
    loadSession();
  });

  autoPollCheck.addEventListener("change", (e) => {
    if (e.target.checked) {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(() => {
        loadSession(true);
      }, 2000);
    } else {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = null;
    }
  });
}

/**
 * Fetch or load latest session data
 */
async function loadSession(silent = false) {
  // Live ESP32 Mode
  try {
    if (!silent) {
      hardwareBadge.className = "status-badge status-demo";
      hardwareBadge.textContent = "● POLLING ESP32 HARDWARE...";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const targetUrl = esp32UrlInput.value.trim() || ESP32_API_URL;
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const liveData = await response.json();
    currentSession = liveData;

    hardwareBadge.className = "status-badge status-connected";
    hardwareBadge.textContent = `● REAL ESP32 ONLINE (${liveData.ip_address || "192.168.4.1"})`;
    if (connectionAlert) connectionAlert.style.display = "none";

    renderDashboard(currentSession);
  } catch (err) {
    console.warn("Live ESP32 fetch failed:", err);
    hardwareBadge.className = "status-badge status-offline";
    hardwareBadge.textContent = "● ESP32 OFFLINE (AWAITING WI-FI)";

    if (connectionAlert) {
      connectionAlert.style.display = "block";
      connectionAlert.innerHTML = `
        <strong>Physio Pod Hardware Notice:</strong> Awaiting connection to <code>${esp32UrlInput.value}</code>.<br/>
        1. Connect your computer Wi-Fi to your ESP32's network (e.g. <em>PhysioPod-AP</em>).<br/>
        2. Verify the ESP32 IP is reachable at <code>192.168.4.1</code>. Zero mock data active.
      `;
    }

    if (!currentSession) {
      currentSession = initialEmptySession;
      renderDashboard(currentSession);
    }
  }
}

/**
 * Render all dashboard sections
 */
function renderDashboard(data) {
  if (!data) return;

  // Header timestamp
  if (data.timestamp) {
    const d = new Date(data.timestamp);
    sessionClock.textContent = `Recorded: ${d.toLocaleTimeString()} (${data.duration_sec}s trial)`;
  }

  // Master Summary 4-Metric Grid
  document.getElementById("val-total-trials").textContent = data.total_trials || 0;
  document.getElementById("val-duration").textContent = `Duration: ${data.duration_sec || 0} s`;

  const left = data.sides?.left || {};
  const right = data.sides?.right || {};
  const asym = data.sides?.asymmetry || {};

  const totalHits = (left.hits || 0) + (right.hits || 0);
  const totalMisses = (left.misses || 0) + (right.misses || 0);
  const totalTrials = data.total_trials || (totalHits + totalMisses);
  const overallHitRate = totalTrials > 0 ? ((totalHits / totalTrials) * 100).toFixed(1) : "0.0";

  document.getElementById("val-hit-rate").textContent = `${overallHitRate}%`;
  document.getElementById("val-hits-misses").textContent = `${totalHits} hits / ${totalMisses} misses`;

  const meanRT = left.avg_reaction_time_ms && right.avg_reaction_time_ms
    ? (((left.avg_reaction_time_ms + right.avg_reaction_time_ms) / 2)).toFixed(1)
    : "--";
  document.getElementById("val-mean-rt").textContent = `${meanRT} ms`;

  document.getElementById("val-asym").textContent = `${asym.asymmetry_index_pct ? asym.asymmetry_index_pct.toFixed(1) : "0.0"}%`;
  document.getElementById("val-slower-side").textContent = `Slower limb: ${asym.slower_side || "Symmetric"}`;

  // Left Limb Card
  document.getElementById("left-hit-rate").textContent = `${left.hit_rate_pct ? left.hit_rate_pct.toFixed(1) : "--"}%`;
  document.getElementById("left-avg-rt").textContent = `${left.avg_reaction_time_ms ? left.avg_reaction_time_ms.toFixed(1) : "--"} ms`;
  document.getElementById("left-hits").textContent = `${left.hits || 0} / ${left.total_trials || 0}`;
  document.getElementById("left-misses-wrong").textContent = `${left.misses || 0} miss / ${left.wrong || 0} wrong`;

  // Right Limb Card
  document.getElementById("right-hit-rate").textContent = `${right.hit_rate_pct ? right.hit_rate_pct.toFixed(1) : "--"}%`;
  document.getElementById("right-avg-rt").textContent = `${right.avg_reaction_time_ms ? right.avg_reaction_time_ms.toFixed(1) : "--"} ms`;
  document.getElementById("right-hits").textContent = `${right.hits || 0} / ${right.total_trials || 0}`;
  document.getElementById("right-misses-wrong").textContent = `${right.misses || 0} miss / ${right.wrong || 0} wrong`;

  // Asymmetry Callout
  const asymText = document.getElementById("asym-text");
  if (asym.clinical_note) {
    asymText.textContent = asym.clinical_note;
  } else if (asym.asymmetry_index_pct) {
    asymText.textContent = `${asym.slower_side} limb demonstrates ${asym.asymmetry_index_pct.toFixed(1)}% longer reaction latency (${asym.reaction_time_diff_ms ? asym.reaction_time_diff_ms.toFixed(1) : ""} ms differential), indicative of unilateral joint guarding or load hesitation.`;
  } else {
    asymText.textContent = "Bilateral symmetry within normal physiological limits (< 10% reaction delta).";
  }

  // Relative Bar Comparison (Max baseline 800ms)
  const maxBaselineMs = 800;
  const leftPct = Math.min(100, Math.max(10, ((left.avg_reaction_time_ms || 400) / maxBaselineMs) * 100));
  const rightPct = Math.min(100, Math.max(10, ((right.avg_reaction_time_ms || 400) / maxBaselineMs) * 100));

  document.getElementById("bar-left-rt").style.width = `${leftPct}%`;
  document.getElementById("bar-val-left-rt").textContent = `${left.avg_reaction_time_ms ? left.avg_reaction_time_ms.toFixed(1) : "--"} ms`;

  document.getElementById("bar-right-rt").style.width = `${rightPct}%`;
  document.getElementById("bar-val-right-rt").textContent = `${right.avg_reaction_time_ms ? right.avg_reaction_time_ms.toFixed(1) : "--"} ms`;

  // Six-Pod Table
  renderPodsTable(data.pods || []);

  // Per-Pod Latency Bar Graph
  renderPerPodBars(data.pods || []);

  // Granular Trial Log
  renderTrialsLog(data.trials || []);
}

/**
 * Render Six-Pod Performance Table
 */
function renderPodsTable(pods) {
  const tbody = document.getElementById("pods-table-body");
  if (!tbody) return;

  tbody.innerHTML = pods.map((p) => {
    const isLeft = p.side === "LEFT";
    const sideBadge = isLeft
      ? `<span class="badge badge-left">LEFT</span>`
      : `<span class="badge badge-right">RIGHT</span>`;

    const statusBadge = p.status === "ONLINE"
      ? `<span style="color: var(--tier1-text); font-weight: 600;">● Online</span>`
      : `<span style="color: var(--text-faint);">Offline</span>`;

    return `
      <tr>
        <td style="font-weight: 600; font-family: var(--font-mono);">
          Pod #${p.pod_id} <span style="font-weight: normal; font-family: var(--font-sans); color: var(--text-secondary);">(${p.name})</span>
        </td>
        <td>${sideBadge}</td>
        <td style="font-family: var(--font-mono);">${p.total_stimuli || (p.hits + p.misses + p.wrong)}</td>
        <td style="font-family: var(--font-mono); color: var(--tier1-text); font-weight: 600;">${p.hits}</td>
        <td style="font-family: var(--font-mono); color: var(--tier3-text);">${p.misses}</td>
        <td style="font-family: var(--font-mono); color: #b45309;">${p.wrong}</td>
        <td style="font-weight: 600;">${p.hit_rate_pct ? p.hit_rate_pct.toFixed(1) : "--"}%</td>
        <td style="font-family: var(--font-mono); font-weight: 600; color: var(--accent-primary);">${p.avg_reaction_time_ms ? p.avg_reaction_time_ms.toFixed(1) : "--"} ms</td>
        <td style="font-size: 11.5px; color: var(--text-secondary); font-family: var(--font-mono);">${p.min_reaction_time_ms || "--"} – ${p.max_reaction_time_ms || "--"} ms</td>
        <td style="font-family: var(--font-mono);">${p.battery_pct ? `${p.battery_pct}%` : "100%"}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join("");
}

/**
 * Render Per-Pod Latency Bar Graph
 */
function renderPerPodBars(pods) {
  const container = document.getElementById("per-pod-bars");
  if (!container) return;

  const maxMs = 800;

  container.innerHTML = pods.map((p) => {
    const isLeft = p.side === "LEFT";
    const fillClass = isLeft ? "bar-fill-left" : "bar-fill-right";
    const widthPct = Math.min(100, Math.max(10, ((p.avg_reaction_time_ms || 400) / maxMs) * 100));

    return `
      <div class="bar-row">
        <div class="bar-label">Pod #${p.pod_id} (${p.side})</div>
        <div class="bar-track">
          <div class="bar-fill ${fillClass}" style="width: ${widthPct}%;"></div>
        </div>
        <div class="bar-val">${p.avg_reaction_time_ms ? p.avg_reaction_time_ms.toFixed(1) : "--"} ms</div>
      </div>
    `;
  }).join("");
}

/**
 * Render Granular Trial Log
 */
function renderTrialsLog(trials) {
  const tbody = document.getElementById("trials-table-body");
  if (!tbody) return;

  let filtered = trials;
  if (currentTrialFilter === "LEFT") {
    filtered = trials.filter((t) => t.side === "LEFT");
  } else if (currentTrialFilter === "RIGHT") {
    filtered = trials.filter((t) => t.side === "RIGHT");
  } else if (currentTrialFilter === "ERRORS") {
    filtered = trials.filter((t) => t.result === "MISS" || t.result === "WRONG");
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 16px;">No trials match current filter (${currentTrialFilter}).</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((t) => {
    let resultBadge = `<span class="badge badge-hit">HIT</span>`;
    if (t.result === "MISS") resultBadge = `<span class="badge badge-miss">MISS</span>`;
    else if (t.result === "WRONG") resultBadge = `<span class="badge badge-wrong">WRONG</span>`;

    const sideBadge = t.side === "LEFT"
      ? `<span class="badge badge-left">LEFT</span>`
      : `<span class="badge badge-right">RIGHT</span>`;

    return `
      <tr>
        <td style="font-family: var(--font-mono); color: var(--text-secondary);">${t.trial_num}</td>
        <td style="font-family: var(--font-mono);">${t.time_offset_ms} ms</td>
        <td style="font-weight: 600;">Pod #${t.pod_id}</td>
        <td>${sideBadge}</td>
        <td><span style="font-size: 11px; font-weight: 600;">${t.target_color || "GREEN"}</span></td>
        <td style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">${t.reaction_time_ms} ms</td>
        <td>${resultBadge}</td>
      </tr>
    `;
  }).join("");
}

/**
 * Global helper for trial log filtering
 */
function filterTrials(filter) {
  currentTrialFilter = filter;
  if (currentSession) {
    renderTrialsLog(currentSession.trials || []);
  }
}
