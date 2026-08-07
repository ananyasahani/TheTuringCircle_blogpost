import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "theturingcircle-25a76";

const firebaseConfig = {
    // The emulator suite ignores real credentials but the SDK still requires a
    // non-empty apiKey to initialize, so fall back to a placeholder in dev.
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
    authDomain:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
        `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        `${projectId}.appspot.com`,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators only during local development. Guarded so hot reloads
// don't try to reconnect an already-connected emulator (which throws).
if (
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    !globalThis.__TTC_EMULATORS_CONNECTED__
) {
    globalThis.__TTC_EMULATORS_CONNECTED__ = true;
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8081);
    connectStorageEmulator(storage, "localhost", 9199);
}