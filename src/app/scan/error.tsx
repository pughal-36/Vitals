"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-3">Something went wrong</h2>
      <p className="text-muted mb-8 max-w-md mx-auto leading-relaxed">
        We encountered an unexpected error. Please try again or return to the dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white font-medium transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-hover font-medium transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
