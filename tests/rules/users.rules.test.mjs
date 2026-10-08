import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

/**
 * Privilege escalation, tested against the real rules engine.
 *
 * A member must never be able to grant themselves a role. The whole role
 * system rests on that one property: `role` lives on users/{uid}, the rules
 * read it with get() to decide who may publish and who may delete, and the
 * app has no code path that writes it. Promotion happens in the Firebase
 * console, which uses the Admin SDK and bypasses these rules entirely.
 *
 * Run with `npm run test:rules`, which starts the Firestore emulator around
 * these tests. They never touch the live project.
 */

const RULES = readFileSync("firestore.rules", "utf8");

let testEnv;

/** A signed-in member. Google sign-in always yields a verified email. */
const member = (uid) =>
  testEnv.authenticatedContext(uid, { email_verified: true }).firestore();

/** Seed documents past the rules, the way the console would. */
const seed = (fn) => testEnv.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

const profile = (role) => ({
  uid: "x",
  name: "Member",
  email: "member@example.com",
  avatar: null,
  role,
});

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ttc-rules-test",
    firestore: { rules: RULES, host: "127.0.0.1", port: 8081 },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed(async (db) => {
    await setDoc(doc(db, "users", "reader1"), profile("reader"));
    await setDoc(doc(db, "users", "editor1"), profile("editor"));
    await setDoc(doc(db, "users", "mod1"), profile("moderator"));
    await setDoc(doc(db, "published", "p1"), {
      authorId: "editor1",
      title: "A post",
      content: "Body.",
    });
  });
});

describe("a member cannot promote themselves", () => {
  it("rejects updating role to moderator", async () => {
    await assertFails(
      updateDoc(doc(member("reader1"), "users", "reader1"), {
        role: "moderator",
      }),
    );
  });

  it("rejects updating role to editor", async () => {
    await assertFails(
      updateDoc(doc(member("reader1"), "users", "reader1"), { role: "editor" }),
    );
  });

  it("rejects a merge-set that raises the role", async () => {
    // setDoc with merge is the sneaky one: it looks like a partial write but
    // is still an update, so the unchanged-role check applies.
    await assertFails(
      setDoc(
        doc(member("reader1"), "users", "reader1"),
        { role: "moderator" },
        { merge: true },
      ),
    );
  });

  it("rejects a full overwrite that raises the role", async () => {
    await assertFails(
      setDoc(doc(member("reader1"), "users", "reader1"), profile("moderator")),
    );
  });

  it("rejects deleting the role field", async () => {
    // Dropping `role` would make role() error out rather than return
    // "reader"; the rules must fail closed instead.
    await assertFails(
      updateDoc(doc(member("reader1"), "users", "reader1"), {
        role: deleteField(),
      }),
    );
  });

  it("rejects deleting the profile, which would allow a fresh create", async () => {
    await assertFails(deleteDoc(doc(member("reader1"), "users", "reader1")));
  });

  it("rejects creating a brand new profile at a raised role", async () => {
    await assertFails(
      setDoc(doc(member("newcomer"), "users", "newcomer"), profile("moderator")),
    );
  });

  it("rejects writing someone else's profile", async () => {
    await assertFails(
      updateDoc(doc(member("reader1"), "users", "editor1"), { role: "reader" }),
    );
  });

  it("rejects an editor promoting themselves to moderator", async () => {
    await assertFails(
      updateDoc(doc(member("editor1"), "users", "editor1"), {
        role: "moderator",
      }),
    );
  });

  it("rejects a moderator promoting someone else", async () => {
    // Even the top tier has no write access to roles; promotion is
    // console-only, so a compromised moderator cannot mint more moderators.
    await assertFails(
      updateDoc(doc(member("mod1"), "users", "reader1"), {
        role: "moderator",
      }),
    );
  });
});

describe("what a member may still do to their own profile", () => {
  it("allows a new account to be created as a reader", async () => {
    await assertSucceeds(
      setDoc(doc(member("newcomer"), "users", "newcomer"), profile("reader")),
    );
  });

  it("allows editing profile fields while the role is unchanged", async () => {
    // The positive control: if this ever fails, the rule is too tight and
    // sign-in itself would break.
    await assertSucceeds(
      setDoc(
        doc(member("reader1"), "users", "reader1"),
        { name: "Renamed", role: "reader" },
        { merge: true },
      ),
    );
  });

  it("allows removing the email field from their own profile", async () => {
    // users/{uid} is world-readable, so the app no longer stores the address
    // and strips it from older documents on sign-in. That cleanup write must
    // be accepted — an update that only deletes a field leaves `role` as is.
    await assertSucceeds(
      updateDoc(doc(member("reader1"), "users", "reader1"), {
        email: deleteField(),
      }),
    );
  });

  it("still refuses that cleanup on someone else's profile", async () => {
    await assertFails(
      updateDoc(doc(member("reader1"), "users", "editor1"), {
        email: deleteField(),
      }),
    );
  });
});

describe("size limits are enforced by the rules, not just the forms", () => {
  // The web config ships to every browser, so the forms are advisory: anyone
  // can write with the SDK. These bounds are the only real ceiling.
  it("rejects a comment over 2000 characters", async () => {
    await assertFails(
      addDoc(collection(member("reader1"), "published", "p1", "comments"), {
        authorId: "reader1",
        content: "x".repeat(2001),
        createdAt: new Date(),
      }),
    );
  });

  it("rejects an empty comment", async () => {
    await assertFails(
      addDoc(collection(member("reader1"), "published", "p1", "comments"), {
        authorId: "reader1",
        content: "",
        createdAt: new Date(),
      }),
    );
  });

  it("still accepts a comment of ordinary length", async () => {
    await assertSucceeds(
      addDoc(collection(member("reader1"), "published", "p1", "comments"), {
        authorId: "reader1",
        content: "A reasonable thought about the piece.",
        createdAt: new Date(),
      }),
    );
  });

  it("rejects a post body over the content ceiling", async () => {
    await assertFails(
      setDoc(doc(member("editor1"), "published", "huge"), {
        authorId: "editor1",
        title: "Huge",
        content: "x".repeat(200001),
      }),
    );
  });

  it("rejects an overlong title", async () => {
    await assertFails(
      setDoc(doc(member("editor1"), "published", "longtitle"), {
        authorId: "editor1",
        title: "x".repeat(301),
        content: "fine",
      }),
    );
  });
});

describe("the role actually gates authorship", () => {
  const post = (authorId) => ({
    authorId,
    title: "A post",
    content: { type: "doc", content: [] },
  });

  it("stops a reader publishing", async () => {
    await assertFails(
      setDoc(doc(member("reader1"), "published", "p1"), post("reader1")),
    );
  });

  it("lets an editor publish their own post", async () => {
    await assertSucceeds(
      setDoc(doc(member("editor1"), "published", "p1"), post("editor1")),
    );
  });

  it("stops an editor publishing under someone else's byline id", async () => {
    await assertFails(
      setDoc(doc(member("editor1"), "published", "p1"), post("mod1")),
    );
  });

  it("stops an editor deleting another member's post", async () => {
    await seed((db) => setDoc(doc(db, "published", "p2"), post("mod1")));
    await assertFails(deleteDoc(doc(member("editor1"), "published", "p2")));
  });

  it("lets a moderator delete anyone's post", async () => {
    await seed((db) => setDoc(doc(db, "published", "p2"), post("editor1")));
    await assertSucceeds(deleteDoc(doc(member("mod1"), "published", "p2")));
  });

  it("still lets a reader comment", async () => {
    // Readers are not second-class: they just cannot author posts.
    await seed((db) => setDoc(doc(db, "published", "p3"), post("editor1")));
    await assertSucceeds(
      setDoc(doc(member("reader1"), "published", "p3", "comments", "c1"), {
        authorId: "reader1",
        content: "Good piece.",
      }),
    );
  });
});
