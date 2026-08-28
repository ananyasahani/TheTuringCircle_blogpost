import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "./auth.service";
import { deleteThread } from "./comments.service";

const DRAFTS = "drafts";
const PUBLISHED = "published";

export interface Draft {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorInitials: string;
  title: string;
  /** TipTap JSON document. */
  content: Record<string, unknown> | string;
  excerpt?: string;
  image?: string;
  tags?: { label: string; style: "gold" | "muted" }[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Turn a title into a URL slug. Published docs are keyed by slug, so this is
 * also the document id.
 */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}

/**
 * First free slug for a title: `foo`, else `foo-2`, `foo-3`… Publishing an
 * update to a post that already owns its slug passes `currentSlug` so it
 * keeps the URL instead of drifting to `-2`.
 */
export async function resolveSlug(
  title: string,
  currentSlug?: string,
): Promise<string> {
  const base = slugify(title);
  for (let n = 1; n < 50; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (candidate === currentSlug) return candidate;
    const existing = await getDoc(doc(db, PUBLISHED, candidate));
    if (!existing.exists()) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** Create an empty draft owned by the signed-in user; returns its id. */
export async function createDraft(user: UserProfile): Promise<string> {
  const ref = await addDoc(collection(db, DRAFTS), {
    authorId: user.uid,
    authorName: user.name,
    authorAvatar: user.avatar ?? null,
    authorInitials: initialsOf(user.name),
    title: "",
    content: { type: "doc", content: [{ type: "paragraph" }] },
    excerpt: "",
    image: "",
    tags: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getDraft(id: string): Promise<Draft | null> {
  const snap = await getDoc(doc(db, DRAFTS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Draft, "id">) };
}

/** Patch a draft. Only the fields passed are written. */
export async function updateDraft(
  id: string,
  patch: Partial<Omit<Draft, "id">>,
): Promise<void> {
  await updateDoc(doc(db, DRAFTS, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDraft(id: string): Promise<void> {
  await deleteDoc(doc(db, DRAFTS, id));
}

/**
 * Every draft belonging to a user, newest first.
 *
 * Deliberately a single-field `where` with the sort done in memory: adding an
 * `orderBy` here would require a composite index, and this project keeps to
 * Firestore's automatic single-field indexes.
 */
export async function listMyDrafts(uid: string): Promise<Draft[]> {
  const snap = await getDocs(
    query(collection(db, DRAFTS), where("authorId", "==", uid)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Draft, "id">) }))
    .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
}

/** Published posts belonging to a user, newest first. Same index reasoning. */
export async function listMyPublished(uid: string) {
  const snap = await getDocs(
    query(collection(db, PUBLISHED), where("authorId", "==", uid)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/**
 * Load a live post for editing. Published docs are keyed by slug, so the slug
 * doubles as the editor's id — draft ids are Firestore auto-ids, which can't
 * collide with a slug in practice.
 */
export async function getPublishedForEdit(slug: string) {
  const snap = await getDoc(doc(db, PUBLISHED, slug));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  return {
    id: snap.id,
    slug: snap.id,
    authorId: data.authorId as string,
    authorName: (data.author as { name?: string })?.name ?? "",
    authorAvatar: (data.author as { avatar?: string })?.avatar ?? null,
    authorInitials: (data.author as { initials?: string })?.initials ?? "?",
    title: Array.isArray(data.title)
      ? (data.title as string[]).join("")
      : ((data.title as string) ?? ""),
    content: data.content as Record<string, unknown> | string,
    excerpt: (data.excerpt as string) ?? "",
    image: (data.image as string) ?? "",
    tags: (data.tags as Draft["tags"]) ?? [],
  };
}

/**
 * Patch a live post in place. The slug — and therefore the URL — never
 * changes, so existing links keep working.
 */
export async function updatePublished(
  slug: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(db, PUBLISHED, slug), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export interface PublishMeta {
  excerpt: string;
  image: string;
  tags: { label: string; style: "gold" | "muted" }[];
}

/**
 * Publish a draft: write `published/{slug}` then delete the draft, so a post
 * lives in exactly one place. Returns the slug it went live at.
 */
export async function publishDraft(
  draft: Draft,
  meta: PublishMeta,
): Promise<string> {
  const title = draft.title.trim() || "Untitled";
  const slug = await resolveSlug(title);

  await setDoc(doc(db, PUBLISHED, slug), {
    slug,
    title,
    content: draft.content,
    excerpt: meta.excerpt,
    image: meta.image,
    tags: meta.tags,
    variant: "hero",
    authorId: draft.authorId,
    author: {
      name: draft.authorName,
      initials: draft.authorInitials,
      avatar: draft.authorAvatar,
      // Kept for the legacy display paths; real ordering uses createdAt.
      meta: `${meta.tags[0]?.label ?? "Notes"} · Just now`,
    },
    stats: { views: "0", comments: 0 },
    visible: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await deleteDraft(draft.id);
  return slug;
}

/**
 * Take a post down. Its comment thread is removed first — Firestore does not
 * cascade, so deleting only the post document would strand the thread.
 * Permitted for the post's author and for moderators.
 */
export async function deletePublishedPost(slug: string): Promise<void> {
  await deleteThread(slug);
  await deleteDoc(doc(db, PUBLISHED, slug));
}

/** Save edits to an already-published post, keeping its slug and createdAt. */
export async function updatePublishedPost(
  slug: string,
  title: string,
  content: Draft["content"],
  meta: PublishMeta,
): Promise<string> {
  await updatePublished(slug, {
    title: title.trim() || "Untitled",
    content,
    excerpt: meta.excerpt,
    image: meta.image,
    tags: meta.tags,
  });
  return slug;
}
