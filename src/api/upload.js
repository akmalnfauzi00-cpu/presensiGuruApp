import { CONFIG } from "../constants/config";
import { getToken } from "../utils/storage";

const base = `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}`;

async function uploadImage(uri, endpoint) {
  const token = await getToken();

  const fileName = uri.split("/").pop() || `upload_${Date.now()}.jpg`;
  const ext = fileName.split(".").pop()?.toLowerCase();

  let mimeType = "image/jpeg";
  if (ext === "png") mimeType = "image/png";
  if (ext === "webp") mimeType = "image/webp";

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: fileName,
    type: mimeType,
  });

  const res = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    throw new Error(data?.message || `Upload gagal (${res.status})`);
  }

  return data;
}

export async function apiUploadPengajuan(uri) {
  return uploadImage(uri, "/upload/pengajuan");
}

export async function apiUploadPresensi(uri) {
  return uploadImage(uri, "/upload/presensi");
}