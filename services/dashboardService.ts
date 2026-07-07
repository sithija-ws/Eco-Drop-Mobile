import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { EcoUserProfile } from "../types/user";
import type { PickupRequest, PickupStatus, SmartBin } from "../types/firestore";

export type ResidentDashboardData = {
  pickupRequests: PickupRequest[];
  smartBins: SmartBin[];
};

export type CollectorDashboardData = {
  assignedJobs: PickupRequest[];
  incomingRequests: PickupRequest[];
};

const ACTIVE_STATUSES: PickupStatus[] = [
  "accepted",
  "collector_on_the_way",
  "collected",
];

const OPEN_STATUSES: PickupStatus[] = ["submitted", "waiting_for_collector"];

function toMillis(value: unknown) {
  if (!value) return 0;

  if (value instanceof Date) return value.getTime();

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as Timestamp).toMillis === "function"
  ) {
    return (value as Timestamp).toMillis();
  }

  return 0;
}

export function sortByNewest<T extends { createdAt?: unknown; updatedAt?: unknown }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    const bTime = toMillis(b.updatedAt) || toMillis(b.createdAt);
    const aTime = toMillis(a.updatedAt) || toMillis(a.createdAt);
    return bTime - aTime;
  });
}

function mapPickupDoc(document: {
  id: string;
  data: () => Record<string, unknown>;
}) {
  return {
    id: document.id,
    ...document.data(),
  } as PickupRequest;
}

function mapSmartBinDoc(document: {
  id: string;
  data: () => Record<string, unknown>;
}) {
  const data = document.data();

  return {
    id: document.id,
    ...data,
    fillLevel: Number(data.fillLevel ?? 0),
  } as SmartBin;
}

export function listenResidentDashboard(
  profile: EcoUserProfile,
  onData: (data: ResidentDashboardData) => void,
  onError?: (error: Error) => void
) {
  const unsubscribers: Unsubscribe[] = [];

  let pickupRequests: PickupRequest[] = [];
  let smartBins: SmartBin[] = [];

  const emit = () => {
    onData({
      pickupRequests: sortByNewest(pickupRequests),
      smartBins: [...smartBins].sort((a, b) => b.fillLevel - a.fillLevel),
    });
  };

  const pickupQuery = query(
    collection(db, "pickupRequests"),
    where("residentId", "==", profile.uid)
  );

  unsubscribers.push(
    onSnapshot(
      pickupQuery,
      (snapshot) => {
        pickupRequests = snapshot.docs.map(mapPickupDoc);
        emit();
      },
      (error) => onError?.(error)
    )
  );

  if (profile.area?.gnDivision) {
    const binQuery = query(
      collection(db, "smartBins"),
      where("area.gnDivision", "==", profile.area.gnDivision)
    );

    unsubscribers.push(
      onSnapshot(
        binQuery,
        (snapshot) => {
          smartBins = snapshot.docs.map(mapSmartBinDoc);
          emit();
        },
        (error) => onError?.(error)
      )
    );
  }

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export function listenCollectorDashboard(
  profile: EcoUserProfile,
  onData: (data: CollectorDashboardData) => void,
  onError?: (error: Error) => void
) {
  const unsubscribers: Unsubscribe[] = [];

  let assignedJobs: PickupRequest[] = [];
  let incomingRequests: PickupRequest[] = [];

  const emit = () => {
    onData({
      assignedJobs: sortByNewest(assignedJobs),
      incomingRequests: sortByNewest(incomingRequests),
    });
  };

  const assignedQuery = query(
    collection(db, "pickupRequests"),
    where("collectorId", "==", profile.uid)
  );

  unsubscribers.push(
    onSnapshot(
      assignedQuery,
      (snapshot) => {
        assignedJobs = snapshot.docs.map(mapPickupDoc);
        emit();
      },
      (error) => onError?.(error)
    )
  );

  if (profile.area?.gnDivision) {
    const incomingQuery = query(
      collection(db, "pickupRequests"),
      where("area.gnDivision", "==", profile.area.gnDivision)
    );

    unsubscribers.push(
      onSnapshot(
        incomingQuery,
        (snapshot) => {
          incomingRequests = snapshot.docs
            .map(mapPickupDoc)
            .filter((request) => OPEN_STATUSES.includes(request.status));

          emit();
        },
        (error) => onError?.(error)
      )
    );
  }

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export async function acceptPickupRequest(
  requestId: string,
  collector: EcoUserProfile
) {
  await updateDoc(doc(db, "pickupRequests", requestId), {
    collectorId: collector.uid,
    collectorName: collector.fullName,
    status: "accepted" satisfies PickupStatus,
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePickupStatus(
  requestId: string,
  status: PickupStatus
) {
  await updateDoc(doc(db, "pickupRequests", requestId), {
    status,
    updatedAt: serverTimestamp(),
    ...(status === "completed" ? { completedAt: serverTimestamp() } : {}),
  });
}

export function getActiveCollectorJob(jobs: PickupRequest[]) {
  return jobs.find((job) => ACTIVE_STATUSES.includes(job.status)) ?? null;
}

export function calculateEcoDrops(requests: PickupRequest[]) {
  return requests
    .filter((request) => request.status === "completed")
    .reduce((total, request) => total + Number(request.ecoDrops ?? 20), 0);
}

export function calculateTodayEarnings(jobs: PickupRequest[]) {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  return jobs
    .filter((job) => job.status === "completed")
    .filter((job) => toMillis(job.completedAt) >= start)
    .reduce((total, job) => total + Number(job.price ?? 0), 0);
}

export function formatPickupStatus(status: PickupStatus) {
  const labels: Record<PickupStatus, string> = {
    submitted: "Submitted",
    waiting_for_collector: "Waiting",
    accepted: "Accepted",
    collector_on_the_way: "On the way",
    collected: "Collected",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };

  return labels[status];
}

export function formatWasteCategory(category?: string) {
  const labels: Record<string, string> = {
    plastic: "Plastic Recycling",
    organic: "Organic Waste",
    paper: "Paper Waste",
    glass: "Glass Waste",
    electronic: "Electronic Waste",
    mixed: "Mixed Waste",
    recycling: "Recycling Bin",
    general: "General Waste",
  };

  return labels[category ?? ""] ?? "Waste Pickup";
}