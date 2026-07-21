import { Platform } from "react-native";

export const colors = {
  background: "#F6FFF8",
  surface: "#FFFFFF",
  surfaceSoft: "#ECFFF2",
  primary: "#28D46A",
  primaryDark: "#0B8F49",
  primaryDeep: "#056839",
  secondary: "#B8F55F",
  text: "#142318",
  textSoft: "#53645A",
  muted: "#7C8D84",
  border: "#E3EFE7",
  darkCard: "#27302E",
  warning: "#F8C348",
  danger: "#E73D3D",
  info: "#4E8CFF",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const gradients = {
  splash: ["#092617", "#0F3D24", "#1B6E41"],
  emerald: ["#1B6E41", "#28D46A"],
  gold: ["#FFD700", "#FF8C00"],
};

export const glowShadow = Platform.select({
  ios: {
    shadowColor: "#28D46A",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  android: {
    elevation: 10,
  },
  default: {},
}) ?? {};

export const softShadow =
  Platform.select({
    ios: {
      shadowColor: "#0B2A16",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) ?? {};