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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import {
  formatPickupStatus,
  formatWasteCategory,
  listenResidentDashboard,
  updatePickupStatus,
} from "../../../services/dashboardService";
import type { FirestoreDate, PickupRequest, PickupStatus } from "../../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
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
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [filter, setFilter] = useState<FilterType>("active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    const unsubscribe = listenResidentDashboard(
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

    return unsubscribe;
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Requests</Text>
            <Text style={styles.headerSubtitle}>Track pickup status in real time</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={25} color={colors.primaryDark} />
          </View>
        </View>

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
              <Pressable key={item.id} style={[styles.filterPill, selected && styles.filterPillSelected]} onPress={() => setFilter(item.id)}>
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label} ({count})</Text>
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
      </ScrollView>
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

function RequestCard({
  request,
  updating,
  onCancel,
}: {
  request: PickupRequest;
  updating: boolean;
  onCancel: () => void;
}) {
  const statusColor = getStatusColor(request.status);
  const canCancel = ["submitted", "waiting_for_collector"].includes(request.status);

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

      {canCancel ? (
        <Pressable style={styles.cancelButton} onPress={onCancel} disabled={updating}>
          <Text style={styles.cancelText}>{updating ? "Cancelling..." : "Cancel Request"}</Text>
        </Pressable>
      ) : null}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 3, color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  headerIconWrap: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", ...softShadow },
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
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill },
  statusDot: { width: 7, height: 7, borderRadius: radius.pill },
  statusText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
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
  cancelButton: { height: 42, borderRadius: radius.md, backgroundColor: "#FFE7E7", alignItems: "center", justifyContent: "center", marginTop: spacing.lg },
  cancelText: { color: colors.danger, fontSize: 13, fontWeight: "900" },
  emptyCard: { minHeight: 210, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, ...softShadow },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: spacing.md, color: colors.text, fontSize: 18, fontWeight: "900" },
  emptySubtitle: { marginTop: spacing.xs, color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
});