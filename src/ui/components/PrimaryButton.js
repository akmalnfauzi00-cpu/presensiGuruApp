import { Pressable, Text } from "react-native";
import { theme } from "../theme";

export default function PrimaryButton({ title, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        height: 54,
        borderRadius: theme.radius.lg,
        backgroundColor: disabled ? "#9DBBFF" : theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
        {title}
      </Text>
    </Pressable>
  );
}
