"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content:
      "Hi, I am your Vroom assistant. Ask me anything about auctions, trading, or your garage.",
  },
];

export default function ChatAssistantBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  useEffect(() => {
    if (pathname === "/login") {
      // Logout redirects to /login; reset conversation when reaching login.
      setMessages(INITIAL_MESSAGES);
      setInput("");
      setError(null);
      setOpen(false);
    }
  }, [pathname]);

  const conversationHistory = useMemo(
    () =>
      messages.filter(
        (message) => message.role !== "assistant" || message !== messages[0],
      ),
    [messages],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) {
      return;
    }

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: message },
    ];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          messages: conversationHistory,
        }),
      });

      const payload = (await response.json()) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "Failed to get assistant reply.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: payload.reply as string,
        },
      ]);
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.";

      setError(messageText);
    } finally {
      setLoading(false);
    }
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <>
      {open ? (
        <section className="fixed bottom-5 right-5 z-50 flex h-[520px] w-[360px] max-h-[75vh] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-neutral-200 bg-neutral-900 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Roy Mustang</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-800"
            >
              Close
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 p-4">
            {messages.map((messageItem, index) => (
              <div
                key={`${messageItem.role}-${index}`}
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  messageItem.role === "user"
                    ? "ml-auto bg-neutral-900 text-white"
                    : "mr-auto bg-white text-neutral-900 shadow"
                }`}
              >
                {messageItem.content}
              </div>
            ))}

            {loading ? (
              <div className="mr-auto inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-neutral-700 shadow">
                <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-400" />
                Thinking...
              </div>
            ) : null}

            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>

          <form
            onSubmit={onSubmit}
            className="border-t border-neutral-200 bg-white p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onComposerKeyDown}
                rows={2}
                placeholder="Message the assistant..."
                className="min-h-[44px] flex-1 resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600"
              />
              <button
                type="submit"
                disabled={loading || input.trim().length === 0}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-xl text-white shadow-xl transition hover:scale-105"
          aria-label="Toggle chat assistant"
        >
          AI
        </button>
      ) : null}
    </>
  );
}
