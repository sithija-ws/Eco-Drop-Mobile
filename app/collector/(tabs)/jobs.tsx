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
  acceptPickupRequest,
  formatPickupStatus,
  formatWasteCategory,
  listenCollectorDashboard,
  updatePickupStatus,
} from "../../../services/dashboardService";
import type { PickupRequest, PickupStatus } from "../../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type FilterType = "incoming" | "active" | "completed" | "all";

const filters: { id: FilterType; label: string }[] = [
  { id: "incoming", label: "Incoming" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

const activeStatuses: PickupStatus[] = ["accepted", "collector_on_the_way", "collected"];

export default function CollectorJobsScreen() {
  const { profile, refreshProfile } = useAuth();
  const [assignedJobs, setAssignedJobs] = useState<PickupRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<PickupRequest[]>([]);
  const [filter, setFilter] = useState<FilterType>("incoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
        console.warn("Collector jobs listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile]);

  const stats = useMemo(() => {
    return {
      incoming: incomingRequests.length,
      active: assignedJobs.filter((job) => activeStatuses.includes(job.status)).length,
      completed: assignedJobs.filter((job) => job.status === "completed").length,
      all: incomingRequests.length + assignedJobs.length,
    };
  }, [assignedJobs, incomingRequests]);

  const visibleJobs = useMemo(() => {
    if (filter === "incoming") return incomingRequests;
    if (filter === "active") return assignedJobs.filter((job) => activeStatuses.includes(job.status));
    if (filter === "completed") return assignedJobs.filter((job) => job.status === "completed");
    return [...incomingRequests, ...assignedJobs];
  }, [filter, incomingRequests, assignedJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleAccept = async (request: PickupRequest) => {
    if (!profile) return;

    if (profile.status !== "active") {
      Alert.alert("Approval required", "Your collector account must be activated by admin before accepting jobs.");
      return;
    }

    try {
      setUpdatingId(request.id);
      await acceptPickupRequest(request.id, profile);
    } catch (error) {
      console.warn(error);
      Alert.alert("Accept failed", "Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNextStatus = async (job: PickupRequest) => {
    const nextStatus = getNextStatus(job.status);

    if (!nextStatus) {
      Alert.alert("No next status", "This job is already completed or cannot be updated.");
      return;
    }

    try {
      setUpdatingId(job.id);
      await updatePickupStatus(job.id, nextStatus);
    } catch (error) {
      console.warn(error);
      Alert.alert("Update failed", "Please try again.");
    } finally {
      setUpdatingId(null);
    }
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
            <Text style={styles.headerTitle}>Collector Jobs</Text>
            <Text style={styles.headerSubtitle}>Accept and update assigned pickup jobs</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="briefcase-outline" size={25} color={colors.primaryDark} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="inbox-outline" label="Incoming" value={String(stats.incoming)} />
          <StatCard icon="progress-clock" label="Active" value={String(stats.active)} />
          <StatCard icon="check-circle-outline" label="Done" value={String(stats.completed)} />
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
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : visibleJobs.length > 0 ? (
          <View style={styles.jobList}>
            {visibleJobs.map((job) => {
              const isIncoming = !job.collectorId;
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  isIncoming={isIncoming}
                  updating={updatingId === job.id}
                  onAccept={() => handleAccept(job)}
                  onNextStatus={() => handleNextStatus(job)}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="briefcase-check-outline" size={34} color={colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptySubtitle}>Jobs matching this filter will appear here.</Text>
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

function JobCard({
  job,
  isIncoming,
  updating,
  onAccept,
  onNextStatus,
}: {
  job: PickupRequest;
  isIncoming: boolean;
  updating: boolean;
  onAccept: () => void;
  onNextStatus: () => void;
}) {
  const statusColor = getStatusColor(job.status);
  const nextStatus = getNextStatus(job.status);

  return (
    <View style={styles.jobCard}>
      <View style={styles.jobTopRow}>
        <View style={styles.jobIconWrap}>
          <MaterialCommunityIcons name={getCategoryIcon(job.wasteCategory)} size={24} color={colors.primaryDark} />
        </View>

        <View style={styles.jobTextBlock}>
          <Text style={styles.jobTitle}>{formatWasteCategory(job.wasteCategory)}</Text>
          <Text style={styles.jobResident}>{job.residentName ?? "Resident"} • {job.residentPhone ?? "No phone"}</Text>
          <Text style={styles.jobAddress}>{job.location?.address ?? job.area?.gnDivision ?? "Pickup location"}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{formatPickupStatus(job.status)}</Text>
        </View>
      </View>

      <View style={styles.detailBox}>
        <Text style={styles.detailLabel}>Waste Details</Text>
        <Text style={styles.detailText}>{job.wasteDetails || "No extra details"}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="cash" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>Rs. {Number(job.price ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="leaf" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>+{job.ecoDrops ?? 0} Drops</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>{job.area?.gnDivision ?? "Area"}</Text>
        </View>
      </View>

      {isIncoming ? (
        <Pressable style={styles.acceptButton} onPress={onAccept} disabled={updating}>
          <Text style={styles.acceptText}>{updating ? "Accepting..." : "Accept Job"}</Text>
        </Pressable>
      ) : nextStatus ? (
        <Pressable style={styles.updateButton} onPress={onNextStatus} disabled={updating}>
          <Text style={styles.updateText}>{updating ? "Updating..." : `Mark as ${formatPickupStatus(nextStatus)}`}</Text>
        </Pressable>
      ) : (
        <View style={styles.completedBox}>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.completedText}>Job completed</Text>
        </View>
      )}
    </View>
  );
}

function getNextStatus(status: PickupStatus): PickupStatus | null {
  if (status === "accepted") return "collector_on_the_way";
  if (status === "collector_on_the_way") return "collected";
  if (status === "collected") return "completed";
  return null;
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
  jobList: { gap: spacing.md },
  jobCard: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, ...softShadow },
  jobTopRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  jobIconWrap: { width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  jobTextBlock: { flex: 1 },
  jobTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  jobResident: { marginTop: 3, color: colors.primaryDeep, fontSize: 12, fontWeight: "800" },
  jobAddress: { marginTop: 3, color: colors.textSoft, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill },
  statusDot: { width: 7, height: 7, borderRadius: radius.pill },
  statusText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  detailBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: "#F7FAF8" },
  detailLabel: { color: colors.textSoft, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  detailText: { marginTop: 4, color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#DDFBE7" },
  metaText: { color: colors.primaryDeep, fontSize: 11, fontWeight: "900" },
  acceptButton: { height: 44, borderRadius: radius.md, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center", marginTop: spacing.lg },
  acceptText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  updateButton: { height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: spacing.lg },
  updateText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  completedBox: { height: 44, borderRadius: radius.md, backgroundColor: "#DDFBE7", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.lg },
  completedText: { color: colors.primaryDeep, fontSize: 13, fontWeight: "900" },
  emptyCard: { minHeight: 210, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, ...softShadow },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: spacing.md, color: colors.text, fontSize: 18, fontWeight: "900" },
  emptySubtitle: { marginTop: spacing.xs, color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
});
