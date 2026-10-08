import Link from "next/link";

/**
 * Rendered with a real 404 status when a slug has no post. Same card the old
 * client-side branch showed, minus the lie that it was a successful response.
 */
export default function PostNotFound() {
  return (
    <div className="tc-grid min-h-screen flex items-center justify-center">
      <div className="glass-panel p-8 text-center">
        <h1 className="gold-text text-2xl font-bold mb-4">Post Not Found</h1>
        <Link href="/" className="gold-btn px-6 py-2 rounded">
          Return Home
        </Link>
      </div>
    </div>
  );
}
