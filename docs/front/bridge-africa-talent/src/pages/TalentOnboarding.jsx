import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, Upload, ArrowRight, ArrowLeft } from "lucide-react";
import { applyReferral, PROFILE_BONUS_CREDITS } from "@/lib/credits";

const STEPS = ["Personal", "Professional", "Skills & Languages", "Preferences", "Documents", "Fun facts"];

export default function TalentOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [existing, setExisting] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", headline: "", country_of_residence: "", nationality: "",
    current_role: "", industry: "", years_experience: 0, education: "",
    skills: "", languages: "", jlpt_level: "none", english_level: "fluent",
    visa_status: "needs_sponsorship", cv_url: "",
    preferred_role: "", preferred_location: "", remote_willing: true, relocate_willing: true,
    salary_expectation: "", bio: "",
    hobbies: "", height: "", weight: "", fav_food: "", github_username: "",
  });

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (!u.account_type || u.account_type !== "talent") {
        base44.auth.updateMe({ account_type: "talent" });
      }
      base44.entities.TalentProfile.filter({ user_id: u.id }).then((p) => {
        if (p[0]) {
          setExisting(p[0]);
          setForm({ ...form, ...p[0] });
          if (p[0].profile_completed) navigate("/talent/dashboard");
        } else {
          setForm((f) => ({ ...f, full_name: u.full_name || "", email: u.email }));
        }
      });
    }).catch(() => navigate("/get-started"));
  }, [navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("cv_url", file_url);
    } catch (err) {
      alert("Upload failed: " + (err?.message || ""));
    }
    setUploading(false);
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSaving(true);
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      const firstCompletion = !existing?.profile_completed;
      const payload = { ...form, user_id: user.id, email: user.email, profile_completed: true, status: existing?.status || "pending" };
      if (firstCompletion) payload.credits = (existing?.credits || 0) + PROFILE_BONUS_CREDITS;
      let saved = existing;
      if (existing) {
        await base44.entities.TalentProfile.update(existing.id, payload);
      } else {
        saved = await base44.entities.TalentProfile.create(payload);
      }
      const newId = saved?.id || existing?.id;
      if (ref && ref !== newId) await applyReferral(ref);
      navigate("/talent/dashboard");
    } catch (e) {
      alert("Could not save profile: " + (e?.message || ""));
    }
    setSaving(false);
  };

  const input = "h-11 w-full rounded-lg border border-input bg-background px-3";
  const label = "text-sm font-medium";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Build your talent profile</h1>
      <p className="mt-1 text-sm font-semibold text-amber-700">You're creating an AfriTalent profile</p>
      <p className="mt-1 text-muted-foreground">A complete profile helps us match you with the right roles.</p>

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
            <div className="grid gap-2"><label className={label}>Full name</label><input className={input} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
            <div className="grid gap-2"><label className={label}>Professional headline</label><input className={input} placeholder="e.g. Backend Engineer" value={form.headline} onChange={(e) => set("headline", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className={label}>Country of residence</label><input className={input} value={form.country_of_residence} onChange={(e) => set("country_of_residence", e.target.value)} /></div>
              <div className="grid gap-2"><label className={label}>Nationality</label><input className={input} value={form.nationality} onChange={(e) => set("nationality", e.target.value)} /></div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-5">
            <div className="grid gap-2"><label className={label}>Current role</label><input className={input} value={form.current_role} onChange={(e) => set("current_role", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className={label}>Industry</label><input className={input} value={form.industry} onChange={(e) => set("industry", e.target.value)} /></div>
              <div className="grid gap-2"><label className={label}>Years of experience</label><input type="number" className={input} value={form.years_experience} onChange={(e) => set("years_experience", Number(e.target.value))} /></div>
            </div>
            <div className="grid gap-2"><label className={label}>Education</label><textarea rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2" placeholder="Degrees, institutions" value={form.education} onChange={(e) => set("education", e.target.value)} /></div>
            <div className="grid gap-2"><label className={label}>Short bio</label><textarea rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2" value={form.bio} onChange={(e) => set("bio", e.target.value)} /></div>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-5">
            <div className="grid gap-2"><label className={label}>Skills (comma-separated)</label><input className={input} placeholder="React, Python, Data Analysis" value={form.skills} onChange={(e) => set("skills", e.target.value)} /></div>
            <div className="grid gap-2"><label className={label}>Other languages</label><input className={input} placeholder="English, Swahili, French" value={form.languages} onChange={(e) => set("languages", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className={label}>JLPT level</label><select className={input} value={form.jlpt_level} onChange={(e) => set("jlpt_level", e.target.value)}>{["none", "N5", "N4", "N3", "N2", "N1"].map((o) => <option key={o}>{o}</option>)}</select></div>
              <div className="grid gap-2"><label className={label}>English level</label><select className={input} value={form.english_level} onChange={(e) => set("english_level", e.target.value)}>{["basic", "conversational", "fluent", "native"].map((o) => <option key={o}>{o}</option>)}</select></div>
            </div>
            <div className="grid gap-2"><label className={label}>Work authorization / visa status</label><select className={input} value={form.visa_status} onChange={(e) => set("visa_status", e.target.value)}><option value="needs_sponsorship">Need visa sponsorship</option><option value="has_work_rights">Have work rights in Japan</option><option value="citizen">Japanese citizen</option><option value="student">Student</option></select></div>
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className={label}>Preferred role</label><input className={input} value={form.preferred_role} onChange={(e) => set("preferred_role", e.target.value)} /></div>
              <div className="grid gap-2"><label className={label}>Preferred location</label><input className={input} placeholder="Tokyo, Osaka, Remote" value={form.preferred_location} onChange={(e) => set("preferred_location", e.target.value)} /></div>
            </div>
            <div className="grid gap-2"><label className={label}>Salary expectation</label><input className={input} placeholder="e.g. ¥5M–¥7M" value={form.salary_expectation} onChange={(e) => set("salary_expectation", e.target.value)} /></div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.remote_willing} onChange={(e) => set("remote_willing", e.target.checked)} /> Open to remote</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.relocate_willing} onChange={(e) => set("relocate_willing", e.target.checked)} /> Willing to relocate</label>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-5">
            <div className="grid gap-2"><label className={label}>CV / Resume</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent">
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload file"}
                  <input type="file" className="hidden" onChange={handleCv} disabled={uploading} />
                </label>
                {form.cv_url && <span className="text-sm text-green-700">Uploaded ✓</span>}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Once submitted, your profile enters our review queue. You'll gain full access once approved.</p>
          </div>
        )}
        {step === 5 && (
          <div className="grid gap-5">
            <p className="text-sm text-muted-foreground">Optional — a little personality helps you stand out. You can skip this step.</p>
            <div className="grid gap-2"><label className={label}>Hobbies & interests</label><input className={input} value={form.hobbies} onChange={(e) => set("hobbies", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className={label}>Height</label><input className={input} value={form.height} onChange={(e) => set("height", e.target.value)} /></div>
              <div className="grid gap-2"><label className={label}>Weight</label><input className={input} value={form.weight} onChange={(e) => set("weight", e.target.value)} /></div>
            </div>
            <div className="grid gap-2"><label className={label}>Favorite food</label><input className={input} value={form.fav_food} onChange={(e) => set("fav_food", e.target.value)} /></div>
            <div className="grid gap-2"><label className={label}>GitHub username (optional)</label><input className={input} placeholder="username" value={form.github_username} onChange={(e) => set("github_username", e.target.value)} /></div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button onClick={back} disabled={step === 0} className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Back</button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background">Continue <ArrowRight className="h-4 w-4" /></button>
          ) : (
            <button onClick={submit} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50">{saving ? "Submitting..." : "Submit profile"}</button>
          )}
        </div>
      </div>
    </div>
  );
}