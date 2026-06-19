import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  AuthInput,
  AuthProgress,
  PrimaryButton,
  SecondaryButton,
  SecureBadge,
} from "../../components/auth/AuthUI";
import { useSignup } from "../../context/SignupContext";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

export default function RegisterInfoScreen() {
  const { draft, updateDraft } = useSignup();

  const [fullName, setFullName] = useState(draft.fullName ?? "");
  const [phone, setPhone] = useState(draft.phone ?? "");
  const [email, setEmail] = useState(draft.email ?? "");
  const [password, setPassword] = useState(draft.password ?? "");
  const [confirmPassword, setConfirmPassword] = useState(
    draft.confirmPassword ?? ""
  );

  const handleNext = () => {
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Missing details",
        "Please fill all personal information fields."
      );
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password mismatch",
        "Password and confirm password do not match."
      );
      return;
    }

    updateDraft({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    });

    router.push("/auth/register-area");
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
            value={fullName}
            onChangeText={setFullName}
          />

          <AuthInput
            label="Phone Number"
            icon="call-outline"
            placeholder="+94 77 000 0000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <AuthInput
            label="Email Address"
            icon="mail-outline"
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <AuthInput
            label="Password"
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <AuthInput
            label="Confirm Password"
            icon="shield-checkmark-outline"
            placeholder="••••••••"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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