import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, softShadow, spacing } from "../constants/theme";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function ComingSoonScreen({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name={icon} size={42} color={colors.primaryDark} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: "center",
    ...softShadow,
  },
  iconWrap: {
    width: 86,
    height: 86,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSoft,
    textAlign: "center",
    fontWeight: "600",
  },
});