import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import {
  createCollectionSchedule,
  deleteCollectionSchedule,
  listenCollectionSchedules,
  toggleScheduleStatus,
  type CreateScheduleInput,
} from "../../services/adminScheduleService";
import { formatWasteCategory } from "../../services/dashboardService";
import type { CollectionSchedule, DayOfWeek, WasteCategory } from "../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORIES: (WasteCategory | "all")[] = ["all", "plastic", "organic", "paper", "glass", "electronic", "mixed"];

export default function AdminScheduleScreen() {
  const { profile, refreshProfile } = useAuth();
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [gnDivision, setGnDivision] = useState(profile?.area?.gnDivision || "Colombo Central");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("Monday");
  const [timeSlot, setTimeSlot] = useState("08:00 AM - 11:00 AM");
  const [wasteCategory, setWasteCategory] = useState<WasteCategory | "all">("plastic");
  const [collectorName, setCollectorName] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenCollectionSchedules(
      (items) => {
        setSchedules(items);
        setLoading(false);
      },
      (error) => {
        console.warn("Collection schedules listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredSchedules = useMemo(() => {
    if (selectedDay === "all") return schedules;
    return schedules.filter((s) => s.dayOfWeek === selectedDay);
  }, [schedules, selectedDay]);

  const stats = useMemo(() => {
    const total = schedules.length;
    const active = schedules.filter((s) => s.status === "active").length;
    const divisions = new Set(schedules.map((s) => s.gnDivision)).size;
    return { total, active, divisions };
  }, [schedules]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !gnDivision.trim()) {
      Alert.alert("Required fields", "Please fill in schedule title and GN Division.");
      return;
    }

    try {
      setCreating(true);
      const input: CreateScheduleInput = {
        title: title.trim(),
        gnDivision: gnDivision.trim(),
        wasteCategory,
        dayOfWeek,
        timeSlot: timeSlot.trim() || "08:00 AM - 11:00 AM",
        assignedCollectorName: collectorName.trim(),
      };

      await createCollectionSchedule(input);
      Alert.alert("Success", "Collection schedule created!");
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create schedule.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (item: CollectionSchedule) => {
    try {
      await toggleScheduleStatus(item.id, item.status);
    } catch (error) {
      Alert.alert("Error", "Could not update status.");
    }
  };

  const handleDelete = (item: CollectionSchedule) => {
    Alert.alert("Delete Schedule", `Remove "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCollectionSchedule(item.id);
          } catch (error) {
            Alert.alert("Error", "Could not delete schedule.");
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setTitle("");
    setCollectorName("");
    setWasteCategory("plastic");
    setDayOfWeek("Monday");
    setTimeSlot("08:00 AM - 11:00 AM");
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
            <Text style={styles.headerTitle}>Collection Schedule</Text>
            <Text style={styles.headerSubtitle}>Manage recurring area pickup routes</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="calendar-check-outline" label="Total Routes" value={String(stats.total)} />
          <StatCard icon="play-circle-outline" label="Active Routes" value={String(stats.active)} />
          <StatCard icon="map-marker-multiple-outline" label="Divisions" value={String(stats.divisions)} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable
            style={[styles.filterPill, selectedDay === "all" && styles.filterPillSelected]}
            onPress={() => setSelectedDay("all")}
          >
            <Text style={[styles.filterText, selectedDay === "all" && styles.filterTextSelected]}>All Days</Text>
          </Pressable>

          {DAYS.map((day) => (
            <Pressable
              key={day}
              style={[styles.filterPill, selectedDay === day && styles.filterPillSelected]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.filterText, selectedDay === day && styles.filterTextSelected]}>{day}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.loadingText}>Loading schedules...</Text>
          </View>
        ) : filteredSchedules.length > 0 ? (
          <View style={styles.scheduleList}>
            {filteredSchedules.map((item) => (
              <ScheduleCard
                key={item.id}
                item={item}
                onToggle={() => handleToggleStatus(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={colors.primaryDark} />
            <Text style={styles.emptyTitle}>No collection routes</Text>
            <Text style={styles.emptySubtitle}>Tap the + button above to schedule recurring pickup routes.</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Collection Schedule</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Schedule Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Weekly Plastic Route - Central"
                placeholderTextColor={colors.textSoft}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>GN Division</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Cinnamon Gardens"
                placeholderTextColor={colors.textSoft}
                value={gnDivision}
                onChangeText={setGnDivision}
              />

              <Text style={styles.inputLabel}>Day of Week</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {DAYS.map((d) => (
                  <Pressable
                    key={d}
                    style={[styles.smallPill, dayOfWeek === d && styles.smallPillSelected]}
                    onPress={() => setDayOfWeek(d)}
                  >
                    <Text style={[styles.smallPillText, dayOfWeek === d && styles.smallPillTextSelected]}>{d}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Time Slot</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 08:00 AM - 11:00 AM"
                placeholderTextColor={colors.textSoft}
                value={timeSlot}
                onChangeText={setTimeSlot}
              />

              <Text style={styles.inputLabel}>Waste Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.smallPill, wasteCategory === c && styles.smallPillSelected]}
                    onPress={() => setWasteCategory(c)}
                  >
                    <Text style={[styles.smallPillText, wasteCategory === c && styles.smallPillTextSelected]}>
                      {c === "all" ? "All Waste" : formatWasteCategory(c)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Assigned Collector (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Saman Kumara"
                placeholderTextColor={colors.textSoft}
                value={collectorName}
                onChangeText={setCollectorName}
              />

              <Pressable style={styles.submitBtn} onPress={handleCreate} disabled={creating}>
                <Text style={styles.submitBtnText}>{creating ? "Saving..." : "Create Schedule"}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

function ScheduleCard({
  item,
  onToggle,
  onDelete,
}: {
  item: CollectionSchedule;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isPaused = item.status === "paused";

  return (
    <View style={[styles.scheduleCard, isPaused && styles.cardPaused]}>
      <View style={styles.cardHeader}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayText}>{item.dayOfWeek}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, isPaused && styles.statusBadgePaused]}>
            <Text style={[styles.statusText, isPaused && styles.statusTextPaused]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardTimeSlot}>{item.timeSlot}</Text>

      <View style={styles.cardMetaRow}>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>{item.gnDivision}</Text>
        </View>

        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="recycle" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>{item.wasteCategory === "all" ? "All Waste" : formatWasteCategory(item.wasteCategory)}</Text>
        </View>

        {item.assignedCollectorName ? (
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="account-outline" size={13} color={colors.primaryDeep} />
            <Text style={styles.metaText}>{item.assignedCollectorName}</Text>
          </View>
        ) : null}
      </View>

      <Pressable style={[styles.toggleBtn, isPaused && styles.toggleBtnActive]} onPress={onToggle}>
        <Text style={styles.toggleBtnText}>{isPaused ? "Activate Route" : "Pause Route"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 105 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 3, color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  addBtn: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center", ...softShadow },
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
  scheduleList: { gap: spacing.md },
  scheduleCard: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, ...softShadow },
  cardPaused: { opacity: 0.7 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  dayBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft },
  dayText: { fontSize: 11, fontWeight: "900", color: colors.primaryDark },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "#DDFBE7" },
  statusBadgePaused: { backgroundColor: "#FFF6E5" },
  statusText: { fontSize: 10, fontWeight: "900", color: colors.primaryDeep },
  statusTextPaused: { color: "#8A5A00" },
  deleteBtn: { padding: 4 },
  cardTitle: { fontSize: 18, fontWeight: "900", color: colors.text },
  cardTimeSlot: { fontSize: 13, fontWeight: "700", color: colors.textSoft, marginTop: 2 },
  cardMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginVertical: spacing.md },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: "#F4F7F5" },
  metaText: { fontSize: 11, fontWeight: "800", color: colors.textSoft },
  toggleBtn: { height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  toggleBtnActive: { backgroundColor: "#DDFBE7" },
  toggleBtnText: { fontSize: 12, fontWeight: "900", color: colors.primaryDark },
  emptyCard: { minHeight: 210, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, ...softShadow },
  emptyTitle: { marginTop: spacing.md, color: colors.text, fontSize: 18, fontWeight: "900" },
  emptySubtitle: { marginTop: spacing.xs, color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: "900", color: colors.text },
  inputLabel: { fontSize: 12, fontWeight: "800", color: colors.textSoft, marginTop: spacing.md, marginBottom: 6 },
  textInput: { height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, paddingHorizontal: spacing.md, fontSize: 14, fontWeight: "700", color: colors.text },
  pickerRow: { gap: spacing.xs, paddingVertical: 4 },
  smallPill: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft },
  smallPillSelected: { backgroundColor: colors.primaryDark },
  smallPillText: { fontSize: 12, fontWeight: "800", color: colors.textSoft },
  smallPillTextSelected: { color: "#FFFFFF" },
  submitBtn: { height: 48, borderRadius: radius.md, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center", marginTop: spacing.xl, marginBottom: spacing.md },
  submitBtnText: { fontSize: 14, fontWeight: "900", color: "#FFFFFF" },
});