import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/http";
import { useRouter } from "expo-router";

export default function RiwayatPengajuan() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get("/pengajuan"); // Memanggil fungsi index di API
      setItems(res.items || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // Fungsi Helper untuk Warna & Ikon Status
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case "DISETUJUI":
        return { bg: "#DCFCE7", text: "#166534", icon: "checkmark-circle", label: "Disetujui" };
      case "DITOLAK":
        return { bg: "#FEE2E2", text: "#991B1B", icon: "close-circle", label: "Ditolak" };
      default:
        return { bg: "#E0F2FE", text: "#075985", icon: "time", label: "Menunggu" };
    }
  };

  const renderItem = ({ item }) => {
    const config = getStatusConfig(item.status_verifikasi);
    const isSakit = item.jenis === "SAKIT";

    return (
      <View style={styles.card}>
        {/* Bagian Atas: Jenis & Tanggal Kirim */}
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: isSakit ? "#FEE2E2" : "#FEF3C7" }]}>
            <Ionicons name={isSakit ? "medical" : "document-text"} size={12} color={isSakit ? "#991B1B" : "#92400E"} />
            <Text style={[styles.typeText, { color: isSakit ? "#991B1B" : "#92400E" }]}>
              {item.jenis}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            Diajukan: {new Date(item.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>

        {/* Bagian Tengah: Rentang Tanggal Izin */}
        <View style={styles.body}>
          <View style={styles.dateInfo}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={20} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.dateLabel}>Rentang Tanggal</Text>
              <Text style={styles.dateValue}>
                {item.tanggal_mulai} {item.tanggal_selesai !== item.tanggal_mulai ? ` s/d ${item.tanggal_selesai}` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Alasan */}
          <Text style={styles.sectionTitle}>Alasan Pengajuan:</Text>
          <Text style={styles.reasonText}>{item.alasan}</Text>

          {/* Lampiran Info */}
          <View style={styles.attachmentRow}>
            <Ionicons name="attach" size={16} color="#64748B" />
            <Text style={styles.attachmentText}>
              {item.lampiran_path ? "Lampiran tersedia" : "Tidak ada lampiran"}
            </Text>
          </View>

          {/* Catatan Admin (Jika Ada) */}
          {item.catatan_admin && (
            <View style={styles.adminNote}>
              <Text style={styles.adminNoteTitle}>Balasan Admin:</Text>
              <Text style={styles.adminNoteContent}>{item.catatan_admin}</Text>
            </View>
          )}
        </View>

        {/* Bagian Bawah: Status Verifikasi */}
        <View style={[styles.footer, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={16} color={config.text} />
          <Text style={[styles.footerText, { color: config.text }]}>
            STATUS: {config.label}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Status Pengajuan</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id_pengajuan}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>Belum ada riwayat pengajuan</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageHeader: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FFF", paddingTop: 50 },
  backBtn: { padding: 8, marginRight: 10 },
  pageTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  
  card: { backgroundColor: "#FFF", borderRadius: 20, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#F1F5F9" },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 15, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  typeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 5 },
  typeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  timestamp: { fontSize: 11, color: "#94A3B8" },
  
  body: { padding: 15 },
  dateInfo: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center" },
  dateLabel: { fontSize: 11, color: "#64748B", marginBottom: 2 },
  dateValue: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 6 },
  reasonText: { fontSize: 14, color: "#334155", lineHeight: 20, marginBottom: 12 },
  
  attachmentRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  attachmentText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  
  adminNote: { backgroundColor: "#F8FAFC", padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: "#2563EB", marginTop: 5 },
  adminNoteTitle: { fontSize: 12, fontWeight: "800", color: "#1E293B", marginBottom: 4 },
  adminNoteContent: { fontSize: 13, color: "#475569", fontStyle: "italic" },
  
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 10, gap: 8 },
  footerText: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },

  emptyState: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 10, color: "#94A3B8", fontWeight: "600" }
});