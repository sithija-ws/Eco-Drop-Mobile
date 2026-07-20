import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { EcoUserProfile } from "../types/user";
import type { SmartBin, WasteCategory } from "../types/firestore";

export type SmartBinType = WasteCategory | "recycling" | "general";
export type SmartBinStatus = "active" | "maintenance" | "offline";

export type CreateSmartBinInput = {
  name: string;
  type: SmartBinType;
  fillLevel: number;
  capacityLiters?: number;
  address: string;
  status: SmartBinStatus;
};

function mapSmartBinDoc(document: { id: string; data: () => Record<string, unknown> }) {
  const data = document.data();

  return {
    id: document.id,
    ...data,
    fillLevel: Number(data.fillLevel ?? 0),
    capacityLiters: Number(data.capacityLiters ?? 0),
  } as SmartBin;
}

function sortBins(bins: SmartBin[]) {
  return [...bins].sort((a, b) => Number(b.fillLevel ?? 0) - Number(a.fillLevel ?? 0));
}

function clampFillLevel(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function listenSmartBinsByGnDivision(
  gnDivision: string | undefined,
  onData: (bins: SmartBin[]) => void,
  onError?: (error: Error) => void
) {
  if (!gnDivision) {
    onData([]);
    return () => undefined;
  }

  const binsQuery = query(
    collection(db, "smartBins"),
    where("area.gnDivision", "==", gnDivision)
  );

  const unsubscribe: Unsubscribe = onSnapshot(
    binsQuery,
    (snapshot) => {
      onData(sortBins(snapshot.docs.map(mapSmartBinDoc)));
    },
    (error) => onError?.(error)
  );

  return unsubscribe;
}

export function listenAllSmartBins(
  onData: (bins: SmartBin[]) => void,
  onError?: (error: Error) => void
) {
  const unsubscribe: Unsubscribe = onSnapshot(
    collection(db, "smartBins"),
    (snapshot) => {
      onData(sortBins(snapshot.docs.map(mapSmartBinDoc)));
    },
    (error) => onError?.(error)
  );

  return unsubscribe;
}

export async function createSmartBin(admin: EcoUserProfile, input: CreateSmartBinInput) {
  if (admin.role !== "admin") {
    throw new Error("Only admin accounts can create smart bins.");
  }

  if (!input.name.trim()) {
    throw new Error("Please enter bin name.");
  }

  if (!input.address.trim()) {
    throw new Error("Please enter bin address or location.");
  }

  const data = {
    name: input.name.trim(),
    type: input.type,
    fillLevel: clampFillLevel(input.fillLevel),
    capacityLiters: Number(input.capacityLiters ?? 500),
    status: input.status,
    location: {
      address: input.address.trim(),
    },
    area: admin.area ?? null,
    createdBy: admin.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "smartBins"), data);

  return {
    id: docRef.id,
    ...data,
  };
}

export async function updateSmartBinFillLevel(binId: string, fillLevel: number) {
  await updateDoc(doc(db, "smartBins", binId), {
    fillLevel: clampFillLevel(fillLevel),
    updatedAt: serverTimestamp(),
  });
}

export async function emptySmartBin(binId: string) {
  await updateDoc(doc(db, "smartBins", binId), {
    fillLevel: 0,
    lastEmptiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSmartBinStatus(binId: string, status: SmartBinStatus) {
  await updateDoc(doc(db, "smartBins", binId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export function getBinFillColor(fillLevel: number) {
  if (fillLevel >= 85) return "#E73D3D";
  if (fillLevel >= 60) return "#F8C348";
  return "#0B8F49";
}

export function formatBinType(type?: string) {
  const labels: Record<string, string> = {
    plastic: "Plastic",
    organic: "Organic",
    paper: "Paper",
    glass: "Glass",
    electronic: "E-Waste",
    mixed: "Mixed",
    recycling: "Recycling",
    general: "General",
  };

  return labels[type ?? ""] ?? "General";
}
