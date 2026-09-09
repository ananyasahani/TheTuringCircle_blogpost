import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { POSTS } from '../data/posts';

export interface Post {
  id: number | string;
  slug: string;
  variant: 'hero' | 'blueprint' | 'minimal';
  authorId?: string;
  author: {
    name: string;
    avatar?: string;
    initials?: string;
    meta: string;
  };
  title: string | [string, string];
  titleHighlight?: boolean;
  excerpt: string;
  content: string;
  image?: string;
  stats?: {
    views: string;
    comments: number;
  };
  tags?: {
    label: string;
    style: 'gold' | 'muted';
  }[];
  createdAt?: unknown;
  visible?: boolean;
}

const PUBLISHED = 'published';

// ── Static fallbacks (used until Firestore is seeded / for offline dev) ──────
export const getAllPostsStatic = (): Post[] => POSTS as unknown as Post[];

export const getPostBySlugStatic = (slug: string): Post | undefined =>
  (POSTS as unknown as Post[]).find((post) => post.slug === slug);

// ── Firestore-backed reads ───────────────────────────────────────────────────
/**
 * All visible published posts, newest first. Falls back to static on error.
 * Uses a single-field `orderBy` (auto-indexed) and filters `visible` in code
 * so no composite index setup is required.
 */
export async function getAllPosts(): Promise<Post[]> {
  try {
    const q = query(collection(db, PUBLISHED), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) return getAllPostsStatic();
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Post, 'id'>) }))
      .filter((p) => p.visible !== false);
  } catch {
    return getAllPostsStatic();
  }
}

/**
 * Single published post by slug. Docs are keyed by slug, so this is a direct
 * document lookup — no query/index needed. Falls back to static on miss/error.
 */
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  try {
    const snap = await getDoc(doc(db, PUBLISHED, slug));
    if (!snap.exists()) return getPostBySlugStatic(slug);
    const data = snap.data() as Omit<Post, 'id'>;
    if (data.visible === false) return getPostBySlugStatic(slug);
    return { id: snap.id, ...data };
  } catch {
    return getPostBySlugStatic(slug);
  }
}

export async function getLatestPosts(count = 3): Promise<Post[]> {
  return (await getAllPosts()).slice(0, count);
}

// ── One-time seed: push the static POSTS into Firestore ──────────────────────
/**
 * Seeds the `published` collection from the static POSTS array. Idempotent —
 * uses the slug as the doc id, so re-running overwrites rather than duplicates.
 * Call once from an authenticated admin context (see scripts/seed note).
 */
export async function seedPublishedFromStatic(authorId: string): Promise<number> {
  const posts = getAllPostsStatic();
  let n = 0;
  for (const post of posts) {
    const ref = doc(db, PUBLISHED, post.slug);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;
    await setDoc(ref, {
      ...post,
      authorId,
      visible: true,
      createdAt: serverTimestamp(),
    });
    n += 1;
  }
  return n;
}

// ── Authoring ────────────────────────────────────────────────────────────────
/** Turn a title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export interface DraftInput {
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  tags?: { label: string; style: 'gold' | 'muted' }[];
}

/**
 * Publish a post client-side. Doc id = slug so the post URL is stable and
 * re-publishing the same slug edits in place. Requires the author's uid and
 * display info (from the signed-in user). Enforced by Firestore rules:
 * only a signed-in author may write their own `authorId`.
 */
export async function publishPost(
  input: DraftInput,
  author: { uid: string; name: string; avatar?: string | null },
): Promise<string> {
  const slug = slugify(input.title);
  if (!slug) throw new Error('Give the post a title first.');
  if (!input.content.trim()) throw new Error('The post has no content.');

  await setDoc(doc(db, PUBLISHED, slug), {
    slug,
    variant: 'minimal',
    authorId: author.uid,
    author: {
      name: author.name,
      avatar: author.avatar || null,
      initials: author.name?.charAt(0) || 'A',
      meta: 'Just now',
    },
    title: input.title,
    excerpt: input.excerpt || input.content.slice(0, 160),
    content: input.content,
    image: input.image || '/editorial/glass-ribbon.png',
    stats: { views: '0', comments: 0 },
    tags: input.tags?.length ? input.tags : [{ label: 'Notes', style: 'gold' }],
    visible: true,
    createdAt: serverTimestamp(),
  });

  return slug;
}
