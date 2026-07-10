import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  formatBinType,
  getBinFillColor,
  listenSmartBinsByGnDivision,
} from "../../../services/binService";
import type { SmartBin } from "../../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function EcoBinsScreen() {
  const { profile, refreshProfile } = useAuth();
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = listenSmartBinsByGnDivision(
      profile?.area?.gnDivision,
      (items) => {
        setBins(items);
        setLoading(false);
      },
      (error) => {
        console.warn("Smart bins listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile?.area?.gnDivision]);

  const stats = useMemo(() => {
    const full = bins.filter((bin) => Number(bin.fillLevel ?? 0) >= 85).length;
    const available = bins.filter((bin) => Number(bin.fillLevel ?? 0) < 85 && bin.status !== "offline").length;
    const maintenance = bins.filter((bin) => bin.status === "maintenance" || bin.status === "offline").length;

    return { total: bins.length, full, available, maintenance };
  }, [bins]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const areaText = profile?.area?.gnDivision ?? profile?.area?.district ?? "Your Area";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Eco Bins</Text>
            <Text style={styles.headerSubtitle}>{areaText}</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="trash-can-outline" size={25} color={colors.primaryDark} />
          </View>
        </View>

        <MapPreview bins={bins} />

        <View style={styles.statsGrid}>
          <StatCard icon="trash-can-outline" label="Total" value={String(stats.total)} />
          <StatCard icon="check-circle-outline" label="Available" value={String(stats.available)} />
          <StatCard icon="alert-outline" label="Full" value={String(stats.full)} warning={stats.full > 0} />
        </View>

        <View style={styles.noticeCard}>
          <MaterialCommunityIcons name="information-outline" size={22} color={colors.primaryDark} />
          <Text style={styles.noticeText}>
            Fill levels are synced from Firestore. Use bins below 85% for better recycling efficiency.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Smart Bins</Text>
          <Text style={styles.sectionAction}>{bins.length} found</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.loadingText}>Loading smart bins...</Text>
          </View>
        ) : bins.length > 0 ? (
          <View style={styles.binList}>
            {bins.map((bin) => (
              <BinCard key={bin.id} bin={bin} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={34} color={colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No smart bins assigned</Text>
            <Text style={styles.emptySubtitle}>
              Smart bins added by admins for your GN area will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, warning }: { icon: MaterialIconName; label: string; value: string; warning?: boolean }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={20} color={warning ? colors.danger : colors.primaryDark} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MapPreview({ bins }: { bins: SmartBin[] }) {
  return (
    <View style={styles.mapCard}>
      <View style={[styles.mapRoad, styles.mapRoadOne]} />
      <View style={[styles.mapRoad, styles.mapRoadTwo]} />
      <View style={[styles.mapRoadVertical, { left: "28%" }]} />
      <View style={[styles.mapRoadVertical, { right: "22%" }]} />
      <View style={styles.mapAreaOne} />
      <View style={styles.mapAreaTwo} />
      <View style={styles.mapAreaThree} />

      {bins.slice(0, 7).map((bin, index) => {
        const positions = [
          { left: "18%" as const, top: "30%" as const },
          { left: "42%" as const, top: "50%" as const },
          { left: "68%" as const, top: "34%" as const },
          { left: "78%" as const, top: "67%" as const },
          { left: "26%" as const, top: "72%" as const },
          { left: "52%" as const, top: "22%" as const },
          { left: "57%" as const, top: "76%" as const },
        ];
        const fill = Number(bin.fillLevel ?? 0);
        return <View key={bin.id} style={[styles.mapPin, positions[index], { backgroundColor: getBinFillColor(fill) }]} />;
      })}

      <View style={styles.mapLabel}>
        <MaterialCommunityIcons name="map-marker-radius-outline" size={15} color={colors.primaryDeep} />
        <Text style={styles.mapLabelText}>Smart Bin Coverage</Text>
      </View>
    </View>
  );
}

function BinCard({ bin }: { bin: SmartBin }) {
  const fill = Math.max(0, Math.min(100, Math.round(Number(bin.fillLevel ?? 0))));
  const fillColor = getBinFillColor(fill);
  const status = bin.status ?? "active";

  return (
    <Pressable style={styles.binCard}>
      <View style={styles.binTopRow}>
        <View style={[styles.binIconWrap, { backgroundColor: `${fillColor}18` }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color={fillColor} />
        </View>

        <View style={styles.binTextBlock}>
          <Text style={styles.binName}>{bin.name}</Text>
          <Text style={styles.binAddress}>{bin.location?.address ?? bin.area?.gnDivision ?? "Location not set"}</Text>
        </View>

        <View style={[styles.statusBadge, status !== "active" && styles.statusBadgeWarning]}>
          <Text style={[styles.statusBadgeText, status !== "active" && styles.statusBadgeTextWarning]}>{status}</Text>
        </View>
      </View>

      <View style={styles.binMetaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{formatBinType(bin.type)}</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{bin.capacityLiters ?? 0}L capacity</Text>
        </View>
      </View>

      <View style={styles.fillHeaderRow}>
        <Text style={styles.fillLabel}>Current fill level</Text>
        <Text style={[styles.fillPercent, { color: fillColor }]}>{fill}%</Text>
      </View>

      <View style={styles.fillTrack}>
        <View style={[styles.fillBar, { width: `${fill}%` as `${number}%`, backgroundColor: fillColor }]} />
      </View>

      <Text style={[styles.binAdvice, { color: fillColor }]}>
        {fill >= 85 ? "Almost full. Please use another nearby bin." : fill >= 60 ? "Moderate capacity available." : "Good capacity available."}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 105 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 3, color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  headerIconWrap: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", ...softShadow },
  mapCard: { height: 190, borderRadius: radius.xl, backgroundColor: "#EAF7EF", overflow: "hidden", marginBottom: spacing.lg, ...softShadow },
  mapRoad: { position: "absolute", height: 12, backgroundColor: "#FFFFFF", borderRadius: radius.pill },
  mapRoadOne: { width: "125%", left: -30, top: 58, transform: [{ rotate: "-12deg" }] },
  mapRoadTwo: { width: "120%", left: -20, top: 126, transform: [{ rotate: "8deg" }] },
  mapRoadVertical: { position: "absolute", top: -20, height: "125%", width: 12, backgroundColor: "#FFFFFF", borderRadius: radius.pill, transform: [{ rotate: "6deg" }] },
  mapAreaOne: { position: "absolute", left: 20, top: 20, width: 76, height: 44, borderRadius: radius.md, backgroundColor: "#CFECD7" },
  mapAreaTwo: { position: "absolute", right: 26, top: 30, width: 88, height: 54, borderRadius: radius.md, backgroundColor: "#CFECD7" },
  mapAreaThree: { position: "absolute", left: 95, bottom: 24, width: 92, height: 44, borderRadius: radius.md, backgroundColor: "#CFECD7" },
  mapPin: { position: "absolute", width: 18, height: 18, borderRadius: radius.pill, borderWidth: 3, borderColor: "#FFFFFF" },
  mapLabel: { position: "absolute", left: spacing.md, bottom: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.95)", flexDirection: "row", alignItems: "center", gap: 5 },
  mapLabelText: { color: colors.primaryDeep, fontSize: 11, fontWeight: "900" },
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: "center", ...softShadow },
  statValue: { marginTop: 4, color: colors.text, fontSize: 22, fontWeight: "900" },
  statLabel: { color: colors.textSoft, fontSize: 10, fontWeight: "800" },
  noticeCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: "#DDFBE7", marginBottom: spacing.lg },
  noticeText: { flex: 1, color: colors.primaryDeep, fontSize: 12, lineHeight: 18, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  sectionAction: { color: colors.primaryDeep, fontSize: 12, fontWeight: "900" },
  loadingCard: { minHeight: 160, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: spacing.sm, ...softShadow },
  loadingText: { color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  binList: { gap: spacing.md },
  binCard: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, ...softShadow },
  binTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  binIconWrap: { width: 52, height: 52, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  binTextBlock: { flex: 1 },
  binName: { color: colors.text, fontSize: 16, fontWeight: "900" },
  binAddress: { marginTop: 3, color: colors.textSoft, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#DDFBE7" },
  statusBadgeWarning: { backgroundColor: "#FFF6E5" },
  statusBadgeText: { color: colors.primaryDeep, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  statusBadgeTextWarning: { color: "#8A5A00" },
  binMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  metaPill: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#F4F7F5" },
  metaText: { color: colors.textSoft, fontSize: 11, fontWeight: "900" },
  fillHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.sm },
  fillLabel: { color: colors.textSoft, fontSize: 12, fontWeight: "800" },
  fillPercent: { fontSize: 13, fontWeight: "900" },
  fillTrack: { height: 9, borderRadius: radius.pill, backgroundColor: "#DCEBE2", overflow: "hidden" },
  fillBar: { height: "100%", borderRadius: radius.pill },
  binAdvice: { marginTop: spacing.sm, fontSize: 12, fontWeight: "800" },
  emptyCard: { minHeight: 210, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, ...softShadow },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: spacing.md, color: colors.text, fontSize: 18, fontWeight: "900" },
  emptySubtitle: { marginTop: spacing.xs, color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
});
