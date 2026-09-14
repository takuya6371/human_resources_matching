import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import AuthPrompt from "@/components/AuthPrompt";

export default function SaveButton({ itemType, item, small }) {
  const [authed, setAuthed] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setSavedId(null);
    base44.auth.isAuthenticated().then(async (a) => {
      if (!alive) return;
      setAuthed(a);
      if (!a) return;
      try {
        const u = await base44.auth.me();
        const s = await base44.entities.SavedItem.filter({ user_id: u.id, item_type: itemType, item_id: item.id });
        if (alive && s[0]) setSavedId(s[0].id);
      } catch {}
    });
    return () => { alive = false; };
  }, [itemType, item.id]);

  const toggle = async () => {
    if (authed === null) return;
    if (!authed) { setAuthOpen(true); return; }
    setBusy(true);
    try {
      const u = await base44.auth.me();
      if (savedId) {
        await base44.entities.SavedItem.delete(savedId);
        setSavedId(null);
      } else {
        const title = item.title || item.full_name || item.company_name || "Saved item";
        const image = item.image_url || item.photo_url || item.logo_url || item.company_logo || "";
        const meta = item.company_name || item.location || item.industry || "";
        const created = await base44.entities.SavedItem.create({ user_id: u.id, item_type: itemType, item_id: item.id, item_title: title, item_image: image, item_meta: meta });
        setSavedId(created.id);
      }
    } catch (e) { alert("Could not save: " + (e?.message || "")); }
    setBusy(false);
  };

  const base = small ? "h-8 w-8" : "h-10 w-10";
  return (
    <>
      <button onClick={toggle} disabled={busy || authed === null} aria-label="Save" className={`inline-flex ${base} items-center justify-center rounded-full border border-border hover:bg-accent disabled:opacity-50`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : savedId ? <BookmarkCheck className="h-4 w-4 text-amber-600" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AuthPrompt open={authOpen} onClose={() => setAuthOpen(false)} title="Save items." subtitle="Sign in to save jobs, challenges, posts and profiles." />
    </>
  );
}