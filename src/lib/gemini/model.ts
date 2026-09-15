import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Create the provider factory.
// Your .env.local has GEMINI_API_KEY, but @ai-sdk/google looks for
// GOOGLE_GENERATIVE_AI_API_KEY by default. The apiKey option bridges that gap.
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Export a ready-to-use model adapter for the flash variant.
// Any route or feature that needs Gemini imports this single reference
// instead of creating its own provider — keeps config in one place.
export const geminiFlash = google("gemini-2.0-flash");
