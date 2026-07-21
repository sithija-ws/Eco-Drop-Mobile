import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { db } from "../../lib/firebase";
import { colors, radius, softShadow, spacing } from "../../constants/theme";
import MapViewComponent from "../../components/common/MapViewComponent";
import {
  subscribeCollectorLocation,
  estimateArrivalMinutes,
  generateInterpolatedPolyline,
} from "../../services/collectorMapService";
import type { PickupRequest } from "../../types/firestore";

export default function TrackPickupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pickup, setPickup] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Live driver location state
  const [driverCoords, setDriverCoords] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 6.9200,
    longitude: 79.8550,
  });

  // Listen to Pickup Request updates in Firestore
  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "pickupRequests", id), (docSnap) => {
      if (docSnap.exists()) {
        setPickup({ id: docSnap.id, ...docSnap.data() } as PickupRequest);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  // Listen to Driver GPS Location updates
  useEffect(() => {
    if (!pickup?.collectorId) return;

    const unsubGps = subscribeCollectorLocation(
      pickup.collectorId,
      (location) => {
        if (location) {
          setDriverCoords({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
      }
    );

    return () => unsubGps();
  }, [pickup?.collectorId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Live Tracking...</Text>
      </SafeAreaView>
    );
  }

  if (!pickup) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Pickup request not found.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const pickupLat = pickup.location?.latitude || 6.9271;
  const pickupLng = pickup.location?.longitude || 79.8612;

  const etaMinutes = estimateArrivalMinutes(
    driverCoords.latitude,
    driverCoords.longitude,
    pickupLat,
    pickupLng
  );

  const polylinePoints = generateInterpolatedPolyline(
    driverCoords,
    { latitude: pickupLat, longitude: pickupLng }
  );

  const getStatusStep = (status: string) => {
    switch (status) {
      case "submitted":
      case "waiting_for_collector":
        return 1;
      case "accepted":
        return 2;
      case "collector_on_the_way":
        return 3;
      case "collected":
      case "completed":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStatusStep(pickup.status);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Live Pickup Tracker</Text>
          <Text style={styles.headerSubtitle}>
            Request #{id?.substring(0, 8)}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Live Map View */}
        <View style={styles.mapCard}>
          <MapViewComponent
            height={280}
            initialRegion={{
              latitude: (driverCoords.latitude + pickupLat) / 2,
              longitude: (driverCoords.longitude + pickupLng) / 2,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            markers={[
              {
                id: "pickup-loc",
                latitude: pickupLat,
                longitude: pickupLng,
                title: "Pickup Spot",
                description: pickup.location?.address,
                pinColor: colors.primary,
              },
              {
                id: "driver-loc",
                latitude: driverCoords.latitude,
                longitude: driverCoords.longitude,
                title: pickup.collectorName || "Eco-Collector",
                description: "On duty vehicle",
                pinColor: colors.primaryDark,
              },
            ]}
            polyline={polylinePoints}
          />
        </View>

        {/* Status Stepper Card */}
        <View style={styles.statusCard}>
          <View style={styles.etaHeader}>
            <View>
              <Text style={styles.etaTitle}>Estimated Arrival</Text>
              <Text style={styles.etaValue}>
                {pickup.status === "completed"
                  ? "Completed"
                  : `~ ${etaMinutes} mins`}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {pickup.status.replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.stepperRow}>
            {["Submitted", "Accepted", "En Route", "Collected"].map(
              (label, index) => {
                const stepNum = index + 1;
                const isPassed = currentStep >= stepNum;
                return (
                  <View key={label} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        isPassed && styles.stepDotActive,
                      ]}
                    >
                      <Ionicons
                        name={isPassed ? "checkmark" : "ellipse-outline"}
                        size={12}
                        color={isPassed ? "#FFF" : "#AAA"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isPassed && styles.stepLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                );
              }
            )}
          </View>
        </View>

        {/* Assigned Collector Details */}
        <View style={styles.collectorCard}>
          <View style={styles.collectorAvatar}>
            <MaterialCommunityIcons
              name="account-hard-hat"
              size={28}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.collectorName}>
              {pickup.collectorName || "Assigned Driver"}
            </Text>
            <Text style={styles.collectorSubtitle}>
              Eco-Drop Verified Waste Collector
            </Text>
          </View>
          {pickup.residentPhone && (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${pickup.residentPhone}`)}
            >
              <Ionicons name="call" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Request Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Pickup Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>
              {pickup.wasteCategory.toUpperCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>
              {pickup.location?.address}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Waste Notes:</Text>
            <Text style={styles.detailValue}>
              {pickup.wasteDetails || "N/A"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAF9",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSoft,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  backBtnText: {
    color: "#FFF",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
  scrollContent: {
    padding: spacing.md,
  },
  mapCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    ...softShadow,
  },
  statusCard: {
    backgroundColor: "#FFF",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...softShadow,
  },
  etaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  etaTitle: {
    fontSize: 13,
    color: colors.textSoft,
  },
  etaValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  collectorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...softShadow,
  },
  collectorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  collectorName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  collectorSubtitle: {
    fontSize: 12,
    color: colors.textSoft,
  },
  callBtn: {
    backgroundColor: colors.primaryDark,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsCard: {
    backgroundColor: "#FFF",
    borderRadius: radius.lg,
    padding: spacing.md,
    ...softShadow,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSoft,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
    textAlign: "right",
  },
});
