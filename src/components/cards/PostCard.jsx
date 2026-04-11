"use client";

import { motion } from "framer-motion";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";

// ─── Animation variants ─────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      delay: i * 0.06,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
};

const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -3,
    scale: 1.005,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// ─── Main export ─────────────────────────────────────────────────────────────
export default function Posts({ posts }) {
  return (
    <section className="post-feed">
      <AnimatePresence mode="popLayout">
        {posts.map((post, i) => {
          if (post.variant === "hero") return <HeroCard key={post.id} post={post} index={i} />;
          if (post.variant === "blueprint") return <BlueprintCard key={post.id} post={post} index={i} />;
          if (post.variant === "minimal") return <MinimalCard key={post.id} post={post} index={i} />;
          return null;
        })}
      </AnimatePresence>
    </section>
  );
}

// ─── Card variants ───────────────────────────────────────────────────────────

function HeroCard({ post, index }) {
  return (
    <motion.article
      className="card card-hero glass-card"
      custom={index}
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={cardVariants}
      whileHover="hover"
    >
      <motion.div variants={hoverLift}>
        {/* Dot grid overlay */}
        <div className="dot-grid card-dot-overlay" aria-hidden="true" />
        {/* Gold glow */}
        <div className="card-glow" aria-hidden="true" />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Author */}
          <div className="card-author">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="card-avatar"
            />
            <div>
              <div className="card-author-name">{post.author.name}</div>
              <div className="card-author-meta">{post.author.meta}</div>
            </div>
          </div>

          {/* Title */}
          <Link href={`/post/${post.slug}`}>
            <h2 className="card-title card-title-hero">
              {post.title[0]}
              <span className="gold-text">{post.title[1]}</span>
            </h2>
          </Link>

          {/* Excerpt */}
          <p className="card-excerpt" style={{ maxWidth: "640px" }}>
            {post.excerpt}
          </p>

          <Link href={`/post/${post.slug}`} className="card-hero-img-wrap">
            <motion.img
              src={post.image}
              alt="Post visual"
              className="card-hero-img"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="card-hero-img-fade" />
          </Link>

          {/* Footer */}
          <div className="card-footer">
            <div className="card-stats">
              <button className="icon-btn">
                <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>
                  stat_3
                </span>
                {post.stats.views}
              </button>
              <button className="icon-btn">
                <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>
                  forum
                </span>
                {post.stats.comments}
              </button>
            </div>
            <div className="card-tags">
              {post.tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`tag ${tag.style === "muted" ? "tag-muted" : ""}`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}

function BlueprintCard({ post, index }) {
  return (
    <motion.article
      className="card card-blueprint glass-card"
      custom={index}
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={cardVariants}
      whileHover="hover"
    >
      <motion.div variants={hoverLift}>
        <div className="card-blueprint-inner">
          {/* Text side */}
          <div>
            <div className="card-author">
              <div className="card-avatar-initials">{post.author.initials}</div>
              <div>
                <div className="card-author-name">{post.author.name}</div>
                <div className="card-author-meta">{post.author.meta}</div>
              </div>
            </div>

            <Link href={`/post/${post.slug}`}>
              <h2 className="card-title card-title-blueprint">{post.title}</h2>
            </Link>
            <p className="card-excerpt card-excerpt-clamp">{post.excerpt}</p>

            <div className="card-actions">
              <button className="icon-btn" aria-label="Bookmark">
                <span className="material-symbols-outlined">bookmark</span>
              </button>
              <button className="icon-btn" aria-label="Share">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>

          <Link href={`/post/${post.slug}`} className="card-blueprint-img-wrap">
            <motion.img
              src={post.image}
              alt="Post visual"
              className="card-blueprint-img"
              whileHover={{ filter: "grayscale(0%) brightness(1)", opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          </Link>
        </div>
      </motion.div>
    </motion.article>
  );
}

function MinimalCard({ post, index }) {
  return (
    <motion.article
      className="card card-minimal glass-card"
      custom={index}
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={cardVariants}
      whileHover="hover"
    >
      <motion.div variants={hoverLift}>
        <div className="card-author">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="card-avatar"
          />
          <div>
            <div className="card-author-name">{post.author.name}</div>
            <div className="card-author-meta">{post.author.meta}</div>
          </div>
        </div>

        <Link href={`/post/${post.slug}`}>
          <h2 className="card-title card-title-minimal">
            {post.title.split("Algorithm")[0]}
            <em>Algorithm</em>
          </h2>
        </Link>

        <p className="card-excerpt">{post.excerpt}</p>

        <div className="card-accent-rule" />
      </motion.div>
    </motion.article>
  );
}
