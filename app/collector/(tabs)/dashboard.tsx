import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import {
  acceptPickupRequest,
  calculateTodayEarnings,
  formatPickupStatus,
  formatWasteCategory,
  getActiveCollectorJob,
  listenCollectorDashboard,
  updatePickupStatus,
} from "../../../services/dashboardService";
import type { PickupRequest } from "../../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export default function CollectorDashboardScreen() {
  const { profile, refreshProfile } = useAuth();

  const [assignedJobs, setAssignedJobs] = useState<PickupRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    const unsubscribe = listenCollectorDashboard(
      profile,
      ({ assignedJobs: jobs, incomingRequests: requests }) => {
        setAssignedJobs(jobs);
        setIncomingRequests(requests);
        setLoading(false);
      },
      (error) => {
        console.warn("Collector dashboard listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile]);

  const activeJob = useMemo(
    () => getActiveCollectorJob(assignedJobs),
    [assignedJobs]
  );

  const todayEarnings = useMemo(
    () => calculateTodayEarnings(assignedJobs),
    [assignedJobs]
  );

  const completedJobs = assignedJobs.filter(
    (job) => job.status === "completed"
  ).length;

  const pendingRoutes = assignedJobs.filter(
    (job) => !["completed", "cancelled", "rejected"].includes(job.status)
  ).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleAccept = async (request: PickupRequest) => {
    if (!profile) return;

    try {
      setAcceptingId(request.id);
      await acceptPickupRequest(request.id, profile);
    } catch (error) {
      console.warn(error);
      Alert.alert("Could not accept request", "Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAdvanceStatus = async (job: PickupRequest) => {
    try {
      const nextStatus =
        job.status === "accepted"
          ? "collector_on_the_way"
          : job.status === "collector_on_the_way"
          ? "collected"
          : "completed";

      await updatePickupStatus(job.id, nextStatus);
    } catch (error) {
      console.warn(error);
      Alert.alert("Status update failed", "Please try again.");
    }
  };

  const firstName = profile?.fullName?.split(" ")[0] ?? "Collector";
  const isPendingApproval = profile?.status === "pending";

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
                name="location-outline"
                size={17}
                color={colors.primaryDark}
              />
            </View>

            <View>
              <Text style={styles.brandText}>ECO-DROP</Text>
              <Text style={styles.areaText}>
                {profile?.area?.gnDivision ?? "Area not assigned"}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <View
              style={[styles.onlinePill, isPendingApproval && styles.pendingPill]}
            >
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {isPendingApproval ? "Pending" : "Online"}
              </Text>
            </View>

            <Pressable style={styles.iconButton} hitSlop={10}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.text}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.secureRow}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={13}
            color={colors.primaryDark}
          />
          <Text style={styles.secureText}>Firebase protected account</Text>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>Good Morning, {firstName}</Text>
          <Text style={styles.greetingSubtitle}>
            {isPendingApproval
              ? "Your collector account is waiting for admin approval."
              : "Your assigned area and pickup requests are synced live."}
          </Text>
        </View>

        {isPendingApproval ? (
          <View style={styles.approvalCard}>
            <MaterialCommunityIcons
              name="account-clock-outline"
              size={26}
              color="#8A5A00"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.approvalTitle}>Approval required</Text>
              <Text style={styles.approvalText}>
                An admin must activate your collector account before you can
                accept jobs.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="wallet-outline"
            label="Today's Earnings"
            value={`Rs. ${todayEarnings.toFixed(2)}`}
            helper="From completed jobs today"
          />

          <SummaryCard
            icon="check-circle-outline"
            label="Jobs Completed"
            value={String(completedJobs)}
            helper={`${pendingRoutes} active routes`}
            showProgress
          />
        </View>

        <SectionHeader title="Active Job" />

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.loadingText}>Loading collector data...</Text>
          </View>
        ) : activeJob ? (
          <ActiveJobCard
            job={activeJob}
            onAdvanceStatus={() => handleAdvanceStatus(activeJob)}
          />
        ) : (
          <EmptyState
            title="No active job"
            subtitle="Accepted pickup requests will appear here with route details."
            icon="briefcase-check-outline"
          />
        )}

        <SectionHeader
          title="Incoming Requests"
          action={`${incomingRequests.length} open`}
        />

        {incomingRequests.length > 0 ? (
          <View style={styles.requestList}>
            {incomingRequests.slice(0, 5).map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={() => handleAccept(request)}
                accepting={acceptingId === request.id}
                disabled={isPendingApproval}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No incoming requests"
            subtitle="New resident pickup requests in your GN area will appear here."
            icon="inbox-outline"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
  showProgress,
}: {
  icon: MaterialIconName;
  label: string;
  value: string;
  helper: string;
  showProgress?: boolean;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTopRow}>
        <View style={styles.summaryIconWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={colors.primaryDark}
          />
        </View>
      </View>

      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryHelper}>{helper}</Text>

      {showProgress ? (
        <View style={styles.summaryProgressTrack}>
          <View style={styles.summaryProgressFill} />
        </View>
      ) : null}
    </View>
  );
}

function ActiveJobCard({
  job,
  onAdvanceStatus,
}: {
  job: PickupRequest;
  onAdvanceStatus: () => void;
}) {
  const handleCall = () => {
    if (!job.residentPhone) {
      Alert.alert("No phone", "Resident phone number is not available.");
      return;
    }
    Linking.openURL(`tel:${job.residentPhone}`).catch(() => {
      Alert.alert("Error", "Cannot place call.");
    });
  };

  const handleNavigate = () => {
    const address = job.location?.address ?? job.area?.gnDivision;
    if (!address) return;
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
      Alert.alert("Error", "Could not open map navigation.");
    });
  };

  return (
    <View style={styles.activeJobCard}>
      <View style={styles.activeJobTop}>
        <LocationPreview />

        <View style={styles.activeContent}>
          <View style={styles.activeTitleRow}>
            <Text style={styles.activeTitle}>
              {job.residentName ?? "Resident Pickup"}
            </Text>

            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                {formatPickupStatus(job.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.activeSubtitle}>
            {formatWasteCategory(job.wasteCategory)}
          </Text>

          <Text style={styles.activeAddress}>
            {job.location?.address ?? job.area?.gnDivision ?? "Pickup location"}
          </Text>
        </View>
      </View>

      <View style={styles.activeActions}>
        <Pressable style={styles.navigateButton} onPress={onAdvanceStatus}>
          <MaterialCommunityIcons
            name="progress-check"
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.navigateText}>Update Status</Text>
        </Pressable>

        <Pressable style={styles.callButton} onPress={handleNavigate}>
          <Ionicons name="navigate-outline" size={18} color={colors.primaryDeep} />
        </Pressable>

        <Pressable style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call-outline" size={18} color={colors.primaryDeep} />
        </Pressable>
      </View>
    </View>
  );
}

function RequestCard({
  request,
  onAccept,
  accepting,
  disabled,
}: {
  request: PickupRequest;
  onAccept: () => void;
  accepting: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={styles.requestCard}>
      <MapPreview />

      <View style={styles.distanceBadge}>
        <Text style={styles.distanceText}>
          {request.area?.gnDivision ?? "Assigned area"}
        </Text>
      </View>

      <View style={styles.requestInfoRow}>
        <View style={styles.requestTextBlock}>
          <Text style={styles.requestTitle}>
            {formatWasteCategory(request.wasteCategory)}
          </Text>

          <Text style={styles.requestAddress}>
            {request.location?.address ??
              request.wasteDetails ??
              "Resident pickup request"}
          </Text>
        </View>

        {request.price ? (
          <Text style={styles.priceText}>Rs. {request.price.toFixed(2)}</Text>
        ) : null}
      </View>

      <View style={styles.requestActions}>
        <Pressable style={styles.declineButton}>
          <Text style={styles.declineText}>Details</Text>
        </Pressable>

        <Pressable
          style={[styles.acceptButton, disabled && styles.disabledButton]}
          onPress={onAccept}
          disabled={accepting || disabled}
        >
          <Text style={styles.acceptText}>
            {accepting ? "Accepting..." : "Accept"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function LocationPreview() {
  return (
    <LinearGradient
      colors={["#DCEFE2", "#BFD7C4", "#7FA486"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.activePreview}
    >
      <View style={styles.activeRoad} />
      <View style={styles.activeHouse} />
      <View style={styles.activeHouseRoof} />
      <View style={styles.activeTreeOne} />
      <View style={styles.activeBin} />
    </LinearGradient>
  );
}

function MapPreview() {
  return (
    <View style={styles.mapPreview}>
      <View style={[styles.mapRoad, styles.mapRoadOne]} />
      <View style={[styles.mapRoad, styles.mapRoadTwo]} />
      <View style={[styles.mapRoad, styles.mapRoadThree]} />

      <View style={styles.routeLine} />

      <View style={[styles.mapBlock, styles.mapBlockOne]} />
      <View style={[styles.mapBlock, styles.mapBlockTwo]} />

      <View style={styles.mapPin}>
        <Ionicons name="location-sharp" size={17} color="#FFFFFF" />
      </View>
    </View>
  );
}

function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: MaterialIconName;
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
    marginBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  locationIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.primaryDark,
  },
  areaText: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  pendingPill: {
    backgroundColor: "#FFF1C6",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDeep,
  },
  onlineText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: spacing.sm,
  },
  secureText: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "700",
  },
  greetingBlock: {
    marginBottom: spacing.lg,
  },
  greetingTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
    lineHeight: 19,
  },
  approvalCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#FFF6E5",
    marginBottom: spacing.lg,
    ...softShadow,
  },
  approvalTitle: {
    color: "#8A5A00",
    fontSize: 15,
    fontWeight: "900",
  },
  approvalText: {
    marginTop: 3,
    color: "#8A5A00",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  summaryGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    minHeight: 125,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    justifyContent: "space-between",
    ...softShadow,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  summaryHelper: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  summaryLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  summaryValue: {
    color: colors.primaryDark,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  summaryProgressTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: "#E7EEE9",
    marginTop: spacing.md,
  },
  summaryProgressFill: {
    width: "68%",
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionAction: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  loadingCard: {
    minHeight: 116,
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
  activeJobCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  activeJobTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  activePreview: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  activeRoad: {
    position: "absolute",
    left: -10,
    bottom: 14,
    width: 110,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ rotate: "-18deg" }],
  },
  activeHouse: {
    position: "absolute",
    right: 8,
    bottom: 18,
    width: 28,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  activeHouseRoof: {
    position: "absolute",
    right: 5,
    bottom: 38,
    width: 34,
    height: 12,
    borderRadius: 3,
    backgroundColor: "rgba(73,93,68,0.75)",
    transform: [{ rotate: "-6deg" }],
  },
  activeTreeOne: {
    position: "absolute",
    left: 10,
    bottom: 18,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: "rgba(21, 91, 49, 0.7)",
  },
  activeBin: {
    position: "absolute",
    right: 7,
    bottom: 8,
    width: 12,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.primaryDeep,
  },
  activeContent: {
    flex: 1,
  },
  activeTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  activeTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },
  progressBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
  },
  progressBadgeText: {
    color: colors.primaryDeep,
    fontSize: 10,
    fontWeight: "900",
  },
  activeSubtitle: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
    marginTop: spacing.sm,
  },
  activeAddress: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  activeActions: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  navigateButton: {
    height: 42,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDeep,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  navigateText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  requestList: {
    gap: spacing.md,
  },
  requestCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...softShadow,
  },
  mapPreview: {
    height: 118,
    backgroundColor: "#EFF6F0",
    overflow: "hidden",
  },
  mapRoad: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  mapRoadOne: {
    width: "120%",
    height: 10,
    left: -30,
    top: 32,
    transform: [{ rotate: "-16deg" }],
  },
  mapRoadTwo: {
    width: "120%",
    height: 9,
    left: -20,
    top: 73,
    transform: [{ rotate: "3deg" }],
  },
  mapRoadThree: {
    width: 10,
    height: "130%",
    left: 92,
    top: -20,
    transform: [{ rotate: "8deg" }],
  },
  routeLine: {
    position: "absolute",
    width: "80%",
    height: 4,
    left: 30,
    top: 62,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    transform: [{ rotate: "-14deg" }],
  },
  mapBlock: {
    position: "absolute",
    borderRadius: 4,
    backgroundColor: "#CFECD7",
  },
  mapBlockOne: {
    width: 64,
    height: 32,
    left: 18,
    top: 12,
  },
  mapBlockTwo: {
    width: 72,
    height: 35,
    right: 24,
    bottom: 16,
  },
  mapPin: {
    position: "absolute",
    top: 46,
    left: "50%",
    width: 30,
    height: 30,
    marginLeft: -15,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  distanceBadge: {
    position: "absolute",
    top: 92,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  distanceText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
  },
  requestInfoRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  requestTextBlock: {
    flex: 1,
  },
  requestTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  requestAddress: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  priceText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  requestActions: {
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  declineButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "#F4F6F5",
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  acceptButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.55,
  },
  acceptText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
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
});