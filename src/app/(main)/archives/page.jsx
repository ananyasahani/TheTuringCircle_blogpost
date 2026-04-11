"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { getAllPosts } from "@/services/posts.service";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";

const posts = getAllPosts();

// Group posts by a rough "time bucket" from their meta string
function groupByTime(posts) {
  const groups = { "Hours ago": [], "Days ago": [], "Weeks ago": [] };
  posts.forEach((p) => {
    const meta = p.author.meta.toLowerCase();
    if (meta.includes("h ago")) groups["Hours ago"].push(p);
    else if (meta.includes("d ago")) groups["Days ago"].push(p);
    else groups["Weeks ago"].push(p);
  });
  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

const grouped = groupByTime(posts);

const fadeIn = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function ArchivesPage() {
  return (
    <SmoothScroll>
      <div className="tc-grid">
        <Navbar />

        <main className="main-content">
          <div className="content-container" style={{ maxWidth: 800 }}>
            <motion.div
              className="subpage-header"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="subpage-title">Archives</h1>
              <p className="subpage-subtitle">
                A chronological index of every paper published in The Turing Circle.
              </p>
            </motion.div>

            <div className="archive-timeline">
              {grouped.map(([label, items]) => (
                <section key={label} className="archive-group">
                  <div className="archive-group-label">
                    <span className="archive-dot" />
                    <span>{label}</span>
                  </div>

                  <div className="archive-items">
                    {items.map((post, i) => (
                      <motion.div
                        key={post.id}
                        custom={i}
                        variants={fadeIn}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-20px" }}
                      >
                        <Link href={`/post/${post.slug}`} className="archive-item glass-card">
                          <div className="archive-item-left">
                            <span className="archive-item-variant">{post.variant}</span>
                            <span className="archive-item-time">
                              {post.author.meta.split("·")[1]?.trim() || ""}
                            </span>
                          </div>
                          <div className="archive-item-right">
                            <h3 className="archive-item-title">
                              {Array.isArray(post.title) ? post.title.join("") : post.title}
                            </h3>
                            <p className="archive-item-author">
                              {post.author.name}
                              {post.stats && (
                                <span className="archive-item-stats">
                                  {" "}— {post.stats.views} views · {post.stats.comments} comments
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="material-symbols-outlined archive-item-arrow">
                            arrow_forward
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SmoothScroll>
  );
}
