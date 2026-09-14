import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Camera, Save, CheckCircle2, Clock, XCircle } from "lucide-react";
import PlanCard from "@/components/PlanCard";
import { VerifiedTick, PremiumTag } from "@/components/Badges";
import { isPremium } from "@/lib/subscription";

const EMPTY = {
  company_name: "", email: "", industry: "", company_size: "11-50", location: "",
  website: "", description: "", logo_url: "", hiring_roles: "", language_requirements: "",
  visa_sponsorship: false, remote_policy: "hybrid",
};

export default function CompanyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [followers, setFollowers] = useState(0);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (u.account_type !== "company") { navigate("/get-started"); return; }
      const p = await base44.entities.CompanyProfile.filter({ user_id: u.id });
      if (p[0]) { setProfile(p[0]); setForm({ ...EMPTY, ...p[0] }); base44.entities.Follow.filter({ target_type: "company", target_id: p[0].id }).then((f) => setFollowers(f.length)).catch(() => {}); }
      setLoading(false);
    }).catch(() => navigate("/get-started"));
  }, [navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, logo_url: file_url }));
      if (profile?.id) { const updated = await base44.entities.CompanyProfile.update(profile.id, { logo_url: file_url }); setProfile(updated); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch (err) { alert("Upload failed: " + (err?.message || "")); }
    setUploadingLogo(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.CompanyProfile.update(profile.id, { ...form, profile_completed: true });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert("Could not save: " + (e?.message || "")); }
    setSaving(false);
  };

  const setPlan = async (plan) => {
    const data = plan === "premium"
      ? { plan, premium_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10) }
      : { plan, premium_until: null };
    const updated = await base44.entities.CompanyProfile.update(profile.id, data);
    setProfile(updated); setForm((f) => ({ ...f, ...data }));
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  const statusBadge = { pending: { c: "bg-amber-50 text-amber-700", i: Clock, t: "Under review" }, approved: { c: "bg-green-50 text-green-700", i: CheckCircle2, t: "Approved by AfriTalent" }, rejected: { c: "bg-red-50 text-red-700", i: XCircle, t: "Rejected" } }[profile?.status || "pending"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Company profile</h1>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusBadge.c}`}><statusBadge.i className="h-3.5 w-3.5" /> {statusBadge.t}</span>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-background">
            {form.logo_url ? <img src={form.logo_url} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-2xl font-bold">{form.company_name?.charAt(0) || "?"}</span>}
          </div>
          <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background shadow-sm">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={uploadingLogo} />
          </label>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-xl font-bold">{form.company_name || "Your company"}</p>
            {profile?.profile_completed && <VerifiedTick size={20} />}
            {isPremium(profile) && <PremiumTag size={12} />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{form.industry} · {form.location}</p>
          <p className="mt-1 text-xs text-muted-foreground">{followers} follower{followers !== 1 ? "s" : ""}</p>
          {uploadingLogo && <p className="mt-1 text-xs text-amber-700">Uploading logo...</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Company">
          <Input label="Company name" value={form.company_name} onChange={(v) => set("company_name", v)} />
          <Input label="Email" value={form.email} onChange={(v) => set("email", v)} />
          <Input label="Industry" value={form.industry} onChange={(v) => set("industry", v)} />
          <Select label="Company size" value={form.company_size} options={["1-10", "11-50", "51-200", "201-1000", "1000+"]} onChange={(v) => set("company_size", v)} />
          <Input label="Location" value={form.location} onChange={(v) => set("location", v)} />
          <Input label="Website" value={form.website} onChange={(v) => set("website", v)} />
        </Section>

        <Section title="Hiring">
          <Input label="Hiring roles" value={form.hiring_roles} onChange={(v) => set("hiring_roles", v)} />
          <Input label="Language requirements" value={form.language_requirements} onChange={(v) => set("language_requirements", v)} />
          <Select label="Remote policy" value={form.remote_policy} options={["onsite", "remote", "hybrid"]} onChange={(v) => set("remote_policy", v)} />
          <Toggle label="Visa sponsorship offered" checked={form.visa_sponsorship} onChange={(v) => set("visa_sponsorship", v)} />
        </Section>

        <Section title="About the company" full>
          <Textarea label="Description" value={form.description} onChange={(v) => set("description", v)} />
        </Section>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}</button>
        {saved && <span className="inline-flex items-center gap-1 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
      </div>

      <div className="mt-10">
        <PlanCard profile={profile} type="company" onUpgrade={() => setPlan("premium")} onDowngrade={() => setPlan("free")} />
      </div>
    </div>
  );
}

function Section({ title, children, full }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${full ? "lg:col-span-2" : ""}`}>
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
function Input({ label, value, onChange }) {
  return <div><label className="text-xs font-medium text-muted-foreground">{label}</label><input value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div>;
}
function Textarea({ label, value, onChange }) {
  return <div><label className="text-xs font-medium text-muted-foreground">{label}</label><textarea rows={4} value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>;
}
function Select({ label, value, options, onChange }) {
  return <div><label className="text-xs font-medium text-muted-foreground">{label}</label><select value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>;
}
function Toggle({ label, checked, onChange }) {
  return <label className="flex items-center justify-between"><span className="text-sm">{label}</span><input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" /></label>;
}