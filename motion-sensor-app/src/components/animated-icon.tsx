import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { OrbitingLogo } from './orbiting-logo';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

type AnimatedSplashOverlayProps = {
  /** Whether whatever the splash is gating on (e.g. the initial auth check) has settled. */
  ready: boolean;
};

export function AnimatedSplashOverlay({ ready }: AnimatedSplashOverlayProps) {
  const [laidOut, setLaidOut] = useState(false);
  const [visible, setVisible] = useState(true);
  // 0 = fully shown, 1 = fully exited. Driven directly rather than via an
  // `entering` transition so the OrbitingLogo underneath never remounts --
  // it keeps orbiting straight through the fade instead of snapping back
  // to its rest frame right as the exit starts.
  const exitProgress = useSharedValue(0);

  // Hide the native splash as soon as we've laid out, regardless of whether
  // the auth check is done -- that way the orbiting logo below is what's
  // actually on screen during the wait, instead of a frozen native splash.
  useEffect(() => {
    if (!laidOut) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [laidOut]);

  useEffect(() => {
    if (!laidOut || !ready) return;
    exitProgress.value = withTiming(1, { duration: DURATION, easing: Easing.elastic(0.7) }, (finished) => {
      'worklet';
      if (finished) {
        scheduleOnRN(setVisible, false);
      }
    });
  }, [laidOut, ready, exitProgress]);

  const exitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(exitProgress.value, [0, 0.2, 0.7, 1], [1, 1, 0, 0]),
  }));

  if (!visible) return null;

  return (
    <View onLayout={() => setLaidOut(true)} style={styles.splashOverlay}>
      <Animated.View style={exitStyle}>
        <OrbitingLogo size={96} />
      </Animated.View>
    </View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 76,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
