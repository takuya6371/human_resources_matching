import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SUGGESTIONS = [
  "How does AfriTalent work?",
  "How do I sign up as talent?",
  "Do companies sponsor visas?",
  "What is the Premium plan?",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm AfriTalent Bot 👋 Ask me anything about joining, matching, jobs, or Premium." },
  ]);
  const endRef = useRef(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("askAfriTalent", {
        question: q,
        history: next.slice(-7).map((m) => ({ role: m.role, content: m.content })),
      });
      const answer = res?.data?.answer || res?.answer || "Sorry, I couldn't answer that right now.";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "I'm having trouble connecting right now. Please try again later." }]);
    }
    setBusy(false);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-foreground text-background shadow-lg transition-all duration-300 hover:w-40"
          title="Ask AfriTalent"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-amber-400" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 group-hover:ml-2 group-hover:max-w-[120px]">Ask AfriTalent</span>
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-foreground px-4 py-3 text-background">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-400" /><span className="font-semibold">AfriTalent Bot</span></div>
            <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div className="flex justify-start"><div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">Typing…</div></div>}
            <div ref={endRef} />
          </div>
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent">{s}</button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question…"
              className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm"
            />
            <button onClick={() => send()} disabled={busy} className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}