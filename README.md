# Vitals Dashboard
*SEO & Performance Audit Dashboard (Week 3 Capstone)*

## FE-06: Streaming AI Chat Interface
This feature converts the audit-summary AI into a real-time streaming interface using the Vercel AI SDK and Gemini Flash.

**Key components:**
- **Route Handler**: [`src/app/api/chat/route.ts`](file:///c:/Users/HP/Desktop/Vitals/src/app/api/chat/route.ts) — handles API requests, converts UI messages to model format, and returns a `toUIMessageStreamResponse`.
- **Client Component**: [`src/app/chat/AuditChat.tsx`](file:///c:/Users/HP/Desktop/Vitals/src/app/chat/AuditChat.tsx) — a fully featured `useChat` implementation with a thinking indicator, markdown support, stop functionality, and auto-scroll logic.
- **Model Config**: [`src/lib/gemini/model.ts`](file:///c:/Users/HP/Desktop/Vitals/src/lib/gemini/model.ts) — single provider factory that safely bridges the `GEMINI_API_KEY`.
- **System Prompt**: [`src/lib/gemini/prompts.ts`](file:///c:/Users/HP/Desktop/Vitals/src/lib/gemini/prompts.ts) — extracted prompt module to keep config decoupled for FE-07.

### Tool Contract: `fetchMetaTags`
This project includes a server-side AI tool called `fetchMetaTags` that allows the assistant to retrieve OpenGraph and meta tag data from any valid URL.

**Zod Schema:**
```typescript
{
  url: z.string().url("Must be a valid URL")
}
```

**Return Object Shape:**
The tool fetches the HTML content server-side, parses it using `cheerio`, and returns the following structure. Fields are `null` if the corresponding tag is not found in the HTML.
```typescript
{
  title: string | null,
  description: string | null,
  ogTitle: string | null,
  ogDescription: string | null,
  ogImage: string | null,
  canonicalUrl: string | null,
}
```

**Error Handling:**
If the URL fetch fails, times out, or returns a non-OK status, the `execute` function will **throw an Error**. The AI SDK will catch this and emit an `output-error` UI message part to the client.

**Preview URL**: Visit `/chat` locally to test.

---
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
