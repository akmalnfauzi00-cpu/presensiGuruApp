import { CONFIG } from "../constants/config";
import { getToken } from "../utils/storage";

export function getApiBaseUrl() {
  return `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}`.replace(/\/$/, "");
}

export function getWebBaseUrl() {
  return `${CONFIG.BASE_URL}${CONFIG.WEB_PREFIX}`.replace(/\/$/, "");
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const token = await getToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

  try {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${cleanPath}`;

    console.log("API REQUEST:", method, url);

    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();

    console.log("API RESPONSE STATUS:", res.status);
    console.log("API RESPONSE TEXT:", text);

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data;
  } catch (err) {
    console.log("API ERROR:", err);

    if (err?.name === "AbortError") {
      throw new Error("Request timeout. Cek koneksi atau server backend.");
    }

    if (err?.message === "Network request failed") {
      throw new Error("Tidak bisa terhubung ke server backend.");
    }

    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: (path, options = {}) => request(path, { method: "GET", ...options }),
  post: (path, body, options = {}) =>
    request(path, { method: "POST", body, ...options }),
  put: (path, body, options = {}) =>
    request(path, { method: "PUT", body, ...options }),
  delete: (path, options = {}) =>
    request(path, { method: "DELETE", ...options }),
};