export default function Loading() {
  return (
    <div className="results-page flex-1 flex flex-col min-h-screen animate-pulse" aria-busy="true" aria-label="Loading audit readout">
      {/* Route nav skeleton */}
      <div className="mx-auto flex max-w-6xl w-full items-center justify-between px-4 pt-5">
        <div className="h-4 w-40 bg-muted/20 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-muted/20 rounded-full" />
          <div className="h-9 w-24 bg-muted/20 rounded-full" />
        </div>
      </div>

      {/* Hero banner skeleton */}
      <div className="results-hero px-5 py-14 sm:px-8 sm:py-20 mt-4 bg-navy">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="h-4 w-24 bg-white/20 rounded" />
            <div className="h-10 sm:h-14 w-64 sm:w-96 bg-white/20 rounded" />
            <div className="h-4 w-48 bg-white/20 rounded" />
          </div>
          <div className="h-20 w-32 bg-white/20 rounded" />
        </div>
      </div>

      {/* Scores section skeleton */}
      <div className="px-5 py-12 sm:px-8 sm:py-16 flex-1">
        <div className="mx-auto max-w-4xl">
          <div className="h-8 w-32 bg-muted/20 rounded mb-8" />
          <div className="results-panel p-5 sm:p-8 space-y-6">
            <div className="h-12 bg-muted/15 rounded" />
            <div className="h-12 bg-muted/15 rounded" />
            <div className="h-12 bg-muted/15 rounded" />
            <div className="h-12 bg-muted/15 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
