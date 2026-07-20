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
  createRewardItem,
  deleteRewardItem,
  formatRewardCategory,
  listenRewardItems,
  toggleRewardStatus,
  type CreateRewardItemInput,
} from "../../services/rewardService";
import type { RewardCategory, RewardItem } from "../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const CATEGORIES: { id: RewardCategory | "all"; label: string }[] = [
  { id: "all", label: "All Rewards" },
  { id: "voucher", label: "Vouchers" },
  { id: "utility", label: "Bill Discounts" },
  { id: "eco_product", label: "Eco Products" },
  { id: "transit", label: "Transit Passes" },
];

export default function AdminRewardsScreen() {
  const { profile, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<RewardCategory | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RewardCategory>("voucher");
  const [costInEcoDrops, setCostInEcoDrops] = useState("100");
  const [originalValueLKR, setOriginalValueLKR] = useState("500");
  const [availableQuantity, setAvailableQuantity] = useState("50");
  const [sponsorName, setSponsorName] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenRewardItems(
      (items) => {
        setRewards(items);
        setLoading(false);
      },
      (error) => {
        console.warn("Reward items listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const visibleRewards = useMemo(() => {
    if (filter === "all") return rewards;
    return rewards.filter((r) => r.category === filter);
  }, [rewards, filter]);

  const stats = useMemo(() => {
    const total = rewards.length;
    const active = rewards.filter((r) => r.status === "active").length;
    const totalQuantity = rewards.reduce((sum, r) => sum + Number(r.availableQuantity || 0), 0);
    return { total, active, totalQuantity };
  }, [rewards]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    const cost = Number(costInEcoDrops);
    if (!title.trim() || !description.trim()) {
      Alert.alert("Required fields", "Please enter title and description.");
      return;
    }
    if (isNaN(cost) || cost <= 0) {
      Alert.alert("Invalid cost", "Please enter a valid cost in Eco Drops.");
      return;
    }

    try {
      setCreating(true);
      const input: CreateRewardItemInput = {
        title: title.trim(),
        description: description.trim(),
        category,
        costInEcoDrops: cost,
        originalValueLKR: Number(originalValueLKR) || 0,
        availableQuantity: Number(availableQuantity) || 50,
        sponsorName: sponsorName.trim() || "Eco-Drop Partner",
      };

      await createRewardItem(input);
      Alert.alert("Success", "Reward item created successfully!");
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create reward item.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (item: RewardItem) => {
    try {
      await toggleRewardStatus(item.id, item.status);
    } catch (error) {
      Alert.alert("Error", "Could not update status.");
    }
  };

  const handleDelete = (item: RewardItem) => {
    Alert.alert("Delete Reward", `Remove "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRewardItem(item.id);
          } catch (error) {
            Alert.alert("Error", "Could not delete reward.");
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("voucher");
    setCostInEcoDrops("100");
    setOriginalValueLKR("500");
    setAvailableQuantity("50");
    setSponsorName("");
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
            <Text style={styles.headerTitle}>Rewards Store</Text>
            <Text style={styles.headerSubtitle}>Eco-Drops redemption campaigns & vouchers</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="gift-outline" label="Rewards" value={String(stats.total)} />
          <StatCard icon="check-decagram-outline" label="Active" value={String(stats.active)} />
          <StatCard icon="package-variant-closed" label="Total Stock" value={String(stats.totalQuantity)} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {CATEGORIES.map((item) => {
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
            <Text style={styles.loadingText}>Loading rewards...</Text>
          </View>
        ) : visibleRewards.length > 0 ? (
          <View style={styles.rewardList}>
            {visibleRewards.map((item) => (
              <RewardCard
                key={item.id}
                item={item}
                onToggle={() => handleToggleStatus(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="gift-off-outline" size={40} color={colors.primaryDark} />
            <Text style={styles.emptyTitle}>No rewards added yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to create Eco-Drops vouchers or partner rewards.</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Reward Item</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Reward Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rs. 500 Supermarket Voucher"
                placeholderTextColor={colors.textSoft}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, { height: 72 }]}
                multiline
                placeholder="e.g. Valid at all Keells Super outlets nationwide."
                placeholderTextColor={colors.textSoft}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                  <Pressable
                    key={c.id}
                    style={[styles.smallPill, category === c.id && styles.smallPillSelected]}
                    onPress={() => setCategory(c.id as RewardCategory)}
                  >
                    <Text style={[styles.smallPillText, category === c.id && styles.smallPillTextSelected]}>
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Eco Drops Cost</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    placeholder="100"
                    placeholderTextColor={colors.textSoft}
                    value={costInEcoDrops}
                    onChangeText={setCostInEcoDrops}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>LKR Value (Rs.)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    placeholder="500"
                    placeholderTextColor={colors.textSoft}
                    value={originalValueLKR}
                    onChangeText={setOriginalValueLKR}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Stock Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    placeholder="50"
                    placeholderTextColor={colors.textSoft}
                    value={availableQuantity}
                    onChangeText={setAvailableQuantity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Sponsor / Partner</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Keells Super"
                    placeholderTextColor={colors.textSoft}
                    value={sponsorName}
                    onChangeText={setSponsorName}
                  />
                </View>
              </View>

              <Pressable style={styles.submitBtn} onPress={handleCreate} disabled={creating}>
                <Text style={styles.submitBtnText}>{creating ? "Saving..." : "Create Reward"}</Text>
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

function RewardCard({
  item,
  onToggle,
  onDelete,
}: {
  item: RewardItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isInactive = item.status !== "active";

  return (
    <View style={[styles.rewardCard, isInactive && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryPill}>
          <MaterialCommunityIcons name={getRewardIcon(item.category)} size={14} color={colors.primaryDark} />
          <Text style={styles.categoryText}>{formatRewardCategory(item.category)}</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, isInactive && styles.statusBadgeInactive]}>
            <Text style={[styles.statusText, isInactive && styles.statusTextInactive]}>
              {item.status.toUpperCase()}
            </Text>
          </View>

          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc}>{item.description}</Text>

      <View style={styles.metaRow}>
        <View style={styles.dropsPill}>
          <MaterialCommunityIcons name="leaf" size={14} color={colors.primaryDeep} />
          <Text style={styles.dropsText}>{item.costInEcoDrops} Eco Drops</Text>
        </View>

        {item.originalValueLKR ? (
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>Valued at Rs. {item.originalValueLKR}</Text>
          </View>
        ) : null}

        <View style={styles.metaPill}>
          <Text style={styles.metaText}>Stock: {item.availableQuantity}</Text>
        </View>
      </View>

      {item.sponsorName ? (
        <Text style={styles.sponsorText}>Provided by {item.sponsorName}</Text>
      ) : null}

      <Pressable style={[styles.toggleBtn, !isInactive && styles.toggleBtnActive]} onPress={onToggle}>
        <Text style={styles.toggleBtnText}>{isInactive ? "Activate Reward" : "Deactivate Reward"}</Text>
      </Pressable>
    </View>
  );
}

function getRewardIcon(cat: RewardCategory): MaterialIconName {
  if (cat === "voucher") return "ticket-percent-outline";
  if (cat === "utility") return "lightning-bolt-outline";
  if (cat === "transit") return "bus";
  return "shopping-outline";
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
  rewardList: { gap: spacing.md },
  rewardCard: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, ...softShadow },
  cardInactive: { opacity: 0.7 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  categoryPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft },
  categoryText: { fontSize: 11, fontWeight: "900", color: colors.primaryDark },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "#DDFBE7" },
  statusBadgeInactive: { backgroundColor: "#FFF6E5" },
  statusText: { fontSize: 10, fontWeight: "900", color: colors.primaryDeep },
  statusTextInactive: { color: "#8A5A00" },
  deleteBtn: { padding: 4 },
  cardTitle: { fontSize: 18, fontWeight: "900", color: colors.text },
  cardDesc: { fontSize: 13, fontWeight: "700", color: colors.textSoft, marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginVertical: spacing.md },
  dropsPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#DDFBE7" },
  dropsText: { fontSize: 12, fontWeight: "900", color: colors.primaryDeep },
  metaPill: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#F4F7F5" },
  metaText: { fontSize: 11, fontWeight: "800", color: colors.textSoft },
  sponsorText: { fontSize: 11, fontWeight: "800", color: colors.textSoft, marginBottom: spacing.sm },
  toggleBtn: { height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  toggleBtnActive: { backgroundColor: "#FFF6E5" },
  toggleBtnText: { fontSize: 12, fontWeight: "900", color: colors.text },
  emptyCard: { minHeight: 210, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, ...softShadow },
  emptyTitle: { marginTop: spacing.md, color: colors.text, fontSize: 18, fontWeight: "900" },
  emptySubtitle: { marginTop: spacing.xs, color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: "900", color: colors.text },
  inputLabel: { fontSize: 12, fontWeight: "800", color: colors.textSoft, marginTop: spacing.md, marginBottom: 6 },
  textInput: { height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, paddingHorizontal: spacing.md, fontSize: 14, fontWeight: "700", color: colors.text },
  inputRow: { flexDirection: "row", gap: spacing.md },
  pickerRow: { gap: spacing.xs, paddingVertical: 4 },
  smallPill: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft },
  smallPillSelected: { backgroundColor: colors.primaryDark },
  smallPillText: { fontSize: 12, fontWeight: "800", color: colors.textSoft },
  smallPillTextSelected: { color: "#FFFFFF" },
  submitBtn: { height: 48, borderRadius: radius.md, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center", marginTop: spacing.xl, marginBottom: spacing.md },
  submitBtnText: { fontSize: 14, fontWeight: "900", color: "#FFFFFF" },
});