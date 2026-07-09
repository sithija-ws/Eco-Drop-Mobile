import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import LogoutButton from "../../components/common/LogoutButton";
import { useAuth } from "../../context/AuthContext";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export default function AdminProfileScreen() {
  const { profile, refreshProfile } = useAuth();

  const fullName = profile?.fullName ?? "Area Admin";
  const email = profile?.email ?? "No email";
  const phone = profile?.phone ?? "No phone number";
  const role = profile?.role ?? "admin";
  const status = profile?.status ?? "active";
  const initials = getInitials(fullName);

  const handleRefresh = async () => {
    try {
      await refreshProfile();
      Alert.alert("Updated", "Admin profile refreshed successfully.");
    } catch (error) {
      Alert.alert("Refresh failed", "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Admin Profile</Text>
            <Text style={styles.headerSubtitle}>
              Manage your Eco Drop admin account
            </Text>
          </View>

          <Pressable style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={20} color={colors.primaryDark} />
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.adminBadge}>
              <MaterialCommunityIcons
                name="shield-account"
                size={14}
                color={colors.primaryDeep}
              />
              <Text style={styles.adminBadgeText}>{role}</Text>
            </View>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>{status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <InfoCard icon="account-outline" label="Full Name" value={fullName} />
          <InfoCard icon="email-outline" label="Email Address" value={email} />
          <InfoCard icon="phone-outline" label="Phone Number" value={phone} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Area</Text>

          <InfoCard
            icon="map-marker-radius-outline"
            label="District"
            value={profile?.area?.district ?? "Not assigned"}
          />

          <InfoCard
            icon="map-outline"
            label="DS Division"
            value={profile?.area?.dsDivision ?? "Not assigned"}
          />

          <InfoCard
            icon="home-map-marker"
            label="GN Division"
            value={profile?.area?.gnDivision ?? "Not assigned"}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>

          <ActionCard
            icon="account-group-outline"
            title="User Management"
            subtitle="Approve collectors and manage account statuses"
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "User management screen will be connected next."
              )
            }
          />

          <ActionCard
            icon="trash-can-outline"
            title="Smart Bin Management"
            subtitle="Update bin fill levels, status, and locations"
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Smart bin management will be connected next."
              )
            }
          />

          <ActionCard
            icon="file-chart-outline"
            title="Reports & Complaints"
            subtitle="Review resident issues and collection reports"
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Reports workflow will be connected next."
              )
            }
          />
        </View>

        <View style={styles.logoutWrap}>
          <LogoutButton />
        </View>

        <Text style={styles.footerText}>
          Eco Drop Admin • Firebase Protected
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: MaterialIconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.primaryDark}
        />
      </View>

      <View style={styles.infoTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: MaterialIconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.actionIconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.primaryDark}
        />
      </View>

      <View style={styles.actionTextBlock}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 3,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  profileCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: "center",
    marginBottom: spacing.xl,
    ...softShadow,
  },
  avatar: {
    width: 98,
    height: 98,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
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
    textAlign: "center",
  },
  badgeRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
  },
  adminBadgeText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "#EEF8F1",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
  },
  statusBadgeText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    ...softShadow,
  },
  infoIconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  infoValue: {
    marginTop: 3,
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    ...softShadow,
  },
  cardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  actionTextBlock: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  actionSubtitle: {
    marginTop: 3,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  logoutWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  footerText: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
  },
});