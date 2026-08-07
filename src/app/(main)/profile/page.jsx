"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getAllPosts,
  getAllPostsStatic,
  seedPublishedFromStatic,
} from "@/services/posts.service";
import { useAuth } from "@/components/providers/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [posts, setPosts] = useState(() => getAllPostsStatic());
  const [fromDb, setFromDb] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  const loadPosts = () => {
    getAllPosts().then((data) => {
      if (data.length) {
        setPosts(data);
        // getAllPosts returns Firestore docs (string ids) vs static (number ids)
        setFromDb(typeof data[0]?.id === "string");
      }
    });
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    setSeedMsg("");
    try {
      const n = await seedPublishedFromStatic(user.uid);
      setSeedMsg(
        n > 0 ? `Seeded ${n} posts into Firestore.` : "Already seeded.",
      );
      loadPosts();
    } catch (err) {
      setSeedMsg(`Seed failed: ${err?.message || err}`);
    } finally {
      setSeeding(false);
    }
  };

  // Honest stats: real published count + real comment total (0 until comments
  // exist). No fabricated view numbers.
  const totalComments = useMemo(
    () => posts.reduce((sum, p) => sum + (p.stats?.comments || 0), 0),
    [posts],
  );

  return (
    <SmoothScroll>
      <div className="tc-grid">
        <Navbar />

        <main className="main-content">
          <div className="content-container" style={{ maxWidth: 700 }}>
            {/* Profile header */}
            <motion.div
              className="profile-header"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              <div className="profile-avatar-ring">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--gold-bright)" }}>
                    account_circle
                  </span>
                )}
              </div>
              <div>
                <h1 className="subpage-title" style={{ marginBottom: "0.25rem" }}>
                  {user?.name || "Reader"}
                </h1>
                <p className="subpage-subtitle" style={{ marginBottom: 0 }}>
                  {user
                    ? `${user.role === "moderator" ? "Moderator" : "Member"} · ${user.email ?? ""}`
                    : "Member of The Turing Circle"}
                </p>
              </div>
              {user && (
                <button
                  type="button"
                  className="profile-signout"
                  onClick={() => signOut()}
                >
                  Sign out
                </button>
              )}
            </motion.div>

            {/* Write a new post */}
            <Link href="/editor/new" className="profile-write">
              ✎ Write a post
            </Link>

            {/* Stats */}
            <motion.div
              className="profile-stats"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.1}
            >
              <div className="profile-stat glass-panel">
                <span className="profile-stat-num">{posts.length}</span>
                <span className="profile-stat-label">Papers in Library</span>
              </div>
              <div className="profile-stat glass-panel">
                <span className="profile-stat-num">{totalComments.toLocaleString()}</span>
                <span className="profile-stat-label">Comments</span>
              </div>
              <div className="profile-stat glass-panel">
                <span className="profile-stat-num">
                  {fromDb ? "Live" : "Static"}
                </span>
                <span className="profile-stat-label">Data source</span>
              </div>
            </motion.div>

            {/* Admin: one-time seed of the static posts into Firestore */}
            {user && !fromDb && (
              <motion.div
                className="profile-seed"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.15}
              >
                <div>
                  <strong>Firestore is empty.</strong> Seed the {posts.length}{" "}
                  starter posts into the live database.
                </div>
                <button
                  type="button"
                  className="profile-seed-btn"
                  onClick={handleSeed}
                  disabled={seeding}
                >
                  {seeding ? "Seeding…" : "Seed posts"}
                </button>
                {seedMsg && <span className="profile-seed-msg">{seedMsg}</span>}
              </motion.div>
            )}

            {/* Reading list placeholder */}
            <motion.section
              className="glass-panel profile-section"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.2}
            >
              <h2 className="profile-section-title">
                <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--gold-bright)" }}>bookmark</span>
                Reading List
              </h2>
              <p className="profile-section-desc">
                Bookmark papers to build your personal reading queue. Your saved items will appear here.
              </p>
              <div className="profile-empty">
                <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--text-muted)" }}>
                  library_books
                </span>
                <span className="profile-empty-text">No bookmarks yet</span>
              </div>
            </motion.section>

            {/* Activity placeholder */}
            <motion.section
              className="glass-panel profile-section"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.3}
            >
              <h2 className="profile-section-title">
                <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--gold-bright)" }}>local_fire_department</span>
                Activity
              </h2>
              <p className="profile-section-desc">
                Your comments and interactions across the circle.
              </p>
              <div className="profile-empty">
                <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--text-muted)" }}>
                  forum
                </span>
                <span className="profile-empty-text">No activity yet</span>
              </div>
            </motion.section>
          </div>
        </main>
      </div>
    </SmoothScroll>
  );
}
