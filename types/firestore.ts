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