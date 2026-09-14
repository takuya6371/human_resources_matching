import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bookmark, Briefcase, Lightbulb, Rss, User, Building2 } from "lucide-react";
import { Image } from "@/components/ui/image";

const GROUPS = [
  { type: "job", label: "Jobs & opportunities", icon: Briefcase, link: (i) => `/jobs?id=${i.item_id}` },
  { type: "challenge", label: "Challenges", icon: Lightbulb, link: (i) => `/challenges/${i.item_id}` },
  { type: "post", label: "Posts", icon: Rss, link: (i) => `/connect?post=${i.item_id}` },
  { type: "talent", label: "Talents", icon: User, link: (i) => `/talent/${i.item_id}` },
  { type: "company", label: "Companies", icon: Building2, link: (i) => `/company/${i.item_id}` },
];

export default function Saved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const u = await base44.auth.me();
      const s = await base44.entities.SavedItem.filter({ user_id: u.id }, "-created_date", 200);
      setItems(s);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => { await base44.entities.SavedItem.delete(id); load(); };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Bookmark className="h-5 w-5" /> Saved</h1>
      <p className="mt-2 text-sm text-muted-foreground">Jobs, challenges, posts and profiles you've saved.</p>

      {loading ? <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div> :
        items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center"><Bookmark className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">Nothing saved yet. Tap the bookmark icon on any job, challenge, post or profile.</p></div>
        ) : (
          <div className="mt-6 space-y-8">
            {GROUPS.map((g) => {
              const list = items.filter((i) => i.item_type === g.type);
              if (list.length === 0) return null;
              return (
                <div key={g.type}>
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground"><g.icon className="h-4 w-4" /> {g.label} <span className="text-xs">({list.length})</span></h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {list.map((i) => (
                      <div key={i.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                        {i.item_image ? <Image src={i.item_image} alt="" className="h-10 w-10 shrink-0 rounded-full" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted"><g.icon className="h-5 w-5 text-muted-foreground" /></div>}
                        <Link to={g.link(i)} className="min-w-0 flex-1"><p className="truncate text-sm font-medium hover:underline">{i.item_title}</p>{i.item_meta && <p className="truncate text-xs text-muted-foreground">{i.item_meta}</p>}</Link>
                        <button onClick={() => remove(i.id)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}