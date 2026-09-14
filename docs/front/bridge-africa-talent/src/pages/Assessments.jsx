import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Award, ArrowLeft, CheckCircle2, XCircle, Star, RefreshCw } from "lucide-react";
import { Image } from "@/components/ui/image";

const HERO = "https://media.base44.com/images/public/6a8c20abc1e4606a34e9dd6b/d2f592f80_generated_image.png";

export default function Assessments() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (!u) { navigate("/login"); return; }
      if (u.account_type !== "talent") { navigate("/talent/dashboard"); return; }
      const profiles = await base44.entities.TalentProfile.filter({ user_id: u.id });
      if (!profiles[0]) { navigate("/talent/onboarding"); return; }
      setProfile(profiles[0]);
      const [as, rs] = await Promise.all([
        base44.entities.SkillAssessment.filter({ status: "active" }, "-created_date", 50),
        base44.entities.AssessmentResult.filter({ talent_id: profiles[0].id }, "-created_date", 50),
      ]);
      setAssessments(as);
      setResults(rs);
      setLoading(false);
    }).catch(() => navigate("/login"));
  }, [navigate]);

  const passedIds = new Set(results.filter((r) => r.passed).map((r) => r.assessment_id));

  const start = (a) => { setActive(a); setAnswers({}); setResult(null); };

  const submit = async () => {
    if (!active || !profile) return;
    setSubmitting(true);
    let questions = [];
    try { questions = JSON.parse(active.questions || "[]"); } catch {}
    if (!Array.isArray(questions) || questions.length === 0) { setSubmitting(false); return; }
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= (active.passing_score || 70);
    const alreadyPassed = passedIds.has(active.id);
    const creditsEarned = passed && !alreadyPassed ? (active.credits_reward || 0) : 0;

    try {
      await base44.entities.AssessmentResult.create({
        talent_id: profile.id, talent_name: profile.full_name,
        assessment_id: active.id, assessment_title: active.title,
        score, total: questions.length, passed, credits_earned: creditsEarned,
      });
      if (creditsEarned > 0) {
        const updated = await base44.entities.TalentProfile.update(profile.id, { credits: (profile.credits || 0) + creditsEarned });
        setProfile(updated);
      }
      setResults((r) => [{ id: "tmp-" + Date.now(), assessment_id: active.id, assessment_title: active.title, score, passed, credits_earned: creditsEarned }, ...r]);
      setResult({ score, passed, credits_earned: creditsEarned, correct, total: questions.length });
    } catch (e) {
      alert("Could not submit: " + (e?.message || ""));
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  if (active && !result) {
    let questions = [];
    try { questions = JSON.parse(active.questions || "[]"); } catch {}
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <button onClick={() => setActive(null)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to assessments</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{active.emoji || "📝"}</span>
          <div>
            <h1 className="font-display text-2xl font-bold">{active.title}</h1>
            <p className="text-sm text-muted-foreground">{active.category} · {active.difficulty} · +{active.credits_reward} credit{active.credits_reward !== 1 ? "s" : ""} on pass</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{active.description}</p>

        <div className="mt-8 space-y-6">
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-medium"><span className="text-muted-foreground">Q{qi + 1}.</span> {q.q}</p>
              <div className="mt-3 space-y-2">
                {(q.options || []).map((opt, oi) => (
                  <label key={oi} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${answers[qi] === oi ? "border-amber-400 bg-amber-50" : "border-border hover:bg-accent"}`}>
                    <input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))} className="h-4 w-4 accent-amber-600" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={submit} disabled={submitting || Object.keys(answers).length < questions.length} className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit answers"}
        </button>
      </div>
    );
  }

  if (active && result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <div className="text-5xl">{result.passed ? "🎉" : "💪"}</div>
          <h1 className="mt-4 font-display text-3xl font-bold">{result.passed ? "You passed!" : "Almost there"}</h1>
          <p className="mt-2 text-muted-foreground">You scored {result.correct}/{result.total} ({result.score}%) on {active.title}.</p>
          {result.passed && result.credits_earned > 0 && (
            <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-amber-50 px-5 py-2 text-amber-800"><Star className="h-4 w-4" /> +{result.credits_earned} credit{result.credits_earned !== 1 ? "s" : ""} added to your balance!</div>
          )}
          {result.passed && result.credits_earned === 0 && <p className="mt-4 text-sm text-muted-foreground">You already passed this before — no new credits, but great refresh!</p>}
          <div className="mt-8 flex items-center justify-center gap-3">
            <button onClick={() => setActive(null)} className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background">Back to assessments</button>
            <button onClick={() => start(active)} className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium hover:bg-accent"><RefreshCw className="h-4 w-4" /> Retake</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10"><Image src={HERO} alt="" fittingType="fill" className="h-full w-full opacity-20" /></div>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-amber-700"><Award className="h-5 w-5" /><span className="text-sm font-medium">Skill assessments</span></div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Test your skills, earn credits 🚀</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Pass a short assessment and earn credits redeemable for extra job applications. Each first pass adds to your balance instantly.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border bg-card px-5 py-3"><p className="text-xs text-muted-foreground">Your credits</p><p className="font-display text-2xl font-bold text-amber-700">⭐ {profile?.credits || 0}</p></div>
            <div className="rounded-2xl border border-border bg-card px-5 py-3"><p className="text-xs text-muted-foreground">Assessments passed</p><p className="font-display text-2xl font-bold">{passedIds.size}</p></div>
            <div className="rounded-2xl border border-border bg-card px-5 py-3"><p className="text-xs text-muted-foreground">Available tests</p><p className="font-display text-2xl font-bold">{assessments.length}</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {assessments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center"><p className="text-muted-foreground">No assessments available yet. Check back soon! 🛠️</p></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((a) => {
              const isPassed = passedIds.has(a.id);
              return (
                <div key={a.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{a.emoji || "📝"}</span>
                    {isPassed && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> Passed</span>}
                  </div>
                  <h3 className="mt-3 font-semibold">{a.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{a.category} · {a.difficulty}</p>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground line-clamp-3">{a.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800"><Star className="h-3 w-3" /> +{a.credits_reward} credit{a.credits_reward !== 1 ? "s" : ""}</span>
                    <span className="text-muted-foreground">Pass: {a.passing_score}%</span>
                  </div>
                  <button onClick={() => start(a)} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background">{isPassed ? "Retake" : "Start test"}</button>
                </div>
              );
            })}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold">Your recent results</h2>
            <div className="mt-4 space-y-2">
              {results.slice(0, 8).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.passed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm font-medium">{r.assessment_title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{r.score}%{r.credits_earned ? ` · +${r.credits_earned}⭐` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}