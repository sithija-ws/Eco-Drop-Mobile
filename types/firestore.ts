import type { FieldValue, Timestamp } from "firebase/firestore";
import type { AreaInfo } from "./user";

export type FirestoreDate = Timestamp | FieldValue | Date | null | undefined;

export type PickupStatus =
  | "submitted"
  | "waiting_for_collector"
  | "accepted"
  | "collector_on_the_way"
  | "collected"
  | "completed"
  | "cancelled"
  | "rejected";

export type WasteCategory =
  | "plastic"
  | "organic"
  | "paper"
  | "glass"
  | "electronic"
  | "mixed";

export type PickupLocation = {
  address: string;
  latitude?: number;
  longitude?: number;
};

export type PickupRequest = {
  id: string;
  residentId: string;
  residentName?: string;
  residentPhone?: string;
  collectorId?: string | null;
  collectorName?: string | null;
  matchedCollectorId?: string | null;
  matchedCollectorName?: string | null;
  matchScore?: number;
  matchReason?: string;
  wasteCategory: WasteCategory;
  wasteDetails?: string;
  imageUrls?: string[];
  location?: PickupLocation;
  area?: AreaInfo;
  preferredDate?: FirestoreDate;
  scheduledAt?: FirestoreDate;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  acceptedAt?: FirestoreDate;
  completedAt?: FirestoreDate;
  status: PickupStatus;
  price?: number;
  estimatedPayout?: number;
  quantityKg?: number;
  payoutMode?: "cash_on_delivery" | "wallet";
  selectedCollectorId?: string | null;
  selectedCollectorName?: string | null;
  rating?: number;
  ratingReview?: string;
  ratedAt?: FirestoreDate;
  ecoDrops?: number;
  notes?: string;
};

export type SmartBin = {
  id: string;
  name: string;
  type: WasteCategory | "recycling" | "general";
  area?: AreaInfo;
  fillLevel: number;
  capacityLiters?: number;
  location?: PickupLocation;
  updatedAt?: FirestoreDate;
  status?: "active" | "maintenance" | "offline";
};

export type ReportCategory =
  | "missed_pickup"
  | "overflowing_bin"
  | "illegal_dumping"
  | "other";

export type ReportStatus = "open" | "in_progress" | "resolved";

export type WasteReport = {
  id: string;
  reporterId: string;
  reporterName?: string;
  reporterRole?: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  location?: PickupLocation;
  area?: AreaInfo;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
};

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export type CollectionSchedule = {
  id: string;
  title: string;
  gnDivision: string;
  district?: string;
  wasteCategory: WasteCategory | "all";
  dayOfWeek: DayOfWeek;
  timeSlot: string; // e.g. "08:00 AM - 11:00 AM"
  assignedCollectorName?: string;
  assignedCollectorId?: string;
  status: "active" | "paused";
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
};

export type RewardCategory = "voucher" | "utility" | "eco_product" | "transit";

export type RewardItem = {
  id: string;
  title: string;
  description: string;
  category: RewardCategory;
  costInEcoDrops: number;
  originalValueLKR?: number;
  availableQuantity: number;
  imageUrl?: string;
  sponsorName?: string;
  status: "active" | "out_of_stock" | "inactive";
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
};