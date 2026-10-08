import { generateText } from "ai";
import { NextResponse } from "next/server";
import { geminiFlash } from "@/lib/gemini/model";

export const runtime = "nodejs";

const angles = ["page speed and Core Web Vitals", "page titles and metadata", "internal links and crawl paths", "mobile usability", "accessibility signals", "image optimization", "structured data and search snippets", "indexability and canonical URLs"];

export async function GET() {
  const angle = angles[Math.floor(Math.random() * angles.length)];
  try {
    const { text } = await generateText({
      model: geminiFlash,
      temperature: 0.85,
      prompt: `Write exactly 7 distinct, friendly, concise SEO tips (each 8–16 words), focused mainly on ${angle}, with a few adjacent SEO ideas. Be accurate, varied, and lightly lively; no emojis, numbering, markdown, or claims that a specific website has a problem. Return only a JSON object with a "tips" array of strings.`,
    });
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = JSON.parse(text.slice(start, end + 1)) as { tips?: unknown };
    const tips = Array.isArray(parsed.tips) ? parsed.tips.filter((tip): tip is string => typeof tip === "string" && tip.trim().length > 0).map((tip) => tip.trim()).slice(0, 8) : [];
    if (tips.length < 4) throw new Error("Gemini returned too few usable tips");
    return NextResponse.json({ tips, topic: angle }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("SEO tips generation failed", error);
    return NextResponse.json({ tips: [], topic: angle }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
