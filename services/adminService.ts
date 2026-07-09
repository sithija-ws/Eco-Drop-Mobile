import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { EcoUserProfile } from "../types/user";
import type { PickupRequest, SmartBin } from "../types/firestore";

export type AdminReport = {
  id: string;
  userId?: string;
  title?: string;
  description?: string;
  status?: "open" | "review" | "resolved";
  priority?: "low" | "normal" | "high";
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AdminDashboardData = {
  users: EcoUserProfile[];
  pickupRequests: PickupRequest[];
  smartBins: SmartBin[];
  reports: AdminReport[];
};

function mapDoc<T>(document: {
  id: string;
  data: () => Record<string, unknown>;
}) {
  return {
    id: document.id,
    ...document.data(),
  } as T;
}

function mapUserDoc(document: {
  id: string;
  data: () => Record<string, unknown>;
}) {
  return {
    uid: document.id,
    ...document.data(),
  } as EcoUserProfile;
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

export function listenAdminDashboard(
  onData: (data: AdminDashboardData) => void,
  onError?: (error: Error) => void
) {
  const unsubscribers: Unsubscribe[] = [];

  let users: EcoUserProfile[] = [];
  let pickupRequests: PickupRequest[] = [];
  let smartBins: SmartBin[] = [];
  let reports: AdminReport[] = [];

  const emit = () => {
    onData({
      users,
      pickupRequests,
      smartBins,
      reports,
    });
  };

  unsubscribers.push(
    onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        users = snapshot.docs.map(mapUserDoc);
        emit();
      },
      (error) => onError?.(error)
    )
  );

  unsubscribers.push(
    onSnapshot(
      collection(db, "pickupRequests"),
      (snapshot) => {
        pickupRequests = snapshot.docs.map((doc) =>
          mapDoc<PickupRequest>(doc)
        );
        emit();
      },
      (error) => onError?.(error)
    )
  );

  unsubscribers.push(
    onSnapshot(
      collection(db, "smartBins"),
      (snapshot) => {
        smartBins = snapshot.docs.map(mapSmartBinDoc);
        emit();
      },
      (error) => onError?.(error)
    )
  );

  unsubscribers.push(
    onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        reports = snapshot.docs.map((doc) => mapDoc<AdminReport>(doc));
        emit();
      },
      (error) => onError?.(error)
    )
  );

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}