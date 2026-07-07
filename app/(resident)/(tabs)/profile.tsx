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
import LogoutButton from "../../../components/common/LogoutButton";
import { useAuth } from "../../../context/AuthContext";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export default function ResidentProfileScreen() {
  const { profile, refreshProfile } = useAuth();

  const fullName = profile?.fullName ?? "Resident";
  const email = profile?.email ?? "No email";
  const phone = profile?.phone ?? "No phone number";
  const role = profile?.role ?? "resident";
  const status = profile?.status ?? "active";

  const initials = getInitials(fullName);

  const handleEditProfile = () => {
    Alert.alert(
      "Coming soon",
      "Profile editing will be added after we finish the main Firebase flows."
    );
  };

  const handleRefresh = async () => {
    try {
      await refreshProfile();
      Alert.alert("Updated", "Profile data refreshed successfully.");
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
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>
              Manage your Eco Drop account
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
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons
                name="home-heart"
                size={14}
                color={colors.primaryDeep}
              />
              <Text style={styles.roleBadgeText}>{role}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                status === "disabled" && styles.disabledBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  status === "disabled" && styles.disabledDot,
                ]}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  status === "disabled" && styles.disabledText,
                ]}
              >
                {status}
              </Text>
            </View>
          </View>

          <Pressable style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <InfoCard
            icon="account-outline"
            label="Full Name"
            value={fullName}
          />

          <InfoCard
            icon="email-outline"
            label="Email Address"
            value={email}
          />

          <InfoCard
            icon="phone-outline"
            label="Phone Number"
            value={phone}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Area Details</Text>

          <InfoCard
            icon="map-marker-radius-outline"
            label="District"
            value={profile?.area?.district ?? "Not selected"}
          />

          <InfoCard
            icon="map-outline"
            label="DS Division"
            value={profile?.area?.dsDivision ?? "Not selected"}
          />

          <InfoCard
            icon="home-map-marker"
            label="GN Division"
            value={profile?.area?.gnDivision ?? "Not selected"}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Security</Text>

          <ActionCard
            icon="bell-outline"
            title="Notifications"
            subtitle="Pickup updates and Eco Drop alerts"
            onPress={() =>
              Alert.alert("Coming soon", "Notification settings will be added soon.")
            }
          />

          <ActionCard
            icon="shield-check-outline"
            title="Security"
            subtitle="Password and account protection"
            onPress={() =>
              Alert.alert("Coming soon", "Security settings will be added soon.")
            }
          />

          <ActionCard
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Contact Eco Drop support"
            onPress={() =>
              Alert.alert("Support", "Support center will be added soon.")
            }
          />
        </View>

        <View style={styles.logoutWrap}>
          <LogoutButton />
        </View>

        <Text style={styles.footerText}>
          Eco Drop • Smart Waste Management Platform
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

  if (parts.length === 0) {
    return "R";
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

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
    backgroundColor: colors.primary,
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
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
  },
  roleBadgeText: {
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
  disabledBadge: {
    backgroundColor: "#FFE7E7",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
  },
  disabledDot: {
    backgroundColor: colors.danger,
  },
  statusBadgeText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  disabledText: {
    color: colors.danger,
  },
  editButton: {
    marginTop: spacing.lg,
    height: 46,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
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