import { api } from "./http";

export const apiPresensiToday = () => api.get("/presensi/today");

export const apiPresensiMasuk = ({ lat, lng, foto_path }) =>
  api.post("/presensi/masuk", { lat, lng, foto_path });

export const apiPresensiPulang = ({ lat, lng, foto_path }) =>
  api.post("/presensi/pulang", { lat, lng, foto_path });

export const apiPresensiRiwayat = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });

  const qs = search.toString();
  return api.get(`/presensi/riwayat${qs ? `?${qs}` : ""}`);
};

export const apiResetRiwayat = () =>
  api.post("/presensi/reset-riwayat", {});