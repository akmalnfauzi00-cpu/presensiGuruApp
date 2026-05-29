import { api } from "./http";

export const apiPresensiToday = () => api.get("/presensi/today");

export const apiPresensiMasuk = (payload) => {
  const formData = new FormData();
  formData.append('lat', payload.lat);
  formData.append('lng', payload.lng);
  formData.append('foto_path', payload.foto_path);
  return api.post("/presensi/masuk", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const apiPresensiPulang = (payload) => {
  const formData = new FormData();
  formData.append('lat', payload.lat);
  formData.append('lng', payload.lng);
  formData.append('foto_path', payload.foto_path);
  return api.post("/presensi/pulang", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const apiPresensiRiwayat = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.append(key, String(value));
  });
  return api.get(`/presensi/riwayat?${search.toString()}`);
};

export const apiResetRiwayat = () => api.post("/presensi/reset-riwayat", {});