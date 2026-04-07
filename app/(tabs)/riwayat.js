import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { useFocusEffect } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getToken } from "../../src/utils/storage";

import { apiPresensiRiwayat } from "../../src/api/presensi";
import { apiRewardSpMe, apiRewardSpDownloadUrl } from "../../src/api/rewardsp";
import { getApiBaseUrl } from "../../src/api/http";

const TABS = ["Presensi", "Reward", "SP"];
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function badgeStyle(status) {
  switch (status) {
    case "HADIR":
      return { bg: "#DCFCE7", color: "#166534", text: "Hadir" };
    case "IZIN":
      return { bg: "#DBEAFE", color: "#1D4ED8", text: "Izin" };
    case "SAKIT":
      return { bg: "#FEF3C7", color: "#92400E", text: "Sakit" };
    case "TIDAK_HADIR":
      return { bg: "#FEE2E2", color: "#B91C1C", text: "Tidak Hadir" };
    case "BELUM_TERJADI":
      return { bg: "#E0F2FE", color: "#0369A1", text: "Belum Terjadi" };
    default:
      return { bg: "#E2E8F0", color: "#334155", text: status || "-" };
  }
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isFutureDate(dateString) {
  if (!dateString) return false;

  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [y, m, d] = String(dateString).split("-").map(Number);
  const itemDate = new Date(y, (m || 1) - 1, d || 1);

  return itemDate > todayOnly;
}

function PickerModal({
  visible,
  title,
  items,
  selectedValue,
  onSelect,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(15,23,42,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 18,
            maxHeight: "65%",
          }}
        >
          <View
            style={{
              width: 46,
              height: 5,
              borderRadius: 999,
              backgroundColor: "#CBD5E1",
              alignSelf: "center",
              marginBottom: 14,
            }}
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#0F172A",
              marginBottom: 14,
              textAlign: "center",
            }}
          >
            {title}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const active = String(item.value) === String(selectedValue);

              return (
                <Pressable
                  key={String(item.value)}
                  onPress={() => onSelect(item.value)}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: active ? "#DBEAFE" : "#F8FAFC",
                    borderWidth: 1,
                    borderColor: active ? "#93C5FD" : "#E2E8F0",
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#1D4ED8" : "#334155",
                      fontWeight: "700",
                      fontSize: 15,
                      textAlign: "center",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 6,
              backgroundColor: "#2563EB",
              paddingVertical: 13,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Tutup</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function Riwayat() {
  const now = new Date();

  const [tab, setTab] = useState("Presensi");
  const [filterMode, setFilterMode] = useState("bulanan");

  const [selectedDate, setSelectedDate] = useState(now);
  const [tanggal, setTanggal] = useState(formatDate(now));
  const [bulan, setBulan] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);

  const [items, setItems] = useState([]);
  const [rewardData, setRewardData] = useState(null);

  const monthOptions = useMemo(
    () =>
      MONTH_NAMES.map((label, index) => ({
        label,
        value: String(index + 1).padStart(2, "0"),
      })),
    []
  );

  const load = useCallback(async () => {
    try {
      let res;

      if (filterMode === "harian") {
        res = await apiPresensiRiwayat({
          mode: "harian",
          tanggal,
        });
      } else {
        res = await apiPresensiRiwayat({
          mode: "bulanan",
          bulan,
          tahun,
        });
      }

      setItems(res?.items || []);

      const periode = `${tahun}-${bulan}`;
      const rs = await apiRewardSpMe(periode);
      setRewardData(rs || null);

      setShowDatePicker(false);
    } catch {
      Alert.alert("Gagal", "Gagal memuat data");
    }
  }, [filterMode, tanggal, bulan, tahun]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (filterMode === "harian") {
      load();
    }
  }, [filterMode, tanggal, load]);

  useEffect(() => {
    if (
      filterMode === "bulanan" &&
      /^\d{2}$/.test(bulan) &&
      /^\d{4}$/.test(tahun)
    ) {
      load();
    }
  }, [filterMode, bulan, tahun, load]);

const openProtectedPdf = useCallback(async (idDokumen) => {
  try {
    const token = await getToken();

    if (!token) {
      Alert.alert("Gagal", "Token login tidak ditemukan. Silakan login ulang.");
      return;
    }

    const relative = apiRewardSpDownloadUrl(idDokumen, token);
    const baseURL = (await getApiBaseUrl()).replace(/\/$/, "");

    if (!baseURL) {
      Alert.alert("Gagal", "Base URL API tidak ditemukan");
      return;
    }

    const cleanRelative = relative.startsWith("/") ? relative : `/${relative}`;
    const url = `${baseURL}${cleanRelative}`;

    await Linking.openURL(url);
  } catch {
    Alert.alert("Gagal", "Tidak bisa membuka dokumen");
  }
}, []);

  const filtered = useMemo(() => {
    if (tab === "Presensi") {
      if (filterMode === "bulanan") {
        return items.filter((it) => !isFutureDate(it.tanggal));
      }
      return items;
    }

    if (tab === "Reward") return rewardData?.reward?.dokumen ?? [];
    if (tab === "SP") return rewardData?.sp?.dokumen ?? [];
    return [];
  }, [tab, items, rewardData, filterMode]);

  const onChangeDate = (_, pickedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (pickedDate) {
      setSelectedDate(pickedDate);
      const formatted = formatDate(pickedDate);
      setTanggal(formatted);
      setBulan(String(pickedDate.getMonth() + 1).padStart(2, "0"));
      setTahun(String(pickedDate.getFullYear()));
    }
  };

  const handleOpenDatePicker = () => {
    setShowDatePicker((prev) => !prev);
  };

  const handleChangeYear = (value) => {
    const onlyDigits = value.replace(/\D/g, "").slice(0, 4);
    setTahun(onlyDigits);
  };

  const bulanLabel =
    MONTH_NAMES[Math.max(0, parseInt(bulan, 10) - 1)] || bulan;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F8FAFC" }}
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 14,
            color: "#0F172A",
          }}
        >
          Riwayat & Reward/SP
        </Text>

        <View style={{ flexDirection: "row", marginBottom: 16, gap: 8 }}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 18,
                alignItems: "center",
                backgroundColor: tab === t ? "#DBEAFE" : "#F1F5F9",
              }}
            >
              <Text
                style={{
                  fontWeight: "800",
                  color: tab === t ? "#2563EB" : "#475569",
                }}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "Presensi" && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 22,
              padding: 14,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              <Pressable
                onPress={() => {
                  setFilterMode("harian");
                  setShowDatePicker(false);
                }}
                style={{
                  flex: 1,
                  backgroundColor: filterMode === "harian" ? "#2563EB" : "#F1F5F9",
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: filterMode === "harian" ? "#fff" : "#334155",
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  Harian
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setFilterMode("bulanan");
                  setShowDatePicker(false);
                }}
                style={{
                  flex: 1,
                  backgroundColor: filterMode === "bulanan" ? "#2563EB" : "#F1F5F9",
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: filterMode === "bulanan" ? "#fff" : "#334155",
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  Bulanan
                </Text>
              </Pressable>
            </View>

            {filterMode === "harian" ? (
              <View>
                <Text
                  style={{
                    marginBottom: 6,
                    color: "#334155",
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  Tanggal
                </Text>

                <Pressable
                  onPress={handleOpenDatePicker}
                  style={{
                    borderWidth: 1,
                    borderColor: "#BFDBFE",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    backgroundColor: "#EFF6FF",
                  }}
                >
                  <Text
                    style={{
                      color: "#0F172A",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    {tanggal}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleOpenDatePicker}
                  style={{
                    marginTop: 10,
                    backgroundColor: showDatePicker ? "#DBEAFE" : "#EFF6FF",
                    borderWidth: 1,
                    borderColor: showDatePicker ? "#60A5FA" : "#BFDBFE",
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#2563EB",
                      fontWeight: "700",
                    }}
                  >
                    {showDatePicker ? "Tutup Kalender" : "Ubah Tanggal"}
                  </Text>
                </Pressable>

                {showDatePicker && (
                  <View
                    style={{
                      marginTop: 12,
                      backgroundColor: "#DBEAFE",
                      borderRadius: 18,
                      padding: 8,
                      borderWidth: 1,
                      borderColor: "#93C5FD",
                      overflow: "hidden",
                      alignSelf: "stretch",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#EFF6FF",
                        borderRadius: 16,
                        overflow: "hidden",
                      }}
                    >
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === "ios" ? "inline" : "calendar"}
                        onChange={onChangeDate}
                        accentColor="#2563EB"
                      />
                    </View>
                  </View>
                )}

                <Text
                  style={{
                    textAlign: "center",
                    marginTop: 12,
                    fontWeight: "700",
                    color: "#334155",
                  }}
                >
                  Tanggal dipilih: {tanggal}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View>
                  <Text
                    style={{
                      marginBottom: 6,
                      color: "#334155",
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    Bulan
                  </Text>

                  <Pressable
                    onPress={() => setShowMonthModal(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#BFDBFE",
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      backgroundColor: "#EFF6FF",
                    }}
                  >
                    <Text
                      style={{
                        color: "#0F172A",
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {bulanLabel}
                    </Text>
                  </Pressable>
                </View>

                <View>
                  <Text
                    style={{
                      marginBottom: 6,
                      color: "#334155",
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    Tahun
                  </Text>

                  <TextInput
                    value={tahun}
                    onChangeText={handleChangeYear}
                    placeholder="2026"
                    keyboardType="number-pad"
                    maxLength={4}
                    style={{
                      borderWidth: 1,
                      borderColor: "#BFDBFE",
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      backgroundColor: "#EFF6FF",
                      color: "#0F172A",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {(tab === "Reward" || tab === "SP") && rewardData && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 22,
              padding: 14,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: "#0F172A",
                marginBottom: 8,
              }}
            >
              Statistik Periode {rewardData?.periode || "-"}
            </Text>

            <Text style={{ color: "#334155", marginBottom: 4 }}>
              Hadir: {rewardData?.statistik?.hadir ?? 0} hari
            </Text>

            <Text style={{ color: "#334155", marginBottom: 4 }}>
              Tidak Hadir: {rewardData?.statistik?.tidak_hadir ?? 0} hari
            </Text>

            <Text style={{ color: "#334155", marginBottom: 4 }}>
              Izin: {rewardData?.statistik?.izin ?? 0} hari
            </Text>

            <Text style={{ color: "#334155", marginBottom: 4 }}>
              Sakit: {rewardData?.statistik?.sakit ?? 0} hari
            </Text>

            <Text style={{ color: "#334155", marginBottom: 4 }}>
  Total Hari Kerja Bulan Ini: {rewardData?.statistik?.total_hari_kerja ?? rewardData?.statistik?.total_hari ?? 0} hari
</Text>

            {tab === "Reward" ? (
              <Text
                style={{
                  color: rewardData?.reward?.eligible ? "#166534" : "#B45309",
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {rewardData?.reward?.eligible
                  ? `Memenuhi syarat reward (minimal hadir ${rewardData?.setting?.minimal_hadir_reward ?? 0} hari)`
                  : `Belum memenuhi reward (minimal hadir ${rewardData?.setting?.minimal_hadir_reward ?? 0} hari)`}
              </Text>
            ) : (
              <Text
                style={{
                  color: rewardData?.sp?.eligible ? "#B91C1C" : "#166534",
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {rewardData?.sp?.eligible
                  ? `Terkena SP (minimal tidak hadir ${rewardData?.setting?.minimal_tidak_hadir_sp ?? 0} hari)`
                  : "Belum terkena SP"}
              </Text>
            )}
          </View>
        )}

        {filtered.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              marginTop: 60,
              color: "#64748B",
              fontWeight: "700",
            }}
          >
            Belum ada data
          </Text>
        ) : tab === "Presensi" ? (
          filtered.map((it, idx) => {
            const badge = badgeStyle(it.status);

            return (
              <View
                key={it.id_detail || `${it.tanggal}-${idx}`}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 22,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      fontSize: 16,
                      color: "#0F172A",
                      flex: 1,
                    }}
                  >
                    {it.tanggal}
                  </Text>

                  <View
                    style={{
                      backgroundColor: badge.bg,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                    }}
                  >
                    <Text
                      style={{
                        color: badge.color,
                        fontWeight: "800",
                        fontSize: 12,
                      }}
                    >
                      {badge.text}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 12, gap: 4 }}>
                  <Text style={{ color: "#334155", fontSize: 15 }}>
                    Masuk: {it.jam_masuk || "-"}
                  </Text>

                  <Text style={{ color: "#334155", fontSize: 15 }}>
                    Pulang: {it.jam_pulang || "-"}
                  </Text>

                  {it.status === "HADIR" && it.is_terlambat === 1 && (
                    <Text style={{ color: "#B45309", fontWeight: "700" }}>
                      Terlambat
                    </Text>
                  )}

                  {it.status === "TIDAK_HADIR" && (
                    <Text style={{ color: "#B91C1C" }}>
                      Tidak ada presensi pada tanggal ini
                    </Text>
                  )}

                  {it.status === "BELUM_TERJADI" && filterMode === "harian" && (
                    <Text style={{ color: "#64748B" }}>
                      Tanggal ini belum berlangsung
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          filtered.map((doc, idx) => (
            <View
              key={doc.id_dokumen || `${doc.periode}-${idx}`}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 22,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 16,
                  color: "#0F172A",
                }}
              >
                {doc.jenis} • {doc.periode}
              </Text>

              <Text style={{ color: "#475569", marginTop: 6 }}>
                {doc.deskripsi || "Dokumen tersedia"}
              </Text>

              <Text style={{ color: "#64748B", marginTop: 4 }}>
                Status:{" "}
                {doc.status_unduh === "SUDAH_DIUNDUH"
                  ? "Sudah diunduh"
                  : "Belum diunduh"}
              </Text>

              <Pressable
                onPress={() => openProtectedPdf(doc.id_dokumen)}
                style={{
                  marginTop: 12,
                  backgroundColor: "#2563EB",
                  paddingVertical: 11,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  Unduh PDF
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <PickerModal
        visible={showMonthModal}
        title="Pilih Bulan"
        items={monthOptions}
        selectedValue={bulan}
        onSelect={(value) => {
          setBulan(value);
          setShowMonthModal(false);
        }}
        onClose={() => setShowMonthModal(false)}
      />
    </>
  );
}