import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

export default function RequestPickupScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Request Pickup</Text>

        <View style={styles.backButtonPlaceholder} />
      </View>

      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="truck-plus-outline"
              size={44}
              color={colors.primaryDark}
            />
          </View>

          <Text style={styles.title}>Pickup Request Flow</Text>

          <Text style={styles.subtitle}>
            Next, we will build this screen with waste category selection, image upload,
            details, location, date/time, and submit request.
          </Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  backButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
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
    width: 90,
    height: 90,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
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
    lineHeight: 22,
    color: colors.textSoft,
    textAlign: "center",
    fontWeight: "600",
  },
});