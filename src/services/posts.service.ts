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
