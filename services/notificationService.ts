import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { EcoNotification, NotificationType, PickupStatus } from "../types/firestore";

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as Timestamp).toMillis === "function"
  ) {
    return (value as Timestamp).toMillis();
  }
  return 0;
}

export type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: EcoNotification["data"];
};

export async function createNotification(input: CreateNotificationInput) {
  if (!input.userId) return null;

  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      read: false,
      data: input.data ?? {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.warn("Failed to create notification:", error);
    return null;
  }
}

export function listenUserNotifications(
  userId: string,
  onData: (notifications: EcoNotification[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,

          ...data,
        } as EcoNotification;
      });

      notifications.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(notifications);
    },
    (error) => {
      console.warn("Notification listener error:", error);
      onError?.(error);
    }
  );
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("Error marking notification read:", error);
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    const promises = snap.docs.map((d) =>
      updateDoc(doc(db, "notifications", d.id), {
        read: true,
        updatedAt: serverTimestamp(),
      })
    );
    await Promise.all(promises);
  } catch (error) {
    console.warn("Error marking all notifications read:", error);
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    await deleteDoc(doc(db, "notifications", notificationId));
  } catch (error) {
    console.warn("Error deleting notification:", error);
  }
}

export async function clearAllNotifications(userId: string) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const promises = snap.docs.map((d) =>
      deleteDoc(doc(db, "notifications", d.id))
    );
    await Promise.all(promises);
  } catch (error) {
    console.warn("Error clearing notifications:", error);
  }
}

// ----------------------------------------------------
// Specific Helper Triggers for App Events
// ----------------------------------------------------

export async function notifyPickupCreated(
  residentId: string,
  matchedCollectorId: string | null | undefined,
  categoryName: string,
  requestId: string
) {
  // 1. Resident confirmation
  await createNotification({
    userId: residentId,
    title: "Pickup Request Submitted 📦",
    message: `Your request for ${categoryName} pickup has been created successfully.`,
    type: "pickup_status",
    data: { requestId, screen: "track-pickup" },
  });

  // 2. Alert collector if directly matched/assigned
  if (matchedCollectorId) {
    await createNotification({
      userId: matchedCollectorId,
      title: "New Pickup Dispatch 🚛",
      message: `A new ${categoryName} pickup is waiting for your response in your area.`,
      type: "collector_dispatch",
      data: { requestId, screen: "collector/dashboard" },
    });
  }
}

export async function notifyPickupAccepted(
  residentId: string,
  collectorName: string,
  requestId: string
) {
  await createNotification({
    userId: residentId,
    title: "Collector Assigned! 🚚",
    message: `${collectorName} accepted your pickup request and will arrive as scheduled.`,
    type: "pickup_status",
    data: { requestId, screen: "track-pickup" },
  });
}

export async function notifyPickupStatusChanged(
  residentId: string,
  status: PickupStatus,
  categoryName: string,
  requestId: string
) {
  let title = "Pickup Status Updated";
  let message = `Your ${categoryName} pickup status is now ${status}.`;

  if (status === "collector_on_the_way") {
    title = "Collector is on the way! 🛵";
    message = `Your waste collector is heading to your address for ${categoryName} pickup.`;
  } else if (status === "collected") {
    title = "Waste Collected! ♻️";
    message = `Your ${categoryName} waste was picked up successfully. Finalizing payout...`;
  } else if (status === "completed") {
    title = "Pickup Completed 🎉";
    message = `Thank you! Your ${categoryName} pickup is complete. Check your Eco-Drops balance!`;
  } else if (status === "cancelled") {
    title = "Pickup Cancelled ❌";
    message = `Your ${categoryName} pickup request was cancelled.`;
  } else if (status === "rejected") {
    title = "Pickup Declined ⚠️";
    message = `Your ${categoryName} pickup request could not be processed.`;
  }

  await createNotification({
    userId: residentId,
    title,
    message,
    type: "pickup_status",
    data: { requestId, screen: "track-pickup" },
  });
}

export async function notifySmartBinOverflow(
  userIds: string[],
  binName: string,
  fillLevel: number,
  binId: string
) {
  const promises = userIds.map((userId) =>
    createNotification({
      userId,
      title: `Smart Bin Alert: ${fillLevel}% Full! 🚨`,
      message: `Smart Bin "${binName}" has reached high fill level (${fillLevel}%). Collection needed!`,
      type: "smart_bin_overflow",
      data: { binId, screen: "bins" },
    })
  );
  await Promise.all(promises);
}

export async function notifyScheduleAlert(
  userIds: string[],
  scheduleTitle: string,
  dayOfWeek: string,
  timeSlot: string,
  scheduleId?: string
) {
  const promises = userIds.map((userId) =>
    createNotification({
      userId,
      title: `New Collection Schedule 📅`,
      message: `Scheduled ${scheduleTitle} on ${dayOfWeek} (${timeSlot}).`,
      type: "schedule_alert",
      data: { scheduleId, screen: "schedule" },
    })
  );
  await Promise.all(promises);
}

export async function notifyRewardEarned(
  userId: string,
  rewardTitle: string,
  costInEcoDrops: number
) {
  await createNotification({
    userId,
    title: "Reward Redeemed! 🎁",
    message: `You spent ${costInEcoDrops} Eco-Drops to claim "${rewardTitle}". Enjoy your reward!`,
    type: "reward_earned",
    data: { screen: "rewards" },
  });
}
