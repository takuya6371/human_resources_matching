import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, MapPin, ChevronDown, ChevronUp, Heart, Link2 } from "lucide-react";
import InterestButton from "@/components/InterestButton";

export default function Matches() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [myInterests, setMyInterests] = useState([]);
  const [reverseInterests, setReverseInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (!u) { navigate("/login"); return; }
      setUser(u);
      if (u.account_type !== "talent") { navigate("/talent/dashboard"); return; }
      const profiles = await base44.entities.TalentProfile.filter({ user_id: u.id });
      if (!profiles[0]) { navigate("/talent/onboarding"); return; }
      const [mRes, mine, rev] = await Promise.all([
        base44.functions.invoke("computeMatches", { talent_id: profiles[0].id }),
        base44.entities.Interest.filter({ from_user_id: u.id, from_type: "talent" }, "-created_date", 100),
        base44.entities.Interest.filter({ to_user_id: u.id, to_type: "talent" }, "-created_date", 100),
      ]);
      setMatches(mRes?.data?.matches || mRes?.matches || []);
      setMyInterests(mine);
      setReverseInterests(rev);
      setLoading(false);
    }).catch(() => navigate("/login"));
  }, [navigate]);

  const myInterestCompanyUsers = new Set(myInterests.map((i) => i.to_user_id));
  const mutual = reverseInterests.filter((r) => myInterestCompanyUsers.has(r.from_user_id));

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-amber-700"><Sparkles className="h-5 w-5" /><span className="text-sm font-medium">Your matches</span></div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Explainable AI matching 🎯</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Roles ranked by a transparent score — hard filters first, then weighted compatibility. Express interest to start a mutual match.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {mutual.length > 0 && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50/60 p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-green-800"><Link2 className="h-5 w-5" /> Mutual matches ({mutual.length})</h2>
            <p className="mt-1 text-sm text-green-700">You and these companies both expressed interest — time to connect!</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {mutual.map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white px-3 py-1.5 text-sm font-medium text-green-800"><Heart className="h-3.5 w-3.5 fill-green-500 text-green-500" /> {m.from_name}</span>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-display text-xl font-bold">Ranked opportunities</h2>
        {matches.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-12 text-center"><p className="text-muted-foreground">No matches right now. New roles are posted regularly — check back soon.</p></div>
        ) : (
          <div className="mt-4 space-y-3">
            {matches.map((m) => {
              const j = m.job;
              return (
                <div key={j.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${m.score >= 70 ? "bg-green-500" : m.score >= 40 ? "bg-amber-500" : "bg-muted-foreground"}`}>{m.score}</span>
                        <div>
                          <Link to={`/jobs?id=${j.id}`} className="font-semibold hover:text-amber-700">{j.title}</Link>
                          <p className="text-xs text-muted-foreground">{j.company_name} · <MapPin className="inline h-3 w-3" /> {j.location || "Japan"} · {j.remote_type}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.reasons.map((r, i) => <span key={i} className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] text-green-700">{r}</span>)}
                      </div>
                    </div>
                    {j.company_user_id && (
                      <InterestButton toUser={j.company_user_id} toType="company" toProfileId={j.company_id} toName={j.company_name} jobId={j.id} label="I'm interested" small />
                    )}
                  </div>
                  <button onClick={() => setExpanded((e) => ({ ...e, [j.id]: !e[j.id] }))} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                    {expanded[j.id] ? <><ChevronUp className="h-3.5 w-3.5" /> Hide breakdown</> : <><ChevronDown className="h-3.5 w-3.5" /> Why this score?</>}
                  </button>
                  {expanded[j.id] && (
                    <div className="mt-2 space-y-1.5 rounded-xl bg-muted/40 p-3">
                      {m.breakdown.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-28 text-muted-foreground">{b.label}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (b.value / 30) * 100)}%` }} /></div>
                          <span className="w-8 text-right font-medium">+{b.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}