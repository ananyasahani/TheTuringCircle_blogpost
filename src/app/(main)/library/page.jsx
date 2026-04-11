"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getAllPosts } from "@/services/posts.service";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";

const posts = getAllPosts();

// Extract unique tags from all posts
const allTags = [
  "All",
  ...Array.from(
    new Set(posts.flatMap((p) => p.tags?.map((t) => t.label) || []))
  ),
];

const cardAnim = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.25 } },
};

export default function LibraryPage() {
  const [active, setActive] = useState(new Set());

  function toggleTag(tag) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const filtered =
    active.size === 0
      ? posts
      : posts.filter((p) => p.tags?.some((t) => active.has(t.label)));

  return (
    <SmoothScroll>
      <div className="tc-grid">
        <Navbar />

        <main className="main-content">
          <div className="content-container">
            {/* Header */}
            <motion.div
              className="subpage-header"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="subpage-title">Library</h1>
              <p className="subpage-subtitle">
                {filtered.length} of {posts.length} papers
                {active.size > 0 && (
                  <span style={{ color: "var(--gold-bright)" }}>
                    {" "}— filtered by {active.size} {active.size === 1 ? "tag" : "tags"}
                  </span>
                )}
              </p>
            </motion.div>

            {/* Tag filters */}
            <motion.div
              className="lib-filters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <button
                className={`tag-pill ${active.size === 0 ? "tag-pill-active" : ""}`}
                onClick={() => setActive(new Set())}
              >
                All
              </button>
              {allTags.filter((t) => t !== "All").map((tag) => (
                <button
                  key={tag}
                  className={`tag-pill ${active.has(tag) ? "tag-pill-active" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {active.has(tag) && (
                    <span className="material-symbols-outlined" style={{ fontSize: "0.7rem", marginLeft: "0.2rem" }}>
                      close
                    </span>
                  )}
                </button>
              ))}
            </motion.div>

            {/* Post grid */}
            <div className="lib-grid">
              <AnimatePresence mode="popLayout">
                {filtered.map((post, i) => (
                  <motion.div
                    key={post.id}
                    custom={i}
                    variants={cardAnim}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
                    <Link href={`/post/${post.slug}`} className="lib-card glass-card">
                      {post.image && (
                        <div className="lib-card-img-wrap">
                          <img
                            src={post.image}
                            alt={Array.isArray(post.title) ? post.title.join("") : post.title}
                            className="lib-card-img"
                          />
                        </div>
                      )}
                      <div className="lib-card-body">
                        <div className="lib-card-tags">
                          {post.tags?.map((t) => (
                            <span key={t.label} className="lib-card-tag">
                              {t.label}
                            </span>
                          ))}
                        </div>
                        <h3 className="lib-card-title">
                          {Array.isArray(post.title) ? post.title.join("") : post.title}
                        </h3>
                        <p className="lib-card-excerpt">{post.excerpt}</p>
                        <div className="lib-card-meta">
                          <span>{post.author.name}</span>
                          {post.stats && <span>{post.stats.views} views</span>}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </SmoothScroll>
  );
}
