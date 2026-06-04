// ============================================================
// apps-script.gs
// Google Apps Script – Meeting Room Reservation JSON API
//
// CARA DEPLOY:
// 1. Buka Google Sheets yang berisi data reservasi.
// 2. Klik menu Extensions → Apps Script.
// 3. Tempel seluruh kode ini, hapus kode default (function myFunction).
// 4. Klik "Deploy" → "New deployment".
// 5. Pilih type: "Web app".
// 6. Execute as: "Me" | Who has access: "Anyone" (atau "Anyone with Google Account").
// 7. Klik Deploy → salin URL web app → tempel di SHEET_API_URL pada script.js.
//
// STRUKTUR GOOGLE SHEET (Sheet1):
// Baris 1 = Header:
//   room | title | start | end | participants
//
// Contoh data baris 2:
//   GEBANG | IT Discussion | 14:00 | 15:00 | 4
// ============================================================

/**
 * doGet: dipanggil ketika URL web app di-hit dengan method GET.
 * Mengembalikan seluruh data sheet sebagai JSON array.
 */
function doGet(e) {
  try {
    const data = getSheetData();

    // Buat response JSON dengan CORS header agar bisa di-fetch dari browser
    const output = ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);

    return output;

  } catch (err) {
    // Jika error, kembalikan pesan error dalam format JSON
    const errorPayload = JSON.stringify({ error: true, message: err.message });
    return ContentService
      .createTextOutput(errorPayload)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Ambil dan parse data dari Google Sheet aktif.
 * Mengasumsikan:
 *   - Sheet bernama "Sheet1" (bisa diubah di konstanta SHEET_NAME)
 *   - Baris pertama adalah header: room, title, start, end, participants
 *   - Data mulai baris kedua
 *
 * @returns {Array<Object>} Array objek booking
 */
function getSheetData() {
  const SHEET_NAME = "Sheet1"; // Ganti jika nama sheet Anda berbeda

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" tidak ditemukan.`);
  }

  // Ambil semua baris yang memiliki data
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // Jika hanya ada header atau sheet kosong
  if (lastRow <= 1) return [];

  // Ambil semua nilai: baris 1 (header) sampai lastRow
  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  // Baris pertama = header
  const headers = allValues[0].map(h => String(h).trim().toLowerCase());

  // Mapping kolom dari nama header
  const COL = {
    room:         headers.indexOf("room"),
    title:        headers.indexOf("title"),
    start:        headers.indexOf("start"),
    end:          headers.indexOf("end"),
    participants: headers.indexOf("participants"),
  };

  // Validasi kolom wajib ada
  const required = ["room", "title", "start", "end"];
  required.forEach(key => {
    if (COL[key] === -1) {
      throw new Error(`Kolom wajib "${key}" tidak ditemukan di header sheet.`);
    }
  });

  const results = [];

  // Iterasi baris data (skip baris 0 = header)
  for (let i = 1; i < allValues.length; i++) {
    const row = allValues[i];

    // Skip baris kosong (room kosong dianggap baris kosong)
    const room = String(row[COL.room] ?? "").trim().toUpperCase();
    if (!room) continue;

    const title        = String(row[COL.title] ?? "").trim();
    const start        = formatTime(row[COL.start]);
    const end          = formatTime(row[COL.end]);
    const participants = COL.participants !== -1
      ? (parseInt(row[COL.participants], 10) || 0)
      : 0;

    // Validasi: butuh title, start, end
    if (!title || !start || !end) continue;

    results.push({ room, title, start, end, participants });
  }

  return results;
}

/**
 * Format nilai sel menjadi string "HH:MM".
 * Google Sheets menyimpan waktu sebagai angka desimal (0–1),
 * teks "14:00", atau objek Date.
 *
 * @param {*} val - Nilai dari sel Google Sheet
 * @returns {string} Format "HH:MM" atau "" jika tidak valid
 */
function formatTime(val) {
  if (!val && val !== 0) return "";

  // Jika sudah string berbentuk "HH:MM"
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed;
    return "";
  }

  // Jika number (Google Sheet menyimpan waktu sebagai fraksi hari: 0.0–1.0)
  if (typeof val === "number") {
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${pad(h)}:${pad(m)}`;
  }

  // Jika Date object
  if (val instanceof Date) {
    const h = val.getHours();
    const m = val.getMinutes();
    return `${pad(h)}:${pad(m)}`;
  }

  return "";
}

/** Pad angka menjadi 2 digit */
function pad(n) {
  return String(n).padStart(2, "0");
}


// ============================================================
// FUNGSI TEST (opsional, bisa dijalankan manual dari editor)
// Klik Run → pilih fungsi testGetSheetData untuk melihat output di log
// ============================================================

function testGetSheetData() {
  const data = getSheetData();
  Logger.log(JSON.stringify(data, null, 2));
}