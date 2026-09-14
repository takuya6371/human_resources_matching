import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Search, MessageSquare } from "lucide-react";

const ACTIONS = [
  { key: "shortlisted", label: "Shortlist" },
  { key: "more_details", label: "Request details" },
  { key: "discussion", label: "Start discussion" },
  { key: "finalist", label: "Mark finalist" },
  { key: "winner", label: "Select winner 🏆" },
  { key: "selected_collab", label: "Invite to collaborate" },
];
const STATUS_COLORS = { submitted: "bg-muted text-muted-foreground", under_review: "bg-blue-50 text-blue-700", shortlisted: "bg-amber-50 text-amber-700", interested: "bg-amber-50 text-amber-700", more_details: "bg-purple-50 text-purple-700", discussion: "bg-purple-50 text-purple-700", finalist: "bg-rose-50 text-rose-700", winner: "bg-green-50 text-green-700", selected_collab: "bg-green-50 text-green-700", project_started: "bg-green-50 text-green-700", completed: "bg-muted text-muted-foreground" };

export default function CompanyChallengeManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        if (u.account_type !== "company") { navigate("/get-started"); return; }
        const co = await base44.entities.CompanyProfile.filter({ user_id: u.id });
        if (!co[0]) { navigate("/company/onboarding"); return; }
        const c = await base44.entities.Challenge.get(id);
        if (c.company_id !== co[0].id) { navigate("/company/dashboard"); return; }
        setChallenge(c);
        const ii = await base44.entities.IdeaSubmission.filter({ challenge_id: id }, "-created_date", 200);
        setIdeas(ii);
      } catch (e) {}
      setLoading(false);
    })();
  }, [id, navigate]);

  const setStatus = async (ideaId, status) => {
    setIdeas((arr) => arr.map((x) => x.id === ideaId ? { ...x, status } : x));
    await base44.entities.IdeaSubmission.update(ideaId, { status });
  };

  const filtered = ideas.filter((it) => (filter === "all" || it.status === filter) && (!search || it.talent_name?.toLowerCase().includes(search.toLowerCase()) || it.approach?.toLowerCase().includes(search.toLowerCase())));

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;
  if (!challenge) return <div className="px-6 py-20 text-center text-muted-foreground">Challenge not found.</div>;

  const stats = { total: ideas.length, shortlisted: ideas.filter((i) => i.status === "shortlisted" || i.status === "finalist").length, finalists: ideas.filter((i) => i.status === "finalist").length, winners: ideas.filter((i) => i.status === "winner").length, collab: ideas.filter((i) => i.status === "selected_collab").length };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/challenges" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All challenges</Link>
      <h1 className="font-display text-3xl font-bold tracking-tight">{challenge.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Idea collection dashboard · {ideas.length} submissions</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[{ l: "Total ideas", v: stats.total }, { l: "Shortlisted", v: stats.shortlisted }, { l: "Finalists", v: stats.finalists }, { l: "Winners", v: stats.winners }, { l: "Collaborations", v: stats.collab }].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4"><p className="font-display text-2xl font-bold">{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ideas or talent" className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm" /></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-full border border-input bg-background px-4 text-sm">
          <option value="all">All statuses</option>
          {["submitted", "shortlisted", "more_details", "discussion", "finalist", "winner", "selected_collab"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No ideas match.</p> : filtered.map((it) => (
          <div key={it.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              {it.talent_photo ? <img src={it.talent_photo} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-sm font-bold">{(it.talent_name || "?").charAt(0)}</div>}
              <div className="flex-1">
                <div className="flex items-center gap-2"><p className="font-medium">{it.talent_name}</p><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[it.status] || "bg-muted"}`}>{it.status.replace("_", " ")}</span></div>
                {it.skills && <p className="text-xs text-muted-foreground">{it.skills}</p>}
                <p className="mt-2 text-sm">{it.approach}</p>
                {it.how_it_works && <p className="mt-1 text-sm text-muted-foreground">How: {it.how_it_works}</p>}
                {it.expected_result && <p className="mt-1 text-sm text-muted-foreground">Result: {it.expected_result}</p>}
                {it.supporting_url && <a href={it.supporting_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-amber-700 underline">View supporting material</a>}
                {it.collaboration && <span className="ml-2 inline-block text-xs text-blue-700">🤝 Open to collaboration</span>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ACTIONS.map((a) => (
                <button key={a.key} onClick={() => setStatus(it.id, a.key)} className={`rounded-full px-3 py-1 text-xs font-medium ${it.status === a.key ? "bg-foreground text-background" : "border border-border hover:bg-accent"}`}>{a.label}</button>
              ))}
              <Link to="/messages" className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"><MessageSquare className="h-3 w-3" /> Message</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}