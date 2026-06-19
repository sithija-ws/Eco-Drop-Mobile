import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { EcoUserProfile, SignupDraft } from "../types/user";

export async function getUserProfile(uid: string) {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as EcoUserProfile;
}

export async function loginEcoUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const profile = await getUserProfile(credential.user.uid);

  if (!profile) {
    throw new Error(
      "User profile not found in Firestore. Please contact admin."
    );
  }

  if (profile.status === "disabled") {
    await signOut(auth);
    throw new Error("This account has been disabled.");
  }

  return {
    firebaseUser: credential.user,
    profile,
  };
}

export async function registerEcoUser(draft: SignupDraft) {
  if (!draft.role) {
    throw new Error("Please select an account type.");
  }

  if (!draft.fullName || !draft.phone || !draft.email || !draft.password) {
    throw new Error("Please complete your personal information.");
  }

  if (draft.password !== draft.confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  if (draft.password.length < 6) {
    throw new Error("Password should be at least 6 characters.");
  }

  if (!draft.area) {
    throw new Error("Please complete your area setup.");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    draft.email.trim().toLowerCase(),
    draft.password
  );

  await updateProfile(credential.user, {
    displayName: draft.fullName.trim(),
  });

  const profile: EcoUserProfile = {
    uid: credential.user.uid,
    fullName: draft.fullName.trim(),
    email: draft.email.trim().toLowerCase(),
    phone: draft.phone.trim(),
    role: draft.role,

    // Resident can be active immediately.
    // Collector can be approved by admin later.
    status: draft.role === "collector" ? "pending" : "active",

    area: draft.area,
    photoURL: credential.user.photoURL,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", credential.user.uid), profile);

  return {
    firebaseUser: credential.user,
    profile,
  };
}

export async function logoutEcoUser() {
  await signOut(auth);
}