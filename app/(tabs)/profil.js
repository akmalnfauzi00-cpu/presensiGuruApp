import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Image,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker"; // ← PASTIKAN SUDAH INSTAL INI
import { API_CONFIG } from "../../src/config/api.config"; 
import { getToken } from "../../src/utils/storage";

import { apiMe, apiLogout } from "../../src/api/auth";
import { removeToken } from "../../src/utils/storage";

export default function Profil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guru, setGuru] = useState(null);

  // STATE MANAGEMENT FORM EDIT DATA (LENGKAP DENGAN FOTO & PASSWORD)
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [secureText, setSecureText] = useState(true);

  const [formInput, setFormInput] = useState({
    nip: "",
    nama_guru: "",
    password: "", // Input password baru
    mata_pelajaran: "",
    no_hp: "",
    email: "",
    alamat: "",
    status_aktif: ""
  });

  async function loadProfil() {
    try {
      const res = await apiMe();
      if (res?.guru) {
        setGuru(res.guru);
        setFormInput({
          nip: res.guru.nip || "",
          nama_guru: res.guru.nama_guru || "",
          password: "", // Biarkan kosong secara default
          mata_pelajaran: res.guru.mata_pelajaran || "",
          no_hp: res.guru.no_hp || "",
          email: res.guru.email || "",
          alamat: res.guru.alamat || "",
          status_aktif: res.guru.status_aktif || "AKTIF"
        });
        setSelectedImage(null); // Reset temp image picker
      }
    } catch (e) {
      Alert.alert("Gagal", e?.message || "Gagal memuat profil");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProfil();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfil();
  };

  // FUNGSI MEMILIH FOTO BARU LEWAT GALERI HP
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Izin Ditolak", "Aplikasi membutuhkan akses galeri untuk mengganti foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  async function onLogout() {
    try { await apiLogout(); } catch {}
    await removeToken();
    router.replace("/(auth)/login");
  }

  function confirmLogout() {
    Alert.alert("Keluar Aplikasi", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Ya", style: "destructive", onPress: onLogout }
    ]);
  }

  // FUNGSI SIMPAN PERUBAHAN KE SERVER (TERMASUK BLOB FOTO & PASSWORD)
  async function handleSimpanProfil() {
    if (!formInput.nama_guru.trim() || !formInput.no_hp.trim()) {
      Alert.alert("Peringatan", "Nama Lengkap dan No. Handphone wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const cleanBaseUrl = API_CONFIG.UPLOAD_GURU.replace(/\/public\/uploads\/guru.*/, "");

      const formData = new FormData();
      formData.append("nama_guru", formInput.nama_guru);
      formData.append("no_hp", formInput.no_hp);
      formData.append("email", formInput.email);
      formData.append("alamat", formInput.alamat);
      
      // Jika password diisi, kirim ke backend
      if (formInput.password.trim().length > 0) {
        formData.append("password", formInput.password);
      }

      // Jika ada file foto baru yang dipilih, bungkus ke form-data
      if (selectedImage) {
        const uriParts = selectedImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append("foto", {
          uri: selectedImage,
          name: `AVATAR_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const response = await fetch(`${cleanBaseUrl}/api/profil/update`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "multipart/form-data"
        },
        body: formData
      });

      const resJson = await response.json();

      if (response.ok) {
        Alert.alert("Sukses", "Profil & data login berhasil diperbarui.");
        setShowEditModal(false);
        loadProfil();
      } else {
        Alert.alert("Gagal", resJson.message || "Gagal memperbarui data.");
      }
    } catch (error) {
      console.log("Error Update Profil:", error);
      Alert.alert("Error", "Gagal menghubungkan ke server.");
    } finally {
      setSubmitting(false);
    }
  }

  const initials = useMemo(() => {
    const name = guru?.nama_guru?.trim() || "Guru";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [guru]);

  const fotoUrl = useMemo(() => {
    if (!guru?.foto) return null;
    const cleanFileName = guru.foto.trim().replace(/^\/+/, "");
    return `${API_CONFIG.UPLOAD_GURU}/${cleanFileName}`; 
  }, [guru?.foto]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Menyiapkan profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}>
        <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.headerBackground}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerSmallText}>Kelola Akun</Text>
              <Text style={styles.headerLargeText}>Profil Saya</Text>
            </View>
            <Pressable onPress={() => setShowEditModal(true)} style={styles.headerIconWrap}>
              <Ionicons name="settings-outline" size={22} color="#1E3A8A" />
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.floatingCard}>
          <View style={styles.avatarWrapper}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatarImage} key={fotoUrl} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={[styles.statusDot, { backgroundColor: guru?.status_aktif === 'AKTIF' ? '#10B981' : '#F59E0B' }]} />
          </View>
          <Text style={styles.nameText}>{guru?.nama_guru || "Nama Tidak Diketahui"}</Text>
          <Text style={styles.nipText}>KTA. {guru?.nip || "-"}</Text>

          <View style={styles.badgeContainer}>
            <View style={styles.badge}><Ionicons name="ribbon-outline" size={14} color="#3B82F6" /><Text style={styles.badgeText}>Guru</Text></View>
            <View style={[styles.badge, { backgroundColor: '#F1F5F9' }]}><Ionicons name="checkmark-circle-outline" size={14} color="#10B981" /><Text style={[styles.badgeText, { color: '#475569' }]}>{guru?.status_aktif || "Aktif"}</Text></View>
          </View>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Informasi Akademik</Text></View>
        <View style={styles.infoGroup}>
          <InfoItem icon="ribbon-outline" color="#8B5CF6" label="Jabatan" value={guru?.jabatan} />
          <InfoItem icon="library-outline" color="#3B82F6" label="Mata Pelajaran" value={guru?.mata_pelajaran} isLast />
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Kontak & Lokasi</Text></View>
        <View style={styles.infoGroup}>
          <InfoItem icon="call-outline" color="#10B981" label="No. Handphone" value={guru?.no_hp} />
          <InfoItem icon="mail-outline" color="#F59E0B" label="Alamat Email" value={guru?.email} />
          <InfoItem icon="home-outline" color="#EF4444" label="Tempat Tinggal" value={guru?.alamat} isLast />
        </View>

        <Pressable style={styles.logoutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" /><Text style={styles.logoutBtnText}>Keluar Akun</Text>
        </Pressable>
        <Text style={styles.versionText}>Presensi Guru v2.0.1</Text>
      </ScrollView>

      {/* ======================================================== */}
      {/* POP-UP FORM EDIT DATA DIRI + FOTO + PASSWORD (FULL ELEMEN WEB) */}
      {/* ======================================================== */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowEditModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ubah Data Diri Guru</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              
              {/* INTERFACES UNTUK UPLOAD FOTO PROFIL */}
              <Text style={styles.formLabel}>Foto Profil (JPG/PNG/WebP)</Text>
              <View style={styles.imagePickerContainer}>
                <Image 
                  source={{ uri: selectedImage || fotoUrl || "https://via.placeholder.com/100" }} 
                  style={styles.imagePickerPreview} 
                />
                <Pressable style={styles.imagePickerBtn} onPress={pickImage}>
                  <Ionicons name="camera" size={18} color="#FFF" />
                  <Text style={styles.imagePickerBtnText}>Pilih File</Text>
                </Pressable>
              </View>

              <Text style={styles.formLabel}>NIP / KTA</Text>
              <TextInput style={[styles.formInput, styles.inputDisabled]} value={formInput.nip} editable={false} />

              <Text style={styles.formLabel}>Nama Lengkap *</Text>
              <TextInput style={styles.formInput} value={formInput.nama_guru} onChangeText={(t) => setFormInput({...formInput, nama_guru: t})} />

              {/* BARU: INPUT PASSWORD (LOGIN APLIKASI) */}
              <Text style={styles.formLabel}>Password Baru (Login Aplikasi)</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput 
                  style={[styles.formInput, { flex: 1, borderWidth: 0 }]} 
                  value={formInput.password} 
                  secureTextEntry={secureText}
                  onChangeText={(t) => setFormInput({...formInput, password: t})} 
                  placeholder="Isi jika ingin mengganti password..."
                  placeholderTextColor="#94A3B8"
                />
                <Pressable onPress={() => setSecureText(!secureText)} style={{ paddingHorizontal: 12 }}>
                  <Ionicons name={secureText ? "eye-off" : "eye"} size={20} color="#64748B" />
                </Pressable>
              </View>

              <Text style={styles.formLabel}>Mata Pelajaran Pengampu</Text>
              <TextInput style={[styles.formInput, styles.inputDisabled]} value={formInput.mata_pelajaran} editable={false} />

              <Text style={styles.formLabel}>No. Handphone / WhatsApp *</Text>
              <TextInput style={styles.formInput} value={formInput.no_hp} onChangeText={(t) => setFormInput({...formInput, no_hp: t})} keyboardType="phone-pad" />

              <Text style={styles.formLabel}>Alamat Email</Text>
              <TextInput style={styles.formInput} value={formInput.email} onChangeText={(t) => setFormInput({...formInput, email: t})} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.formLabel}>Alamat Tempat Tinggal</Text>
              <TextInput style={[styles.formInput, { height: 60, textAlignVertical: "top" }]} value={formInput.alamat} onChangeText={(t) => setFormInput({...formInput, alamat: t})} multiline numberOfLines={3} />

              <Text style={styles.formLabel}>Status Kepegawaian</Text>
              <TextInput style={[styles.formInput, styles.inputDisabled, { fontWeight: "bold", color: formInput.status_aktif === 'AKTIF' ? '#10B981' : '#F59E0B' }]} value={formInput.status_aktif} editable={false} />
            </ScrollView>

            <View style={styles.modalActionGroup}>
              <Pressable style={[styles.actionBtn, { backgroundColor: "#F1F5F9" }]} onPress={() => setShowEditModal(false)}>
                <Text style={[styles.actionBtnText, { color: "#475569" }]}>Batal</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: "#2563EB" }]} onPress={handleSimpanProfil} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.actionBtnText}>Simpan</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoItem({ icon, color, label, value, isLast = false }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoBorder]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}><Ionicons name={icon} size={20} color={color} /></View>
      <View style={styles.infoTextContainer}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value || "Belum diatur"}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 40 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  headerBackground: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 100, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerSmallText: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 2 },
  headerLargeText: { fontSize: 24, color: "#FFFFFF", fontWeight: "bold" },
  headerIconWrap: { width: 44, height: 44, backgroundColor: "#FFFFFF", borderRadius: 22, justifyContent: "center", alignItems: "center", elevation: 3 },
  floatingCard: { backgroundColor: "#FFFFFF", marginHorizontal: 20, marginTop: -60, borderRadius: 24, padding: 24, alignItems: "center", elevation: 5, marginBottom: 30 },
  avatarWrapper: { marginTop: -60, marginBottom: 16, position: "relative", elevation: 4 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: "#FFFFFF", backgroundColor: "#F1F5F9" },
  avatarFallback: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: "#FFFFFF", backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#2563EB", fontSize: 36, fontWeight: "bold" },
  statusDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 4, borderColor: "#FFFFFF", position: "absolute", bottom: 4, right: 4 },
  nameText: { fontSize: 20, fontWeight: "bold", color: "#0F172A", textAlign: "center", marginBottom: 4 },
  nipText: { fontSize: 14, color: "#64748B" },
  badgeContainer: { flexDirection: "row", gap: 10, marginTop: 16 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  badgeText: { fontSize: 13, color: "#2563EB", fontWeight: "600" },
  sectionHeader: { marginHorizontal: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#0F172A" },
  infoGroup: { backgroundColor: "#FFFFFF", marginHorizontal: 20, borderRadius: 24, paddingVertical: 8, elevation: 2, marginBottom: 28 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#64748B", marginBottom: 4 },
  infoValue: { fontSize: 15, color: "#1E293B", fontWeight: "600" },
  logoutBtn: { flexDirection: "row", backgroundColor: "#FEF2F2", marginHorizontal: 20, paddingVertical: 18, borderRadius: 20, justifyContent: "center", alignItems: "center", gap: 8, marginTop: 10 },
  logoutBtnText: { color: "#EF4444", fontSize: 16, fontWeight: "bold" },
  versionText: { textAlign: "center", color: "#94A3B8", fontSize: 13, marginTop: 24 },

  // POP-UP FORM EDIT DATA
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 34 },
  modalHandle: { width: 40, height: 5, backgroundColor: "#E2E8F0", borderRadius: 3, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 19, fontWeight: "bold", color: "#0F172A", textAlign: "center", marginBottom: 15 },
  formLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 5, marginTop: 10 },
  formInput: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 12, fontSize: 14, color: "#1E293B", fontWeight: "600" },
  inputDisabled: { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1", color: "#64748B" },
  modalActionGroup: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionBtn: { flex: 1, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  actionBtnText: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF" },

  // BARU: STYLES UNTUK PICKER FILE FOTO DAN PASSWORD LAYOUT
  imagePickerContainer: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", padding: 12, borderRadius: 12 },
  imagePickerPreview: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: "#CBD5E1" },
  imagePickerBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#475569", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  imagePickerBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  passwordInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, overflow: "hidden" }
});