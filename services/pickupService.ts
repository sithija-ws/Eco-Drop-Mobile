import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { findBestCollectorForPickup } from "./collectorDispatchService";
import type { EcoUserProfile } from "../types/user";
import type { PickupStatus, WasteCategory } from "../types/firestore";

export type CreatePickupRequestInput = {
  resident: EcoUserProfile;
  wasteCategory: WasteCategory;
  wasteDetails: string;
  address: string;
  latitude?: number;
  longitude?: number;
  preferredDateText?: string;
  notes?: string;

  quantityKg?: number;
  selectedCollectorId?: string | null;
  selectedCollectorName?: string | null;
  payoutMode?: "cash_on_delivery" | "wallet";

  // Keep this for later, but we will not upload images now.
  imageUris?: string[];
};

const CATEGORY_PRICE: Record<WasteCategory, number> = {
  plastic: 150,
  organic: 120,
  paper: 100,
  glass: 180,
  electronic: 350,
  mixed: 250,
};

const CATEGORY_DROPS: Record<WasteCategory, number> = {
  plastic: 30,
  organic: 20,
  paper: 25,
  glass: 25,
  electronic: 60,
  mixed: 15,
};

// Recycling payout rates in LKR per kg/unit paid to residents
export const RECYCLABLE_PAYOUT_RATES: Record<WasteCategory, number> = {
  paper: 60,      // Rs 60 / kg for paper / cardboard
  glass: 40,      // Rs 40 / kg (or per bottle)
  electronic: 200, // Rs 200 / kg for e-waste
  plastic: 80,    // Rs 80 / kg for plastic bottles
  organic: 0,
  mixed: 0,
};

export function calculateEstimatedPickupPrice(category: WasteCategory) {
  return CATEGORY_PRICE[category] ?? 200;
}

export function calculateEcoDropsForCategory(category: WasteCategory) {
  return CATEGORY_DROPS[category] ?? 20;
}

export function calculateRecyclingPayout(category: WasteCategory, quantityKg: number = 0): number {
  const rate = RECYCLABLE_PAYOUT_RATES[category] ?? 0;
  return Math.round(rate * Math.max(0, quantityKg));
}

export async function createPickupRequest(input: CreatePickupRequestInput) {
  const { resident, wasteCategory } = input;

  if (resident.role !== "resident") {
    throw new Error("Only resident accounts can create pickup requests.");
  }

  if (!input.wasteDetails.trim()) {
    throw new Error("Please enter waste details.");
  }

  if (!input.address.trim()) {
    throw new Error("Please enter pickup address.");
  }

  const status: PickupStatus = "submitted";

  const locationObj = {
    address: input.address.trim(),
    latitude: input.latitude ?? 6.9271,
    longitude: input.longitude ?? 79.8612,
  };

  let matchedCollectorId = input.selectedCollectorId ?? null;
  let matchedCollectorName = input.selectedCollectorName ?? null;
  let matchScore = 100;
  let matchReason = "Directly selected by resident";

  if (!matchedCollectorId) {
    const bestMatch = await findBestCollectorForPickup(resident.area, locationObj);
    matchedCollectorId = bestMatch?.collector.uid ?? null;
    matchedCollectorName = bestMatch?.collector.fullName ?? null;
    matchScore = bestMatch?.matchScore ?? 0;
    matchReason = bestMatch?.matchReason ?? "No active collector matched yet";
  }

  const estimatedPayout = calculateRecyclingPayout(wasteCategory, input.quantityKg ?? 0);

  const pickupData = {
    residentId: resident.uid,
    residentName: resident.fullName,
    residentPhone: resident.phone,

    collectorId: null,
    collectorName: null,

    matchedCollectorId,
    matchedCollectorName,
    selectedCollectorId: input.selectedCollectorId ?? null,
    selectedCollectorName: input.selectedCollectorName ?? null,

    matchScore,
    matchReason,

    wasteCategory,
    wasteDetails: input.wasteDetails.trim(),

    quantityKg: input.quantityKg ?? 0,
    estimatedPayout,
    payoutMode: input.payoutMode ?? "cash_on_delivery",

    imageUrls: [],
    location: locationObj,
    area: resident.area ?? null,

    preferredDateText: input.preferredDateText?.trim() ?? "",
    notes: input.notes?.trim() ?? "",

    status,

    price: calculateEstimatedPickupPrice(wasteCategory),
    ecoDrops: calculateEcoDropsForCategory(wasteCategory),

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "pickupRequests"), pickupData);

  return {
    id: docRef.id,
    ...pickupData,
  };
}