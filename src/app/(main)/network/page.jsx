"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getAllPosts, getAllPostsStatic } from "@/services/posts.service";
import { authorField, postDate } from "@/lib/postDate";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";

/**
 * Unique contributors with their post counts and field.
 *
 * The field comes from each author's most recent post's headline tag rather
 * than from splitting the author.meta display string, so a contributor whose
 * posts were written in the editor is described by what they actually wrote
 * about. Latest post first, so their newest subject wins.
 */
function deriveAuthors(posts) {
  const byRecency = [...posts].sort(
    (a, b) => (postDate(b)?.getTime() ?? 0) - (postDate(a)?.getTime() ?? 0),
  );

  const map = new Map();
  byRecency.forEach((post) => {
    const key = post.author.name;
    if (!map.has(key)) {
      map.set(key, {
        name: post.author.name,
        avatar: post.author.avatar,
        initials: post.author.initials || post.author.name.charAt(0),
        field: authorField(post),
        latest: postDate(post),
        postCount: 0,
        slugs: [],
      });
    }
    const entry = map.get(key);
    entry.postCount += 1;
    entry.slugs.push(post.slug);
  });

  return Array.from(map.values()).sort(
    (a, b) =>
      b.postCount - a.postCount ||
      (b.latest?.getTime() ?? 0) - (a.latest?.getTime() ?? 0),
  );
}

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

  const authors = useMemo(() => deriveAuthors(posts), [posts]);

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
