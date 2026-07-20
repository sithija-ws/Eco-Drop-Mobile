import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import { listenSchedulesByGnDivision } from "../../../services/adminScheduleService";
import {
  formatPickupStatus,
  formatWasteCategory,
  listenResidentDashboard,
  updatePickupStatus,
} from "../../../services/dashboardService";
import type { CollectionSchedule, FirestoreDate, PickupRequest, PickupStatus } from "../../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ViewMode = "my_pickups" | "division_schedules";
type FilterType = "active" | "completed" | "cancelled" | "all";

const filters: { id: FilterType; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

const activeStatuses: PickupStatus[] = [
  "submitted",
  "waiting_for_collector",
  "accepted",
  "collector_on_the_way",
  "collected",
];

export default function ResidentScheduleScreen() {
  const { profile, refreshProfile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("my_pickups");
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [divisionSchedules, setDivisionSchedules] = useState<CollectionSchedule[]>([]);
  const [filter, setFilter] = useState<FilterType>("active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingJob, setTrackingJob] = useState<PickupRequest | null>(null);

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    const unsubPickups = listenResidentDashboard(
      profile,
      ({ pickupRequests }) => {
        setRequests(pickupRequests);
        setLoading(false);
      },
      (error) => {
        console.warn("Resident requests listener error", error);
        setLoading(false);
      }
    );

    const unsubSchedules = listenSchedulesByGnDivision(
      profile.area?.gnDivision,
      (items) => setDivisionSchedules(items),
      (error) => console.warn("Division schedules listener error", error)
    );

    return () => {
      unsubPickups();
      unsubSchedules();
    };
  }, [profile]);

  const stats = useMemo(() => {
    return {
      active: requests.filter((item) => activeStatuses.includes(item.status)).length,
      completed: requests.filter((item) => item.status === "completed").length,
      cancelled: requests.filter((item) => ["cancelled", "rejected"].includes(item.status)).length,
      all: requests.length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (filter === "all") return requests;
    if (filter === "active") return requests.filter((item) => activeStatuses.includes(item.status));
    if (filter === "completed") return requests.filter((item) => item.status === "completed");
    return requests.filter((item) => ["cancelled", "rejected"].includes(item.status));
  }, [requests, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleCancel = (request: PickupRequest) => {
    Alert.alert(
      "Cancel pickup request",
      "Are you sure you want to cancel this pickup request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Cancel Request",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdatingId(request.id);
              await updatePickupStatus(request.id, "cancelled");
            } catch (error) {
              console.warn(error);
              Alert.alert("Cancel failed", "Please try again.");
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const callCollector = (phone?: string) => {
    if (!phone) {
      Alert.alert("No Phone Number", "Collector phone number is not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Error", "Cannot place call.");
    });
  };

  const activeOnTheWayJob = useMemo(
    () => requests.find((r) => r.status === "collector_on_the_way" || r.status === "accepted"),
    [requests]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Schedules & Route</Text>
            <Text style={styles.headerSubtitle}>
              {profile?.area?.gnDivision ?? "Your Area"} • Real-Time Tracking
            </Text>
          </View>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="bus-clock" size={25} color={colors.primaryDark} />
          </View>
        </View>

        {/* View Switcher Tabs */}
        <View style={styles.viewModeWrap}>
          <Pressable
            style={[styles.viewModeTab, viewMode === "my_pickups" && styles.viewModeTabActive]}
            onPress={() => setViewMode("my_pickups")}
          >
            <Text style={[styles.viewModeText, viewMode === "my_pickups" && styles.viewModeTextActive]}>
              My Pickups ({requests.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.viewModeTab, viewMode === "division_schedules" && styles.viewModeTabActive]}
            onPress={() => setViewMode("division_schedules")}
          >
            <Text style={[styles.viewModeText, viewMode === "division_schedules" && styles.viewModeTextActive]}>
              Division Routes ({divisionSchedules.length})
            </Text>
          </Pressable>
        </View>

        {/* Active Live Tracking Alert Banner */}
        {activeOnTheWayJob ? (
          <Pressable style={styles.liveBanner} onPress={() => setTrackingJob(activeOnTheWayJob)}>
            <View style={styles.liveIconWrap}>
              <MaterialCommunityIcons name="bus-marker" size={24} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.liveBadgeRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>TRACTOR ON THE WAY</Text>
              </View>
              <Text style={styles.liveTitle}>
                {activeOnTheWayJob.collectorName ?? "Collector Tractor"} is approaching
              </Text>
              <Text style={styles.liveSubtitle}>Tap to open real-time live map tracking</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.primaryDeep} />
          </Pressable>
        ) : null}

        {viewMode === "my_pickups" ? (
          <>
            <View style={styles.statsGrid}>
              <StatCard icon="clock-outline" label="Active" value={String(stats.active)} />
              <StatCard icon="check-circle-outline" label="Completed" value={String(stats.completed)} />
              <StatCard icon="clipboard-list-outline" label="Total" value={String(stats.all)} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {filters.map((item) => {
                const selected = filter === item.id;
                const count = stats[item.id];
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.filterPill, selected && styles.filterPillSelected]}
                    onPress={() => setFilter(item.id)}
                  >
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                      {item.label} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {loading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.primaryDark} />
                <Text style={styles.loadingText}>Loading your pickup requests...</Text>
              </View>
            ) : filteredRequests.length > 0 ? (
              <View style={styles.requestList}>
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    updating={updatingId === request.id}
                    onCancel={() => handleCancel(request)}
                    onTrack={() => setTrackingJob(request)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <MaterialCommunityIcons name="clipboard-check-outline" size={34} color={colors.primaryDark} />
                </View>
                <Text style={styles.emptyTitle}>No requests found</Text>
                <Text style={styles.emptySubtitle}>Pickup requests matching this filter will appear here.</Text>
              </View>
            )}
          </>
        ) : (
          /* Division Schedules List */
          <View style={styles.requestList}>
            {divisionSchedules.length > 0 ? (
              divisionSchedules.map((schedule) => (
                <DivisionScheduleCard key={schedule.id} schedule={schedule} />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="calendar-multiselect" size={36} color={colors.primaryDark} />
                <Text style={styles.emptyTitle}>No Division Schedules</Text>
                <Text style={styles.emptySubtitle}>
                  Recurring tractor schedules for {profile?.area?.gnDivision ?? "your division"} will appear here when posted by admins.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Live Tractor Real-Time Tracking Modal */}
      {trackingJob && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setTrackingJob(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <View style={styles.liveBadgeRow}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>LIVE TRACTOR TRACKING</Text>
                  </View>
                  <Text style={styles.modalTitle}>{formatWasteCategory(trackingJob.wasteCategory)}</Text>
                </View>

                <Pressable onPress={() => setTrackingJob(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              {/* Animated Map Vector Representation */}
              <View style={styles.liveMapCard}>
                <View style={[styles.mapRoadHorizontal, { top: 60 }]} />
                <View style={[styles.mapRoadHorizontal, { top: 120 }]} />
                <View style={[styles.mapRoadVertical, { left: 80 }]} />
                <View style={[styles.mapRoadVertical, { right: 80 }]} />

                <View style={styles.residentMarker}>
                  <Ionicons name="home-sharp" size={16} color="#FFFFFF" />
                  <Text style={styles.residentMarkerText}>Your Location</Text>
                </View>

                {/* Moving Tractor Marker */}
                <View style={styles.tractorMarker}>
                  <MaterialCommunityIcons name="truck-delivery" size={20} color="#FFFFFF" />
                  <Text style={styles.tractorMarkerText}>Tractor #WP-8821</Text>
                </View>
              </View>

              <View style={styles.etaBox}>
                <View>
                  <Text style={styles.etaLabel}>Estimated Arrival Time</Text>
                  <Text style={styles.etaValue}>10 - 15 Mins</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{formatPickupStatus(trackingJob.status)}</Text>
                </View>
              </View>

              <View style={styles.driverSection}>
                <View style={styles.driverAvatar}>
                  <MaterialCommunityIcons name="account-hard-hat" size={28} color={colors.primaryDark} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{trackingJob.collectorName ?? "Assigned Collector"}</Text>
                  <Text style={styles.driverSub}>Collector Tractor Driver • 4.9 ★</Text>
                </View>

                <Pressable
                  style={styles.callDriverBtn}
                  onPress={() => callCollector(trackingJob.residentPhone)}
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value }: { icon: MaterialIconName; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.primaryDark} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DivisionScheduleCard({ schedule }: { schedule: CollectionSchedule }) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTopRow}>
        <View style={styles.categoryIconWrap}>
          <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.primaryDark} />
        </View>

        <View style={styles.requestTextBlock}>
          <Text style={styles.requestTitle}>{schedule.title}</Text>
          <Text style={styles.requestAddress}>
            {schedule.dayOfWeek} • {schedule.timeSlot}
          </Text>
          <Text style={styles.requestDate}>Area: {schedule.gnDivision}</Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{schedule.wasteCategory.toUpperCase()}</Text>
        </View>
      </View>

      {schedule.assignedCollectorName ? (
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="truck-outline" size={13} color={colors.primaryDeep} />
            <Text style={styles.metaText}>Tractor: {schedule.assignedCollectorName}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function RequestCard({
  request,
  updating,
  onCancel,
  onTrack,
}: {
  request: PickupRequest;
  updating: boolean;
  onCancel: () => void;
  onTrack: () => void;
}) {
  const statusColor = getStatusColor(request.status);
  const canCancel = ["submitted", "waiting_for_collector"].includes(request.status);
  const isTrackingAvailable = ["accepted", "collector_on_the_way", "collected"].includes(request.status);

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTopRow}>
        <View style={styles.categoryIconWrap}>
          <MaterialCommunityIcons name={getCategoryIcon(request.wasteCategory)} size={24} color={colors.primaryDark} />
        </View>

        <View style={styles.requestTextBlock}>
          <Text style={styles.requestTitle}>{formatWasteCategory(request.wasteCategory)}</Text>
          <Text style={styles.requestAddress}>{request.location?.address ?? request.area?.gnDivision ?? "Pickup location"}</Text>
          <Text style={styles.requestDate}>Created: {formatDate(request.createdAt)}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{formatPickupStatus(request.status)}</Text>
        </View>
      </View>

      <View style={styles.detailBox}>
        <Text style={styles.detailLabel}>Waste Details</Text>
        <Text style={styles.detailText}>{request.wasteDetails || "No extra details"}</Text>
      </View>

      <StatusTimeline status={request.status} />

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="leaf" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>+{request.ecoDrops ?? 0} Drops</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="cash" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>Rs. {Number(request.price ?? 0).toFixed(2)}</Text>
        </View>
        {request.collectorName ? (
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="account-hard-hat" size={13} color={colors.primaryDeep} />
            <Text style={styles.metaText}>{request.collectorName}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionBtnRow}>
        {isTrackingAvailable ? (
          <Pressable style={styles.trackButton} onPress={onTrack}>
            <MaterialCommunityIcons name="bus-marker" size={16} color="#FFFFFF" />
            <Text style={styles.trackText}>Track Live Tractor</Text>
          </Pressable>
        ) : null}

        {canCancel ? (
          <Pressable style={styles.cancelButton} onPress={onCancel} disabled={updating}>
            <Text style={styles.cancelText}>{updating ? "Cancelling..." : "Cancel Request"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function StatusTimeline({ status }: { status: PickupStatus }) {
  const steps: { key: PickupStatus; label: string }[] = [
    { key: "submitted", label: "Submitted" },
    { key: "accepted", label: "Accepted" },
    { key: "collector_on_the_way", label: "On Way" },
    { key: "completed", label: "Done" },
  ];

  const currentIndex = getTimelineIndex(status);
  const isCancelled = ["cancelled", "rejected"].includes(status);

  return (
    <View style={styles.timelineWrap}>
      {steps.map((step, index) => {
        const active = !isCancelled && index <= currentIndex;
        return (
          <React.Fragment key={step.key}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, active && styles.timelineDotActive, isCancelled && styles.timelineDotCancelled]} />
              <Text style={[styles.timelineLabel, active && styles.timelineLabelActive]}>{step.label}</Text>
            </View>
            {index < steps.length - 1 ? <View style={[styles.timelineLine, active && styles.timelineLineActive]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function getTimelineIndex(status: PickupStatus) {
  if (status === "submitted" || status === "waiting_for_collector") return 0;
  if (status === "accepted") return 1;
  if (status === "collector_on_the_way" || status === "collected") return 2;
  if (status === "completed") return 3;
  return 0;
}

function formatDate(value: FirestoreDate) {
  if (!value) return "Pending";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }
  return "Pending";
}

function getCategoryIcon(category?: string): MaterialIconName {
  if (category === "organic") return "food-apple-outline";
  if (category === "paper") return "file-document-outline";
  if (category === "glass") return "bottle-wine-outline";
  if (category === "electronic") return "laptop";
  if (category === "mixed") return "trash-can-outline";
  return "recycle";
}

function getStatusColor(status: PickupStatus) {
  if (status === "completed") return colors.primaryDark;
  if (["cancelled", "rejected"].includes(status)) return colors.danger;
  if (["accepted", "collector_on_the_way", "collected"].includes(status)) return colors.info;
  return "#B7791F";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 105 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 3, color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  headerIconWrap: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", ...softShadow },
  viewModeWrap: { flexDirection: "row", backgroundColor: colors.surfaceSoft, borderRadius: radius.pill, padding: 4, marginBottom: spacing.lg },
  viewModeTab: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  viewModeTabActive: { backgroundColor: colors.surface, ...softShadow },
  viewModeText: { color: colors.textSoft, fontSize: 12, fontWeight: "800" },
  viewModeTextActive: { color: colors.primaryDark, fontWeight: "900" },
  liveBanner: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: "#DDFBE7", marginBottom: spacing.lg, ...softShadow },
  liveIconWrap: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center" },
  liveBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  liveDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: "#E73D3D" },
  liveBadgeText: { fontSize: 10, fontWeight: "900", color: colors.primaryDeep, letterSpacing: 0.5 },
  liveTitle: { fontSize: 14, fontWeight: "900", color: colors.text },
  liveSubtitle: { fontSize: 11, fontWeight: "700", color: colors.textSoft, marginTop: 2 },
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: "center", ...softShadow },
  statValue: { marginTop: 4, color: colors.text, fontSize: 22, fontWeight: "900" },
  statLabel: { color: colors.textSoft, fontSize: 10, fontWeight: "800" },
  filterRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  filterPill: { height: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  filterPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSoft, fontSize: 12, fontWeight: "900" },
  filterTextSelected: { color: "#FFFFFF" },
  loadingCard: { minHeight: 160, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: spacing.sm, ...softShadow },
  loadingText: { color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  requestList: { gap: spacing.md },
  requestCard: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, ...softShadow },
  requestTopRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  categoryIconWrap: { width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  requestTextBlock: { flex: 1 },
  requestTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  requestAddress: { marginTop: 3, color: colors.textSoft, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  requestDate: { marginTop: 3, color: colors.muted, fontSize: 11, fontWeight: "700" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#F4F7F5" },
  statusDot: { width: 7, height: 7, borderRadius: radius.pill },
  statusText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase", color: colors.textSoft },
  detailBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: "#F7FAF8" },
  detailLabel: { color: colors.textSoft, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  detailText: { marginTop: 4, color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  timelineWrap: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg },
  timelineStep: { alignItems: "center", width: 62 },
  timelineDot: { width: 14, height: 14, borderRadius: radius.pill, backgroundColor: "#D8E2DC" },
  timelineDotActive: { backgroundColor: colors.primaryDark },
  timelineDotCancelled: { backgroundColor: colors.danger },
  timelineLabel: { marginTop: 5, color: colors.textSoft, fontSize: 9, fontWeight: "800" },
  timelineLabelActive: { color: colors.primaryDeep },
  timelineLine: { flex: 1, height: 3, borderRadius: radius.pill, backgroundColor: "#D8E2DC", marginHorizontal: -12, marginBottom: 18 },
  timelineLineActive: { backgroundColor: colors.primary },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#DDFBE7" },
  metaText: { color: colors.primaryDeep, fontSize: 11, fontWeight: "900" },
  actionBtnRow: { gap: spacing.sm, marginTop: spacing.lg },
  trackButton: { height: 44, borderRadius: radius.md, backgroundColor: colors.primaryDark, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  trackText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  cancelButton: { height: 42, borderRadius: radius.md, backgroundColor: "#FFE7E7", alignItems: "center", justifyContent: "center" },
  cancelText: { color: colors.danger, fontSize: 13, fontWeight: "900" },
  emptyCard: { minHeight: 210, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, ...softShadow },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: spacing.md, color: colors.text, fontSize: 18, fontWeight: "900" },
  emptySubtitle: { marginTop: spacing.xs, color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },

  // Live Map Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  modalTitle: { fontSize: 22, fontWeight: "900", color: colors.text },
  closeBtn: { padding: 4 },
  liveMapCard: { height: 210, borderRadius: radius.xl, backgroundColor: "#E4F4EA", overflow: "hidden", marginVertical: spacing.md, position: "relative" },
  mapRoadHorizontal: { position: "absolute", width: "100%", height: 16, backgroundColor: "#FFFFFF" },
  mapRoadVertical: { position: "absolute", height: "100%", width: 16, backgroundColor: "#FFFFFF" },
  residentMarker: { position: "absolute", top: 48, right: 30, backgroundColor: colors.primaryDeep, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", gap: 4 },
  residentMarkerText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  tractorMarker: { position: "absolute", top: 110, left: 60, backgroundColor: "#E73D3D", paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", gap: 4 },
  tractorMarkerText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  etaBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceSoft, marginBottom: spacing.md },
  etaLabel: { fontSize: 11, fontWeight: "800", color: colors.textSoft },
  etaValue: { fontSize: 20, fontWeight: "900", color: colors.text, marginTop: 2 },
  statusPill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#DDFBE7" },
  statusPillText: { fontSize: 11, fontWeight: "900", color: colors.primaryDeep },
  driverSection: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: "#F7FAF8" },
  driverAvatar: { width: 50, height: 50, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  driverName: { fontSize: 15, fontWeight: "900", color: colors.text },
  driverSub: { fontSize: 12, fontWeight: "700", color: colors.textSoft, marginTop: 2 },
  callDriverBtn: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center" },
});