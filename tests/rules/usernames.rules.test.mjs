import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

/**
 * The @username registry, tested against the real rules engine.
 *
 * Uniqueness is not enforced by the app — it is enforced by the rules: a
 * usernames/{name} document may be *created* by the member it names, and may
 * never be *updated*. So the second person to claim a name is refused by the
 * engine itself, whatever the client does. These tests pin that property, and
 * that a member cannot claim a name on someone else's behalf.
 *
 * Run with `npm run test:rules`, which starts the Firestore emulator around
 * these tests. They never touch the live project.
 */

const RULES = readFileSync("firestore.rules", "utf8");

let testEnv;

const member = (uid) =>
  testEnv.authenticatedContext(uid, { email_verified: true }).firestore();

const visitor = () => testEnv.unauthenticatedContext().firestore();

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
    await setDoc(doc(db, "users", "alice"), profile("reader"));
    await setDoc(doc(db, "users", "bob"), profile("reader"));
    await setDoc(doc(db, "users", "mod1"), profile("moderator"));
    // A name that is already taken.
    await setDoc(doc(db, "usernames", "taken"), { uid: "bob" });
  });
});

describe("claiming a username", () => {
  it("lets a member claim a free name for themselves", async () => {
    await assertSucceeds(
      setDoc(doc(member("alice"), "usernames", "alice_writes"), { uid: "alice" }),
    );
  });

  it("refuses a name that is already taken", async () => {
    // The app uses setDoc, which is an update on an existing doc — and updates
    // are never allowed. This is the whole uniqueness guarantee.
    await assertFails(
      setDoc(doc(member("alice"), "usernames", "taken"), { uid: "alice" }),
    );
  });

  it("refuses claiming a name on someone else's behalf", async () => {
    await assertFails(
      setDoc(doc(member("alice"), "usernames", "for_bob"), { uid: "bob" }),
    );
  });

  it("refuses a signed-out visitor", async () => {
    await assertFails(
      setDoc(doc(visitor(), "usernames", "anon"), { uid: "alice" }),
    );
  });

  it("refuses re-pointing your own name at another uid", async () => {
    await assertFails(
      setDoc(doc(member("bob"), "usernames", "taken"), { uid: "alice" }),
    );
  });
});

describe("reading and releasing usernames", () => {
  it("lets anyone read the registry (bylines need it)", async () => {
    await assertSucceeds(getDoc(doc(visitor(), "usernames", "taken")));
  });

  it("stops a member deleting a name, even their own", async () => {
    await assertFails(deleteDoc(doc(member("bob"), "usernames", "taken")));
  });

  it("lets a moderator release a name", async () => {
    await assertSucceeds(deleteDoc(doc(member("mod1"), "usernames", "taken")));
  });
});
