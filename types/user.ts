import type { FieldValue, Timestamp } from "firebase/firestore";

export type UserRole = "resident" | "collector" | "admin";
export type RegisterRole = "resident" | "collector";
export type AccountStatus = "active" | "pending" | "disabled";

export type AreaInfo = {
  district: string;
  dsDivision: string;
  gnDivision: string;
};

export type EcoUserProfile = {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  area?: AreaInfo;
  photoURL?: string | null;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
};

export type SignupDraft = {
  role?: RegisterRole;
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  area?: AreaInfo;
};