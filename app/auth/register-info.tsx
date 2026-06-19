import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  AuthInput,
  AuthProgress,
  PrimaryButton,
  SecondaryButton,
  SecureBadge,
} from "../../components/auth/AuthUI";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

export default function RegisterInfoScreen() {
  const { role = "resident" } = useLocalSearchParams<{ role?: string }>();

  const handleNext = () => {
    router.push({
      pathname: "/auth/register-area",
      params: { role },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoBlock}>
          <Text style={styles.logoText}>ECO-DROP</Text>
          <Text style={styles.subtitle}>Join the sustainable revolution.</Text>
        </View>

        <View style={styles.card}>
          <AuthProgress step={2} label="Personal Info" />

          <AuthInput
            label="Full Name"
            icon="person-outline"
            placeholder="Jane Doe"
            autoCapitalize="words"
          />

          <AuthInput
            label="Phone Number"
            icon="call-outline"
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
          />

          <AuthInput
            label="Email Address"
            icon="mail-outline"
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AuthInput
            label="Password"
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
          />

          <AuthInput
            label="Confirm Password"
            icon="shield-checkmark-outline"
            placeholder="••••••••"
            secureTextEntry
          />

          <SecureBadge />

          <View style={styles.actionsRow}>
            <View style={styles.backWrap}>
              <SecondaryButton title="Back" onPress={() => router.back()} />
            </View>

            <View style={styles.nextWrap}>
              <PrimaryButton title="Next Step" onPress={handleNext} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
  },
  logoBlock: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoText: {
    color: colors.primaryDeep,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  backWrap: {
    flex: 0.85,
  },
  nextWrap: {
    flex: 1.25,
  },
});