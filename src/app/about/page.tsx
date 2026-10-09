const credits = [
  {
    name: "Earth low-poly model",
    creator: "Zoe XR",
    source: "https://poly.pizza/m/3U-XAIY031u",
    sourceLabel: "Poly Pizza model page",
    license: "Creative Commons Attribution (CC BY; version not stated on the listing)",
    licenseUrl: "https://poly.pizza/docs/tos",
  },
  {
    name: "Bodoni Moda (headline font)",
    creator: "Owen Earl · Bodoni Moda Project Authors",
    source: "https://fonts.google.com/specimen/Bodoni+Moda",
    sourceLabel: "Google Fonts",
    license: "SIL Open Font License 1.1",
    licenseUrl: "https://github.com/google/fonts/blob/main/ofl/bodonimoda/OFL.txt",
  },
  {
    name: "Three.js",
    creator: "three.js authors (the project community)",
    source: "https://github.com/mrdoob/three.js",
    sourceLabel: "Project repository",
    license: "MIT",
    licenseUrl: "https://github.com/mrdoob/three.js/blob/dev/LICENSE",
  },
  {
    name: "React Three Fiber",
    creator: "Poimandres (project team)",
    source: "https://github.com/pmndrs/react-three-fiber",
    sourceLabel: "Project repository",
    license: "MIT",
    licenseUrl: "https://github.com/pmndrs/react-three-fiber/blob/master/LICENSE",
  },
  {
    name: "Next.js",
    creator: "Vercel, Inc. and contributors",
    source: "https://github.com/vercel/next.js",
    sourceLabel: "Project repository",
    license: "MIT",
    licenseUrl: "https://github.com/vercel/next.js/blob/canary/license.md",
  },
  {
    name: "Tailwind CSS",
    creator: "Adam Wathan (creator) · Tailwind Labs, Inc. (project steward)",
    source: "https://github.com/tailwindlabs/tailwindcss",
    sourceLabel: "Project repository",
    license: "MIT",
    licenseUrl: "https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE",
  },
  {
    name: "Supabase",
    creator: "Supabase, Inc. and contributors",
    source: "https://github.com/supabase/supabase",
    sourceLabel: "Project repository",
    license: "Apache License 2.0",
    licenseUrl: "https://github.com/supabase/supabase/blob/master/LICENSE",
  },
  {
    name: "PageSpeed Insights API",
    creator: "Google LLC",
    source: "https://developers.google.com/speed/docs/insights/rest",
    sourceLabel: "API documentation",
    license: "Google APIs Terms of Service (hosted service; not a software license)",
    licenseUrl: "https://developers.google.com/terms",
  },
  {
    name: "Gemini Flash API",
    creator: "Google LLC",
    source: "https://ai.google.dev/gemini-api/docs/models/gemini",
    sourceLabel: "API documentation",
    license: "Google APIs Terms + Gemini API Additional Terms (hosted service; not a software license)",
    licenseUrl: "https://ai.google.dev/gemini-api/terms",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page flex-1">
      <div className="about-wrap">
        <h1>About Vitals</h1>

        <section className="about-section" aria-labelledby="developer-title">
          <h2 id="developer-title">Meet the developer</h2>
          <p>Pughal Jeyaprkash, second-year B.Tech IT student.</p>
          <p><a href="https://github.com/pughal-36">GitHub profile</a></p>
        </section>

        <section className="about-section" aria-labelledby="how-title">
          <h2 id="how-title">How it works</h2>
          <ol className="about-steps">
            <li><strong>Enter a URL</strong>Choose a page you want to check.</li>
            <li><strong>Vitals reads the page</strong>PageSpeed Insights returns performance, accessibility, best-practice, and SEO data.</li>
            <li><strong>Ask the assistant</strong>The AI assistant explains the results and what you can fix.</li>
          </ol>
        </section>

        <section className="about-section" aria-labelledby="credits-title">
          <h2 id="credits-title">Credits</h2>
          <p className="about-built">Built as my capstone project for the FlyRank frontend internship.</p>
          <a className="about-contribute" href="https://github.com/pughal-36/Vitals">Contribute on GitHub</a>
          <p className="about-built mt-6"><strong>Built with:</strong> Next.js, Tailwind CSS, Supabase, PageSpeed Insights API, Gemini Flash, Three.js, and React Three Fiber.</p>
          <p className="mt-5 font-semibold text-foreground">Sources and licenses</p>
          <ul className="credit-list">
            {credits.map((credit) => <li key={credit.name}>
              <strong>{credit.name}</strong>
              <span className="credit-meta">Creator: {credit.creator}</span>
              <span className="credit-meta">Source: <a href={credit.source}>{credit.sourceLabel}</a></span>
              <span className="credit-meta">License or service terms: <a href={credit.licenseUrl}>{credit.license}</a></span>
            </li>)}
            <li>
              <strong>Torn-paper edge</strong>
              <span className="credit-meta">Creator: Vitals project contributors</span>
              <span className="credit-meta">Source: custom CSS clip-path in this project; no external image or texture asset.</span>
              <span className="credit-meta">License: no separate asset license specified; the repository does not declare a license for this custom CSS.</span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted">No Canva images or textures are used.</p>
        </section>
      </div>
    </main>
  );
}
