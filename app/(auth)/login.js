import React, { useState } from "react";
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
  StatusBar,
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
      setLoading(true); // Memulai loading
      await clearAuthStorage();

      const res = await apiLogin(nip.trim(), password);

      // Jika response tidak membawa token, kita lempar ke catch
      if (!res?.token) {
        throw new Error(res?.message || "KTA atau password salah, silakan coba lagi.");
      }

      await setToken(res.token);
      await setGuru(res?.guru || null);

      // Navigasi ke beranda
      router.replace("/(tabs)/beranda");
      
    } catch (e) {
      // Menangkap pesan error dari API atau dari throw Error di atas
      const errorMessage = e?.message || "Terjadi kesalahan pada server. Coba lagi.";
      
      // Jika pesan mengandung "Sesi", kita ganti jadi lebih ramah
      const displayMessage = errorMessage.includes("Sesi") 
        ? "Password salah, silakan coba lagi." 
        : errorMessage;

      Alert.alert("Gagal Masuk", displayMessage);
    } finally {
      // INI KUNCI AGAR LOADING BERHENTI (WAJIB ADA)
      setLoading(false); 
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* BACKGROUND GRADIENT UTAMA */}
      <LinearGradient
        colors={["#0F172A", "#1D4ED8", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* BAGIAN ATAS: LOGO & JUDUL */}
          <View style={styles.topSection}>
            <View style={styles.logoWrap}>
              <Image
                source={require("../../assets/logo-smp.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.schoolName}>SMP Muhammadiyah 2{"\n"}Karanglewas</Text>
            <Text style={styles.schoolSub}>
              Sistem Presensi Guru Berbasis Mobile
            </Text>
          </View>

          {/* BAGIAN BAWAH: KARTU FORM LOGIN */}
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            
            <Text style={styles.title}>Selamat Datang!</Text>
            <Text style={styles.subtitle}>
              Silakan masuk dengan KTA dan Password Anda
            </Text>

            <View style={styles.formContainer}>
              {/* INPUT NIP */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kartu Tanda Anggota (KTA)</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={20} color="#64748B" />
                  <TextInput
                    placeholder="Masukan KTA"
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

              {/* INPUT PASSWORD */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
                  <TextInput
                    placeholder="Masukkan kata sandi"
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
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748B"
                    />
                  </Pressable>
                </View>
              </View>

              {/* FITUR LUPA PASSWORD */}
              <View style={styles.forgotPassWrap}>
                <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                  <Text style={styles.forgotPassText}>Lupa Password?</Text>
                </Pressable>
              </View>

              {/* TOMBOL LOGIN */}
              <Pressable
                onPress={onLogin}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.loginButton,
                  disabled && styles.loginButtonDisabled,
                  pressed && !disabled && { transform: [{ scale: 0.98 }] },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Masuk Sekarang</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </Pressable>

              {/* MENU REGISTRASI */}
              <View style={styles.registerWrap}>
                <Text style={styles.noAccountText}>Belum memiliki akun?</Text>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.registerLink}>Daftar Guru Baru</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.footerWrap}>
              <Text style={styles.footerText}>
                Hubungi administrator jika Anda mengalami kendala saat masuk.
              </Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // BAGIAN ATAS
  topSection: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logo: {
    width: 60,
    height: 60,
  },
  schoolName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  schoolSub: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    fontWeight: "500",
  },

  // BAGIAN BAWAH (BOTTOM SHEET FORM)
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 32,
    fontWeight: "500",
  },
  
  formContainer: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
  },

  // FORGOT PASSWORD
  forgotPassWrap: {
    alignItems: "flex-end",
    marginTop: -8,
    marginRight: 4,
  },
  forgotPassText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },

  loginButton: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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

  // REGISTER SECTION
  registerWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  noAccountText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
  registerLink: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
  },

  footerWrap: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});