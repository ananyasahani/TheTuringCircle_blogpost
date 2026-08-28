"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, MoveUpRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BlurText from "@/components/reactbits/BlurText";
import DecryptedText from "@/components/reactbits/DecryptedText";
import LiquidSpiral from "@/components/visuals/LiquidSpiral";
import { getAllPosts, getAllPostsStatic } from "@/services/posts.service";
import { subscribeEmail } from "@/services/newsletter.service";
import { docToPlainText } from "@/components/editor/tiptap-config";

function titleOf(post) {
  return Array.isArray(post.title) ? post.title.join("") : post.title;
}

function readTime(post) {
  // Legacy posts hold markdown-ish text; editor posts hold a TipTap document.
  const body =
    typeof post.content === "string"
      ? post.content
      : docToPlainText(post.content);
  const words = `${post.excerpt} ${body}`.split(/\s+/).length;
  return Math.max(3, Math.ceil(words / 90));
}

export default function Homepage() {
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");
  // Render instantly with static data, then swap in Firestore posts.
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

  const featuredPosts = posts.slice(0, 4);

  const submitNewsletter = async (event) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    setNewsletterError("");
    setNewsletterBusy(true);
    try {
      await subscribeEmail(String(email || ""));
      setSubscribed(true);
    } catch (err) {
      setNewsletterError(err?.message || "Something went wrong. Try again.");
    } finally {
      setNewsletterBusy(false);
    }
  };

  return (
    <div className="cinematic-shell">
      {/* Liquid-glass ribbon — fixed underlay behind the entire page scroll */}
      <div className="cinematic-underlay" aria-hidden="true">
        <LiquidSpiral
          src="/editorial/glass-ribbon.png"
          mode="flow"
          iridescence={0.85}
        />
      </div>

      <Navbar />

      <main>
        <section className="cinematic-hero">
          <div className="hero-noise" aria-hidden="true" />
          <div className="hero-veil" aria-hidden="true" />

          <motion.div
            className="cinematic-hero-copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="cinematic-eyebrow">
              <span />
              <DecryptedText text="MATHEMATICS / COMPUTATION / CULTURE" />
            </p>
            <h1>
              The Turing
              <br />
              <em>Circle</em>
            </h1>
            <p className="cinematic-deck">
              A journal for ideas that become clearer when they move.
            </p>
          </motion.div>

          <motion.aside
            className="hero-editorial-note"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <span>Issue 04</span>
            <p>
              Field notes from the edge of proof, code, and collective
              intelligence.
            </p>
            <Link href={`/post/${featuredPosts[0].slug}`}>
              Read the lead essay <ArrowRight size={15} strokeWidth={1.5} />
            </Link>
          </motion.aside>

          <a className="cinematic-scroll" href="#field-notes">
            <ArrowDown size={17} strokeWidth={1.5} />
            <span>Enter the journal</span>
          </a>

          <div className="hero-coordinate" aria-hidden="true">
            <span>13.3525 N</span>
            <span>74.7864 E</span>
          </div>
        </section>

        <section className="editorial-manifesto" id="field-notes">
          <p className="cinematic-eyebrow">
            <span />
            Our working premise
          </p>
          <BlurText
            as="h2"
            text="The interesting work begins where the clean answer ends."
          />
          <div className="manifesto-foot">
            <p>
              We publish explorations of mathematics, code, decision-making,
              and the strange systems they create together.
            </p>
            <span>Independent journal / MIT Manipal</span>
          </div>
        </section>

        <section className="flow-stories" aria-label="Featured writing">
          {featuredPosts.map((post, index) => (
            <FlowStory key={post.id} post={post} index={index} />
          ))}
        </section>

        <section className="journal-index">
          <header>
            <p className="cinematic-eyebrow">
              <span />
              More from the journal
            </p>
            <Link href="/library">
              Complete library <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
          </header>

          <div className="index-list">
            {posts.slice(4, 9).map((post, index) => (
              <Link
                href={`/post/${post.slug}`}
                className="index-row"
                key={post.id}
              >
                <span>{String(index + 5).padStart(2, "0")}</span>
                <h3>{titleOf(post)}</h3>
                <p>{post.tags?.[0]?.label || "Notes"}</p>
                <MoveUpRight size={19} strokeWidth={1.3} />
              </Link>
            ))}
          </div>
        </section>

        <section className="cinematic-newsletter">
          <div className="newsletter-orbit" aria-hidden="true">
            <span />
            <i />
          </div>
          <div>
            <p className="cinematic-eyebrow">
              <span />
              The weekly signal
            </p>
            <BlurText
              as="h2"
              text="One difficult idea, carefully explained."
            />
          </div>
          <form onSubmit={submitNewsletter}>
            {subscribed ? (
              <p className="cinematic-success">You are on the circuit.</p>
            ) : (
              <>
                <label htmlFor="cinematic-email">Email address</label>
                <div>
                  <input
                    id="cinematic-email"
                    name="email"
                    type="email"
                    placeholder="reader@domain.edu"
                    required
                    disabled={newsletterBusy}
                  />
                  <button
                    type="submit"
                    aria-label="Join the weekly signal"
                    disabled={newsletterBusy}
                  >
                    <ArrowRight size={20} strokeWidth={1.5} />
                  </button>
                </div>
                {newsletterError && (
                  <p className="cinematic-error">{newsletterError}</p>
                )}
              </>
            )}
          </form>
        </section>
      </main>

      <footer className="cinematic-footer">
        <div className="footer-wordmark">TTC</div>
        <p>The Mathematics &amp; Computing Club of MIT Manipal.</p>
        <nav aria-label="Footer navigation">
          <Link href="/library">Library</Link>
          <Link href="/network">Network</Link>
          <a href="https://ttcprojects.vercel.app">Projects</a>
        </nav>
        <span>2026 / Manipal, India</span>
      </footer>
    </div>
  );
}

function FlowStory({ post, index }) {
  const title = titleOf(post);

  return (
    <motion.article
      className={`flow-story flow-story-${index + 1}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/post/${post.slug}`} className="flow-image">
        {/* Guarded: next/image throws on an undefined src, and a post can
            reach the feed without a cover. */}
        {post.image && (
          <Image
            src={post.image}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 58vw"
            unoptimized
          />
        )}
        <span>{String(index + 1).padStart(2, "0")}</span>
      </Link>
      <div className="flow-copy">
        <div className="flow-meta">
          <span>{post.tags?.[0]?.label || "Notes"}</span>
          <span>{readTime(post)} min read</span>
        </div>
        <Link href={`/post/${post.slug}`}>
          <h2>{title}</h2>
        </Link>
        <p>{post.excerpt}</p>
        <Link className="flow-read" href={`/post/${post.slug}`}>
          Read essay <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>
    </motion.article>
  );
}
