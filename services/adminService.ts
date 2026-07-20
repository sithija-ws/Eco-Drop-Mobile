import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { EcoUserProfile } from "../types/user";
import type {
  PickupRequest,
  ReportCategory,
  ReportStatus,
  SmartBin,
  WasteReport,
} from "../types/firestore";

export type AdminDashboardData = {
  totalPickups: number;
  completedPickups: number;
  openRequests: number;
  activeCollectors: number;
  pendingCollectors: number;
  residentCount: number;
  overflowSmartBins: number;
  reportsCount: number;
  smartBinHealth: SmartBin[];
  requestsQueue: PickupRequest[];
  reports: WasteReport[];
};

export type CreateWasteReportInput = {
  title: string;
  description: string;
  category: ReportCategory;
  address?: string;
};

function toMillis(value: unknown) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function mapDoc<T>(document: { id: string; data: () => Record<string, unknown> }): T {
  return {
    id: document.id,
    ...document.data(),
  } as T;
}

export function listenAdminDashboard(
  onData: (data: AdminDashboardData) => void,
  onError?: (error: Error) => void
) {
  const unsubscribers: Unsubscribe[] = [];

  let users: EcoUserProfile[] = [];
  let pickupRequests: PickupRequest[] = [];
  let smartBins: SmartBin[] = [];
  let reports: WasteReport[] = [];

  const emit = () => {
    const totalPickups = pickupRequests.length;
    const completedPickups = pickupRequests.filter(
      (req) => req.status === "completed"
    ).length;
    const openRequests = pickupRequests.filter(
      (req) => req.status === "submitted" || req.status === "waiting_for_collector"
    ).length;

    const activeCollectors = users.filter(
      (u) => u.role === "collector" && u.status === "active"
    ).length;
    const pendingCollectors = users.filter(
      (u) => u.role === "collector" && u.status === "pending"
    ).length;
    const residentCount = users.filter((u) => u.role === "resident").length;

    const overflowSmartBins = smartBins.filter(
      (bin) => Number(bin.fillLevel ?? 0) >= 85
    ).length;

    const sortedBins = [...smartBins].sort(
      (a, b) => Number(b.fillLevel ?? 0) - Number(a.fillLevel ?? 0)
    );

    const requestsQueue = [...pickupRequests]
      .filter((req) => req.status === "submitted" || req.status === "waiting_for_collector")
      .sort((a, b) => (toMillis(b.createdAt) || 0) - (toMillis(a.createdAt) || 0));

    const activeReports = reports.filter((r) => r.status !== "resolved");

    onData({
      totalPickups,
      completedPickups,
      openRequests,
      activeCollectors,
      pendingCollectors,
      residentCount,
      overflowSmartBins,
      reportsCount: activeReports.length,
      smartBinHealth: sortedBins.slice(0, 5),
      requestsQueue: requestsQueue.slice(0, 5),
      reports,
    });
  };

  // 1. Users listener
  unsubscribers.push(
    onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        users = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as EcoUserProfile));
        emit();
      },
      (err) => onError?.(err)
    )
  );

  // 2. Pickup requests listener
  unsubscribers.push(
    onSnapshot(
      collection(db, "pickupRequests"),
      (snapshot) => {
        pickupRequests = snapshot.docs.map((d) => mapDoc<PickupRequest>(d));
        emit();
      },
      (err) => onError?.(err)
    )
  );

  // 3. Smart Bins listener
  unsubscribers.push(
    onSnapshot(
      collection(db, "smartBins"),
      (snapshot) => {
        smartBins = snapshot.docs.map((d) => mapDoc<SmartBin>(d));
        emit();
      },
      (err) => onError?.(err)
    )
  );

  // 4. Reports listener
  unsubscribers.push(
    onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        reports = snapshot.docs.map((d) => mapDoc<WasteReport>(d));
        emit();
      },
      (err) => onError?.(err)
    )
  );

  return () => unsubscribers.forEach((unsub) => unsub());
}

export function listenAllReports(
  onData: (reports: WasteReport[]) => void,
  onError?: (error: Error) => void
) {
  const unsubscribe = onSnapshot(
    collection(db, "reports"),
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapDoc<WasteReport>(d));
      const sorted = items.sort(
        (a, b) => (toMillis(b.createdAt) || 0) - (toMillis(a.createdAt) || 0)
      );
      onData(sorted);
    },
    (err) => onError?.(err)
  );

  return unsubscribe;
}

export async function createWasteReport(
  reporter: EcoUserProfile,
  input: CreateWasteReportInput
) {
  if (!input.title.trim()) {
    throw new Error("Please enter report title.");
  }
  if (!input.description.trim()) {
    throw new Error("Please enter report description.");
  }

  const data = {
    reporterId: reporter.uid,
    reporterName: reporter.fullName,
    reporterRole: reporter.role,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    status: "open" satisfies ReportStatus,
    location: {
      address: input.address?.trim() || reporter.area?.gnDivision || "",
    },
    area: reporter.area || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "reports"), data);
  return { id: docRef.id, ...data };
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  await updateDoc(doc(db, "reports", reportId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
