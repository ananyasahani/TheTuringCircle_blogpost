"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import SmoothScroll from "@/components/providers/SmoothScroll";
import Navbar from "@/components/layout/Navbar";
import Posts from "@/components/cards/PostCard";
import { getAllPosts } from "@/services/posts.service";

const allPosts = getAllPosts();

// ─── Sidebar widget data ──────────────────────────────────────────────────────
const STAFF_PICKS = [
  {
    category: "Calculus of Form",
    title: "The Fibonacci sequence in urban planning.",
    author: "Marcus Thorne",
  },
  {
    category: "Neuro-Aesthetics",
    title: "Why our brains crave brutalist symmetry.",
    author: "Dr. Li Na",
  },
  {
    category: "Cryptography",
    title: "The unhackable beauty of prime meshes.",
    author: "Anon-404",
  },
];

const TRENDING_TAGS = [
  "#Quantum_Leap",
  "#Topology",
  "#Brutalism",
  "#AI_Safety",
  "#Zero_Knowledge",
];

const FEED_TABS = ["For you", "Featured", "Latest"];

// ─── Sort helpers ───────────────────────────────────────────────────────────
function parseViews(str) {
  if (!str) return 0;
  const s = str.toLowerCase().trim();
  if (s.endsWith("k")) return parseFloat(s) * 1000;
  return parseInt(s, 10) || 0;
}

function scorePost(p) {
  return parseViews(p.stats?.views) + (p.stats?.comments || 0) * 5;
}

function sortPosts(posts, tab) {
  switch (tab) {
    case "Featured":
      return [...posts].sort((a, b) => scorePost(b) - scorePost(a));
    case "Latest":
      return [...posts].sort((a, b) => b.id - a.id);
    case "For you":
    default:
      return posts; // original order
  }
}

// ─── Animation helpers ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Homepage() {
  const [activeTab, setActiveTab] = useState("For you");
  const sorted = useMemo(() => sortPosts(allPosts, activeTab), [activeTab]);

  return (
    <SmoothScroll>
      <div className="tc-grid">
        <Navbar />

        <main className="main-content">
          <div className="content-container">
            <FeedHeader activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="feed-grid">
              <Posts posts={sorted} />

              <aside className="sidebar">
                <QuickStats />
                <StaffPicks picks={STAFF_PICKS} />
                <TrendingClusters tags={TRENDING_TAGS} />
                <RecentAuthors />
              </aside>
            </div>
          </div>
        </main>

        <MobileBottomNav />
        <FAB />
      </div>
    </SmoothScroll>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeedHeader({ activeTab, setActiveTab }) {
  return (
    <motion.header
      className="feed-header"
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      custom={0.1}
    >
      <div className="feed-tabs-row">
        <div className="feed-tabs">
          {FEED_TABS.map((tab) => (
            <button
              key={tab}
              className={`tab-btn${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </motion.header>
  );
}

function StaffPicks({ picks }) {
  return (
    <motion.section
      className="glass-panel sidebar-widget"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0.15}
    >
      <h3 className="sidebar-heading">
        <span className="sidebar-heading-line" />
        <span className="sidebar-heading-text">Staff Picks</span>
      </h3>

      <div className="picks-list">
        {picks.map((pick, i) => (
          <motion.div
            key={pick.title}
            className="pick-item"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0.2 + i * 0.06}
          >
            <span className="pick-category">{pick.category}</span>
            <h4 className="pick-title">{pick.title}</h4>
            <span className="pick-author">By {pick.author}</span>
          </motion.div>
        ))}
      </div>

      <button className="sidebar-link-btn">View Full Archive →</button>
    </motion.section>
  );
}

function TrendingClusters({ tags }) {
  return (
    <motion.section
      className="glass-panel sidebar-widget"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0.25}
    >
      <div className="sidebar-heading-text" style={{ marginBottom: "1rem" }}>
        Trending Clusters
      </div>
      <div className="tags-wrap">
        {tags.map((tag) => (
          <span key={tag} className="tag-pill">{tag}</span>
        ))}
      </div>
    </motion.section>
  );
}

function QuickStats() {
  const posts = getAllPosts();
  const authors = new Set(posts.map((p) => p.author.name)).size;
  const tags = new Set(posts.flatMap((p) => p.tags?.map((t) => t.label) || [])).size;
  const stats = [
    { num: posts.length, label: "Papers" },
    { num: authors, label: "Authors" },
    { num: tags, label: "Topics" },
  ];
  return (
    <motion.div
      className="glass-panel sidebar-widget"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0.05}
    >
      <div className="quick-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="quick-stat">
            <span className="quick-stat-num">{s.num}</span>
            <span className="quick-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RecentAuthors() {
  const posts = getAllPosts();
  const seen = new Set();
  const authors = [];
  for (const p of posts) {
    if (!seen.has(p.author.name) && authors.length < 5) {
      seen.add(p.author.name);
      authors.push(p.author);
    }
  }
  return (
    <motion.section
      className="glass-panel sidebar-widget"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0.3}
    >
      <h3 className="sidebar-heading">
        <span className="sidebar-heading-line" />
        <span className="sidebar-heading-text">Active Nodes</span>
      </h3>
      <div className="recent-authors">
        {authors.map((a) => (
          <div key={a.name} className="recent-author">
            {a.avatar ? (
              <img src={a.avatar} alt={a.name} className="recent-author-avatar" />
            ) : (
              <div className="recent-author-initials">{a.initials || a.name.charAt(0)}</div>
            )}
            <div>
              <div className="recent-author-name">{a.name}</div>
              <div className="recent-author-field">{a.meta.split("·")[0]?.trim()}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function MobileBottomNav() {
  const icons = ["auto_stories", "explore", "notifications", "account_circle"];
  return (
    <nav className="mob-nav glass-panel">
      {icons.map((icon, i) => (
        <button
          key={icon}
          className="icon-btn"
          style={{ color: i === 0 ? "var(--gold-bright)" : undefined }}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </button>
      ))}
    </nav>
  );
}

function FAB() {
  return (
    <motion.button
      className="gold-btn mob-fab"
      whileHover={{ scale: 1.1, boxShadow: "0 12px 36px rgba(255,215,0,0.4)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>add</span>
    </motion.button>
  );
}
