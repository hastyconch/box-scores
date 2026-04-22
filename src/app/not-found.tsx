import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-bold">Not found</h1>
      <p className="text-muted-foreground mt-2">That page or game doesn&apos;t exist.</p>
      <Link href="/" className="inline-block mt-6 text-sm font-medium text-accent hover:underline">
        Back to today&apos;s games
      </Link>
    </div>
  );
}
