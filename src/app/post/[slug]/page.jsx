"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { getPostBySlug, getPostBySlugStatic } from "@/services/posts.service";
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

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { lite } = usePerf();
  const slug = params.slug;
  const [removing, setRemoving] = useState(false);
  // Instant static render, then swap in the Firestore post if present.
  const [post, setPost] = useState(() =>
    slug ? getPostBySlugStatic(slug) ?? null : null,
  );

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    getPostBySlug(slug).then((data) => {
      if (alive && data) setPost(data);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  // The post's author may take their own piece down; a moderator, any piece.
  const canRemove =
    !!user && !!post && (user.uid === post.authorId || isModerator(user));

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

  if (!post) {
    return (
      <div className="tc-grid min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <h1 className="gold-text text-2xl font-bold mb-4">Post Not Found</h1>
          <Link href="/" className="gold-btn px-6 py-2 rounded">Return Home</Link>
        </div>
      </div>
    );
  }

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
                {post.author.avatar ? (
                  <div className="post-avatar relative overflow-hidden">
                    <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="post-avatar-initials">{post.author.initials}</div>
                )}
                <div>
                  <div className="author-name">{post.author.name}</div>
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
