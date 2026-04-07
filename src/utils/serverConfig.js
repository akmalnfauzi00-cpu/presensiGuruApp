import { CONFIG } from "../constants/config";

function stripTrailingSlash(value = "") {
  return String(value).replace(/\/+$/, "");
}

export async function getStoredServerBaseUrl() {
  return stripTrailingSlash(`${CONFIG.BASE_URL}${CONFIG.WEB_PREFIX}`);
}

export async function setStoredServerBaseUrl() {
  return stripTrailingSlash(`${CONFIG.BASE_URL}${CONFIG.WEB_PREFIX}`);
}

export async function clearStoredServerBaseUrl() {
  return;
}

export async function getResolvedServerBaseUrl() {
  return stripTrailingSlash(`${CONFIG.BASE_URL}${CONFIG.WEB_PREFIX}`);
}

export function previewNormalizedServerBaseUrl() {
  return stripTrailingSlash(`${CONFIG.BASE_URL}${CONFIG.WEB_PREFIX}`);
}