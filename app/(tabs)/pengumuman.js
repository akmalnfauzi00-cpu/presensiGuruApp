import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, Dimensions, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { apiGetPengumuman } from "../../src/api/pengumuman"; // Pastikan path ini benar

const { height } = Dimensions.get('window');

export default function Pengumuman() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [infoData, setInfoData] = useState([]);

  // Fungsi untuk mengambil data dari API
  const loadData = async () => {
    try {
      const res = await apiGetPengumuman();
      if (res.status === 'success') {
        setInfoData(res.data);
      }
    } catch (error) {
      console.error("Gagal memuat pengumuman:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const bukaDetail = (item) => {
    setSelectedInfo(item);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat informasi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.headerBackground}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.greetingText}>Pusat Informasi</Text>
            <Text style={styles.appNameText}>Pengumuman</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Ionicons name="megaphone" size={22} color="#1E3A8A" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        <View style={styles.listContainer}>
          {infoData.length > 0 ? (
            infoData.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: item.bg || "#EFF6FF" }]}>
                    <Ionicons name={item.icon || "megaphone-outline"} size={20} color={item.color || "#2563EB"} />
                  </View>
                  <View style={styles.dateWrap}>
                    <Ionicons name="time-outline" size={14} color="#94A3B8" />
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                </View>
                
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
                
                <Pressable 
                  style={({ pressed }) => [styles.readMoreBtn, pressed && { opacity: 0.5 }]}
                  onPress={() => bukaDetail(item)}
                >
                  <Text style={[styles.readMoreText, { color: item.color || "#2563EB" }]}>Baca Selengkapnya</Text>
                  <Ionicons name="arrow-forward" size={14} color={item.color || "#2563EB"} />
                </Pressable>
              </View>
            ))
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-off-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>Belum ada pengumuman terbaru.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL POP-UP DETAIL */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            {selectedInfo && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconWrap, { backgroundColor: selectedInfo.bg || "#EFF6FF" }]}>
                    <Ionicons name={selectedInfo.icon || "megaphone-outline"} size={32} color={selectedInfo.color || "#2563EB"} />
                  </View>
                  <View style={styles.modalDateWrap}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.modalDateText}>Diterbitkan: {selectedInfo.date}</Text>
                  </View>
                </View>

                <ScrollView style={styles.modalScrollArea} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>{selectedInfo.title}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.modalBodyText}>{selectedInfo.content}</Text>
                </ScrollView>
              </>
            )}
            <Pressable 
              style={({ pressed }) => [styles.closeBtn, pressed && { backgroundColor: "#E2E8F0" }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Tutup Pengumuman</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  centerWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 10, color: "#64748B", fontWeight: "600" },
  scrollContent: { paddingBottom: 40 },
  headerBackground: { 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    paddingBottom: 24, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
  },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greetingText: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginBottom: 2 },
  appNameText: { fontSize: 24, color: "#FFFFFF", fontWeight: "900", letterSpacing: -0.5 },
  headerIconWrap: { width: 44, height: 44, backgroundColor: "#FFFFFF", borderRadius: 22, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  listContainer: { marginHorizontal: 20, marginTop: 16, gap: 16 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, shadowColor: "#0F172A", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: "#F1F5F9" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  dateWrap: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F8FAFC", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  dateText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  title: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  content: { fontSize: 14, color: "#475569", lineHeight: 22, marginBottom: 16 },
  readMoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 6, paddingRight: 10 },
  readMoreText: { fontSize: 13, fontWeight: "700" },
  emptyWrap: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 16, color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" },
  modalDismissArea: { flex: 1 },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, maxHeight: height * 0.85 },
  modalHandle: { width: 40, height: 5, backgroundColor: "#E2E8F0", borderRadius: 3, alignSelf: "center", marginBottom: 24 },
  modalHeader: { alignItems: "center", marginBottom: 16 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  modalDateWrap: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F1F5F9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  modalDateText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  modalScrollArea: { marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#0F172A", textAlign: "center", marginBottom: 16 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 20 },
  modalBodyText: { fontSize: 15, color: "#334155", lineHeight: 26, textAlign: "justify" },
  closeBtn: { backgroundColor: "#F1F5F9", paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  closeBtnText: { fontSize: 16, fontWeight: "800", color: "#0F172A" }
});