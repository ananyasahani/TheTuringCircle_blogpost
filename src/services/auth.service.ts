import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

/**
 * Three tiers, mirroring firestore.rules:
 *   reader    — the default; reads posts and writes comments
 *   editor    — reader + writes and publishes their own posts
 *   moderator — editor + deletes any post or comment
 *
 * Promotion happens in the Firebase console. The rules forbid a member from
 * changing their own role, so it can't be done from the app.
 */
export type Role = "reader" | "editor" | "moderator";

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: Role;
  createdAt?: unknown;
}

/** May author and publish posts. */
export function canWrite(user: UserProfile | null): boolean {
  return user?.role === "editor" || user?.role === "moderator";
}

/** May delete anyone's post or comment. */
export function isModerator(user: UserProfile | null): boolean {
  return user?.role === "moderator";
}

/** Human label for the profile header. */
export function roleLabel(role: Role | undefined): string {
  if (role === "moderator") return "Moderator";
  if (role === "editor") return "Editor";
  return "Member";
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
