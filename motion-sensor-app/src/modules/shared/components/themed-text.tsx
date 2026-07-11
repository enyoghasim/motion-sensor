import { Text, type TextProps } from "react-native";
import { cn } from "../lib/util";

export type ThemedTextVariant = "title" | "subtitle" | "lg" | "md" | "sm" | "xs";
export type ThemedTextWeight = "regular" | "medium" | "semibold" | "bold";

const fontFamilies: Record<ThemedTextWeight, string> = {
  regular: "Google Sans",
  medium: "Google Sans Medium",
  semibold: "Google Sans SemiBold",
  bold: "Google Sans Bold",
};

const variantSizes: Record<
  ThemedTextVariant,
  { fontSize: number; lineHeight: number; weight: ThemedTextWeight }
> = {
  title: { fontSize: 36, lineHeight: 40, weight: "bold" },
  subtitle: { fontSize: 30, lineHeight: 36, weight: "bold" },
  lg: { fontSize: 18, lineHeight: 28, weight: "regular" },
  md: { fontSize: 16, lineHeight: 24, weight: "regular" },
  sm: { fontSize: 14, lineHeight: 20, weight: "regular" },
  xs: { fontSize: 12, lineHeight: 16, weight: "regular" },
};

export type ThemedTextProps = TextProps & {
  /** Sets font size, line height and default weight. Omit to size purely via `className`. */
  variant?: ThemedTextVariant;
  /** Overrides the variant's default weight. */
  weight?: ThemedTextWeight;
  className?: string;
};

export function ThemedText({ variant, weight, className, style, ...props }: ThemedTextProps) {
  const preset = variant ? variantSizes[variant] : undefined;
  const fontFamily = fontFamilies[weight ?? preset?.weight ?? "regular"];

  return (
    <Text
      style={[
        preset
          ? { fontFamily, fontSize: preset.fontSize, lineHeight: preset.lineHeight }
          : { fontFamily },
        style,
      ]}
      className={cn("text-white", className)}
      {...props}
    />
  );
}
