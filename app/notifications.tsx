import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext";
import type { EcoNotification, NotificationType } from "../types/firestore";
import { colors, radius, softShadow, spacing } from "../constants/theme";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "pickup_status":
      return { name: "truck-delivery-outline" as const, color: "#10B981", bg: "#E6F4EA" };
    case "collector_dispatch":
      return { name: "truck-fast-outline" as const, color: "#0284C7", bg: "#E0F2FE" };
    case "smart_bin_overflow":
      return { name: "delete-alert-outline" as const, color: "#EF4444", bg: "#FEE2E2" };
    case "schedule_alert":
      return { name: "calendar-clock-outline" as const, color: "#F59E0B", bg: "#FEF3C7" };
    case "reward_earned":
      return { name: "gift-outline" as const, color: "#8B5CF6", bg: "#F3E8FF" };
    default:
      return { name: "bell-outline" as const, color: colors.primaryDeep, bg: colors.surfaceSoft };
  }
}

function formatTimestamp(value: unknown): string {
  if (!value) return "Just now";
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "object" && value !== null && "toMillis" in value) {
    date = new Date((value as { toMillis: () => number }).toMillis());
  } else if (typeof value === "number") {
    date = new Date(value);
  }

  if (!date || isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.read;
    return true;
  });

  const handlePressNotification = (item: EcoNotification) => {
    if (!item.read) {
      markAsRead(item.id);
    }

    if (item.data?.screen) {
      const targetScreen = item.data.screen;
      if (targetScreen === "track-pickup" && item.data.requestId) {
        router.push({
          pathname: "/(resident)/track-pickup",
          params: { id: item.data.requestId },
        });
      } else if (targetScreen === "collector/dashboard") {
        router.push("/collector/(tabs)/dashboard");
      } else if (targetScreen === "bins") {
        router.push("/(resident)/(tabs)/bins");
      } else if (targetScreen === "schedule") {
        router.push("/(resident)/(tabs)/schedule");
      } else if (targetScreen === "rewards") {
        router.push("/(resident)/(tabs)/rewards");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          hitSlop={12}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {notifications.length > 0 && (
          <Pressable
            style={styles.clearAllBtn}
            hitSlop={8}
            onPress={clearAll}
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {/* Filter Tabs & Quick Actions */}
      <View style={styles.subHeader}>
        <View style={styles.tabGroup}>
          <Pressable
            style={[styles.tab, filter === "all" && styles.tabActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.tabText, filter === "all" && styles.tabTextActive]}>
              All ({notifications.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, filter === "unread" && styles.tabActive]}
            onPress={() => setFilter("unread")}
          >
            <Text style={[styles.tabText, filter === "unread" && styles.tabTextActive]}>
              Unread ({unreadCount})
            </Text>
          </Pressable>
        </View>

        {unreadCount > 0 && (
          <Pressable style={styles.markAllReadBtn} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={16} color={colors.primaryDeep} />
            <Text style={styles.markAllReadText}>Mark read</Text>
          </Pressable>
        )}
      </View>

      {/* Notification List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primaryDeep} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="notifications-off-outline"
              size={42}
              color={colors.textSoft}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === "unread"
              ? "You're all caught up! Check back later."
              : "Alerts about pickups, schedule updates, and Eco-Drops will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const iconConfig = getNotificationIcon(item.type);
            const timeAgo = formatTimestamp(item.createdAt);

            return (
              <Pressable
                style={[styles.card, !item.read && styles.cardUnread]}
                onPress={() => handlePressNotification(item)}
              >
                {!item.read && <View style={styles.unreadDot} />}

                <View style={[styles.iconWrap, { backgroundColor: iconConfig.bg }]}>
                  <MaterialCommunityIcons
                    name={iconConfig.name}
                    size={22}
                    color={iconConfig.color}
                  />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text
                      style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.timeText}>{timeAgo}</Text>
                  </View>

                  <Text style={styles.cardMessage} numberOfLines={2}>
                    {item.message}
                  </Text>

                  {item.data?.screen && (
                    <View style={styles.actionPrompt}>
                      <Text style={styles.actionPromptText}>Tap to view details</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={12}
                        color={colors.primaryDeep}
                      />
                    </View>
                  )}
                </View>

                <Pressable
                  style={styles.deleteBtn}
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteNotification(item.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.textSoft} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  unreadPill: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  unreadPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  clearAllBtn: {
    padding: spacing.xs,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tabGroup: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.surfaceSoft,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSoft,
  },
  tabTextActive: {
    color: colors.primaryDeep,
  },
  markAllReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryDeep,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
    ...softShadow,
  },
  cardUnread: {
    backgroundColor: "#F0FDF4",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    left: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primaryDeep,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: spacing.xs,
  },
  cardTitleUnread: {
    fontWeight: "700",
    color: colors.primaryDeep,
  },
  timeText: {
    fontSize: 11,
    color: colors.textSoft,
  },
  cardMessage: {
    fontSize: 13,
    color: colors.textSoft,
    lineHeight: 18,
  },
  actionPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 6,
  },
  actionPromptText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDeep,
  },
  deleteBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSoft,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSoft,
    textAlign: "center",
    lineHeight: 19,
  },
});
