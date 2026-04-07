import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { theme } from "../theme";

export default function StatDonut({ percent = 95, size = 92, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  const dash = (p / 100) * c;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} stroke="#E7EEF8" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke={theme.colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c-dash}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size/2}, ${size/2}`}
        />
      </Svg>
      <Text style={{ position: "absolute", fontWeight: "900", fontSize: 20, color: theme.colors.text }}>
        {p}%
      </Text>
    </View>
  );
}
