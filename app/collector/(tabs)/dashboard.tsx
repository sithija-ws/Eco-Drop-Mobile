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
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

type RequestItem = {
  id: string;
  title: string;
  address: string;
  distance: string;
  price: string;
  previewType: "map" | "home";
};

const incomingRequests: RequestItem[] = [
  {
    id: "1",
    title: "Plastic & Glass",
    address: "Industrial Park • Unit 45",
    distance: "1.2 km away",
    price: "$12.00",
    previewType: "map",
  },
  {
    id: "2",
    title: "Electronic Waste",
    address: "77 Sunset Blvd, West Hills",
    distance: "3.8 km away",
    price: "$28.90",
    previewType: "home",
  },
];

export default function CollectorDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.locationIconWrap}>
              <Ionicons
                name="location-outline"
                size={17}
                color={colors.primaryDark}
              />
            </View>

            <Text style={styles.brandText}>ECO-DROP</Text>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>

            <Pressable style={styles.iconButton} hitSlop={10}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.text}
              />
            </Pressable>
          </View>
        </View>

        {/* Secure label */}
        <View style={styles.secureRow}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={13}
            color={colors.primaryDark}
          />
          <Text style={styles.secureText}>Secure Platform Protected</Text>
        </View>

        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>Good Morning, Alex</Text>
          <Text style={styles.greetingSubtitle}>
            Your collection route is ready for today.
          </Text>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="wallet-outline"
            label="Today's Earnings"
            value="$142.50"
            helper="+12% vs yesterday"
          />

          <SummaryCard
            icon="check-circle-outline"
            label="Jobs Completed"
            value="24"
            helper="8/12 Goals"
            showProgress
          />
        </View>

        {/* Active Job */}
        <SectionHeader title="Active Job" />

        <View style={styles.activeJobCard}>
          <View style={styles.activeJobTop}>
            <ActiveLocationPreview />

            <View style={styles.activeContent}>
              <View style={styles.activeTitleRow}>
                <Text style={styles.activeTitle}>Pine Heights Residential</Text>

                <View style={styles.progressBadge}>
                  <Text style={styles.progressBadgeText}>In Progress</Text>
                </View>
              </View>

              <Text style={styles.activeSubtitle}>
                2A2 Maple St, North Sector
              </Text>
            </View>
          </View>

          <View style={styles.activeActions}>
            <Pressable style={styles.navigateButton}>
              <MaterialCommunityIcons
                name="navigation-variant"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.navigateText}>Navigate</Text>
            </Pressable>

            <Pressable style={styles.callButton}>
              <Ionicons
                name="call-outline"
                size={18}
                color={colors.primaryDeep}
              />
            </Pressable>
          </View>
        </View>

        {/* Incoming Requests */}
        <SectionHeader title="Incoming Requests" action="See all" />

        <View style={styles.requestList}>
          {incomingRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
  showProgress,
}: {
  icon: MaterialIconName;
  label: string;
  value: string;
  helper: string;
  showProgress?: boolean;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTopRow}>
        <View style={styles.summaryIconWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={colors.primaryDark}
          />
        </View>

        <Text style={styles.summaryHelper}>{helper}</Text>
      </View>

      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>

      {showProgress ? (
        <View style={styles.summaryProgressTrack}>
          <View style={styles.summaryProgressFill} />
        </View>
      ) : null}
    </View>
  );
}

function ActiveLocationPreview() {
  return (
    <LinearGradient
      colors={["#DCEFE2", "#BFD7C4", "#7FA486"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.activePreview}
    >
      <View style={styles.activeRoad} />
      <View style={styles.activeHouse} />
      <View style={styles.activeHouseRoof} />
      <View style={styles.activeTreeOne} />
      <View style={styles.activeTreeTwo} />
      <View style={styles.activeBin} />
    </LinearGradient>
  );
}

function RequestCard({ request }: { request: RequestItem }) {
  return (
    <View style={styles.requestCard}>
      {request.previewType === "map" ? <MiniMap /> : <HomePreview />}

      <View style={styles.distanceBadge}>
        <Text style={styles.distanceText}>{request.distance}</Text>
      </View>

      <View style={styles.requestInfoRow}>
        <View style={styles.requestTextBlock}>
          <Text style={styles.requestTitle}>{request.title}</Text>
          <Text style={styles.requestAddress}>{request.address}</Text>
        </View>

        <Text style={styles.priceText}>{request.price}</Text>
      </View>

      <View style={styles.requestActions}>
        <Pressable style={styles.declineButton}>
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>

        <Pressable style={styles.acceptButton}>
          <Text style={styles.acceptText}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MiniMap() {
  return (
    <View style={styles.mapPreview}>
      <View style={[styles.mapRoad, styles.mapRoadOne]} />
      <View style={[styles.mapRoad, styles.mapRoadTwo]} />
      <View style={[styles.mapRoad, styles.mapRoadThree]} />
      <View style={[styles.mapRoad, styles.mapRoadFour]} />

      <View style={styles.routeLine} />

      <View style={[styles.mapBlock, styles.mapBlockOne]} />
      <View style={[styles.mapBlock, styles.mapBlockTwo]} />
      <View style={[styles.mapBlock, styles.mapBlockThree]} />

      <View style={styles.mapPin}>
        <Ionicons name="location-sharp" size={17} color="#FFFFFF" />
      </View>
    </View>
  );
}

function HomePreview() {
  return (
    <LinearGradient
      colors={["#D8E8D1", "#B8C9A8", "#725B43"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.homePreview}
    >
      <View style={styles.houseWall} />
      <View style={styles.houseDoor} />
      <View style={styles.greenBin} />
      <View style={styles.bushOne} />
      <View style={styles.bushTwo} />
    </LinearGradient>
  );
}

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
    marginBottom: spacing.sm,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  locationIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  brandText: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.primaryDark,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDeep,
  },

  onlineText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },

  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: spacing.sm,
  },

  secureText: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "700",
  },

  greetingBlock: {
    marginBottom: spacing.lg,
  },

  greetingTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  greetingSubtitle: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },

  summaryGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  summaryCard: {
    minHeight: 125,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    justifyContent: "space-between",
    ...softShadow,
  },

  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },

  summaryHelper: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },

  summaryLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.md,
  },

  summaryValue: {
    color: colors.primaryDark,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  summaryProgressTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: "#E7EEE9",
    marginTop: spacing.md,
  },

  summaryProgressFill: {
    width: "68%",
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },

  sectionAction: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },

  activeJobCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },

  activeJobTop: {
    flexDirection: "row",
    gap: spacing.md,
  },

  activePreview: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: "hidden",
  },

  activeRoad: {
    position: "absolute",
    left: -10,
    bottom: 14,
    width: 110,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ rotate: "-18deg" }],
  },

  activeHouse: {
    position: "absolute",
    right: 8,
    bottom: 18,
    width: 28,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
  },

  activeHouseRoof: {
    position: "absolute",
    right: 5,
    bottom: 38,
    width: 34,
    height: 12,
    borderRadius: 3,
    backgroundColor: "rgba(73,93,68,0.75)",
    transform: [{ rotate: "-6deg" }],
  },

  activeTreeOne: {
    position: "absolute",
    left: 10,
    bottom: 18,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: "rgba(21, 91, 49, 0.7)",
  },

  activeTreeTwo: {
    position: "absolute",
    left: 24,
    bottom: 23,
    width: 17,
    height: 17,
    borderRadius: radius.pill,
    backgroundColor: "rgba(31, 126, 64, 0.7)",
  },

  activeBin: {
    position: "absolute",
    right: 7,
    bottom: 8,
    width: 12,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.primaryDeep,
  },

  activeContent: {
    flex: 1,
  },

  activeTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  activeTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },

  progressBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
  },

  progressBadgeText: {
    color: colors.primaryDeep,
    fontSize: 10,
    fontWeight: "900",
  },

  activeSubtitle: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.sm,
  },

  activeActions: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },

  navigateButton: {
    height: 42,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDeep,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },

  navigateText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  callButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  requestList: {
    gap: spacing.md,
  },

  requestCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...softShadow,
  },

  mapPreview: {
    height: 118,
    backgroundColor: "#EFF6F0",
    overflow: "hidden",
  },

  mapRoad: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },

  mapRoadOne: {
    width: "120%",
    height: 10,
    left: -30,
    top: 32,
    transform: [{ rotate: "-16deg" }],
  },

  mapRoadTwo: {
    width: "120%",
    height: 9,
    left: -20,
    top: 73,
    transform: [{ rotate: "3deg" }],
  },

  mapRoadThree: {
    width: 10,
    height: "130%",
    left: 92,
    top: -20,
    transform: [{ rotate: "8deg" }],
  },

  mapRoadFour: {
    width: 10,
    height: "130%",
    right: 64,
    top: -20,
    transform: [{ rotate: "-5deg" }],
  },

  routeLine: {
    position: "absolute",
    width: "80%",
    height: 4,
    left: 30,
    top: 62,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    transform: [{ rotate: "-14deg" }],
  },

  mapBlock: {
    position: "absolute",
    borderRadius: 4,
    backgroundColor: "#CFECD7",
  },

  mapBlockOne: {
    width: 64,
    height: 32,
    left: 18,
    top: 12,
  },

  mapBlockTwo: {
    width: 72,
    height: 35,
    right: 24,
    bottom: 16,
  },

  mapBlockThree: {
    width: 58,
    height: 28,
    left: 122,
    bottom: 8,
  },

  mapPin: {
    position: "absolute",
    top: 46,
    left: "50%",
    width: 30,
    height: 30,
    marginLeft: -15,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },

  homePreview: {
    height: 118,
    overflow: "hidden",
  },

  houseWall: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "62%",
    height: "100%",
    backgroundColor: "rgba(255,245,230,0.7)",
  },

  houseDoor: {
    position: "absolute",
    right: 72,
    bottom: 0,
    width: 34,
    height: 82,
    backgroundColor: "rgba(72,55,43,0.75)",
  },

  greenBin: {
    position: "absolute",
    right: 18,
    bottom: 22,
    width: 34,
    height: 38,
    borderRadius: 6,
    backgroundColor: colors.primaryDeep,
  },

  bushOne: {
    position: "absolute",
    left: 14,
    bottom: -10,
    width: 88,
    height: 70,
    borderRadius: radius.pill,
    backgroundColor: "rgba(29,105,54,0.75)",
  },

  bushTwo: {
    position: "absolute",
    left: 68,
    bottom: -14,
    width: 72,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: "rgba(64,132,72,0.75)",
  },

  distanceBadge: {
    position: "absolute",
    top: 92,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.95)",
  },

  distanceText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
  },

  requestInfoRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  requestTextBlock: {
    flex: 1,
  },

  requestTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  requestAddress: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },

  priceText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },

  requestActions: {
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },

  declineButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "#F4F6F5",
    alignItems: "center",
    justifyContent: "center",
  },

  declineText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },

  acceptButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDeep,
    alignItems: "center",
    justifyContent: "center",
  },

  acceptText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});