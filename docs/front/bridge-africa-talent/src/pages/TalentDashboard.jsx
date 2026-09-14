import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Briefcase, FileText, MessageSquare, Clock, CheckCircle2, XCircle, Search, ArrowRight, UserCircle, Crown, Award, Sparkles } from "lucide-react";
import { isPremium, getApplicationsThisMonth, FREE_MONTHLY_APPLICATIONS } from "@/lib/subscription";
import CreditEarning from "@/components/CreditEarning";

const STATUS_STYLE = {
  applied: "bg-blue-50 text-blue-700",
  shortlisted: "bg-purple-50 text-purple-700",
  interview: "bg-amber-50 text-amber-700",
  offer: "bg-green-50 text-green-700",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-50 text-red-700",
};

export default function TalentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const [mutualMatches, setMutualMatches] = useState([]);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u.account_type !== "talent") { navigate("/get-started"); return; }
      const profiles = await base44.entities.TalentProfile.filter({ user_id: u.id });
      if (!profiles[0] || !profiles[0].profile_completed) { navigate("/talent/onboarding"); return; }
      setProfile(profiles[0]);
      const apps = await base44.entities.Application.filter({ talent_id: profiles[0].id }, "-created_date", 50);
      setApplications(apps);
      getApplicationsThisMonth(profiles[0].id).then(setUsedThisMonth);
      const msgs = await base44.entities.Message.filter({ to_user_id: u.id }, "-created_date", 5);
      setMessages(msgs);
      const [mine, rev] = await Promise.all([
        base44.entities.Interest.filter({ from_user_id: u.id, from_type: "talent" }, "-created_date", 100),
        base44.entities.Interest.filter({ to_user_id: u.id, to_type: "talent" }, "-created_date", 100),
      ]);
      const mineSet = new Set(mine.map((i) => i.to_user_id));
      setMutualMatches(rev.filter((r) => mineSet.has(r.from_user_id)));
      setLoading(false);
    }).catch(() => navigate("/get-started"));
  }, [navigate]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  const pending = profile?.status === "pending";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome, {profile?.full_name?.split(" ")[0]}</h1>
          <p className="mt-1 text-muted-foreground">Manage your applications and matches.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/talent/profile" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"><UserCircle className="h-4 w-4" /> My profile</Link>
          <Link to="/jobs" className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background"><Search className="h-4 w-4" /> Browse jobs</Link>
          <Link to="/assessments" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"><Award className="h-4 w-4" /> Skill tests</Link>
          <Link to="/matches" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"><Sparkles className="h-4 w-4" /> My matches</Link>
        </div>
      </div>

      {pending && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Clock className="h-5 w-5 text-amber-700" />
          <p className="text-sm text-amber-800">Your profile is under review. You can browse jobs, and full matching unlocks once approved.</p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Crown className={`h-5 w-5 ${isPremium(profile) ? "text-amber-500" : "text-muted-foreground"}`} />
        <div className="flex-1">
          <p className="text-sm font-medium">{isPremium(profile) ? "Premium plan" : "Free plan"}</p>
          <p className="text-xs text-muted-foreground">
            {isPremium(profile) ? "Unlimited applications" : `${Math.max(0, FREE_MONTHLY_APPLICATIONS - usedThisMonth + (profile?.credits || 0))} of ${FREE_MONTHLY_APPLICATIONS + (profile?.credits || 0)} applications left this month`}
          </p>
        </div>
        <Link to="/talent/profile" className="text-xs font-medium underline">{isPremium(profile) ? "Manage" : "Upgrade"}</Link>
      </div>

      {mutualMatches.length > 0 && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50/60 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-green-800"><Sparkles className="h-4 w-4" /> Mutual matches ({mutualMatches.length})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mutualMatches.map((m) => <span key={m.id} className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-medium text-green-800">{m.from_name}</span>)}
          </div>
          <Link to="/matches" className="mt-2 inline-flex text-xs font-medium text-green-700 underline">View all matches</Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: FileText, label: "Applications", value: applications.length },
          { icon: Briefcase, label: "Active interviews", value: applications.filter((a) => a.status === "interview").length },
          { icon: CheckCircle2, label: "Offers", value: applications.filter((a) => a.status === "offer" || a.status === "hired").length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Application tracker</h2>
          {applications.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No applications yet.</p>
              <Link to="/jobs" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background">Find roles <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {applications.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                  <div>
                    <p className="font-medium">{a.job_title}</p>
                    <p className="text-sm text-muted-foreground">{a.company_name}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl font-bold">Recent messages</h2>
          {messages.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm font-medium">{m.subject}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">From {m.from_name}</p>
                </div>
              ))}
            </div>
          )}
          <Link to="/messages" className="mt-4 inline-flex items-center gap-1 text-sm font-medium"><MessageSquare className="h-4 w-4" /> Open inbox</Link>
          <div className="mt-6"><CreditEarning profile={profile} /></div>
        </div>
      </div>
    </div>
  );
}