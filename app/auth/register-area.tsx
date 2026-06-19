import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Checklist,
  EcoLogo,
  PrimaryButton,
  SecondaryButton,
  SecureBadge,
  SelectField,
} from "../../components/auth/AuthUI";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

export default function RegisterAreaScreen() {
  const { role = "resident" } = useLocalSearchParams<{ role?: string }>();

  const handleNext = () => {
    router.push({
      pathname: "/auth/register-verification",
      params: { role },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <View style={styles.brandRow}>
            <EcoLogo compact />
            <Text style={styles.brandText}>ECO-DROP</Text>
          </View>

          <Text style={styles.title}>Area Setup</Text>

          <Text style={styles.subtitle}>
            We need your location to assign the correct collection schedule and
            nearest smart bins.
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <Text style={styles.stepText}>Step 3 of 4</Text>
            <Text style={styles.percentText}>75%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Checklist currentStep={3} />
        </View>

        <SecureBadge text="Location data is encrypted and secure" />

        <View style={styles.formCard}>
          <SelectField label="District" value="Select your District" />

          <SelectField
            label="DS Division"
            value="Select District first"
            disabled
          />

          <SelectField
            label="Grama Niladhari (GN) Division"
            value="Select DS Division first"
            disabled
          />

          <CoverageMap />

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

function CoverageMap() {
  return (
    <LinearGradient
      colors={["#204A4F", "#396E72", "#8CCEC5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.mapCard}
    >
      <View style={[styles.mapLine, styles.mapLineOne]} />
      <View style={[styles.mapLine, styles.mapLineTwo]} />
      <View style={[styles.mapLine, styles.mapLineThree]} />
      <View style={[styles.mapLine, styles.mapLineFour]} />

      <View style={styles.coverageGlow} />

      <View style={styles.coveragePill}>
        <MaterialCommunityIcons
          name="shield-check"
          size={13}
          color={colors.primaryDeep}
        />
        <Text style={styles.coverageText}>Coverage Area Preview</Text>
      </View>

      <Pressable style={styles.expandButton}>
        <Ionicons name="expand-outline" size={18} color={colors.primaryDeep} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  introCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandText: {
    color: colors.primaryDeep,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  progressCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...softShadow,
  },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  stepText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  percentText: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  progressTrack: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: "#DCEBE2",
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  progressFill: {
    width: "75%",
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    ...softShadow,
  },
  mapCard: {
    height: 126,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  mapLine: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  mapLineOne: {
    width: "130%",
    top: 34,
    left: -20,
    transform: [{ rotate: "-14deg" }],
  },
  mapLineTwo: {
    width: "120%",
    top: 70,
    left: -16,
    transform: [{ rotate: "8deg" }],
  },
  mapLineThree: {
    width: 1,
    height: "130%",
    left: 96,
    top: -10,
    transform: [{ rotate: "18deg" }],
  },
  mapLineFour: {
    width: 1,
    height: "130%",
    right: 54,
    top: -20,
    transform: [{ rotate: "-12deg" }],
  },
  coverageGlow: {
    position: "absolute",
    right: 32,
    top: 24,
    width: 70,
    height: 70,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  coveragePill: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.94)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  coverageText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
  },
  expandButton: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  backWrap: {
    flex: 0.85,
  },
  nextWrap: {
    flex: 1.25,
  },
});