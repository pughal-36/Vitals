import UrlAuditForm from "@/components/UrlAuditForm";

export default function ScanPage() {
  return (
    <main className="flex-1 flex flex-col items-center px-4 py-16">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Run a website audit</h1>
        <p className="text-muted text-lg mb-8">
          Enter a URL to check its performance, accessibility, best practices, and SEO.
        </p>
        <UrlAuditForm />
      </div>
    </main>
  );
}
