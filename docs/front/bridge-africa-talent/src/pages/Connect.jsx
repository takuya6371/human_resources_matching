import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Rss, Building2, Plus, Loader2, Send } from "lucide-react";
import { Link } from "react-router-dom";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";
import BoostModal from "@/components/BoostModal";

const TYPES = [
  { value: "opportunity", label: "💼 Opportunity" },
  { value: "scholarship", label: "🎓 Scholarship" },
  { value: "program", label: "🚀 Program" },
  { value: "social_problem", label: "💡 Seeking solutions" },
];

export default function Connect() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [follows, setFollows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [promotedIds, setPromotedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [cType, setCType] = useState("opportunity");
  const [cTitle, setCTitle] = useState("");
  const [cBody, setCBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [boostPost, setBoostPost] = useState(null);
  const [cImage, setCImage] = useState("");
  const [cVideo, setCVideo] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);

  const load = async (u) => {
    const [p, l, c, co, prom] = await Promise.all([
      base44.entities.Post.filter({ status: "active" }, "-created_date", 50),
      base44.entities.Like.list("-created_date", 500),
      base44.entities.Comment.list("-created_date", 500),
      base44.entities.CompanyProfile.filter({ status: "approved" }, "-created_date", 200),
      base44.entities.Promotion.filter({ status: "active" }, "-created_date", 100),
    ]);
    setPosts(p); setLikes(l); setComments(c); setCompanies(co);
    setPromotedIds(new Set(prom.map((x) => x.post_id)));
    if (u) {
      const f = await base44.entities.Follow.filter({ follower_id: u.id, target_type: "company" }, "-created_date", 200);
      setFollows(f);
    }
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then((a) => {
      if (a) base44.auth.me().then(async (u) => {
        setUser(u);
        if (u.account_type === "company") {
          const co = await base44.entities.CompanyProfile.filter({ user_id: u.id });
          setCompany(co[0] || null);
        }
        await load(u);
      }).catch(() => load(null));
      else load(null);
    });
  }, []);

  const followedIds = new Set(follows.map((f) => f.target_id));
  const suggested = companies.filter((c) => !followedIds.has(c.id)).slice(0, 6);

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
      await load(user);
    } catch (e) { alert("Could not post: " + (e?.message || "")); }
    setPosting(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-amber-700"><Rss className="h-5 w-5" /><span className="text-sm font-medium">Connect</span></div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Community & connections 🤝</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Browse public posts, company updates, opportunities, and innovation challenges. Sign in to like, comment, follow, and share your ideas.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {user?.account_type === "company" && company && (
              <div className="mb-6">
                {!showComposer ? (
                  <button onClick={() => setShowComposer(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background"><Plus className="h-4 w-4" /> Create a post</button>
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="font-display text-base font-bold">Start a post</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TYPES.map((t) => (
                        <button key={t.value} onClick={() => setCType(t.value)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${cType === t.value ? "bg-foreground text-background" : "border border-border hover:bg-accent"}`}>{t.label}</button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-accent"><i className="bi bi-image text-emerald-600" /> Photo{uploadingImg ? "…" : ""}<input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploadingImg} /></label>
                      <button onClick={addVideo} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-accent"><i className="bi bi-camera-reels text-rose-600" /> Video</button>
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground"><i className="bi bi-pencil-square text-amber-600" /> Write article</span>
                    </div>
                    {cImage && <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-xs"><i className="bi bi-image" /> Photo attached <button type="button" onClick={() => setCImage("")} className="ml-auto text-muted-foreground hover:text-foreground">Remove</button></div>}
                    {cVideo && <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-xs"><i className="bi bi-camera-reels" /> {cVideo} <button type="button" onClick={() => setCVideo("")} className="ml-auto text-muted-foreground hover:text-foreground">Remove</button></div>}
                    <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="Title" className="mt-3 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
                    <textarea value={cBody} onChange={(e) => setCBody(e.target.value)} placeholder="Describe the opportunity, scholarship, program, or the challenge you'd like ideas on…" rows={4} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                    <div className="mt-3 flex gap-2">
                      <button onClick={createPost} disabled={posting || !cTitle.trim() || !cBody.trim()} className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50">{posting ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</> : <><Send className="h-4 w-4" /> Publish</>}</button>
                      <button onClick={() => setShowComposer(false)} className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <h2 className="font-display text-xl font-bold">Community feed</h2>
            {posts.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border p-12 text-center"><Building2 className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-muted-foreground">No posts yet. {user?.account_type === "company" ? "Create the first one above!" : "Follow companies to see their updates."}</p></div>
            ) : (
              <div className="mt-4 space-y-4">
                {posts.map((p) => <PostCard key={p.id} post={p} user={user} allLikes={likes} allComments={comments} onRefresh={() => load(user)} promoted={promotedIds.has(p.id)} canBoost={user?.account_type === "company" && company && p.company_id === company.id} onBoost={setBoostPost} />)}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-xl font-bold">Companies you follow</h2>
            {follows.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{user ? "No follows yet." : "Sign in to follow companies."}</p>
            ) : (
              <div className="mt-4 space-y-2">
                {follows.map((f) => {
                  const co = companies.find((c) => c.id === f.target_id);
                  return (
                    <div key={f.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                      <Link to={`/company/${f.target_id}`} className="flex min-w-0 flex-1 items-center gap-2">
                        {co?.logo_url ? <img src={co.logo_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground/10"><Building2 className="h-4 w-4 text-muted-foreground" /></div>}
                        <span className="truncate text-sm font-medium hover:underline">{f.target_name}</span>
                      </Link>
                      <FollowButton targetType="company" targetId={f.target_id} targetName={f.target_name} small onToggle={() => load(user)} />
                    </div>
                  );
                })}
              </div>
            )}

            <h2 className="mt-8 font-display text-xl font-bold">Suggested companies</h2>
            {suggested.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No suggestions right now.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {suggested.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                    <Link to={`/company/${c.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                      {c.logo_url ? <img src={c.logo_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground/10"><Building2 className="h-4 w-4 text-muted-foreground" /></div>}
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium hover:underline">{c.company_name}</p><p className="truncate text-xs text-muted-foreground">{c.industry}</p></div>
                    </Link>
                    <FollowButton targetType="company" targetId={c.id} targetName={c.company_name} small onToggle={() => load(user)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <BoostModal open={!!boostPost} onClose={() => setBoostPost(null)} post={boostPost} user={user} onDone={() => load(user)} />
    </div>
  );
}