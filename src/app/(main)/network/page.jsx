"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { getAllPosts } from "@/services/posts.service";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";

const posts = getAllPosts();

// Derive unique authors with their post counts and fields
function deriveAuthors(posts) {
  const map = new Map();
  posts.forEach((p) => {
    const key = p.author.name;
    if (!map.has(key)) {
      map.set(key, {
        name: p.author.name,
        avatar: p.author.avatar,
        initials: p.author.initials || p.author.name.charAt(0),
        field: p.author.meta.split("·")[0]?.trim() || "Research",
        postCount: 0,
        slugs: [],
      });
    }
    const entry = map.get(key);
    entry.postCount++;
    entry.slugs.push(p.slug);
  });
  return Array.from(map.values()).sort((a, b) => b.postCount - a.postCount);
}

const authors = deriveAuthors(posts);

const cardAnim = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function NetworkPage() {
  return (
    <SmoothScroll>
      <div className="tc-grid">
        <Navbar />

        <main className="main-content">
          <div className="content-container">
            <motion.div
              className="subpage-header"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="subpage-title">Network</h1>
              <p className="subpage-subtitle">
                The minds behind the circle. {authors.length} contributors shaping the discourse.
              </p>
            </motion.div>

            <div className="network-grid">
              {authors.map((author, i) => (
                <motion.div
                  key={author.name}
                  custom={i}
                  variants={cardAnim}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                >
                  <Link
                    href={`/post/${author.slugs[0]}`}
                    className="network-card glass-card"
                  >
                    {/* Avatar */}
                    {author.avatar ? (
                      <img
                        src={author.avatar}
                        alt={author.name}
                        className="network-avatar"
                      />
                    ) : (
                      <div className="network-avatar-initials">
                        {author.initials}
                      </div>
                    )}

                    <div className="network-card-info">
                      <h3 className="network-name">{author.name}</h3>
                      <p className="network-field">{author.field}</p>
                      <div className="network-stat">
                        <span className="network-stat-num">{author.postCount}</span>
                        <span className="network-stat-label">
                          {author.postCount === 1 ? "paper" : "papers"}
                        </span>
                      </div>
                    </div>

                    <span
                      className="material-symbols-outlined"
                      style={{ color: "var(--text-muted)", fontSize: "1rem" }}
                    >
                      arrow_forward
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SmoothScroll>
  );
}
