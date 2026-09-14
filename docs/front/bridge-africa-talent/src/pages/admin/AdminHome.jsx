import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, Building2, Briefcase, FileText, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [talents, companies, jobs, apps] = await Promise.all([
          base44.entities.TalentProfile.list("-created_date", 200),
          base44.entities.CompanyProfile.list("-created_date", 200),
          base44.entities.Job.list("-created_date", 200),
          base44.entities.Application.list("-created_date", 200),
        ]);
        setStats({
          talents: talents.length,
          pendingTalents: talents.filter((t) => t.status === "pending").length,
          approvedTalents: talents.filter((t) => t.status === "approved").length,
          companies: companies.length,
          pendingCompanies: companies.filter((c) => c.status === "pending").length,
          approvedCompanies: companies.filter((c) => c.status === "approved").length,
          jobs: jobs.length,
          activeJobs: jobs.filter((j) => j.status === "active").length,
          pendingJobs: jobs.filter((j) => j.status === "pending").length,
          applications: apps.length,
          hired: apps.filter((a) => a.status === "hired").length,
          interviews: apps.filter((a) => a.status === "interview").length,
          offers: apps.filter((a) => a.status === "offer").length,
        });
        setRecent([...talents.slice(0, 3), ...companies.slice(0, 2)].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6));
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  const cards = [
    { icon: Users, label: "Talent", total: stats.talents, sub: `${stats.pendingTalents} pending review`, link: "/admin/talents", color: "text-amber-700 bg-amber-50" },
    { icon: Building2, label: "Companies", total: stats.companies, sub: `${stats.pendingCompanies} pending review`, link: "/admin/companies", color: "text-blue-700 bg-blue-50" },
    { icon: Briefcase, label: "Jobs", total: stats.jobs, sub: `${stats.pendingJobs} pending moderation`, link: "/admin/jobs", color: "text-purple-700 bg-purple-50" },
    { icon: FileText, label: "Applications", total: stats.applications, sub: `${stats.hired} hired · ${stats.interviews} interviewing`, link: "/admin/analytics", color: "text-green-700 bg-green-50" },
  ];

  return (
    <div className="px-6 py-8 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">Platform overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">AfriTalent admin console</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.link} className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.color}`}><c.icon className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-3xl font-bold">{c.total}</p>
            <p className="text-sm font-medium">{c.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">Manage <ArrowRight className="h-3 w-3" /></span>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Review queue summary</h2>
          <div className="mt-4 space-y-3">
            <QueueRow icon={Users} label="Pending talent profiles" count={stats.pendingTalents} link="/admin/talents" />
            <QueueRow icon={Building2} label="Pending company verifications" count={stats.pendingCompanies} link="/admin/companies" />
            <QueueRow icon={Briefcase} label="Pending job postings" count={stats.pendingJobs} link="/admin/jobs" />
          </div>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          <div className="mt-4 space-y-3">
            {recent.length === 0 ? <p className="text-sm text-muted-foreground">No recent signups.</p> : recent.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm font-medium">{r.full_name || r.company_name}</p>
                <p className="text-xs text-muted-foreground">{r.email} · {r.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueRow({ icon: Icon, label, count, link }) {
  return (
    <Link to={link} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-foreground/20">
      <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium">{label}</span></div>
      <div className="flex items-center gap-3">
        {count > 0 ? <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"><Clock className="h-3 w-3" /> {count} waiting</span> : <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"><CheckCircle2 className="h-3 w-3" /> All clear</span>}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}