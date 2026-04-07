import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiMe, apiLogout } from "../../src/api/auth";
import { removeToken } from "../../src/utils/storage";
import { useRouter } from "expo-router";

export default function Profil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [guru, setGuru] = useState(null);

  async function loadProfil() {
    try {
      setLoading(true);
      const res = await apiMe();
      setGuru(res?.guru || null);
    } catch (e) {
      Alert.alert("Gagal", e?.message || "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfil();
  }, []);

  async function onLogout() {
    try {
      await apiLogout();
    } catch {}

    await removeToken();
    router.replace("/(auth)/login");
  }

  const initials = useMemo(() => {
    const name = guru?.nama_guru?.trim() || "Guru";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [guru]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={["#2563EB", "#1D4ED8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.name}>{guru?.nama_guru || "-"}</Text>
        <Text style={styles.subText}>NIP {guru?.nip || "-"}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{guru?.jabatan || "Guru"}</Text>
        </View>
      </LinearGradient>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Informasi Profil</Text>

        <InfoItem label="Mata Pelajaran" value={guru?.mata_pelajaran} />
        <InfoItem label="No HP" value={guru?.no_hp} />
        <InfoItem label="Email" value={guru?.email} />
        <InfoItem label="Alamat" value={guru?.alamat} multiline />
      </View>

      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoItem({ label, value, multiline = false }) {
  return (
    <View style={[styles.infoRow, multiline && styles.infoRowBlock]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, multiline && styles.infoValueBlock]}>
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F6FB",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F6FB",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 14,
  },
  headerCard: {
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    marginTop: 6,
  },
  badge: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
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
    marginBottom: 10,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  infoRowBlock: {
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 6,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 17,
    color: "#0F172A",
    fontWeight: "700",
  },
  infoValueBlock: {
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});