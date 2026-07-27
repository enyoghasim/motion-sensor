import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

type RadarScannerProps = {
  size?: number;
};

const SWEEP_DURATION_MS = 4000;
const SWEEP_ANGLE_DEG = 55;

const RIPPLE_COUNT = 3;
const RIPPLE_DURATION_MS = 3000;
const RIPPLE_MAX_SCALE = 0.82;

const PHONE_WIDTH = 64;
const PHONE_HEIGHT = 128;
const PHONE_OVERHANG = PHONE_HEIGHT / 2;

// react-native-svg doesn't take layout classes reliably, so every overlay
// layer is pinned with an explicit absolute style instead of `absolute inset-0`.
const layerStyle = (size: number) =>
  ({ position: "absolute", top: 0, left: 0, width: size, height: size }) as const;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RippleRingProps = {
  center: number;
  maxR: number;
  delayMs: number;
};

const RippleRing = ({ center, maxR, delayMs }: RippleRingProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withRepeat(
        withTiming(1, { duration: RIPPLE_DURATION_MS, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    }, delayMs);
    return () => clearTimeout(timer);
  }, [progress, delayMs]);

  const animatedProps = useAnimatedProps(() => ({
    r: progress.value * maxR * RIPPLE_MAX_SCALE,
    opacity: (1 - progress.value) * 0.6,
  }));

  return (
    <AnimatedCircle
      cx={center}
      cy={center}
      stroke="#3b82f6"
      strokeWidth={1.5}
      fill="none"
      animatedProps={animatedProps}
    />
  );
};

export const RadarScanner = ({ size = 260 }: RadarScannerProps) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: SWEEP_DURATION_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedSweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const center = size / 2;
  const maxR = size / 2 - 4;
  const sweepRad = (SWEEP_ANGLE_DEG * Math.PI) / 180;
  const sweepEndX = center + maxR * Math.cos(sweepRad);
  const sweepEndY = center - maxR * Math.sin(sweepRad);

  return (
    // Height includes the phone's bottom overhang so the component reserves
    // its true visual footprint in the layout instead of overlapping siblings.
    <View style={{ width: size, height: size + PHONE_OVERHANG }}>
      <View style={layerStyle(size)} className="overflow-hidden rounded-full">
        <Svg width={size} height={size}>
          <Circle cx={center} cy={center} r={maxR} stroke="#1e3a8a" strokeWidth={1.5} opacity={0.4} fill="none" />
          {Array.from({ length: RIPPLE_COUNT }, (_, index) => (
            <RippleRing
              key={index}
              center={center}
              maxR={maxR}
              delayMs={(index * RIPPLE_DURATION_MS) / RIPPLE_COUNT}
            />
          ))}
        </Svg>

        <Animated.View style={[layerStyle(size), animatedSweepStyle]}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="radarArcGradient" x1="100%" y1="50%" x2="0%" y2="50%">
                <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
                <Stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Narrow beam sector, sweeping clockwise from the 3 o'clock position */}
            <Path
              d={`M ${center} ${center} L ${center + maxR} ${center} A ${maxR} ${maxR} 0 0 0 ${sweepEndX} ${sweepEndY} Z`}
              fill="url(#radarArcGradient)"
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Perched on the bottom edge, half inside the scan circle, half hanging below it */}
      <View
        style={{
          position: "absolute",
          top: size - PHONE_OVERHANG,
          left: center - PHONE_WIDTH / 2,
          width: PHONE_WIDTH,
          height: PHONE_HEIGHT,
        }}
        className="rounded-2xl border-2 border-zinc-600 bg-zinc-950"
      />
    </View>
  );
};
