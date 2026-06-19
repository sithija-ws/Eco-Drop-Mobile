import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  AuthProgress,
  PrimaryButton,
  SecondaryButton,
  SecureBadge,
} from "../../components/auth/AuthUI";
import { useSignup } from "../../context/SignupContext";
import { registerEcoUser } from "../../services/authService";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrors";
import { getHomeRouteForRole } from "../../utils/roleRoutes";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

export default function RegisterVerificationScreen() {
  const { draft, clearDraft } = useSignup();
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    try {
      setLoading(true);

      const { profile } = await registerEcoUser(draft);

      clearDraft();

      router.replace(getHomeRouteForRole(profile.role));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : getFirebaseErrorMessage(error);

      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
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
            Review your details and create your Eco Drop account. Your account
            will be securely stored in Firebase.
          </Text>

          <View style={styles.summaryBox}>
            <SummaryRow label="Account Type" value={draft.role ?? "Not selected"} />
            <SummaryRow label="Name" value={draft.fullName ?? "Missing"} />
            <SummaryRow label="Email" value={draft.email ?? "Missing"} />
            <SummaryRow
              label="GN Division"
              value={draft.area?.gnDivision ?? "Missing"}
            />
          </View>

          {draft.role === "collector" ? (
            <View style={styles.pendingNote}>
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color="#8A5A00"
              />

              <Text style={styles.pendingText}>
                Collector accounts may require admin approval before accepting
                jobs.
              </Text>
            </View>
          ) : null}

          <SecureBadge />

          <View style={styles.actionsRow}>
            <View style={styles.backWrap}>
              <SecondaryButton
                title="Back"
                onPress={() => router.back()}
                disabled={loading}
              />
            </View>

            <View style={styles.nextWrap}>
              <PrimaryButton
                title="Create Account"
                onPress={handleCreateAccount}
                icon="checkmark"
                loading={loading}
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
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
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
    gap: spacing.md,
  },
  summaryLabel: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "800",
  },
  summaryValue: {
    flex: 1,
    textAlign: "right",
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  pendingNote: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#FFF6E5",
    marginBottom: spacing.md,
  },
  pendingText: {
    flex: 1,
    color: "#8A5A00",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
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