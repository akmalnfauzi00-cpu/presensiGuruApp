import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { setToken, setGuru, clearAuthStorage } from "../../src/utils/storage";
import { apiLogin } from "../../src/api/auth";

export default function Login() {
  const router = useRouter();
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const disabled = loading || nip.trim() === "" || password.trim() === "";

  async function onLogin() {
    if (disabled) return;

    try {
      setLoading(true);

      await clearAuthStorage();

      const res = await apiLogin(nip.trim(), password);

      if (!res?.token) {
        throw new Error("Token tidak ditemukan dari server");
      }

      await setToken(res.token);
      await setGuru(res?.guru || null);

      Alert.alert(
        "Berhasil",
        `Login sukses${
          res?.guru?.nama_guru ? `, selamat datang ${res.guru.nama_guru}` : ""
        }`
      );

      router.replace("/(tabs)/beranda");
    } catch (e) {
      Alert.alert("Gagal Login", e?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#1D4ED8", "#2563EB", "#60A5FA"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <View style={styles.logoWrap}>
              <Image
                source={require("../../assets/logo-smp.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.schoolName}>SMP Muhammadiyah 2 Karanglewas</Text>
            <Text style={styles.schoolSub}>
              Sistem Presensi Guru Berbasis Mobile
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Login Guru</Text>
            <Text style={styles.subtitle}>
              Silakan masuk menggunakan akun guru yang terdaftar
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NIP</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="card-outline" size={20} color="#64748B" />
                <TextInput
                  placeholder="Masukkan NIP"
                  placeholderTextColor="#94A3B8"
                  value={nip}
                  onChangeText={setNip}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  style={styles.input}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#64748B"
                />
                <TextInput
                  placeholder="Masukkan password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748B"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={onLogin}
              disabled={disabled}
              style={({ pressed }) => [
                styles.loginButton,
                disabled && styles.loginButtonDisabled,
                pressed && !disabled && { opacity: 0.9 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>Masuk</Text>
                </>
              )}
            </Pressable>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#2563EB"
              />
              <Text style={styles.infoText}>
                Pastikan NIP dan password sesuai dengan akun di sistem admin.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  topSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
  },
  logo: {
    width: 76,
    height: 76,
  },
  schoolName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  schoolSub: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 22,
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 22,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#D9E2F1",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#2563EB",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  infoBox: {
    marginTop: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: "#1E3A8A",
    fontSize: 12.5,
    lineHeight: 18,
  },
});