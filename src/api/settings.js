import { api } from "./http";

export const apiSettings = () => api.get("/settings");