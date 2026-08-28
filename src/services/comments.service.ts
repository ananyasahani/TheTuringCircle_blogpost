import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "./auth.service";

const PUBLISHED = "published";
const COMMENTS = "comments";

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorInitials: string;
  content: string;
  createdAt?: unknown;
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

const threadRef = (slug: string) =>
  collection(db, PUBLISHED, slug, COMMENTS);

/**
 * Every comment on a post, oldest first so the thread reads top to bottom.
 * A single-field orderBy inside a subcollection is automatically indexed.
 */
export async function listComments(slug: string): Promise<Comment[]> {
  const snap = await getDocs(
    query(threadRef(slug), orderBy("createdAt", "asc")),
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Comment, "id">),
  }));
}

/**
 * Post a comment. The rules additionally require a verified email — always
 * true for Google sign-in — and that the author isn't on the denylist.
 */
export async function addComment(
  slug: string,
  user: UserProfile,
  rawContent: string,
): Promise<void> {
  const content = rawContent.trim();
  if (!content) throw new Error("Write something first.");
  if (content.length > 2000) {
    throw new Error("Comments are limited to 2000 characters.");
  }

  await addDoc(threadRef(slug), {
    authorId: user.uid,
    authorName: user.name,
    authorAvatar: user.avatar ?? null,
    authorInitials: initialsOf(user.name),
    content,
    createdAt: serverTimestamp(),
  });
}

/** Remove a comment. Permitted for its author and for moderators. */
export async function deleteComment(
  slug: string,
  commentId: string,
): Promise<void> {
  await deleteDoc(doc(db, PUBLISHED, slug, COMMENTS, commentId));
}

/**
 * Delete every comment on a post. Firestore does not cascade deletes, so a
 * post removed on its own would leave its thread orphaned under a path
 * nothing reads. Called before deleting the post itself.
 */
export async function deleteThread(slug: string): Promise<void> {
  const snap = await getDocs(threadRef(slug));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
