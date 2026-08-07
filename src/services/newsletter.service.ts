import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Subscribe an email to the weekly digest. Stored in `subscribers`, keyed by
 * the normalized email so re-subscribing is idempotent (no duplicates). The
 * list is not client-readable per the Firestore rules.
 */
export async function subscribeEmail(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  await setDoc(doc(db, "subscribers", email), {
    email,
    createdAt: serverTimestamp(),
  });
}
