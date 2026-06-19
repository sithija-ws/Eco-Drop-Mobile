import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  AuthProgress,
  PrimaryButton,
  SecondaryButton,
  SecureBadge,
} from "../../components/auth/AuthUI";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

export default function RegisterVerificationScreen() {
  const { role = "resident" } = useLocalSearchParams<{ role?: string }>();

  const handleCreateAccount = () => {
    // Frontend-only for now.
    // Later, after backend is ready, call register API here.
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <AuthProgress step={4} label="Verification" />

          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="account-check-outline"
              size={54}
              color={colors.primaryDeep}
            />
          </View>

          <Text style={styles.title}>Verify Your Account</Text>

          <Text style={styles.subtitle}>
            Review your details and create your Eco Drop {String(role)} account.
            Verification documents can be added later from your profile.
          </Text>

          <View style={styles.summaryBox}>
            <SummaryRow label="Account Type" value={String(role)} />
            <SummaryRow label="Security" value="Protected" />
            <SummaryRow label="Location" value="Ready to assign" />
          </View>

          <SecureBadge />

          <View style={styles.actionsRow}>
            <View style={styles.backWrap}>
              <SecondaryButton title="Back" onPress={() => router.back()} />
            </View>

            <View style={styles.nextWrap}>
              <PrimaryButton
                title="Create Account"
                onPress={handleCreateAccount}
                icon="checkmark"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
    justifyContent: "center",
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    alignSelf: "center",
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  summaryBox: {
    borderRadius: radius.lg,
    backgroundColor: "#F6FAF7",
    padding: spacing.lg,
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "800",
  },
  summaryValue: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  backWrap: {
    flex: 0.75,
  },
  nextWrap: {
    flex: 1.35,
  },
});