import { api } from "./http";

export const apiUploadPresensi = async (uri) => {
  const formData = new FormData();
  
  // Ambil nama file dari URI
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  formData.append('image', {
    uri: uri,
    name: filename,
    type: type,
  });

  // Gunakan endpoint upload yang benar
  const res = await api.post("/upload/image", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res;
};