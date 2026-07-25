import { useEffect } from 'react';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

const RING_D =
  'M35.6251 0.5C46.127 0.500027 54.6407 9.01369 54.6407 19.5156C54.6407 30.0175 46.127 38.5312 35.6251 38.5312C25.1232 38.5312 16.6095 30.0175 16.6095 19.5156C16.6095 9.01369 25.1232 0.5 35.6251 0.5ZM35.6251 7.85059C29.1827 7.85059 23.9601 13.0732 23.9601 19.5156C23.9601 25.9581 29.1827 31.1807 35.6251 31.1807C42.0675 31.1806 47.2902 25.958 47.2902 19.5156C47.2902 13.0732 42.0675 7.85061 35.6251 7.85059Z';
const CHIN_D =
  'M35.6251 42.8584C43.8149 42.8584 50.8256 47.9041 53.7203 55.0561H44.0576C42.0106 52.6992 38.9915 51.2089 35.6251 51.2089C32.2583 51.2089 29.2392 52.6992 27.1922 55.0561H17.5295C20.4246 47.9041 27.4348 42.8584 35.6251 42.8584Z';
const SWOOSH_L_D =
  'M12.1977 19.4306C12.1977 27.6205 7.152 34.6311 0 37.5262V27.8631C2.35691 25.8165 3.84718 22.7974 3.84718 19.4306C3.84718 16.0638 2.35691 13.0447 0 10.9981V1.33496C7.152 4.23008 12.1977 11.2407 12.1977 19.4306Z';
const SWOOSH_R_D =
  'M59.0521 19.4306C59.0521 27.6205 64.0978 34.6311 71.2497 37.5262V27.8631C68.8928 25.8165 67.4026 22.7974 67.4026 19.4306C67.4026 16.0638 68.8928 13.0447 71.2497 10.9981V1.33496C64.0978 4.23008 59.0521 11.2407 59.0521 19.4306Z';

// Ring's own center, in the mark's native 72x56 coordinate space. The three
// side pieces sit 90deg apart around this point, like 3 of the 4 corners of
// a square with one corner left empty -- that's the gap that appears to
// "travel" as all three step around it together.
const CENTER = { x: 35.6251, y: 19.5156 };

const MOVE_MS = 650;
const HOLD_MS = 1350;
const EASING = Easing.inOut(Easing.cubic);

const AnimatedG = Animated.createAnimatedComponent(G);

function useOrbitRotation() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(90, { duration: MOVE_MS, easing: EASING }),
        withTiming(90, { duration: HOLD_MS }),
        withTiming(180, { duration: MOVE_MS, easing: EASING }),
        withTiming(180, { duration: HOLD_MS }),
        withTiming(270, { duration: MOVE_MS, easing: EASING }),
        withTiming(270, { duration: HOLD_MS }),
        withTiming(360, { duration: MOVE_MS, easing: EASING }),
        withTiming(360, { duration: HOLD_MS }),
      ),
      -1,
    );
  }, [rotation]);

  return rotation;
}

function OrbitPiece({ d, rotation, fill }: { d: string; rotation: SharedValue<number>; fill: string }) {
  const animatedProps = useAnimatedProps(() => ({
    rotation: rotation.value,
  }));

  return (
    <AnimatedG origin={`${CENTER.x}, ${CENTER.y}`} animatedProps={animatedProps}>
      <Path d={d} fill={fill} />
    </AnimatedG>
  );
}

// The pieces swing out to ~40 units from CENTER while orbiting (further than
// their tight 72x56 rest-position bounding box allows), so the viewBox has to
// be a square generous enough to fit that full swing without clipping.
const VIEW_BOX_HALF = 42;
const VIEW_BOX = `${CENTER.x - VIEW_BOX_HALF} ${CENTER.y - VIEW_BOX_HALF} ${VIEW_BOX_HALF * 2} ${VIEW_BOX_HALF * 2}`;

type OrbitingLogoProps = {
  size?: number;
  color?: string;
};

export function OrbitingLogo({ size = 96, color = '#FFFFFF' }: OrbitingLogoProps) {
  const rotation = useOrbitRotation();

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path d={RING_D} fill={color} />
      <OrbitPiece d={SWOOSH_L_D} rotation={rotation} fill={color} />
      <OrbitPiece d={SWOOSH_R_D} rotation={rotation} fill={color} />
      <OrbitPiece d={CHIN_D} rotation={rotation} fill={color} />
    </Svg>
  );
}
