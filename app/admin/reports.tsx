import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import {
  createWasteReport,
  listenAllReports,
  updateReportStatus,
} from "../../services/adminService";
import type {
  ReportCategory,
  ReportStatus,
  WasteReport,
} from "../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

type FilterType = "all" | "open" | "in_progress" | "resolved";

const filters: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
];

const categories: { id: ReportCategory; label: string }[] = [
  { id: "missed_pickup", label: "Missed Pickup" },
  { id: "overflowing_bin", label: "Overflowing Bin" },
  { id: "illegal_dumping", label: "Illegal Dumping" },
  { id: "other", label: "Other Issue" },
];

export default function AdminReportsScreen() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenAllReports(
      (items) => {
        setReports(items);
        setLoading(false);
      },
      (error) => {
        console.warn("Admin reports listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    return {
      all: reports.length,
      open: reports.filter((r) => r.status === "open").length,
      in_progress: reports.filter((r) => r.status === "in_progress").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (filter === "all") return reports;
    return reports.filter((r) => r.status === filter);
  }, [reports, filter]);

  const handleStatusChange = async (report: WasteReport, status: ReportStatus) => {
    try {
      setUpdatingId(report.id);
      await updateReportStatus(report.id, status);
    } catch (error) {
      console.warn(error);
      Alert.alert("Update failed", "Could not update report status.");
    } finally {
      setUpdatingId(null);
    }
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
            <Text style={styles.headerTitle}>Reports & Issues</Text>
            <Text style={styles.headerSubtitle}>
              Monitor & resolve resident issues
            </Text>
          </View>

          <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="alert-outline"
            label="Open"
            value={String(stats.open)}
            warning={stats.open > 0}
          />
          <StatCard
            icon="progress-wrench"
            label="In Progress"
            value={String(stats.in_progress)}
          />
          <StatCard
            icon="check-circle-outline"
            label="Resolved"
            value={String(stats.resolved)}
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
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : filteredReports.length > 0 ? (
          <View style={styles.reportList}>
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                updating={updatingId === report.id}
                onSetInProgress={() => handleStatusChange(report, "in_progress")}
                onResolve={() => handleStatusChange(report, "resolved")}
                onReopen={() => handleStatusChange(report, "open")}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={36}
              color={colors.primaryDark}
            />
            <Text style={styles.emptyTitle}>No reports found</Text>
            <Text style={styles.emptySubtitle}>
              Reports matching this status will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      <CreateReportModal
        visible={modalVisible}
        user={profile}
        onClose={() => setModalVisible(false)}
      />
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
        color={warning ? colors.danger : colors.primaryDark}
      />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReportCard({
  report,
  updating,
  onSetInProgress,
  onResolve,
  onReopen,
}: {
  report: WasteReport;
  updating: boolean;
  onSetInProgress: () => void;
  onResolve: () => void;
  onReopen: () => void;
}) {
  const statusColor = getStatusColor(report.status);
  const categoryLabel = getCategoryLabel(report.category);

  return (
    <View style={styles.reportCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {report.status.replace(/_/g, " ")}
          </Text>
        </View>
      </View>

      <Text style={styles.reportTitle}>{report.title}</Text>
      <Text style={styles.reportDescription}>{report.description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          By: {report.reporterName || "User"} ({report.reporterRole || "resident"})
        </Text>
        {report.location?.address ? (
          <Text style={styles.metaText}>📍 {report.location.address}</Text>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        {report.status === "open" && (
          <Pressable
            style={[styles.actionButton, styles.progressButton]}
            onPress={onSetInProgress}
            disabled={updating}
          >
            <Text style={styles.progressText}>
              {updating ? "Updating..." : "In Progress"}
            </Text>
          </Pressable>
        )}

        {report.status !== "resolved" && (
          <Pressable
            style={[styles.actionButton, styles.resolveButton]}
            onPress={onResolve}
            disabled={updating}
          >
            <Text style={styles.resolveText}>
              {updating ? "Updating..." : "Resolve"}
            </Text>
          </Pressable>
        )}

        {report.status === "resolved" && (
          <Pressable
            style={[styles.actionButton, styles.reopenButton]}
            onPress={onReopen}
            disabled={updating}
          >
            <Text style={styles.reopenText}>Re-open Issue</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function CreateReportModal({
  visible,
  user,
  onClose,
}: {
  visible: boolean;
  user: ReturnType<typeof useAuth>["profile"];
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<ReportCategory>("missed_pickup");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setAddress("");
    setCategory("missed_pickup");
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Authentication required", "Please login again.");
      return;
    }

    try {
      setSaving(true);
      await createWasteReport(user, {
        title,
        description,
        category,
        address,
      });
      reset();
      onClose();
      Alert.alert("Report created", "Issue reported successfully.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not create report.";
      Alert.alert("Failed", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Report / Issue</Text>
            <Pressable style={styles.modalClose} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.choiceWrap}>
              {categories.map((item) => {
                const selected = category === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.choicePill, selected && styles.choicePillSelected]}
                    onPress={() => setCategory(item.id)}
                  >
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Bin overflowing at Lane 3"
            />

            <Input
              label="Details / Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Provide context regarding the issue..."
              multiline
            />

            <Input
              label="Location / Address"
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. Main Street, Sector B"
            />

            <Pressable
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? "Submitting..." : "Submit Report"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA8A0"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function getStatusColor(status?: ReportStatus) {
  if (status === "resolved") return colors.primaryDark;
  if (status === "in_progress") return "#355C7D";
  return colors.danger;
}

function getCategoryLabel(cat?: ReportCategory) {
  const map: Record<ReportCategory, string> = {
    missed_pickup: "Missed Pickup",
    overflowing_bin: "Overflowing Bin",
    illegal_dumping: "Illegal Dumping",
    other: "Other Issue",
  };
  return map[cat ?? "other"] ?? "Report";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
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
  addButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
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
  reportList: {
    gap: spacing.md,
  },
  reportCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: "#F0F5F2",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  categoryText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  reportTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  reportDescription: {
    marginTop: 4,
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  metaRow: {
    marginTop: spacing.md,
    gap: 2,
  },
  metaText: {
    color: "#7A8A80",
    fontSize: 11,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  progressButton: {
    backgroundColor: "#EEF3FF",
  },
  progressText: {
    color: "#355C7D",
    fontSize: 12,
    fontWeight: "900",
  },
  resolveButton: {
    backgroundColor: colors.primaryDark,
  },
  resolveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  reopenButton: {
    backgroundColor: "#FFF0F0",
  },
  reopenText: {
    color: colors.danger,
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "90%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "#F4F7F5",
    alignItems: "center",
    justifyContent: "center",
  },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 7,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F7FAF8",
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  multilineInput: {
    minHeight: 82,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  choicePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: "#F4F7F5",
  },
  choicePillSelected: { backgroundColor: colors.primaryDark },
  choiceText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
  },
  choiceTextSelected: { color: "#FFFFFF" },
  saveButton: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  saveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  disabledButton: { opacity: 0.6 },
});
