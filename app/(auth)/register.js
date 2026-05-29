import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Image, 
  ActivityIndicator,
  Platform 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_CONFIG } from "../../src/config/api.config"; // ← IMPORT TERPUSAT

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  
  // --- 1. STATE UNTUK TOGGLE MATA PASSWORD ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [form, setForm] = useState({
    nama_guru: "",
    nip: "",
    password: "",
    confirm_password: "",
    email: "", 
    jabatan: "GURU",
    mata_pelajaran: "",
    jenis_kelamin: "Laki-laki",
    status: "PENDING",
    no_hp: "",
    alamat: ""
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const onRegister = async () => {
    if (!form.nama_guru || !form.nip || !form.password || !form.email) {
      return Alert.alert("Error", "Nama, KTA, Email, dan Password wajib diisi!");
    }

    if (!form.email.includes("@")) {
      return Alert.alert("Error", "Format email tidak valid!");
    }

    if (form.password.length < 6) {
      return Alert.alert("Error", "Password minimal 6 karakter.");
    }

    if (form.password !== form.confirm_password) {
      return Alert.alert("Error", "Konfirmasi password tidak cocok!");
    }

    setLoading(true);
    const formData = new FormData();
    
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    
    if (image) {
      formData.append("foto", {
        uri: Platform.OS === "android" ? image.uri : image.uri.replace("file://", ""),
        name: `${form.nip}.jpg`,
        type: "image/jpeg",
      });
    }

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/register`, {
        method: "POST",
        body: formData,
        headers: { 
          "Accept": "application/json" 
        },
      });
      
      const res = await response.json();

      if (response.ok || res.status === "success") {
        Alert.alert(
          "Registrasi Berhasil", 
          "Akun Anda telah terdaftar dan menunggu verifikasi admin. Silakan hubungi admin sekolah agar akun Anda aktif.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      } else {
        Alert.alert("Gagal", res.message || "Terjadi kesalahan saat mendaftar.");
      }
    } catch (_e) {
      Alert.alert("Error", "Koneksi ke server bermasalah. Pastikan server aktif dan IP benar.");
      console.log("Register Error:", _e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Registrasi Guru Baru</Text>
      
      <View style={styles.photoSection}>
        <Pressable style={styles.photoFrame} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <Ionicons name="camera-outline" size={40} color="#94A3B8" />
          )}
        </Pressable>
        <Text style={styles.photoLabel}>Unggah Foto Profil</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nama Lengkap *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Contoh: Akmal, S.Pd" 
          value={form.nama_guru}
          onChangeText={t => setForm({...form, nama_guru: t})} 
        />
        
        <Text style={styles.label}>KTA (Username Login) *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Masukkan KTA" 
          keyboardType="numeric" 
          value={form.nip}
          onChangeText={t => setForm({...form, nip: t})} 
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="nama@email.com" 
          keyboardType="email-address" 
          autoCapitalize="none"
          value={form.email}
          onChangeText={t => setForm({...form, email: t})} 
        />
        
        {/* --- 2. MODIFIKASI INPUT PASSWORD --- */}
        <Text style={styles.label}>Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.inputPassword} 
            placeholder="Min. 6 Karakter" 
            secureTextEntry={!showPassword} 
            value={form.password}
            onChangeText={t => setForm({...form, password: t})} 
          />
          <Pressable 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color="#94A3B8" 
            />
          </Pressable>
        </View>

        {/* --- 3. MODIFIKASI INPUT KONFIRMASI PASSWORD --- */}
        <Text style={styles.label}>Konfirmasi Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.inputPassword} 
            placeholder="Ulangi password" 
            secureTextEntry={!showConfirmPassword} 
            value={form.confirm_password}
            onChangeText={t => setForm({...form, confirm_password: t})} 
          />
          <Pressable 
            style={styles.eyeIcon} 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color="#94A3B8" 
            />
          </Pressable>
        </View>
        
        <Text style={styles.label}>Mata Pelajaran</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Contoh: PJOK" 
          value={form.mata_pelajaran}
          onChangeText={t => setForm({...form, mata_pelajaran: t})} 
        />

        <Text style={styles.label}>Jenis Kelamin *</Text>
        <View style={styles.row}>
          {["Laki-laki", "Perempuan"].map((item) => (
            <Pressable 
              key={item}
              style={[styles.choiceBtn, form.jenis_kelamin === item && styles.choiceBtnActive]}
              onPress={() => setForm({...form, jenis_kelamin: item})}
            >
              <Text style={[styles.choiceText, form.jenis_kelamin === item && styles.choiceTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Status Pendaftaran</Text>
        <View style={styles.row}>
          <View style={[styles.choiceBtn, { backgroundColor: '#F1F5F9' }]}>
            <Text style={{ color: '#64748B', fontWeight: 'bold' }}>PENDING (Verifikasi Admin)</Text>
          </View>
        </View>

        <Text style={styles.label}>No. Handphone</Text>
        <TextInput 
          style={styles.input} 
          placeholder="08xxxx" 
          keyboardType="phone-pad" 
          value={form.no_hp}
          onChangeText={t => setForm({...form, no_hp: t})} 
        />

        <Text style={styles.label}>Alamat Lengkap</Text>
        <TextInput 
          style={[styles.input, {height: 80}]} 
          multiline 
          placeholder="Alamat tinggal" 
          value={form.alamat}
          onChangeText={t => setForm({...form, alamat: t})} 
        />
      </View>

      <Pressable 
        style={[styles.btnPrimary, loading && {opacity: 0.7}]} 
        onPress={onRegister} 
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Daftar Sekarang</Text>}
      </Pressable>
      
      <Pressable onPress={() => router.back()} style={{ marginBottom: 50 }}>
        <Text style={styles.backLink}>Sudah punya akun? Login di sini</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1E3A8A", marginTop: 40, marginBottom: 30, textAlign: "center" },
  photoSection: { alignItems: "center", marginBottom: 25 },
  photoFrame: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  imagePreview: { width: "100%", height: "100%" },
  photoLabel: { marginTop: 8, fontSize: 12, color: "#64748B" },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 12, marginBottom: 15, fontSize: 15 },
  
  // --- 4. STYLE TAMBAHAN UNTUK LAYOUT MATA PASSWORD ---
  passwordContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: "#E2E8F0", 
    borderRadius: 12, 
    marginBottom: 15,
    position: "relative"
  },
  inputPassword: { 
    flex: 1, 
    padding: 12, 
    fontSize: 15, 
    paddingRight: 50 // Memberikan ruang kanan agar teks password tidak menabrak ikon mata
  },
  eyeIcon: { 
    position: "absolute", 
    right: 15, 
    height: "100%", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  
  row: { flexDirection: "row", gap: 10, marginBottom: 20 },
  choiceBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center" },
  choiceBtnActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  choiceText: { color: "#64748B", fontWeight: "600" },
  choiceTextActive: { color: "#fff" },
  btnPrimary: { backgroundColor: "#3B82F6", padding: 16, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  backLink: { textAlign: "center", marginTop: 20, color: "#64748B" }
});