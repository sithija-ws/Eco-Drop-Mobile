import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { EcoUserProfile } from "../types/user";

export async function rateCollectorJob(
  requestId: string,
  collectorId: string,
  rating: number,
  reviewComment?: string
) {
  if (!requestId || !collectorId) {
    throw new Error("Invalid request or collector ID.");
  }

  const normalizedRating = Math.max(1, Math.min(5, Math.round(rating)));

  // 1. Update the Pickup Request document with rating & review
  const requestRef = doc(db, "pickupRequests", requestId);
  await updateDoc(requestRef, {
    rating: normalizedRating,
    ratingReview: reviewComment?.trim() || "",
    ratedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. Fetch Collector profile and recalculate average rating
  try {
    const collectorRef = doc(db, "users", collectorId);
    const collectorSnap = await getDoc(collectorRef);

    if (collectorSnap.exists()) {
      const collectorData = collectorSnap.data() as EcoUserProfile;
      const currentRating = Number(collectorData.rating ?? 4.8);
      const currentCount = Number(collectorData.reviewCount ?? 1);

      const newCount = currentCount + 1;
      const newRating = Math.round(((currentRating * currentCount + normalizedRating) / newCount) * 10) / 10;

      await updateDoc(collectorRef, {
        rating: newRating,
        reviewCount: newCount,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.warn("Could not update collector average rating:", error);
  }
}
