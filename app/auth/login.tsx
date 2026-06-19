import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { loginEcoUser } from "../../services/authService";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrors";
import { getHomeRouteForRole } from "../../utils/roleRoutes";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const { profile } = await loginEcoUser(email, password);

      router.replace(getHomeRouteForRole(profile.role));
    } catch (error) {
      Alert.alert("Login failed", getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
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
              value={email}
              onChangeText={setEmail}
            />

            <AuthInput
              label="Password"
              rightText="Forgot Password?"
              icon="lock-closed-outline"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <SecureBadge />

            <View style={styles.loginButtonWrap}>
              <PrimaryButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
              />
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