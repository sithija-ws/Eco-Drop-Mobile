import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  AuthInput,
  EcoLogo,
  PrimaryButton,
  SecureBadge,
} from "../../components/auth/AuthUI";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type LoginRole = "resident" | "collector" | "admin";

const demoRoles: { id: LoginRole; label: string }[] = [
  { id: "resident", label: "Resident" },
  { id: "collector", label: "Collector" },
  { id: "admin", label: "Admin" },
];

export default function LoginScreen() {
  const [role, setRole] = useState<LoginRole>("resident");

  const handleLogin = () => {
    if (role === "collector") {
      router.replace("/collector/dashboard");
      return;
    }

    if (role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }

    router.replace("/(resident)/(tabs)/dashboard");
  };

  return (
    <LinearGradient
      colors={["#F3FFF6", "#FFFFFF", "#EEFDF4"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <EcoLogo />

            <Text style={styles.logoText}>ECO-DROP</Text>
            <Text style={styles.subtitle}>
              Welcome back. Let&apos;s make an impact.
            </Text>
          </View>

          <View style={styles.card}>
            <AuthInput
              label="Email Address"
              icon="mail-outline"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AuthInput
              label="Password"
              rightText="Forgot Password?"
              icon="lock-closed-outline"
              placeholder="••••••••"
              secureTextEntry
            />

            <Text style={styles.demoLabel}>Demo login role</Text>

            <View style={styles.roleRow}>
              {demoRoles.map((item) => {
                const active = role === item.id;

                return (
                  <Pressable
                    key={item.id}
                    style={[styles.rolePill, active && styles.rolePillActive]}
                    onPress={() => setRole(item.id)}
                  >
                    <Text
                      style={[styles.roleText, active && styles.roleTextActive]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <SecureBadge />

            <View style={styles.loginButtonWrap}>
              <PrimaryButton title="Login" onPress={handleLogin} />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <Pressable style={styles.socialButton}>
                <MaterialCommunityIcons
                  name="google"
                  size={18}
                  color="#111827"
                />
                <Text style={styles.socialText}>Google</Text>
              </Pressable>

              <Pressable style={styles.socialButton}>
                <Ionicons name="logo-apple" size={18} color="#111827" />
                <Text style={styles.socialText}>Apple</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to ECO-DROP?</Text>

            <Pressable
              onPress={() => router.push("/auth/register-role")}
              hitSlop={8}
            >
              <Text style={styles.footerLink}>Create an Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoText: {
    marginTop: spacing.lg,
    color: colors.primaryDeep,
    fontSize: 35,
    letterSpacing: 1,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  demoLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rolePill: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "#F4F7F5",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rolePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "900",
  },
  roleTextActive: {
    color: "#FFFFFF",
  },
  loginButtonWrap: {
    marginTop: spacing.lg,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  socialRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FAFCFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  socialText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  footerRow: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  footerLink: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: "900",
  },
});