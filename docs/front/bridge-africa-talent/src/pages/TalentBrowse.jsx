import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, MapPin, Lock } from "lucide-react";
import { VerifiedTick } from "@/components/Badges";
import { isPremium } from "@/lib/subscription";
import { getCountryInfo, getCountryFlagUrl } from "@/lib/countries";
import FollowButton from "@/components/FollowButton";
import MessageButton from "@/components/MessageButton";
import InterestButton from "@/components/InterestButton";
import ReputationBadges from "@/components/ReputationBadges";

export default function TalentBrowse() {
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [viewer, setViewer] = useState(null);
  const [viewerProfile, setViewerProfile] = useState(null);

  useEffect(() => {
    base44.entities.TalentProfile.filter({ status: "approved" }, "-created_date", 200)
      .then((t) => { setTalents(t.filter((x) => x.profile_completed)); setLoading(false); })
      .catch(() => setLoading(false));
    base44.auth.isAuthenticated().then((a) => {
      if (!a) return;
      base44.auth.me().then((u) => {
        setViewer(u);
        if (u?.account_type === "company") {
          base44.entities.CompanyProfile.filter({ user_id: u.id }).then((p) => setViewerProfile(p[0] || null));
        }
      }).catch(() => {});
    });
  }, []);

  const industries = ["all", ...Array.from(new Set(talents.map((t) => t.industry).filter(Boolean)))];
  const filtered = talents.filter((t) => {
    const ms = !search || t.full_name?.toLowerCase().includes(search.toLowerCase()) || t.headline?.toLowerCase().includes(search.toLowerCase()) || t.skills?.toLowerCase().includes(search.toLowerCase());
    const mi = filterIndustry === "all" || t.industry === filterIndustry;
    return ms && mi;
  });

  const viewerPremium = isPremium(viewerProfile);

  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold tracking-tight">Browse talent</h1>
          <p className="mt-3 text-muted-foreground">Verified African professionals ready for opportunities in Japan.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, headline or skill" className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4" />
            </div>
            <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="h-11 rounded-full border border-input bg-background px-4">
              {industries.map((i) => <option key={i} value={i}>{i === "all" ? "All industries" : i}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-muted-foreground">Loading talent...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No talent profiles match your search yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {filtered.map((t) => {
              const countryInfo = getCountryInfo(t.country_of_residence || t.nationality);
              const flagUrl = getCountryFlagUrl(t.country_of_residence || t.nationality);
              return (
                <div key={t.id} className="flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
                  <Link to={`/talent/${t.id}`} className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground text-background">
                      {t.photo_url ? <img src={t.photo_url} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-lg font-bold">{t.full_name?.charAt(0)}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate font-semibold hover:underline">{t.full_name}</p>
                        {t.profile_completed && <VerifiedTick size={15} />}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{t.headline || t.current_role}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {t.country_of_residence || t.nationality}
                        {flagUrl && <img src={flagUrl} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />}
                      </p>
                    </div>
                  </Link>
                  {t.skills && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {t.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4).map((s, i) => (
                        <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2"><ReputationBadges profile={t} size="xs" /></div>
                  <div className="mt-auto flex items-center justify-end gap-2 pt-3">
                    {t.user_id && <MessageButton toUserId={t.user_id} toName={t.full_name} size="h-8 w-8" />}
                    {viewer?.account_type === "company" && t.user_id && <InterestButton toUser={t.user_id} toType="talent" toProfileId={t.id} toName={t.full_name} small />}
                    <FollowButton targetType="talent" targetId={t.id} targetName={t.full_name} small />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}