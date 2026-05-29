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
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { api } from "../../src/api/http"; 
import { useRouter } from "expo-router";
import { getToken } from "../../src/utils/storage";

export default function AjukanSakit() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [lampiran, setLampiran] = useState(null);

  // State untuk Logika Tanggal
  const [range, setRange] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const themeColor = "#2563EB"; 
  const rangeColor = "#DBEAFE"; 

  const onDayPress = (day) => {
    const dateString = day.dateString;

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateString);
      setEndDate("");
      setRange({
        [dateString]: { 
          startingDay: true, 
          endingDay: true, 
          color: themeColor, 
          textColor: "white" 
        },
      });
    } 
    else if (dateString === startDate) {
      setEndDate(startDate);
      setRange({
        [startDate]: { 
          startingDay: true, 
          endingDay: true, 
          color: themeColor, 
          textColor: "white" 
        },
      });
    }
    else if (dateString > startDate) {
      setEndDate(dateString);
      let newRange = {};
      let start = new Date(startDate);
      let end = new Date(dateString);

      while (start <= end) {
        let curr = start.toISOString().split("T")[0];
        if (curr === startDate) {
          newRange[curr] = { startingDay: true, color: themeColor, textColor: "white" };
        } else if (curr === dateString) {
          newRange[curr] = { endingDay: true, color: themeColor, textColor: "white" };
        } else {
          newRange[curr] = { color: rangeColor, textColor: "#1E3A8A" };
        }
        start.setDate(start.getDate() + 1);
      }
      setRange(newRange);
    } 
    else {
      setStartDate(dateString);
      setEndDate("");
      setRange({
        [dateString]: { 
          startingDay: true, 
          endingDay: true, 
          color: themeColor, 
          textColor: "white" 
        },
      });
    }
  };

  const onSelectLampiran = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (!result.canceled) {
        setLampiran(result.assets[0]);
      }
    } catch (err) {
      console.error("Picker Error: ", err);
      Alert.alert("Error", "Gagal memilih file");
    }
  };

  const handleSubmit = async () => {
    if (!startDate) return Alert.alert("Peringatan", "Pilih tanggal mulai sakit");
    if (!alasan) return Alert.alert("Peringatan", "Berikan keterangan sakit (misal: Demam)");

    setLoading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("jenis", "SAKIT"); 
      formData.append("tanggal_mulai", startDate);
      formData.append("tanggal_selesai", endDate || startDate);
      formData.append("alasan", alasan);

      if (token) formData.append("api_token", token);

      if (lampiran) {
        const fileUri = Platform.OS === "android" ? lampiran.uri : lampiran.uri.replace("file://", "");
        formData.append("lampiran", {
          uri: fileUri,
          name: lampiran.name || "surat_dokter.jpg",
          type: lampiran.mimeType || "application/octet-stream",
        });
      }

      const response = await api.post("/pengajuan/store", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
      });

      Alert.alert("Berhasil", response.data?.message || "Surat keterangan sakit berhasil dikirim.");
      router.back();
    } catch (err) {
      console.log("SERVER ERROR SAKIT:", err.response?.data);
      
      const serverMessage = err.response?.data?.message;
      if (serverMessage) {
        // Tampilkan pesan batasan dari PHP (Maksimal pengajuan, dll)
        Alert.alert("Gagal Kirim", serverMessage);
      } else {
        Alert.alert("Koneksi Bermasalah", "Gagal terhubung ke server. Pastikan database admin sudah diperbarui.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Ajukan Sakit</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pilih Tanggal Sakit</Text>
        
        <View style={styles.calendarWrapper}>
          <Calendar
            markingType={"period"}
            markedDates={range}
            onDayPress={onDayPress}
            theme={{
              todayTextColor: themeColor,
              arrowColor: themeColor,
              textDayFontWeight: "600",
              textMonthFontWeight: "800",
              textDayHeaderFontWeight: "600",
            }}
          />
        </View>

        <View style={styles.infoRange}>
           <Ionicons name="medical" size={16} color={themeColor} />
           <Text style={styles.rangeText}>
             {startDate ? startDate : "..."} {endDate && endDate !== startDate ? `➔ ${endDate}` : startDate ? "(1 Hari)" : ""}
           </Text>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Keterangan Sakit</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Contoh: Sakit tipes, butuh istirahat total..."
          multiline
          value={alasan}
          onChangeText={setAlasan}
        />

        <Text style={[styles.label, { marginTop: 20 }]}>Surat Keterangan Dokter</Text>
        <Pressable style={styles.uploadBtn} onPress={onSelectLampiran}>
          <Ionicons name="medical-outline" size={20} color={themeColor} />
          <Text style={styles.uploadBtnText} numberOfLines={1}>
            {lampiran ? lampiran.name : "Unggah Foto Surat Dokter"}
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Kirim Surat Sakit</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#1E293B", marginBottom: 20, marginTop: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 24, padding: 20, elevation: 2 },
  label: { fontSize: 14, fontWeight: "700", color: "#475569", marginBottom: 12 },
  calendarWrapper: { borderRadius: 15, overflow: "hidden", borderWidth: 1, borderColor: "#F1F5F9" },
  infoRange: { marginTop: 15, padding: 12, backgroundColor: "#F8FAFC", borderRadius: 12, alignItems: "center", flexDirection: 'row', justifyContent: 'center', gap: 8 },
  rangeText: { fontWeight: "700", color: "#2563EB", fontSize: 13 },
  textArea: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 15, height: 100, textAlignVertical: "top", borderWidth: 1, borderColor: "#E2E8F0" },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6FF", borderRadius: 12, padding: 15, borderStyle: "dashed", borderWidth: 1, borderColor: "#DBEAFE" },
  uploadBtnText: { marginLeft: 10, color: "#2563EB", fontWeight: "700", flex: 1, textAlign: 'center' },
  submitBtn: { backgroundColor: "#2563EB", borderRadius: 12, padding: 18, alignItems: "center", marginTop: 25 },
  submitBtnText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
});