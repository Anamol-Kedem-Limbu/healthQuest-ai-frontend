"use client";

import { useEffect, useState } from "react";
import { ApiError, sendChat, runAgent } from "@/lib/api";
import type { AgentResponse } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Bot, MessageCircleMore, Sparkles, UserRound } from "lucide-react";
import { Card, EmptyState, Panel, SectionHeader } from "@/components/ui";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
  }, [token]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !message.trim()) return;
    setError(null);
    const userMessage = message.trim();
    setMessages((current) => [...current, { role: "user", text: userMessage }]);
    setMessage("");

    try {
      const response = await sendChat(token, userMessage);
      setMessages((current) => [...current, { role: "assistant", text: response.response }]);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError("Unable to send message.");
    }
  };

  const handleRunAgent = async () => {
    if (!token) return;
    setAgentRunning(true);
    setAgentResult(null);
    try {
      const result = await runAgent(token, message || "Check recent vitals and symptoms");
      setAgentResult(result);
      setMessages((current) => [...current, { role: "assistant", text: result.response }]);
    } catch (err) {
      setError("Unable to run agent.");
    } finally {
      setAgentRunning(false);
    }
  };

  if (!token) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel>
        <SectionHeader title="Chat with the coach" subtitle="Messages are sent to the live backend chat endpoint." />
        <form className="mt-4 space-y-4" onSubmit={handleSend}>
          <textarea className="w-full rounded-3xl border border-[var(--panel-border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask for a health habit, routine, or reminder..." />
          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-[var(--text)] px-5 py-3 text-sm font-semibold text-white"> <MessageCircleMore size={16} /> Send</button>
            <button type="button" onClick={handleRunAgent} disabled={agentRunning} className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white">
              <Sparkles size={16} /> {agentRunning ? "Running…" : "Run agent"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text)]">Conversation</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Your recent exchanges and any agent-run summaries.</p>
          </div>
          <div className="rounded-full bg-[var(--accent)]/10 p-2 text-[var(--accent)]"><Bot size={16} /></div>
        </div>
        <div className="mt-4 space-y-3">
          {messages.map((entry, index) => (
            <div key={`${entry.role}-${index}`} className={`flex items-end gap-3 ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
              {entry.role === "assistant" ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Bot size={16} />
                </div>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                  <UserRound size={16} />
                </div>
              )}
              <div className={`max-w-[85%] rounded-[1.4rem] px-4 py-3 text-sm shadow-sm ${entry.role === "user" ? "bg-[var(--text)] text-white" : "bg-[var(--bg-soft)] text-[var(--text)]"}`}>
                {entry.text}
              </div>
            </div>
          ))}
          {messages.length === 0 ? <EmptyState title="Start a conversation" description="Ask your coach for a new habit, symptom summary, or reminder." /> : null}
        </div>
        {agentResult ? (
          <Card className="mt-4 bg-[var(--bg-soft)]">
            <p className="text-sm font-semibold text-[var(--text)]">Agent summary</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{agentResult.response}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Notification created: {agentResult.notification_created ? "Yes" : "No"}</p>
            <div className="mt-3 space-y-2">
              {agentResult.steps.map((s, i) => (
                <div key={i} className="rounded-2xl border border-[var(--panel-border)] bg-white p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                    <p className="font-semibold text-[var(--text)]">{i + 1}. {s.tool}</p>
                  </div>
                  <div className="mt-2 rounded-2xl bg-[var(--bg-soft)] p-3 text-[var(--muted)]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Input</p>
                    <p className="mt-1">{s.input === null ? "—" : typeof s.input === "string" ? s.input : JSON.stringify(s.input)}</p>
                  </div>
                  <div className="mt-2 rounded-2xl bg-[var(--bg-soft)] p-3 text-[var(--muted)]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Output</p>
                    <p className="mt-1">{s.output === null ? "—" : typeof s.output === "string" ? s.output : JSON.stringify(s.output)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </Panel>
    </div>
  );
}
