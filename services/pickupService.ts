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

export function calculateEstimatedPickupPrice(category: WasteCategory) {
  return CATEGORY_PRICE[category] ?? 200;
}

export function calculateEcoDropsForCategory(category: WasteCategory) {
  return CATEGORY_DROPS[category] ?? 20;
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

  // Find top matched collector in area using ranking algorithm
  const locationObj = {
    address: input.address.trim(),
    latitude: input.latitude ?? 6.9271,
    longitude: input.longitude ?? 79.8612,
  };
  const bestMatch = await findBestCollectorForPickup(resident.area, locationObj);

  const pickupData = {
    residentId: resident.uid,
    residentName: resident.fullName,
    residentPhone: resident.phone,

    collectorId: null,
    collectorName: null,

    matchedCollectorId: bestMatch?.collector.uid ?? null,
    matchedCollectorName: bestMatch?.collector.fullName ?? null,
    matchScore: bestMatch?.matchScore ?? 0,
    matchReason: bestMatch?.matchReason ?? "No active collector matched yet",

    wasteCategory,
    wasteDetails: input.wasteDetails.trim(),

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