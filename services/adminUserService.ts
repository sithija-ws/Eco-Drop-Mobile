import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { AccountStatus, EcoUserProfile } from "../types/user";

function toMillis(value: unknown) {
  if (!value) return 0;

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  return 0;
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

function sortUsers(users: EcoUserProfile[]) {
  return [...users].sort((a, b) => {
    const bTime = toMillis(b.createdAt) || toMillis(b.updatedAt);
    const aTime = toMillis(a.createdAt) || toMillis(a.updatedAt);

    return bTime - aTime;
  });
}

export function listenAllUsers(
  onData: (users: EcoUserProfile[]) => void,
  onError?: (error: Error) => void
) {
  const unsubscribe: Unsubscribe = onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      const users = snapshot.docs.map(mapUserDoc);
      onData(sortUsers(users));
    },
    (error) => {
      onError?.(error);
    }
  );

  return unsubscribe;
}

export async function updateUserStatus(uid: string, status: AccountStatus) {
  await updateDoc(doc(db, "users", uid), {
    status,
    updatedAt: serverTimestamp(),
  });
}