import * as SecureStore from "expo-secure-store";
import { getNowWIB } from "./time";

const KEY_STATUS = "PRESENSI_HARIAN_V1";
const KEY_RIWAYAT = "RIWAYAT_PRESENSI_V1";

function todayKeyWIB() {
  const d = getNowWIB();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ===================== HELPERS RIWAYAT ===================== */

function monthLabelID(dateObj) {
  const bulan = ["JAN","FEB","MAR","APR","MEI","JUN","JUL","AGU","SEP","OKT","NOV","DES"];
  return bulan[dateObj.getMonth()];
}

function dayNameID(dateObj) {
  const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  return hari[dateObj.getDay()];
}

function toRiwayatTitle(dateObj) {
  return `${dayNameID(dateObj)}, ${dateObj.getDate()} ${monthLabelID(dateObj)}`;
}

async function saveRiwayatLocal(arr) {
  await SecureStore.setItemAsync(KEY_RIWAYAT, JSON.stringify(arr));
}

/* ===================== STATUS PRESENSI HARI INI ===================== */

export async function getPresensiHariIni() {
  const raw = await SecureStore.getItemAsync(KEY_STATUS);
  const all = raw ? JSON.parse(raw) : {};
  const key = todayKeyWIB();
  return all[key] || { masuk: null, pulang: null };
}

async function setPresensiKey(partial) {
  const raw = await SecureStore.getItemAsync(KEY_STATUS);
  const all = raw ? JSON.parse(raw) : {};
  const key = todayKeyWIB();
  const cur = all[key] || { masuk: null, pulang: null };
  all[key] = { ...cur, ...partial };
  await SecureStore.setItemAsync(KEY_STATUS, JSON.stringify(all));
}

export async function setPresensiMasuk(timeHHMMSS) {
  await setPresensiKey({ masuk: timeHHMMSS });
  await upsertRiwayatHariIni({ masuk: timeHHMMSS });
}

export async function setPresensiPulang(timeHHMMSS) {
  await setPresensiKey({ pulang: timeHHMMSS });
  await upsertRiwayatHariIni({ pulang: timeHHMMSS });
}

/* ===================== RIWAYAT ===================== */

export async function getRiwayatLocal() {
  const raw = await SecureStore.getItemAsync(KEY_RIWAYAT);
  const arr = raw ? JSON.parse(raw) : [];
  return arr.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
}

function isLateMasuk(masukHHMMSS, batasHHMM = "08:00") {
  if (!masukHHMMSS || masukHHMMSS === "-") return false;

  const [hh, mm] = masukHHMMSS.split(":").map(Number);
  const [bh, bm] = batasHHMM.split(":").map(Number);

  const menitMasuk = hh * 60 + mm;
  const menitBatas = bh * 60 + bm;

  return menitMasuk > menitBatas;
}

export async function upsertRiwayatHariIni({ masuk, pulang }) {
  const d = getNowWIB();
  const tanggal = todayKeyWIB();

  const raw = await SecureStore.getItemAsync(KEY_RIWAYAT);
  const list = raw ? JSON.parse(raw) : [];

  const idx = list.findIndex((x) => x.tanggal === tanggal);

  const base =
    idx >= 0
      ? list[idx]
      : {
          id: tanggal,
          tanggal,
          bulan: monthLabelID(d),
          hari: String(d.getDate()).padStart(2, "0"),
          title: toRiwayatTitle(d),
          status: "Hadir",
          badgeColor: "#16A34A",
          masuk: "-",
          pulang: "-",
          type: "Semua",
        };

  const updated = {
    ...base,
    masuk: masuk ?? base.masuk,
    pulang: pulang ?? base.pulang,
  };

  // jangan override status yang dikunci
  const statusYangDikunci = ["Izin", "Sakit", "Alpa"];
  if (!statusYangDikunci.includes(updated.status)) {
    const terlambat = isLateMasuk(updated.masuk, "08:00");
    updated.status = terlambat ? "Terlambat" : "Hadir";
    updated.badgeColor = terlambat ? "#DC2626" : "#16A34A";
  }

  if (idx >= 0) list[idx] = updated;
  else list.push(updated);

  await saveRiwayatLocal(list);
}

/* ===================== IZIN / SAKIT ===================== */

export async function setIzinHariIni(jenis = "Izin") {
  const d = getNowWIB();
  const tanggal = todayKeyWIB();

  const raw = await SecureStore.getItemAsync(KEY_RIWAYAT);
  const list = raw ? JSON.parse(raw) : [];

  const idx = list.findIndex((x) => x.tanggal === tanggal);

  const status = jenis === "Sakit" ? "Sakit" : "Izin";
  const data = {
    id: tanggal,
    tanggal,
    bulan: monthLabelID(d),
    hari: String(d.getDate()).padStart(2, "0"),
    title: toRiwayatTitle(d),
    status,
    badgeColor: "#F59E0B",
    masuk: "-",
    pulang: "-",
    type: "Semua",
  };

  if (idx >= 0) list[idx] = data;
  else list.push(data);

  await saveRiwayatLocal(list);

  // reset status harian
  const rawStatus = await SecureStore.getItemAsync(KEY_STATUS);
  const all = rawStatus ? JSON.parse(rawStatus) : {};
  all[tanggal] = { masuk: null, pulang: null };
  await SecureStore.setItemAsync(KEY_STATUS, JSON.stringify(all));
}

/* ===================== AUTO ALPA ===================== */

export async function autoAlpaIfNeeded(batasHHMM = "08:15") {
  const now = getNowWIB();
  const tanggal = todayKeyWIB();

  const [bh, bm] = batasHHMM.split(":").map(Number);
  const menitNow = now.getHours() * 60 + now.getMinutes();
  const menitBatas = bh * 60 + bm;

  if (menitNow < menitBatas) return { changed: false, reason: "Belum melewati batas" };

  const st = await getPresensiHariIni();
  if (st?.masuk) return { changed: false, reason: "Sudah presensi masuk" };

  const raw = await SecureStore.getItemAsync(KEY_RIWAYAT);
  const list = raw ? JSON.parse(raw) : [];

  const idx = list.findIndex((x) => x.tanggal === tanggal);
  if (idx >= 0) {
    const status = list[idx]?.status;
    if (["Izin", "Sakit", "Hadir", "Terlambat"].includes(status)) {
      return { changed: false, reason: `Sudah ada status ${status}` };
    }
  }

  const data = {
    id: tanggal,
    tanggal,
    bulan: monthLabelID(now),
    hari: String(now.getDate()).padStart(2, "0"),
    title: toRiwayatTitle(now),
    status: "Alpa",
    badgeColor: "#DC2626",
    masuk: "-",
    pulang: "-",
    type: "Semua",
  };

  if (idx >= 0) list[idx] = data;
  else list.push(data);

  await saveRiwayatLocal(list);

  const rawStatus = await SecureStore.getItemAsync(KEY_STATUS);
  const all = rawStatus ? JSON.parse(rawStatus) : {};
  all[tanggal] = { masuk: null, pulang: null };
  await SecureStore.setItemAsync(KEY_STATUS, JSON.stringify(all));

  return { changed: true, reason: "Alpa ditetapkan" };
}

/* ===================== SP OTOMATIS ===================== */

export async function ensureSanctionSP(ambang = 3) {
  const now = getNowWIB();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const raw = await SecureStore.getItemAsync(KEY_RIWAYAT);
  const list = raw ? JSON.parse(raw) : [];

  const terlambatCount = list.filter(
    (x) =>
      (x.tanggal || "").startsWith(ym) &&
      x.type !== "Sanction" &&
      x.status === "Terlambat"
  ).length;

  const sanctionId = `SP-${ym}`;
  const idxSanction = list.findIndex((x) => x.id === sanctionId);

  if (terlambatCount < ambang) {
    if (idxSanction >= 0) {
      list.splice(idxSanction, 1);
      await saveRiwayatLocal(list);
    }
    return { active: false, terlambatCount };
  }

  const item = {
    id: sanctionId,
    tanggal: `${ym}-01`,
    bulan: monthLabelID(now),
    hari: "SP",
    title: `Surat Peringatan (SP) - ${ym}`,
    status: "Terlambat",
    badgeColor: "#DC2626",
    subtitle: `Akumulasi keterlambatan ≥ ${ambang}x (Total: ${terlambatCount}x)`,
    buttonText: "Unduh Surat Peringatan (SP)",
    type: "Sanction",
    masuk: "-",
    pulang: "-",
  };

  if (idxSanction >= 0) list[idxSanction] = item;
  else list.push(item);

  await saveRiwayatLocal(list);
  return { active: true, terlambatCount };
}

/* ===================== REWARD BULAN LALU (AWAL BULAN BERIKUTNYA) ===================== */

function isWeekday(yyyyMMdd) {
  const [y, m, d] = yyyyMMdd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0 Minggu, 6 Sabtu
  return day >= 1 && day <= 5;
}

function daysInMonth(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

function prevYearMonth(nowDate) {
  let y = nowDate.getFullYear();
  let m = nowDate.getMonth() + 1; // 1-12
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return { y, m };
}

/**
 * Reward dibuat untuk BULAN LALU ketika user sudah masuk bulan berikutnya.
 * Syarat: semua hari kerja (Senin–Jumat) bulan lalu harus berstatus "Hadir".
 */
export async function ensureRewardBulanLalu() {
  const now = getNowWIB();
  const { y, m } = prevYearMonth(now);
  const ymPrev = `${y}-${String(m).padStart(2, "0")}`;

  const rewardId = `REWARD-${ymPrev}`;

  const raw = await SecureStore.getItemAsync(KEY_RIWAYAT);
  const list = raw ? JSON.parse(raw) : [];

  // kalau reward bulan lalu sudah ada, skip
  if (list.some((x) => x.id === rewardId)) {
    return { active: true, reason: "Reward sudah ada" };
  }

  // ambil data bulan lalu (bukan reward/sanction)
  const bulanLalu = list.filter(
    (x) =>
      (x.tanggal || "").startsWith(ymPrev) &&
      x.type !== "Reward" &&
      x.type !== "Sanction"
  );

  // daftar hari kerja bulan lalu
  const totalHari = daysInMonth(y, m);
  const hariKerja = [];
  for (let d = 1; d <= totalHari; d++) {
    const tgl = `${ymPrev}-${String(d).padStart(2, "0")}`;
    if (isWeekday(tgl)) hariKerja.push(tgl);
  }

  const mapByDate = new Map(bulanLalu.map((x) => [x.tanggal, x]));

  // harus ada record untuk semua hari kerja
  const semuaAda = hariKerja.every((tgl) => mapByDate.has(tgl));
  if (!semuaAda) return { active: false, reason: "Belum lengkap semua hari kerja" };

  // harus semuanya Hadir
  const semuaHadir = hariKerja.every((tgl) => mapByDate.get(tgl)?.status === "Hadir");
  if (!semuaHadir) return { active: false, reason: "Ada telat/alpa/izin/sakit" };

  // buat reward bulan lalu
  const item = {
    id: rewardId,
    tanggal: `${ymPrev}-01`,
    bulan: monthLabelID(new Date(Date.UTC(y, m - 1, 1))),
    hari: "★",
    title: `Reward Kehadiran Sempurna - ${ymPrev}`,
    status: "Incentive",
    badgeColor: "#2563EB",
    subtitle: "Hadir 1 bulan penuh tanpa terlambat",
    buttonText: "Unduh Sertifikat Reward",
    type: "Reward",
    masuk: "-",
    pulang: "-",
  };

  list.push(item);
  await saveRiwayatLocal(list);
  return { active: true, reason: "Reward bulan lalu dibuat" };
}

/* ===================== RINGKASAN ===================== */

export async function getRingkasanBulanIni() {
  const now = getNowWIB();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const list = await getRiwayatLocal();

  const bulanIni = list.filter(
    (x) =>
      (x.tanggal || "").startsWith(ym) &&
      x.type !== "Sanction" &&
      x.type !== "Reward"
  );

  const hadir = bulanIni.filter((x) => x.status === "Hadir").length;
  const terlambat = bulanIni.filter((x) => x.status === "Terlambat").length;
  const alpaIzin = bulanIni.filter(
    (x) => x.status === "Alpa" || x.status === "Izin" || x.status === "Sakit"
  ).length;

  const total = bulanIni.length;
  const persen = total === 0 ? 0 : Math.round((hadir / total) * 100);

  return { total, hadir, terlambat, alpaIzin, persen };
}

/* ===================== RESET ===================== */

export async function clearAllPresensiLocal() {
  await SecureStore.deleteItemAsync(KEY_STATUS);
  await SecureStore.deleteItemAsync(KEY_RIWAYAT);
}