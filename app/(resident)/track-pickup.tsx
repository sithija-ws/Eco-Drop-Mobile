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
  calculateDistanceKm,
  calculateBearing,
  formatDistanceDisplay,
  isCollectorNearDestination,
} from "../../services/collectorMapService";
import { rateCollectorJob } from "../../services/ratingService";
import type { PickupRequest } from "../../types/firestore";
import { Alert, Modal, TextInput } from "react-native";

export default function TrackPickupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pickup, setPickup] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Rating Modal States
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedStars, setSelectedStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  // Live driver location state
  const [driverCoords, setDriverCoords] = useState<{
    latitude: number;
    longitude: number;
    heading?: number;
  }>({
    latitude: 6.9200,
    longitude: 79.8550,
    heading: 0,
  });

  // Listen to Pickup Request updates in Firestore
  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(
      doc(db, "pickupRequests", id),
      (docSnap) => {
        if (docSnap.exists()) {
          setPickup({ id: docSnap.id, ...docSnap.data() } as PickupRequest);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Track pickup snapshot listener error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  // Listen to Driver GPS Location updates
  useEffect(() => {
    if (!pickup?.collectorId) return;

    const unsubGps = subscribeCollectorLocation(
      pickup.collectorId,
      (location) => {
        if (location) {
          setDriverCoords((prev) => {
            const calculatedHeading = calculateBearing(
              prev.latitude,
              prev.longitude,
              location.latitude,
              location.longitude
            );
            return {
              latitude: location.latitude,
              longitude: location.longitude,
              heading: location.heading ?? calculatedHeading,
            };
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

  const distanceKm = calculateDistanceKm(
    driverCoords.latitude,
    driverCoords.longitude,
    pickupLat,
    pickupLng
  );

  const etaMinutes = estimateArrivalMinutes(
    driverCoords.latitude,
    driverCoords.longitude,
    pickupLat,
    pickupLng
  );

  const isArrivingSoon =
    pickup.status === "collector_on_the_way" &&
    isCollectorNearDestination(
      driverCoords.latitude,
      driverCoords.longitude,
      pickupLat,
      pickupLng,
      300
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

  const handleRatingSubmit = async () => {
    if (!pickup?.id || !pickup?.collectorId) {
      Alert.alert("Rating unavailable", "No collector is assigned to this job yet.");
      return;
    }

    try {
      setSubmittingRating(true);
      await rateCollectorJob(pickup.id, pickup.collectorId, selectedStars, reviewComment);
      setRatingModalVisible(false);
      Alert.alert("Thank You!", "Your rating and review have been submitted.");
    } catch (e) {
      console.warn("Submit rating failed:", e);
      Alert.alert("Error", "Could not submit rating. Please try again.");
    } finally {
      setSubmittingRating(false);
    }
  };

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
        {/* Proximity Alert Banner */}
        {isArrivingSoon && (
          <View style={styles.arrivingAlertBanner}>
            <MaterialCommunityIcons name="truck-delivery" size={24} color="#FFF" />
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <Text style={styles.arrivingAlertTitle}>Driver is Arriving!</Text>
              <Text style={styles.arrivingAlertSubtitle}>
                Your Eco-Drop collector is under 300 meters away ({formatDistanceDisplay(distanceKm)}).
              </Text>
            </View>
          </View>
        )}

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
                description: `Distance: ${formatDistanceDisplay(distanceKm)}`,
                pinColor: colors.primaryDark,
                heading: driverCoords.heading,
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
                  : `~ ${etaMinutes} mins (${formatDistanceDisplay(distanceKm)})`}
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

        {/* Rate Collector Button / Rating Card */}
        {pickup.collectorId && (pickup.status === "completed" || pickup.status === "collected") && (
          <View style={styles.ratingSectionCard}>
            {pickup.rating ? (
              <View style={styles.ratedBox}>
                <Ionicons name="star" size={20} color="#FFB300" />
                <Text style={styles.ratedText}>
                  You rated {pickup.collectorName || "collector"} {pickup.rating} Stars
                </Text>
                {pickup.ratingReview ? (
                  <Text style={styles.ratedReviewText}>"{pickup.ratingReview}"</Text>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.rateCollectorBtn}
                onPress={() => setRatingModalVisible(true)}
              >
                <Ionicons name="star" size={20} color="#FFF" />
                <Text style={styles.rateCollectorBtnText}>Rate & Review Collector</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Request Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Pickup Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>
              {pickup.wasteCategory.toUpperCase()}
            </Text>
          </View>
          {Boolean(pickup.quantityKg) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Est. Quantity:</Text>
              <Text style={styles.detailValue}>{pickup.quantityKg} kg</Text>
            </View>
          )}
          {Boolean(pickup.estimatedPayout) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cash Payout to You:</Text>
              <Text style={[styles.detailValue, { color: "#2E7D32", fontWeight: "900" }]}>
                Rs. {pickup.estimatedPayout}
              </Text>
            </View>
          )}
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

      {/* 5-Star Collector Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Collector Service</Text>
            <Text style={styles.modalSubtitle}>
              How was your waste pickup experience with {pickup?.collectorName || "your collector"}?
            </Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedStars(star)}
                  style={{ padding: 6 }}
                >
                  <Ionicons
                    name={star <= selectedStars ? "star" : "star-outline"}
                    size={36}
                    color="#FFB300"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write a comment or review (optional)..."
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setRatingModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleRatingSubmit}
                disabled={submittingRating}
              >
                <Text style={styles.submitModalBtnText}>
                  {submittingRating ? "Submitting..." : "Submit Review"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  arrivingAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...softShadow,
  },
  arrivingAlertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  arrivingAlertSubtitle: {
    fontSize: 12,
    color: "#E8F5E9",
    marginTop: 2,
  },

  // Rating Section Styles
  ratingSectionCard: {
    backgroundColor: "#FFF",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...softShadow,
  },
  rateCollectorBtn: {
    backgroundColor: "#FFB300",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  rateCollectorBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF",
  },
  ratedBox: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  ratedText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  ratedReviewText: {
    fontSize: 12,
    fontStyle: "italic",
    color: colors.textSoft,
    marginTop: 2,
  },

  // Rating Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    ...softShadow,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSoft,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.md,
  },
  starRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: spacing.md,
  },
  reviewInput: {
    width: "100%",
    height: 80,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  cancelModalBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textSoft,
  },
  submitModalBtn: {
    flex: 2,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitModalBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFF",
  },
});

