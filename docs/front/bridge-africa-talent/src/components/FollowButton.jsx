import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import AuthPrompt from "@/components/AuthPrompt";
import { notify } from "@/lib/notify";

const selfCache = {};

async function getSelfProfileId(user) {
  if (selfCache[user.id] !== undefined) return selfCache[user.id];
  let id = null;
  try {
    if (user.account_type === "talent") { const p = await base44.entities.TalentProfile.filter({ user_id: user.id }); id = p[0]?.id || null; }
    else if (user.account_type === "company") { const p = await base44.entities.CompanyProfile.filter({ user_id: user.id }); id = p[0]?.id || null; }
  } catch {}
  selfCache[user.id] = id;
  return id;
}

export default function FollowButton({ targetType, targetId, targetName, small, onToggle }) {
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(null);
  const [following, setFollowing] = useState(null);
  const [followId, setFollowId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    let alive = true;
    setFollowing(null);
    setIsSelf(false);
    base44.auth.isAuthenticated().then(async (a) => {
      if (!alive) return;
      setAuthed(a);
      if (!a) { setFollowing(false); return; }
      try {
        const u = await base44.auth.me();
        if (!alive) return;
        setUser(u);
        if (u.account_type === targetType) {
          const sid = await getSelfProfileId(u);
          if (alive && sid && sid === targetId) { setIsSelf(true); setFollowing(false); return; }
        }
        const f = await base44.entities.Follow.filter({ follower_id: u.id, target_type: targetType, target_id: targetId });
        if (!alive) return;
        if (f[0]) { setFollowing(true); setFollowId(f[0].id); } else setFollowing(false);
      } catch { if (alive) setFollowing(false); }
    });
    return () => { alive = false; };
  }, [targetType, targetId]);

  const toggle = async () => {
    if (!authed) { setAuthOpen(true); return; }
    if (!user) return;
    setBusy(true);
    try {
      if (following) {
        await base44.entities.Follow.delete(followId);
        setFollowing(false); setFollowId(null);
      } else {
        const created = await base44.entities.Follow.create({ follower_id: user.id, follower_name: user.full_name, target_type: targetType, target_id: targetId, target_name: targetName });
        setFollowing(true); setFollowId(created.id);
        try { const ent = targetType === "talent" ? "TalentProfile" : "CompanyProfile"; const tp = await base44.entities[ent].get(targetId); if (tp?.user_id) notify({ userId: tp.user_id, actorId: user.id, actorName: user.full_name, actorType: user.account_type, type: "follow", title: `${user.full_name} started following you`, targetType, targetId }); } catch {}
      }
      if (onToggle) onToggle();
    } catch (e) { alert("Could not update follow: " + (e?.message || "")); }
    setBusy(false);
  };

  if (isSelf || following === null) return null;
  const base = small ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";

  return (
    <>
      <button onClick={toggle} disabled={busy} className={`inline-flex items-center gap-1.5 rounded-full font-medium disabled:opacity-50 ${following ? "border border-border hover:bg-accent" : "bg-foreground text-background hover:opacity-90"} ${base}`}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
        {following ? "Following" : "Follow"}
      </button>
      <AuthPrompt open={authOpen} onClose={() => setAuthOpen(false)} title="Join the community." subtitle="Sign in or create an account to follow companies and talents." />
    </>
  );
}