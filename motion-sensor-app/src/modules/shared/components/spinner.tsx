import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const ROTATION_MS = 800;

type SpinnerProps = {
  size?: number;
  color?: string;
};

export function Spinner({ size = 20, color = "#ffffff" }: SpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: ROTATION_MS, easing: Easing.linear }),
      -1
    );
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <HugeiconsIcon icon={Loading03Icon} size={size} color={color} />
    </Animated.View>
  );
}
