import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Send } from "lucide-react";
import { useLang } from "@/lib/i18n";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";

const TYPES = [
  { value: "opportunity", label: "💼 Opportunity", bi: "bi-briefcase" },
  { value: "scholarship", label: "🎓 Scholarship", bi: "bi-mortarboard" },
  { value: "program", label: "🚀 Program", bi: "bi-rocket" },
  { value: "social_problem", label: "💡 Seeking solutions", bi: "bi-lightbulb" },
];

function jobScore(job, talent) {
  if (!talent) return 0;
  let s = 0;
  if (job.industry && talent.industry && (job.industry.toLowerCase().includes(talent.industry.toLowerCase()) || talent.industry.toLowerCase().includes(job.industry.toLowerCase()))) s += 30;
  if (talent.skills && job.requirements) {
    const req = job.requirements.toLowerCase().split(/[^a-z0-9+#.]+/).filter((t) => t.length > 2);
    const sk = talent.skills.toLowerCase().split(",").map((x) => x.trim());
    if (sk.some((x) => req.some((r) => r === x || r.includes(x) || x.includes(r)))) s += 30;
  }
  if (job.jlpt_required && job.jlpt_required !== "none") { const ord = { none:0,N5:1,N4:2,N3:3,N2:4,N1:5 }; if ((ord[talent.jlpt_level]||0) >= (ord[job.jlpt_required]||0)) s += 15; }
  return s;
}
function challengeScore(ch, talent) {
  if (!talent || !ch.areas) return 0;
  const areas = ch.areas.toLowerCase().split(",").map((a) => a.trim());
  const sk = (talent.skills || "").toLowerCase();
  return areas.reduce((s, a) => a && sk.includes(a) ? s + 1 : s, 0);
}

export default function Newsfeed() {
  const { t } = useLang();
  const [user, setUser] = useState(null);
  const [talent, setTalent] = useState(null);
  const [company, setCompany] = useState(null);
  const [followIds, setFollowIds] = useState(new Set());
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [talents, setTalents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [cType, setCType] = useState("opportunity");
  const [cTitle, setCTitle] = useState("");
  const [cBody, setCBody] = useState("");
  const [cImage, setCImage] = useState("");
  const [cVideo, setCVideo] = useState("");
  const [posting, setPosting] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const [p, j, ch, ta, co, fl, l, c] = await Promise.all([
        base44.entities.Post.filter({ status: "active" }, "-created_date", 50),
        base44.entities.Job.filter({ status: "active" }, "-created_date", 30),
        base44.entities.Challenge.filter({ status: "active" }, "-created_date", 30),
        base44.entities.TalentProfile.filter({ status: "approved" }, "-created_date", 50),
        base44.entities.CompanyProfile.filter({ status: "approved" }, "-created_date", 50),
        base44.entities.Follow.filter({ follower_id: u.id }, "-created_date", 200).catch(() => []),
        base44.entities.Like.list("-created_date", 500),
        base44.entities.Comment.list("-created_date", 500),
      ]);
      setPosts(p); setJobs(j); setChallenges(ch); setTalents(ta); setCompanies(co); setLikes(l); setComments(c);
      setFollowIds(new Set(fl.map((f) => f.target_id)));
      if (u.account_type === "talent") { const tp = await base44.entities.TalentProfile.filter({ user_id: u.id }); setTalent(tp[0] || null); }
      if (u.account_type === "company") { const cp = await base44.entities.CompanyProfile.filter({ user_id: u.id }); setCompany(cp[0] || null); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const load = async () => {
    const [p, l, c] = await Promise.all([
      base44.entities.Post.filter({ status: "active" }, "-created_date", 50),
      base44.entities.Like.list("-created_date", 500),
      base44.entities.Comment.list("-created_date", 500),
    ]);
    setPosts(p); setLikes(l); setComments(c);
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Image must be under 10MB."); return; }
    setUploadingImg(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setCImage(file_url); } catch { alert("Upload failed"); }
    setUploadingImg(false);
  };
  const addVideo = () => { const url = prompt("Paste a video URL (YouTube, Vimeo or direct link):"); if (url) setCVideo(url); };

  const createPost = async () => {
    if (!company || !cTitle.trim() || !cBody.trim()) return;
    setPosting(true);
    try {
      await base44.entities.Post.create({
        company_id: company.id, company_name: company.company_name, company_logo: company.logo_url,
        type: cType, title: cTitle.trim(), body: cBody.trim(), image_url: cImage, video_url: cVideo, status: "active", likes: 0, comments: 0, shares: 0,
      });
      setCType("opportunity"); setCTitle(""); setCBody(""); setCImage(""); setCVideo(""); setShowComposer(false);
      await load();
    } catch (e) { alert("Could not post: " + (e?.message || "")); }
    setPosting(false);
  };

  // Build a mixed, interest-ranked feed.
  const feed = React.useMemo(() => {
    const items = [];
    // Jobs ranked by profile fit
    const rankedJobs = [...jobs].sort((a, b) => jobScore(b, talent) - jobScore(a, talent)).slice(0, 4);
    rankedJobs.forEach((j) => items.push({ kind: "job", data: j, score: jobScore(j, talent) }));
    // Challenges ranked by skills overlap
    const rankedCh = [...challenges].sort((a, b) => challengeScore(b, talent) - challengeScore(a, talent)).slice(0, 3);
    rankedCh.forEach((c) => items.push({ kind: "challenge", data: c }));
    // Suggestions: talents & companies not already followed, ranked by interest
    const suggTalents = talents.filter((x) => x.user_id !== user?.id && !followIds.has(x.id)).sort((a, b) => {
      if (!talent) return 0;
      const ov = (p) => { const a1 = (talent.skills || "").toLowerCase().split(",").map((s) => s.trim()); const b1 = (p.skills || "").toLowerCase(); return a1.filter((s) => s && b1.includes(s)).length; };
      return ov(b) - ov(a);
    }).slice(0, 3);
    const suggCompanies = companies.filter((x) => x.user_id !== user?.id && !followIds.has(x.id)).sort((a, b) => {
      if (!talent) return 0;
      const m = (p) => (p.industry && talent.industry && p.industry.toLowerCase().includes(talent.industry.toLowerCase())) ? 1 : 0;
      return m(b) - m(a);
    }).slice(0, 3);
    suggTalents.forEach((s) => items.push({ kind: "talent", data: s }));
    suggCompanies.forEach((s) => items.push({ kind: "company", data: s }));

    // Interleave: posts chronological, insert a non-post item every 2 posts
    const mixed = [];
    let ni = 0;
    posts.forEach((p, i) => {
      mixed.push({ kind: "post", data: p });
      if ((i + 1) % 2 === 0 && ni < items.length) { mixed.push(items[ni]); ni++; }
    });
    while (ni < items.length) { mixed.push(items[ni]); ni++; }
    return mixed;
  }, [posts, jobs, challenges, talents, companies, talent, user, followIds]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">{t("newsfeed.title")}</h1>

      {/* Composer */}
      {user?.account_type === "company" && company ? (
        <div className="mt-5 rounded-2xl border border-border bg-card p-4">
          {!showComposer ? (
            <button onClick={() => setShowComposer(true)} className="flex h-11 w-full items-center gap-3 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground hover:bg-accent">
              <i className="bi bi-pencil-square text-base text-foreground" /> {t("newsfeed.startPost")}
            </button>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((tp) => (
                  <button key={tp.value} onClick={() => setCType(tp.value)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${cType === tp.value ? "bg-foreground text-background" : "border border-border hover:bg-accent"}`}><i className={`bi ${tp.bi}`} /> {tp.label}</button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-accent"><i className="bi bi-image text-emerald-600" /> {t("newsfeed.photo")}{uploadingImg ? "…" : ""}<input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploadingImg} /></label>
                <button onClick={addVideo} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-accent"><i className="bi bi-camera-reels text-rose-600" /> {t("newsfeed.video")}</button>
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground"><i className="bi bi-pencil-square text-amber-600" /> {t("newsfeed.writeArticle")}</span>
              </div>
              {cImage && <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-xs"><i className="bi bi-image" /> Photo <button type="button" onClick={() => setCImage("")} className="ml-auto text-muted-foreground hover:text-foreground">×</button></div>}
              {cVideo && <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-xs"><i className="bi bi-camera-reels" /> {cVideo} <button type="button" onClick={() => setCVideo("")} className="ml-auto text-muted-foreground hover:text-foreground">×</button></div>}
              <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder={t("newsfeed.title2")} className="mt-3 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
              <textarea value={cBody} onChange={(e) => setCBody(e.target.value)} placeholder={t("newsfeed.body")} rows={4} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <div className="mt-3 flex gap-2">
                <button onClick={createPost} disabled={posting || !cTitle.trim() || !cBody.trim()} className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50">{posting ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("newsfeed.posting")}</> : <><Send className="h-4 w-4" /> {t("newsfeed.publish")}</>}</button>
                <button onClick={() => setShowComposer(false)} className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent">{t("newsfeed.cancel")}</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
          <i className="bi bi-people mx-auto block text-2xl" />
          <p className="mt-2 text-center">{t("newsfeed.followCompanies")}</p>
        </div>
      )}

      {/* Mixed feed */}
      <div className="mt-6 space-y-4">
        {feed.length === 0 && <p className="text-sm text-muted-foreground">{t("newsfeed.noPosts")}</p>}
        {feed.map((it, i) => {
          if (it.kind === "post") return <PostCard key={`p${it.data.id}`} post={it.data} user={user} allLikes={likes} allComments={comments} onRefresh={load} canBoost={false} />;
          if (it.kind === "job") return <JobCard key={`j${it.data.id}`} job={it.data} t={t} />;
          if (it.kind === "challenge") return <ChallengeCard key={`c${it.data.id}`} ch={it.data} t={t} />;
          if (it.kind === "talent") return <SuggestionCard key={`t${it.data.id}`} type="talent" item={it.data} t={t} />;
          if (it.kind === "company") return <SuggestionCard key={`co${it.data.id}`} type="company" item={it.data} t={t} />;
          return null;
        })}
      </div>
    </div>
  );
}

function JobCard({ job, t }) {
  return (
    <Link to={`/jobs?id=${job.id}`} className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-center gap-2 text-xs font-medium text-blue-700"><i className="bi bi-briefcase" /> {t("newsfeed.openRole")}</div>
      <h3 className="mt-2 font-semibold">{job.title}</h3>
      <p className="text-xs text-muted-foreground">{job.company_name} · {job.location || "Japan"} · {job.remote_type}</p>
      {job.visa_sponsorship && <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">Visa sponsorship</span>}
    </Link>
  );
}

function ChallengeCard({ ch, t }) {
  const days = ch.deadline ? Math.max(0, Math.ceil((new Date(ch.deadline) - new Date()) / 86400000)) : null;
  return (
    <Link to={`/challenges/${ch.id}`} className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-center gap-2 text-xs font-medium text-amber-700"><i className="bi bi-lightbulb" /> {t("newsfeed.challenge")}</div>
      <h3 className="mt-2 font-semibold">{ch.title}</h3>
      <p className="text-xs text-muted-foreground">{ch.company_name}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        {days !== null && <span className={`rounded-full px-2 py-0.5 font-semibold ${days <= 3 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{days} {days === 1 ? t("common.day") : t("common.days")} {t("common.remaining")}</span>}
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">{ch.ideas_count || 0} {(ch.ideas_count || 0) === 1 ? t("common.idea") : t("common.ideas")}</span>
      </div>
    </Link>
  );
}

function SuggestionCard({ type, item, t }) {
  const name = type === "talent" ? item.full_name : item.company_name;
  const sub = type === "talent" ? (item.headline || item.current_role) : item.industry;
  const photo = type === "talent" ? item.photo_url : item.logo_url;
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-amber-50/40 to-card p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><i className="bi bi-stars text-amber-500" /> {t("newsfeed.suggested")}</p>
      <div className="mt-3 flex items-center gap-3">
        <Link to={type === "talent" ? `/talent/${item.id}` : `/company/${item.id}`} className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground text-background">
          {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-base font-bold">{name?.charAt(0)}</span>}
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={type === "talent" ? `/talent/${item.id}` : `/company/${item.id}`} className="block truncate font-semibold hover:underline">{name}</Link>
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
        <FollowButton targetType={type} targetId={item.id} targetName={name} small />
      </div>
    </div>
  );
}