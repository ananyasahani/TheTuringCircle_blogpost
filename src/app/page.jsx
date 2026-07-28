"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import ParticleField from "@/components/visuals/ParticleField";
import DecryptedText from "@/components/reactbits/DecryptedText";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { getAllPosts } from "@/services/posts.service";

const allPosts = getAllPosts();
const FEATURED = allPosts[0];
const TOPICS = ["All", "Math", "Decision Theory", "AI", "Game Theory", "Science"];
const MODES = [
  { id: "network", label: "Network" },
  { id: "orbit", label: "Orbit" },
  { id: "matrix", label: "Matrix" },
];

function titleOf(post) {
  return Array.isArray(post.title) ? post.title.join("") : post.title;
}

function readTime(post) {
  const words = `${post.excerpt} ${post.content}`.split(/\s+/).length;
  return Math.max(3, Math.ceil(words / 90));
}

export default function Homepage() {
  const [mode, setMode] = useState("network");
  const [topic, setTopic] = useState("All");
  const [subscribed, setSubscribed] = useState(false);
  const deferredTopic = useDeferredValue(topic);

  const filteredPosts =
    deferredTopic === "All"
      ? allPosts.slice(1, 10)
      : allPosts
          .filter((post) =>
            post.tags?.some((tag) =>
              tag.label.toLowerCase().includes(deferredTopic.toLowerCase()),
            ),
          )
          .slice(0, 9);

  const submitNewsletter = (event) => {
    event.preventDefault();
    setSubscribed(true);
  };

  return (
    <div className="journal-shell">
      <Navbar />

      <main>
        <section className="journal-hero">
          <ParticleField mode={mode} />
          <div className="hero-gridlines" aria-hidden="true" />

          <div className="hero-copy">
            <motion.p
              className="journal-kicker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <DecryptedText text="Journal of mathematics & computation" />
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08 }}
            >
              The Turing
              <br />
              <em>Circle</em>
            </motion.h1>
            <motion.p
              className="hero-deck"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              Field notes from the edge of proof, code, and collective
              intelligence.
            </motion.p>
          </div>

          <motion.article
            className="lead-story"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
          >
            <div className="lead-index">01 / Lead essay</div>
            <p className="lead-topic">{FEATURED.tags?.[0]?.label}</p>
            <Link href={`/post/${FEATURED.slug}`}>
              <h2>{titleOf(FEATURED)}</h2>
            </Link>
            <p>{FEATURED.excerpt}</p>
            <div className="lead-meta">
              <span>{FEATURED.author.name}</span>
              <span>{readTime(FEATURED)} min read</span>
            </div>
          </motion.article>

          <div className="field-controls" aria-label="Particle field">
            <span>Field</span>
            {MODES.map((item) => (
              <button
                key={item.id}
                className={mode === item.id ? "is-active" : ""}
                onClick={() => setMode(item.id)}
                aria-pressed={mode === item.id}
              >
                <i aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>

          <a className="hero-scroll" href="#dispatches">
            <span>Explore dispatches</span>
            <i aria-hidden="true" />
          </a>
        </section>

        <section className="issue-band" aria-label="Current issue">
          <div>
            <span>Current issue</span>
            <strong>Vol. 04 / Systems</strong>
          </div>
          <p>
            On patterns, incentives, uncertainty, and the models we use to
            think.
          </p>
          <Link href="/library">View the complete issue <span>→</span></Link>
        </section>

        <section className="dispatches" id="dispatches">
          <header className="section-heading">
            <div>
              <p>New transmissions</p>
              <h2>Latest dispatches</h2>
            </div>
            <div className="topic-filter" aria-label="Filter articles">
              {TOPICS.map((item) => (
                <button
                  key={item}
                  onClick={() => setTopic(item)}
                  className={topic === item ? "is-active" : ""}
                >
                  {item}
                </button>
              ))}
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={deferredTopic}
              className="dispatch-grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {filteredPosts.length ? (
                filteredPosts.map((post, index) => (
                  <ArticleCard key={post.id} post={post} index={index} />
                ))
              ) : (
                <div className="dispatch-empty">
                  No dispatches in this field yet. Try another coordinate.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="theorem-strip">
          <p className="journal-kicker">
            <DecryptedText text="A working proposition" />
          </p>
          <blockquote>
            “A pattern is not yet an explanation. An explanation tells us when
            the pattern should fail.”
          </blockquote>
          <span>Notebook fragment / 04.17</span>
        </section>

        <section className="journal-newsletter">
          <div>
            <p className="journal-kicker">The weekly signal</p>
            <h2>One difficult idea, carefully explained.</h2>
          </div>
          <form onSubmit={submitNewsletter}>
            {subscribed ? (
              <p className="subscribe-success">You are on the circuit.</p>
            ) : (
              <>
                <label htmlFor="journal-email">Email address</label>
                <div>
                  <input
                    id="journal-email"
                    type="email"
                    placeholder="reader@domain.edu"
                    required
                  />
                  <button type="submit" aria-label="Subscribe">
                    Join <span>→</span>
                  </button>
                </div>
              </>
            )}
          </form>
        </section>
      </main>

      <footer className="journal-footer">
        <Link href="/" className="footer-mark">TTC</Link>
        <p>The Mathematics &amp; Computing Club of MIT Manipal.</p>
        <div>
          <Link href="/library">Library</Link>
          <Link href="/network">Network</Link>
          <a href="https://github.com/paymybills/TTC-Project-Page">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

function ArticleCard({ post, index }) {
  const title = titleOf(post);

  return (
    <SpotlightCard
      as="article"
      className={`dispatch-card dispatch-card-${index % 5}`}
    >
      {post.image && index < 5 && (
        <Link href={`/post/${post.slug}`} className="dispatch-image">
          <img src={post.image} alt="" />
          <span>{String(index + 2).padStart(2, "0")}</span>
        </Link>
      )}
      <div className="dispatch-content">
        <div className="dispatch-meta">
          <span>{post.tags?.[0]?.label || "Notes"}</span>
          <span>{readTime(post)} min</span>
        </div>
        <Link href={`/post/${post.slug}`}>
          <h3>{title}</h3>
        </Link>
        <p>{post.excerpt}</p>
        <div className="dispatch-author">
          <span>{post.author.name}</span>
          <Link href={`/post/${post.slug}`} aria-label={`Read ${title}`}>↗</Link>
        </div>
      </div>
    </SpotlightCard>
  );
}
