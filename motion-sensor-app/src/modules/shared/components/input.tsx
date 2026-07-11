import { forwardRef } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { cn } from "../lib/util";

type InputVariant = "light" | "outline-light" | "outline-dark";
type InputSize = "sm" | "md" | "lg";

type InputProps = {
  label?: string;
  error?: string;
  variant?: InputVariant;
  size?: InputSize;
  containerClassName?: string;
} & TextInputProps;

const sizeStyles: Record<InputSize, string> = {
  sm: "px-4 py-3",
  md: "px-6 py-4",
  lg: "px-8 py-5",
};

const textSizeStyles: Record<InputSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
};

const variantStyles: Record<InputVariant, string> = {
  light: "bg-white",
  "outline-light": "bg-transparent border border-black",
  "outline-dark": "bg-transparent border border-white",
};

const textVariantStyles: Record<InputVariant, string> = {
  light: "text-black",
  "outline-light": "text-black",
  "outline-dark": "text-white",
};

const placeholderVariantColors: Record<InputVariant, string> = {
  light: "#71717a",
  "outline-light": "#71717a",
  "outline-dark": "#a1a1aa",
};

const labelVariantStyles: Record<InputVariant, string> = {
  light: "text-black",
  "outline-light": "text-black",
  "outline-dark": "text-white",
};

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      variant = "outline-dark",
      size = "md",
      containerClassName,
      className,
      placeholderTextColor,
      ...textInputProps
    },
    ref,
  ) => {
    return (
      <View className={cn("gap-2", containerClassName)}>
        {label && (
          <Text
            className={cn(
              "font-google-sans-medium text-sm",
              labelVariantStyles[variant],
            )}
          >
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={
            placeholderTextColor ?? placeholderVariantColors[variant]
          }
          {...textInputProps}
          className={cn(
            "rounded-lg font-google-sans",
            sizeStyles[size],
            textSizeStyles[size],
            variantStyles[variant],
            textVariantStyles[variant],
            error && "border border-red-500",
            className,
          )}
        />
        {error && (
          <Text className="font-google-sans text-xs text-red-500">
            {error}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
