"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";
import LiquidSpiral from "@/components/visuals/LiquidSpiral";
import PublishedContent from "@/components/editor/PublishedContent";
import { authorField, postDate, relativeTime } from "@/lib/postDate";
import CommentThread from "@/components/post/CommentThread";
import { useAuth } from "@/components/providers/AuthProvider";
import { isModerator } from "@/services/auth.service";
import { deletePublishedPost } from "@/services/drafts.service";
import SignalFlap from "@/components/visuals/SignalFlap";
import { usePerf } from "@/components/providers/PerfProvider";
import Image from "next/image";
import Link from "next/link";

/**
 * The reading view. The post is resolved on the server and handed in as a
 * prop, so this component never renders a "missing" state — a slug with no
 * post is a real 404 from page.jsx, and the article is in the HTML on the
 * first response rather than appearing after a client fetch.
 */
export default function PostView({ post }) {
  const router = useRouter();
  const { user } = useAuth();
  const { lite } = usePerf();
  const [removing, setRemoving] = useState(false);

  // A malformed document should degrade, not take the route down.
  const author = post.author ?? {};

  // The post's author may take their own piece down; a moderator, any piece.
  const canRemove = !!user && (user.uid === post.authorId || isModerator(user));

  const removePost = async () => {
    if (
      !window.confirm(
        "Delete this post and its comments? This cannot be undone.",
      )
    ) {
      return;
    }
    setRemoving(true);
    try {
      await deletePublishedPost(post.slug);
      router.push("/");
    } catch {
      setRemoving(false);
      window.alert("Could not delete this post.");
    }
  };

  return (
    <SmoothScroll>
      <div className="tc-grid">
        {post.image && (
          <div className="post-ambient" aria-hidden="true">
            <LiquidSpiral
              src={post.image}
              mode="flow"
              iridescence={0.6}
              quality="ambient"
              lite={lite}
            />
            <div className="post-ambient-veil" />
          </div>
        )}
        <Navbar />

        {/* A little game in the side gutter — reward for the curious, and it
            fills the wide-screen whitespace. Hidden on narrow screens. */}
        <aside className="post-gutter-game" aria-hidden="true">
          <SignalFlap />
        </aside>

        <main className="post-container">
          <motion.article
            className="post-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header section */}
            <header className="post-header">
              <div className="post-meta">
                <span className="post-category">
                  {post.tags?.[0]?.label || "Article"}
                </span>
                <span className="post-date">{relativeTime(postDate(post))}</span>
              </div>

              <h1 className="post-title">
                {Array.isArray(post.title) ? (
                  <>
                    {post.title[0]}
                    <span className="gold-text">{post.title[1]}</span>
                  </>
                ) : (
                  post.title
                )}
              </h1>

              <div className="post-author-row">
                {author.avatar ? (
                  <div className="post-avatar relative overflow-hidden">
                    <Image src={author.avatar} alt={author.name ?? ""} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="post-avatar-initials">
                    {author.initials ?? author.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div>
                  <div className="author-name">{author.name ?? "Unknown"}</div>
                  <div className="author-role">{authorField(post)}</div>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {post.image && (
              <div className="post-featured-image-wrap relative" style={{ aspectRatio: '16/9' }}>
                {/* unoptimized: covers are pasted URLs from arbitrary hosts,
                    which the optimizer would reject unless allowlisted. */}
                <Image src={post.image} alt={Array.isArray(post.title) ? post.title.join('') : post.title} fill className="post-featured-image object-cover" priority unoptimized />
                <div className="post-image-glow" />
              </div>
            )}

            {/* Content body — legacy posts store markdown-ish text, posts
                written in the editor store a TipTap document. */}
            <div className="post-body">
              {typeof post.content !== "string" ? (
                <PublishedContent doc={post.content} />
              ) : (
              post.content.split('\n\n').flatMap((block, i) => {
                if (block.startsWith('###')) {
                  const lines = block.split('\n');
                  const heading = lines[0].replace(/^###\s*/, '');
                  const body = lines.slice(1).join(' ').trim();
                  const els = [
                    <Reveal key={`h-${i}`} index={i} as="h3" className="post-h3">
                      {heading}
                    </Reveal>,
                  ];
                  if (body)
                    els.push(
                      <Reveal
                        key={`p-${i}`}
                        index={i + 1}
                        as="p"
                        className="post-paragraph"
                      >
                        {body}
                      </Reveal>,
                    );
                  return els;
                }
                return [
                  <Reveal key={i} index={i} as="p" className="post-paragraph">
                    {block}
                  </Reveal>,
                ];
              })
              )}
            </div>

            <footer className="post-footer">
              <div className="post-tags">
                {post.tags?.map(tag => (
                  <span key={tag.label} className={`tag ${tag.style === 'muted' ? 'tag-muted' : ''}`}>
                    #{tag.label}
                  </span>
                ))}
              </div>

              <div className="post-navigation">
                <Link href="/" className="back-link">
                  <span className="material-symbols-outlined">arrow_back</span>
                  Back to feed
                </Link>
                {canRemove && (
                  <button
                    type="button"
                    className="post-delete"
                    onClick={removePost}
                    disabled={removing}
                  >
                    {removing ? "Deleting…" : "Delete post"}
                  </button>
                )}
              </div>
            </footer>
          </motion.article>

          <CommentThread slug={post.slug} />
        </main>
      </div>
    </SmoothScroll>
  );
}

/**
 * Reveal — scroll-triggered pop-in for article blocks. Alternating blocks
 * enter from opposite sides so reading down the page feels like it's being
 * assembled, with a soft blur-to-focus and gentle overshoot.
 */
function Reveal({ children, index = 0, as = "p", className }) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;
  const fromLeft = index % 2 === 0;

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, x: fromLeft ? -44 : 44, y: 26, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
