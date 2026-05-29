import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_CONFIG } from "../../src/config/api.config"; // ← IMPORT TERPUSAT

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const [form, setForm] = useState({
    nip: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  // Validasi Step 1
  const isNipEmpty = form.nip.trim() === "";

  // Validasi Step 2
  const isFormComplete =
    form.otp.length === 6 &&
    form.password.length >= 6 &&
    form.confirmPassword.length >= 6;

  // FUNGSI 1: Minta OTP (Step 1)
  async function handleRequestOTP() {
    if (isNipEmpty) {
      return Alert.alert("Peringatan", "Silakan masukkan KTA Anda terlebih dahulu.");
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_CONFIG.API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nip: form.nip.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSentEmail(data.email_preview || "email Anda");
        Alert.alert(
          "Kode Terkirim",
          `Kode OTP telah dikirim ke email ${data.email_preview || "yang terdaftar"}.`
        );
        setStep(2);
      } else {
        Alert.alert("Gagal", data.message || "KTA tidak ditemukan.");
      }
    } catch (_e) {
      Alert.alert(
        "Kesalahan Koneksi",
        "Tidak dapat terhubung ke server. Pastikan IP Address benar dan HP terhubung ke jaringan yang sama."
      );
    } finally {
      setLoading(false);
    }
  }

  // FUNGSI 2: Reset Password (Step 2)
  async function handleResetPassword() {
    if (form.password !== form.confirmPassword) {
      return Alert.alert("Error", "Konfirmasi password tidak cocok!");
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_CONFIG.API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nip: form.nip.trim(),
          otp: form.otp.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Berhasil", "Kata sandi Anda telah diperbarui. Silakan login kembali.", [
          { text: "Login Sekarang", onPress: () => router.replace("/(auth)/login") },
        ]);
      } else {
        Alert.alert("Gagal Verifikasi", data.message || "Kode OTP salah atau sudah kadaluarsa.");
      }
    } catch (_e) {
      Alert.alert("Error", "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* TOMBOL KEMBALI */}
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? "Masukkan KTA untuk menerima kode verifikasi OTP melalui email Anda."
                : `Masukkan kode OTP 6-digit yang telah dikirim ke ${sentEmail}`}
            </Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            {step === 1 ? (
              /* STEP 1: INPUT NIP */
              <View style={styles.inputGroup}>
                <Text style={styles.label}>KTA Pegawai</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="card-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: 2203040001"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={form.nip}
                    onChangeText={(v) => setForm({ ...form, nip: v })}
                  />
                </View>

                <Pressable
                  style={[styles.primaryBtn, isNipEmpty && styles.btnDisabled]}
                  onPress={handleRequestOTP}
                  disabled={loading || isNipEmpty}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>Kirim Kode OTP</Text>
                      <Ionicons name="mail-outline" size={20} color="#fff" />
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              /* STEP 2: INPUT OTP & PASS BARU */
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kode OTP (6 Digit)</Text>
                <TextInput
                  style={[styles.inputField, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus={true}
                  value={form.otp}
                  onChangeText={(v) => setForm({ ...form, otp: v })}
                />

                <Text style={styles.label}>Password Baru</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                />

                <Text style={styles.label}>Konfirmasi Password</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Ulangi password baru"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={form.confirmPassword}
                  onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
                />

                <Pressable
                  style={[
                    styles.primaryBtn,
                    (!isFormComplete || loading) && styles.btnDisabled,
                    { backgroundColor: "#10B981" },
                  ]}
                  onPress={handleResetPassword}
                  disabled={loading || !isFormComplete}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>Perbarui Password</Text>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    </>
                  )}
                </Pressable>

                <Pressable onPress={() => setStep(1)} style={styles.switchStep}>
                  <Text style={styles.switchStepText}>Salah masukkan KTA? Kembali</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* FOOTER INFO */}
          <Text style={styles.footerNote}>
            Jika tidak menerima email, periksa folder Spam atau hubungi Administrator.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: "center" },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  header: { marginBottom: 32, marginTop: 40 },
  title: { fontSize: 32, fontWeight: "900", color: "#fff", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#94A3B8", lineHeight: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  inputGroup: { gap: 4 },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: "#0F172A", fontWeight: "600" },
  inputField: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "600",
  },
  otpInput: {
    textAlign: "center",
    letterSpacing: 10,
    fontSize: 22,
    color: "#2563EB",
  },
  primaryBtn: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  btnDisabled: { backgroundColor: "#CBD5E1" },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  switchStep: { marginTop: 20, alignItems: "center" },
  switchStepText: { color: "#64748B", fontWeight: "600", fontSize: 14 },
  footerNote: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    marginTop: 30,
    lineHeight: 18,
  },
});