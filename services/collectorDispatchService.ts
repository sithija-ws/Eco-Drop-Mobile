import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { EcoUserProfile } from "../types/user";
import type { PickupLocation, PickupRequest } from "../types/firestore";

export type CollectorMatchResult = {
  collector: EcoUserProfile;
  matchScore: number;
  matchReason: string;
  activeWorkload: number;
};

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Radius of Earth in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function findBestCollectorForPickup(
  area?: { district?: string; gnDivision?: string } | null,
  pickupLocation?: PickupLocation
): Promise<CollectorMatchResult | null> {
  try {
    // 1. Fetch active collectors
    let collectors: EcoUserProfile[] = [];
    try {
      const collectorsQuery = query(
        collection(db, "users"),
        where("role", "==", "collector")
      );
      const collectorsSnap = await getDocs(collectorsQuery);
      collectors = collectorsSnap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      })) as EcoUserProfile[];
    } catch (e) {
      console.warn("Could not query collectors list:", e);
      return null;
    }

    if (collectors.length === 0) {
      return null;
    }

    // 2. Fetch active assigned jobs to measure workload (graceful fallback if restricted)
    const workloadMap: Record<string, number> = {};
    try {
      const activeJobsQuery = query(
        collection(db, "pickupRequests"),
        where("status", "in", ["accepted", "collector_on_the_way", "collected"])
      );
      const activeJobsSnap = await getDocs(activeJobsQuery);
      activeJobsSnap.docs.forEach((d) => {
        const job = d.data() as PickupRequest;
        if (job.collectorId) {
          workloadMap[job.collectorId] = (workloadMap[job.collectorId] || 0) + 1;
        }
      });
    } catch (e) {
      // Non-critical: If resident lacks permission to list all pickup requests, continue with 0 workload
    }

    // 3. Score each collector
    const ranked: CollectorMatchResult[] = collectors.map((collector) => {
      const activeWorkload = workloadMap[collector.uid] || 0;
      const rating = Number(collector.rating ?? 4.8);

      // Rating score (max 40 pts)
      const ratingScore = Math.min(40, (rating / 5) * 40);

      // Workload score (max 35 pts) — fewer active jobs gives higher score
      const workloadScore = Math.max(0, 35 - activeWorkload * 10);

      // Proximity score (max 25 pts)
      let proximityScore = 10;
      let locationReason = "Regional Collector";

      if (area?.gnDivision && collector.area?.gnDivision === area.gnDivision) {
        proximityScore = 25;
        locationReason = `Assigned in GN Division (${area.gnDivision})`;
      } else if (area?.district && collector.area?.district === area.district) {
        proximityScore = 18;
        locationReason = `Assigned in District (${area.district})`;
      }

      if (
        pickupLocation?.latitude &&
        pickupLocation?.longitude &&
        collector.currentLocation?.latitude &&
        collector.currentLocation?.longitude
      ) {
        const distKm = calculateHaversineDistanceKm(
          pickupLocation.latitude,
          pickupLocation.longitude,
          collector.currentLocation.latitude,
          collector.currentLocation.longitude
        );
        if (distKm <= 3) proximityScore = 25;
        else if (distKm <= 10) proximityScore = 20;
        else proximityScore = 12;
        locationReason = `${distKm} km away`;
      }

      const totalScore = Math.round(ratingScore + workloadScore + proximityScore);
      const reason = `Score: ${totalScore}/100 • Rating ${rating}★ • ${activeWorkload} active jobs • ${locationReason}`;

      return {
        collector,
        matchScore: totalScore,
        matchReason: reason,
        activeWorkload,
      };
    });

    // Sort by match score descending
    ranked.sort((a, b) => b.matchScore - a.matchScore);

    return ranked[0] ?? null;
  } catch (error) {
    console.warn("Error finding best collector for pickup", error);
    return null;
  }
}
