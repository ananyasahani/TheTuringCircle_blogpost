import { siteUrl } from "@/lib/siteUrl";

/** Served at /robots.txt. Points crawlers at the sitemap and keeps them out
 *  of the signed-in surfaces, which have nothing to index. */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/editor/", "/profile", "/login"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
