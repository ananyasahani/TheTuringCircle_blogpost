"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getAllPosts,
  getAllPostsStatic,
  seedPublishedFromStatic,
} from "@/services/posts.service";
import { claimUsername } from "@/services/auth.service";
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
  const { user, signOut, refresh } = useAuth();
  const [posts, setPosts] = useState(() => getAllPostsStatic());
  const [fromDb, setFromDb] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  // Username claim
  const [handle, setHandle] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [handleMsg, setHandleMsg] = useState("");

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

  const handleClaim = async () => {
    if (!user) return;
    setClaiming(true);
    setHandleMsg("");
    try {
      const name = await claimUsername(user.uid, handle);
      setHandleMsg(`Your handle is now @${name}.`);
      setHandle("");
      refresh?.();
    } catch (err) {
      setHandleMsg(err?.message || "Could not set username.");
    } finally {
      setClaiming(false);
    }
  };

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
                  {user?.username ? `@${user.username}` : user?.name || "Reader"}
                </h1>
                <p className="subpage-subtitle" style={{ marginBottom: 0 }}>
                  {user
                    ? `${user.role === "moderator" ? "Moderator" : "Member"}${
                        user.username ? ` · ${user.name}` : ""
                      }`
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

            {/* Choose a username (once, if not yet set) */}
            {user && !user.username && (
              <motion.div
                className="profile-handle"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.08}
              >
                <div className="profile-handle-copy">
                  <strong>Choose your handle.</strong> This is how you'll appear
                  on posts and comments, instead of your Google name.
                </div>
                <div className="profile-handle-row">
                  <span className="profile-handle-at">@</span>
                  <input
                    className="profile-handle-input"
                    placeholder="username"
                    value={handle}
                    maxLength={20}
                    onChange={(e) => setHandle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                  />
                  <button
                    type="button"
                    className="profile-handle-btn"
                    onClick={handleClaim}
                    disabled={claiming || handle.trim().length < 3}
                  >
                    {claiming ? "Claiming…" : "Claim"}
                  </button>
                </div>
                {handleMsg && (
                  <span className="profile-handle-msg">{handleMsg}</span>
                )}
              </motion.div>
            )}

            {/* Write a new post */}
            <Link href="/editor/new" className="profile-write">
              ✎ Write a post
            </Link>

            {/* Admin: one-time seed of the static posts into Firestore.
                Auto-hides once Firestore has data. */}
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
          </div>
        </main>
      </div>
    </SmoothScroll>
  );
}
