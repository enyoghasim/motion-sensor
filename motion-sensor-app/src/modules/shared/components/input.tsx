import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { forwardRef, useState } from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { cn } from "../lib/util";
import { ThemedText } from "./themed-text";

type InputVariant = "dark" | "light";
type InputSize = "sm" | "md" | "lg";

type InputProps = {
  label: string;
  error?: string;
  variant?: InputVariant;
  size?: InputSize;
  containerClassName?: string;
} & TextInputProps;

const sizeStyles: Record<
  InputSize,
  {
    containerHeight: number;
    inputHeight: number;
    fontSize: number;
    scaleFactor: number;
    labelIdleTop: number;
    labelFloatedTop: number;
  }
> = {
  sm: {
    containerHeight: 46,
    inputHeight: 30,
    fontSize: 16,
    scaleFactor: 11 / 14, // Using scale factor instead of floatedFontSize
    labelIdleTop: 23,
    labelFloatedTop: 2,
  },
  md: {
    containerHeight: 56,
    inputHeight: 36,
    fontSize: 18,
    scaleFactor: 12 / 16,
    labelIdleTop: 28,
    labelFloatedTop: 3,
  },
  lg: {
    containerHeight: 64,
    inputHeight: 40,
    fontSize: 20,
    scaleFactor: 13 / 18,
    labelIdleTop: 33,
    labelFloatedTop: 3,
  },
};

const colors: Record<
  InputVariant,
  { text: string; label: string; borderIdle: string; borderFocused: string }
> = {
  dark: {
    text: "#ffffff",
    label: "#a1a1aa",
    borderIdle: "#3f3f46",
    borderFocused: "#ffffff",
  },
  light: {
    text: "#000000",
    label: "#71717a",
    borderIdle: "#d4d4d8",
    borderFocused: "#000000",
  },
};

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      variant = "dark",
      size = "md",
      containerClassName,
      className,
      value,
      placeholder: _placeholder,
      onFocus,
      onBlur,
      secureTextEntry,
      ...textInputProps
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isValueVisible, setIsValueVisible] = useState(false);
    const hasValue = !!value;
    const floated = isFocused || hasValue;
    const isPasswordField = !!secureTextEntry;

    // Derived values calculate the timing immediately during render passes
    const progress = useDerivedValue(() => {
      return withTiming(floated ? 1 : 0, { duration: 150 });
    }, [floated]);

    const borderProgress = useDerivedValue(() => {
      return withTiming(isFocused ? 1 : 0, { duration: 150 });
    }, [isFocused]);

    const {
      containerHeight,
      inputHeight,
      fontSize,
      scaleFactor,
      labelIdleTop,
      labelFloatedTop,
    } = sizeStyles[size];

    const palette = error
      ? { ...colors[variant], borderIdle: "#ef4444", borderFocused: "#ef4444" }
      : colors[variant];

    const iconSize = fontSize;

    const labelAnimatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(progress.value, [0, 1], [1, scaleFactor]);
      // Animate translateY to change positions rather than the layout-heavy 'top' property
      const translateY = interpolate(
        progress.value,
        [0, 1],
        [0, labelFloatedTop - labelIdleTop],
      );

      return {
        transform: [{ translateY }, { scale }],
        transformOrigin: "left center",
      };
    });

    const borderAnimatedStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        borderProgress.value,
        [0, 1],
        [palette.borderIdle, palette.borderFocused],
      ),
      height: interpolate(borderProgress.value, [0, 1], [1, 2]),
    }));

    return (
      <View className={cn("gap-2", containerClassName)}>
        <View style={{ height: containerHeight }} className="relative">
          <Animated.Text
            style={[
              labelAnimatedStyle,
              {
                color: palette.label,
                fontSize,
                top: labelIdleTop, // Base position starts at layout idle top
              },
            ]}
            className="font-google-sans absolute left-0"
          >
            {label}
          </Animated.Text>
          <TextInput
            ref={ref}
            value={value}
            secureTextEntry={isPasswordField && !isValueVisible}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...textInputProps}
            style={{
              position: "absolute",
              left: 0,
              right: isPasswordField ? iconSize + 12 : 0,
              bottom: 0,
              height: inputHeight,
              fontSize,
              color: palette.text,
            }}
            className={cn("font-google-sans", className)}
          />
          {isPasswordField && (
            <Pressable
              onPress={() => setIsValueVisible((visible) => !visible)}
              hitSlop={8}
              className="absolute right-0"
              style={{ bottom: (inputHeight - iconSize) / 2 }}
            >
              <HugeiconsIcon
                icon={isValueVisible ? ViewOffSlashIcon : ViewIcon}
                size={iconSize}
                color={palette.label}
              />
            </Pressable>
          )}
          <Animated.View
            style={borderAnimatedStyle}
            className="absolute bottom-0 left-0 right-0"
          />
        </View>
        {error && (
          <ThemedText variant="sm" className="text-red-500">
            {error}
          </ThemedText>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
