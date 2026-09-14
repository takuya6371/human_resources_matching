import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bell, CheckCheck, UserPlus, Heart, MessageCircle, AtSign, Mail, Briefcase, Lightbulb, Trophy, Crown, Sparkles, Megaphone, Handshake } from "lucide-react";

const ICONS = { follow: UserPlus, like: Heart, comment: MessageCircle, reply: MessageCircle, mention: AtSign, message: Mail, application: Briefcase, opportunity: Briefcase, match: Handshake, challenge: Lightbulb, prize: Trophy, subscription: Crown, platform: Megaphone, idea: Sparkles };

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const u = await base44.auth.me();
      const n = await base44.entities.Notification.filter({ user_id: u.id }, "-created_date", 100);
      setItems(n);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markAll = async () => {
    const unread = items.filter((n) => !n.read);
    if (unread.length === 0) return;
    await base44.entities.Notification.bulkUpdate(unread.map((n) => ({ id: n.id, read: true })));
    load();
  };

  const open = async (n) => {
    if (!n.read) { try { await base44.entities.Notification.update(n.id, { read: true }); } catch {} load(); }
  };

  const linkFor = (n) => {
    if (n.target_type === "post" && n.target_id) return `/connect?post=${n.target_id}`;
    if (n.target_type === "challenge" && n.target_id) return `/challenges/${n.target_id}`;
    if (n.target_type === "job" && n.target_id) return `/jobs?id=${n.target_id}`;
    if (n.target_type === "talent" && n.target_id) return `/talent/${n.target_id}`;
    if (n.target_type === "company" && n.target_id) return `/company/${n.target_id}`;
    if (n.type === "message") return "/messages";
    if (n.type === "application" || n.type === "match") return "/talent/dashboard";
    return null;
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</h1>
        <button onClick={markAll} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><CheckCheck className="h-4 w-4" /> Mark all read</button>
      </div>

      {loading ? <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div> : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center"><Bell className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">You're all caught up.</p></div>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            const to = linkFor(n);
            const Inner = (
              <div className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${n.read ? "border-border bg-card" : "border-amber-200 bg-amber-50/40"}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_date).toLocaleString()}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />}
              </div>
            );
            return to ? <Link key={n.id} to={to} onClick={() => open(n)} className="block">{Inner}</Link> : <div key={n.id} onClick={() => open(n)} className="cursor-pointer">{Inner}</div>;
          })}
        </div>
      )}
    </div>
  );
}