export const SCHOOL_DEFAULT = {
  name: "SMP Muhammadiyah 2 Karanglewas",
  address: "",
  lat: null,
  lng: null,
  radiusMeters: 150,
};

export let SCHOOL = { ...SCHOOL_DEFAULT };

export function applySchoolFromSettings(data) {
  const s = data?.sekolah;

  if (!s) {
    SCHOOL = { ...SCHOOL_DEFAULT };
    return;
  }

  SCHOOL = {
    name: s.nama || SCHOOL_DEFAULT.name,
    address: s.alamat || "",
    lat: s.lat != null ? Number(s.lat) : null,
    lng: s.lng != null ? Number(s.lng) : null,
    radiusMeters: s.radius_m != null ? Number(s.radius_m) : 150,
  };
}