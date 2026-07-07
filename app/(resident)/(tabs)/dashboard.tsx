import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import {
  calculateEcoDrops,
  formatPickupStatus,
  formatWasteCategory,
  listenResidentDashboard,
} from "../../../services/dashboardService";
import type { PickupRequest, SmartBin } from "../../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export default function ResidentDashboardScreen() {
  const { profile, refreshProfile } = useAuth();

  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const [smartBins, setSmartBins] = useState<SmartBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    const unsubscribe = listenResidentDashboard(
      profile,
      ({ pickupRequests: requests, smartBins: bins }) => {
        setPickupRequests(requests);
        setSmartBins(bins);
        setLoading(false);
      },
      (error) => {
        console.warn("Resident dashboard listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile]);

  const stats = useMemo(() => {
    const completed = pickupRequests.filter(
      (item) => item.status === "completed"
    ).length;

    const pending = pickupRequests.filter(
      (item) => !["completed", "cancelled", "rejected"].includes(item.status)
    ).length;

    const ecoDrops = calculateEcoDrops(pickupRequests);

    return {
      completed,
      pending,
      ecoDrops,
    };
  }, [pickupRequests]);

  const activePickup = useMemo(
    () =>
      pickupRequests.find((item) =>
        [
          "accepted",
          "collector_on_the_way",
          "collected",
          "waiting_for_collector",
          "submitted",
        ].includes(item.status)
      ) ?? null,
    [pickupRequests]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const firstName = profile?.fullName?.split(" ")[0] ?? "Resident";
  const areaText =
    profile?.area?.gnDivision ?? profile?.area?.district ?? "Area not set";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.locationIconWrap}>
              <Ionicons
                name="location-sharp"
                size={18}
                color={colors.primaryDark}
              />
            </View>

            <View>
              <Text style={styles.brandText}>ECO-DROP</Text>
              <Text style={styles.locationText}>{areaText}</Text>
            </View>
          </View>

          <Pressable style={styles.iconButton} hitSlop={10}>
            <Ionicons
              name="notifications-outline"
              size={21}
              color={colors.text}
            />
          </Pressable>
        </View>

        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Hello, {firstName} 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              Manage your waste pickups and track your eco impact in real time.
            </Text>
          </View>

          <View style={styles.levelBadge}>
            <MaterialCommunityIcons
              name="leaf"
              size={14}
              color={colors.primaryDeep}
            />
            <Text style={styles.levelBadgeText}>
              {stats.ecoDrops >= 1000 ? "Eco Hero" : "Eco Starter"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="check-circle-outline"
            value={String(stats.completed)}
            label="Completed"
          />
          <StatCard
            icon="clock-outline"
            value={String(stats.pending)}
            label="Active"
          />
          <StatCard
            icon="leaf"
            value={String(stats.ecoDrops)}
            label="Drops"
          />
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : activePickup ? (
          <ActivePickupCard pickup={activePickup} />
        ) : (
          <EmptyActionCard
            title="No active pickup yet"
            subtitle="Create a pickup request and nearby collectors will be notified."
            icon="truck-plus-outline"
            buttonText="Request Pickup"
            onPress={() => router.push("/(resident)/request-pickup" as never)}
          />
        )}

        <Pressable
          style={({ pressed }) => [
            styles.requestButton,
            pressed && styles.pressedButton,
          ]}
          onPress={() => router.push("/(resident)/request-pickup" as never)}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.requestButtonText}>Request Pickup</Text>
        </Pressable>

        <SectionHeader
          title="Nearby Smart Bins"
          action="View Map"
          onPress={() => router.push("/(resident)/(tabs)/bins" as never)}
        />

        {smartBins.length > 0 ? (
          <View style={styles.binGrid}>
            {smartBins.slice(0, 2).map((bin) => (
              <SmartBinCard key={bin.id} bin={bin} />
            ))}
          </View>
        ) : (
          <EmptySmallCard
            icon="trash-can-outline"
            title="No smart bins found"
            subtitle="Smart bins assigned to your GN area will appear here."
          />
        )}

        <View style={styles.rewardsCard}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.rewardsLabel}>Eco Rewards</Text>

            <View style={styles.goldBadge}>
              <MaterialCommunityIcons
                name="trophy"
                size={12}
                color={colors.primaryDeep}
              />
              <Text style={styles.goldBadgeText}>
                {stats.ecoDrops >= 1000 ? "Gold Level" : "Starter"}
              </Text>
            </View>
          </View>

          <Text style={styles.dropsText}>{stats.ecoDrops} Drops</Text>

          <Text style={styles.rewardsDescription}>
            Eco Drops are calculated from completed pickup requests.
          </Text>

          <View style={styles.rewardProgressTrack}>
            <View
              style={[
                styles.rewardProgressFill,
                {
                  width: `${Math.min(
                    100,
                    (stats.ecoDrops / 1500) * 100
                  )}%` as `${number}%`,
                },
              ]}
            />
          </View>
        </View>

        <SectionHeader title="Recent Activity" />

        {pickupRequests.length > 0 ? (
          <View style={styles.activityList}>
            {pickupRequests.slice(0, 5).map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </View>
        ) : (
          <EmptySmallCard
            icon="history"
            title="No activity yet"
            subtitle="Your pickup requests and status updates will appear here."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: MaterialIconName;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={colors.primaryDark}
      />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActivePickupCard({ pickup }: { pickup: PickupRequest }) {
  return (
    <View style={styles.pickupCard}>
      <LinearGradient
        colors={["#F2FFD8", "#BCEB83", "#6CCF8D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pickupIllustration}
      >
        <View style={styles.onTheWayPill}>
          <View style={styles.liveDot} />
          <Text style={styles.onTheWayText}>
            {formatPickupStatus(pickup.status)}
          </Text>
        </View>

        <View style={styles.road} />

        <View style={styles.truckCircle}>
          <MaterialCommunityIcons
            name="truck-delivery"
            size={58}
            color={colors.primaryDeep}
          />
        </View>
      </LinearGradient>

      <View style={styles.pickupInfoRow}>
        <View style={styles.pickupTextBlock}>
          <Text style={styles.pickupTitle}>
            {formatWasteCategory(pickup.wasteCategory)}
          </Text>

          <Text style={styles.pickupDescription}>
            {pickup.location?.address ??
              pickup.area?.gnDivision ??
              "Pickup location saved"}
          </Text>

          {pickup.collectorName ? (
            <Text style={styles.collectorText}>
              Collector: {pickup.collectorName}
            </Text>
          ) : null}
        </View>

        <View style={styles.statusBlock}>
          <Text style={styles.statusText}>
            {formatPickupStatus(pickup.status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {action ? (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SmartBinCard({ bin }: { bin: SmartBin }) {
  const percentage = Math.max(0, Math.min(100, Math.round(bin.fillLevel)));

  const fillColor =
    percentage >= 85
      ? colors.danger
      : percentage >= 60
      ? colors.warning
      : colors.primaryDark;

  return (
    <Pressable style={styles.binCard}>
      <View style={styles.binTopRow}>
        <View style={styles.binIconBox}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={16}
            color={colors.primaryDark}
          />
        </View>

        <View style={styles.typePill}>
          <Text style={styles.typePillText}>
            {formatWasteCategory(bin.type)}
          </Text>
        </View>
      </View>

      <Text style={styles.binName}>{bin.name}</Text>

      <Text style={styles.binDistance}>
        {bin.location?.address ?? bin.area?.gnDivision ?? "Nearby"}
      </Text>

      <View style={styles.binFillTrack}>
        <View
          style={[
            styles.binFillBar,
            {
              width: `${percentage}%` as `${number}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>

      <Text style={[styles.binFillText, { color: fillColor }]}>
        {percentage}% full
      </Text>
    </Pressable>
  );
}

function ActivityRow({ activity }: { activity: PickupRequest }) {
  const isCompleted = activity.status === "completed";

  return (
    <Pressable style={styles.activityRow}>
      <View
        style={[
          styles.activityIconBox,
          {
            backgroundColor: isCompleted ? "#0B8F4914" : "#4E8CFF14",
          },
        ]}
      >
        <MaterialCommunityIcons
          name={isCompleted ? "check-circle-outline" : "truck-fast-outline"}
          size={19}
          color={isCompleted ? colors.primaryDark : colors.info}
        />
      </View>

      <View style={styles.activityTextBlock}>
        <Text style={styles.activityTitle}>
          {formatWasteCategory(activity.wasteCategory)}
        </Text>
        <Text style={styles.activitySubtitle}>
          {activity.location?.address ??
            activity.area?.gnDivision ??
            "Eco Drop pickup"}
        </Text>
      </View>

      <View style={styles.activityRightBlock}>
        {activity.ecoDrops ? (
          <Text style={styles.activityPoints}>+{activity.ecoDrops} Drops</Text>
        ) : null}

        <Text
          style={[
            styles.activityStatus,
            !isCompleted && styles.pendingStatus,
          ]}
        >
          {formatPickupStatus(activity.status)}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyActionCard({
  title,
  subtitle,
  icon,
  buttonText,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: MaterialIconName;
  buttonText: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.emptyActionCard}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={34}
          color={colors.primaryDark}
        />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>

      <Pressable style={styles.emptyButton} onPress={onPress}>
        <Text style={styles.emptyButtonText}>{buttonText}</Text>
      </Pressable>
    </View>
  );
}

function EmptySmallCard({
  icon,
  title,
  subtitle,
}: {
  icon: MaterialIconName;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.emptySmallCard}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={colors.primaryDark}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.emptySmallTitle}>{title}</Text>
        <Text style={styles.emptySmallSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  locationIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.primaryDark,
  },
  locationText: {
    marginTop: 1,
    fontSize: 11,
    color: colors.textSoft,
    fontWeight: "600",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  welcomeCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    ...softShadow,
  },
  welcomeTitle: {
    fontSize: 17,
    color: colors.text,
    fontWeight: "900",
  },
  welcomeSubtitle: {
    marginTop: spacing.xs,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSoft,
    fontWeight: "600",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.primaryDeep,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    ...softShadow,
  },
  statValue: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 10,
    color: colors.textSoft,
    fontWeight: "700",
  },
  loadingCard: {
    minHeight: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...softShadow,
  },
  loadingText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  pickupCard: {
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...softShadow,
  },
  pickupIllustration: {
    height: 135,
    overflow: "hidden",
  },
  onTheWayPill: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
  },
  onTheWayText: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.primaryDeep,
  },
  road: {
    position: "absolute",
    left: -40,
    bottom: 22,
    width: "130%",
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: "rgba(33, 67, 49, 0.24)",
    transform: [{ rotate: "-13deg" }],
  },
  truckCircle: {
    position: "absolute",
    left: "38%",
    bottom: 35,
    width: 86,
    height: 70,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  pickupInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.lg,
  },
  pickupTextBlock: {
    flex: 1,
  },
  pickupTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },
  pickupDescription: {
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSoft,
    fontWeight: "600",
  },
  collectorText: {
    marginTop: 5,
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  statusBlock: {
    alignItems: "flex-end",
    maxWidth: 96,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.primaryDeep,
    textAlign: "right",
  },
  requestButton: {
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  pressedButton: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  requestButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "900",
  },
  sectionAction: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: "900",
  },
  binGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  binCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  binTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  binIconBox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  typePill: {
    maxWidth: 86,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
  },
  typePillText: {
    fontSize: 8,
    color: colors.primaryDeep,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  binName: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
  },
  binDistance: {
    marginTop: 2,
    fontSize: 12,
    minHeight: 34,
    fontWeight: "700",
    color: colors.textSoft,
  },
  binFillTrack: {
    height: 7,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: "#EDF2EF",
    marginTop: spacing.md,
  },
  binFillBar: {
    height: "100%",
    borderRadius: radius.pill,
  },
  binFillText: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: "900",
  },
  rewardsCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.darkCard,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  rewardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardsLabel: {
    fontSize: 12,
    color: "#DCE9E2",
    fontWeight: "700",
  },
  goldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  goldBadgeText: {
    color: colors.primaryDeep,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dropsText: {
    marginTop: spacing.xs,
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  rewardsDescription: {
    marginTop: spacing.xs,
    color: "#DCE9E2",
    fontSize: 11,
    fontWeight: "700",
  },
  rewardProgressTrack: {
    marginTop: spacing.md,
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  rewardProgressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  activityList: {
    gap: spacing.sm,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...softShadow,
  },
  activityIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  activityTextBlock: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "900",
  },
  activitySubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textSoft,
    fontWeight: "600",
  },
  activityRightBlock: {
    alignItems: "flex-end",
    maxWidth: 88,
  },
  activityPoints: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  activityStatus: {
    marginTop: 2,
    color: colors.primaryDeep,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    textAlign: "right",
  },
  pendingStatus: {
    color: colors.textSoft,
  },
  emptyActionCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    marginBottom: spacing.md,
    ...softShadow,
  },
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontWeight: "700",
  },
  emptyButton: {
    marginTop: spacing.lg,
    height: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  emptySmallCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  emptySmallTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  emptySmallSubtitle: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
});