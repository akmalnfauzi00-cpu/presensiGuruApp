import { useState } from "react";
import {
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { apiPengajuanCreate } from "../../src/api/pengajuan";
import { apiUploadPengajuan } from "../../src/api/upload";
import { theme } from "../../src/ui/theme";
import { useRouter } from "expo-router";

export default function IzinPage() {
  const router = useRouter();
  const [tanggal, setTanggal] = useState("");
  const [alasan, setAlasan] = useState("");
  const [lampiran, setLampiran] = useState(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setLampiran(result.assets[0].uri);
    }
  }

  async function submit() {
    if (!tanggal) {
      Alert.alert("Validasi", "Tanggal izin wajib diisi");
      return;
    }

    if (!alasan.trim()) {
      Alert.alert("Validasi", "Alasan izin wajib diisi");
      return;
    }

    try {
      setLoading(true);

      let lampiranPath = null;

      if (lampiran) {
        const up = await apiUploadPengajuan(lampiran);
        lampiranPath = up?.file?.path || null;
      }

      await apiPengajuanCreate({
        jenis: "IZIN",
        tanggal,
        alasan: alasan.trim(),
        lampiran_path: lampiranPath,
      });

      Alert.alert("Berhasil", "Pengajuan izin berhasil dikirim");
      router.back();
    } catch (e) {
      Alert.alert("Gagal", e?.message || "Gagal mengirim pengajuan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ajukan Izin</Text>

      <Text style={styles.label}>Tanggal</Text>
      <TextInput
        value={tanggal}
        onChangeText={setTanggal}
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />

      <Text style={styles.label}>Alasan</Text>
      <TextInput
        value={alasan}
        onChangeText={setAlasan}
        placeholder="Tulis alasan izin"
        multiline
        style={[styles.input, styles.textarea]}
      />

      <Pressable style={styles.secondaryBtn} onPress={pickImage}>
        <Text style={styles.secondaryBtnText}>Pilih Lampiran</Text>
      </Pressable>

      {lampiran ? <Image source={{ uri: lampiran }} style={styles.preview} /> : null}

      <Pressable
        style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Kirim Izin</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
  label: { fontWeight: "700", color: theme.colors.text, marginTop: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 14,
    padding: 14,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  secondaryBtn: {
    marginTop: 8,
    backgroundColor: theme.colors.primarySoft,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginTop: 10,
  },
});