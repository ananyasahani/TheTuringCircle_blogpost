# The Turing Circle

A dark, editorial journal where mathematics and computation meet discourse —
the online publication of the Mathematics & Computing club of MIT Manipal.

**Status:** read-only journal (v1). Posts, the newsletter, and Google sign-in
are live against Firebase. In-app authoring (the editor) and comments are
planned — see [Roadmap](#roadmap).

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19
- **Styling:** Tailwind CSS v4 + a hand-written design system in `src/app/globals.css`
- **Motion:** Framer Motion, Lenis (smooth scroll), a Three.js shader for the
  liquid-glass ribbon (`LiquidSpiral`)
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
| `/profile` | Signed-in identity, stats, sign-out, one-click post seeding |
| `/post/[slug]` | Individual essay |
| `/login` | Google sign-in |
| `/editor/[id]` | Auth-gated placeholder — the editor is not built yet |

## Data model (Firestore)

| Collection | Used by | Notes |
|---|---|---|
| `published` | posts service | One doc per post, **keyed by slug**. Single-field `orderBy(createdAt)` only, so no composite indexes are needed. |
| `users` | auth service | `users/{uid}` — created on first sign-in. Holds `role` (`reader` \| `moderator`); the security rules read it for moderation checks. |
| `subscribers` | newsletter service | `subscribers/{email}` — create-only, never client-readable. |
| `drafts`, `published/{id}/comments` | — | Security rules exist; no app code uses them yet (editor / comments phases). |

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
# empty scaffold and would fail)
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

## Project structure

```
src/
  app/
    (main)/            route group: library, archives, network, profile
    post/[slug]/       essay pages
    editor/[id]/       editor placeholder (auth-gated)
    login/             Google sign-in
    globals.css        the full design system
  components/
    layout/            Navbar
    providers/         AuthProvider, SmoothScroll (Lenis), EasterEggs
    reactbits/         BlurText, DecryptedText (adapted — see THIRD_PARTY_NOTICES)
    visuals/           LiquidSpiral (Three.js glass-ribbon shader)
  hooks/               useRequireAuth
  services/            posts, auth, newsletter — the Firebase access layer
  data/posts.js        starter essays (seeded into Firestore)
  lib/firebase.js      Firebase app init + emulator wiring
```

## Roadmap

1. **v1 — read-only journal** *(current)*: verified Firebase backend, auth
   guard, newsletter, clean deploy.
2. **Editor**: `drafts` service, in-app Tiptap editor, draft autosave, publish
   flow. Rules already exist.
3. **Comments**: comment threads on posts (verified-email gated), live counts.
4. **Author model & profile**: real author records instead of strings in
   `posts.js`; bookmarks + activity on `/profile`.
