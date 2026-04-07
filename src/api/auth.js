import { api } from "./http";

export const apiLogin = (nip, password) =>
  api.post("/login", { nip, password });

export const apiMe = () => api.get("/me");

export const apiLogout = () => api.post("/logout", {});