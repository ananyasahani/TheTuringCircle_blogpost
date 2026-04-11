"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getPostBySlug } from "@/services/posts.service";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";
import Image from "next/image";
import Link from "next/link";

export default function PostPage() {
  const params = useParams();
  const post = params.slug ? getPostBySlug(params.slug) : null;

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
        <Navbar />

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
                <span className="post-date">{post.author.meta}</span>
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
                    <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="post-avatar-initials">{post.author.initials}</div>
                )}
                <div>
                  <div className="author-name">{post.author.name}</div>
                  <div className="author-role">{post.author.meta.split('·')[0]}</div>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {post.image && (
              <div className="post-featured-image-wrap relative" style={{ aspectRatio: '16/9' }}>
                <Image src={post.image} alt={Array.isArray(post.title) ? post.title.join('') : post.title} fill className="post-featured-image object-cover" priority />
                <div className="post-image-glow" />
              </div>
            )}

            {/* Content body */}
            <div className="post-body">
              {post.content.split('\n\n').flatMap((block, i) => {
                if (block.startsWith('###')) {
                  const lines = block.split('\n');
                  const heading = lines[0].replace(/^###\s*/, '');
                  const body = lines.slice(1).join(' ').trim();
                  const els = [<h3 key={`h-${i}`} className="post-h3">{heading}</h3>];
                  if (body) els.push(<p key={`p-${i}`} className="post-paragraph">{body}</p>);
                  return els;
                }
                return [<p key={i} className="post-paragraph">{block}</p>];
              })}
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
              </div>
            </footer>
          </motion.article>
        </main>
      </div>
    </SmoothScroll>
  );
}
