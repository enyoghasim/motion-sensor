import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useCallback, useRef, useState } from "react";
import { FlatList, FlatListProps, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { Spinner } from "./spinner";
import { ThemedText } from "./themed-text";

const HEADER_HEIGHT = 76;
const PULL_THRESHOLD = 64;
const MAX_PULL = 110;
const LOADING_PULL = HEADER_HEIGHT + 8;
const ICON_SIZE = 16;

type PullPhase = "idle" | "release" | "loading";

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList,
) as unknown as typeof FlatList;

function formatLastUpdated(date: Date) {
  const datePart = date.toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `Last updated: ${datePart}, ${timePart}`;
}

function ArrowOrSpinner({
  pull,
  phase,
}: {
  pull: SharedValue<number>;
  phase: PullPhase;
}) {
  const arrowStyle = useAnimatedStyle(() => {
    const rotation =
      phase === "idle"
        ? interpolate(
            pull.value,
            [0, PULL_THRESHOLD],
            [0, 180],
            Extrapolation.CLAMP,
          )
        : 180;
    return {
      opacity: withTiming(phase === "loading" ? 0 : 1, { duration: 120 }),
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(phase === "loading" ? 1 : 0, { duration: 120 }),
  }));

  return (
    <View style={{ height: ICON_SIZE, width: ICON_SIZE }}>
      <Animated.View style={[{ position: "absolute" }, arrowStyle]}>
        <HugeiconsIcon icon={ArrowDown01Icon} size={ICON_SIZE} color="#a1a1aa" />
      </Animated.View>
      <Animated.View style={[{ position: "absolute" }, spinnerStyle]}>
        <Spinner size={ICON_SIZE} color="#a1a1aa" />
      </Animated.View>
    </View>
  );
}

function PullToRefreshHeader({
  pull,
  phase,
  lastUpdated,
}: {
  pull: SharedValue<number>;
  phase: PullPhase;
  lastUpdated: Date | null;
}) {
  const label =
    phase === "loading"
      ? "Loading"
      : phase === "release"
        ? "Release to refresh"
        : "Pull down to refresh";

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_HEIGHT,
      }}
      className="items-center justify-end pb-4"
    >
      <View className="flex-row items-center gap-2">
        <ArrowOrSpinner pull={pull} phase={phase} />
        <ThemedText variant="sm" className="text-zinc-400">
          {label}
        </ThemedText>
      </View>
      {lastUpdated && (
        <ThemedText variant="xs" className="mt-1 text-zinc-500">
          {formatLastUpdated(lastUpdated)}
        </ThemedText>
      )}
    </View>
  );
}

type PullToRefreshListProps<T> = Omit<
  FlatListProps<T>,
  "onScroll" | "refreshControl"
> & {
  onRefresh: () => Promise<unknown> | unknown;
  lastUpdated?: Date | null;
};

export function PullToRefreshList<T>({
  onRefresh,
  lastUpdated = null,
  ...flatListProps
}: PullToRefreshListProps<T>) {
  const scrollY = useSharedValue(0);
  const pull = useSharedValue(0);
  const phaseValue = useSharedValue<PullPhase>("idle");
  const [phase, setPhase] = useState<PullPhase>("idle");
  const listRef = useRef<FlatList<T>>(null);

  useAnimatedReaction(
    () => phaseValue.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setPhase)(current);
      }
    },
  );

  const finishRefresh = useCallback(() => {
    phaseValue.value = "idle";
    pull.value = withTiming(0, { duration: 200 });
  }, [phaseValue, pull]);

  const triggerRefresh = useCallback(async () => {
    try {
      await onRefresh();
    } finally {
      finishRefresh();
    }
  }, [onRefresh, finishRefresh]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-20, 20])
    .onUpdate((event) => {
      if (phaseValue.value === "loading") return;
      if (scrollY.value > 0.5 || event.translationY <= 0) {
        pull.value = 0;
        phaseValue.value = "idle";
        return;
      }
      const distance = event.translationY;
      pull.value =
        distance < MAX_PULL ? distance : MAX_PULL + (distance - MAX_PULL) * 0.2;
      phaseValue.value = pull.value >= PULL_THRESHOLD ? "release" : "idle";
    })
    .onEnd(() => {
      if (phaseValue.value === "release") {
        phaseValue.value = "loading";
        pull.value = withTiming(LOADING_PULL, { duration: 150 });
        runOnJS(triggerRefresh)();
      } else if (phaseValue.value !== "loading") {
        pull.value = withTiming(0, { duration: 200 });
      }
    });

  const nativeGesture = Gesture.Native();
  const composedGesture = Gesture.Simultaneous(panGesture, nativeGesture);

  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pull.value }],
  }));

  return (
    <View style={{ flex: 1 }}>
      <PullToRefreshHeader pull={pull} phase={phase} lastUpdated={lastUpdated} />
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[{ flex: 1, backgroundColor: "#000" }, listStyle]}>
          <AnimatedFlatList
            ref={listRef}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            bounces
            {...flatListProps}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
