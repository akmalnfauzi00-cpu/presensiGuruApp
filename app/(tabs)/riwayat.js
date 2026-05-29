import { useCallback, useMemo, useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView, Alert, Linking, Modal, TextInput, StyleSheet, ActivityIndicator, RefreshControl
} from "react-native";
import { useFocusEffect } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getToken } from "../../src/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { apiPresensiRiwayat } from "../../src/api/presensi";
import { apiRewardSpMe, apiRewardSpDownloadUrl } from "../../src/api/rewardsp";
import { getApiBaseUrl } from "../../src/api/http";

const TABS = ["Presensi", "Reward", "SP"];
const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function badgeStyle(status) {
  switch (status) {
    case "HADIR": return { bg: "#DCFCE7", color: "#166534", text: "Hadir", icon: "checkmark-circle" };
    case "IZIN": return { bg: "#DBEAFE", color: "#1D4ED8", text: "Izin", icon: "document-text" };
    case "SAKIT": return { bg: "#FEF3C7", color: "#92400E", text: "Sakit", icon: "medkit" };
    case "LIBUR": return { bg: "#FFF7ED", color: "#C2410C", text: "Libur", icon: "calendar" };
    case "TIDAK_HADIR": return { bg: "#FEE2E2", color: "#B91C1C", text: "Tidak Hadir", icon: "close-circle" };
    default: return { bg: "#F1F5F9", color: "#64748B", text: status || "-", icon: "information-circle" };
  }
}

function PickerModal({ visible, title, items, selectedValue, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
            {items.map((item) => (
              <Pressable key={item.value} onPress={() => onSelect(item.value)} style={[styles.modalItem, String(item.value) === String(selectedValue) && styles.modalItemActive]}>
                <Text style={[styles.modalItemText, String(item.value) === String(selectedValue) && styles.modalItemTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.modalCloseBtn}><Text style={styles.modalCloseBtnText}>Tutup</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function Riwayat() {
  const [tab, setTab] = useState("Presensi");
  const [filterMode, setFilterMode] = useState("bulanan");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [showMonthModal, setShowMonthModal] = useState(false);

  const [items, setItems] = useState([]);
  const [rewardData, setRewardData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tglStr = selectedDate.toISOString().split('T')[0];
      const currentPeriode = `${tahun}-${bulan}`;
      
      const res = await apiPresensiRiwayat(
        filterMode === "harian" ? { mode: "harian", tanggal: tglStr } : { mode: "bulanan", bulan, tahun }
      );
      setItems(res?.items || []);

      const rs = await apiRewardSpMe(currentPeriode);
      setRewardData(rs || null);
    } catch (e) {
      console.log("API Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterMode, selectedDate, bulan, tahun]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // PERBAIKAN FATAL: Menambahkan 'load' ke dependency agar data me-refresh saat tab diklik
  useEffect(() => {
    load();
  }, [tab, load]);

const filtered = useMemo(() => {
    if (tab === "Presensi") {
      // PERBAIKAN SINKRONISASI: Ambil tanggal lokal perangkat (WIB), bukan UTC instan
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`; // Hasilnya akurat: 2026-05-21

      return items.filter((it) => it.tanggal <= todayStr);
    }

    // PERBAIKAN TOTAL FITUR REWARD/SP
    // Kita kumpulkan semua dokumen dari rewardData tanpa peduli foldernya
    const allDocs = [
      ...(rewardData?.reward?.dokumen || []),
      ...(rewardData?.sp?.dokumen || [])
    ];

    if (tab === "Reward") {
      // Cari dokumen yang jenisnya mengandung kata 'REWARD'
      return allDocs.filter(d => d.jenis?.toUpperCase().includes("REWARD"));
    }

    if (tab === "SP") {
      // Cari dokumen yang jenisnya mengandung kata 'SP'
      return allDocs.filter(d => d.jenis?.toUpperCase().includes("SP"));
    }

    return [];
  }, [tab, items, rewardData]);

  // Hitung statistik persentase kehadiran dari data yang sudah difilter
  const attendanceStats = useMemo(() => {
    if (tab !== "Presensi" || filtered.length === 0) return null;

    const countable = filtered.filter(it => it.status && it.status !== "LIBUR");
    const total = countable.length;
    if (total === 0) return null;

    // IZIN dan SAKIT dihitung masuk ke Hadir (tidak alpa)
    const hadir = countable.filter(it => ["HADIR", "IZIN", "SAKIT"].includes(it.status)).length;
    const terlambat = countable.filter(it => it.status === "TERLAMBAT").length;
    const alpa = countable.filter(it => it.status === "TIDAK_HADIR").length;

    return {
      total,
      hadir: { count: hadir, pct: Math.round((hadir / total) * 100) },
      terlambat: { count: terlambat, pct: Math.round((terlambat / total) * 100) },
      alpa: { count: alpa, pct: Math.round((alpa / total) * 100) },
    };
  }, [tab, filtered]);

  const openPdf = useCallback(async (id) => {
    try {
      const token = await getToken();
      const relative = apiRewardSpDownloadUrl(id, token);
      const baseURL = (await getApiBaseUrl()).replace(/\/$/, "");
      await Linking.openURL(`${baseURL}${relative.startsWith("/") ? relative : `/${relative}`}`);
    } catch { Alert.alert("Gagal", "Dokumen tidak bisa dibuka."); }
  }, []);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#2563EB", "#1D4ED8"]} style={styles.header}>
        <Text style={styles.headerTitle}>Catatan Riwayat</Text>
      </LinearGradient>

      <View style={styles.tabContainer}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tabButton, tab === t && styles.tabButtonActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} />}
      >
        <View style={styles.filterCard}>
          {tab === "Presensi" && (
            <View style={styles.filterTabs}>
              <Pressable onPress={() => setFilterMode("harian")} style={[styles.filterBtn, filterMode === "harian" && styles.filterBtnActive]}>
                <Text style={filterMode === "harian" ? styles.activeText : styles.inactiveText}>Harian</Text>
              </Pressable>
              <Pressable onPress={() => setFilterMode("bulanan")} style={[styles.filterBtn, filterMode === "bulanan" && styles.filterBtnActive]}>
                <Text style={filterMode === "bulanan" ? styles.activeText : styles.inactiveText}>Bulanan</Text>
              </Pressable>
            </View>
          )}

          {tab === "Presensi" && filterMode === "harian" ? (
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.inputBox}>
              <Ionicons name="calendar-outline" size={20} color="#2563EB" />
              <Text style={styles.inputText}>{selectedDate.toISOString().split('T')[0]}</Text>
              {showDatePicker && (
                <DateTimePicker 
                  value={selectedDate} 
                  mode="date" 
                  onChange={(e, d) => { setShowDatePicker(false); if(d) setSelectedDate(d); }} 
                />
              )}
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => setShowMonthModal(true)} style={styles.inputBox}>
                <Text style={styles.inputText}>{MONTH_NAMES[parseInt(bulan)-1]}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </Pressable>
              <TextInput value={tahun} onChangeText={setTahun} keyboardType="number-pad" style={[styles.inputBox, { width: 80, textAlign: 'center' }]} />
            </View>
          )}
        </View>

        {/* Kartu Statistik Persentase Kehadiran */}
        {tab === "Presensi" && !loading && attendanceStats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Statistik Kehadiran</Text>
            <Text style={styles.statsSubtitle}>{attendanceStats.total} hari kerja</Text>

            {/* Baris progress bar gabungan */}
            <View style={styles.combinedBar}>
              {attendanceStats.hadir.count > 0 && (
                <View style={[styles.barSegment, { flex: attendanceStats.hadir.count, backgroundColor: "#22C55E" }]} />
              )}
              {attendanceStats.terlambat.count > 0 && (
                <View style={[styles.barSegment, { flex: attendanceStats.terlambat.count, backgroundColor: "#F59E0B" }]} />
              )}
              {attendanceStats.alpa.count > 0 && (
                <View style={[styles.barSegment, { flex: attendanceStats.alpa.count, backgroundColor: "#EF4444" }]} />
              )}
            </View>

            {/* Grid statistik */}
            <View style={styles.statsGrid}>
              <View style={[styles.statItem, { borderLeftColor: "#22C55E" }]}>
                <Text style={[styles.statPct, { color: "#16A34A" }]}>{attendanceStats.hadir.pct}%</Text>
                <Text style={styles.statLabel}>Hadir</Text>
                <Text style={styles.statCount}>{attendanceStats.hadir.count} hari</Text>
              </View>
              <View style={[styles.statItem, { borderLeftColor: "#F59E0B" }]}>
                <Text style={[styles.statPct, { color: "#D97706" }]}>{attendanceStats.terlambat.pct}%</Text>
                <Text style={styles.statLabel}>Terlambat</Text>
                <Text style={styles.statCount}>{attendanceStats.terlambat.count} hari</Text>
              </View>
              <View style={[styles.statItem, { borderLeftColor: "#EF4444" }]}>
                <Text style={[styles.statPct, { color: "#DC2626" }]}>{attendanceStats.alpa.pct}%</Text>
                <Text style={styles.statLabel}>Alpa</Text>
                <Text style={styles.statCount}>{attendanceStats.alpa.count} hari</Text>
              </View>
            </View>
          </View>
        )}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>Tidak ada data {tab} periode ini.</Text>
          </View>
        ) : tab === "Presensi" ? (
          filtered.map((it, idx) => {
            const badge = badgeStyle(it.status);
            return (
              <View key={idx} style={styles.dataCard}>
                <View style={styles.dataCardHeader}>
                  <Text style={styles.dateText}>{it.tanggal}</Text>
                  <View style={[styles.badgeStyle, { backgroundColor: badge.bg }]}>
                    <Text style={{ color: badge.color, fontWeight: '800', fontSize: 11 }}>{badge.text}</Text>
                  </View>
                </View>
                {it.status === "HADIR" ? (
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeValue}>Masuk: {it.jam_masuk?.slice(0, 5)}</Text>
                    <Text style={styles.timeValue}>Pulang: {it.jam_pulang?.slice(0, 5) || "--:--"}</Text>
                  </View>
                ) : <Text style={styles.infoMuted}>{it.status === "LIBUR" ? it.keterangan_libur : "Tidak ada rekaman"}</Text>}
              </View>
            );
          })
        ) : (
          filtered.map((doc, idx) => (
            <View key={idx} style={styles.docCard}>
              <View style={styles.docInfo}>
                <Ionicons name="document-pdf" size={32} color="#EF4444" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.docTitle}>{doc.jenis} - {doc.periode}</Text>
                  <Text style={styles.docDesc}>{doc.deskripsi}</Text>
                </View>
              </View>
              <Pressable onPress={() => openPdf(doc.id_dokumen)} style={styles.downloadBtn}>
                <Text style={styles.downloadBtnText}>UNDUH PDF</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <PickerModal 
        visible={showMonthModal} title="Pilih Bulan" 
        items={MONTH_NAMES.map((m, i) => ({ label: m, value: String(i+1).padStart(2, "0") }))} 
        selectedValue={bulan} onSelect={(v) => { setBulan(v); setShowMonthModal(false); }} onClose={() => setShowMonthModal(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingTop: 60, paddingBottom: 40, alignItems: "center" },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "800" },
  tabContainer: { flexDirection: "row", backgroundColor: "#FFF", marginHorizontal: 20, marginTop: -25, borderRadius: 16, padding: 6, elevation: 3 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  tabButtonActive: { backgroundColor: "#EFF6FF" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#2563EB" },
  scrollContent: { padding: 20 },
  filterCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 16 },
  filterTabs: { flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 12, padding: 4, marginBottom: 12 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  filterBtnActive: { backgroundColor: "#FFF", elevation: 1 },
  activeText: { color: "#0F172A", fontWeight: "700" },
  inactiveText: { color: "#64748B" },
  inputBox: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 12 },
  inputText: { fontWeight: "700", color: "#1E293B" },
  dataCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 12, elevation: 1 },
  dataCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  dateText: { fontWeight: "800", color: "#334155" },
  badgeStyle: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  timeContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  timeValue: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  infoMuted: { fontStyle: "italic", color: "#94A3B8", fontSize: 13 },
  docCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 12, elevation: 2 },
  docInfo: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  docTitle: { fontWeight: "800", color: "#1E293B" },
  docDesc: { color: "#64748B", fontSize: 12 },
  downloadBtn: { backgroundColor: "#2563EB", padding: 12, borderRadius: 12, alignItems: "center" },
  downloadBtnText: { color: "#FFF", fontWeight: "800" },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#94A3B8", marginTop: 15, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  modalHandle: { width: 40, height: 5, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 15 },
  modalItem: { padding: 15, borderRadius: 12, marginBottom: 5 },
  modalItemActive: { backgroundColor: "#EFF6FF" },
  modalItemText: { textAlign: "center", color: "#475569" },
  modalItemTextActive: { color: "#2563EB", fontWeight: "800" },
  modalCloseBtn: { marginTop: 10, padding: 15, alignItems: "center" },

  // Statistik Kehadiran
  statsCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2 },
  statsTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B", marginBottom: 2 },
  statsSubtitle: { fontSize: 12, color: "#94A3B8", marginBottom: 12 },
  combinedBar: { flexDirection: "row", height: 10, borderRadius: 10, overflow: "hidden", backgroundColor: "#F1F5F9", marginBottom: 16 },
  barSegment: { height: "100%" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statItem: { flex: 1, minWidth: "28%", backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, borderLeftWidth: 4 },
  statPct: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, color: "#475569", fontWeight: "600", marginTop: 2 },
  statCount: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
});