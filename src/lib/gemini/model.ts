import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Create the provider factory.
// Your .env.local has VITALS_GEMINI_API_KEY, but @ai-sdk/google looks for
// GOOGLE_GENERATIVE_AI_API_KEY by default. The apiKey option bridges that gap.
const google = createGoogleGenerativeAI({
  apiKey: process.env.VITALS_GEMINI_API_KEY,
});

// Export a ready-to-use model adapter for the flash variant.
// We use gemini-3.6-flash because it's incredibly fast (great for chat streams)
// and handles context sizes large enough for huge JSON audit payloads.
export const geminiFlash = google("gemini-3.6-flash");
