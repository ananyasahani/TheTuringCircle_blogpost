"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * Route guard for pages that require a signed-in user. Once auth has resolved,
 * an anonymous visitor is redirected to /login?next=<current path> so they land
 * back here after signing in. Returns { user, loading } so the page can hold a
 * placeholder until the user is known.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [user, loading, pathname, router]);

  return { user, loading };
}
