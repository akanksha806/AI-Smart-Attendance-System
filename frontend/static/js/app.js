/* ==========================================================
   AI SMART ATTENDANCE — SHARED APP UTILITIES
   Loaded on every page. Provides: API helper, toast system,
   sidebar drawer, live clock, active nav highlighting.
   ========================================================== */

const API_BASE = ""; // frontend and backend are served from the same FastAPI app

/* ---------- Generic API helper ---------- */
async function apiRequest(path, options = {}) {
  const res = await fetch(API_BASE + path, options);

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    // Some responses may not return JSON; treat as empty body
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

async function apiGet(path) {
  return apiRequest(path, { method: "GET" });
}

async function apiPostJSON(path, body) {
  return apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function apiPutJSON(path, body) {
  return apiRequest(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function apiDelete(path) {
  return apiRequest(path, { method: "DELETE" });
}

async function apiPostForm(path, formData) {
  // Never set Content-Type manually for FormData — the browser
  // sets the correct multipart boundary automatically.
  return apiRequest(path, { method: "POST", body: formData });
}

/* ---------- Toast notifications ---------- */
const ICONS = {
  success: "check-circle-2",
  error: "x-circle",
  info: "info",
};

function showToast(type, message, timeout = 4200) {
  const host = document.getElementById("toastHost");
  if (!host) return;

  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `
    <i data-lucide="${ICONS[type] || "info"}"></i>
    <div class="toast-msg">${escapeHtml(message)}</div>
  `;
  host.appendChild(el);

  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    el.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    el.style.opacity = "0";
    el.style.transform = "translateX(16px)";
    setTimeout(() => el.remove(), 200);
  }, timeout);
}

function toastSuccess(msg) { showToast("success", msg); }
function toastError(msg) { showToast("error", msg); }
function toastInfo(msg) { showToast("info", msg); }

/* ---------- Small helpers ---------- */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const cls = s === "present" ? "badge-present" : s === "late" ? "badge-late" : s === "absent" ? "badge-absent" : "badge-neutral";
  const label = status ? status : "Unknown";
  return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
}

// Normalizes whatever date shape MySQL/FastAPI returns (e.g. "2026-08-09" or full ISO) to YYYY-MM-DD
function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

// Normalizes a TIME field (e.g. "14:32:07") to HH:MM
function normalizeTime(value) {
  if (!value) return "";
  const parts = String(value).split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return String(value);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------- Sidebar drawer (mobile) ---------- */
function initDrawer() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("drawerToggle");
  const overlay = document.getElementById("drawerOverlay");
  if (!sidebar || !toggle || !overlay) return;

  const open = () => { sidebar.classList.add("open"); overlay.classList.add("open"); };
  const close = () => { sidebar.classList.remove("open"); overlay.classList.remove("open"); };

  toggle.addEventListener("click", () => {
    sidebar.classList.contains("open") ? close() : open();
  });
  overlay.addEventListener("click", close);

  sidebar.querySelectorAll(".nav-item").forEach((link) => {
    link.addEventListener("click", close);
  });
}

/* ---------- Active nav highlighting ---------- */
function initActiveNav() {
  const path = window.location.pathname;
  const map = {
    "/": "dashboard",
    "/students-page": "students",
    "/attendance-page": "attendance",
    "/recognition-page": "recognition",
    "/settings-page": "settings",
  };
  const active = map[path];
  if (!active) return;
  document.querySelectorAll(`.nav-item[data-nav="${active}"]`).forEach((el) => el.classList.add("active"));
}

/* ---------- Live clock ---------- */
function initClock() {
  const el = document.getElementById("clockText");
  if (!el) return;
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  tick();
  setInterval(tick, 1000 * 30);
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initDrawer();
  initActiveNav();
  initClock();
  if (window.lucide) lucide.createIcons();
});
