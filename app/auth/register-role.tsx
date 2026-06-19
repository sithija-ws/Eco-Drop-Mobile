import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  AuthProgress,
  PrimaryButton,
  RoleIcon,
} from "../../components/auth/AuthUI";
import { useSignup } from "../../context/SignupContext";
import type { RegisterRole } from "../../types/user";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

const roles: {
  id: RegisterRole;
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  description: string;
}[] = [
  {
    id: "resident",
    title: "Resident",
    icon: "home-outline",
    description:
      "Manage household waste, track pickup status, find smart bins, and earn Eco Drops.",
  },
  {
    id: "collector",
    title: "Collector",
    icon: "truck-outline",
    description:
      "Accept nearby jobs, optimize routes, update collection status, and manage earnings.",
  },
];

export default function RegisterRoleScreen() {
  const { draft, updateDraft } = useSignup();
  const [selectedRole, setSelectedRole] = useState<RegisterRole>(
    draft.role ?? "resident"
  );

  const handleContinue = () => {
    updateDraft({
      role: selectedRole,
    });

    router.push("/auth/register-info");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AuthProgress step={1} label="Account Type" />

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Join the Eco-Network</Text>

          <Text style={styles.subtitle}>
            Select your role to help us build a more sustainable future. How
            will you participate?
          </Text>
        </View>

        <View style={styles.roleList}>
          {roles.map((role) => {
            const selected = selectedRole === role.id;

            return (
              <Pressable
                key={role.id}
                style={[styles.roleCard, selected && styles.roleCardSelected]}
                onPress={() => setSelectedRole(role.id)}
              >
                <View
                  style={[
                    styles.checkCircle,
                    !selected && styles.checkCircleInactive,
                  ]}
                >
                  {selected ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : null}
                </View>

                <RoleIcon name={role.icon} />

                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton title="Continue" onPress={handleContinue} />

        <Pressable
          style={styles.helpButton}
          onPress={() => router.push("/auth/login")}
          hitSlop={8}
        >
          <Text style={styles.helpText}>Already have an account? Login</Text>
        </Pressable>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.primaryDeep,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.md,
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    fontWeight: "700",
  },
  roleList: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  roleCard: {
    minHeight: 185,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    ...softShadow,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#FBFFFC",
  },
  checkCircle: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleInactive: {
    backgroundColor: "#E7EEE9",
  },
  roleTitle: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  roleDescription: {
    marginTop: spacing.sm,
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontWeight: "700",
  },
  helpButton: {
    alignSelf: "center",
    marginTop: spacing.lg,
  },
  helpText: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
});