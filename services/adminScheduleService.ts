import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { CollectionSchedule, DayOfWeek, WasteCategory } from "../types/firestore";

export type CreateScheduleInput = {
  title: string;
  gnDivision: string;
  district?: string;
  wasteCategory: WasteCategory | "all";
  dayOfWeek: DayOfWeek;
  timeSlot: string;
  assignedCollectorName?: string;
  assignedCollectorId?: string;
};

function mapScheduleDoc(document: { id: string; data: () => Record<string, unknown> }) {
  return {
    id: document.id,
    ...document.data(),
  } as CollectionSchedule;
}

export function listenCollectionSchedules(
  onData: (schedules: CollectionSchedule[]) => void,
  onError?: (error: Error) => void
) {
  const unsubscribe: Unsubscribe = onSnapshot(
    collection(db, "collectionSchedules"),
    (snapshot) => {
      const items = snapshot.docs.map(mapScheduleDoc);
      onData(items);
    },
    (error) => onError?.(error)
  );

  return unsubscribe;
}

export function listenSchedulesByGnDivision(
  gnDivision: string | undefined,
  onData: (schedules: CollectionSchedule[]) => void,
  onError?: (error: Error) => void
) {
  if (!gnDivision) {
    onData([]);
    return () => undefined;
  }

  const q = query(
    collection(db, "collectionSchedules"),
    where("gnDivision", "==", gnDivision)
  );

  const unsubscribe: Unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map(mapScheduleDoc));
    },
    (error) => onError?.(error)
  );

  return unsubscribe;
}

export async function createCollectionSchedule(input: CreateScheduleInput) {
  if (!input.title.trim()) {
    throw new Error("Please enter schedule title.");
  }
  if (!input.gnDivision.trim()) {
    throw new Error("Please enter GN division.");
  }

  const data = {
    title: input.title.trim(),
    gnDivision: input.gnDivision.trim(),
    district: input.district?.trim() || "Colombo",
    wasteCategory: input.wasteCategory,
    dayOfWeek: input.dayOfWeek,
    timeSlot: input.timeSlot.trim(),
    assignedCollectorName: input.assignedCollectorName?.trim() || "",
    assignedCollectorId: input.assignedCollectorId || "",
    status: "active" as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "collectionSchedules"), data);

  return {
    id: docRef.id,
    ...data,
  };
}

export async function toggleScheduleStatus(scheduleId: string, currentStatus: "active" | "paused") {
  const newStatus = currentStatus === "active" ? "paused" : "active";
  await updateDoc(doc(db, "collectionSchedules", scheduleId), {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCollectionSchedule(scheduleId: string) {
  await deleteDoc(doc(db, "collectionSchedules", scheduleId));
}
