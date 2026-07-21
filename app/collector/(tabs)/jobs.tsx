import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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
  emptySmartBin,
  formatBinType,
  getBinFillColor,
  listenSmartBinsByGnDivision,
} from "../../../services/binService";
import {
  acceptPickupRequest,
  formatPickupStatus,
  formatWasteCategory,
  listenCollectorDashboard,
  updatePickupStatus,
} from "../../../services/dashboardService";
import type { PickupRequest, PickupStatus, SmartBin } from "../../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../../constants/theme";
import * as Location from "expo-location";
import MapViewComponent, { MapMarkerItem } from "../../../components/common/MapViewComponent";
import {
  updateCollectorGpsLocation,
  openExternalNavigation,
  calculateDistanceKm,
  formatDistanceDisplay,
  generateInterpolatedPolyline,
  calculateBearing,
} from "../../../services/collectorMapService";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type FilterType = "incoming" | "active" | "bins" | "completed" | "all";

const filters: { id: FilterType; label: string }[] = [
  { id: "incoming", label: "Incoming" },
  { id: "active", label: "Active" },
  { id: "bins", label: "Smart Bins" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

const activeStatuses: PickupStatus[] = ["accepted", "collector_on_the_way", "collected"];

export default function CollectorJobsScreen() {
  const { profile, refreshProfile } = useAuth();
  const [assignedJobs, setAssignedJobs] = useState<PickupRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<PickupRequest[]>([]);
  const [smartBins, setSmartBins] = useState<SmartBin[]>([]);
  const [filter, setFilter] = useState<FilterType>("incoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<PickupRequest | null>(null);
  const [emptyingBinId, setEmptyingBinId] = useState<string | null>(null);
  const [isGpsBroadcasting, setIsGpsBroadcasting] = useState(false);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [collectorCoords, setCollectorCoords] = useState<{
    latitude: number;
    longitude: number;
    heading?: number;
  }>({
    latitude: 6.9271,
    longitude: 79.8612,
    heading: 0,
  });

  // Toggle GPS broadcasting for Live Location tracking
  const toggleGpsBroadcasting = async () => {
    if (!isGpsBroadcasting) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Needed", "Location permission is required for live GPS tracking.");
        return;
      }
      setIsGpsBroadcasting(true);
      Alert.alert("GPS Live Tracking Active", "Residents can now track your vehicle en route.");
    } else {
      setIsGpsBroadcasting(false);
      setIsSimulatingDrive(false);
    }
  };

  // Broadcast location periodically when enabled
  useEffect(() => {
    if (!isGpsBroadcasting || !profile?.uid || isSimulatingDrive) return;

    const interval = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCollectorCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          heading: loc.coords.heading ?? 0,
        });
        await updateCollectorGpsLocation(
          profile.uid,
          loc.coords.latitude,
          loc.coords.longitude,
          loc.coords.heading ?? 0
        );
      } catch (e) {
        console.warn("GPS broadcast failed", e);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isGpsBroadcasting, profile?.uid, isSimulatingDrive]);

  // Handle simulated driver movement when testing
  useEffect(() => {
    if (
      !isSimulatingDrive ||
      !selectedJob?.location?.latitude ||
      !selectedJob?.location?.longitude ||
      !profile?.uid
    )
      return;

    const target = {
      latitude: selectedJob.location.latitude,
      longitude: selectedJob.location.longitude,
    };

    const path = generateInterpolatedPolyline(collectorCoords, target, 10);

    const timer = setInterval(() => {
      setSimulationIndex((prev) => {
        const nextIdx = (prev + 1) % path.length;
        const currentPt = path[nextIdx];
        const nextPt = path[(nextIdx + 1) % path.length];
        const bearing = calculateBearing(
          currentPt.latitude,
          currentPt.longitude,
          nextPt.latitude,
          nextPt.longitude
        );

        setCollectorCoords({
          latitude: currentPt.latitude,
          longitude: currentPt.longitude,
          heading: bearing,
        });

        updateCollectorGpsLocation(
          profile.uid,
          currentPt.latitude,
          currentPt.longitude,
          bearing
        );

        return nextIdx;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isSimulatingDrive, selectedJob, profile?.uid]);


  // Compute map markers for pickup points & smart bins
  const mapMarkers = useMemo<MapMarkerItem[]>(() => {
    const markers: MapMarkerItem[] = [
      {
        id: "collector-me",
        latitude: collectorCoords.latitude,
        longitude: collectorCoords.longitude,
        title: profile?.fullName || "My Vehicle",
        description: isGpsBroadcasting ? "Broadcasting Live GPS" : "Collector Vehicle",
        pinColor: colors.primaryDark,
      },
    ];

    [...incomingRequests, ...assignedJobs].forEach((job) => {
      if (job.location?.latitude && job.location?.longitude) {
        markers.push({
          id: job.id,
          latitude: job.location.latitude,
          longitude: job.location.longitude,
          title: `${job.wasteCategory.toUpperCase()} Pickup`,
          description: job.location.address || job.residentName,
          pinColor: colors.primary,
        });
      }
    });

    smartBins.forEach((bin) => {
      if (bin.location?.latitude && bin.location?.longitude) {
        markers.push({
          id: `bin-${bin.id}`,
          latitude: bin.location.latitude,
          longitude: bin.location.longitude,
          title: `Smart Bin: ${bin.name}`,
          description: `Fill Level: ${bin.fillLevel}%`,
          pinColor: bin.fillLevel > 80 ? "#E53935" : bin.fillLevel > 50 ? "#FB8C00" : "#4CAF50",
        });
      }
    });

    return markers;
  }, [collectorCoords, incomingRequests, assignedJobs, smartBins, profile?.fullName, isGpsBroadcasting]);

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    const unsubDashboard = listenCollectorDashboard(
      profile,
      ({ assignedJobs: jobs, incomingRequests: requests }) => {
        setAssignedJobs(jobs);
        setIncomingRequests(requests);
        setLoading(false);
      },
      (error) => {
        console.warn("Collector jobs listener error", error);
        setLoading(false);
      }
    );

    const unsubBins = listenSmartBinsByGnDivision(
      profile.area?.gnDivision,
      (bins) => setSmartBins(bins),
      (error) => console.warn("Bins listener error", error)
    );

    return () => {
      unsubDashboard();
      unsubBins();
    };
  }, [profile]);

  const stats = useMemo(() => {
    return {
      incoming: incomingRequests.length,
      active: assignedJobs.filter((job) => activeStatuses.includes(job.status)).length,
      bins: smartBins.filter((bin) => Number(bin.fillLevel ?? 0) >= 60).length,
      completed: assignedJobs.filter((job) => job.status === "completed").length,
      all: incomingRequests.length + assignedJobs.length + smartBins.length,
    };
  }, [assignedJobs, incomingRequests, smartBins]);

  const visibleJobs = useMemo(() => {
    if (filter === "incoming") return incomingRequests;
    if (filter === "active") return assignedJobs.filter((job) => activeStatuses.includes(job.status));
    if (filter === "completed") return assignedJobs.filter((job) => job.status === "completed");
    return [...incomingRequests, ...assignedJobs];
  }, [filter, incomingRequests, assignedJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleAccept = async (request: PickupRequest) => {
    if (!profile) return;

    if (profile.status !== "active") {
      Alert.alert("Approval required", "Your collector account must be activated by admin before accepting jobs.");
      return;
    }

    try {
      setUpdatingId(request.id);
      await acceptPickupRequest(request.id, profile);
      Alert.alert("Job Accepted", "Pickup job added to active tasks.");
    } catch (error) {
      console.warn(error);
      Alert.alert("Accept failed", "Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNextStatus = async (job: PickupRequest) => {
    const nextStatus = getNextStatus(job.status);

    if (!nextStatus) {
      Alert.alert("No next status", "This job is already completed or cannot be updated.");
      return;
    }

    try {
      setUpdatingId(job.id);
      await updatePickupStatus(job.id, nextStatus);

      if (selectedJob?.id === job.id) {
        setSelectedJob((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (error) {
      console.warn(error);
      Alert.alert("Update failed", "Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEmptyBin = async (bin: SmartBin) => {
    try {
      setEmptyingBinId(bin.id);
      await emptySmartBin(bin.id);
      Alert.alert("Bin Emptied", `Fill level for "${bin.name}" reset to 0%.`);
    } catch (error) {
      console.warn(error);
      Alert.alert("Error", "Could not update bin level.");
    } finally {
      setEmptyingBinId(null);
    }
  };

  const openPhoneCall = (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert("No phone", "Resident phone number is not available.");
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Error", "Cannot place call from device.");
    });
  };

  const openNavigation = (
    address?: string,
    coords?: { latitude?: number; longitude?: number }
  ) => {
    if (coords?.latitude && coords?.longitude) {
      openExternalNavigation(coords.latitude, coords.longitude, address || "Pickup Location");
      return;
    }
    if (!address) return;
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
      Alert.alert("Error", "Could not open map navigation.");
    });
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
            <Text style={styles.headerTitle}>Collector Jobs</Text>
            <Text style={styles.headerSubtitle}>
              {profile?.area?.gnDivision ?? "All Areas"} • Active Routes
            </Text>
          </View>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="briefcase-outline" size={25} color={colors.primaryDark} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="inbox-outline" label="Incoming" value={String(stats.incoming)} />
          <StatCard icon="progress-clock" label="Active" value={String(stats.active)} />
          <StatCard icon="trash-can-outline" label="Bin Alerts" value={String(stats.bins)} />
          <StatCard icon="check-circle-outline" label="Done" value={String(stats.completed)} />
        </View>

        {/* Live GPS Broadcast Toggle & Interactive Route Map */}
        <View style={styles.mapSectionCard}>
          <View style={styles.mapSectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.primary} />
              <Text style={styles.mapSectionTitle}>Route Map & Live GPS</Text>
            </View>
            <Pressable
              style={[styles.gpsToggleBtn, isGpsBroadcasting && styles.gpsToggleBtnActive]}
              onPress={toggleGpsBroadcasting}
            >
              <Ionicons
                name={isGpsBroadcasting ? "radio" : "radio-outline"}
                size={16}
                color={isGpsBroadcasting ? "#FFF" : colors.primary}
              />
              <Text style={[styles.gpsToggleText, isGpsBroadcasting && styles.gpsToggleTextActive]}>
                {isGpsBroadcasting ? "Broadcasting Live" : "Turn ON Live GPS"}
              </Text>
            </Pressable>
          </View>

          <MapViewComponent
            height={200}
            initialRegion={{
              latitude: collectorCoords.latitude,
              longitude: collectorCoords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            markers={mapMarkers}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((item) => {
            const selected = filter === item.id;
            const count = stats[item.id];
            return (
              <Pressable
                key={item.id}
                style={[styles.filterPill, selected && styles.filterPillSelected]}
                onPress={() => setFilter(item.id)}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                  {item.label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.loadingText}>Loading collection data...</Text>
          </View>
        ) : filter === "bins" ? (
          smartBins.length > 0 ? (
            <View style={styles.jobList}>
              {smartBins.map((bin) => (
                <SmartBinCard
                  key={bin.id}
                  bin={bin}
                  emptying={emptyingBinId === bin.id}
                  onEmpty={() => handleEmptyBin(bin)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="trash-can-outline" size={36} color={colors.primaryDark} />
              <Text style={styles.emptyTitle}>No Smart Bins found</Text>
              <Text style={styles.emptySubtitle}>Smart bins in your GN Division will appear here.</Text>
            </View>
          )
        ) : visibleJobs.length > 0 ? (
          <View style={styles.jobList}>
            {visibleJobs.map((job) => {
              const isIncoming = !job.collectorId;
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  isIncoming={isIncoming}
                  updating={updatingId === job.id}
                  onAccept={() => handleAccept(job)}
                  onNextStatus={() => handleNextStatus(job)}
                  onPressDetails={() => setSelectedJob(job)}
                  onCall={() => openPhoneCall(job.residentPhone)}
                  onNavigate={() => openNavigation(job.location?.address ?? job.area?.gnDivision, job.location)}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="briefcase-check-outline" size={34} color={colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptySubtitle}>Jobs matching this filter will appear here.</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      {selectedJob && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedJob(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{formatWasteCategory(selectedJob.wasteCategory)}</Text>
                  <Text style={styles.modalSubtitle}>ID: {selectedJob.id.slice(0, 10)}</Text>
                </View>
                <Pressable onPress={() => setSelectedJob(null)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Resident Contact</Text>
                  <Text style={styles.modalResidentName}>{selectedJob.residentName ?? "Resident"}</Text>
                  <Text style={styles.modalPhone}>{selectedJob.residentPhone ?? "No phone number"}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Pickup Location</Text>
                  <Text style={styles.modalAddress}>{selectedJob.location?.address ?? "Address not set"}</Text>
                  <Text style={styles.modalArea}>GN Division: {selectedJob.area?.gnDivision ?? "N/A"}</Text>
                </View>

                {selectedJob.wasteDetails ? (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionLabel}>Waste Details / Notes</Text>
                    <Text style={styles.modalDetails}>{selectedJob.wasteDetails}</Text>
                    {selectedJob.notes ? <Text style={styles.modalNotes}>Note: {selectedJob.notes}</Text> : null}
                  </View>
                ) : null}

                {/* Simulation Drive Option */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Driver Location & Simulation</Text>
                  <Pressable
                    style={[styles.simulationBtn, isSimulatingDrive && styles.simulationBtnActive]}
                    onPress={() => {
                      if (!isGpsBroadcasting) setIsGpsBroadcasting(true);
                      setIsSimulatingDrive(!isSimulatingDrive);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={isSimulatingDrive ? "motion-pause-outline" : "motion-play-outline"}
                      size={20}
                      color={isSimulatingDrive ? "#FFF" : colors.primaryDark}
                    />
                    <Text style={[styles.simulationBtnText, isSimulatingDrive && styles.simulationBtnTextActive]}>
                      {isSimulatingDrive ? "Stop GPS Drive Simulation" : "Simulate Drive to Pickup Spot"}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.modalMetaGrid}>
                  <View style={styles.modalMetaItem}>
                    <Text style={styles.modalMetaLabel}>Price</Text>
                    <Text style={styles.modalMetaValue}>Rs. {Number(selectedJob.price ?? 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.modalMetaItem}>
                    <Text style={styles.modalMetaLabel}>Eco Drops</Text>
                    <Text style={styles.modalMetaValue}>+{selectedJob.ecoDrops ?? 0}</Text>
                  </View>
                  <View style={styles.modalMetaItem}>
                    <Text style={styles.modalMetaLabel}>Status</Text>
                    <Text style={styles.modalMetaValue}>{formatPickupStatus(selectedJob.status)}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalActionSecondary}
                  onPress={() => openPhoneCall(selectedJob.residentPhone)}
                >
                  <Ionicons name="call" size={18} color={colors.primaryDark} />
                  <Text style={styles.modalActionSecondaryText}>Call</Text>
                </Pressable>

                <Pressable
                  style={styles.modalActionSecondary}
                  onPress={() => openNavigation(selectedJob.location?.address, selectedJob.location)}
                >
                  <Ionicons name="navigate" size={18} color={colors.primaryDark} />
                  <Text style={styles.modalActionSecondaryText}>GPS Nav</Text>
                </Pressable>

                {getNextStatus(selectedJob.status) ? (
                  <Pressable
                    style={styles.modalActionPrimary}
                    onPress={() => handleNextStatus(selectedJob)}
                    disabled={updatingId === selectedJob.id}
                  >
                    <Text style={styles.modalActionPrimaryText}>
                      {updatingId === selectedJob.id
                        ? "Updating..."
                        : `Mark ${formatPickupStatus(getNextStatus(selectedJob.status)!)}`}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>
      )}
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

function SmartBinCard({
  bin,
  emptying,
  onEmpty,
}: {
  bin: SmartBin;
  emptying: boolean;
  onEmpty: () => void;
}) {
  const fill = Math.max(0, Math.min(100, Math.round(Number(bin.fillLevel ?? 0))));
  const fillColor = getBinFillColor(fill);

  return (
    <View style={styles.jobCard}>
      <View style={styles.jobTopRow}>
        <View style={[styles.jobIconWrap, { backgroundColor: `${fillColor}18` }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color={fillColor} />
        </View>

        <View style={styles.jobTextBlock}>
          <Text style={styles.jobTitle}>{bin.name}</Text>
          <Text style={styles.jobAddress}>{bin.location?.address ?? bin.area?.gnDivision ?? "Location"}</Text>
          <Text style={styles.binTypeLabel}>{formatBinType(bin.type)} • {bin.capacityLiters ?? 0}L Capacity</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${fillColor}18` }]}>
          <View style={[styles.statusDot, { backgroundColor: fillColor }]} />
          <Text style={[styles.statusText, { color: fillColor }]}>{fill}% FULL</Text>
        </View>
      </View>

      <View style={styles.fillTrack}>
        <View style={[styles.fillBar, { width: `${fill}%` as `${number}%`, backgroundColor: fillColor }]} />
      </View>

      <Pressable
        style={[styles.emptyBinBtn, fill < 20 && styles.emptyBinBtnDisabled]}
        onPress={onEmpty}
        disabled={emptying || fill < 5}
      >
        <MaterialCommunityIcons name="recycle" size={18} color="#FFFFFF" />
        <Text style={styles.acceptText}>{emptying ? "Updating..." : fill === 0 ? "Bin Emptied" : "Mark as Emptied (Reset 0%)"}</Text>
      </Pressable>
    </View>
  );
}

function JobCard({
  job,
  isIncoming,
  updating,
  onAccept,
  onNextStatus,
  onPressDetails,
  onCall,
  onNavigate,
}: {
  job: PickupRequest;
  isIncoming: boolean;
  updating: boolean;
  onAccept: () => void;
  onNextStatus: () => void;
  onPressDetails: () => void;
  onCall: () => void;
  onNavigate: () => void;
}) {
  const statusColor = getStatusColor(job.status);
  const nextStatus = getNextStatus(job.status);

  return (
    <Pressable style={styles.jobCard} onPress={onPressDetails}>
      <View style={styles.jobTopRow}>
        <View style={styles.jobIconWrap}>
          <MaterialCommunityIcons name={getCategoryIcon(job.wasteCategory)} size={24} color={colors.primaryDark} />
        </View>

        <View style={styles.jobTextBlock}>
          <Text style={styles.jobTitle}>{formatWasteCategory(job.wasteCategory)}</Text>
          <Text style={styles.jobResident}>{job.residentName ?? "Resident"} • {job.residentPhone ?? "No phone"}</Text>
          <Text style={styles.jobAddress}>{job.location?.address ?? job.area?.gnDivision ?? "Pickup location"}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{formatPickupStatus(job.status)}</Text>
        </View>
      </View>

      <View style={styles.detailBox}>
        <Text style={styles.detailLabel}>Waste Details</Text>
        <Text style={styles.detailText}>{job.wasteDetails || "No extra details"}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="cash" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>Rs. {Number(job.price ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="leaf" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>+{job.ecoDrops ?? 0} Drops</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.primaryDeep} />
          <Text style={styles.metaText}>{job.area?.gnDivision ?? "Area"}</Text>
        </View>
      </View>

      <View style={styles.cardActionsRow}>
        <Pressable style={styles.iconActionBtn} onPress={onCall}>
          <Ionicons name="call-outline" size={18} color={colors.primaryDark} />
        </Pressable>
        <Pressable style={styles.iconActionBtn} onPress={onNavigate}>
          <Ionicons name="navigate-outline" size={18} color={colors.primaryDark} />
        </Pressable>

        <View style={{ flex: 1 }}>
          {isIncoming ? (
            <Pressable style={styles.acceptButton} onPress={onAccept} disabled={updating}>
              <Text style={styles.acceptText}>{updating ? "Accepting..." : "Accept Job"}</Text>
            </Pressable>
          ) : nextStatus ? (
            <Pressable style={styles.updateButton} onPress={onNextStatus} disabled={updating}>
              <Text style={styles.updateText}>{updating ? "Updating..." : `Mark ${formatPickupStatus(nextStatus)}`}</Text>
            </Pressable>
          ) : (
            <View style={styles.completedBox}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function getNextStatus(status: PickupStatus): PickupStatus | null {
  if (status === "accepted") return "collector_on_the_way";
  if (status === "collector_on_the_way") return "collected";
  if (status === "collected") return "completed";
  return null;
}

function getCategoryIcon(category?: string): MaterialIconName {
  if (category === "organic") return "food-apple-outline";
  if (category === "paper") return "file-document-outline";
  if (category === "glass") return "bottle-wine-outline";
  if (category === "electronic") return "laptop";
  if (category === "mixed") return "trash-can-outline";
  return "recycle";
}

function getStatusColor(status: PickupStatus) {
  if (status === "completed") return colors.primaryDark;
  if (["cancelled", "rejected"].includes(status)) return colors.danger;
  if (["accepted", "collector_on_the_way", "collected"].includes(status)) return colors.info;
  return "#B7791F";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 105 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 3, color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  headerIconWrap: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", ...softShadow },
  statsGrid: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.lg },
  statCard: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: 6, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: "center", ...softShadow },
  statValue: { marginTop: 4, color: colors.text, fontSize: 20, fontWeight: "900" },
  statLabel: { color: colors.textSoft, fontSize: 9, fontWeight: "800", textAlign: "center" },
  filterRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  filterPill: { height: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  filterPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSoft, fontSize: 12, fontWeight: "900" },
  filterTextSelected: { color: "#FFFFFF" },
  loadingCard: { minHeight: 160, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: spacing.sm, ...softShadow },
  loadingText: { color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  jobList: { gap: spacing.md },
  jobCard: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, ...softShadow },
  jobTopRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  jobIconWrap: { width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  jobTextBlock: { flex: 1 },
  jobTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  jobResident: { marginTop: 3, color: colors.primaryDeep, fontSize: 12, fontWeight: "800" },
  jobAddress: { marginTop: 3, color: colors.textSoft, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  binTypeLabel: { marginTop: 3, color: colors.textSoft, fontSize: 11, fontWeight: "800" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill },
  statusDot: { width: 7, height: 7, borderRadius: radius.pill },
  statusText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  detailBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: "#F7FAF8" },
  detailLabel: { color: colors.textSoft, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  detailText: { marginTop: 4, color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#DDFBE7" },
  metaText: { color: colors.primaryDeep, fontSize: 11, fontWeight: "900" },
  fillTrack: { height: 9, borderRadius: radius.pill, backgroundColor: "#DCEBE2", overflow: "hidden", marginTop: spacing.md },
  fillBar: { height: "100%", borderRadius: radius.pill },
  emptyBinBtn: { height: 44, borderRadius: radius.md, backgroundColor: colors.primaryDark, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.md },
  emptyBinBtnDisabled: { opacity: 0.6 },
  cardActionsRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  iconActionBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  acceptButton: { height: 44, borderRadius: radius.md, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center" },
  acceptText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  updateButton: { height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  updateText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  completedBox: { height: 44, borderRadius: radius.md, backgroundColor: "#DDFBE7", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  completedText: { color: colors.primaryDeep, fontSize: 13, fontWeight: "900" },
  emptyCard: { minHeight: 210, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, ...softShadow },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: spacing.md, color: colors.text, fontSize: 18, fontWeight: "900" },
  emptySubtitle: { marginTop: spacing.xs, color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  modalTitle: { fontSize: 22, fontWeight: "900", color: colors.text },
  modalSubtitle: { fontSize: 12, fontWeight: "700", color: colors.textSoft, marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  modalSection: { marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: "#F7FAF8" },
  modalSectionLabel: { fontSize: 11, fontWeight: "900", color: colors.textSoft, textTransform: "uppercase", marginBottom: 4 },
  modalResidentName: { fontSize: 16, fontWeight: "900", color: colors.text },
  modalPhone: { fontSize: 14, fontWeight: "700", color: colors.primaryDeep, marginTop: 2 },
  modalAddress: { fontSize: 14, fontWeight: "800", color: colors.text },
  modalArea: { fontSize: 12, fontWeight: "700", color: colors.textSoft, marginTop: 2 },
  modalDetails: { fontSize: 14, fontWeight: "700", color: colors.text },
  modalNotes: { fontSize: 13, fontWeight: "700", color: "#8A5A00", marginTop: 4 },
  modalMetaGrid: { flexDirection: "row", gap: spacing.md, marginVertical: spacing.md },
  modalMetaItem: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, alignItems: "center" },
  modalMetaLabel: { fontSize: 10, fontWeight: "800", color: colors.textSoft },
  modalMetaValue: { fontSize: 14, fontWeight: "900", color: colors.text, marginTop: 4 },
  modalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },

  // Route Map & Live GPS Styles
  mapSectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...softShadow,
  },
  mapSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  mapSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginLeft: 6,
  },
  gpsToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: 4,
  },
  gpsToggleBtnActive: {
    backgroundColor: colors.primaryDark,
  },
  gpsToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  gpsToggleTextActive: {
    color: "#FFF",
  },
  modalActionSecondary: { flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  modalActionSecondaryText: { fontSize: 13, fontWeight: "900", color: colors.primaryDark },
  modalActionPrimary: { flex: 2, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center" },
  modalActionPrimaryText: { fontSize: 13, fontWeight: "900", color: "#FFFFFF" },
  simulationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  simulationBtnActive: {
    backgroundColor: colors.primaryDark,
  },
  simulationBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  simulationBtnTextActive: {
    color: "#FFF",
  },
});

