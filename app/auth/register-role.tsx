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
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type AccountRole = "resident" | "collector";

const roles: {
  id: AccountRole;
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  description: string;
}[] = [
  {
    id: "resident",
    title: "Resident",
    icon: "home-outline",
    description:
      "I want to manage my household waste, track my eco-impact, and earn rewards for sustainable practices.",
  },
  {
    id: "collector",
    title: "Collector",
    icon: "truck-outline",
    description:
      "I am a waste management professional looking to optimize routes, manage pickups, and view analytics.",
  },
];

export default function RegisterRoleScreen() {
  const [selectedRole, setSelectedRole] = useState<AccountRole>("resident");

  const handleContinue = () => {
    router.push({
      pathname: "/auth/register-info",
      params: { role: selectedRole },
    });
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
                <View style={styles.checkCircle}>
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

        <Pressable style={styles.helpButton} hitSlop={8}>
          <Text style={styles.helpText}>Need help choosing?</Text>
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