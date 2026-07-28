# The Turing Circle

> **UNDER CONSTRUCTION**
>
> Sahani if you're reading this, UPDATE THE FIREBASE.

A dark, mathematical blog platform where computation meets discourse. Built with Next.js 16, React 19, and Firebase.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS v4
- **Animations**: Framer Motion, GSAP, Lenis (smooth scroll)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Fonts**: Outfit, Space Mono, Material Symbols Outlined

## Features

- Glassmorphic dark UI with gold accent design system
- GSAP-animated navbar with mathematical burger menu
- Framer Motion page transitions and staggered card animations
- Lenis smooth scrolling
- Feed tabs (For you / Featured / Latest) with live sorting
- Dynamic post pages with markdown-like content rendering
- Library page with multi-select tag filtering
- Archives page with chronological timeline
- Network page showing contributors
- Profile page with reading stats

## Routes

| Route | Description |
|---|---|
| `/` | Homepage feed with tabs, sidebar widgets |
| `/library` | Browsable post grid with tag filters |
| `/archives` | Chronological post timeline |
| `/network` | Author/contributor cards |
| `/profile` | Reader profile and stats |
| `/post/[slug]` | Individual post pages |
| `/editor/[id]` | Post editor (WIP) |
| `/login` | Authentication (WIP) |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firebase Emulators

```bash
firebase emulators:start
```

Emulator UI at [http://localhost:4000](http://localhost:4000).

| Service | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8081 |
| Storage | 9199 |
| Functions | 5001 |

## Project Structure

```
src/
  app/
    (main)/          # Route group for Library, Archives, Network, Profile
    post/[slug]/     # Dynamic post pages
    editor/[id]/     # Post editor
  components/
    cards/           # PostCard variants (Hero, Blueprint, Minimal)
    layout/          # Navbar, SideMenu
    providers/       # SmoothScroll (Lenis)
    ui/              # Button, Modal, TextInput
  data/              # Static post data (to be replaced by Firestore)
  services/          # Posts service, Auth service
  lib/               # Firebase config
```
