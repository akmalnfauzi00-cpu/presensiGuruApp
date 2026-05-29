import { useEffect, useMemo, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Alert, 
  StyleSheet, 
  Modal, 
  ActivityIndicator 
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { getNowWIB, formatHHMMSS, formatDateID, isAfterTimeWIB } from "../../src/utils/time";
import { apiPresensiToday } from "../../src/api/presensi";
import { apiSettings } from "../../src/api/settings";

export default function Beranda() {
  const router = useRouter();
  const [now, setNow] = useState(getNowWIB());
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [modalPresensiVisible, setModalPresensiVisible] = useState(false);
  const [modalPengajuanVisible, setModalPengajuanVisible] = useState(false);
  
  const [presensi, setPresensi] = useState({ 
    jam_masuk: null, 
    jam_pulang: null, 
    is_libur: false, 
    keterangan_libur: "",
    statistik: { 
      total_hadir: 0, 
      total_izin: 0, 
      total_alpha: 0, 
      total_terlambat: 0 
    }
  });

  // Jam Realtime
  useEffect(() => {
    const t = setInterval(() => setNow(getNowWIB()), 1000);
    return () => clearInterval(t);
  }, []);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }, [now]);

  const loadAll = useCallback(async () => {
    try {
      const s = await apiSettings();
      if (s && s.status === 'success') {
        setSettings(s);
      }
      
      const res = await apiPresensiToday();
      setPresensi({
        jam_masuk: res?.presensi?.jam_masuk || null,
        jam_pulang: res?.presensi?.jam_pulang || null,
        is_libur: s?.data?.is_libur || res?.is_libur || false,
        keterangan_libur: s?.data?.keterangan_libur || res?.keterangan_libur || "",
        statistik: {
            total_hadir: res?.statistik?.total_hadir || 0,
            total_izin: res?.statistik?.total_izin || 0,
            total_alpha: res?.statistik?.total_alpha || 0,
            total_terlambat: res?.statistik?.total_terlambat || 0
        }
      });
    } catch (e) {
      console.log("Error memuat data beranda:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const jamMasukConfig = settings?.data?.jam?.jam_masuk || "--:--";
  const jamPulangMin = settings?.data?.jam?.jam_pulang || "--:--";
  const radiusMeter = settings?.data?.sekolah?.radius_meter || 30;
  
  const minHadirReward = settings?.data?.reward_rules?.persen_hadir_reward ?? 80;
  const maxAlphaSp    = settings?.data?.reward_rules?.persen_alpha_sp     ?? 15;
  const maxLateSp     = settings?.data?.reward_rules?.persen_terlambat_sp ?? 20;

  // Hitung persentase guru bulan ini (dari statistik API)
  const totalHariKerja = (presensi.statistik.total_hadir || 0)
    + (presensi.statistik.total_izin || 0)
    + (presensi.statistik.total_alpha || 0)
    + (presensi.statistik.total_terlambat || 0);

  const persenHadir    = totalHariKerja > 0 ? Math.round(((presensi.statistik.total_hadir  + (presensi.statistik.total_izin || 0)) / totalHariKerja) * 100) : 0;
  const persenAlpha    = totalHariKerja > 0 ? Math.round((presensi.statistik.total_alpha    / totalHariKerja) * 100) : 0;
  const persenTerlambat= totalHariKerja > 0 ? Math.round((presensi.statistik.total_terlambat/ totalHariKerja) * 100) : 0;

  const isRewardSafe = persenHadir    >= minHadirReward;
  const isAlphaSafe  = persenAlpha    <  maxAlphaSp;
  const isLateSafe   = persenTerlambat < maxLateSp;
  const isSPSafe = isAlphaSafe && isLateSafe;

  const sudahMasuk = !!presensi.jam_masuk;
  const sudahPulang = !!presensi.jam_pulang;
  const pulangBoleh = useMemo(() => isAfterTimeWIB(now, jamPulangMin), [now, jamPulangMin]);

  const handleAksesPresensi = () => {
    if (presensi.is_libur) {
      Alert.alert("Hari Libur", `Sekolah sedang libur: ${presensi.keterangan_libur}.\nPresensi tidak tersedia.`);
      return;
    }
    setModalPresensiVisible(true);
  };

  const handleKlikMasuk = () => {
    setModalPresensiVisible(false);
    if (sudahMasuk) {
      Alert.alert("Selesai", "Anda sudah melakukan absen masuk hari ini.");
    } else {
      router.push({ pathname: "/presensi/ambil", params: { type: "masuk" } });
    }
  };

  const handleKlikPulang = () => {
    setModalPresensiVisible(false);
    if (!sudahMasuk) {
      Alert.alert("Gagal", "Anda harus absen masuk terlebih dahulu.");
    } else if (!pulangBoleh) {
      Alert.alert("Belum Waktunya", `Absen pulang baru bisa dilakukan setelah jam ${jamPulangMin} WIB.`);
    } else if (sudahPulang) {
      Alert.alert("Selesai", "Anda sudah melakukan absen pulang hari ini.");
    } else {
      router.push({ pathname: "/presensi/ambil", params: { type: "pulang" } });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Menyiapkan Data Guru...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.headerBackground}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greetingText}>{greeting},</Text>
              <Text style={styles.appNameText}>Guru Hebat</Text>
            </View>
            <View style={styles.headerIconWrap}>
              <Ionicons name="person" size={22} color="#1E3A8A" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.integratedCard}>
          <View style={styles.liveTimeSection}>
            <View>
              <Text style={styles.infoLabel}>Hari & Tanggal</Text>
              <Text style={styles.infoValueDate}>{formatDateID(now)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.infoLabel}>Jam Saat Ini</Text>
              <Text style={styles.infoValueClock}>{formatHHMMSS(now)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.scheduleSection}>
            <View style={styles.scheduleItem}>
              <Ionicons name="log-in-outline" size={18} color="#059669" />
              <Text style={styles.scheduleText}>Masuk: {jamMasukConfig} WIB</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons name="log-out-outline" size={18} color="#D97706" />
              <Text style={styles.scheduleText}>Pulang: {jamPulangMin} WIB</Text>
            </View>
          </View>

          <View style={styles.rewardContainer}>
            <View style={[styles.rewardMiniCard, { borderLeftColor: isRewardSafe ? "#10B981" : "#EF4444" }]}>
                <Ionicons name="gift" size={16} color={isRewardSafe ? "#10B981" : "#EF4444"} />
                <View>
                    <Text style={styles.rewardLabel}>Status Reward</Text>
                    <Text style={[styles.rewardStatus, { color: isRewardSafe ? "#059669" : "#DC2626" }]}>
                        {isRewardSafe ? "Kualifikasi" : "Tidak Layak"}
                    </Text>
                </View>
            </View>
            <View style={[styles.rewardMiniCard, { borderLeftColor: isSPSafe ? "#3B82F6" : "#F59E0B" }]}>
                <Ionicons name="warning" size={16} color={isSPSafe ? "#3B82F6" : "#F59E0B"} />
                <View>
                    <Text style={styles.rewardLabel}>Peringatan SP</Text>
                    <Text style={[styles.rewardStatus, { color: isSPSafe ? "#2563EB" : "#D97706" }]}>
                        {isSPSafe ? "Zona Aman" : (!isAlphaSafe ? "SP (Alpha)" : "SP (Telat)")}
                    </Text>
                </View>
            </View>
          </View>

          {presensi.is_libur ? (
            <View style={[styles.locationBadge, { backgroundColor: "#FEF3C7", marginTop: 12 }]}>
              <Ionicons name="calendar-clear" size={20} color="#D97706" />
              <View style={styles.locationTextWrap}>
                <Text style={[styles.locationTitle, { color: "#B45309" }]}>Hari Ini Libur</Text>
                <Text style={[styles.locationSubtitle, { color: "#D97706" }]}>{presensi.keterangan_libur}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.locationBadge, { marginTop: 12 }]}>
              <Ionicons name="location" size={22} color="#2563EB" />
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationTitle}>SMP Muhammadiyah 2 Karanglewas</Text>
                <Text style={styles.locationSubtitle}>Batas Radius Absen: {radiusMeter} Meter</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Akses Cepat</Text>
          <View style={styles.gridRow}>
            <Pressable onPress={handleAksesPresensi} style={({ pressed }) => [styles.gridItem, pressed && { transform: [{ scale: 0.95 }] }]}>
              <View style={[styles.gridIconBox, { backgroundColor: "#ECFDF5" }]}><Ionicons name="camera" size={28} color="#10B981" /></View>
              <Text style={styles.gridLabel}>Presensi</Text>
              <Text style={styles.gridSubtitle}>{sudahPulang ? "Tuntas" : (sudahMasuk ? "Sudah Masuk" : "Kamera")}</Text>
            </Pressable>
            <Pressable onPress={() => setModalPengajuanVisible(true)} style={({ pressed }) => [styles.gridItem, pressed && { transform: [{ scale: 0.95 }] }]}>
              <View style={[styles.gridIconBox, { backgroundColor: "#EFF6FF" }]}><Ionicons name="document-text" size={28} color="#3B82F6" /></View>
              <Text style={styles.gridLabel}>Pengajuan</Text>
              <Text style={styles.gridSubtitle}>Izin & Sakit</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/riwayat")} style={({ pressed }) => [styles.gridItem, pressed && { transform: [{ scale: 0.95 }] }]}>
              <View style={[styles.gridIconBox, { backgroundColor: "#F5F3FF" }]}><Ionicons name="calendar" size={28} color="#8B5CF6" /></View>
              <Text style={styles.gridLabel}>Riwayat</Text>
              <Text style={styles.gridSubtitle}>Rekap Absen</Text>
            </Pressable>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* BANNER MINIMALIS TANPA IKON (ULTRA CLEAN) */}
        {/* ========================================================================= */}
        <View style={styles.modernBannerContainer}>
          <LinearGradient 
            colors={["#0F172A", "#1E293B"]} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}} 
            style={styles.modernBannerBg}
          >
            <Text style={styles.modernBannerTitle}>Target & Batasan Bulan Ini</Text>
            
            <View style={styles.modernRuleGrid}>
              <View style={styles.modernRuleCard}>
                <Text style={styles.modernRuleLabel}>MIN. HADIR</Text>
                <Text style={[styles.modernRuleValue, { color: '#FACC15' }]}>{minHadirReward}%</Text>
              </View>

              <View style={styles.modernRuleCard}>
                <Text style={styles.modernRuleLabel}>MAKS. ALPA</Text>
                <Text style={[styles.modernRuleValue, { color: '#FB7185' }]}>{maxAlphaSp}%</Text>
              </View>

              <View style={styles.modernRuleCard}>
                <Text style={styles.modernRuleLabel}>MAKS. TELAT</Text>
                <Text style={[styles.modernRuleValue, { color: '#FDBA74' }]}>{maxLateSp}%</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* MODAL BOTTOM SHEET (TIDAK BERUBAH) */}
      <Modal visible={modalPresensiVisible} transparent animationType="slide" onRequestClose={() => setModalPresensiVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setModalPresensiVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Presensi</Text>
            <Text style={styles.modalSubtitle}>Silakan pilih jenis presensi Anda saat ini</Text>
            <Pressable style={({ pressed }) => [styles.optCard, sudahMasuk && styles.optCardDisabled, pressed && !sudahMasuk && { transform: [{ scale: 0.98 }] }]} onPress={handleKlikMasuk}>
              <View style={[styles.optIconWrap, { backgroundColor: "#DCFCE7" }]}><Ionicons name={sudahMasuk ? "checkmark-circle" : "log-in"} size={26} color="#16A34A" /></View>
              <View style={styles.optTextWrap}><Text style={styles.optTitle}>Absen Masuk</Text><Text style={styles.optDesc}>{sudahMasuk ? `Selesai jam ${presensi.jam_masuk}` : "Tersedia sekarang"}</Text></View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.optCard, (!pulangBoleh || !sudahMasuk || sudahPulang) && styles.optCardDisabled, pressed && pulangBoleh && sudahMasuk && !sudahPulang && { transform: [{ scale: 0.98 }] }]} onPress={handleKlikPulang}>
              <View style={[styles.optIconWrap, { backgroundColor: "#FEF3C7" }]}><Ionicons name={sudahPulang ? "checkmark-circle" : "log-out"} size={26} color="#D97706" /></View>
              <View style={styles.optTextWrap}><Text style={styles.optTitle}>Absen Pulang</Text><Text style={styles.optDesc}>{sudahPulang ? `Selesai jam ${presensi.jam_pulang}` : (!pulangBoleh ? `Buka jam ${jamPulangMin}` : "Tersedia")}</Text></View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setModalPresensiVisible(false)}><Text style={styles.cancelBtnText}>Batal</Text></Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL PENGAJUAN (TIDAK BERUBAH) */}
      <Modal visible={modalPengajuanVisible} transparent animationType="slide" onRequestClose={() => setModalPengajuanVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setModalPengajuanVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Menu Pengajuan</Text>
            <Pressable style={styles.optCard} onPress={() => { setModalPengajuanVisible(false); router.push("/pengajuan/riwayat"); }}>
              <View style={[styles.optIconWrap, { backgroundColor: "#EFF6FF" }]}><Ionicons name="time" size={26} color="#2563EB" /></View>
              <View style={styles.optTextWrap}><Text style={styles.optTitle}>Status Pengajuan</Text><Text style={styles.optDesc}>Riwayat izin & sakit</Text></View>
            </Pressable>
            <Pressable style={styles.optCard} onPress={() => { setModalPengajuanVisible(false); router.push("/pengajuan/koreksi"); }}>
              <View style={[styles.optIconWrap, { backgroundColor: "#F3E8FF" }]}><Ionicons name="create-outline" size={26} color="#7C3AED" /></View>
              <View style={styles.optTextWrap}>
                <Text style={styles.optTitle}>Koreksi Presensi</Text>
                <Text style={styles.optDesc}>Lupa absen hari ini</Text>
              </View>
            </Pressable>
            <Pressable style={styles.optCard} onPress={() => { setModalPengajuanVisible(false); router.push("/pengajuan/izin"); }}>
              <View style={[styles.optIconWrap, { backgroundColor: "#F3E8FF" }]}><Ionicons name="mail" size={26} color="#9333EA" /></View>
              <View style={styles.optTextWrap}><Text style={styles.optTitle}>Ajukan Izin</Text><Text style={styles.optDesc}>Form keperluan pribadi</Text></View>
            </Pressable>
            <Pressable style={styles.optCard} onPress={() => { setModalPengajuanVisible(false); router.push("/pengajuan/sakit"); }}>
              <View style={[styles.optIconWrap, { backgroundColor: "#FEE2E2" }]}><Ionicons name="medkit" size={26} color="#DC2626" /></View>
              <View style={styles.optTextWrap}><Text style={styles.optTitle}>Ajukan Sakit</Text><Text style={styles.optDesc}>Upload surat dokter</Text></View>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setModalPengajuanVisible(false)}><Text style={styles.cancelBtnText}>Batal</Text></Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748B", fontWeight: "600" },
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 40 },
  headerBackground: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 80, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greetingText: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginBottom: 2 },
  appNameText: { fontSize: 24, color: "#FFFFFF", fontWeight: "900" },
  headerIconWrap: { width: 44, height: 44, backgroundColor: "#FFFFFF", borderRadius: 22, justifyContent: "center", alignItems: "center" },
  integratedCard: { backgroundColor: "#FFFFFF", marginHorizontal: 20, marginTop: -50, borderRadius: 24, padding: 20, elevation: 5, marginBottom: 28 },
  liveTimeSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  infoValueDate: { fontSize: 15, fontWeight: "800", color: "#1E3A8A" },
  infoValueClock: { fontSize: 24, fontWeight: "900", color: "#0F172A" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },
  scheduleSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  scheduleItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  scheduleText: { fontSize: 13, fontWeight: "700", color: "#334155" },
  rewardContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 4 },
  rewardMiniCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F8FAFC", padding: 12, borderRadius: 16, borderLeftWidth: 3 },
  rewardLabel: { fontSize: 10, color: "#64748B", fontWeight: "600" },
  rewardStatus: { fontSize: 11, fontWeight: "800" },
  locationBadge: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#EFF6FF", padding: 12, borderRadius: 16 },
  locationTextWrap: { flex: 1 },
  locationTitle: { fontSize: 13, fontWeight: "800", color: "#1E3A8A" },
  locationSubtitle: { fontSize: 11, color: "#3B82F6" },
  menuContainer: { marginHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A", marginBottom: 16 },
  gridRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  gridItem: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 16, alignItems: "center", elevation: 2 },
  gridIconBox: { width: 52, height: 52, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  gridLabel: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  gridSubtitle: { fontSize: 10, color: "#64748B" },
  
  // STYLES BANNER MINIMALIS BARU
  modernBannerContainer: { marginHorizontal: 20, marginBottom: 20 },
  modernBannerBg: { borderRadius: 24, padding: 24, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modernBannerTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 20, textAlign: 'center', textTransform: 'uppercase' },
  modernRuleGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  modernRuleCard: { flex: 1, alignItems: 'center' },
  modernRuleLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700', marginBottom: 4 },
  modernRuleValue: { fontSize: 16, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHandle: { width: 40, height: 5, backgroundColor: "#E2E8F0", borderRadius: 3, alignSelf: "center", marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 24 },
  optCard: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1, borderColor: "#F1F5F9", borderRadius: 20, marginBottom: 12 },
  optCardDisabled: { opacity: 0.6, backgroundColor: "#F8FAFC" },
  optIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 16 },
  optTextWrap: { flex: 1 },
  optTitle: { fontSize: 16, fontWeight: "800" },
  optDesc: { fontSize: 13, color: "#64748B" },
  cancelBtn: { marginTop: 12, padding: 18, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center" },
  cancelBtnText: { fontSize: 16, fontWeight: "800", color: "#475569" }
});