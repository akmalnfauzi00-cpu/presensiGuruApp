import axios from 'axios';
import { getToken } from '../utils/storage';
import { API_CONFIG } from '../config/api.config'; // ← IMPORT TERPUSAT

export const apiGetPengumuman = async () => {
  try {
    const token = await getToken();
    const response = await axios.get(`${API_CONFIG.API_URL}/pengumuman`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Gagal memuat pengumuman" };
  }
};