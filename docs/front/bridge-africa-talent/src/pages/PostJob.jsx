import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function PostJob() {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", requirements: "", industry: "", location: "",
    remote_type: "hybrid", language_requirements: "", jlpt_required: "none",
    visa_sponsorship: false, salary_range: "",
  });

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (u.account_type !== "company") { navigate("/get-started"); return; }
      const companies = await base44.entities.CompanyProfile.filter({ user_id: u.id });
      if (!companies[0] || !companies[0].profile_completed) { navigate("/company/onboarding"); return; }
      setCompany(companies[0]);
      setForm((f) => ({ ...f, industry: companies[0].industry || "", visa_sponsorship: companies[0].visa_sponsorship || false, location: companies[0].location || "" }));
    }).catch(() => navigate("/get-started"));
  }, [navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Job.create({
        ...form,
        company_id: company.id,
        company_name: company.company_name,
        status: company.status === "approved" ? "pending" : "pending",
      });
      navigate("/company/dashboard");
    } catch (err) {
      alert("Could not post job: " + (err?.message || ""));
    }
    setSaving(false);
  };

  const input = "h-11 w-full rounded-lg border border-input bg-background px-3";
  const label = "text-sm font-medium";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Post a job</h1>
      <p className="mt-2 text-muted-foreground">New postings are reviewed before going live.</p>

      <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="grid gap-5">
          <div className="grid gap-2"><label className={label}>Job title</label><input required className={input} value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="grid gap-2"><label className={label}>Description</label><textarea required rows={4} className="w-full rounded-lg border border-input bg-background px-3 py-2" value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid gap-2"><label className={label}>Requirements</label><textarea rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2" value={form.requirements} onChange={(e) => set("requirements", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><label className={label}>Industry</label><input className={input} value={form.industry} onChange={(e) => set("industry", e.target.value)} /></div>
            <div className="grid gap-2"><label className={label}>Location</label><input className={input} value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><label className={label}>Work type</label><select className={input} value={form.remote_type} onChange={(e) => set("remote_type", e.target.value)}>{["onsite", "remote", "hybrid"].map((o) => <option key={o}>{o}</option>)}</select></div>
            <div className="grid gap-2"><label className={label}>JLPT required</label><select className={input} value={form.jlpt_required} onChange={(e) => set("jlpt_required", e.target.value)}>{["none", "N5", "N4", "N3", "N2", "N1"].map((o) => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="grid gap-2"><label className={label}>Language requirements</label><input className={input} value={form.language_requirements} onChange={(e) => set("language_requirements", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><label className={label}>Salary range</label><input className={input} placeholder="¥5M–¥7M" value={form.salary_range} onChange={(e) => set("salary_range", e.target.value)} /></div>
            <div className="grid gap-2"><label className={label}>Visa sponsorship</label><select className={input} value={form.visa_sponsorship ? "yes" : "no"} onChange={(e) => set("visa_sponsorship", e.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select></div>
          </div>
          <button disabled={saving} className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50">{saving ? "Posting..." : "Submit for review"}</button>
        </div>
      </form>
    </div>
  );
}