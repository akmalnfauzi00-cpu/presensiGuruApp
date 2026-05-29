import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "../../src/ui/theme";
import { apiSettings } from "../../src/api/settings";
import { distanceMeters } from "../../src/utils/geo";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Jika kamu punya api.config, pastikan diimport, jika tidak pakai domain langsung di bawah
import { API_CONFIG } from "../../src/config/api.config"; 

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

  const [isLibur, setIsLibur] = useState(false);
  const [keteranganLibur, setKeteranganLibur] = useState("");
  const [timeValid, setTimeValid] = useState(true);

  // LOGIKA CEK WAKTU
  const checkTimeValidity = useCallback((serverSetting) => {
    const jadwal = serverSetting?.data?.jam || {};
    const jamMasukStr = jadwal?.jam_masuk || "07:00:00";
    const jamPulangStr = jadwal?.jam_pulang || "15:30:00";
    const toleransi = parseInt(jadwal?.toleransi_terlambat || 30, 10);

    const now = new Date();
    
    if (type === 'masuk') {
      const [h, m] = jamMasukStr.split(':');
      const limitTime = new Date();
      limitTime.setHours(parseInt(h, 10));
      limitTime.setMinutes(parseInt(m, 10) + toleransi);
      limitTime.setSeconds(0);
      return now <= limitTime;
    } 
    
    if (type === 'pulang') {
      const [hPulang, mPulang] = jamPulangStr.split(':');
      const minTime = new Date();
      minTime.setHours(parseInt(hPulang, 10));
      minTime.setMinutes(parseInt(mPulang, 10));
      minTime.setSeconds(0);
      return now >= minTime; 
    }

    return true;
  }, [type]);

  const canSubmit = useMemo(() =>
    gpsOk && inside && !loading && !isLibur && timeValid,
    [gpsOk, inside, loading, isLibur, timeValid]
  );

  // LOAD DATA AWAL & LOKASI
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const s = await apiSettings();
        if (isMounted && s?.status === 'success') {
          setSetting(s);
          setIsLibur(s?.data?.is_libur || false);
          setKeteranganLibur(s?.data?.keterangan_libur || "Hari Libur");
          setTimeValid(checkTimeValidity(s));

          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setGpsOk(false);
            setLoading(false);
            return;
          }
          setGpsOk(true);

          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const latSek = s?.data?.sekolah?.lat;
          const lngSek = s?.data?.sekolah?.lng;
          const radius = s?.data?.sekolah?.radius_meter || 150;

          if (latSek && lngSek) {
            const d = distanceMeters(loc.coords.latitude, loc.coords.longitude, latSek, lngSek);
            setDistance(d);
            setInside(d <= radius);
          }
        }
      } catch (error) {
        console.log("DEBUG ERROR LOAD SETTING:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [checkTimeValidity]);

  // FUNGSI SUBMIT (HOSTING DOMAIN BARU)
  async function submitPresensi() {
    try {
      if (!camRef.current) {
        console.log("DEBUG: Kamera Belum Siap.");
        return;
      }
      setLoading(true);

      // 1. Ambil Foto
      const photo = await camRef.current.takePictureAsync({ quality: 0.1 });
      
      // 2. Ambil Lokasi
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      // 3. Ambil Token
      const token = await AsyncStorage.getItem("userToken");

      // 4. Siapkan Data
      const formData = new FormData();
      formData.append('lat', loc.coords.latitude.toString());
      formData.append('lng', loc.coords.longitude.toString());
      formData.append('api_token', token); 
      formData.append('foto', {
        uri: photo.uri,
        name: `selfie_${type}_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      // PERBAIKAN: Menggunakan domain esmudakarles.my.id
      const baseUrl = "https://esmudakarles.my.id/api"; 
      const url = type === "pulang" ? `${baseUrl}/presensi/pulang` : `${baseUrl}/presensi/masuk`;

      console.log("DEBUG: Mengirim data ke domain...", url);

      // 5. Kirim Request
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const rawResponse = await response.text();
      let result;
      try {
        result = JSON.parse(rawResponse);
      } catch (e) {
        Alert.alert("Error Server", "Hosting bermasalah atau response bukan JSON.");
        setLoading(false);
        return;
      }

      if (response.ok) {
        Alert.alert("Berhasil", "Presensi telah dicatat di server hosting.");
        router.replace("/(tabs)/beranda");
      } else {
        Alert.alert("Gagal", result.message || "Unauthorized / Invalid Token");
      }
    } catch (e) {
      console.log("DEBUG FATAL ERROR:", e);
      Alert.alert("Gagal", "Gagal menghubungi hosting esmudakarles.my.id");
    } finally {
      setLoading(false);
    }
  }

  // RENDER UI (Sama seperti sebelumnya)
  if (!perm?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 18, justifyContent: "center" }}>
        <Pressable onPress={requestPerm} style={{ padding: 14, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: "center" }}>
          <Text style={{ color: "white", fontWeight: "900" }}>Izinkan Kamera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <View style={{ height: 54, backgroundColor: "white", justifyContent: "center", paddingHorizontal: 14 }}>
        <Text style={{ fontWeight: "900" }}>Ambil Presensi {type === "pulang" ? "Pulang" : "Masuk"}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <CameraView ref={camRef} style={{ flex: 1 }} facing="front" />
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, gap: 10 }}>
          
          <View style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: loading ? "#E2E8F0" : isLibur ? "#FFECEC" : !gpsOk ? "#FFECEC" : inside ? theme.colors.successSoft : "#FEF3C7", flexDirection: "row", alignItems: "center", gap: 8 }}>
            {loading && <ActivityIndicator size="small" color="#475569" />}
            <Text style={{ fontWeight: "900", color: loading ? "#475569" : isLibur ? "#B91C1C" : !gpsOk ? "#B91C1C" : inside ? "#0F7A3B" : "#92400E" }}>
              {loading ? "MENGAMBIL DATA..." : isLibur ? "HARI LIBUR" : !gpsOk ? "GPS TIDAK AKTIF" : inside ? `DI AREA (${distance ? Math.round(distance) : 0}m)` : `DI LUAR AREA (${distance ? Math.round(distance) : 0}m)`}
            </Text>
          </View>

          <View style={{ backgroundColor: theme.colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.line }}>
            <Text style={{ fontWeight: "900", color: theme.colors.primary }}>INFORMASI RADIUS</Text>
            <Text style={{ color: theme.colors.muted, marginTop: 4, fontWeight: "600" }}>Batas: {setting?.data?.sekolah?.radius_meter || 150} meter.</Text>
          </View>

          <Pressable 
            onPress={() => !loading && canSubmit && submitPresensi()} 
            disabled={!canSubmit || loading} 
            style={{ height: 54, borderRadius: 14, backgroundColor: (canSubmit && !loading) ? theme.colors.primary : "#CBD5E1", alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "900" }}>
              {loading ? "Mohon Tunggu..." : isLibur ? "Hari Libur" : !timeValid ? "Waktu Habis" : "Ambil Foto & Kirim"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}