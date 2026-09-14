import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, MapPin, Briefcase, Building2, ArrowLeft, Send, Lock, Plus, Crown } from "lucide-react";
import { isPremium, getApplicationsThisMonth, FREE_MONTHLY_APPLICATIONS } from "@/lib/subscription";
import { PremiumTag } from "@/components/Badges";
import FollowButton from "@/components/FollowButton";
import SaveButton from "@/components/SaveButton";

export default function Jobs() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("id");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRemote, setFilterRemote] = useState("all");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterJlpt, setFilterJlpt] = useState("all");
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  const [talentProfile, setTalentProfile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const [quotaError, setQuotaError] = useState(false);
  const [companies, setCompanies] = useState({});

  useEffect(() => {
    base44.entities.Job.filter({ status: "active" }, "-created_date", 100)
      .then((j) => { setJobs(j); setLoading(false); })
      .catch(() => setLoading(false));
    base44.entities.CompanyProfile.list("-created_date", 200).then((c) => {
      const map = {};
      c.forEach((co) => { map[co.id] = co; if (co.company_name && !map[co.company_name]) map[co.company_name] = co; });
      setCompanies(map);
    }).catch(() => {});
    base44.auth.isAuthenticated().then((a) => {
      if (a) base44.auth.me().then((u) => {
        setUser(u);
        if (u?.account_type === "talent") {
          base44.entities.TalentProfile.filter({ user_id: u.id }).then((p) => {
            setTalentProfile(p[0] || null);
            if (p[0]) getApplicationsThisMonth(p[0].id).then(setUsedThisMonth);
          });
        }
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      const j = jobs.find((x) => x.id === selectedId);
      if (j) setSelected(j);
    } else {
      setSelected(null);
    }
  }, [selectedId, jobs]);

  const industries = ["all", ...Array.from(new Set(jobs.map((j) => j.industry).filter(Boolean)))];
  const filtered = jobs.filter((j) => {
    const matchesSearch = !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchesRemote = filterRemote === "all" || j.remote_type === filterRemote;
    const matchesLocation = !filterLocation || (j.location || "").toLowerCase().includes(filterLocation.toLowerCase());
    const matchesIndustry = filterIndustry === "all" || j.industry === filterIndustry;
    const matchesJlpt = filterJlpt === "all" || j.jlpt_required === filterJlpt;
    return matchesSearch && matchesRemote && matchesLocation && matchesIndustry && matchesJlpt;
  });

  const apply = async () => {
    if (!talentProfile) return;
    const allowed = FREE_MONTHLY_APPLICATIONS + (talentProfile.credits || 0);
    if (!isPremium(talentProfile) && usedThisMonth >= allowed) { setQuotaError(true); return; }
    setApplying(true);
    try {
      await base44.entities.Application.create({
        talent_id: talentProfile.id,
        talent_name: talentProfile.full_name,
        job_id: selected.id,
        job_title: selected.title,
        company_id: selected.company_id,
        company_name: selected.company_name,
        cover_letter: coverLetter,
        status: "applied",
      });
      setApplied(true);
      setCoverLetter("");
    } catch (e) {
      alert("Could not submit application. " + (e?.message || ""));
    }
    setApplying(false);
  };

  if (selected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <button onClick={() => setParams({})} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {selected.location || "Japan"} · {selected.remote_type}</div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">{selected.title}</h1>
          <SaveButton itemType="job" item={selected} />
        </div>
        <div className="mt-1 flex items-center gap-2">
          {(companies[selected.company_id] || companies[selected.company_name])?.logo_url && <img src={(companies[selected.company_id] || companies[selected.company_name]).logo_url} alt="" className="h-7 w-7 rounded object-cover" />}
          <Link to={`/company/${selected.company_id}`} className="flex items-center gap-1.5 text-lg text-muted-foreground hover:underline">{selected.company_name}{isPremium(companies[selected.company_id] || companies[selected.company_name]) && <Crown className="h-3.5 w-3.5 text-amber-500" />}</Link>
        </div>
        <div className="mt-3"><FollowButton targetType="company" targetId={selected.company_id} targetName={selected.company_name} /></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {selected.visa_sponsorship && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">Visa sponsorship</span>}
          {selected.jlpt_required !== "none" && <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">JLPT {selected.jlpt_required}</span>}
          {selected.salary_range && <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{selected.salary_range}</span>}
        </div>

        <div className="mt-8 prose max-w-none">
          <h2 className="font-display text-lg font-semibold text-foreground">About the role</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{selected.description}</p>
          {selected.requirements && (<><h2 className="mt-6 font-display text-lg font-semibold text-foreground">Requirements</h2><p className="text-muted-foreground whitespace-pre-wrap">{selected.requirements}</p></>)}
          {selected.language_requirements && (<><h2 className="mt-6 font-display text-lg font-semibold text-foreground">Language requirements</h2><p className="text-muted-foreground">{selected.language_requirements}</p></>)}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          {applied ? (
            <p className="text-sm font-medium text-green-700">Application submitted! Track its status from your dashboard.</p>
          ) : !user ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Sign in as talent to apply for this role.</p>
              <Link to="/get-started?role=talent" className="mt-3 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">Get started</Link>
            </div>
          ) : user.account_type !== "talent" ? (
            <p className="text-sm text-muted-foreground">Only talent accounts can apply for roles.</p>
          ) : !talentProfile ? (
            <p className="text-sm text-muted-foreground">Complete your talent profile first to apply.</p>
          ) : quotaError ? (
            <div className="text-center">
              <Lock className="mx-auto h-8 w-8 text-amber-500" />
              <p className="mt-2 text-sm font-medium">You've used all {FREE_MONTHLY_APPLICATIONS + (talentProfile.credits || 0)} free applications this month.</p>
              <p className="mt-1 text-xs text-muted-foreground">Upgrade to Premium for unlimited applications, or earn credits to apply more.</p>
              <Link to="/talent/profile" className="mt-4 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">Manage your plan</Link>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold">Apply for this role</h3>
              {!isPremium(talentProfile) && (
                <p className="mt-1 text-xs text-muted-foreground">{Math.max(0, FREE_MONTHLY_APPLICATIONS + (talentProfile.credits || 0) - usedThisMonth)} free application{Math.max(0, FREE_MONTHLY_APPLICATIONS + (talentProfile.credits || 0) - usedThisMonth) !== 1 ? "s" : ""} left this month</p>
              )}
              <textarea rows={4} placeholder="Add a cover note (optional)" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <button onClick={apply} disabled={applying} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50">
                <Send className="h-4 w-4" /> {applying ? "Submitting..." : "Submit application"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-4xl font-bold tracking-tight">Open opportunities</h1>
            {user?.account_type === "company"
              ? <Link to="/company/post-job" className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background"><Plus className="h-4 w-4" /> Post a job</Link>
              : !user && <Link to="/register?role=company" className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background"><Plus className="h-4 w-4" /> Post a job</Link>}
          </div>
          <p className="mt-3 text-muted-foreground">Browse roles from verified Japanese companies.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roles or companies" className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4" />
            </div>
            <select value={filterRemote} onChange={(e) => setFilterRemote(e.target.value)} className="h-11 rounded-full border border-input bg-background px-4">
              <option value="all">All work types</option>
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="h-11 rounded-full border border-input bg-background px-4">
              {industries.map((i) => <option key={i} value={i}>{i === "all" ? "All industries" : i}</option>)}
            </select>
            <select value={filterJlpt} onChange={(e) => setFilterJlpt(e.target.value)} className="h-11 rounded-full border border-input bg-background px-4">
              <option value="all">Any JLPT</option>
              {["N5", "N4", "N3", "N2", "N1"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <input value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} placeholder="Location" className="h-11 rounded-full border border-input bg-background px-4" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-muted-foreground">Loading opportunities...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No roles match your search right now. New roles are posted regularly.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((j) => (
              <div key={j.id} onClick={() => setParams({ id: j.id })} className="cursor-pointer text-left rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {(companies[j.company_id] || companies[j.company_name])?.logo_url ? <img src={(companies[j.company_id] || companies[j.company_name]).logo_url} alt="" className="h-4 w-4 rounded object-cover" /> : <Building2 className="h-3.5 w-3.5" />}
                  <Link to={`/company/${j.company_id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{j.company_name}</Link>{isPremium(companies[j.company_id] || companies[j.company_name]) && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                </div>
                <h3 className="mt-2 font-semibold">{j.title}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {j.location || "Japan"} · {j.remote_type}</div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
                {j.visa_sponsorship && <span className="mt-3 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">Visa sponsorship</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}