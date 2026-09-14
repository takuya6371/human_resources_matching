import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Send, Paperclip, Mic, StopCircle, FileText, Trash2, Pencil, Smile, Check, X } from "lucide-react";
import { notify } from "@/lib/notify";

const STICKERS = ["🌍", "🦁", "🐘", "🌅", "🍜", "🍣", "🤝", "💡", "🚀", "🎯", "🏆", "✨", "🎉", "🧡", "💚", "🇯🇵", "🇿🇦", "💪", "🙏", "🌸", "🥁", "🎨", "🧠", "🔥"];

export default function Messages() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [myProfileId, setMyProfileId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activePeer, setActivePeer] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listTab, setListTab] = useState("chats");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const fileRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const scrollRef = useRef(null);

  const load = async (u) => {
    const [rec, sd] = await Promise.all([
      base44.entities.Message.filter({ to_user_id: u.id }, "-created_date", 300),
      base44.entities.Message.filter({ from_user_id: u.id }, "-created_date", 300),
    ]);
    setMessages([...rec, ...sd].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (!u) { navigate("/login"); return; }
      setUser(u);
      if (u.account_type === "talent") { const p = await base44.entities.TalentProfile.filter({ user_id: u.id }); setMyProfileId(p[0]?.id); }
      else if (u.account_type === "company") { const p = await base44.entities.CompanyProfile.filter({ user_id: u.id }); setMyProfileId(p[0]?.id); }
      await load(u);
      const to = params.get("to");
      if (to) setActivePeer({ id: to, name: params.get("name") || to });
    }).catch(() => navigate("/login"));
  }, [navigate]);

  // realtime
  useEffect(() => {
    const unsub = base44.entities.Message.subscribe(() => { if (user) load(user); });
    return () => unsub?.();
  }, [user]);

  const conversations = React.useMemo(() => {
    const map = {};
    messages.filter((m) => m.status !== "declined").forEach((m) => {
      const peerId = m.from_user_id === user?.id ? m.to_user_id : m.from_user_id;
      const peerName = m.from_user_id === user?.id ? m.to_name : m.from_name;
      const isReq = m.to_user_id === user?.id && m.status === "request";
      if (!map[peerId]) map[peerId] = { id: peerId, name: peerName, last: m, unread: 0, ts: m.created_date, request: false };
      if (m.to_user_id === user?.id && !m.read && m.status === "accepted") map[peerId].unread += 1;
      if (isReq) map[peerId].request = true;
      if (new Date(m.created_date) > new Date(map[peerId].ts)) { map[peerId].last = m; map[peerId].ts = m.created_date; }
    });
    return Object.values(map).sort((a, b) => new Date(b.ts) - new Date(a.ts));
  }, [messages, user]);

  const requests = conversations.filter((c) => c.request);
  const chats = conversations.filter((c) => !c.request);

  const thread = activePeer ? messages.filter((m) => (m.from_user_id === activePeer.id || m.to_user_id === activePeer.id) && m.status !== "declined").sort((a, b) => new Date(a.created_date) - new Date(b.created_date)) : [];
  const myPendingRequest = activePeer ? messages.some((m) => m.from_user_id === user?.id && m.to_user_id === activePeer.id && m.status === "request") : false;

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [thread.length, activePeer?.id]);

  const openPeer = async (peer) => {
    setActivePeer(peer);
    setParams(peer ? { to: peer.id, name: peer.name } : {});
    const unread = messages.filter((m) => m.from_user_id === peer.id && m.to_user_id === user.id && !m.read && m.status === "accepted");
    if (unread.length) { await base44.entities.Message.bulkUpdate(unread.map((m) => ({ id: m.id, read: true }))); load(user); }
  };

  const send = async (body, attachment = {}) => {
    if (!activePeer) return;
    if (!body && !attachment.attachment_url) return;
    if (myPendingRequest) return;
    setSending(true);
    try {
      const hasAccepted = messages.some((m) => (m.from_user_id === activePeer.id || m.to_user_id === activePeer.id) && m.status === "accepted");
      let status = "accepted";
      if (!hasAccepted && myProfileId) {
        const f = await base44.entities.Follow.filter({ follower_id: activePeer.id, target_id: myProfileId });
        status = f.length > 0 ? "accepted" : "request";
      }
      await base44.entities.Message.create({
        from_user_id: user.id, from_name: user.full_name || user.email,
        to_user_id: activePeer.id, to_name: activePeer.name, subject: "", body: body || "", read: false,
        attachment_url: attachment.attachment_url || "", attachment_type: attachment.attachment_type || "", attachment_name: attachment.attachment_name || "",
        status,
      });
      if (status === "accepted") notify({ userId: activePeer.id, actorId: user.id, actorName: user.full_name, actorType: user.account_type, type: "message", title: `${user.full_name} sent you a message`, body: body || "📎 Attachment" });
      setText("");
      setShowStickers(false);
      load(user);
    } catch (e) { alert("Could not send: " + (e?.message || "")); }
    setSending(false);
  };

  const del = async (m) => { await base44.entities.Message.delete(m.id); load(user); };
  const saveEdit = async (m) => { if (!editText.trim()) return; await base44.entities.Message.update(m.id, { body: editText.trim(), edited: true }); setEditingId(null); load(user); };

  const acceptRequest = async (peer) => {
    const msgs = messages.filter((m) => m.from_user_id === peer.id && m.to_user_id === user.id && m.status === "request");
    await base44.entities.Message.bulkUpdate(msgs.map((m) => ({ id: m.id, status: "accepted" })));
    load(user);
  };
  const declineRequest = async (peer) => {
    const msgs = messages.filter((m) => m.from_user_id === peer.id && m.to_user_id === user.id && m.status === "request");
    await base44.entities.Message.deleteMany({ from_user_id: peer.id, to_user_id: user.id, status: "request" });
    load(user);
  };

  const attach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("File must be under 10MB."); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const type = file.type.startsWith("image/") ? "image" : "file";
      await send("", { attachment_url: file_url, attachment_type: type, attachment_name: file.name });
    } catch (err) { alert("Upload failed: " + (err?.message || "")); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setUploading(true);
        try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); await send("", { attachment_url: file_url, attachment_type: "voice", attachment_name: "Voice note" }); } catch (err) { alert("Upload failed"); }
        setUploading(false);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { alert("Microphone access denied."); }
  };
  const stopRec = () => { if (mediaRef.current) { mediaRef.current.stop(); setRecording(false); } };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  const isSticker = (b) => b && b.length <= 2 && !b.includes(" ");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-4 font-display text-2xl font-bold tracking-tight">Messages</h1>
      <div className="grid h-[72vh] gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {/* conversation list */}
        <div className="flex min-h-0 flex-col bg-card md:col-span-1">
          <div className="flex gap-1 border-b border-border p-2">
            <button onClick={() => setListTab("chats")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${listTab === "chats" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"}`}>Chats</button>
            <button onClick={() => setListTab("requests")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${listTab === "requests" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"}`}>Requests{requests.length > 0 && <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{requests.length}</span>}</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {(listTab === "chats" ? chats : requests).length === 0 ? <p className="p-4 text-sm text-muted-foreground">{listTab === "chats" ? "No conversations yet. Message someone from their profile." : "No message requests."}</p> :
              (listTab === "chats" ? chats : requests).map((c) => (
                <button key={c.id} onClick={() => openPeer(c)} className={`flex w-full items-center gap-3 border-b border-border p-3 text-left hover:bg-accent ${activePeer?.id === c.id ? "bg-accent" : ""}`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 font-bold">{(c.name || "?").charAt(0)}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{c.name}</p><p className="truncate text-xs text-muted-foreground">{c.last?.body || (c.last?.attachment_type === "voice" ? "🎤 Voice note" : c.last?.attachment_type ? "📎 Attachment" : "")}</p></div>
                  {c.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{c.unread}</span>}
                </button>
              ))}
          </div>
        </div>

        {/* thread */}
        <div className="flex min-h-0 flex-col bg-card md:col-span-2">
          {activePeer ? (
            <>
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 font-bold">{(activePeer.name || "?").charAt(0)}</div><p className="font-medium">{activePeer.name}</p></div>
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {thread.map((m) => {
                  const mine = m.from_user_id === user.id;
                  const sticker = isSticker(m.body) && !m.attachment_url;
                  return (
                    <div key={m.id} className={`group relative flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-amber-600 text-white" : "bg-muted text-foreground"}`}>
                        {m.attachment_type === "image" && m.attachment_url && <img src={m.attachment_url} alt="" className="mb-1 max-h-48 rounded-lg" />}
                        {m.attachment_type === "voice" && m.attachment_url && <audio src={m.attachment_url} controls className="mb-1 max-w-[220px]" />}
                        {m.attachment_type === "file" && m.attachment_url && <a href={m.attachment_url} target="_blank" rel="noreferrer" className="mb-1 flex items-center gap-1 underline"><FileText className="h-4 w-4" /> {m.attachment_name || "File"}</a>}
                        {editingId === m.id ? (
                          <div className="flex items-center gap-1">
                            <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit(m)} className="h-8 w-full rounded border border-black/20 bg-white px-2 text-sm text-black" />
                            <button onClick={() => saveEdit(m)} className="text-xs"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-xs"><X className="h-4 w-4" /></button>
                          </div>
                        ) : sticker ? (
                          <p className="text-4xl leading-none">{m.body}</p>
                        ) : (
                          m.body && <p className="whitespace-pre-wrap">{m.body}</p>
                        )}
                        {m.edited && editingId !== m.id && <p className="text-[10px] opacity-60">edited</p>}
                        <p className={`mt-0.5 text-[10px] ${mine ? "text-white/60" : "text-muted-foreground"}`}>{new Date(m.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      {mine && editingId !== m.id && (
                        <div className="absolute right-0 top-0 hidden -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm group-hover:flex">
                          <button onClick={() => { setEditingId(m.id); setEditText(m.body); }} className="rounded p-1 hover:bg-accent" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => del(m)} className="rounded p-1 hover:bg-accent" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {myPendingRequest ? (
                <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">⏳ Waiting for {activePeer.name} to accept your message request.</div>
              ) : (
                <>
                  {showStickers && (
                    <div className="grid grid-cols-8 gap-1 border-t border-border bg-muted/40 p-2">
                      {STICKERS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-lg p-1.5 text-2xl hover:bg-accent">{s}</button>)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 border-t border-border p-3">
                    <input ref={fileRef} type="file" className="hidden" onChange={attach} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent" title="Attach"><Paperclip className="h-5 w-5 text-muted-foreground" /></button>
                    <button onClick={() => setShowStickers((s) => !s)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent" title="Stickers"><Smile className="h-5 w-5 text-muted-foreground" /></button>
                    {recording ? (
                      <button onClick={stopRec} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-rose-500 text-white"><StopCircle className="h-5 w-5" /> Stop &amp; send</button>
                    ) : (
                      <>
                        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} placeholder="Type a message…" className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm" />
                        <button onClick={startRec} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent" title="Voice note"><Mic className="h-5 w-5 text-muted-foreground" /></button>
                        <button onClick={() => send(text)} disabled={sending || (!text.trim())} className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white disabled:opacity-50"><Send className="h-5 w-5" /></button>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          ) : listTab === "requests" && requests.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 font-bold">{(r.name || "?").charAt(0)}</div><div><p className="text-sm font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.last?.body || "📎 Attachment"}</p></div></div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => acceptRequest(r)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-600 px-4 text-sm font-medium text-white"><Check className="h-4 w-4" /> Accept</button>
                    <button onClick={() => declineRequest(r)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium hover:bg-accent"><X className="h-4 w-4" /> Decline</button>
                    <button onClick={() => openPeer(r)} className="ml-auto text-sm text-muted-foreground hover:underline">View</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground"><p className="text-sm">Select a conversation or message someone from their profile.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}