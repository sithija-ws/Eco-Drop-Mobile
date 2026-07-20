import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { RewardCategory, RewardItem } from "../types/firestore";

export type CreateRewardItemInput = {
  title: string;
  description: string;
  category: RewardCategory;
  costInEcoDrops: number;
  originalValueLKR?: number;
  availableQuantity: number;
  sponsorName?: string;
};

function mapRewardDoc(document: { id: string; data: () => Record<string, unknown> }) {
  const data = document.data();
  return {
    id: document.id,
    ...data,
    costInEcoDrops: Number(data.costInEcoDrops ?? 0),
    availableQuantity: Number(data.availableQuantity ?? 0),
  } as RewardItem;
}

export function listenRewardItems(
  onData: (rewards: RewardItem[]) => void,
  onError?: (error: Error) => void
) {
  const unsubscribe: Unsubscribe = onSnapshot(
    collection(db, "rewards"),
    (snapshot) => {
      const items = snapshot.docs.map(mapRewardDoc);
      onData(items);
    },
    (error) => onError?.(error)
  );

  return unsubscribe;
}

export async function createRewardItem(input: CreateRewardItemInput) {
  if (!input.title.trim()) {
    throw new Error("Please enter reward title.");
  }
  if (!input.description.trim()) {
    throw new Error("Please enter reward description.");
  }
  if (input.costInEcoDrops <= 0) {
    throw new Error("Cost in Eco Drops must be greater than 0.");
  }

  const data = {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    costInEcoDrops: input.costInEcoDrops,
    originalValueLKR: Number(input.originalValueLKR ?? 0),
    availableQuantity: Number(input.availableQuantity ?? 50),
    sponsorName: input.sponsorName?.trim() || "Eco-Drop Partner",
    status: "active" as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "rewards"), data);

  return {
    id: docRef.id,
    ...data,
  };
}

export async function toggleRewardStatus(rewardId: string, currentStatus: "active" | "out_of_stock" | "inactive") {
  const nextStatus = currentStatus === "active" ? "inactive" : "active";
  await updateDoc(doc(db, "rewards", rewardId), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRewardItem(rewardId: string) {
  await deleteDoc(doc(db, "rewards", rewardId));
}

export function formatRewardCategory(category: RewardCategory) {
  const labels: Record<RewardCategory, string> = {
    voucher: "Supermarket Voucher",
    utility: "Bill Discount",
    eco_product: "Eco Product",
    transit: "Bus / Train Pass",
  };

  return labels[category] ?? "Reward";
}
