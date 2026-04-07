import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";
const GURU_KEY = "guru";

export async function setToken(token) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken() {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function setGuru(guru) {
  await AsyncStorage.setItem(GURU_KEY, JSON.stringify(guru));
}

export async function getGuru() {
  const raw = await AsyncStorage.getItem(GURU_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function removeGuru() {
  await AsyncStorage.removeItem(GURU_KEY);
}

export async function clearAuthStorage() {
  await AsyncStorage.multiRemove([TOKEN_KEY, GURU_KEY]);
}