import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Link2, Check } from "lucide-react";

const JLPT_ORDER = { none: 0, N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };

function scoreMatch(job, talent) {
  const parts = [];
  let raw = 0;

  // Industry (max 22)
  if (job.industry && talent.industry) {
    const ji = job.industry.toLowerCase();
    const ti = talent.industry.toLowerCase();
    if (ji === ti) { raw += 22; parts.push({ label: "Industry match", w: 22 }); }
    else if (ji.includes(ti) || ti.includes(ji)) { raw += 14; parts.push({ label: "Related industry", w: 14 }); }
  }

  // Skills overlap with requirements + title (max 30)
  if (talent.skills) {
    const reqText = `${job.requirements || ""} ${job.title || ""}`.toLowerCase();
    const reqTokens = reqText.split(/[^a-z0-9+#.]+/).filter((t) => t.length > 2);
    const talentSkills = talent.skills.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
    const overlap = talentSkills.filter((s) => reqTokens.some((t) => t === s || t.includes(s) || s.includes(t)));
    if (overlap.length) {
      const w = Math.min(overlap.length * 6, 30);
      raw += w;
      parts.push({ label: `${overlap.length} matching skill${overlap.length > 1 ? "s" : ""}`, w });
    }
  }

  // JLPT (max 15)
  if (job.jlpt_required && job.jlpt_required !== "none") {
    const req = JLPT_ORDER[job.jlpt_required] || 0;
    const have = JLPT_ORDER[talent.jlpt_level] || 0;
    if (have >= req) { raw += 15; parts.push({ label: `Meets JLPT ${job.jlpt_required}`, w: 15 }); }
    else { raw += Math.round((have / req) * 8); parts.push({ label: `Below JLPT ${job.jlpt_required}`, w: Math.round((have / req) * 8) }); }
  } else { raw += 8; parts.push({ label: "No JLPT required", w: 8 }); }

  // English (max 5)
  const engRank = { basic: 1, conversational: 2, fluent: 3, native: 4 };
  if ((engRank[talent.english_level] || 0) >= 3) { raw += 5; parts.push({ label: "Fluent English", w: 5 }); }

  // Visa (max 12)
  if (talent.visa_status === "has_work_rights" || talent.visa_status === "citizen") { raw += 12; parts.push({ label: "Has work rights", w: 12 }); }
  else if (job.visa_sponsorship && (talent.visa_status === "needs_sponsorship" || talent.visa_status === "student")) { raw += 10; parts.push({ label: "Visa sponsorship offered", w: 10 }); }

  // Remote / relocate (max 10)
  if (job.remote_type === "remote" && talent.remote_willing) { raw += 10; parts.push({ label: "Open to remote", w: 10 }); }
  else if (job.remote_type !== "remote" && talent.relocate_willing) { raw += 8; parts.push({ label: "Willing to relocate", w: 8 }); }

  // Experience (max 6)
  const yrs = Number(talent.years_experience) || 0;
  if (yrs >= 5) { raw += 6; parts.push({ label: `${yrs}+ yrs experience`, w: 6 }); }
  else if (yrs >= 2) { raw += 3; parts.push({ label: `${yrs} yrs experience`, w: 3 }); }

  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return { score, parts };
}

export default function MatchingConsole() {
  const [jobs, setJobs] = useState([]);
  const [talents, setTalents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(null);
  const [aiLoading, setAiLoading] = useState(null);
  const [insights, setInsights] = useState({});

  useEffect(() => {
    (async () => {
      const [j, t, a] = await Promise.all([
        base44.entities.Job.filter({ status: "active" }, "-created_date", 200),
        base44.entities.TalentProfile.filter({ status: "approved" }, "-created_date", 200),
        base44.entities.Application.list("-created_date", 200),
      ]);
      setJobs(j); setTalents(t); setApplications(a);
      if (j[0]) setSelectedJobId(j[0].id);
      setLoading(false);
    })();
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const ranked = useMemo(() => {
    if (!selectedJob) return [];
    return talents.map((t) => ({ talent: t, ...scoreMatch(selectedJob, t) })).sort((a, b) => b.score - a.score);
  }, [selectedJob, talents]);

  const jobMatches = applications.filter((a) => a.job_id === selectedJobId);
  const strong = ranked.filter((r) => r.score >= 70).length;
  const good = ranked.filter((r) => r.score >= 40 && r.score < 70).length;
  const weak = ranked.filter((r) => r.score < 40).length;
  const avg = ranked.length ? Math.round(ranked.reduce((s, r) => s + r.score, 0) / ranked.length) : 0;

  const createMatch = async (talent) => {
    setMatching(talent.id);
    try {
      await base44.entities.Application.create({
        talent_id: talent.id, talent_name: talent.full_name, job_id: selectedJob.id, job_title: selectedJob.title,
        company_id: selectedJob.company_id, company_name: selectedJob.company_name, cover_letter: "Curated match by AfriTalent team", status: "shortlisted",
      });
      setApplications(await base44.entities.Application.list("-created_date", 200));
    } catch (e) { alert("Could not create match: " + (e?.message || "")); }
    setMatching(null);
  };

  const getInsight = async (talent) => {
    setAiLoading(talent.id);
    try {
      const res = await base44.functions.invoke("aiMatchInsight", { job: selectedJob, talent });
      setInsights((s) => ({ ...s, [talent.id]: res?.data?.insight || res?.insight || "—" }));
    } catch (e) { setInsights((s) => ({ ...s, [talent.id]: "Could not generate insight." })); }
    setAiLoading(null);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  const tier = (s) => s >= 70 ? { c: "bg-green-500", t: "text-green-700", b: "bg-green-500", l: "Strong" } : s >= 40 ? { c: "bg-amber-500", t: "text-amber-700", b: "bg-amber-500", l: "Possible" } : { c: "bg-muted-foreground", t: "text-muted-foreground", b: "bg-muted-foreground", l: "Weak" };

  return (
    <div className="px-6 py-8 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">Matching console</h1>
      <p className="mt-1 text-sm text-muted-foreground">Curate matches between active jobs and approved talent — ranked by profile fit.</p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Select a job</label>
        <select value={selectedJobId || ""} onChange={(e) => setSelectedJobId(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
          {jobs.length === 0 && <option>No active jobs</option>}
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} — {j.company_name}</option>)}
        </select>
        {selectedJob && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-muted px-2.5 py-1">{selectedJob.industry}</span>
            <span className="rounded-full bg-muted px-2.5 py-1">{selectedJob.location} · {selectedJob.remote_type}</span>
            {selectedJob.jlpt_required !== "none" && <span className="rounded-full bg-muted px-2.5 py-1">JLPT {selectedJob.jlpt_required}</span>}
            {selectedJob.visa_sponsorship && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">Visa sponsorship</span>}
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{jobMatches.length} match{jobMatches.length !== 1 ? "es" : ""} made</span>
          </div>
        )}
      </div>

      {selectedJob && (
        <div className="mt-6">
          {/* Analytics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Approved talent" value={ranked.length} />
            <Stat label="Avg fit" value={`${avg}%`} color="text-foreground" />
            <Stat label="Strong (≥70%)" value={strong} color="text-green-700" />
            <Stat label="Possible (40–69%)" value={good} color="text-amber-700" />
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-green-500" style={{ width: `${ranked.length ? (strong / ranked.length) * 100 : 0}%` }} />
            <div className="bg-amber-500" style={{ width: `${ranked.length ? (good / ranked.length) * 100 : 0}%` }} />
            <div className="bg-muted-foreground/40" style={{ width: `${ranked.length ? (weak / ranked.length) * 100 : 0}%` }} />
          </div>

          <h2 className="mt-6 font-display text-lg font-bold">Suggested talent</h2>
          {ranked.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No approved talent to match yet. Approve talent profiles first.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {ranked.slice(0, 15).map(({ talent, score, parts }) => {
                const T = tier(score);
                const alreadyMatched = jobMatches.some((m) => m.talent_id === talent.id);
                return (
                  <div key={talent.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
                          <span className="font-display text-sm font-bold">{talent.full_name?.charAt(0)}</span>
                          <span className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${T.c}`}>{score}</span>
                        </div>
                        <div>
                          <p className="font-medium">{talent.full_name}</p>
                          <p className="text-xs text-muted-foreground">{talent.headline || talent.current_role} · {talent.country_of_residence} · JLPT {talent.jlpt_level}</p>
                        </div>
                      </div>
                      {/* percentage bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className={T.t}>{T.l} match</span>
                          <span className={T.t}>{score}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full ${T.b}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                      {parts.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {parts.map((p, i) => <span key={i} className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] text-green-700">{p.label} · +{p.w}</span>)}
                        </div>
                      )}
                      {insights[talent.id] && (
                        <p className="mt-2 rounded-lg bg-blue-50 p-2 text-[11px] text-blue-800"><Sparkles className="mr-1 inline h-3 w-3" />AI: {insights[talent.id]}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <button onClick={() => getInsight(talent)} disabled={aiLoading === talent.id} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-blue-200 px-3 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                        <Sparkles className="h-3.5 w-3.5" /> {aiLoading === talent.id ? "Thinking…" : "AI insight"}
                      </button>
                      {alreadyMatched ? (
                        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-green-50 px-4 text-xs font-medium text-green-700"><Check className="h-4 w-4" /> Matched</span>
                      ) : (
                        <button onClick={() => createMatch(talent)} disabled={matching === talent.id} className="inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-xs font-medium text-background disabled:opacity-50">
                          <Link2 className="h-4 w-4" /> {matching === talent.id ? "Matching..." : "Create match"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {jobMatches.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold">Matches for this job</h2>
          <div className="mt-3 space-y-2">
            {jobMatches.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div><p className="text-sm font-medium">{m.talent_name}</p><p className="text-xs text-muted-foreground">Stage: {m.status}</p></div>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">Curated</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = "text-foreground" }) {
  return <div className="rounded-xl border border-border bg-card p-3"><p className={`font-display text-xl font-bold ${color}`}>{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}