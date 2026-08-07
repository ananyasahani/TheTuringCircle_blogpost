import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  uid: string;
  name: string;
  username?: string | null;
  email: string | null;
  avatar: string | null;
  role: "reader" | "moderator";
  createdAt?: unknown;
}

/** Normalize a username to the canonical, storable form. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9_]/g, "");
}

/** Validate a username: 3–20 chars, letters/numbers/underscore. */
export function isValidUsername(name: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(name);
}

/**
 * Claim a unique username for the signed-in user. Uniqueness is enforced by a
 * `usernames/{name}` doc (create-only per rules): if it already exists the
 * write is denied and we surface "taken". On success we also stamp the name
 * onto the user's own profile doc.
 */
export async function claimUsername(
  uid: string,
  raw: string,
): Promise<string> {
  const name = normalizeUsername(raw);
  if (!isValidUsername(name)) {
    throw new Error(
      "Usernames are 3–20 characters: letters, numbers, or underscore.",
    );
  }
  const ref = doc(db, "usernames", name);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error("That username is taken.");
  }
  try {
    await setDoc(ref, { uid, createdAt: serverTimestamp() });
  } catch {
    throw new Error("That username is taken.");
  }
  await updateDoc(doc(db, "users", uid), { username: name });
  return name;
}

/**
 * Ensure a users/{uid} document exists. The Firestore rules read this doc to
 * resolve roles (e.g. moderator), so every signed-in user needs one. New users
 * default to the "reader" role; existing docs are left untouched.
 */
async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      name: user.displayName || "Anonymous",
      username: null,
      email: user.email,
      avatar: user.photoURL,
      role: "reader",
    };
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
    return profile;
  }

  return { uid: user.uid, ...(snap.data() as Omit<UserProfile, "uid">) };
}

/** Sign in with a Google popup and provision the user's profile doc. */
export async function signInWithGoogle(): Promise<UserProfile> {
  const { user } = await signInWithPopup(auth, googleProvider);
  return ensureUserProfile(user);
}

/** Sign the current user out. */
export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/** Re-read the current user's profile doc (e.g. after claiming a username). */
export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return ensureUserProfile(user);
}

/**
 * Subscribe to auth state. The callback receives the resolved UserProfile
 * (with role) when signed in, or null when signed out. Returns an unsubscribe.
 */
export function subscribeToAuth(
  callback: (profile: UserProfile | null) => void,
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      callback(await ensureUserProfile(user));
    } catch {
      // If the profile lookup fails (e.g. offline), still surface the basics.
      callback({
        uid: user.uid,
        name: user.displayName || "Anonymous",
        email: user.email,
        avatar: user.photoURL,
        role: "reader",
      });
    }
  });
}
