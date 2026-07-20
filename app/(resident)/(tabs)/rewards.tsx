import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import {
  calculateEcoDrops,
  formatWasteCategory,
  listenResidentDashboard,
  type ResidentDashboardData,
} from "../../../services/dashboardService";
import type { PickupRequest } from "../../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

type RewardItem = {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: MaterialIconName;
  color: string;
};

const REWARD_ITEMS: RewardItem[] = [
  {
    id: "1",
    title: "LKR 250 Utility Bill Discount",
    description: "Apply discount to your monthly electricity or water bill.",
    cost: 80,
    icon: "lightning-bolt-outline",
    color: "#355C7D",
  },
  {
    id: "2",
    title: "Organic Compost Pack 5kg",
    description: "Recycled organic fertilizer for home gardening.",
    cost: 50,
    icon: "flower-outline",
    color: colors.primaryDark,
  },
  {
    id: "3",
    title: "LKR 500 Supermarket Voucher",
    description: "Redeemable at participating Eco Partner outlets.",
    cost: 150,
    icon: "shopping-outline",
    color: "#2C3E50",
  },
  {
    id: "4",
    title: "Plant a Tree in Your Area",
    description: "Eco Drop will sponsor a tree planting campaign in your GN division.",
    cost: 100,
    icon: "tree-outline",
    color: "#27AE60",
  },
];

export default function RewardsScreen() {
  const { profile } = useAuth();
  const [data, setData] = useState<ResidentDashboardData>({
    pickupRequests: [],
    smartBins: [],
  });
  const [loading, setLoading] = useState(true);
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;

    const unsubscribe = listenResidentDashboard(
      profile,
      (res) => {
        setData(res);
        setLoading(false);
      },
      (error) => {
        console.warn("Rewards screen listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile]);

  const totalDrops = calculateEcoDrops(data.pickupRequests);
  const completedRequests = data.pickupRequests.filter(
    (req) => req.status === "completed"
  );

  const getTier = (drops: number) => {
    if (drops >= 300) return { name: "Gold Eco Champion", color: "#F39C12" };
    if (drops >= 100) return { name: "Silver Recycler", color: "#95A5A6" };
    return { name: "Bronze Eco Green", color: colors.primaryDark };
  };

  const currentTier = getTier(totalDrops);

  const handleRedeem = (item: RewardItem) => {
    if (totalDrops < item.cost) {
      Alert.alert(
        "Insufficient Eco Drops",
        `You need ${item.cost} Eco Drops to redeem "${item.title}". You currently have ${totalDrops} Drops.`
      );
      return;
    }

    Alert.alert(
      "Confirm Redemption",
      `Redeem "${item.title}" for ${item.cost} Eco Drops?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem Now",
          onPress: () => {
            setRedeemedIds((prev) => [...prev, item.id]);
            Alert.alert(
              "Success!",
              `Voucher code generated: ECO-${Math.floor(
                100000 + Math.random() * 900000
              )}. Present this code at partner outlets.`
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ECO REWARDS PROGRAM</Text>
          <Text style={styles.headerTitle}>Eco Drops & Perks</Text>
        </View>

        <View style={styles.dropsCard}>
          <View style={styles.dropsTopRow}>
            <View>
              <Text style={styles.tierName}>{currentTier.name}</Text>
              <Text style={styles.residentName}>
                {profile?.fullName || "Resident"}
              </Text>
            </View>

            <View style={styles.trophyIconCircle}>
              <MaterialCommunityIcons
                name="trophy"
                size={28}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.dropsBalanceBlock}>
            <Text style={styles.dropsBalanceLabel}>Available Eco Drops</Text>
            <View style={styles.dropsValueRow}>
              <MaterialCommunityIcons
                name="leaf"
                size={34}
                color={colors.primary}
              />
              <Text style={styles.dropsValueText}>{totalDrops}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
        </View>

        <View style={styles.rewardList}>
          {REWARD_ITEMS.map((item) => {
            const isRedeemed = redeemedIds.includes(item.id);
            const canAfford = totalDrops >= item.cost;

            return (
              <View key={item.id} style={styles.rewardCard}>
                <View
                  style={[
                    styles.rewardIconWrap,
                    { backgroundColor: `${item.color}15` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={26}
                    color={item.color}
                  />
                </View>

                <View style={styles.rewardContent}>
                  <Text style={styles.rewardTitle}>{item.title}</Text>
                  <Text style={styles.rewardDescription}>{item.description}</Text>

                  <View style={styles.rewardMetaRow}>
                    <View style={styles.costBadge}>
                      <MaterialCommunityIcons
                        name="leaf"
                        size={14}
                        color={colors.primaryDark}
                      />
                      <Text style={styles.costText}>{item.cost} Drops</Text>
                    </View>

                    <Pressable
                      style={[
                        styles.redeemButton,
                        !canAfford && styles.disabledRedeem,
                        isRedeemed && styles.redeemedButton,
                      ]}
                      onPress={() => handleRedeem(item)}
                      disabled={isRedeemed}
                    >
                      <Text
                        style={[
                          styles.redeemText,
                          isRedeemed && styles.redeemedText,
                        ]}
                      >
                        {isRedeemed ? "Redeemed" : "Redeem"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earnings History</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primaryDark} style={{ marginVertical: spacing.lg }} />
        ) : completedRequests.length > 0 ? (
          <View style={styles.historyList}>
            {completedRequests.map((req) => (
              <EarningRow key={req.id} req={req} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="leaf"
              size={36}
              color={colors.primaryDark}
            />
            <Text style={styles.emptyTitle}>No Eco Drops yet</Text>
            <Text style={styles.emptySubtitle}>
              Request waste pickups to start earning Eco Drops for recycling!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EarningRow({ req }: { req: PickupRequest }) {
  const categoryLabel = formatWasteCategory(req.wasteCategory);

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyIconWrap}>
        <MaterialCommunityIcons
          name="check-circle"
          size={22}
          color={colors.primaryDark}
        />
      </View>

      <View style={styles.historyContent}>
        <Text style={styles.historyTitle}>{categoryLabel}</Text>
        <Text style={styles.historySubtitle}>
          {req.wasteDetails || req.location?.address || "Pickup Completed"}
        </Text>
      </View>

      <View style={styles.historyEarningBadge}>
        <Text style={styles.historyEarningText}>+{req.ecoDrops ?? 20} Drops</Text>
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
    paddingTop: spacing.lg,
    paddingBottom: 110,
  },
  header: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  headerTitle: {
    marginTop: 4,
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  dropsCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: "#0B2A16",
    marginBottom: spacing.xl,
    ...softShadow,
  },
  dropsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  tierName: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  residentName: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  trophyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  dropsBalanceBlock: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: spacing.md,
  },
  dropsBalanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dropsValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dropsValueText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  rewardList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  rewardCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: spacing.md,
    ...softShadow,
  },
  rewardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  rewardDescription: {
    marginTop: 3,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  rewardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EAF9F0",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  costText: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  redeemButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
  },
  disabledRedeem: {
    backgroundColor: "#C5D3CB",
  },
  redeemedButton: {
    backgroundColor: "#DCE5E0",
  },
  redeemText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  redeemedText: {
    color: "#54665D",
  },
  historyList: {
    gap: spacing.sm,
  },
  historyRow: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...softShadow,
  },
  historyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "#EAF9F0",
    alignItems: "center",
    justifyContent: "center",
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  historySubtitle: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "600",
  },
  historyEarningBadge: {
    backgroundColor: "#EAF9F0",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  historyEarningText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
  },
  emptyCard: {
    minHeight: 160,
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
    fontSize: 16,
    fontWeight: "900",
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});