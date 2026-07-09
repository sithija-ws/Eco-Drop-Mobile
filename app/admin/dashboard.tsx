import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import {
  listenAdminDashboard,
  type AdminDashboardData,
} from "../../services/adminService";
import {
  formatPickupStatus,
  formatWasteCategory,
} from "../../services/dashboardService";
import type { PickupRequest, PickupStatus, SmartBin } from "../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

const activeStatuses: PickupStatus[] = [
  "accepted",
  "collector_on_the_way",
  "collected",
];

const openStatuses: PickupStatus[] = [
  "submitted",
  "waiting_for_collector",
  "accepted",
  "collector_on_the_way",
  "collected",
];

const initialData: AdminDashboardData = {
  users: [],
  pickupRequests: [],
  smartBins: [],
  reports: [],
};

export default function AdminDashboardScreen() {
  const { profile, refreshProfile } = useAuth();

  const [data, setData] = useState<AdminDashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = listenAdminDashboard(
      (nextData) => {
        setData(nextData);
        setLoading(false);
      },
      (error) => {
        console.warn("Admin dashboard listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    const totalPickups = data.pickupRequests.length;

    const completedPickups = data.pickupRequests.filter(
      (item) => item.status === "completed"
    ).length;

    const openPickups = data.pickupRequests.filter((item) =>
      openStatuses.includes(item.status)
    ).length;

    const activeCollectors = data.users.filter(
      (user) => user.role === "collector" && user.status === "active"
    ).length;

    const pendingCollectors = data.users.filter(
      (user) => user.role === "collector" && user.status === "pending"
    ).length;

    const residents = data.users.filter((user) => user.role === "resident").length;

    const overflowBins = data.smartBins.filter(
      (bin) => Number(bin.fillLevel ?? 0) >= 85
    ).length;

    const openReports = data.reports.filter(
      (report) => report.status !== "resolved"
    ).length;

    return {
      totalPickups,
      completedPickups,
      openPickups,
      activeCollectors,
      pendingCollectors,
      residents,
      overflowBins,
      openReports,
    };
  }, [data]);

  const activeRoute = useMemo(
    () =>
      data.pickupRequests.find((request) =>
        activeStatuses.includes(request.status)
      ) ?? null,
    [data.pickupRequests]
  );

  const requestQueue = useMemo(
    () =>
      data.pickupRequests
        .filter((request) => openStatuses.includes(request.status))
        .slice(0, 5),
    [data.pickupRequests]
  );

  const criticalBins = useMemo(
    () =>
      [...data.smartBins]
        .sort((a, b) => Number(b.fillLevel ?? 0) - Number(a.fillLevel ?? 0))
        .slice(0, 4),
    [data.smartBins]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const areaTitle =
    profile?.area?.gnDivision ?? profile?.area?.district ?? "Admin Area";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Area Admin Dashboard</Text>
          <Text style={styles.areaTitle}>{areaTitle}</Text>

          <View style={styles.liveBadge}>
            <View style={styles.liveIconCircle}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={22}
                color={colors.primaryDeep}
              />
            </View>

            <View>
              <Text style={styles.liveTitle}>
                {profile?.fullName ?? "Admin"}
              </Text>

              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Firebase Live</Text>
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.loadingText}>Loading live admin data...</Text>
          </View>
        ) : null}

        <View style={styles.quickGrid}>
          <QuickActionCard
            title="Reschedule Route"
            icon="routes"
            color="#355C7D"
            bg="#EEF3FF"
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Route scheduling will be connected later."
              )
            }
          />

          <QuickActionCard
            title="Issue Alert"
            icon="bullhorn-outline"
            color={colors.danger}
            bg="#FFF0F0"
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Admin alerts will be connected later."
              )
            }
          />

          <QuickActionCard
            title="Download Report"
            icon="download-outline"
            color="#355C7D"
            bg="#EEF3FF"
            onPress={() =>
              Alert.alert("Coming soon", "PDF/CSV reports will be added later.")
            }
          />

          <QuickActionCard
            title="Review Queue"
            icon="clipboard-list-outline"
            color="#FFFFFF"
            bg={colors.primary}
            primary
            onPress={() =>
              Alert.alert(
                "Requests Queue",
                `${requestQueue.length} active request(s) need monitoring.`
              )
            }
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Total Pickups"
            value={String(stats.totalPickups)}
            helper={`${stats.completedPickups} completed`}
            icon="truck-outline"
            iconColor={colors.primaryDeep}
          />

          <StatCard
            label="Active Teams"
            value={String(stats.activeCollectors)}
            helper={`${stats.pendingCollectors} pending approvals`}
            icon="account-group-outline"
            iconColor="#355C7D"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Residents"
            value={String(stats.residents)}
            helper="registered residents"
            icon="home-account"
            iconColor={colors.primaryDeep}
          />

          <StatCard
            label="Open Requests"
            value={String(stats.openPickups)}
            helper="needs monitoring"
            icon="clipboard-list-outline"
            iconColor="#355C7D"
          />
        </View>

        <View
          style={[
            styles.alertCard,
            stats.overflowBins === 0 && styles.safeAlertCard,
          ]}
        >
          <View style={styles.alertTopRow}>
            <Text style={styles.alertLabel}>Overflow Alerts</Text>

            <MaterialCommunityIcons
              name={
                stats.overflowBins > 0 ? "alert-outline" : "check-circle-outline"
              }
              size={26}
              color={stats.overflowBins > 0 ? colors.danger : colors.primaryDark}
            />
          </View>

          <Text style={styles.alertValue}>{stats.overflowBins}</Text>

          <Text
            style={[
              styles.alertHelper,
              stats.overflowBins === 0 && styles.safeAlertText,
            ]}
          >
            {stats.overflowBins > 0
              ? "Require immediate action"
              : "No critical bin overflow"}
          </Text>
        </View>

        {activeRoute ? (
          <ActiveRouteCard request={activeRoute} />
        ) : (
          <EmptyCard
            icon="truck-check-outline"
            title="No active collection route"
            subtitle="Accepted or in-progress pickup requests will appear here."
          />
        )}

        <View style={styles.healthCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Smart Bin Health</Text>
            <Text style={styles.sectionAction}>{data.smartBins.length} bins</Text>
          </View>

          {criticalBins.length > 0 ? (
            <View style={styles.binList}>
              {criticalBins.map((item) => (
                <BinHealthRow key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <MiniEmpty
              icon="trash-can-outline"
              text="No smart bins added yet."
            />
          )}
        </View>

        <View style={styles.queueCard}>
          <View style={styles.queueHeaderRow}>
            <Text style={styles.sectionTitle}>Requests Queue</Text>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{requestQueue.length}</Text>
            </View>
          </View>

          {requestQueue.length > 0 ? (
            <View style={styles.requestList}>
              {requestQueue.map((item) => (
                <RequestRow key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <MiniEmpty
              icon="clipboard-check-outline"
              text="No open pickup requests right now."
            />
          )}
        </View>

        <View style={styles.reportCard}>
          <View style={styles.reportIconWrap}>
            <MaterialCommunityIcons
              name="file-chart-outline"
              size={24}
              color={colors.primaryDark}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.reportTitle}>Reports & Complaints</Text>
            <Text style={styles.reportText}>
              {stats.openReports} open report(s) in Firestore.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionCard({
  title,
  icon,
  color,
  bg,
  primary,
  onPress,
}: {
  title: string;
  icon: MaterialIconName;
  color: string;
  bg: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickCard,
        primary && styles.quickCardPrimary,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.quickIconCircle,
          { backgroundColor: primary ? "rgba(255,255,255,0.22)" : bg },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={25} color={color} />
      </View>

      <Text style={[styles.quickTitle, primary && styles.quickTitlePrimary]}>
        {title}
      </Text>
    </Pressable>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  helper: string;
  icon: MaterialIconName;
  iconColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTopRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <MaterialCommunityIcons name={icon} size={27} color={iconColor} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHelper}>{helper}</Text>
    </View>
  );
}

function ActiveRouteCard({ request }: { request: PickupRequest }) {
  return (
    <View style={styles.routeCard}>
      <View style={styles.routeTopRow}>
        <View style={styles.routeIconWrap}>
          <MaterialCommunityIcons
            name="truck-fast-outline"
            size={28}
            color={colors.primaryDeep}
          />
        </View>

        <View style={styles.routeTextBlock}>
          <Text style={styles.routeTitle}>
            {request.collectorName ?? "Collector assigned"}
          </Text>

          <Text style={styles.routeSubtitle}>
            {formatWasteCategory(request.wasteCategory)}
          </Text>

          <Text style={styles.routeSubtitle}>
            {request.location?.address ??
              request.area?.gnDivision ??
              "Pickup location"}
          </Text>
        </View>

        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>
            {formatPickupStatus(request.status)}
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={["#073331", "#0B4B45", "#082928"]}
        style={styles.mapPreview}
      >
        <View style={styles.routeLineOne} />
        <View style={styles.routeLineTwo} />

        <View style={styles.mapMarker}>
          <MaterialCommunityIcons name="truck" size={22} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </View>
  );
}

function BinHealthRow({ item }: { item: SmartBin }) {
  const percentage = Math.max(
    0,
    Math.min(100, Math.round(Number(item.fillLevel ?? 0)))
  );

  const fillColor =
    percentage >= 85
      ? colors.danger
      : percentage >= 60
      ? colors.warning
      : colors.primary;

  return (
    <View style={styles.binRow}>
      <View style={styles.binHeaderRow}>
        <Text style={styles.binName}>{item.name}</Text>
        <Text style={[styles.binStatus, { color: fillColor }]}>
          {percentage}% Full
        </Text>
      </View>

      <View style={styles.binTrack}>
        <View
          style={[
            styles.binFill,
            {
              width: `${percentage}%` as `${number}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

function RequestRow({ item }: { item: PickupRequest }) {
  return (
    <View style={styles.requestRow}>
      <View style={styles.requestIconWrap}>
        <MaterialCommunityIcons
          name="recycle"
          size={20}
          color={colors.primaryDark}
        />
      </View>

      <View style={styles.requestContent}>
        <Text style={styles.requestTitle}>
          {formatWasteCategory(item.wasteCategory)}
        </Text>

        <Text style={styles.requestDescription}>
          {item.residentName ?? "Resident"} •{" "}
          {item.location?.address ?? item.area?.gnDivision ?? "Location"}
        </Text>

        <View style={styles.requestMetaRow}>
          <View style={styles.requestBadge}>
            <Text style={styles.requestBadgeText}>
              {formatPickupStatus(item.status)}
            </Text>
          </View>

          {item.price ? (
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>Rs. {item.price}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function EmptyCard({
  icon,
  title,
  subtitle,
}: {
  icon: MaterialIconName;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={28}
          color={colors.primaryDark}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function MiniEmpty({
  icon,
  text,
}: {
  icon: MaterialIconName;
  text: string;
}) {
  return (
    <View style={styles.miniEmpty}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={colors.primaryDark}
      />
      <Text style={styles.miniEmptyText}>{text}</Text>
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
    paddingTop: spacing.lg,
    paddingBottom: 105,
  },
  headerBlock: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: "#172B4D",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  areaTitle: {
    marginTop: spacing.sm,
    color: "#070A0D",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  liveBadge: {
    marginTop: spacing.lg,
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    paddingRight: spacing.lg,
    gap: spacing.sm,
    ...softShadow,
  },
  liveIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  liveTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  liveRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  liveText: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  loadingCard: {
    minHeight: 90,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  loadingText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickCard: {
    width: "48.6%",
    minHeight: 106,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    ...softShadow,
  },
  quickCardPrimary: {
    backgroundColor: colors.primary,
  },
  quickIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  quickTitle: {
    color: "#070A0D",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  quickTitlePrimary: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minHeight: 126,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...softShadow,
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#172B4D",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    lineHeight: 17,
    textTransform: "uppercase",
    maxWidth: 88,
  },
  statValue: {
    marginTop: spacing.xs,
    color: "#070A0D",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  statHelper: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 14,
  },
  alertCard: {
    minHeight: 138,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  safeAlertCard: {
    borderLeftColor: colors.primaryDark,
  },
  alertTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertLabel: {
    color: "#172B4D",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.7,
    textTransform: "uppercase",
  },
  alertValue: {
    marginTop: spacing.lg,
    color: "#070A0D",
    fontSize: 34,
    fontWeight: "900",
  },
  alertHelper: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "900",
  },
  safeAlertText: {
    color: colors.primaryDeep,
  },
  routeCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...softShadow,
  },
  routeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  routeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: "#DFF8E9",
    alignItems: "center",
    justifyContent: "center",
  },
  routeTextBlock: {
    flex: 1,
  },
  routeTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  routeSubtitle: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
  },
  statusPillText: {
    color: colors.primaryDeep,
    fontSize: 10,
    fontWeight: "900",
  },
  mapPreview: {
    height: 190,
    overflow: "hidden",
  },
  routeLineOne: {
    position: "absolute",
    width: "70%",
    height: 3,
    left: "15%",
    top: "46%",
    backgroundColor: "rgba(50,255,208,0.34)",
    transform: [{ rotate: "-22deg" }],
  },
  routeLineTwo: {
    position: "absolute",
    width: "50%",
    height: 3,
    right: "15%",
    top: "54%",
    backgroundColor: "rgba(50,255,208,0.22)",
    transform: [{ rotate: "20deg" }],
  },
  mapMarker: {
    position: "absolute",
    left: "50%",
    top: "47%",
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.78)",
  },
  healthCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionAction: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  binList: {
    gap: spacing.md,
  },
  binRow: {
    gap: spacing.sm,
  },
  binHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  binName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  binStatus: {
    fontSize: 12,
    fontWeight: "900",
  },
  binTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "#DCEBE2",
    overflow: "hidden",
  },
  binFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  queueCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  queueHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  countBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: "#D8E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: "#5A7FA8",
    fontSize: 13,
    fontWeight: "900",
  },
  requestList: {
    gap: spacing.sm,
  },
  requestRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#D7E0DA",
    backgroundColor: "#FAFCFB",
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  requestIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF9F0",
  },
  requestContent: {
    flex: 1,
  },
  requestTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  requestDescription: {
    marginTop: 2,
    color: "#54665D",
    fontSize: 12,
    fontWeight: "700",
  },
  requestMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  requestBadge: {
    borderRadius: 6,
    backgroundColor: "#DFF8E9",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  requestBadgeText: {
    color: colors.primaryDeep,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  timeBadge: {
    borderRadius: 6,
    backgroundColor: "#D9E0E4",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  timeBadgeText: {
    color: "#45525C",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  emptySubtitle: {
    marginTop: 3,
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  miniEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#F7FAF8",
  },
  miniEmptyText: {
    flex: 1,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "800",
  },
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  reportIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  reportTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  reportText: {
    marginTop: 3,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
});