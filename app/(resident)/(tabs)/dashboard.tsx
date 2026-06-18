import React from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type SmartBin = {
  id: string;
  name: string;
  type: string;
  distance: string;
  fill: number;
  color: string;
};

type Activity = {
  id: string;
  icon: MaterialIconName;
  title: string;
  subtitle: string;
  points?: string;
  status: string;
  color: string;
};

const { width } = Dimensions.get("window");

const stats = [
  { label: "Completed", value: "18", icon: "check-circle-outline" as MaterialIconName },
  { label: "Pending", value: "02", icon: "clock-outline" as MaterialIconName },
  { label: "Eco Drops", value: "1.2k", icon: "leaf" as MaterialIconName },
];

const smartBins: SmartBin[] = [
  {
    id: "1",
    name: "Marina Drive",
    type: "Plastic",
    distance: "240m away",
    fill: 0.45,
    color: colors.primaryDark,
  },
  {
    id: "2",
    name: "Galle Road",
    type: "Organic",
    distance: "480m away",
    fill: 0.86,
    color: colors.danger,
  },
];

const activities: Activity[] = [
  {
    id: "1",
    icon: "recycle",
    title: "Plastic Recycling",
    subtitle: "2.4 kg • 2 hours ago",
    points: "+46 Drops",
    status: "Completed",
    color: colors.primaryDark,
  },
  {
    id: "2",
    icon: "truck-fast-outline",
    title: "Doorstep Pickup",
    subtitle: "Scheduled • Tomorrow",
    status: "Pending",
    color: colors.info,
  },
  {
    id: "3",
    icon: "food-apple-outline",
    title: "Organic Waste",
    subtitle: "1.8 kg • Yesterday",
    points: "+20 Drops",
    status: "Completed",
    color: colors.primaryDark,
  },
];

export default function ResidentDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location-sharp" size={18} color={colors.primaryDark} />
            </View>
            <View>
              <Text style={styles.brandText}>ECO-DROP</Text>
              <Text style={styles.locationText}>Colombo • Himantha • GN 123</Text>
            </View>
          </View>

          <Pressable style={styles.iconButton} hitSlop={10}>
            <Ionicons name="notifications-outline" size={21} color={colors.text} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.welcomeCard}>
          <View>
            <Text style={styles.welcomeTitle}>Hello, Himantha 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              Let&apos;s make our environment cleaner today 🌱
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <MaterialCommunityIcons name="leaf" size={14} color={colors.primaryDeep} />
            <Text style={styles.levelBadgeText}>Eco Hero</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color={colors.primaryDark}
              />
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.pickupCard}>
          <LinearGradient
            colors={["#F2FFD8", "#BCEB83", "#6CCF8D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pickupIllustration}
          >
            <View style={styles.onTheWayPill}>
              <View style={styles.liveDot} />
              <Text style={styles.onTheWayText}>On the way</Text>
            </View>

            <View style={styles.sun} />
            <View style={[styles.fieldLine, styles.fieldLineOne]} />
            <View style={[styles.fieldLine, styles.fieldLineTwo]} />
            <View style={[styles.fieldLine, styles.fieldLineThree]} />
            <View style={styles.road} />
            <View style={styles.tree} />
            <View style={styles.truckCircle}>
              <MaterialCommunityIcons
                name="truck-delivery"
                size={58}
                color={colors.primaryDeep}
              />
            </View>
          </LinearGradient>

          <View style={styles.pickupInfoRow}>
            <View style={styles.pickupTextBlock}>
              <Text style={styles.pickupTitle}>Upcoming GN Tractor</Text>
              <Text style={styles.pickupDescription}>
                Your local waste collection vehicle is approximately 1.2km away.
                Please ensure your sorted bins are accessible.
              </Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>10:15</Text>
              <Text style={styles.timePeriod}>AM</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.requestButton,
            pressed && styles.pressedButton,
          ]}
          onPress={() => router.push("/request-pickup")}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.requestButtonText}>Request Pickup</Text>
        </Pressable>

        <SectionHeader
          title="Nearby Smart Bins"
          action="View Map"
          onPress={() => router.push("/bins")}
        />

        <View style={styles.binGrid}>
          {smartBins.map((bin) => (
            <SmartBinCard key={bin.id} bin={bin} />
          ))}
        </View>

        <View style={styles.rewardsCard}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.rewardsLabel}>Eco Rewards</Text>
            <View style={styles.goldBadge}>
              <MaterialCommunityIcons name="trophy" size={12} color={colors.primaryDeep} />
              <Text style={styles.goldBadgeText}>Gold Level</Text>
            </View>
          </View>
          <Text style={styles.dropsText}>1,240 Drops</Text>
          <View style={styles.progressInfoRow}>
            <Text style={styles.progressLabel}>Progress to Platinum</Text>
            <Text style={styles.progressPercent}>80%</Text>
          </View>
          <View style={styles.rewardProgressTrack}>
            <View style={styles.rewardProgressFill} />
          </View>
          <View style={styles.protectedBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#FFFFFF" />
            <Text style={styles.protectedBadgeText}>Secure Platform Protected</Text>
          </View>
        </View>

        <SectionHeader title="Recent Activity" />

        <View style={styles.activityList}>
          {activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SmartBinCard({ bin }: { bin: SmartBin }) {
  const percentage = Math.round(bin.fill * 100);

  return (
    <Pressable style={styles.binCard}>
      <View style={styles.binTopRow}>
        <View style={styles.binIconBox}>
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.primaryDark} />
        </View>
        <View style={styles.typePill}>
          <Text style={styles.typePillText}>{bin.type}</Text>
        </View>
      </View>
      <Text style={styles.binName}>{bin.name}</Text>
      <Text style={styles.binDistance}>{bin.distance}</Text>
      <View style={styles.binFillTrack}>
        <View
          style={[
            styles.binFillBar,
            { width: `${percentage}%`, backgroundColor: bin.color },
          ]}
        />
      </View>
      <Text style={[styles.binFillText, { color: bin.color }]}>{percentage}% full</Text>
    </Pressable>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <Pressable style={styles.activityRow}>
      <View style={[styles.activityIconBox, { backgroundColor: `${activity.color}14` }]}>
        <MaterialCommunityIcons name={activity.icon} size={19} color={activity.color} />
      </View>
      <View style={styles.activityTextBlock}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
      </View>
      <View style={styles.activityRightBlock}>
        {activity.points ? <Text style={styles.activityPoints}>{activity.points}</Text> : null}
        <Text
          style={[
            styles.activityStatus,
            activity.status === "Pending" && styles.pendingStatus,
          ]}
        >
          {activity.status}
        </Text>
      </View>
    </Pressable>
  );
}

const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;

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
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  locationIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.primaryDark,
  },
  locationText: {
    marginTop: 1,
    fontSize: 11,
    color: colors.textSoft,
    fontWeight: "600",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  welcomeCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    ...softShadow,
  },
  welcomeTitle: {
    fontSize: 17,
    color: colors.text,
    fontWeight: "900",
  },
  welcomeSubtitle: {
    marginTop: spacing.xs,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSoft,
    maxWidth: width * 0.58,
    fontWeight: "600",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.primaryDeep,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    ...softShadow,
  },
  statValue: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 10,
    color: colors.textSoft,
    fontWeight: "700",
  },
  pickupCard: {
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...softShadow,
  },
  pickupIllustration: {
    height: 150,
    overflow: "hidden",
  },
  onTheWayPill: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
  },
  onTheWayText: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.primaryDeep,
  },
  sun: {
    position: "absolute",
    top: 26,
    right: 38,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  fieldLine: {
    position: "absolute",
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.8)",
    transform: [{ rotate: "-14deg" }],
  },
  fieldLineOne: {
    width: 260,
    left: -38,
    bottom: 46,
  },
  fieldLineTwo: {
    width: 320,
    left: 10,
    bottom: 78,
  },
  fieldLineThree: {
    width: 260,
    right: -80,
    bottom: 25,
  },
  road: {
    position: "absolute",
    left: -40,
    bottom: 16,
    width: width + 90,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: "rgba(33, 67, 49, 0.24)",
    transform: [{ rotate: "-13deg" }],
  },
  tree: {
    position: "absolute",
    top: 54,
    left: 48,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: "rgba(21, 91, 49, 0.55)",
    borderBottomWidth: 15,
    borderBottomColor: "rgba(104,72,35,0.38)",
  },
  truckCircle: {
    position: "absolute",
    left: width * 0.38,
    bottom: 42,
    width: 86,
    height: 70,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  pickupInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.lg,
  },
  pickupTextBlock: {
    flex: 1,
  },
  pickupTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },
  pickupDescription: {
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSoft,
    fontWeight: "600",
  },
  timeBlock: {
    alignItems: "flex-end",
    minWidth: 62,
  },
  timeText: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primaryDeep,
  },
  timePeriod: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primaryDeep,
    lineHeight: 21,
  },
  requestButton: {
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  pressedButton: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  requestButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "900",
  },
  sectionAction: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: "900",
  },
  binGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  binCard: {
    width: cardWidth,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  binTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  binIconBox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
  },
  typePillText: {
    fontSize: 8,
    color: colors.primaryDeep,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  binName: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
  },
  binDistance: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
  },
  binFillTrack: {
    height: 7,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: "#EDF2EF",
    marginTop: spacing.md,
  },
  binFillBar: {
    height: "100%",
    borderRadius: radius.pill,
  },
  binFillText: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: "900",
  },
  rewardsCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.darkCard,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  rewardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardsLabel: {
    fontSize: 12,
    color: "#DCE9E2",
    fontWeight: "700",
  },
  goldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  goldBadgeText: {
    color: colors.primaryDeep,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dropsText: {
    marginTop: spacing.xs,
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  progressInfoRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: "#EAF4EF",
    fontSize: 11,
    fontWeight: "700",
  },
  progressPercent: {
    color: "#EAF4EF",
    fontSize: 11,
    fontWeight: "900",
  },
  rewardProgressTrack: {
    marginTop: spacing.sm,
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  rewardProgressFill: {
    width: "80%",
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  protectedBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.13)",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  protectedBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  activityList: {
    gap: spacing.sm,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...softShadow,
  },
  activityIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  activityTextBlock: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "900",
  },
  activitySubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textSoft,
    fontWeight: "600",
  },
  activityRightBlock: {
    alignItems: "flex-end",
  },
  activityPoints: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  activityStatus: {
    marginTop: 2,
    color: colors.primaryDeep,
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  pendingStatus: {
    color: colors.textSoft,
    fontSize: 11,
    textTransform: "none",
  },
});
