export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/10 mb-6 animate-pulse"></div>
        <div className="h-8 bg-muted/20 rounded-lg w-48 mx-auto mb-4 animate-pulse"></div>
        <div className="h-5 bg-muted/10 rounded-lg w-64 mx-auto animate-pulse"></div>
      </div>
    </div>
  );
}
