import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface CollectorGpsState {
  collectorId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmH?: number;
  updatedAt?: any;
}

/**
  * Update collector live GPS location in Firestore
  */
export async function updateCollectorGpsLocation(
  collectorId: string,
  latitude: number,
  longitude: number,
  heading: number = 0
) {
  if (!collectorId) return;

  try {
    const ref = doc(db, "collectorLiveLocations", collectorId);
    await setDoc(
      ref,
      {
        collectorId,
        latitude,
        longitude,
        heading,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Could not update collector GPS location:", error);
  }
}

/**
  * Subscribe to a collector's live location updates
  */
export function subscribeCollectorLocation(
  collectorId: string,
  onUpdate: (location: CollectorGpsState | null) => void
) {
  if (!collectorId) {
    onUpdate(null);
    return () => {};
  }

  const ref = doc(db, "collectorLiveLocations", collectorId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CollectorGpsState);
      } else {
        onUpdate(null);
      }
    },
    () => onUpdate(null)
  );
}

/**
  * Calculate distance in kilometers using the Haversine formula
  */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
  * Estimate arrival time in minutes (assuming average speed ~25 km/h for urban waste vehicle)
  */
export function estimateArrivalMinutes(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const distanceKm = calculateDistanceKm(lat1, lon1, lat2, lon2);
  const averageSpeedKmH = 25;
  const travelHours = distanceKm / averageSpeedKmH;
  const minutes = Math.ceil(travelHours * 60) + 2; // +2 mins for stop overhead
  return Math.max(1, minutes);
}

/**
  * Generate waypoint steps between 2 locations for map polyline rendering
  */
import { Platform, Linking } from "react-native";

export function generateInterpolatedPolyline(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  numSteps: number = 5
) {
  const points = [];
  for (let i = 0; i <= numSteps; i++) {
    const factor = i / numSteps;
    points.push({
      latitude: start.latitude + (end.latitude - start.latitude) * factor,
      longitude: start.longitude + (end.longitude - start.longitude) * factor,
    });
  }
  return points;
}

/**
 * Calculate compass bearing/heading in degrees from point 1 to point 2
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Format distance for clean UI display (e.g. '350 m' or '4.2 km')
 */
export function formatDistanceDisplay(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Check if collector vehicle is near destination (within threshold in meters)
 */
export function isCollectorNearDestination(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  thresholdMeters: number = 200
): boolean {
  const distKm = calculateDistanceKm(lat1, lon1, lat2, lon2);
  return distKm * 1000 <= thresholdMeters;
}

/**
 * Open external Turn-by-Turn GPS Navigation App (Google Maps / Apple Maps)
 */
export function openExternalNavigation(
  latitude: number,
  longitude: number,
  label: string = "Pickup Location"
) {
  const encodedLabel = encodeURIComponent(label);
  const url =
    Platform.OS === "ios"
      ? `maps:0,0?q=${encodedLabel}@${latitude},${longitude}`
      : `geo:0,0?q=${latitude},${longitude}(${encodedLabel})`;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        return Linking.openURL(googleMapsUrl);
      }
    })
    .catch(() => {
      Linking.openURL(googleMapsUrl);
    });
}

