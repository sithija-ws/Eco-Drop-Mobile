import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type IonIconName = React.ComponentProps<typeof Ionicons>["name"];

type QuickAction = {
  id: string;
  title: string;
  icon: MaterialIconName;
  iconColor: string;
  iconBg: string;
  primary?: boolean;
};

type BinHealth = {
  id: string;
  name: string;
  percent: number;
  status: string;
  color: string;
};

type RequestItem = {
  id: string;
  title: string;
  description: string;
  badge: string;
  time: string;
  icon: MaterialIconName;
  iconBg: string;
  iconColor: string;
  highPriority?: boolean;
};

const quickActions: QuickAction[] = [
  {
    id: "1",
    title: "Reschedule Route",
    icon: "routes",
    iconColor: "#355C7D",
    iconBg: "#EEF3FF",
  },
  {
    id: "2",
    title: "Issue Alert",
    icon: "bullhorn-outline",
    iconColor: colors.danger,
    iconBg: "#FFF0F0",
  },
  {
    id: "3",
    title: "Download Report",
    icon: "download-outline",
    iconColor: "#355C7D",
    iconBg: "#EEF3FF",
  },
  {
    id: "4",
    title: "New Task",
    icon: "plus",
    iconColor: "#FFFFFF",
    iconBg: "rgba(255,255,255,0.22)",
    primary: true,
  },
];

const binHealth: BinHealth[] = [
  {
    id: "1",
    name: "Bin ST-01 (Market)",
    percent: 95,
    status: "95% Full",
    color: colors.danger,
  },
  {
    id: "2",
    name: "Bin RS-12 (Park Road)",
    percent: 65,
    status: "65% Full",
    color: "#4D6258",
  },
  {
    id: "3",
    name: "Bin RS-15 (School)",
    percent: 20,
    status: "20% Full",
    color: colors.primary,
  },
];

const requests: RequestItem[] = [
  {
    id: "1",
    title: "Missed Pickup - Lane 4",
    description: "Resident reported bin not cleared...",
    badge: "High Priority",
    time: "2h ago",
    icon: "alert-outline",
    iconBg: "#E9F3FF",
    iconColor: "#5A7FA8",
    highPriority: true,
  },
  {
    id: "2",
    title: "Bulk E-Waste Pickup",
    description: "Requested special transport for old...",
    badge: "Review",
    time: "5h ago",
    icon: "recycle",
    iconBg: "#EAF9F0",
    iconColor: colors.primaryDark,
  },
  {
    id: "3",
    title: "Schedule Inquiry",
    description: "Asking about holiday collection times.",
    badge: "Info",
    time: "1d ago",
    icon: "help",
    iconBg: "#E7F1FF",
    iconColor: "#5A7FA8",
  },
];

export default function AdminDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Area Admin Dashboard</Text>
          <Text style={styles.areaTitle}>Colombo North - 04</Text>

          <View style={styles.liveBadge}>
            <View style={styles.liveIconCircle}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={22}
                color={colors.primaryDeep}
              />
            </View>
            <View>
              <Text style={styles.liveTitle}>GN Office Active</Text>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Tracking Live</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Total Pickups"
            value="142"
            helper="+12% vs yesterday"
            icon="truck-outline"
            iconColor={colors.primaryDeep}
          />
          <StatCard
            label="Active Teams"
            value="08"
            helper="2 routes pending"
            icon="account-group-outline"
            iconColor="#355C7D"
          />
        </View>

        <View style={styles.overflowCard}>
          <View style={styles.overflowTopRow}>
            <Text style={styles.overflowLabel}>Overflow Alerts</Text>
            <MaterialCommunityIcons
              name="alert-outline"
              size={26}
              color={colors.danger}
            />
          </View>
          <Text style={styles.overflowValue}>03</Text>
          <Text style={styles.overflowHelper}>Require immediate action</Text>
        </View>

        <View style={styles.tractorCard}>
          <View style={styles.tractorTopRow}>
            <View style={styles.tractorIconWrap}>
              <MaterialCommunityIcons
                name="tractor-variant"
                size={29}
                color={colors.primaryDeep}
              />
            </View>

            <View style={styles.tractorTextBlock}>
              <Text style={styles.tractorTitle}>Tractor Alpha-1</Text>
              <Text style={styles.tractorSubtitle}>Route: Sector B</Text>
              <Text style={styles.tractorSubtitle}>(Residential)</Text>
            </View>

            <View style={styles.etaBlock}>
              <Text style={styles.etaLabel}>ETA Next Sector</Text>
              <Text style={styles.etaValue}>14 mins</Text>
            </View>
          </View>

          <MapPreview />
        </View>

        <View style={styles.healthCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Smart Bin Health</Text>
            <Pressable hitSlop={8}>
              <Text style={styles.sectionAction}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.binList}>
            {binHealth.map((item) => (
              <BinHealthRow key={item.id} item={item} />
            ))}
          </View>
        </View>

        <View style={styles.queueCard}>
          <View style={styles.queueHeaderRow}>
            <Text style={styles.sectionTitle}>Requests Queue</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>4</Text>
            </View>
          </View>

          <View style={styles.requestList}>
            {requests.map((item) => (
              <RequestRow key={item.id} item={item} />
            ))}
          </View>

          <Pressable style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Requests</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  if (action.primary) {
    return (
      <Pressable style={({ pressed }) => [styles.quickCardPrimary, pressed && styles.pressed]}>
        <View style={[styles.quickIconCircle, { backgroundColor: action.iconBg }]}>
          <MaterialCommunityIcons name={action.icon} size={28} color={action.iconColor} />
        </View>
        <Text style={styles.quickTitlePrimary}>{action.title}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
      <View style={[styles.quickIconCircle, { backgroundColor: action.iconBg }]}>
        <MaterialCommunityIcons name={action.icon} size={25} color={action.iconColor} />
      </View>
      <Text style={styles.quickTitle}>{action.title}</Text>
    </Pressable>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  helper: string;
  icon: MaterialIconName;
  iconColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTopRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <MaterialCommunityIcons name={icon} size={27} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statHelperRow}>
        <MaterialCommunityIcons name="swap-vertical" size={15} color={colors.primaryDeep} />
        <Text style={styles.statHelper}>{helper}</Text>
      </View>
    </View>
  );
}

function MapPreview() {
  const pins = [
    { left: "43%", top: "25%" },
    { left: "61%", top: "36%" },
    { left: "35%", top: "56%" },
    { left: "70%", top: "61%" },
    { left: "28%", top: "76%" },
    { left: "51%", top: "73%" },
  ] as const;

  return (
    <LinearGradient
      colors={["#073331", "#0B4B45", "#082928"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.mapPreview}
    >
      <View style={styles.mapTopBar}>
        <View style={styles.mapStatusPill}>
          <View style={styles.completedDot} />
          <Text style={styles.mapStatusText}>Completed</Text>
        </View>
        <View style={styles.mapStatusPillLight}>
          <View style={styles.progressDot} />
          <Text style={styles.mapStatusText}>In Progress</Text>
        </View>
      </View>

      <View style={styles.mapGrid}>
        <View style={[styles.mapGridLineHorizontal, { top: "18%" }]} />
        <View style={[styles.mapGridLineHorizontal, { top: "36%" }]} />
        <View style={[styles.mapGridLineHorizontal, { top: "54%" }]} />
        <View style={[styles.mapGridLineHorizontal, { top: "72%" }]} />
        <View style={[styles.mapGridLineVertical, { left: "22%" }]} />
        <View style={[styles.mapGridLineVertical, { left: "44%" }]} />
        <View style={[styles.mapGridLineVertical, { left: "66%" }]} />
        <View style={[styles.mapGridLineVertical, { left: "82%" }]} />
      </View>

      <View style={styles.routeOne} />
      <View style={styles.routeTwo} />
      <View style={styles.routeThree} />

      {pins.map((pin, index) => (
        <View key={index} style={[styles.tinyPin, { left: pin.left, top: pin.top }]} />
      ))}

      <View style={styles.tractorMarker}>
        <MaterialCommunityIcons name="tractor-variant" size={23} color="#FFFFFF" />
      </View>
    </LinearGradient>
  );
}

function BinHealthRow({ item }: { item: BinHealth }) {
  const width = `${item.percent}%` as `${number}%`;

  return (
    <View style={styles.binRow}>
      <View style={styles.binHeaderRow}>
        <Text style={styles.binName}>{item.name}</Text>
        <Text style={[styles.binStatus, { color: item.color }]}>{item.status}</Text>
      </View>
      <View style={styles.binTrack}>
        <View style={[styles.binFill, { width, backgroundColor: item.color }]} />
      </View>
    </View>
  );
}

function RequestRow({ item }: { item: RequestItem }) {
  return (
    <Pressable style={({ pressed }) => [styles.requestRow, pressed && styles.pressed]}>
      <View style={[styles.requestIconWrap, { backgroundColor: item.iconBg }]}>
        <MaterialCommunityIcons name={item.icon} size={20} color={item.iconColor} />
      </View>

      <View style={styles.requestContent}>
        <Text style={styles.requestTitle}>{item.title}</Text>
        <Text style={styles.requestDescription}>{item.description}</Text>
        <View style={styles.requestMetaRow}>
          <View style={[styles.requestBadge, item.highPriority && styles.highPriorityBadge]}>
            <Text style={[styles.requestBadgeText, item.highPriority && styles.highPriorityText]}>
              {item.badge}
            </Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{item.time}</Text>
          </View>
        </View>
      </View>
    </Pressable>
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
    paddingBottom: 105,
  },
  headerBlock: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: "#172B4D",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  areaTitle: {
    marginTop: spacing.sm,
    color: "#070A0D",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  liveBadge: {
    marginTop: spacing.lg,
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    paddingRight: spacing.lg,
    gap: spacing.sm,
    ...softShadow,
  },
  liveIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  liveTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  liveRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  liveText: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickCard: {
    width: "48.6%",
    minHeight: 106,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    ...softShadow,
  },
  quickCardPrimary: {
    width: "48.6%",
    minHeight: 106,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    ...softShadow,
  },
  quickIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  quickTitle: {
    color: "#070A0D",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  quickTitlePrimary: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minHeight: 126,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...softShadow,
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#172B4D",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    lineHeight: 17,
    textTransform: "uppercase",
    maxWidth: 88,
  },
  statValue: {
    marginTop: spacing.xs,
    color: "#070A0D",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  statHelperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statHelper: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 14,
    maxWidth: 96,
  },
  overflowCard: {
    minHeight: 138,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  overflowTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overflowLabel: {
    color: "#172B4D",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.7,
    textTransform: "uppercase",
  },
  overflowValue: {
    marginTop: spacing.lg,
    color: "#070A0D",
    fontSize: 34,
    fontWeight: "900",
  },
  overflowHelper: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "900",
  },
  tractorCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...softShadow,
  },
  tractorTopRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
  },
  tractorIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: "#DFF8E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  tractorTextBlock: {
    flex: 1,
  },
  tractorTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  tractorSubtitle: {
    color: "#172B4D",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  etaBlock: {
    alignItems: "flex-end",
    maxWidth: 84,
  },
  etaLabel: {
    color: "#172B4D",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    textAlign: "right",
  },
  etaValue: {
    marginTop: spacing.xs,
    color: colors.primaryDeep,
    fontSize: 22,
    fontWeight: "900",
  },
  mapPreview: {
    height: 266,
    overflow: "hidden",
    backgroundColor: "#073331",
  },
  mapTopBar: {
    position: "absolute",
    zIndex: 5,
    top: spacing.lg,
    left: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 5,
  },
  mapStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapStatusPillLight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  completedDot: {
    width: 13,
    height: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  progressDot: {
    width: 13,
    height: 13,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#0CA6A6",
  },
  mapStatusText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  mapGrid: {
    position: "absolute",
    left: "15%",
    right: "15%",
    top: "10%",
    bottom: "8%",
    borderWidth: 1,
    borderColor: "rgba(68, 255, 222, 0.13)",
  },
  mapGridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(68,255,222,0.08)",
  },
  mapGridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(68,255,222,0.08)",
  },
  routeOne: {
    position: "absolute",
    width: "58%",
    height: 2,
    left: "20%",
    top: "49%",
    backgroundColor: "rgba(50,255,208,0.34)",
    transform: [{ rotate: "-25deg" }],
  },
  routeTwo: {
    position: "absolute",
    width: "38%",
    height: 2,
    right: "18%",
    top: "36%",
    backgroundColor: "rgba(50,255,208,0.22)",
    transform: [{ rotate: "20deg" }],
  },
  routeThree: {
    position: "absolute",
    width: "43%",
    height: 2,
    left: "25%",
    bottom: "25%",
    backgroundColor: "rgba(50,255,208,0.22)",
    transform: [{ rotate: "18deg" }],
  },
  tinyPin: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "#21E6C1",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
  },
  tractorMarker: {
    position: "absolute",
    left: "48%",
    top: "43%",
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.78)",
  },
  healthCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionAction: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  binList: {
    gap: spacing.md,
  },
  binRow: {
    gap: spacing.sm,
  },
  binHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  binName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  binStatus: {
    fontSize: 12,
    fontWeight: "900",
  },
  binTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "#DCEBE2",
    overflow: "hidden",
  },
  binFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  queueCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  queueHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  countBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: "#D8E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: "#5A7FA8",
    fontSize: 13,
    fontWeight: "900",
  },
  requestList: {
    gap: spacing.sm,
  },
  requestRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#D7E0DA",
    backgroundColor: "#FAFCFB",
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  requestIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  requestContent: {
    flex: 1,
  },
  requestTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  requestDescription: {
    marginTop: 2,
    color: "#54665D",
    fontSize: 12,
    fontWeight: "700",
  },
  requestMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  requestBadge: {
    borderRadius: 6,
    backgroundColor: "#DFF8E9",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  requestBadgeText: {
    color: colors.primaryDeep,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  highPriorityBadge: {
    backgroundColor: "#FFE7E7",
  },
  highPriorityText: {
    color: colors.danger,
  },
  timeBadge: {
    borderRadius: 6,
    backgroundColor: "#D9E0E4",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  timeBadgeText: {
    color: "#45525C",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  viewAllButton: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#B8C9BE",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  viewAllText: {
    color: "#172B4D",
    fontSize: 15,
    fontWeight: "800",
  },
});