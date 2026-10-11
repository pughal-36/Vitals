export default function Loading() {
  return (
    <div className="vitals-chat-page flex-1 flex flex-col min-h-screen animate-pulse" aria-busy="true" aria-label="Loading audit assistant">
      <div className="scan-route-links mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pt-5">
        <div className="h-4 w-48 bg-muted/20 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-muted/20 rounded-full" />
          <div className="h-8 w-20 bg-muted/20 rounded-full" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 flex flex-col gap-6">
        <div className="h-10 w-64 bg-muted/20 rounded" />
        <div className="flex-1 bg-surface rounded-2xl border border-border/40 p-6 flex flex-col justify-end gap-4">
          <div className="h-16 w-3/4 bg-muted/15 rounded-xl self-start" />
          <div className="h-12 w-1/2 bg-primary/10 rounded-xl self-end" />
          <div className="h-20 w-4/5 bg-muted/15 rounded-xl self-start" />
        </div>
        <div className="h-14 bg-surface rounded-xl border border-border/40" />
      </div>
    </div>
  );
}
