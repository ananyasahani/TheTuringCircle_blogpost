# The Turing Circle

A dark, editorial journal where mathematics and computation meet discourse —
the online publication of the Mathematics & Computing club of MIT Manipal.

**Status:** v2 — a writing platform, not just a reader. Posts, the newsletter,
Google sign-in, an in-app editor with drafts and autosave, comment threads,
@usernames and a three-tier role model are all live against Firebase. See
[Roadmap](#roadmap) for what is next.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19
- **Styling:** Tailwind CSS v4 + a hand-written design system in `src/app/globals.css`
- **Editor:** TipTap 3 (ProseMirror) storing documents as JSON, with custom
  nodes for KaTeX inline/block math, embeds, and lowlight code blocks
- **Motion:** Framer Motion, Lenis (smooth scroll), a Three.js shader for the
  liquid-glass ribbon (`LiquidSpiral`). A **Lite mode** (`PerfProvider`)
  drops the shader and backdrop blurs when WebGL is blocked, reduced-motion is
  set, or the hardware looks weak — and can be toggled by hand in the footer.
- **Backend:** Firebase — Firestore + Auth (Google), client SDK only. No Cloud
  Functions; publishing is done client-side by authenticated authors.
- **Fonts:** Cormorant Garamond, Outfit, Space Mono, Material Symbols (loaded via
  `<link>` in the root layout)

## Routes

| Route | Description |
|---|---|
| `/` | Landing — hero, manifesto, featured essays, journal index, newsletter |
| `/library` | All posts as a grid with multi-select tag filtering |
| `/archives` | Chronological index |
| `/network` | Contributors, derived from post authorship |
| `/profile` | Signed-in identity, @username claim, drafts and published list, sign-out, one-click post seeding |
| `/post/[slug]` | Individual essay with comment thread (and a side-gutter game on wide screens) |
| `/login` | Google sign-in |
| `/editor/[id]` | The editor. Opens a draft or a published post by id; editors and moderators only |

## Data model (Firestore)

| Collection | Used by | Notes |
|---|---|---|
| `published` | posts service | One doc per post, **keyed by slug**. Single-field `orderBy(createdAt)` only, so no composite indexes are needed. |
| `drafts` | drafts service | Unpublished writing, readable only by its author (and moderators). Publishing copies a draft into `published` under its slug and deletes the draft. |
| `published/{slug}/comments` | comments service | Any verified, non-blocked member may comment; a commenter may edit their own for one hour; the commenter, the post's author, or a moderator may delete. |
| `users` | auth service | `users/{uid}` — created on first sign-in as `reader`. Holds `role` (`reader` \| `editor` \| `moderator`) and the optional `username`. **A member can never change their own role** — promotion is done in the Firebase console. |
| `usernames` | auth service | `usernames/{name}` → `{ uid }`. Create-only, never updatable, which is what makes handles unique. |
| `subscribers` | newsletter service | `subscribers/{email}` — create-only, never client-readable. |

### Roles

| Role | May |
|---|---|
| `reader` | read, comment, claim a username (the default for every new account) |
| `editor` | everything above, plus write, publish and edit **their own** posts |
| `moderator` | everything above, plus delete **any** post or comment, and release usernames |

Roles are enforced in `firestore.rules`, not in the UI — the UI only hides
what the rules would refuse. To promote someone, edit `users/{uid}.role` in
the Firebase console; the rules forbid the app from doing it.

Security rules live in `firestore.rules` / `storage.rules` and are deployed
separately from the app (see below).

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the Firebase web config
npm run dev
```

Open <http://localhost:3000>.

`.env.local` needs the Firebase web config for the project
(`the-turing-circle`) — get it from Firebase console → Project settings → Your
apps → Web app. Set `NEXT_PUBLIC_USE_EMULATORS=true` to point at the local
emulator suite instead of the live project.

### First run

Sign in at `/login`, then open `/profile` — if Firestore is empty you'll see a
**Seed posts** button that pushes the starter essays from `src/data/posts.js`
into the `published` collection.

## Firebase

```bash
npm i -g firebase-tools
firebase login

# deploy security rules (NOT `firebase deploy` — the functions/ dir is an
# empty scaffold and would fail). Rules are NOT deployed with the app: any
# change to firestore.rules needs this, or the app will get permission-denied.
firebase deploy --only firestore:rules,firestore:indexes

# local emulator suite
firebase emulators:start          # UI at http://localhost:4000
```

| Emulator | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8081 |
| Storage | 9199 |
| Functions | 5001 |

## Tests

```bash
npm test          # Playwright — the signed-out experience, in a real browser
npm run test:rules   # Firestore security rules, against the emulator
```

The Playwright suite covers every page a visitor can reach without signing in,
plus a mobile suite that asserts nothing scrolls sideways at 375 px. Signed-in
flows are not browser-tested (Firebase keeps sessions in IndexedDB, which
Playwright cannot capture); the rules tests cover that surface instead — that a
member cannot promote themselves, that roles gate authorship, and that
usernames are unique.

## Project structure

```
src/
  app/
    (main)/            route group: library, archives, network, profile
    post/[slug]/       essay pages
    editor/[id]/       the editor route
    login/             Google sign-in
    globals.css        the full design system
  components/
    editor/            Editor, menus, publish dialog, custom TipTap nodes
                       (extensions/, nodeviews/), tiptap-config.js = the schema
    layout/            Navbar, PerfToggle
    post/              CommentThread
    providers/         AuthProvider, PerfProvider (Lite mode), SmoothScroll, EasterEggs
    reactbits/         BlurText, DecryptedText (adapted — see THIRD_PARTY_NOTICES)
    visuals/           LiquidSpiral (Three.js shader), SignalFlap (gutter game)
  hooks/               useRequireAuth
  services/            posts, drafts, comments, auth, newsletter — the Firebase access layer
  data/posts.js        starter essays (seeded into Firestore)
  lib/firebase.js      Firebase app init + emulator wiring
```

## Roadmap

1. ~~**v1 — read-only journal**~~ shipped.
2. ~~**Editor**~~ shipped: `drafts` service, TipTap editor, autosave, publish
   flow, editing published posts.
3. ~~**Comments**~~ shipped: verified-email gated threads on every post.
4. ~~**Roles & usernames**~~ shipped: reader / editor / moderator, @handles.
5. **Author model**: real author records instead of the strings in
   `posts.js`; bylines and the `/network` page driven by `users`.
6. **Profile**: bookmarks and a real reading list.
7. **Browser tests for signed-in flows** against the emulator suite.
