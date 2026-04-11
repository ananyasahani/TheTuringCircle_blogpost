"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";

const MotionLink = motion.create(Link);

const NAV_LINKS = [
  { label: "Library", href: "/library", icon: "auto_stories" },
  { label: "Archives", href: "/archives", icon: "inventory_2" },
  { label: "Network", href: "/network", icon: "hub" },
  { label: "Profile", href: "/profile", icon: "account_circle" },
];

// ─── Main export ────────────────────────────────────────────────────────────
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef(null);

  /* lock body scroll when menu is open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className="nav-glass">
        <div className="nav-inner">
          {/* LEFT — Logo */}
          <Link href="/" className="nav-brand">
            <div className="nav-logo-ring">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--gold-bright)",
                  fontVariationSettings: "'FILL' 0,'wght' 200",
                }}
              >
                blur_circular
              </span>
            </div>
            <span className="nav-wordmark">The Turing Circle</span>
          </Link>

          {/* RIGHT — Search + Burger */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button className="icon-btn" aria-label="Search">
              <span className="material-symbols-outlined" style={{ fontSize: "1.05rem" }}>
                search
              </span>
            </button>
            <BurgerToggle ref={burgerRef} open={open} setOpen={setOpen} />
          </div>
        </div>
      </header>

      {/* Full-screen overlay menu */}
      <AnimatePresence>
        {open && <MenuOverlay links={NAV_LINKS} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Mathematical Burger Toggle ─────────────────────────────────────────────
// Three bars that morph into a rotating geometric "X" via GSAP
import { forwardRef } from "react";

const BurgerToggle = forwardRef(function BurgerToggle({ open, setOpen }, ref) {
  const line1 = useRef(null);
  const line2 = useRef(null);
  const line3 = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (open) {
        const tl = gsap.timeline({ defaults: { duration: 0.4, ease: "power3.inOut" } });
        tl.to(line1.current, { y: 6, rotation: 45, transformOrigin: "center" })
          .to(line2.current, { scaleX: 0, opacity: 0 }, "<")
          .to(line3.current, { y: -6, rotation: -45, transformOrigin: "center" }, "<")
          .to(containerRef.current, { rotation: 180 }, "<0.1");
      } else {
        const tl = gsap.timeline({ defaults: { duration: 0.35, ease: "power2.out" } });
        tl.to(containerRef.current, { rotation: 0 })
          .to(line1.current, { y: 0, rotation: 0 }, "<")
          .to(line2.current, { scaleX: 1, opacity: 1 }, "<")
          .to(line3.current, { y: 0, rotation: 0 }, "<");
      }
    });
    return () => ctx.revert();
  }, [open]);

  return (
    <button
      ref={ref}
      onClick={() => setOpen((p) => !p)}
      className="burger-btn"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      <div ref={containerRef} className="burger-lines">
        <span ref={line1} className="burger-line" />
        <span ref={line2} className="burger-line" />
        <span ref={line3} className="burger-line" />
      </div>
    </button>
  );
});

// ─── Full-screen overlay ────────────────────────────────────────────────────
function MenuOverlay({ links, onClose }) {
  const containerRef = useRef(null);

  /* GSAP stagger for the mathematical grid dots in background */
  useEffect(() => {
    const dots = containerRef.current?.querySelectorAll(".menu-dot");
    if (dots?.length) {
      gsap.fromTo(
        dots,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 0.15,
          duration: 0.6,
          stagger: { each: 0.02, from: "center", grid: "auto" },
          ease: "back.out(2)",
        }
      );
    }
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="menu-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Geometric dot grid background */}
      <div className="menu-dot-grid" aria-hidden="true">
        {Array.from({ length: 80 }).map((_, i) => (
          <span key={i} className="menu-dot" />
        ))}
      </div>

      {/* Navigation links */}
      <nav className="menu-nav">
        {links.map((link, i) => (
          <MotionLink
            key={link.label}
            href={link.href}
            className="menu-link"
            onClick={onClose}
            initial={{ opacity: 0, x: -40, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 30, filter: "blur(4px)" }}
            transition={{
              duration: 0.5,
              delay: 0.08 + i * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="menu-link-index">0{i + 1}</span>
            <span className="material-symbols-outlined menu-link-icon">
              {link.icon}
            </span>
            <span className="menu-link-label">{link.label}</span>
            <span className="menu-link-arrow">
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                arrow_forward
              </span>
            </span>
          </MotionLink>
        ))}
      </nav>

      {/* Bottom — Write CTA */}
      <motion.div
        className="menu-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="gold-btn menu-write-btn">
          <span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>
            edit_note
          </span>
          Write
        </button>
      </motion.div>
    </motion.div>
  );
}
