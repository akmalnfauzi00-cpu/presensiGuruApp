import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/http";
import { useRouter } from "expo-router";

export default function AjukanKoreksi() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [jenis, setJenis] = useState("MASUK"); // MASUK | PULANG | KEDUANYA

  // Tanggal hanya hari ini — tidak bisa pilih hari lain
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todayLabel = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSubmit = async () => {
    if (!alasan.trim()) {
      Alert.alert("Perlu Alasan", "Mohon isi alasan lupa presensi.");
      return;
    }

    Alert.alert(
      "Konfirmasi Pengajuan",
      `Anda akan mengajukan koreksi presensi untuk hari ini (${todayLabel}).\n\nJenis: ${jenis}\nAlasan: ${alasan.trim()}\n\nPengajuan ini hanya bisa dilakukan hari ini. Lanjutkan?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Kirim",
          onPress: async () => {
            setLoading(true);
            try {
              const fd = new FormData();
              fd.append("jenis", "KOREKSI");
              fd.append("jenis_koreksi", jenis);
              fd.append("tanggal_mulai", todayStr);
              fd.append("tanggal_selesai", todayStr);
              fd.append("alasan", alasan.trim());

              await api.postForm("/pengajuan/store", fd);

              Alert.alert(
                "Berhasil! ✅",
                "Pengajuan koreksi presensi telah dikirim. Tunggu persetujuan admin.",
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (err) {
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Gagal mengirim pengajuan.";
              Alert.alert("Gagal", msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const jenisOptions = [
    { key: "MASUK", label: "Lupa Absen Masuk", icon: "log-in-outline", color: "#059669" },
    { key: "PULANG", label: "Lupa Absen Pulang", icon: "log-out-outline", color: "#D97706" },
    { key: "KEDUANYA", label: "Keduanya", icon: "swap-horizontal-outline", color: "#7C3AED" },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E3A8A" />
        </Pressable>
        <Text style={styles.headerTitle}>Koreksi Presensi</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#1D4ED8" />
        <Text style={styles.infoText}>
          Pengajuan koreksi <Text style={styles.infoBold}>hanya bisa dilakukan hari ini</Text>.
          Jika terlewat, presensi otomatis tercatat sebagai <Text style={styles.infoBold}>Alpa</Text>.
        </Text>
      </View>

      {/* Tanggal */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Tanggal Koreksi</Text>
        <View style={styles.dateBox}>
          <Ionicons name="calendar" size={20} color="#2563EB" />
          <Text style={styles.dateText}>{todayLabel}</Text>
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Hari Ini</Text>
          </View>
        </View>
      </View>

      {/* Jenis Koreksi */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Jenis Koreksi</Text>
        <View style={styles.jenisGrid}>
          {jenisOptions.map((opt) => {
            const active = jenis === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setJenis(opt.key)}
                style={[
                  styles.jenisItem,
                  active && { borderColor: opt.color, backgroundColor: opt.color + "12" },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={active ? opt.color : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.jenisLabel,
                    active && { color: opt.color, fontWeight: "800" },
                  ]}
                >
                  {opt.label}
                </Text>
                {active && (
                  <Ionicons name="checkmark-circle" size={16} color={opt.color} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Alasan */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Alasan Lupa Presensi</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Contoh: Terburu-buru saat masuk, lupa tap hp di gerbang..."
          placeholderTextColor="#94A3B8"
          value={alasan}
          onChangeText={setAlasan}
          multiline
          numberOfLines={4}
          maxLength={300}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{alasan.length}/300</Text>
      </View>

      {/* Catatan */}
      <View style={styles.noteBox}>
        <Ionicons name="alert-circle-outline" size={16} color="#B45309" />
        <Text style={styles.noteText}>
          Pengajuan ini akan diverifikasi oleh admin. Status presensi baru berubah setelah disetujui.
        </Text>
      </View>

      {/* Submit */}
      <Pressable
        style={({ pressed }) => [
          styles.submitBtn,
          loading && styles.submitDisabled,
          pressed && !loading && { opacity: 0.85 },
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="paper-plane" size={18} color="#FFF" />
            <Text style={styles.submitText}>Kirim Pengajuan</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 48 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  infoBanner: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },
  infoText: { flex: 1, fontSize: 13, color: "#1E40AF", lineHeight: 20 },
  infoBold: { fontWeight: "800" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 14,
  },
  dateText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#0F172A" },
  todayBadge: {
    backgroundColor: "#2563EB",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  todayBadgeText: { fontSize: 11, fontWeight: "800", color: "#FFF" },

  jenisGrid: { gap: 10 },
  jenisItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#F8FAFC",
  },
  jenisLabel: { flex: 1, fontSize: 14, color: "#64748B", fontWeight: "600" },

  textArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 14,
    fontSize: 14,
    color: "#0F172A",
    minHeight: 100,
  },
  charCount: { fontSize: 11, color: "#94A3B8", textAlign: "right", marginTop: 6 },

  noteBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
    alignItems: "flex-start",
  },
  noteText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },

  submitBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#2563EB",
    borderRadius: 18,
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: "900", color: "#FFF" },
});