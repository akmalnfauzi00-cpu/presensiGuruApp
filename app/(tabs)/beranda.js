import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import {
  getNowWIB,
  formatHHMMSS,
  formatDateID,
  isAfterTimeWIB,
} from "../../src/utils/time";
import { apiPresensiToday, apiResetRiwayat } from "../../src/api/presensi";
import { apiSettings } from "../../src/api/settings";
import { clearAllPresensiLocal } from "../../src/utils/presensiLocal";

export default function Beranda() {
  const router = useRouter();

  const [now, setNow] = useState(getNowWIB());
  const [settings, setSettings] = useState(null);

  const [presensi, setPresensi] = useState({
    jam_masuk: null,
    jam_pulang: null,
    status: null,
    is_terlambat: 0,
  });

  useEffect(() => {
    const t = setInterval(() => setNow(getNowWIB()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const s = await apiSettings();
      setSettings(s?.jam || null);

      const res = await apiPresensiToday();
      const p = res?.presensi;

      setPresensi({
        jam_masuk: p?.jam_masuk || null,
        jam_pulang: p?.jam_pulang || null,
        status: p?.status || null,
        is_terlambat: p?.is_terlambat || 0,
      });
    } catch (e) {
      console.log("loadAll:", e?.message || e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const sudahMasuk = !!presensi.jam_masuk;
  const sudahPulang = !!presensi.jam_pulang;

  const jamPulangMin = settings?.jam_pulang
    ? String(settings.jam_pulang).slice(0, 5)
    : "15:30";

  const pulangBoleh = useMemo(() => isAfterTimeWIB(now, jamPulangMin), [now, jamPulangMin]);
  const pulangDisabled = !pulangBoleh || !sudahMasuk || sudahPulang;

  function goAmbil(type) {
    router.push({ pathname: "/presensi/ambil", params: { type } });
  }

  function goIzin() {
    router.push("/pengajuan/izin");
  }

  function goSakit() {
    router.push("/pengajuan/sakit");
  }

  function goRiwayat() {
    router.push("/pengajuan/riwayat");
  }

  async function resetRiwayat() {
    Alert.alert(
      "Reset Riwayat",
      "Ini akan menghapus SEMUA riwayat presensi akun ini di website dan aplikasi. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await apiResetRiwayat();
              await clearAllPresensiLocal();
              await loadAll();
              Alert.alert("Berhasil", "Riwayat presensi berhasil direset.");
            } catch (e) {
              Alert.alert("Gagal", e?.message || "Gagal reset riwayat.");
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={["#2563EB", "#1D4ED8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroWelcome}>Selamat Datang</Text>
            <Text style={styles.heroTitle}>Presensi Guru</Text>
            <Text style={styles.heroDate}>{formatDateID(now)}</Text>
          </View>

          <View style={styles.heroIconWrap}>
            <Ionicons name="school-outline" size={24} color="#fff" />
          </View>
        </View>

        <Text style={styles.heroClock}>{formatHHMMSS(now)}</Text>

        <View style={styles.heroScheduleBox}>
          <Text style={styles.heroScheduleText}>
            {settings
              ? `Masuk ${String(settings.jam_masuk).slice(0, 5)} • Pulang ${String(settings.jam_pulang).slice(0, 5)}`
              : "Memuat jam presensi..."}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Status Presensi Hari Ini</Text>

        <View style={styles.statusRow}>
          <StatusBadge
            label={sudahMasuk ? `Masuk ${presensi.jam_masuk}` : "Belum Masuk"}
            type={sudahMasuk ? "success" : "neutral"}
            icon={sudahMasuk ? "checkmark-circle" : "time-outline"}
          />
          <StatusBadge
            label={sudahPulang ? `Pulang ${presensi.jam_pulang}` : "Belum Pulang"}
            type={sudahPulang ? "success" : "warning"}
            icon={sudahPulang ? "checkmark-done-circle" : "walk-outline"}
          />
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="location-outline" size={18} color="#0F7A3B" />
          <Text style={styles.infoBannerText}>
            Lokasi presensi mengikuti pengaturan dari website admin
          </Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <ActionCard
          title={sudahMasuk ? "Sudah Presensi" : "Presensi Masuk"}
          subtitle={sudahMasuk ? `Jam ${presensi.jam_masuk}` : "Gunakan kamera & GPS"}
          icon="log-in-outline"
          solid
          disabled={sudahMasuk}
          onPress={() => !sudahMasuk && goAmbil("masuk")}
        />

        <ActionCard
          title={sudahPulang ? "Sudah Presensi" : "Presensi Pulang"}
          subtitle={
            sudahPulang
              ? `Jam ${presensi.jam_pulang}`
              : !sudahMasuk
              ? "Masuk dulu sebelum pulang"
              : pulangBoleh
              ? "Gunakan kamera & GPS"
              : `Tersedia jam ${jamPulangMin}`
          }
          icon="log-out-outline"
          disabled={pulangDisabled}
          onPress={() => !pulangDisabled && goAmbil("pulang")}
        />
      </View>

      <View style={styles.menuCard}>
        <Text style={styles.sectionTitle}>Menu Pengajuan</Text>

        <View style={styles.menuRow}>
          <MenuButton
            title="Izin"
            subtitle="Ajukan izin tidak masuk"
            icon="document-text-outline"
            color="#F59E0B"
            onPress={goIzin}
          />

          <MenuButton
            title="Sakit"
            subtitle="Ajukan surat sakit"
            icon="medkit-outline"
            color="#EF4444"
            onPress={goSakit}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <MenuButton
            title="Riwayat Pengajuan"
            subtitle="Lihat izin & sakit yang pernah dikirim"
            icon="time-outline"
            color="#2563EB"
            onPress={goRiwayat}
            full
          />
        </View>
      </View>

      <Pressable style={styles.resetButton} onPress={resetRiwayat}>
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <Text style={styles.resetButtonText}>Reset Riwayat Presensi</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatusBadge({ label, type, icon }) {
  const stylesByType = {
    success: { bg: "#DCFCE7", color: "#166534" },
    warning: { bg: "#FEF3C7", color: "#92400E" },
    neutral: { bg: "#E2E8F0", color: "#334155" },
  };

  const current = stylesByType[type] || stylesByType.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: current.bg }]}>
      <Ionicons name={icon} size={16} color={current.color} />
      <Text style={[styles.badgeText, { color: current.color }]}>{label}</Text>
    </View>
  );
}

function ActionCard({ title, subtitle, icon, onPress, disabled, solid = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionCard,
        solid ? styles.actionCardSolid : styles.actionCardOutline,
        disabled && styles.actionCardDisabled,
      ]}
    >
      <View
        style={[
          styles.actionIconWrap,
          solid ? styles.actionIconWrapSolid : styles.actionIconWrapOutline,
          disabled && styles.actionIconWrapDisabled,
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={disabled ? "#64748B" : solid ? "#fff" : "#2563EB"}
        />
      </View>

      <Text
        style={[
          styles.actionTitle,
          solid && !disabled ? { color: "#fff" } : null,
          disabled ? { color: "#475569" } : null,
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.actionSubtitle,
          solid && !disabled ? { color: "rgba(255,255,255,0.92)" } : null,
        ]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

function MenuButton({ title, subtitle, icon, color, onPress, full = false }) {
  return (
    <Pressable style={[styles.menuButton, full && { flex: 0 }]} onPress={onPress}>
      <View style={[styles.menuIconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F6FB",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroWelcome: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  heroDate: {
    color: "rgba(255,255,255,0.88)",
    marginTop: 6,
    fontSize: 13,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroClock: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
  },
  heroScheduleBox: {
    marginTop: 14,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroScheduleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  statusRow: {
    gap: 10,
  },
  badge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeText: {
    fontWeight: "800",
    fontSize: 13,
  },
  infoBanner: {
    marginTop: 14,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    color: "#166534",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "600",
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 150,
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  actionCardSolid: {
    backgroundColor: "#2563EB",
  },
  actionCardOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE5F3",
  },
  actionCardDisabled: {
    backgroundColor: "#E2E8F0",
    borderColor: "#E2E8F0",
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIconWrapSolid: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  actionIconWrapOutline: {
    backgroundColor: "#EFF6FF",
  },
  actionIconWrapDisabled: {
    backgroundColor: "#CBD5E1",
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 14,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginTop: 6,
    fontWeight: "600",
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  menuRow: {
    flexDirection: "row",
    gap: 12,
  },
  menuButton: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  menuSubtitle: {
    marginTop: 6,
    fontSize: 12.5,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "600",
  },
  resetButton: {
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});