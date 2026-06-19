import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import LogoutButton from "../../../components/common/LogoutButton";
import { useAuth } from "../../../context/AuthContext";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

export default function CollectorProfileScreen() {
  const { profile } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={56}
              color={colors.primaryDark}
            />
          </View>

          <Text style={styles.name}>{profile?.fullName ?? "Collector"}</Text>
          <Text style={styles.email}>{profile?.email ?? "No email"}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{profile?.role ?? "collector"}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{profile?.status ?? "active"}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>GN Division</Text>
            <Text style={styles.value}>
              {profile?.area?.gnDivision ?? "Not selected"}
            </Text>
          </View>

          <View style={styles.logoutWrap}>
            <LogoutButton />
          </View>
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
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: "center",
    ...softShadow,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  email: {
    marginTop: spacing.xs,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  infoBox: {
    width: "100%",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#F6FAF7",
  },
  label: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  value: {
    marginTop: 4,
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  logoutWrap: {
    width: "100%",
    marginTop: spacing.xl,
  },
});