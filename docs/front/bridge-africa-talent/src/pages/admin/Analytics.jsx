import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const STAGES = ["applied", "shortlisted", "interview", "offer", "hired", "rejected"];

export default function Analytics() {
  const [apps, setApps] = useState([]);
  const [talents, setTalents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, t, c, j] = await Promise.all([
        base44.entities.Application.list("-created_date", 500),
        base44.entities.TalentProfile.list("-created_date", 500),
        base44.entities.CompanyProfile.list("-created_date", 500),
        base44.entities.Job.list("-created_date", 500),
      ]);
      setApps(a); setTalents(t); setCompanies(c); setJobs(j);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  const stageCounts = STAGES.map((s) => ({ stage: s, count: apps.filter((a) => a.status === s).length }));
  const hired = apps.filter((a) => a.status === "hired").length;
  const placementRate = apps.length ? Math.round((hired / apps.length) * 100) : 0;
  const interviewRate = apps.length ? Math.round((apps.filter((a) => a.status === "interview").length / apps.length) * 100) : 0;
  const offerRate = apps.length ? Math.round((apps.filter((a) => a.status === "offer").length / apps.length) * 100) : 0;

  // Time-to-hire: days between application created_date and... we only have created_date, so approximate using job created_date vs app created_date
  const hiredApps = apps.filter((a) => a.status === "hired");
  let avgDays = null;
  if (hiredApps.length) {
    const days = hiredApps.map((a) => {
      const job = jobs.find((j) => j.id === a.job_id);
      if (!job) return null;
      const diff = (new Date(a.created_date) - new Date(job.created_date)) / 86400000;
      return diff > 0 ? diff : null;
    }).filter((d) => d !== null);
    if (days.length) avgDays = Math.round(days.reduce((s, d) => s + d, 0) / days.length);
  }

  // Top companies by applications
  const byCompany = {};
  apps.forEach((a) => { byCompany[a.company_name] = (byCompany[a.company_name] || 0) + 1; });
  const topCompanies = Object.entries(byCompany).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  // Signups last 30 days (talent + company)
  const cutoff = Date.now() - 30 * 86400000;
  const recentTalents = talents.filter((t) => new Date(t.created_date).getTime() > cutoff).length;
  const recentCompanies = companies.filter((c) => new Date(c.created_date).getTime() > cutoff).length;

  const metrics = [
    { label: "Placement rate", value: `${placementRate}%`, sub: `${hired} hired` },
    { label: "Interview rate", value: `${interviewRate}%`, sub: `${apps.filter((a) => a.status === "interview").length} interviewing` },
    { label: "Offer rate", value: `${offerRate}%`, sub: `${apps.filter((a) => a.status === "offer").length} offers` },
    { label: "Avg time-to-hire", value: avgDays !== null ? `${avgDays}d` : "—", sub: "from job posted" },
  ];

  return (
    <div className="px-6 py-8 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">Analytics & reporting</h1>
      <p className="mt-1 text-sm text-muted-foreground">Platform funnel, placement, and engagement metrics.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-3xl font-bold">{m.value}</p>
            <p className="text-sm font-medium">{m.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Application funnel</h2>
          <p className="text-sm text-muted-foreground">Candidates by pipeline stage</p>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Top companies by applications</h2>
          <p className="text-sm text-muted-foreground">Most active hiring partners</p>
          <div className="mt-6 h-64">
            {topCompanies.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No applications yet.</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCompanies} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={100} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill="hsl(24 87% 67%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold">Engagement (last 30 days)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Metric label="New talent signups" value={recentTalents} />
          <Metric label="New company signups" value={recentCompanies} />
          <Metric label="Total talent" value={talents.length} />
          <Metric label="Total companies" value={companies.length} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div><p className="font-display text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}