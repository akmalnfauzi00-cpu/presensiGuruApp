import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiPengajuanList } from "../../src/api/pengajuan";
import { theme } from "../../src/ui/theme";

export default function RiwayatPengajuanPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const res = await apiPengajuanList();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.id_pengajuan}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
      ListEmptyComponent={<Text style={styles.empty}>Belum ada pengajuan</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>
            {item.jenis} • {item.tanggal}
          </Text>
          <Text style={styles.status}>Status: {item.status_verifikasi}</Text>
          <Text style={styles.desc}>{item.alasan}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 16, gap: 12 },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.bg,
  },
  empty: {
    textAlign: "center",
    color: theme.colors.muted,
    marginTop: 30,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  status: {
    marginTop: 6,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  desc: {
    marginTop: 8,
    color: theme.colors.muted,
    lineHeight: 20,
  },
});