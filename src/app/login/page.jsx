"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Once authenticated, leave the login screen.
  useEffect(() => {
    if (!loading && user) router.replace("/profile");
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setError("");
    setBusy(true);
    try {
      await signIn();
      // redirect handled by the effect above
    } catch (err) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <Link href="/" className="auth-mark">
          <img src="/ttc-logo.png" alt="" />
        </Link>
        <p className="cinematic-eyebrow">
          <span />
          The Turing Circle
        </p>
        <h1 className="auth-title">
          Welcome
          <br />
          <em>back</em>
        </h1>
        <p className="auth-deck">
          Sign in to write, save drafts, and join the conversation.
        </p>

        <button
          className="auth-google"
          onClick={handleSignIn}
          disabled={busy || loading}
        >
          <GoogleGlyph />
          {busy ? "Signing in…" : "Continue with Google"}
        </button>

        {error && <p className="auth-error">{error}</p>}

        <Link href="/" className="auth-back">
          ← Back to journal
        </Link>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.5 29.6 2.5 24 2.5 12.1 2.5 2.5 12.1 2.5 24S12.1 45.5 24 45.5 45.5 35.9 45.5 24c0-1.2-.1-2.3-.3-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M5.3 13.9l6.6 4.8C13.7 15.1 18.5 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.5 29.6 2.5 24 2.5 16 2.5 9 7.1 5.3 13.9z"
      />
      <path
        fill="#4CAF50"
        d="M24 45.5c5.5 0 10.5-1.9 14.3-5.2l-6.6-5.6C29.6 36 26.9 37 24 37c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 40.8 16.2 45.5 24 45.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.6 5.6c-.5.4 7.2-5.2 7.2-15.2 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
