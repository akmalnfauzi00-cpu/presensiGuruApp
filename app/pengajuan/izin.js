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

export default function AjukanIzin() {
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
    if (!startDate) return Alert.alert("Peringatan", "Pilih tanggal di kalender");
    if (!alasan) return Alert.alert("Peringatan", "Alasan wajib diisi");

    setLoading(true);
    try {
      const token = await getToken(); 

      const formData = new FormData();
      formData.append("jenis", "IZIN");
      formData.append("tanggal_mulai", startDate);
      formData.append("tanggal_selesai", endDate || startDate);
      formData.append("alasan", alasan);
      
      if (token) formData.append("api_token", token);

      if (lampiran) {
        const fileUri = Platform.OS === "android" ? lampiran.uri : lampiran.uri.replace("file://", "");
        
        formData.append("lampiran", {
          uri: fileUri,
          name: lampiran.name || "lampiran_bukti",
          type: lampiran.mimeType || "application/octet-stream",
        });
      }

      const response = await api.post("/pengajuan/store", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
      });

      // Berhasil
      Alert.alert("Berhasil", response.data?.message || "Pengajuan berhasil dikirim.");
      router.back();

    } catch (err) {
      // LOGIKA PENANGKAPAN PESAN SERVER
      // console.log mempermudah kita cek di terminal debugger jika terjadi error
      console.log("DEBUG ERROR RESPONSE:", err.response?.data);

      // 1. Cek apakah ada respon JSON dari PHP (seperti message 'Batas Maksimal')
      const messageFromServer = err.response?.data?.message;

      if (messageFromServer) {
        // Tampilkan pesan asli dari PHP
        Alert.alert("Gagal Kirim", messageFromServer);
      } 
      else if (err.request) {
        // Kasus dimana server tidak merespon sama sekali atau PHP Crash (Fatal Error)
        Alert.alert("Koneksi Bermasalah", "Server tidak memberikan respon. Pastikan database sudah terupdate (kolom maks_izin).");
      } 
      else {
        // Kasus error lainnya
        Alert.alert("Error", err.message || "Terjadi kesalahan sistem.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Ajukan Izin</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pilih Tanggal (Klik 2x untuk Rentang)</Text>
        
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
           <Text style={styles.rangeText}>
             {startDate ? startDate : "..."} {endDate ? `➔ ${endDate}` : startDate ? "(1 Hari)" : ""}
           </Text>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Alasan</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Tulis alasan izin..."
          multiline
          value={alasan}
          onChangeText={setAlasan}
        />

        <Text style={[styles.label, { marginTop: 20 }]}>Lampiran Bukti</Text>
        <Pressable style={styles.uploadBtn} onPress={onSelectLampiran}>
          <Ionicons name="attach-outline" size={20} color={themeColor} />
          <Text style={styles.uploadBtnText} numberOfLines={1}>
            {lampiran ? lampiran.name : "Pilih Lampiran"}
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
            <Text style={styles.submitBtnText}>Kirim Izin</Text>
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
  infoRange: { marginTop: 15, padding: 12, backgroundColor: "#F8FAFC", borderRadius: 12, alignItems: "center" },
  rangeText: { fontWeight: "700", color: "#2563EB", fontSize: 13 },
  textArea: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 15, height: 100, textAlignVertical: "top", borderWidth: 1, borderColor: "#E2E8F0" },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6FF", borderRadius: 12, padding: 15, borderStyle: "dashed", borderWidth: 1, borderColor: "#DBEAFE" },
  uploadBtnText: { marginLeft: 10, color: "#2563EB", fontWeight: "700", flex: 1, textAlign: 'center' },
  submitBtn: { backgroundColor: "#2563EB", borderRadius: 12, padding: 18, alignItems: "center", marginTop: 25 },
  submitBtnText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
});