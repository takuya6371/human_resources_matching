import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Building2, Clock, Trophy, Send, Loader2, Heart, Share2, Lightbulb, Users, Upload, Link2 } from "lucide-react";
import AuthPrompt from "@/components/AuthPrompt";
import ShareSheet from "@/components/ShareSheet";
import SaveButton from "@/components/SaveButton";
import { notify } from "@/lib/notify";

const STATUS_COLORS = { submitted: "bg-muted text-muted-foreground", under_review: "bg-blue-50 text-blue-700", shortlisted: "bg-amber-50 text-amber-700", interested: "bg-amber-50 text-amber-700", more_details: "bg-purple-50 text-purple-700", discussion: "bg-purple-50 text-purple-700", finalist: "bg-rose-50 text-rose-700", winner: "bg-green-50 text-green-700", selected_collab: "bg-green-50 text-green-700", project_started: "bg-green-50 text-green-700", completed: "bg-muted text-muted-foreground" };

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [user, setUser] = useState(null);
  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [idea, setIdea] = useState({ approach: "", how_it_works: "", expected_result: "", supporting_url: "", collaboration: false, skills: "", attach_doc: false });
  const [posting, setPosting] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await base44.entities.Challenge.get(id);
        setChallenge(c);
        if (c.visibility === "public") {
          base44.entities.IdeaSubmission.filter({ challenge_id: id }, "-created_date", 200).then(setIdeas).catch(() => {});
        }
        base44.auth.isAuthenticated().then((a) => { if (a) base44.auth.me().then(async (u) => { setUser(u); if (u.account_type === "talent") { const p = await base44.entities.TalentProfile.filter({ user_id: u.id }); setTalent(p[0] || null); } }).catch(() => {}); });
      } catch (e) {}
      setLoading(false);
    })();
  }, [id]);

  const daysLeft = challenge?.deadline ? Math.max(0, Math.ceil((new Date(challenge.deadline) - new Date()) / 86400000)) : null;
  const closed = daysLeft !== null && daysLeft <= 0;
  const hidden = daysLeft !== null && daysLeft > 0;

  const submit = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (user.account_type !== "talent") { alert("Only talent accounts can submit ideas."); return; }
    if (!talent) { navigate("/talent/onboarding"); return; }
    if (!idea.approach.trim()) return;
    setPosting(true);
    try {
      await base44.entities.IdeaSubmission.create({
        challenge_id: challenge.id, challenge_title: challenge.title, company_id: challenge.company_id, company_name: challenge.company_name,
        talent_id: talent.id, talent_name: talent.full_name, talent_photo: talent.photo_url,
        approach: idea.approach.trim(), how_it_works: idea.how_it_works, expected_result: idea.expected_result, supporting_url: idea.supporting_url,
        collaboration: idea.collaboration, skills: idea.skills, status: "submitted",
      });
      await base44.entities.Challenge.update(challenge.id, { ideas_count: (challenge.ideas_count || 0) + 1 });
      try { const co = await base44.entities.CompanyProfile.get(challenge.company_id); if (co?.user_id) notify({ userId: co.user_id, actorId: user.id, actorName: talent.full_name, actorType: "talent", type: "idea", title: `${talent.full_name} submitted an idea`, body: challenge.title, targetType: "challenge", targetId: challenge.id }); } catch {}
      setSubmitted(true); setIdea({ approach: "", how_it_works: "", expected_result: "", supporting_url: "", collaboration: false, skills: "" });
      const fresh = await base44.entities.IdeaSubmission.filter({ challenge_id: id }, "-created_date", 200);
      setIdeas(fresh); setChallenge(await base44.entities.Challenge.get(id));
    } catch (e) { alert("Could not submit: " + (e?.message || "")); }
    setPosting(false);
  };

  const like = async () => { if (!user) { setAuthOpen(true); return; } try { await base44.entities.Challenge.update(challenge.id, { likes: (challenge.likes || 0) + 1 }); setChallenge({ ...challenge, likes: (challenge.likes || 0) + 1 }); } catch (e) {} };
  const share = async () => { try { await base44.entities.Challenge.update(challenge.id, { shares: (challenge.shares || 0) + 1 }); setChallenge({ ...challenge, shares: (challenge.shares || 0) + 1 }); } catch (e) {} setShareOpen(true); };
  const uploadDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Document must be under 5MB."); return; }
    setUploadingDoc(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setIdea((s) => ({ ...s, supporting_url: file_url })); } catch (err) { alert("Upload failed: " + (err?.message || "")); }
    setUploadingDoc(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;
  if (!challenge) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-muted-foreground">Challenge not found.</p><Link to="/challenges" className="mt-4 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">Back to challenges</Link></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/challenges" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All challenges</Link>
      <Link to={`/company/${challenge.company_id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">{challenge.company_logo ? <img src={challenge.company_logo} alt="" className="h-5 w-5 rounded object-cover" /> : <Building2 className="h-4 w-4" />}{challenge.company_name}</Link>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{challenge.title}</h1>
      {challenge.areas && <div className="mt-3 flex flex-wrap gap-1.5">{challenge.areas.split(",").map((a, i) => a.trim() && <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs">{a.trim()}</span>)}</div>}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {daysLeft !== null && <span className={`rounded-full px-2.5 py-1 font-semibold ${daysLeft <= 3 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}><Clock className="inline h-3 w-3" /> {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</span>}
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700"><Users className="inline h-3 w-3" /> {challenge.ideas_count || 0} idea{(challenge.ideas_count || 0) !== 1 ? "s" : ""}</span>
      </div>

      {challenge.reward_enabled && challenge.reward_title && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="flex items-center gap-2 font-semibold text-amber-800"><Trophy className="h-5 w-5" /> {challenge.reward_title}</p>
          {challenge.reward_types && <p className="mt-1 text-sm text-amber-700">🏆 {challenge.reward_types}</p>}
          {challenge.reward_description && <p className="mt-1 text-sm text-amber-800">{challenge.reward_description}</p>}
        </div>
      )}

      <div className="mt-6 space-y-5">
        <Block label="The problem">{challenge.the_challenge}</Block>
        {challenge.looking_for && <Block label="What we're looking for">{challenge.looking_for}</Block>}
      </div>

      <div className="mt-6 flex items-center gap-4 border-t border-border pt-4 text-sm">
        <button onClick={like} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><Heart className="h-4 w-4" /> {challenge.likes || 0}</button>
        <button onClick={share} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><Share2 className="h-4 w-4" /> {challenge.shares || 0}</button>
        <div className="ml-auto"><SaveButton itemType="challenge" item={challenge} small /></div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        {closed ? (
          <div className="text-center"><p className="font-medium text-rose-700">⏰ Submissions closed</p><p className="mt-1 text-sm text-muted-foreground">The deadline for this challenge has passed. Submitted ideas are now visible below.</p></div>
        ) : submitted ? (
          <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700"><Lightbulb className="h-6 w-6" /></div><p className="mt-3 font-medium text-green-700">Idea submitted! 🎉</p><p className="mt-1 text-sm text-muted-foreground">Your idea is now in. It stays blurred to others until the challenge ends.</p><button onClick={() => setSubmitted(false)} className="mt-4 text-sm font-medium underline">Submit another idea</button></div>
        ) : !showForm ? (
          <button onClick={() => user ? setShowForm(true) : setAuthOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background"><Lightbulb className="h-4 w-4" /> Submit your idea</button>
        ) : (
          <div>
            <h3 className="font-display text-base font-bold">Your approach</h3>
            <textarea value={idea.approach} onChange={(e) => setIdea({ ...idea, approach: e.target.value })} placeholder="How would you approach or solve this challenge?" rows={4} className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <textarea value={idea.how_it_works} onChange={(e) => setIdea({ ...idea, how_it_works: e.target.value })} placeholder="How it could work (optional)" rows={2} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <textarea value={idea.expected_result} onChange={(e) => setIdea({ ...idea, expected_result: e.target.value })} placeholder="Expected result (optional)" rows={2} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={idea.attach_doc} onChange={(e) => setIdea({ ...idea, attach_doc: e.target.checked, supporting_url: e.target.checked ? idea.supporting_url : "" })} /> I want to share supporting documents</label>
            {idea.attach_doc && (
              <div className="mt-2">
                {idea.supporting_url ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-xs"><Link2 className="h-3.5 w-3.5" /> <a href={idea.supporting_url} target="_blank" rel="noreferrer" className="text-amber-700 underline">View uploaded document</a> <button type="button" onClick={() => setIdea({ ...idea, supporting_url: "" })} className="ml-auto text-muted-foreground hover:text-foreground">Remove</button></div>
                ) : (
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-accent">
                    <Upload className="h-4 w-4" /> {uploadingDoc ? "Uploading..." : "Upload document (max 5MB)"}
                    <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip" className="hidden" onChange={uploadDoc} disabled={uploadingDoc} />
                  </label>
                )}
                <p className="mt-1 text-xs text-muted-foreground">PDF, DOC, PNG, JPG or ZIP — up to 5MB.</p>
              </div>
            )}
            <input value={idea.skills} onChange={(e) => setIdea({ ...idea, skills: e.target.value })} placeholder="Relevant skills (comma-separated, optional)" className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={idea.collaboration} onChange={(e) => setIdea({ ...idea, collaboration: e.target.checked })} /> Open to collaboration</label>
            <button onClick={submit} disabled={posting || !idea.approach.trim()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50">{posting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="h-4 w-4" /> Submit idea</>}</button>
          </div>
        )}
      </div>

      {challenge.visibility === "public" && (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold">Submitted ideas ({ideas.length})</h2>
          {hidden && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">🔒 Ideas are blurred until the challenge ends ({daysLeft} days left) so participants can't copy each other.</p>}
          {ideas.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No ideas yet. Be the first to share an approach!</p> : (
            <div className="mt-4 space-y-3">
              {ideas.map((it) => (
                <div key={it.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    {it.talent_photo ? <img src={it.talent_photo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold">{(it.talent_name || "?").charAt(0)}</div>}
                    <div className="flex-1"><p className="text-sm font-medium">{it.talent_name}</p>{it.skills && <p className="text-xs text-muted-foreground">{it.skills}</p>}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[it.status] || "bg-muted"}`}>{it.status.replace("_", " ")}</span>
                  </div>
                  <div className={hidden ? "mt-2 select-none blur-sm" : "mt-2"}>
                    <p className="text-sm">{it.approach}</p>
                    {it.how_it_works && <p className="mt-1 text-sm text-muted-foreground"><strong className="text-foreground">How:</strong> {it.how_it_works}</p>}
                    {it.expected_result && <p className="mt-1 text-sm text-muted-foreground"><strong className="text-foreground">Result:</strong> {it.expected_result}</p>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {it.collaboration && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">🤝 Open to collaboration</span>}
                    {it.supporting_url && <a href={it.supporting_url} target="_blank" rel="noreferrer" className="text-amber-700 underline">View supporting material</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={`${window.location.origin}/challenges/${challenge.id}`} title={challenge.title} />
      <AuthPrompt open={authOpen} onClose={() => setAuthOpen(false)} title="Join the challenge." subtitle="Sign in or create an account to submit your idea." />
    </div>
  );
}

function Block({ label, children }) {
  return (<div><h2 className="font-display text-lg font-semibold">{label}</h2><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{children}</p></div>);
}