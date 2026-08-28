"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getAllPosts, getAllPostsStatic } from "@/services/posts.service";
import { monthLabel, postDate, relativeTime } from "@/lib/postDate";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";

/**
 * File posts under the month they were published, newest first. Previously
 * this bucketed on substrings of the author.meta string, which meant every
 * editor-written post ("… · Just now") landed under "Weeks ago" forever.
 */
function groupByMonth(posts) {
  const groups = new Map();

  posts.forEach((post) => {
    const date = postDate(post);
    const label = monthLabel(date);
    if (!groups.has(label)) groups.set(label, { label, date, items: [] });
    const group = groups.get(label);
    group.items.push(post);
    if (date && (!group.date || date > group.date)) group.date = date;
  });

  return Array.from(groups.values())
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .map((group) => ({
      ...group,
      items: group.items.sort(
        (a, b) => (postDate(b)?.getTime() ?? 0) - (postDate(a)?.getTime() ?? 0),
      ),
    }));
}

const fadeIn = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function ArchivesPage() {
  const [posts, setPosts] = useState(() => getAllPostsStatic());

  useEffect(() => {
    let alive = true;
    getAllPosts().then((data) => {
      if (alive && data.length) setPosts(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(() => groupByMonth(posts), [posts]);

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
              {grouped.map(({ label, items }) => (
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
                              {relativeTime(postDate(post))}
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
                                  {" "}— {post.stats.views} views
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
