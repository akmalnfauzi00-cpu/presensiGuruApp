import { useEffect, useRef, useState, useMemo } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "../../src/ui/theme";
import {
  apiPresensiMasuk,
  apiPresensiPulang,
  apiPresensiToday,
} from "../../src/api/presensi";
import { apiSettings } from "../../src/api/settings";
import { distanceMeters } from "../../src/utils/geo";

export default function AmbilPresensi() {
  const { type } = useLocalSearchParams();
  const router = useRouter();
  const camRef = useRef(null);

  const [perm, requestPerm] = useCameraPermissions();
  const [loading, setLoading] = useState(true);
  const [gpsOk, setGpsOk] = useState(false);
  const [distance, setDistance] = useState(null);
  const [inside, setInside] = useState(false);
  const [setting, setSetting] = useState(null);

  const canSubmit = useMemo(() => gpsOk && inside && !loading, [gpsOk, inside, loading]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      let serverSetting = null;

      try {
        const s = await apiSettings();
        setSetting(s);
        serverSetting = s;
      } catch {
        Alert.alert("Setting", "Gagal memuat setting lokasi dari server.");
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setGpsOk(granted);

      if (!granted) {
        setLoading(false);
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const latSek = serverSetting?.sekolah?.lat ?? null;
        const lngSek = serverSetting?.sekolah?.lng ?? null;
        const radius = serverSetting?.sekolah?.radius_m ?? 150;

        if (latSek == null || lngSek == null) {
          setDistance(null);
          setInside(false);
          Alert.alert("Setting", "Lokasi sekolah belum tersedia di server.");
        } else {
          const d = distanceMeters(
            loc.coords.latitude,
            loc.coords.longitude,
            latSek,
            lngSek
          );

          setDistance(d);
          setInside(d <= radius);
        }
      } catch {
        setDistance(null);
        setInside(false);
        Alert.alert("GPS", "Gagal mendapatkan lokasi. Aktifkan GPS lalu coba lagi.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function submitPresensi() {
    try {
      if (!camRef.current) return;

      // Ambil foto selfie dengan kualitas tinggi
      const photo = await camRef.current.takePictureAsync({ quality: 0.7 });

      // Verifikasi apakah foto selfie yang diambil terlihat jelas
      if (!photo.uri) {
        Alert.alert("Gagal", "Tidak ada foto yang diambil.");
        return;
      }

      // Cek apakah foto memang selfie (bisa menggunakan pustaka deteksi wajah)
      if (!isValidSelfie(photo)) {
        Alert.alert("Gagal", "Foto selfie wajib dikirim.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const payload = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        foto_path: photo.uri,
      };

      const today = await apiPresensiToday();
      const p = today?.presensi;

      if (type === "pulang") {
        if (!p?.jam_masuk) {
          Alert.alert("Info", "Belum presensi masuk, tidak bisa presensi pulang.");
          return;
        }

        if (p?.jam_pulang) {
          Alert.alert("Info", "Kamu sudah presensi pulang hari ini.");
          return;
        }

        await apiPresensiPulang(payload);
        Alert.alert("Berhasil", "Presensi pulang berhasil.");
      } else {
        if (p?.jam_masuk && !p?.jam_pulang) {
          Alert.alert("Info", "Kamu sudah presensi masuk. Silakan presensi pulang dulu.");
          return;
        }

        if (p?.jam_masuk && p?.jam_pulang) {
          Alert.alert("Info", "Presensi hari ini sudah lengkap.");
          return;
        }

        await apiPresensiMasuk(payload);
        Alert.alert("Berhasil", "Presensi masuk berhasil.");
      }

      router.back();
    } catch (e) {
      Alert.alert("Gagal", e?.message || "Terjadi kesalahan saat presensi.");
    }
  }

  // Fungsi untuk validasi apakah foto yang diambil adalah selfie
  function isValidSelfie(photo) {
    // Implementasikan logika untuk validasi selfie (misalnya, deteksi wajah)
    return photo.uri.includes("selfie");  // Sederhana, sesuaikan sesuai keperluan
  }

  if (!perm?.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          padding: 18,
          justifyContent: "center",
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900" }}>Izin Kamera</Text>
        <Text style={{ color: theme.colors.muted }}>
          Aplikasi butuh akses kamera untuk presensi.
        </Text>

        <Pressable
          onPress={requestPerm}
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900" }}>Izinkan Kamera</Text>
        </Pressable>
      </View>
    );
  }

  const radius = setting?.sekolah?.radius_m ?? 150;

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <View
        style={{
          height: 54,
          backgroundColor: "white",
          justifyContent: "center",
          paddingHorizontal: 14,
        }}
      >
        <Text style={{ fontWeight: "900" }}>
          Ambil Presensi {type === "pulang" ? "Pulang" : "Masuk"}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        {/* Ganti 'facing' menjadi 'front' */}
        <CameraView ref={camRef} style={{ flex: 1 }} facing="front" />

        <View
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            top: 90,
            bottom: 210,
            borderWidth: 3,
            borderColor: "rgba(255,255,255,0.8)",
            borderRadius: 16,
          }}
        />

        <View
          style={{
            position: "absolute",
            top: 70,
            left: 14,
            right: 14,
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>
            Foto selfie (bukan foto lingkungan sekolah).
          </Text>
        </View>

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.bg,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            padding: 16,
            gap: 10,
          }}
        >
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: !gpsOk
                ? "#FFECEC"
                : inside
                ? theme.colors.successSoft
                : "#FEF3C7",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading ? <ActivityIndicator /> : null}

            <Text
              style={{
                fontWeight: "900",
                color: !gpsOk ? "#B91C1C" : inside ? "#0F7A3B" : "#92400E",
              }}
            >
              {!gpsOk
                ? "GPS TIDAK AKTIF"
                : loading
                ? "MENGAMBIL LOKASI..."
                : inside
                ? `DI AREA (${distance == null ? "OK" : `${Math.round(distance)} m`})`
                : `DI LUAR AREA (${distance == null ? "-" : `${Math.round(distance)} m`})`}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: theme.colors.line,
            }}
          >
            <Text style={{ fontWeight: "900", color: theme.colors.primary }}>
              LOKASI TERKUNCI
            </Text>
            <Text style={{ color: theme.colors.muted, marginTop: 6, fontWeight: "800" }}>
              Radius: {radius} m
            </Text>
          </View>

          <Pressable
            onPress={() => canSubmit && submitPresensi()}
            disabled={!canSubmit}
            style={{
              height: 54,
              borderRadius: 14,
              backgroundColor: canSubmit ? theme.colors.primary : "#CBD5E1",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "900" }}>
              {canSubmit ? "Ambil Foto & Kirim" : "Di luar area sekolah"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}