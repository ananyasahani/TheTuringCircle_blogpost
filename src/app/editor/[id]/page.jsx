"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function EditorPage() {
  const { user, loading } = useRequireAuth();

  // Hold blank while auth resolves, and during the redirect for anon visitors.
  if (loading || !user) return null;

  return (
    <div className="tc-grid">
      <Navbar />
      <main className="main-content">
        <div className="content-container" style={{ maxWidth: 620 }}>
          <h1 className="subpage-title">The editor is coming soon</h1>
          <p className="subpage-subtitle">
            Writing and publishing posts in-app isn&apos;t ready yet. For now the
            journal is curated by the team. Check back for the next release.
          </p>
          <p style={{ marginTop: "2rem" }}>
            <Link href="/" className="back-link">
              &larr; Back to the journal
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
