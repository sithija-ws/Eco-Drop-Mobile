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
  formatWasteCategory,
  listenCollectorDashboard,
} from "../../../services/dashboardService";
import type { FirestoreDate, PickupRequest } from "../../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type EarningsFilter = "today" | "week" | "all";

const filters: { id: EarningsFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "all", label: "All Time" },
];

export default function CollectorWalletScreen() {
  const { profile, refreshProfile } = useAuth();
  const [assignedJobs, setAssignedJobs] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<EarningsFilter>("today");

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    const unsubscribe = listenCollectorDashboard(
      profile,
      ({ assignedJobs: jobs }) => {
        setAssignedJobs(jobs);
        setLoading(false);
      },
      (error) => {
        console.warn("Collector wallet listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile]);

  const completedJobs = useMemo(
    () => assignedJobs.filter((job) => job.status === "completed"),
    [assignedJobs]
  );

  const earnings = useMemo(() => {
    const todayJobs = completedJobs.filter((job) => isToday(job.completedAt));
    const weekJobs = completedJobs.filter((job) => isThisWeek(job.completedAt));

    const today = sumPrices(todayJobs);
    const week = sumPrices(weekJobs);
    const all = sumPrices(completedJobs);

    return {
      today,
      week,
      all,
      todayJobs,
      weekJobs,
      allJobs: completedJobs,
      completedCount: completedJobs.length,
    };
  }, [completedJobs]);

  const visibleJobs = useMemo(() => {
    if (filter === "today") return earnings.todayJobs;
    if (filter === "week") return earnings.weekJobs;
    return earnings.allJobs;
  }, [earnings, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleWithdraw = () => {
    Alert.alert(
      "Payout coming soon",
      "Payment gateway and collector payout requests will be connected in the backend/payment phase."
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
            <Text style={styles.headerTitle}>Wallet</Text>
            <Text style={styles.headerSubtitle}>Track real earnings from completed jobs</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="wallet-outline" size={25} color={colors.primaryDark} />
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <Text style={styles.balanceLabel}>Available Earnings</Text>
            <View style={styles.secureBadge}>
              <MaterialCommunityIcons name="shield-check" size={13} color={colors.primaryDeep} />
              <Text style={styles.secureBadgeText}>Firebase Live</Text>
            </View>
          </View>

          <Text style={styles.balanceValue}>Rs. {earnings.all.toFixed(2)}</Text>
          <Text style={styles.balanceSubtext}>Total from {earnings.completedCount} completed job(s)</Text>

          <Pressable style={styles.withdrawButton} onPress={handleWithdraw}>
            <Ionicons name="card-outline" size={18} color="#FFFFFF" />
            <Text style={styles.withdrawText}>Request Payout</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="calendar-outline"
            label="Today"
            value={`Rs. ${earnings.today.toFixed(0)}`}
          />

          <StatCard
            icon="calendar-month-outline"
            label="This Week"
            value={`Rs. ${earnings.week.toFixed(0)}`}
          />

          <StatCard
            icon="check-circle-outline"
            label="Completed"
            value={String(earnings.completedCount)}
          />
        </View>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={22} color={colors.primaryDark} />
          <Text style={styles.infoText}>
            Earnings are calculated from pickup requests marked as completed. Payout integration will be added later.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earnings History</Text>
          <Text style={styles.sectionAction}>{visibleJobs.length} job(s)</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((item) => {
            const selected = filter === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.filterPill, selected && styles.filterPillSelected]}
                onPress={() => setFilter(item.id)}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.loadingText}>Loading wallet data...</Text>
          </View>
        ) : visibleJobs.length > 0 ? (
          <View style={styles.jobList}>
            {visibleJobs.map((job) => (
              <EarningRow key={job.id} job={job} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="wallet-plus-outline" size={34} color={colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No earnings yet</Text>
            <Text style={styles.emptySubtitle}>Completed pickup jobs will appear in your wallet history.</Text>
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

function EarningRow({ job }: { job: PickupRequest }) {
  return (
    <View style={styles.earningRow}>
      <View style={styles.earningIconWrap}>
        <MaterialCommunityIcons name="cash-check" size={22} color={colors.primaryDark} />
      </View>

      <View style={styles.earningContent}>
        <Text style={styles.earningTitle}>{formatWasteCategory(job.wasteCategory)}</Text>
        <Text style={styles.earningSubtitle}>{job.residentName ?? "Resident"} • {formatDate(job.completedAt)}</Text>
        <Text style={styles.earningAddress} numberOfLines={1}>{job.location?.address ?? job.area?.gnDivision ?? "Pickup location"}</Text>
      </View>

      <View style={styles.earningRightBlock}>
        <Text style={styles.earningAmount}>Rs. {Number(job.price ?? 0).toFixed(2)}</Text>
        <Text style={styles.earningStatus}>Completed</Text>
      </View>
    </View>
  );
}

function toDate(value: FirestoreDate) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate() as Date;
  }
  return null;
}

function isToday(value: FirestoreDate) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isThisWeek(value: FirestoreDate) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  return date.getTime() >= start.getTime();
}

function sumPrices(jobs: PickupRequest[]) {
  return jobs.reduce((total, job) => total + Number(job.price ?? 0), 0);
}

function formatDate(value: FirestoreDate) {
  const date = toDate(value);
  if (!date) return "Date pending";
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 105 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 3, color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  headerIconWrap: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", ...softShadow },
  balanceCard: { padding: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.darkCard, marginBottom: spacing.lg, ...softShadow },
  balanceTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  balanceLabel: { color: "#DCE9E2", fontSize: 13, fontWeight: "800" },
  secureBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primary },
  secureBadgeText: { color: colors.primaryDeep, fontSize: 10, fontWeight: "900" },
  balanceValue: { marginTop: spacing.md, color: "#FFFFFF", fontSize: 38, fontWeight: "900", letterSpacing: -1 },
  balanceSubtext: { marginTop: 4, color: "#DCE9E2", fontSize: 12, fontWeight: "700" },
  withdrawButton: { marginTop: spacing.lg, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  withdrawText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: "center", ...softShadow },
  statValue: { marginTop: 4, color: colors.text, fontSize: 16, fontWeight: "900" },
  statLabel: { color: colors.textSoft, fontSize: 10, fontWeight: "800" },
  infoCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: "#DDFBE7", marginBottom: spacing.lg },
  infoText: { flex: 1, color: colors.primaryDeep, fontSize: 12, lineHeight: 18, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  sectionAction: { color: colors.primaryDeep, fontSize: 12, fontWeight: "900" },
  filterRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  filterPill: { height: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  filterPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSoft, fontSize: 12, fontWeight: "900" },
  filterTextSelected: { color: "#FFFFFF" },
  loadingCard: { minHeight: 160, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: spacing.sm, ...softShadow },
  loadingText: { color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  jobList: { gap: spacing.md },
  earningRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, ...softShadow },
  earningIconWrap: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  earningContent: { flex: 1 },
  earningTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
  earningSubtitle: { marginTop: 3, color: colors.textSoft, fontSize: 11, fontWeight: "700" },
  earningAddress: { marginTop: 2, color: colors.muted, fontSize: 11, fontWeight: "700" },
  earningRightBlock: { alignItems: "flex-end" },
  earningAmount: { color: colors.primaryDeep, fontSize: 14, fontWeight: "900" },
  earningStatus: { marginTop: 2, color: colors.textSoft, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  emptyCard: { minHeight: 210, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, ...softShadow },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: spacing.md, color: colors.text, fontSize: 18, fontWeight: "900" },
  emptySubtitle: { marginTop: spacing.xs, color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
});
