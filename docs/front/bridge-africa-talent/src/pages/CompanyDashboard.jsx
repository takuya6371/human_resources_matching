import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Briefcase, Users, Plus, Clock, ArrowRight, MessageSquare, Building2, Crown, Sparkles, Rocket, Lightbulb } from "lucide-react";
import { isPremium } from "@/lib/subscription";

const STAGE_ORDER = ["applied", "shortlisted", "interview", "offer", "hired", "rejected"];

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [mutualMatches, setMutualMatches] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u.account_type !== "company") { navigate("/get-started"); return; }
      const companies = await base44.entities.CompanyProfile.filter({ user_id: u.id });
      if (!companies[0] || !companies[0].profile_completed) { navigate("/company/onboarding"); return; }
      setCompany(companies[0]);
      const companyJobs = await base44.entities.Job.filter({ company_id: companies[0].id }, "-created_date", 100);
      setJobs(companyJobs);
      const jobIds = companyJobs.map((j) => j.id);
      if (jobIds.length) {
        const allApps = await base44.entities.Application.list("-created_date", 200);
        setApplications(allApps.filter((a) => jobIds.includes(a.job_id)));
      }
      const msgs = await base44.entities.Message.filter({ to_user_id: u.id }, "-created_date", 5);
      setMessages(msgs);
      const [mine, rev] = await Promise.all([
        base44.entities.Interest.filter({ from_user_id: u.id, from_type: "company" }, "-created_date", 100),
        base44.entities.Interest.filter({ to_user_id: u.id, to_type: "company" }, "-created_date", 100),
      ]);
      const mineSet = new Set(mine.map((i) => i.to_user_id));
      setMutualMatches(rev.filter((r) => mineSet.has(r.from_user_id)));
      const [proms, chs] = await Promise.all([
        base44.entities.Promotion.filter({ owner_id: u.id, status: "active" }, "-created_date", 20).catch(() => []),
        base44.entities.Challenge.filter({ company_id: companies[0].id }, "-created_date", 50).catch(() => []),
      ]);
      setPromotions(proms); setChallenges(chs);
      setLoading(false);
    }).catch(() => navigate("/get-started"));
  }, [navigate]);

  const updateStage = async (appId, status) => {
    setApplications((a) => a.map((x) => x.id === appId ? { ...x, status } : x));
    await base44.entities.Application.update(appId, { status });
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  const pending = company?.status === "pending";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{company?.company_name}</h1>
          <p className="mt-1 text-muted-foreground">Manage jobs and your candidate pipeline.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/company/profile" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"><Building2 className="h-4 w-4" /> Company profile</Link>
          <Link to="/challenges" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"><Lightbulb className="h-4 w-4" /> Challenges</Link>
          <Link to="/company/post-job" className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background"><Plus className="h-4 w-4" /> Post a job</Link>
        </div>
      </div>

      {pending && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Clock className="h-5 w-5 text-amber-700" />
          <p className="text-sm text-amber-800">Your company is being verified. Posted jobs will be reviewed before going live.</p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Crown className={`h-5 w-5 ${isPremium(company) ? "text-amber-500" : "text-muted-foreground"}`} />
        <div className="flex-1">
          <p className="text-sm font-medium">{isPremium(company) ? "Premium plan" : "Free plan"}</p>
          <p className="text-xs text-muted-foreground">{isPremium(company) ? "Direct messaging & full talent profiles" : "Mediated introductions — upgrade for direct messaging"}</p>
        </div>
        <Link to="/company/profile" className="text-xs font-medium underline">{isPremium(company) ? "Manage" : "Upgrade"}</Link>
      </div>

      {mutualMatches.length > 0 && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50/60 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-green-800"><Sparkles className="h-4 w-4" /> Mutual matches ({mutualMatches.length})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mutualMatches.map((m) => <span key={m.id} className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-medium text-green-800">{m.from_name}</span>)}
          </div>
        </div>
      )}

      {(challenges.length > 0 || promotions.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><Lightbulb className="h-4 w-4 text-amber-600" /> Your challenges</p>
            <div className="mt-3 space-y-2">
              {challenges.length === 0 ? <p className="text-xs text-muted-foreground">No challenges yet.</p> : challenges.slice(0, 4).map((c) => (
                <Link key={c.id} to={`/company/challenge/${c.id}`} className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-sm hover:bg-muted">
                  <span className="truncate font-medium">{c.title}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">{c.ideas_count || 0} ideas</span>
                </Link>
              ))}
            </div>
            <Link to="/challenges" className="mt-3 inline-flex text-xs font-medium text-amber-700 underline">Post a new challenge</Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><Rocket className="h-4 w-4 text-amber-600" /> Active promotions</p>
            <div className="mt-3 space-y-2">
              {promotions.length === 0 ? <p className="text-xs text-muted-foreground">No active promotions.</p> : promotions.map((p) => (
                <div key={p.id} className="rounded-xl bg-muted/40 p-3 text-sm">
                  <p className="truncate font-medium">{p.post_title} {p.item_type === "challenge" && <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Challenge</span>}</p>
                  <p className="text-xs text-muted-foreground">{p.goal} · ¥{p.total_budget?.toLocaleString()} · {p.duration_days}d</p>
                  <p className="text-xs text-muted-foreground">Reach {p.reach || 0} · Impressions {p.impressions || 0} · Engagement {p.engagement || 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Briefcase, label: "Active jobs", value: jobs.filter((j) => j.status === "active").length },
          { icon: Users, label: "Candidates", value: applications.length },
          { icon: MessageSquare, label: "Unread messages", value: messages.filter((m) => !m.read).length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold">Your job postings</h2>
        {jobs.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No jobs posted yet.</p>
            <Link to="/company/post-job" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background">Post your first job <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {jobs.map((j) => {
              const count = applications.filter((a) => a.job_id === j.id).length;
              return (
                <div key={j.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                  <div>
                    <p className="font-medium">{j.title}</p>
                    <p className="text-sm text-muted-foreground">{j.location || "Japan"} · {j.remote_type} · {count} applicant{count !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${j.status === "active" ? "bg-green-50 text-green-700" : j.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-muted text-muted-foreground"}`}>{j.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {applications.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold">Candidate pipeline</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Candidate</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Stage</th>
                  <th className="py-2 pr-4 font-medium">Move to</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => {
                  const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(a.status) + 1];
                  return (
                    <tr key={a.id} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium">{a.talent_name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{a.job_title}</td>
                      <td className="py-3 pr-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{a.status}</span></td>
                      <td className="py-3 pr-4">
                        {nextStage && nextStage !== "rejected" ? (
                          <button onClick={() => updateStage(a.id, nextStage)} className="text-xs font-medium text-amber-700 hover:underline">→ {nextStage}</button>
                        ) : (
                          <button onClick={() => updateStage(a.id, "rejected")} className="text-xs font-medium text-red-600 hover:underline">Reject</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}