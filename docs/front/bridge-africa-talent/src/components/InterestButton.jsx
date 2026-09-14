import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Heart, Loader2 } from "lucide-react";

export default function InterestButton({ toUser, toType, toProfileId, toName, jobId, label = "Interested", small }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(null);
  const [interested, setInterested] = useState(null);
  const [interestId, setInterestId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loginMsg, setLoginMsg] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then((a) => {
      setAuthed(a);
      if (!a) { setInterested(false); return; }
      base44.auth.me().then((u) => {
        setUser(u);
        const q = { from_user_id: u.id, to_user_id: toUser };
        if (jobId) q.job_id = jobId;
        base44.entities.Interest.filter(q).then((f) => {
          if (f[0]) { setInterested(true); setInterestId(f[0].id); } else setInterested(false);
        }).catch(() => setInterested(false));
      }).catch(() => setInterested(false));
    });
  }, [toUser, jobId]);

  const toggle = async () => {
    if (!authed) { setLoginMsg(true); return; }
    if (!user) return;
    setBusy(true);
    try {
      if (interested) {
        await base44.entities.Interest.delete(interestId);
        setInterested(false); setInterestId(null);
      } else {
        const created = await base44.entities.Interest.create({
          from_user_id: user.id, from_name: user.full_name, from_type: user.account_type,
          to_user_id: toUser, to_type: toType, to_profile_id: toProfileId, to_name: toName, job_id: jobId || null,
        });
        setInterested(true); setInterestId(created.id);
      }
    } catch (e) { alert("Could not update: " + (e?.message || "")); }
    setBusy(false);
  };

  if (interested === null) return null;
  const base = small ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";

  return (
    <div className="flex flex-col items-start gap-1">
      <button onClick={toggle} disabled={busy} className={`inline-flex items-center gap-1.5 rounded-full font-medium disabled:opacity-50 ${interested ? "border border-rose-200 bg-rose-50 text-rose-600" : "bg-foreground text-background hover:opacity-90"} ${base}`}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className={`h-3.5 w-3.5 ${interested ? "fill-rose-500" : ""}`} />}
        {interested ? "Interested" : label}
      </button>
      {loginMsg && !authed && (
        <span className="text-[11px] text-muted-foreground">Please <button onClick={() => navigate("/login")} className="font-medium text-amber-700 underline">log in</button> to express interest.</span>
      )}
    </div>
  );
}