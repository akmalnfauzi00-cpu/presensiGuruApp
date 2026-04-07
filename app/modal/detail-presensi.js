import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function DetailPresensi() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <View style={{ flex: 1, padding: 24, gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Detail Presensi</Text>

      <View style={{ borderWidth: 1, borderRadius: 10, padding: 12, gap: 6 }}>
        <Text><Text style={{ fontWeight: "700" }}>Tanggal:</Text> {params.tanggal}</Text>
        <Text><Text style={{ fontWeight: "700" }}>Masuk:</Text> {params.masuk}</Text>
        <Text><Text style={{ fontWeight: "700" }}>Pulang:</Text> {params.pulang}</Text>
        <Text><Text style={{ fontWeight: "700" }}>Status:</Text> {params.status}</Text>
      </View>

      <Pressable
        onPress={() => router.back()}
        style={{ padding: 14, borderWidth: 1, borderRadius: 10, alignItems: "center" }}
      >
        <Text>Tutup</Text>
      </Pressable>
    </View>
  );
}
