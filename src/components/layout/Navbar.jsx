"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV_LINKS = [
  { label: "Journal", href: "/" },
  { label: "Library", href: "/library" },
  { label: "Archives", href: "/archives" },
  { label: "Network", href: "/network" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <header className={`nav-glass${scrolled ? " is-scrolled" : ""}`}>
      <div className="nav-inner">
        <Link href="/" className="nav-brand" onClick={() => setOpen(false)}>
          <span className="nav-mark" aria-hidden="true">
            <img src="/ttc-logo.png" alt="" />
          </span>
          <span className="nav-wordmark">The Turing Circle</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-route${active ? " is-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="nav-actions">
          <a
            href="https://ttcprojects.vercel.app"
            className="nav-write"
            target="_blank"
            rel="noreferrer"
          >
            Projects <span aria-hidden="true">↗</span>
          </a>

          {user ? (
            <Link href="/profile" className="nav-avatar" title={user.name}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
              ) : (
                <span>{user.name?.charAt(0) || "?"}</span>
              )}
            </Link>
          ) : (
            <Link href="/login" className="nav-signin">
              Sign in
            </Link>
          )}
        </div>

        <button
          className={`nav-toggle${open ? " is-open" : ""}`}
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span />
          <span />
        </button>
      </div>
    </header>

    <div className={`nav-mobile${open ? " is-open" : ""}`}>
      <nav aria-label="Mobile navigation">
        {NAV_LINKS.map((link, index) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            <span>0{index + 1}</span>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="nav-mobile-auth">
        {user ? (
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
          >
            Sign out ({user.name})
          </button>
        ) : (
          <Link href="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        )}
      </div>
      <p>MIT Manipal · Mathematics &amp; Computing</p>
    </div>
    </>
  );
}
