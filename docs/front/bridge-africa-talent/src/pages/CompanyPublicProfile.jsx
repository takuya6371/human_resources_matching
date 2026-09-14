import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Globe, ArrowLeft, Briefcase, Lightbulb, Rss, Building2, Mail } from "lucide-react";
import { Image } from "@/components/ui/image";
import { VerifiedTick, PremiumTag } from "@/components/Badges";
import { isPremium } from "@/lib/subscription";
import FollowButton from "@/components/FollowButton";
import FollowListModal from "@/components/FollowListModal";
import PostCard from "@/components/PostCard";
import SaveButton from "@/components/SaveButton";
import MessageButton from "@/components/MessageButton";
import ReputationBadges from "@/components/ReputationBadges";

export default function CompanyPublicProfile() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [promotedIds, setPromotedIds] = useState(new Set());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("posts");
  const [listModal, setListModal] = useState(null);

  const load = async (c) => {
    const [p, j, ch, fl, fg, l, cm, prom] = await Promise.all([
      base44.entities.Post.filter({ company_id: id, status: "active" }, "-created_date", 100).catch(() => []),
      base44.entities.Job.filter({ company_id: id, status: "active" }, "-created_date", 100).catch(() => []),
      base44.entities.Challenge.filter({ company_id: id, status: "active" }, "-created_date", 100).catch(() => []),
      base44.entities.Follow.filter({ target_type: "company", target_id: id }, "-created_date", 200).catch(() => []),
      c.user_id ? base44.entities.Follow.filter({ follower_id: c.user_id }, "-created_date", 200).catch(() => []) : Promise.resolve([]),
      base44.entities.Like.list("-created_date", 500).catch(() => []),
      base44.entities.Comment.list("-created_date", 500).catch(() => []),
      base44.entities.Promotion.filter({ status: "active", item_type: "post" }, "-created_date", 100).catch(() => []),
    ]);
    setPosts(p); setJobs(j); setChallenges(ch); setFollowers(fl); setFollowing(fg); setLikes(l); setComments(cm);
    setPromotedIds(new Set(prom.map((x) => x.post_id)));
  };

  useEffect(() => {
    (async () => {
      try {
        const c = await base44.entities.CompanyProfile.get(id);
        setCompany(c);
        await load(c);
        base44.auth.isAuthenticated().then((a) => { if (a) base44.auth.me().then((u) => setUser(u)).catch(() => {}); });
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;
  if (!company) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-muted-foreground">Company not found.</p><Link to="/jobs" className="mt-4 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">Browse jobs</Link></div>;

  const followerItems = followers.map((f) => ({ name: f.follower_name }));
  const followingItems = following.map((f) => ({ name: f.target_name, to: f.target_type === "company" ? `/company/${f.target_id}` : `/talent/${f.target_id}` }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/connect" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>

      {/* Header card — same style as talent profile */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-20 bg-gradient-to-r from-amber-100 via-amber-50 to-background" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-foreground text-background">
              {company.logo_url ? <Image src={company.logo_url} alt={company.company_name} fittingType="fill" className="h-full w-full" /> : <span className="flex h-full items-center justify-center font-display text-3xl font-bold">{company.company_name?.charAt(0)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <SaveButton itemType="company" item={company} />
              {company.user_id && <MessageButton toUserId={company.user_id} toName={company.company_name} />}
              <FollowButton targetType="company" targetId={company.id} targetName={company.company_name} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{company.company_name}</h1>
            {company.profile_completed && <VerifiedTick size={20} />}
            {isPremium(company) && <PremiumTag size={12} />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{company.industry} · {company.company_size}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {company.location || "Japan"}</p>
          {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-amber-700 hover:underline"><Globe className="h-3.5 w-3.5" /> {company.website}</a>}

          <div className="mt-3"><ReputationBadges profile={company} followers={followers.length} /></div>

          <div className="mt-5 flex gap-6 border-t border-border pt-4 text-sm">
            <button onClick={() => setListModal({ title: "Posts", items: posts.map((p) => ({ name: p.title })) })} className="text-left hover:opacity-70"><span className="font-display text-lg font-bold">{posts.length}</span> <span className="text-muted-foreground">posts</span></button>
            <button onClick={() => setListModal({ title: "Followers", items: followerItems })} className="text-left hover:opacity-70"><span className="font-display text-lg font-bold">{followers.length}</span> <span className="text-muted-foreground">followers</span></button>
            <button onClick={() => setListModal({ title: "Following", items: followingItems })} className="text-left hover:opacity-70"><span className="font-display text-lg font-bold">{following.length}</span> <span className="text-muted-foreground">following</span></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-border">
        {[{ k: "posts", l: "Posts", n: posts.length, icon: Rss }, { k: "jobs", l: "Jobs", n: jobs.length, icon: Briefcase }, { k: "challenges", l: "Challenges", n: challenges.length, icon: Lightbulb }, { k: "about", l: "About", icon: Building2 }].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`flex shrink-0 items-center gap-1.5 px-4 py-3 text-sm font-medium ${tab === t.k ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}><t.icon className="h-4 w-4" /> {t.l}{t.n !== undefined && <span className="text-xs text-muted-foreground">{t.n}</span>}</button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "posts" && (posts.length === 0 ? <Empty icon={Rss} text="No posts yet." /> : <div className="space-y-4">{posts.map((p) => <PostCard key={p.id} post={p} user={user} allLikes={likes} allComments={comments} onRefresh={() => load(company)} promoted={promotedIds.has(p.id)} canBoost={false} />)}</div>)}
        {tab === "jobs" && (jobs.length === 0 ? <Empty icon={Briefcase} text="No open jobs." /> : <div className="grid gap-4 sm:grid-cols-2">{jobs.map((j) => (
          <Link key={j.id} to={`/jobs?id=${j.id}`} className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/20"><h3 className="font-semibold">{j.title}</h3><p className="mt-1 text-xs text-muted-foreground">{j.location || "Japan"} · {j.remote_type}</p>{j.visa_sponsorship && <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">Visa sponsorship</span>}</Link>
        ))}</div>)}
        {tab === "challenges" && (challenges.length === 0 ? <Empty icon={Lightbulb} text="No challenges." /> : <div className="grid gap-4 sm:grid-cols-2">{challenges.map((c) => (
          <Link key={c.id} to={`/challenges/${c.id}`} className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/20"><h3 className="font-semibold">{c.title}</h3><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.the_challenge}</p><p className="mt-2 text-xs text-muted-foreground">{c.ideas_count || 0} ideas</p></Link>
        ))}</div>)}
        {tab === "about" && (
          <div className="space-y-4">
            {company.description && <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">About</p><p className="mt-1 whitespace-pre-wrap text-sm">{company.description}</p></div>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {company.hiring_roles && <Info label="Hiring roles" value={company.hiring_roles} />}
              {company.language_requirements && <Info label="Language requirements" value={company.language_requirements} />}
              {company.remote_policy && <Info label="Remote policy" value={company.remote_policy} />}
              <Info label="Visa sponsorship" value={company.visa_sponsorship ? "Yes" : "No"} />
            </div>
          </div>
        )}
      </div>

      <FollowListModal open={!!listModal} onClose={() => setListModal(null)} title={listModal?.title} items={listModal?.items || []} />
    </div>
  );
}

function Empty({ icon: Icon, text }) { return <div className="rounded-2xl border border-dashed border-border p-10 text-center"><Icon className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{text}</p></div>; }
function Info({ label, value }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>; }