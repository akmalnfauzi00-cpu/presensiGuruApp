import { api } from "./http";

export const apiRewardSpMe = (periode) =>
  api.get(`/rewardsp/me?periode=${encodeURIComponent(periode)}`);

export const apiRewardSpDownloadUrl = (idDokumen, token = "") =>
  `/rewardsp/download?id=${encodeURIComponent(idDokumen)}${
    token ? `&token_preview=${encodeURIComponent(token)}` : ""
  }`;