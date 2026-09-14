import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Camera, Save, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import GithubRepos from "@/components/GithubRepos";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import PlanCard from "@/components/PlanCard";
import { VerifiedTick, PremiumTag } from "@/components/Badges";
import { isPremium } from "@/lib/subscription";
import { COUNTRY_NAMES, INDUSTRY_LIST } from "@/lib/countries";

const EMPTY = {
  full_name: "", headline: "", photo_url: "", country_of_residence: "", nationality: "",
  current_role: "", industry: "", years_experience: 0, education: "", skills: "", languages: "",
  jlpt_level: "none", english_level: "fluent", visa_status: "needs_sponsorship", cv_url: "",
  preferred_role: "", preferred_location: "", remote_willing: true, relocate_willing: true,
  salary_expectation: "", bio: "",
  hobbies: "", height: "", weight: "", fav_food: "", github_username: "", video_url: "",
};

export default function TalentProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (u.account_type !== "talent") { navigate("/get-started"); return; }
      const p = await base44.entities.TalentProfile.filter({ user_id: u.id });
      if (p[0]) { setProfile(p[0]); setForm({ ...EMPTY, ...p[0] }); base44.entities.Follow.filter({ target_type: "talent", target_id: p[0].id }).then((f) => setFollowers(f.length)).catch(() => {}); base44.entities.IdeaSubmission.filter({ talent_id: p[0].id }, "-created_date", 50).then((ii) => setAchievements(ii.filter((x) => ["shortlisted", "finalist", "winner", "selected_collab"].includes(x.status)))).catch(() => {}); }
      setLoading(false);
    }).catch(() => navigate("/get-started"));
  }, [navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, photo_url: file_url }));
      if (profile?.id) { const updated = await base44.entities.TalentProfile.update(profile.id, { photo_url: file_url }); setProfile(updated); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch (err) { alert("Upload failed: " + (err?.message || "")); }
    setUploadingPhoto(false);
  };

  const uploadCv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCv(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, cv_url: file_url }));
      if (profile?.id) { const updated = await base44.entities.TalentProfile.update(profile.id, { cv_url: file_url }); setProfile(updated); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch (err) { alert("Upload failed: " + (err?.message || "")); }
    setUploadingCv(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.TalentProfile.update(profile.id, { ...form, profile_completed: true });
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
    const updated = await base44.entities.TalentProfile.update(profile.id, data);
    setProfile(updated); setForm((f) => ({ ...f, ...data }));
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  const statusBadge = { pending: { c: "bg-amber-50 text-amber-700", i: Clock, t: "Under review" }, approved: { c: "bg-green-50 text-green-700", i: CheckCircle2, t: "Approved by AfriTalent" }, rejected: { c: "bg-red-50 text-red-700", i: XCircle, t: "Rejected" } }[profile?.status || "pending"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">My profile</h1>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusBadge.c}`}><statusBadge.i className="h-3.5 w-3.5" /> {statusBadge.t}</span>
      </div>

      {/* Photo + headline */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-foreground text-background">
            {form.photo_url ? <img src={form.photo_url} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-2xl font-bold">{form.full_name?.charAt(0) || "?"}</span>}
          </div>
          <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-background border border-border shadow-sm">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploadingPhoto} />
          </label>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-xl font-bold">{form.full_name || "Your name"}</p>
            {profile?.profile_completed && <VerifiedTick size={20} />}
            {isPremium(profile) && <PremiumTag size={12} />}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Credits remaining: <strong className="text-foreground">{profile?.credits || 0}</strong> · {followers} follower{followers !== 1 ? "s" : ""}</div>
          <p className="mt-1 text-sm text-muted-foreground">{form.headline || form.current_role || "Add a headline"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{form.country_of_residence} · {form.industry}</p>
          {uploadingPhoto && <p className="mt-1 text-xs text-amber-700">Uploading photo...</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Personal">
          <Input label="Full name" value={form.full_name} onChange={(v) => set("full_name", v)} />
          <Input label="Headline" value={form.headline} onChange={(v) => set("headline", v)} />
          <Input label="Email" value={form.email} onChange={(v) => set("email", v)} />
          <Select label="Country of residence" value={form.country_of_residence} options={["", ...COUNTRY_NAMES]} onChange={(v) => set("country_of_residence", v)} />
          <Select label="Nationality" value={form.nationality} options={["", ...COUNTRY_NAMES]} onChange={(v) => set("nationality", v)} />
        </Section>

        <Section title="Professional">
          <Input label="Current role" value={form.current_role} onChange={(v) => set("current_role", v)} />
          <Select label="Industry" value={form.industry} options={["", ...INDUSTRY_LIST]} onChange={(v) => set("industry", v)} />
          <Input label="Years of experience" type="number" value={form.years_experience} onChange={(v) => set("years_experience", Number(v) || 0)} />
          <Input label="Education" value={form.education} onChange={(v) => set("education", v)} />
          <Input label="Skills (comma-separated)" value={form.skills} onChange={(v) => set("skills", v)} />
          <Input label="Other languages" value={form.languages} onChange={(v) => set("languages", v)} />
        </Section>

        <Section title="Language & visa">
          <Select label="JLPT level" value={form.jlpt_level} options={["none", "N5", "N4", "N3", "N2", "N1"]} onChange={(v) => set("jlpt_level", v)} />
          <Select label="English level" value={form.english_level} options={["basic", "conversational", "fluent", "native"]} onChange={(v) => set("english_level", v)} />
          <Select label="Visa status" value={form.visa_status} options={["needs_sponsorship", "has_work_rights", "citizen", "student"]} onChange={(v) => set("visa_status", v)} />
        </Section>

        <Section title="Preferences">
          <Input label="Preferred role" value={form.preferred_role} onChange={(v) => set("preferred_role", v)} />
          <Input label="Preferred location" value={form.preferred_location} onChange={(v) => set("preferred_location", v)} />
          <Input label="Salary expectation" value={form.salary_expectation} onChange={(v) => set("salary_expectation", v)} />
          <Toggle label="Open to remote" checked={form.remote_willing} onChange={(v) => set("remote_willing", v)} />
          <Toggle label="Willing to relocate" checked={form.relocate_willing} onChange={(v) => set("relocate_willing", v)} />
        </Section>

        <Section title="About" full>
          <Textarea label="Bio" value={form.bio} onChange={(v) => set("bio", v)} />
        </Section>

        <Section title="Fun facts (optional)" full>
          <p className="text-xs text-muted-foreground">A little personality goes a long way — companies love getting to know the real you.</p>
          <Input label="Hobbies & interests" value={form.hobbies} onChange={(v) => set("hobbies", v)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Height" value={form.height} onChange={(v) => set("height", v)} />
            <Input label="Weight" value={form.weight} onChange={(v) => set("weight", v)} />
          </div>
          <Input label="Favorite food" value={form.fav_food} onChange={(v) => set("fav_food", v)} />
          <Input label="GitHub username (optional)" value={form.github_username} onChange={(v) => set("github_username", v)} />
        </Section>

        <Section title="CV / Resume" full>
          <div className="flex flex-wrap items-center gap-3">
            {form.cv_url ? <a href={form.cv_url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-full border border-border px-4 text-xs font-medium hover:bg-accent">View current CV</a> : <span className="text-sm text-muted-foreground">No CV uploaded.</span>}
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-foreground px-4 text-xs font-medium text-background">
              <Upload className="h-4 w-4" /> {uploadingCv ? "Uploading..." : "Upload CV"}
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadCv} disabled={uploadingCv} />
            </label>
          </div>
        </Section>
      </div>

      {form.github_username && (
        <div className="mt-6">
          <GithubRepos username={form.github_username} />
        </div>
      )}

      {form.cv_url && (
        <div className="mt-6">
          <ResumeAnalyzer cvUrl={form.cv_url} />
        </div>
      )}

      {achievements.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Challenge achievements 🏆</h2>
          <div className="mt-3 space-y-2">
            {achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-sm">
                <span>{a.status === "winner" ? "🏆" : a.status === "finalist" ? "⭐" : a.status === "selected_collab" ? "🤝" : "💡"}</span>
                <div className="flex-1"><p className="font-medium">{a.challenge_title}</p><p className="text-xs text-muted-foreground">{a.company_name} · {a.status.replace("_", " ")}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}</button>
        {saved && <span className="inline-flex items-center gap-1 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
      </div>

      <div className="mt-10">
        <PlanCard profile={profile} type="talent" onUpgrade={() => setPlan("premium")} onDowngrade={() => setPlan("free")} />
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
function Input({ label, value, onChange, type = "text" }) {
  return <div><label className="text-xs font-medium text-muted-foreground">{label}</label><input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div>;
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