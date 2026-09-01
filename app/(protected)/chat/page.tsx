"use client";

import { useRef, useState } from "react";
import { ApiError, sendChat } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Bot, Loader2, MessageCircleMore, UserRound } from "lucide-react";
import { EmptyState, PageHeader, Panel, SectionHeader, ui } from "@/components/ui";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !message.trim() || sending) return;
    setError(null);
    const userMessage = message.trim();
    setMessages((current) => [...current, { role: "user", text: userMessage }]);
    setMessage("");
    setSending(true);
    scrollToBottom();

    try {
      const response = await sendChat(token, userMessage);
      setMessages((current) => [...current, { role: "assistant", text: response.response }]);
      scrollToBottom();
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(
        caughtError instanceof ApiError && caughtError.message
          ? caughtError.message
          : "Unable to reach HealthQuest AI. Make sure the backend is running.",
      );
    } finally {
      setSending(false);
    }
  };

  if (!token) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="AI Coach"
        title="Chat with HealthQuest AI"
        description="Replies are generated locally with Ollama and can take up to a minute."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <SectionHeader title="New message" subtitle="Ask a question" />
          <form className="mt-4 space-y-4" onSubmit={handleSend}>
            <textarea
              className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 disabled:opacity-60"
              rows={6}
              value={message}
              disabled={sending}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void handleSend(event);
                }
              }}
              placeholder="Ask about a health habit, routine, or symptom…  (Ctrl/⌘ + Enter to send)"
            />
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={sending || !message.trim()} className={ui.btnPrimary}>
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <MessageCircleMore size={16} />
              )}
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
        </Panel>

        <Panel>
          <SectionHeader title="Conversation" subtitle="Recent exchanges" />

          <div ref={scrollRef} className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {messages.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                className={`flex items-end gap-3 ${
                  entry.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {entry.role === "assistant" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Bot size={15} />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[var(--muted)]">
                    <UserRound size={15} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                    entry.role === "user"
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--panel-border)] bg-[var(--bg-soft)] text-[var(--text)]"
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            ))}

            {sending ? (
              <div className="flex items-end gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Bot size={15} />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--panel-border)] bg-[var(--bg-soft)] px-4 py-2.5 text-sm text-[var(--muted)]">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking…
                </div>
              </div>
            ) : null}

            {messages.length === 0 && !sending ? (
              <EmptyState
                title="Start a conversation"
                description="Ask HealthQuest AI for a new habit, symptom summary, or reminder."
              />
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
