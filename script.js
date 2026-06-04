/* ============================================================
   EMP JAPEX – Meeting Room Dashboard  |  script.js
   ============================================================ */

// ─────────────────────────────────────────────
// 1. KONFIGURASI — EDIT BAGIAN INI SAJA
// ─────────────────────────────────────────────

const SHEET_ID  = "1b-pSFQ2HehQnjOF_e1QFZKKxgLWNaivNf9iRJrWnFVk";
const SHEET_GID = "0"; // gid tab sheet (lihat #gid= di URL, default 0)

const ROOMS               = ["GEBANG", "SECANGGANG", "ARBEI", "ANGGOR"];
const TIMELINE_START      = 7;           // 07:00
const TIMELINE_END        = 18;          // 18:00
const HOUR_HEIGHT_PX      = 66;
const REFRESH_INTERVAL_MS = 60 * 1000;  // auto-refresh tiap 1 menit

// ─────────────────────────────────────────────
// 2. STATE
// ─────────────────────────────────────────────
let scheduleData = [];

// ─────────────────────────────────────────────
// 3. FALLBACK — tampil jika sheet gagal diakses
// ─────────────────────────────────────────────
/* const FALLBACK_DATA = [
  { room: "SECANGGANG", title: "HCS Meeting",             start: "07:00", end: "10:00", participants: 4 },
  { room: "GEBANG",     title: "IT Discussion",           start: "14:00", end: "15:00", participants: 3 },
  { room: "ARBEI",      title: "Meeting Room Management", start: "14:00", end: "17:00", participants: 3 },
]; */

// ─────────────────────────────────────────────
// 4. CLOCK REALTIME (WIB = UTC+7)
// ─────────────────────────────────────────────

function getWIBNow() {
  const now   = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 7 * 3600000);
}

function pad2(n) { return String(n).padStart(2, "0"); }

function updateClock() {
  const d      = getWIBNow();
  const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  document.getElementById("clock-time").textContent =
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  document.getElementById("clock-date").textContent =
    `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function startClock() { updateClock(); setInterval(updateClock, 1000); }

// ─────────────────────────────────────────────
// 5. UTILITAS WAKTU
// ─────────────────────────────────────────────

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToPx(min) {
  return ((min - TIMELINE_START * 60) / 60) * HOUR_HEIGHT_PX;
}
function isActiveNow(start, end) {
  const now = getWIBNow();
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= timeToMinutes(start) && cur < timeToMinutes(end);
}
function isRoomInUse(room) {
  return scheduleData.some(b => b.room === room && isActiveNow(b.start, b.end));
}

// ─────────────────────────────────────────────
// 6. FILTER TANGGAL — hanya tampil hari ini (WIB)
// ─────────────────────────────────────────────

function getTodayISO() {
  const d = getWIBNow();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getTodayDayNames() {
  const d   = getWIBNow();
  const idx = d.getDay();
  const ID  = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const EN  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return [ID[idx].toLowerCase(), EN[idx].toLowerCase(),
          ID[idx].toLowerCase().slice(0,3), EN[idx].toLowerCase().slice(0,3)];
}

function normalizeDateToISO(val) {

  if (!val && val !== 0) return null;

  const str = String(val).trim();
   console.log(
  "DATE STRING:",
  str,
  "TYPE:",
  typeof str
);

  // FORMAT GVIZ
 const gviz = str.match(
  /^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})/
);

if (gviz) {

  const year  = parseInt(gviz[1],10);
  const month = parseInt(gviz[2],10) + 1;
  const day   = parseInt(gviz[3],10);

  const result =
    `${year}-${pad2(month)}-${pad2(day)}`;

  console.log(
    "GVIZ PARSED:",
    str,
    "=>",
    result
  );

  return result;
}

  // Format: 4-Jun-2026
  const monthText = str.match(
    /^(\d{1,2})\-([A-Za-z]{3})\-(\d{4})$/
  );

  if (monthText) {

    const months = {
      jan:"01",
      feb:"02",
      mar:"03",
      apr:"04",
      may:"05",
      jun:"06",
      jul:"07",
      aug:"08",
      sep:"09",
      oct:"10",
      nov:"11",
      dec:"12"
    };

    return `${monthText[3]}-${
      months[monthText[2].toLowerCase()]
    }-${pad2(monthText[1])}`;
  }

  // Format: 06-04-2026 atau 06/04/2026
  const mdy = str.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
  );

  if (mdy) {

    const month = Number(mdy[1]);
    const day   = Number(mdy[2]);
    const year  = Number(mdy[3]);

    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  return null;
}

function isDateToday(val) {
  // Tidak ada kolom date → tampilkan semua baris
  if (val === null || val === undefined || String(val).trim() === "") return true;

  // Coba cocokkan sebagai tanggal
  const iso = normalizeDateToISO(val);
  if (iso) return iso === getTodayISO();

  // Coba cocokkan sebagai nama hari (Senin, Tuesday, dll)
  const lower = String(val).trim().toLowerCase();
  return getTodayDayNames().some(n => lower === n || lower.startsWith(n));
}

// ─────────────────────────────────────────────
// 7. NORMALISASI WAKTU
// ─────────────────────────────────────────────

function normalizeTime(val){

    if(val == null)
        return "";

    const str =
        String(val).trim();

    // Format Google GViz
    const gviz =
        str.match(
            /Date\(\d+,\d+,\d+,(\d+),(\d+),?(\d+)?\)/
        );

    if(gviz){

        const hh =
            pad2(gviz[1]);

        const mm =
            pad2(gviz[2]);

        return `${hh}:${mm}`;
    }

    // Format normal 08:00
    const normal =
        str.match(
            /^(\d{1,2}):(\d{2})/
        );

    if(normal){

        return (
            pad2(normal[1])
            +
            ":"
            +
            normal[2]
        );
    }

    return "";
}

// ─────────────────────────────────────────────
// 8. FETCH & PARSE GVIZ
// ─────────────────────────────────────────────

function buildGvizURL() {
  // Tanpa gid agar otomatis ambil sheet pertama; tambah &gid=xxx jika perlu tab lain
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
}

function parseGvizResponse(rawText) {
  const jsonStart = rawText.indexOf("{");
  const jsonEnd   = rawText.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1)
    throw new Error("Format response gviz tidak dikenali.");

  const gviz  = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
  const table = gviz?.table;
  if (!table) throw new Error("Tidak ada tabel dalam response gviz.");

  // Map nama kolom lowercase → index
  const col = {};
  (table.cols || []).forEach((c, i) => {
    const label = (c.label || c.id || "").trim().toLowerCase();
    if (label) col[label] = i;
  });

  console.log("[Dashboard] Kolom terdeteksi:", Object.keys(col));

  // Validasi kolom wajib
  for (const key of ["room", "title", "start", "end"]) {
    if (col[key] === undefined)
      throw new Error(`Kolom wajib "${key}" tidak ditemukan di header sheet.`);
  }

  const hasDate  = col["date"] !== undefined;
  const todayISO = getTodayISO();
  console.log(`[Dashboard] Hari ini: ${todayISO} | Filter kolom date: ${hasDate}`);

  const results = [];

  (table.rows || []).forEach(row => {
    if (!row?.c) return;

    const get = (key) => {
      const idx = col[key];
      if (idx === undefined) return null;
      const cell = row.c[idx];
      if (!cell) return null;
      return (cell.v !== undefined && cell.v !== null) ? cell.v : (cell.f ?? null);
    };

    // ── FILTER TANGGAL ──

      console.log(
    "RAW DATE:",
    get("date"),
    "ISO:",
    normalizeDateToISO(get("date")),
    "TODAY:",
    getTodayISO()
  );
    if (!isDateToday(get("date"))) return;

    const room  = String(get("room")  ?? "").trim().toUpperCase();
    const title = String(get("title") ?? "").trim();
    const start = normalizeTime(get("start"));
    const end   = normalizeTime(get("end"));
   

    // Fix participants: gviz return number langsung, bukan string
    const rawP         = get("participants");
    const participants = typeof rawP === "number"
      ? Math.round(rawP)
      : parseInt(String(rawP ?? "0"), 10) || 0;

      console.log({
      room,
      title,
      startRaw: get("start"),
      endRaw: get("end"),
      start,
      end
    });

    if (!room || !title || !start || !end) return;

    console.log(`[Dashboard] ✅ ${room} | ${title} | ${start}–${end} | ${participants} org`);
    results.push({ room, title, start, end, participants });
  });

  console.log(`[Dashboard] Total hari ini: ${results.length} booking`);
  return results;
}

// ─────────────────────────────────────────────
// 9. FETCH DENGAN TIMEOUT
// ─────────────────────────────────────────────

async function fetchSchedule() {
  const url = buildGvizURL();
  console.log("[Dashboard] Fetching:", url);

  // Timeout 10 detik — tanpa ini fetch bisa hang selamanya
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const raw = await res.text();

    // Jika Google redirect ke halaman login (sheet tidak publik)
    if (raw.trim().startsWith("<!") || raw.trim().startsWith("<html")) {
      throw new Error("Sheet tidak publik. Buka Google Sheet → Share → Anyone with the link → Viewer.");
    }

    const data = parseGvizResponse(raw);
    hideErrorBanner();
    return data;

  } catch (err) {
    clearTimeout(timer);
    const msg = err.name === "AbortError"
      ? "Timeout 10 detik. Cek koneksi atau pastikan sheet sudah di-share publik."
      : err.message;
    console.error("[Dashboard] Fetch gagal:", msg);
    showErrorBanner(`⚠️ ${msg} — Menampilkan data demo.`);
    return FALLBACK_DATA;
  }
}

// ─────────────────────────────────────────────
// 10. LOADING & ERROR
// ─────────────────────────────────────────────

function showErrorBanner(msg) {
  const el = document.getElementById("error-banner");
  document.getElementById("error-msg").textContent = msg;
  el.style.display = "flex";
}
function hideErrorBanner() {
  document.getElementById("error-banner").style.display = "none";
}
function showLoading() {
  document.getElementById("loading-overlay").classList.remove("hidden");
}
function hideLoading() {
  document.getElementById("loading-overlay").classList.add("hidden");
}

// ─────────────────────────────────────────────
// 11. BUILD DOM – SIDEBAR WAKTU
// ─────────────────────────────────────────────

function buildTimeSidebar() {
  const sidebar = document.getElementById("time-sidebar");
  for (let h = TIMELINE_START; h <= TIMELINE_END; h++) {
    const el = document.createElement("div");
    el.className   = "time-slot-label";
    el.textContent = `${pad2(h)}:00`;
    sidebar.appendChild(el);
  }
}

// ─────────────────────────────────────────────
// 12. BUILD DOM – KOLOM ROOM
// ─────────────────────────────────────────────

function buildRoomColumn(roomName, bookings) {
  const inUse  = isRoomInUse(roomName);
  const status = inUse ? "in-use" : "available";

  const col      = document.createElement("div");
  col.className  = "room-column";
  col.id         = `room-col-${roomName}`;

  // Header
  const header    = document.createElement("div");
  header.className = "room-header";

  const top       = document.createElement("div");
  top.className   = "room-header-top";

  const icon      = document.createElement("div");
  icon.className  = `room-icon-wrap ${status}`;
  icon.innerHTML  = `<i class="fa-solid fa-users"></i>`;

  const name      = document.createElement("div");
  name.className  = "room-name";
  name.textContent = roomName;

  top.appendChild(icon);
  top.appendChild(name);

  const badge      = document.createElement("div");
  badge.className  = `status-badge ${status}`;
  badge.textContent = inUse ? "IN USE" : "AVAILABLE";

  header.appendChild(top);
  header.appendChild(badge);
  col.appendChild(header);

  // Timeline
  const totalH = TIMELINE_END - TIMELINE_START;
  const tl     = document.createElement("div");
  tl.className = "timeline-container";
  tl.style.height = `${totalH * HOUR_HEIGHT_PX}px`;

  for (let i = 0; i <= totalH; i++) {
    const line      = document.createElement("div");
    line.className  = "hour-line";
    line.style.top  = `${i * HOUR_HEIGHT_PX}px`;
    tl.appendChild(line);
  }

  const nowEl = createNowIndicator();
  if (nowEl) tl.appendChild(nowEl);

  if (bookings.length === 0) {
    const empty     = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<i class="fa-regular fa-calendar-xmark"></i>Tidak ada jadwal`;
    tl.appendChild(empty);
  } else {
    bookings.forEach(b => { const c = buildBookingCard(b); if (c) tl.appendChild(c); });
  }

  col.appendChild(tl);
  return col;
}

// ─────────────────────────────────────────────
// 13. BOOKING CARD
// ─────────────────────────────────────────────

function buildBookingCard(b) {
  const sMin = timeToMinutes(b.start);
  const eMin = timeToMinutes(b.end);
  const tlS  = TIMELINE_START * 60;
  const tlE  = TIMELINE_END   * 60;

  if (eMin <= tlS || sMin >= tlE) return null;

  const cs  = Math.max(sMin, tlS);
  const ce  = Math.min(eMin, tlE);
  const h   = ((ce - cs) / 60) * HOUR_HEIGHT_PX;

  const card         = document.createElement("div");
  card.className     = "booking-card";
  card.style.top     = `${minutesToPx(cs)}px`;
  card.style.height  = `${Math.max(h - 4, 20)}px`;
  if (h < 48) card.classList.add("compact");

  card.innerHTML = `
    <div class="booking-title">${escapeHtml(b.title)}</div>
    <div class="booking-time">${escapeHtml(b.start)} – ${escapeHtml(b.end)}</div>
    ${b.participants ? `<div class="booking-participants">
      <i class="fa-solid fa-user-group"></i><span>${b.participants}</span>
    </div>` : ""}
  `;

  card.addEventListener("mouseenter", e => showTooltip(e, b));
  card.addEventListener("mousemove",  e => moveTooltip(e));
  card.addEventListener("mouseleave", hideTooltip);
  return card;
}

// ─────────────────────────────────────────────
// 14. NOW INDICATOR
// ─────────────────────────────────────────────

function createNowIndicator() {
  const d   = getWIBNow();
  const min = d.getHours() * 60 + d.getMinutes();
  if (min < TIMELINE_START * 60 || min > TIMELINE_END * 60) return null;
  const el      = document.createElement("div");
  el.className  = "now-indicator";
  el.style.top  = `${minutesToPx(min)}px`;
  return el;
}

function updateNowIndicators() {
  const d   = getWIBNow();
  const min = d.getHours() * 60 + d.getMinutes();
  document.querySelectorAll(".now-indicator").forEach(el => {
    if (min >= TIMELINE_START * 60 && min <= TIMELINE_END * 60) {
      el.style.top = `${minutesToPx(min)}px`; el.style.display = "";
    } else { el.style.display = "none"; }
  });
}

// ─────────────────────────────────────────────
// 15. TOOLTIP
// ─────────────────────────────────────────────

let tooltipEl = null;
function ensureTooltip() {
  if (!tooltipEl) {
    tooltipEl           = document.createElement("div");
    tooltipEl.className = "tooltip-popup";
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}
function showTooltip(e, b) {
  const el = ensureTooltip();
  el.innerHTML = `
    <strong>${escapeHtml(b.title)}</strong>
    <div class="tooltip-row"><i class="fa-regular fa-clock"></i> ${escapeHtml(b.start)} – ${escapeHtml(b.end)}</div>
    <div class="tooltip-row"><i class="fa-solid fa-door-open"></i> ${escapeHtml(b.room)}</div>
    ${b.participants ? `<div class="tooltip-row"><i class="fa-solid fa-user-group"></i> ${b.participants} peserta</div>` : ""}
  `;
  moveTooltip(e);
  requestAnimationFrame(() => el.classList.add("visible"));
}
function moveTooltip(e) {
  if (!tooltipEl) return;
  const w = tooltipEl.offsetWidth || 180;
  const x = e.clientX + 14;
  tooltipEl.style.left = `${x + w > window.innerWidth ? e.clientX - w - 14 : x}px`;
  tooltipEl.style.top  = `${e.clientY - 10}px`;
}
function hideTooltip() { if (tooltipEl) tooltipEl.classList.remove("visible"); }

// ─────────────────────────────────────────────
// 16. RENDER DASHBOARD
// ─────────────────────────────────────────────

function renderDashboard() {
  const grid = document.getElementById("schedule-grid");
  grid.querySelectorAll(".room-column").forEach(el => el.remove());
  ROOMS.forEach(room => {
    const bookings = scheduleData.filter(b => b.room === room);
    grid.appendChild(buildRoomColumn(room, bookings));
  });
}

// ─────────────────────────────────────────────
// 17. LOAD & AUTO-REFRESH
// ─────────────────────────────────────────────

async function loadAndRender() {
  showLoading();
  try {
    scheduleData = await fetchSchedule();
    renderDashboard();
  } catch (err) {
    console.error("[Dashboard] loadAndRender error:", err);
    scheduleData = FALLBACK_DATA;
    renderDashboard();
  } finally {
    hideLoading(); // SELALU hide loading, apapun yang terjadi
  }
}

function startAutoRefresh() {
  setInterval(loadAndRender,       REFRESH_INTERVAL_MS);
  setInterval(updateNowIndicators, 60 * 1000);
}

// ─────────────────────────────────────────────
// 18. HELPER
// ─────────────────────────────────────────────

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ─────────────────────────────────────────────
// 19. INIT
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  startClock();
  buildTimeSidebar();
  loadAndRender();
  startAutoRefresh();
});
