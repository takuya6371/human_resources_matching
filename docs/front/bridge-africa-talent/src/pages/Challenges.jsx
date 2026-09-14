import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Trophy, Clock, Building2, Plus, Loader2, Send, Lightbulb, Rocket } from "lucide-react";
import BoostModal from "@/components/BoostModal";

export default function Challenges() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [f, setF] = useState({ title: "", the_challenge: "", looking_for: "", areas: "", deadline: "", reward_enabled: false, reward_title: "", reward_description: "", reward_types: "", visibility: "public" });
  const [posting, setPosting] = useState(false);
  const [promotedIds, setPromotedIds] = useState(new Set());
  const [boostItem, setBoostItem] = useState(null);

  const load = async () => {
    const [c, prom] = await Promise.all([
      base44.entities.Challenge.filter({ status: "active" }, "-created_date", 100),
      base44.entities.Promotion.filter({ status: "active", item_type: "challenge" }, "-created_date", 100).catch(() => []),
    ]);
    setChallenges(c); setPromotedIds(new Set(prom.map((p) => p.post_id))); setLoading(false);
  };

  useEffect(() => {
    load();
    base44.auth.isAuthenticated().then((a) => { if (a) base44.auth.me().then(async (u) => { setUser(u); if (u.account_type === "company") { const co = await base44.entities.CompanyProfile.filter({ user_id: u.id }); setCompany(co[0] || null); } }).catch(() => {}); });
  }, []);

  const filtered = challenges.filter((c) => !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.areas?.toLowerCase().includes(search.toLowerCase()) || c.the_challenge?.toLowerCase().includes(search.toLowerCase()));

  const create = async () => {
    if (!company || !f.title.trim() || !f.the_challenge.trim()) return;
    setPosting(true);
    try {
      await base44.entities.Challenge.create({
        company_id: company.id, company_name: company.company_name, company_logo: company.logo_url,
        title: f.title.trim(), the_challenge: f.the_challenge.trim(), looking_for: f.looking_for.trim(), areas: f.areas.trim(),
        deadline: f.deadline || null, reward_enabled: f.reward_enabled, reward_title: f.reward_title, reward_description: f.reward_description,
        reward_types: f.reward_types, visibility: f.visibility, status: "active", likes: 0, comments: 0, shares: 0, ideas_count: 0,
      });
      setF({ title: "", the_challenge: "", looking_for: "", areas: "", deadline: "", reward_enabled: false, reward_title: "", reward_description: "", reward_types: "", visibility: "public" });
      setShowComposer(false); await load();
    } catch (e) { alert("Could not create challenge: " + (e?.message || "")); }
    setPosting(false);
  };

  const daysLeft = (d) => { if (!d) return null; return Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000)); };

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-amber-50/60 to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-amber-700"><Lightbulb className="h-5 w-5" /><span className="text-sm font-medium">Innovation challenges</span></div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Solve real problems. Get noticed. 💡</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Companies post challenges and innovation requests. Share your approach in a few sentences — no long proposals. Win rewards, collaborations, and opportunities.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search challenges by title, skill, or area" className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4" /></div>
            {user?.account_type === "company" && company && <button onClick={() => setShowComposer((s) => !s)} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background"><Plus className="h-4 w-4" /> Post a challenge</button>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {showComposer && user?.account_type === "company" && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-base font-bold">New challenge</h3>
            <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Title" className="mt-3 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
            <textarea value={f.the_challenge} onChange={(e) => setF({ ...f, the_challenge: e.target.value })} placeholder="The challenge — describe the problem you want solved" rows={3} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <textarea value={f.looking_for} onChange={(e) => setF({ ...f, looking_for: e.target.value })} placeholder="What are you looking for? (ideas, solutions, approaches…)" rows={2} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input value={f.areas} onChange={(e) => setF({ ...f, areas: e.target.value })} placeholder="Relevant areas / skills (comma-separated)" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
              <input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.reward_enabled} onChange={(e) => setF({ ...f, reward_enabled: e.target.checked })} /> Add a reward or opportunity</label>
            {f.reward_enabled && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input value={f.reward_title} onChange={(e) => setF({ ...f, reward_title: e.target.value })} placeholder="Reward title (e.g. ¥100,000 Cash Prize)" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
                <input value={f.reward_types} onChange={(e) => setF({ ...f, reward_types: e.target.value })} placeholder="Reward types (e.g. Cash, Paid Project, Laptop)" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
                <textarea value={f.reward_description} onChange={(e) => setF({ ...f, reward_description: e.target.value })} placeholder="Reward description — what the winner receives" rows={2} className="sm:col-span-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button onClick={create} disabled={posting || !f.title.trim() || !f.the_challenge.trim()} className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50">{posting ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</> : <><Send className="h-4 w-4" /> Publish challenge</>}</button>
              <button onClick={() => setShowComposer(false)} className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent">Cancel</button>
            </div>
          </div>
        )}

        {loading ? <p className="text-muted-foreground">Loading challenges…</p> : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center"><Lightbulb className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-muted-foreground">No challenges right now. Check back soon!</p></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const dl = daysLeft(c.deadline);
              return (
                <Link key={c.id} to={`/challenges/${c.id}`} className="flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{c.company_logo ? <img src={c.company_logo} alt="" className="h-4 w-4 rounded object-cover" /> : <Building2 className="h-3.5 w-3.5" />}{c.company_name}{promotedIds.has(c.id) && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Promoted</span>}</div>
                  <h3 className="mt-2 flex-1 font-semibold">{c.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.the_challenge}</p>
                  {c.areas && <div className="mt-3 flex flex-wrap gap-1">{c.areas.split(",").map((a, i) => a.trim() && <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{a.trim()}</span>)}</div>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {dl !== null && <span className={dl <= 3 ? "font-medium text-amber-700" : ""}><Clock className="inline h-3 w-3" /> {dl}d left</span>}
                    <span>{c.ideas_count || 0} ideas</span>
                  </div>
                  {c.reward_enabled && c.reward_title && <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"><Trophy className="h-3.5 w-3.5" /> {c.reward_title}</div>}
                  {company && c.company_id === company.id && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBoostItem(c); }} className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-300 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50"><Rocket className="h-3 w-3" /> Boost</button>}
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <BoostModal open={!!boostItem} onClose={() => setBoostItem(null)} post={boostItem} itemType="challenge" user={user} onDone={() => load()} />
    </div>
  );
}