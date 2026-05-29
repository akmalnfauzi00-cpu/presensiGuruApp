import { API_CONFIG } from '../config/api.config';
import { getToken } from "../utils/storage";

/**
 * Menghasilkan URL Dasar API
 * Menggunakan API_CONFIG yang diimport dari api.config.js
 */
export function getApiBaseUrl() {
  // Kita ambil API_URL langsung dari config
  return API_CONFIG.API_URL || "";
}

export function getWebBaseUrl() {
  // Kita ambil WEB_URL langsung dari config
  return API_CONFIG.WEB_URL || "";
}

/**
 * Fungsi Utama Request ke Backend
 */
async function request(path, { method = "GET", body, headers = {} } = {}) {
  const token = await getToken();
  const controller = new AbortController();
  
  // Gunakan API_CONFIG, bukan CONFIG
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    // Pastikan path diawali dengan satu slash saja
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${getApiBaseUrl()}${cleanPath}`;

    console.log("\n>>> API REQUEST:", method, url);

    const isFormData = body instanceof FormData;
    
    // Konfigurasi Headers
    const reqHeaders = {
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...headers,
    };

    // JANGAN tambahkan Content-Type jika body adalah FormData
    if (!isFormData && body) {
      reqHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: reqHeaders,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });

    const text = await res.text();
    console.log("<<< API RESPONSE STATUS:", res.status);

    // Deteksi jika server membalas dengan HTML (Error dari PHP/XAMPP)
    if (text && text.trim().startsWith("<")) {
      console.log("============= ERROR DARI SERVER BACKEND =============");
      console.log(text); 
      console.log("=====================================================");
      throw new Error(`Server Error (${res.status}). Cek terminal server.`);
    }

    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (_e) {
        throw new Error("Gagal membaca respon dari server (Bukan JSON).");
      }
    }

    if (res.status === 401) {
      throw new Error("Sesi login berakhir. Silakan login kembali.");
    }

    if (!res.ok) {
      throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Waktu permintaan habis (Timeout).");
    }
    if (err?.message === "Network request failed") {
      throw new Error("Koneksi gagal. Pastikan HP & Laptop di WiFi yang sama.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: (path, options = {}) => request(path, { method: "GET", ...options }),
  post: (path, body, options = {}) => request(path, { method: "POST", body, ...options }),
  put: (path, body, options = {}) => request(path, { method: "PUT", body, ...options }),
  delete: (path, options = {}) => request(path, { method: "DELETE", ...options }),
};