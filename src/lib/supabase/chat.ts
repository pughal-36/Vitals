import { getSupabaseClient } from "./client";

export type ChatMessageRow = {
  id: string;
  created_at: string;
  scan_id: string;
  role: string;
  content: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (getSupabaseClient() as any).from("chat_messages");

export async function getChatHistory(scanId: string): Promise<ChatMessageRow[]> {
  try {
    const { data, error } = await table()
      .select("*")
      .eq("scan_id", scanId)
      .order("created_at", { ascending: true });
  
    if (error) {
      console.error("Failed to fetch chat history", error);
      return [];
    }
    return (data ?? []) as ChatMessageRow[];
  } catch (error) {
    console.error("Failed to fetch chat history", error);
    return [];
  }
}

export async function saveChatMessage(message: Omit<ChatMessageRow, "id" | "created_at">) {
  const { error } = await table().insert(message);
  if (error) {
    console.error("Failed to save chat message", error);
  }
}
