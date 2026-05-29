import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",
        
        // --- DI BAGIAN INI KITA UBAH BIAR NAIK ---
        tabBarStyle: {
          paddingBottom: 22,    // Diperbesar dari 5 ke 22 agar teks naik di atas tombol HP
          paddingTop: 10,       // Diperbesar dari 5 ke 10 agar ikon tidak terlalu mepet ke atas
          height: 80,           // Dinaikkan dari 60 ke 80 sebagai ruang ganjalan bawah
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          backgroundColor: "#FFFFFF",
        },
        
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        }
      }}
    >
      <Tabs.Screen 
        name="beranda" 
        options={{ 
          title: "Beranda",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="pengumuman" 
        options={{ 
          title: "Pengumuman",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "megaphone" : "megaphone-outline"} size={26} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="profil" 
        options={{ 
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          )
        }} 
      />

      {/* Trik menyembunyikan halaman riwayat dari Bottom Tab 
        tapi halamannya tetap bisa dibuka dari tombol Beranda
      */}
      <Tabs.Screen 
        name="riwayat" 
        options={{ 
          href: null, 
        }} 
      />
      
    </Tabs>
  );
}