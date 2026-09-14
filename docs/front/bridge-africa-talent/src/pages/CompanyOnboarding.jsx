import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Upload, ArrowRight, ArrowLeft, Check } from "lucide-react";

const STEPS = ["Company", "Details", "Hiring Needs"];

export default function CompanyOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [existing, setExisting] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    company_name: "", email: "", industry: "", company_size: "11-50", location: "", website: "",
    description: "", logo_url: "", hiring_roles: "", language_requirements: "",
    visa_sponsorship: false, remote_policy: "hybrid",
  });

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (!u.account_type || u.account_type !== "company") {
        base44.auth.updateMe({ account_type: "company" });
      }
      base44.entities.CompanyProfile.filter({ user_id: u.id }).then((p) => {
        if (p[0]) {
          setExisting(p[0]);
          setForm({ ...form, ...p[0] });
          if (p[0].profile_completed) navigate("/company/dashboard");
        } else {
          setForm((f) => ({ ...f, email: u.email }));
        }
      });
    }).catch(() => navigate("/get-started"));
  }, [navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("logo_url", file_url);
    } catch (err) {
      alert("Upload failed: " + (err?.message || ""));
    }
    setUploading(false);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, user_id: user.id, profile_completed: true, status: existing?.status || "pending" };
      if (existing) await base44.entities.CompanyProfile.update(existing.id, payload);
      else await base44.entities.CompanyProfile.create(payload);
      navigate("/company/dashboard");
    } catch (e) {
      alert("Could not save company profile: " + (e?.message || ""));
    }
    setSaving(false);
  };

  const input = "h-11 w-full rounded-lg border border-input bg-background px-3";
  const label = "text-sm font-medium";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Set up your company profile</h1>
      <p className="mt-2 text-muted-foreground">Tell talent who you are and what you're hiring for.</p>

      <div className="mt-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${i <= step ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < step ? "bg-foreground" : "bg-muted"}`} />}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground">Step {step + 1}: {STEPS[step]}</p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        {step === 0 && (
          <div className="grid gap-5">
            <div className="grid gap-2"><label className={label}>Company name</label><input className={input} value={form.company_name} onChange={(e) => set("company_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className={label}>Industry</label><input className={input} value={form.industry} onChange={(e) => set("industry", e.target.value)} /></div>
              <div className="grid gap-2"><label className={label}>Company size</label><select className={input} value={form.company_size} onChange={(e) => set("company_size", e.target.value)}>{["1-10", "11-50", "51-200", "201-1000", "1000+"].map((o) => <option key={o}>{o}</option>)}</select></div>
            </div>
            <div className="grid gap-2"><label className={label}>Location in Japan</label><input className={input} placeholder="Tokyo, Osaka..." value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
            <div className="grid gap-2"><label className={label}>Website</label><input className={input} value={form.website} onChange={(e) => set("website", e.target.value)} /></div>
            <div className="grid gap-2"><label className={label}>Logo</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent">
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload logo"}
                  <input type="file" className="hidden" onChange={handleLogo} disabled={uploading} />
                </label>
                {form.logo_url && <span className="text-sm text-green-700">Uploaded ✓</span>}
              </div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-5">
            <div className="grid gap-2"><label className={label}>Company description / culture</label><textarea rows={5} className="w-full rounded-lg border border-input bg-background px-3 py-2" value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-5">
            <div className="grid gap-2"><label className={label}>Roles you're hiring for</label><textarea rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2" value={form.hiring_roles} onChange={(e) => set("hiring_roles", e.target.value)} /></div>
            <div className="grid gap-2"><label className={label}>Language requirements</label><input className={input} placeholder="e.g. Business Japanese (JLPT N2) or English-only OK" value={form.language_requirements} onChange={(e) => set("language_requirements", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className={label}>Remote policy</label><select className={input} value={form.remote_policy} onChange={(e) => set("remote_policy", e.target.value)}>{["onsite", "remote", "hybrid"].map((o) => <option key={o}>{o}</option>)}</select></div>
              <div className="grid gap-2"><label className={label}>Visa sponsorship</label><select className={input} value={form.visa_sponsorship ? "yes" : "no"} onChange={(e) => set("visa_sponsorship", e.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select></div>
            </div>
            <p className="text-sm text-muted-foreground">Once submitted, your company enters our verification queue. You can post jobs once approved.</p>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0} className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Back</button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background">Continue <ArrowRight className="h-4 w-4" /></button>
          ) : (
            <button onClick={submit} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50">{saving ? "Submitting..." : "Submit for verification"}</button>
          )}
        </div>
      </div>
    </div>
  );
}