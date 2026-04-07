import { View, TextInput, Text } from "react-native";
import { theme } from "../theme";

export default function AppTextInput({ label, right, ...props }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? (
        <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.line,
          borderRadius: theme.radius.lg,
          paddingHorizontal: 14,
          height: 52,
        }}
      >
        <TextInput
          style={{ flex: 1, color: theme.colors.text, fontSize: 15 }}
          placeholderTextColor="#94A3B8"
          {...props}
        />
        {right ? <View style={{ marginLeft: 10 }}>{right}</View> : null}
      </View>
    </View>
  );
}
