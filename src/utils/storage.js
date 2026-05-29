import AsyncStorage from "@react-native-async-storage/async-storage";

// KUNCI DISAMAKAN DENGAN YANG DIPANGGIL DI AMBIL.JS
const TOKEN_KEY = "userToken"; 
const GURU_KEY = "guru";

/**
 * Menyimpan Token ke Storage
 */
export async function setToken(token) {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  } catch (e) {
    console.error("Gagal simpan token:", e);
  }
}

/**
 * Mengambil Token dari Storage
 */
export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Menghapus Token saja
 */
export async function removeToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error("Gagal hapus token:", e);
  }
}

/**
 * Menyimpan Data Guru (JSON)
 */
export async function setGuru(guru) {
  try {
    if (guru) {
      await AsyncStorage.setItem(GURU_KEY, JSON.stringify(guru));
    }
  } catch (e) {
    console.error("Gagal simpan data guru:", e);
  }
}

/**
 * Mengambil Data Guru
 */
export async function getGuru() {
  try {
    const raw = await AsyncStorage.getItem(GURU_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Menghapus Data Guru saja
 */
export async function removeGuru() {
  try {
    await AsyncStorage.removeItem(GURU_KEY);
  } catch (e) {
    console.error("Gagal hapus data guru:", e);
  }
}

/**
 * Membersihkan Semua Data Auth (Token & Guru)
 */
export async function clearAuthStorage() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, GURU_KEY]);
  } catch (e) {
    console.error("Gagal clear auth storage:", e);
  }
}