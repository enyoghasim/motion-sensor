import {
  Home01Icon,
  Sofa01Icon,
  BedDoubleIcon,
  KitchenUtensilsIcon,
  Bathtub01Icon,
  GarageIcon,
  Door01Icon,
  Tree01Icon,
  Car01Icon,
  OfficeIcon,
  Building01Icon,
  Wifi01Icon,
  Tv01Icon,
  GameController01Icon,
  Book01Icon,
  Dumbbell01Icon,
  WashingMachineIcon,
  Store01Icon,
  Sun01Icon,
  Baby01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";

export const SPACE_ICON_KEYS = [
  "Home01Icon",
  "Sofa01Icon",
  "BedDoubleIcon",
  "KitchenUtensilsIcon",
  "Bathtub01Icon",
  "GarageIcon",
  "Door01Icon",
  "Tree01Icon",
  "Car01Icon",
  "OfficeIcon",
  "Building01Icon",
  "Wifi01Icon",
  "Tv01Icon",
  "GameController01Icon",
  "Book01Icon",
  "Dumbbell01Icon",
  "WashingMachineIcon",
  "Store01Icon",
  "Sun01Icon",
  "Baby01Icon",
] as const;

export type SpaceIconKey = (typeof SPACE_ICON_KEYS)[number];

export const DEFAULT_SPACE_ICON_KEY: SpaceIconKey = "Home01Icon";

export const SPACE_ICON_REGISTRY: Record<SpaceIconKey, IconSvgElement> = {
  Home01Icon,
  Sofa01Icon,
  BedDoubleIcon,
  KitchenUtensilsIcon,
  Bathtub01Icon,
  GarageIcon,
  Door01Icon,
  Tree01Icon,
  Car01Icon,
  OfficeIcon,
  Building01Icon,
  Wifi01Icon,
  Tv01Icon,
  GameController01Icon,
  Book01Icon,
  Dumbbell01Icon,
  WashingMachineIcon,
  Store01Icon,
  Sun01Icon,
  Baby01Icon,
};

export function isSpaceIconKey(value: string): value is SpaceIconKey {
  return (SPACE_ICON_KEYS as readonly string[]).includes(value);
}

export function resolveSpaceIcon(icon: string | null | undefined): IconSvgElement {
  if (icon && isSpaceIconKey(icon)) return SPACE_ICON_REGISTRY[icon];
  return SPACE_ICON_REGISTRY[DEFAULT_SPACE_ICON_KEY];
}
