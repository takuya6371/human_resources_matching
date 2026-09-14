import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Briefcase, Globe, ArrowLeft, Lightbulb, Trophy, User, Link2, Mail } from "lucide-react";
import { Image } from "@/components/ui/image";
import { VerifiedTick, PremiumTag } from "@/components/Badges";
import { isPremium } from "@/lib/subscription";
import { getCountryInfo, getCountryFlagUrl } from "@/lib/countries";
import FollowButton from "@/components/FollowButton";
import FollowListModal from "@/components/FollowListModal";
import SaveButton from "@/components/SaveButton";
import MessageButton from "@/components/MessageButton";
import ReputationBadges from "@/components/ReputationBadges";

const STATUS_COLORS = { submitted: "bg-muted text-muted-foreground", shortlisted: "bg-amber-50 text-amber-700", finalist: "bg-rose-50 text-rose-700", winner: "bg-green-50 text-green-700", selected_collab: "bg-green-50 text-green-700", more_details: "bg-purple-50 text-purple-700", discussion: "bg-purple-50 text-purple-700" };

export default function TalentPublicProfile() {
  const { id } = useParams();
  const [talent, setTalent] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ideas");
  const [listModal, setListModal] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await base44.entities.TalentProfile.get(id);
        setTalent(t);
        const [ii, fl, fg] = await Promise.all([
          base44.entities.IdeaSubmission.filter({ talent_id: id }, "-created_date", 200).catch(() => []),
          base44.entities.Follow.filter({ target_type: "talent", target_id: id }, "-created_date", 200).catch(() => []),
          t.user_id ? base44.entities.Follow.filter({ follower_id: t.user_id }, "-created_date", 200).catch(() => []) : Promise.resolve([]),
        ]);
        setIdeas(ii); setFollowers(fl); setFollowing(fg);
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;
  if (!talent) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-muted-foreground">Talent not found.</p><Link to="/talents" className="mt-4 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">Browse talent</Link></div>;

  const countryInfo = getCountryInfo(talent.country_of_residence || talent.nationality);
  const flagUrl = getCountryFlagUrl(talent.country_of_residence || talent.nationality);
  const achievements = ideas.filter((i) => ["shortlisted", "finalist", "winner", "selected_collab"].includes(i.status));
  const wins = ideas.filter((i) => ["winner", "selected_collab"].includes(i.status)).length;

  const followerItems = followers.map((f) => ({ name: f.follower_name }));
  const followingItems = following.map((f) => ({ name: f.target_name, to: f.target_type === "company" ? `/company/${f.target_id}` : `/talent/${f.target_id}` }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/talents" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Browse talent</Link>

      {/* Header card — our own style */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-20 bg-gradient-to-r from-amber-100 via-amber-50 to-background" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-foreground text-background">
              {talent.photo_url ? <Image src={talent.photo_url} alt={talent.full_name} fittingType="fill" className="h-full w-full" /> : <span className="flex h-full items-center justify-center font-display text-3xl font-bold">{talent.full_name?.charAt(0)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <SaveButton itemType="talent" item={talent} />
              {talent.user_id && <MessageButton toUserId={talent.user_id} toName={talent.full_name} />}
              <FollowButton targetType="talent" targetId={talent.id} targetName={talent.full_name} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{talent.full_name}</h1>
            {talent.profile_completed && <VerifiedTick size={20} />}
            {isPremium(talent) && <PremiumTag size={12} />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{talent.headline || talent.current_role}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {talent.country_of_residence || talent.nationality}{countryInfo ? `, ${countryInfo.region}` : ""}
            {flagUrl && <img src={flagUrl} alt="" className="ml-1 h-3.5 w-3.5 rounded-full object-cover" />}
            <span className="mx-1 text-border">·</span> {talent.industry}
          </p>

          <div className="mt-3"><ReputationBadges profile={talent} followers={followers.length} wins={wins} /></div>

          {/* Stats */}
          <div className="mt-5 flex gap-6 border-t border-border pt-4 text-sm">
            <button onClick={() => setListModal({ title: "Ideas", items: ideas.map((i) => ({ name: i.challenge_title })) })} className="text-left hover:opacity-70"><span className="font-display text-lg font-bold">{ideas.length}</span> <span className="text-muted-foreground">ideas</span></button>
            <button onClick={() => setListModal({ title: "Followers", items: followerItems })} className="text-left hover:opacity-70"><span className="font-display text-lg font-bold">{followers.length}</span> <span className="text-muted-foreground">followers</span></button>
            <button onClick={() => setListModal({ title: "Following", items: followingItems })} className="text-left hover:opacity-70"><span className="font-display text-lg font-bold">{following.length}</span> <span className="text-muted-foreground">following</span></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-border">
        {[{ k: "ideas", l: "Ideas", n: ideas.length }, { k: "achievements", l: "Achievements", n: achievements.length }, { k: "about", l: "About" }].map((tb) => (
          <button key={tb.k} onClick={() => setTab(tb.k)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium ${tab === tb.k ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{tb.l}{tb.n !== undefined && <span className="text-xs text-muted-foreground">{tb.n}</span>}</button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "ideas" && (ideas.length === 0 ? <Empty icon={Lightbulb} text="No ideas submitted yet." /> : <div className="space-y-3">{ideas.map((it) => <IdeaCard key={it.id} it={it} />)}</div>)}
        {tab === "achievements" && (achievements.length === 0 ? <Empty icon={Trophy} text="No achievements yet." /> : <div className="space-y-3">{achievements.map((it) => <IdeaCard key={it.id} it={it} />)}</div>)}
        {tab === "about" && (
          <div className="space-y-4">
            {talent.bio && <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bio</p><p className="mt-1 text-sm">{talent.bio}</p></div>}
            {talent.skills && <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Skills</p><p className="mt-1 text-sm">{talent.skills}</p></div>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {talent.current_role && <Info icon={Briefcase} label="Current role" value={talent.current_role} />}
              {talent.education && <Info icon={User} label="Education" value={talent.education} />}
              {talent.jlpt_level && talent.jlpt_level !== "none" && <Info icon={Globe} label="JLPT" value={talent.jlpt_level} />}
              {talent.english_level && <Info icon={Globe} label="English" value={talent.english_level} />}
            </div>
            {(talent.hobbies || talent.fav_food) && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fun facts</p>
                {talent.hobbies && <p className="mt-1 text-sm">🎯 {talent.hobbies}</p>}
                {talent.fav_food && <p className="mt-1 text-sm">🍜 {talent.fav_food}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <FollowListModal open={!!listModal} onClose={() => setListModal(null)} title={listModal?.title} items={listModal?.items || []} />
    </div>
  );
}

function IdeaCard({ it }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Link to={`/challenges/${it.challenge_id}`} className="font-medium hover:underline">{it.challenge_title}</Link>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[it.status] || "bg-muted"}`}>{it.status.replace("_", " ")}</span>
      </div>
      <p className="mt-2 text-sm">{it.approach}</p>
      {it.supporting_url && <a href={it.supporting_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-amber-700 underline"><Link2 className="h-3 w-3" /> Supporting document</a>}
    </div>
  );
}

function Empty({ icon: Icon, text }) { return <div className="rounded-2xl border border-dashed border-border p-10 text-center"><Icon className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{text}</p></div>; }
function Info({ icon: Icon, label, value }) { return <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div></div>; }