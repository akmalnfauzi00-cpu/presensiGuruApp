export function getNowWIB() {
  const now = new Date();

  // WIB = UTC+7
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 60 * 60000);

  return wib;
}

export function formatHHMMSS(dateObj) {
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const mm = String(dateObj.getMinutes()).padStart(2, "0");
  const ss = String(dateObj.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatDateID(dateObj, mode = "full") {
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  if (mode === "monthYear") {
    return `${bulan[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  }

  return `${hari[dateObj.getDay()]}, ${dateObj.getDate()} ${
    bulan[dateObj.getMonth()]
  } ${dateObj.getFullYear()}`;
}

export function isAfterTimeWIB(dateObj, hhmm = "15:30") {
  const [h, m] = hhmm.split(":").map(Number);

  const minutesNow = dateObj.getHours() * 60 + dateObj.getMinutes();
  const minutesTarget = h * 60 + m;

  return minutesNow >= minutesTarget;
}
