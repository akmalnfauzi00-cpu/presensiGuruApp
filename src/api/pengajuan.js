import { api } from "./http";

export const apiPengajuanList = () => api.get("/pengajuan");

export const apiPengajuanCreate = (data) => api.post("/pengajuan/store", data);