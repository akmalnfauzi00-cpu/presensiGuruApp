import { API_CONFIG } from '../config/api.config'; // ← IMPORT TERPUSAT

export async function apiSettings() {
  try {
    const response = await fetch(`${API_CONFIG.API_URL}/settings`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    const text = await response.text();

    if (response.status === 404) {
      console.error("Error 404: API tidak ditemukan. Pastikan routes.php sudah benar.");
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (_e) {
      console.error("Respon bukan JSON bersih. Isi respon:", text);
      return null;
    }
  } catch (e) {
    console.error("Koneksi ke server gagal:", e);
    return null;
  }
}