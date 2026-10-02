import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-3">Page not found</h2>
      <p className="text-muted mb-8 max-w-md mx-auto leading-relaxed">
        We couldn't find the page you were looking for. It might have been moved or deleted.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white font-medium transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
