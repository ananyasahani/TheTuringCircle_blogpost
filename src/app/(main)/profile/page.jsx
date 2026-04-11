"use client";

import { motion } from "framer-motion";
import { getAllPosts } from "@/services/posts.service";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";

const posts = getAllPosts();
const totalViews = posts.reduce((sum, p) => {
  if (!p.stats?.views) return sum;
  const v = p.stats.views.replace("k", "000").replace(".", "");
  return sum + parseInt(v, 10);
}, 0);
const totalComments = posts.reduce((sum, p) => sum + (p.stats?.comments || 0), 10);

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
                <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--gold-bright)" }}>
                  account_circle
                </span>
              </div>
              <div>
                <h1 className="subpage-title" style={{ marginBottom: "0.25rem" }}>Reader</h1>
                <p className="subpage-subtitle" style={{ marginBottom: 0 }}>
                  Member of The Turing Circle
                </p>
              </div>
            </motion.div>

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
                <span className="profile-stat-num">{(totalViews / 1000).toFixed(1)}k</span>
                <span className="profile-stat-label">Total Views</span>
              </div>
              <div className="profile-stat glass-panel">
                <span className="profile-stat-num">{totalComments.toLocaleString()}</span>
                <span className="profile-stat-label">Comments</span>
              </div>
            </motion.div>

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
