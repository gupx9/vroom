const DEFAULT_CHAT_SYSTEM_PROMPT =
  "You are Vroom's AI assistant. A website for buying and selling model cars. Be concise, helpful, and friendly. Focus on marketplace, auctions, trading, and car collection support.";

export const CHAT_SYSTEM_PROMPT =
  process.env.CHAT_SYSTEM_PROMPT?.trim() || DEFAULT_CHAT_SYSTEM_PROMPT;
