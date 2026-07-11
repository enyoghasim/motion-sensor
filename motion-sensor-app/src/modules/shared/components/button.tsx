import { forwardRef } from "react";
import {
  ActivityIndicator,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { cn } from "../lib/util";
import { ThemedText } from "./themed-text";

type ButtonVariant = "light" | "outline-light" | "outline-dark" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  title?: string;
  textClassName?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
} & TouchableOpacityProps;

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-3",
  md: "px-6 py-4",
  lg: "px-8 py-5",
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

const variantStyles: Record<ButtonVariant, string> = {
  light: "bg-white",
  "outline-light": "bg-transparent border border-black",
  "outline-dark": "bg-transparent border border-white",
  danger: "bg-red-500",
};

const textVariantStyles: Record<ButtonVariant, string> = {
  light: "text-black",
  "outline-light": "text-black",
  "outline-dark": "text-white",
  danger: "text-white",
};

const spinnerColors: Record<ButtonVariant, string> = {
  light: "#000000",
  "outline-light": "#000000",
  "outline-dark": "#ffffff",
  danger: "#ffffff",
};

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      title,
      textClassName,
      variant = "light",
      size = "md",
      loading = false,
      disabled,
      className,
      ...touchableProps
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        ref={ref}
        disabled={isDisabled}
        {...touchableProps}
        className={cn(
          "items-center justify-center rounded-lg",
          sizeStyles[size],
          variantStyles[variant],
          isDisabled && "opacity-50",
          className,
        )}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColors[variant]} />
        ) : (
          title && (
            <ThemedText
              weight="semibold"
              className={cn(
                "text-center",
                textSizeStyles[size],
                textVariantStyles[variant],
                textClassName,
              )}
            >
              {title}
            </ThemedText>
          )
        )}
      </TouchableOpacity>
    );
  },
);

Button.displayName = "Button";
