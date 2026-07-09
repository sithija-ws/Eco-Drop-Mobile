import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  listenAllUsers,
  updateUserStatus,
} from "../../services/adminUserService";
import type {
  AccountStatus,
  EcoUserProfile,
  UserRole,
} from "../../types/user";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

type FilterType = "all" | "pending" | "resident" | "collector" | "admin";

const filters: { id: FilterType; label: string }[] = [
  {
    id: "all",
    label: "All",
  },
  {
    id: "pending",
    label: "Pending",
  },
  {
    id: "resident",
    label: "Residents",
  },
  {
    id: "collector",
    label: "Collectors",
  },
  {
    id: "admin",
    label: "Admins",
  },
];

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<EcoUserProfile[]>([]);
  const [filter, setFilter] = useState<FilterType>("pending");
  const [loading, setLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenAllUsers(
      (items) => {
        setUsers(items);
        setLoading(false);
      },
      (error) => {
        console.warn("Admin users listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    return {
      all: users.length,
      pending: users.filter((user) => user.status === "pending").length,
      resident: users.filter((user) => user.role === "resident").length,
      collector: users.filter((user) => user.role === "collector").length,
      admin: users.filter((user) => user.role === "admin").length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (filter === "all") {
      return users;
    }

    if (filter === "pending") {
      return users.filter((user) => user.status === "pending");
    }

    return users.filter((user) => user.role === filter);
  }, [users, filter]);

  const handleStatusChange = (
    user: EcoUserProfile,
    status: AccountStatus
  ) => {
    const action =
      status === "active"
        ? "Activate"
        : status === "disabled"
        ? "Disable"
        : "Mark pending";

    Alert.alert(
      `${action} user`,
      `Are you sure you want to set ${user.fullName}'s account status to "${status}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: action,
          style: status === "disabled" ? "destructive" : "default",
          onPress: async () => {
            try {
              setUpdatingUid(user.uid);
              await updateUserStatus(user.uid, status);
            } catch (error) {
              console.warn(error);
              Alert.alert(
                "Update failed",
                "Please check your Firestore rules and try again."
              );
            } finally {
              setUpdatingUid(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>
              Approve collectors and manage accounts
            </Text>
          </View>

          <View style={styles.backPlaceholder} />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="account-group-outline"
            label="Users"
            value={String(stats.all)}
          />

          <StatCard
            icon="account-clock-outline"
            label="Pending"
            value={String(stats.pending)}
            warning={stats.pending > 0}
          />

          <StatCard
            icon="truck-outline"
            label="Collectors"
            value={String(stats.collector)}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((item) => {
            const selected = filter === item.id;
            const count = stats[item.id];

            return (
              <Pressable
                key={item.id}
                style={[
                  styles.filterPill,
                  selected && styles.filterPillSelected,
                ]}
                onPress={() => setFilter(item.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextSelected,
                  ]}
                >
                  {item.label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : filteredUsers.length > 0 ? (
          <View style={styles.userList}>
            {filteredUsers.map((user) => (
              <UserCard
                key={user.uid}
                user={user}
                updating={updatingUid === user.uid}
                onActivate={() => handleStatusChange(user, "active")}
                onPending={() => handleStatusChange(user, "pending")}
                onDisable={() => handleStatusChange(user, "disabled")}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="account-check-outline"
              size={36}
              color={colors.primaryDark}
            />

            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              Users matching this filter will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  warning,
}: {
  icon: MaterialIconName;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons
        name={icon}
        size={21}
        color={warning ? colors.warning : colors.primaryDark}
      />

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function UserCard({
  user,
  updating,
  onActivate,
  onPending,
  onDisable,
}: {
  user: EcoUserProfile;
  updating: boolean;
  onActivate: () => void;
  onPending: () => void;
  onDisable: () => void;
}) {
  const roleIcon = getRoleIcon(user.role);
  const statusColor = getStatusColor(user.status);

  return (
    <View style={styles.userCard}>
      <View style={styles.userTopRow}>
        <View style={styles.avatarWrap}>
          <MaterialCommunityIcons
            name={roleIcon}
            size={25}
            color={colors.primaryDark}
          />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user.fullName || "Unnamed User"}
          </Text>

          <Text style={styles.userEmail}>{user.email}</Text>

          <Text style={styles.userArea}>
            {user.area?.gnDivision ??
              user.area?.district ??
              "Area not assigned"}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: `${statusColor}20`,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusColor,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: statusColor,
              },
            ]}
          >
            {user.status}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{user.role}</Text>
        </View>

        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{user.phone || "No phone"}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {user.status !== "active" ? (
          <Pressable
            style={[styles.actionButton, styles.activateButton]}
            onPress={onActivate}
            disabled={updating}
          >
            <Text style={styles.activateText}>
              {updating ? "Updating..." : "Activate"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.actionButton, styles.pendingButton]}
            onPress={onPending}
            disabled={updating}
          >
            <Text style={styles.pendingText}>
              {updating ? "Updating..." : "Set Pending"}
            </Text>
          </Pressable>
        )}

        {user.status !== "disabled" ? (
          <Pressable
            style={[styles.actionButton, styles.disableButton]}
            onPress={onDisable}
            disabled={updating}
          >
            <Text style={styles.disableText}>Disable</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.actionButton, styles.activateButton]}
            onPress={onActivate}
            disabled={updating}
          >
            <Text style={styles.activateText}>Re-activate</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function getRoleIcon(role?: UserRole): MaterialIconName {
  if (role === "collector") {
    return "truck-outline";
  }

  if (role === "admin") {
    return "shield-account-outline";
  }

  return "home-account";
}

function getStatusColor(status?: AccountStatus) {
  if (status === "active") {
    return colors.primaryDark;
  }

  if (status === "disabled") {
    return colors.danger;
  }

  return "#B7791F";
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 105,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  backPlaceholder: {
    width: 42,
  },
  headerTextBlock: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
  },
  headerSubtitle: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    ...softShadow,
  },
  statValue: {
    marginTop: 4,
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "800",
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  filterPill: {
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
  },
  filterTextSelected: {
    color: "#FFFFFF",
  },
  loadingCard: {
    minHeight: 160,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...softShadow,
  },
  loadingText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  userList: {
    gap: spacing.md,
  },
  userCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  userTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  userEmail: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  userArea: {
    marginTop: 2,
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "800",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#F4F7F5",
  },
  metaText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  activateButton: {
    backgroundColor: colors.primaryDark,
  },
  activateText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  pendingButton: {
    backgroundColor: "#FFF6E5",
  },
  pendingText: {
    color: "#8A5A00",
    fontSize: 13,
    fontWeight: "900",
  },
  disableButton: {
    backgroundColor: "#FFE7E7",
  },
  disableText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "900",
  },
  emptyCard: {
    minHeight: 190,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    ...softShadow,
  },
  emptyTitle: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});