import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Sparkles, ShieldCheck, Compass, Handshake, Briefcase, Users, MapPin, Star } from "lucide-react";
import { useLang } from "@/lib/i18n";
import LogoCarousel from "@/components/LogoCarousel";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [jobCount, setJobCount] = useState(null);
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [companies, setCompanies] = useState({});
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) {
        base44.auth.me().then((u) => {
          setUser(u);
          setAuthReady(true);
          if (!u.account_type) { navigate("/get-started", { replace: true }); return; }
          const dest = u.account_type === "talent" || u.account_type === "company" ? "/newsfeed" : u.role === "admin" ? "/admin/dashboard" : null;
          if (dest) navigate(dest, { replace: true });
        }).catch(() => setAuthReady(true));
      } else { setAuthReady(true); }
    });
    base44.entities.Job.filter({ status: "active" }, "-created_date", 3)
      .then((jobs) => setFeaturedJobs(jobs))
      .catch(() => {});
    base44.entities.Job.list().then((all) => setJobCount(all.length)).catch(() => {});
    base44.entities.CompanyProfile.list("-created_date", 200).then((c) => {
      const map = {};
      c.forEach((co) => { map[co.id] = co; if (co.company_name && !map[co.company_name]) map[co.company_name] = co; });
      setCompanies(map);
    }).catch(() => {});
  }, [navigate]);

  const steps = [
    { icon: Users, title: t("home.s1t"), desc: t("home.s1d") },
    { icon: Sparkles, title: t("home.s2t"), desc: t("home.s2d") },
    { icon: Handshake, title: t("home.s3t"), desc: t("home.s3d") },
    { icon: Briefcase, title: t("home.s4t"), desc: t("home.s4d") },
  ];

  const pillars = [
    { icon: Sparkles, title: t("home.p1t"), desc: t("home.p1d") },
    { icon: ShieldCheck, title: t("home.p2t"), desc: t("home.p2d") },
    { icon: Compass, title: t("home.p3t"), desc: t("home.p3d") },
    { icon: Handshake, title: t("home.p4t"), desc: t("home.p4d") },
  ];

  const talentBullets = [t("home.ftb1"), t("home.ftb2"), t("home.ftb3"), t("home.ftb4")];
  const companyBullets = [t("home.fcb1"), t("home.fcb2"), t("home.fcb3"), t("home.fcb4")];

  if (!authReady || user) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-50/60 via-background to-background" />
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800">
              <Sparkles className="h-3.5 w-3.5" /> {t("home.badge")}
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("home.hero1")} <span className="text-amber-700">{t("home.heroHighlight")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{t("home.heroSub")}</p>

            {authReady && !user && (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register?role=talent" className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-base font-medium text-background transition-opacity hover:opacity-90">
                {t("home.ctaTalent")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/register?role=company" className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-background px-7 text-base font-medium transition-colors hover:bg-accent">
                {t("home.ctaCompany")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            )}
            <p className="mt-6 text-sm text-muted-foreground">{t("home.freeNote")}</p>
          </div>
        </div>
      </section>

      {/* Trust bar — animated carousel */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">{t("home.trusted")}</p>
          <div className="mt-6"><LogoCarousel /></div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("home.howTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("home.howSub")}</p>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="absolute right-5 top-5 text-sm font-medium text-muted-foreground/40">0{i + 1}</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><s.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Africa × Japan */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Why Africa × Japan</h2>
            <p className="mt-4 text-muted-foreground">Japan faces a growing talent shortage. Africa holds the world's youngest, most ambitious pool of engineers, designers, and graduates. Together it's a perfect complement — and we make the connection trusted and human.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-card p-4"><p className="font-display text-2xl font-bold text-amber-700">1.4B</p><p className="text-xs text-muted-foreground">People in Africa</p></div>
              <div className="rounded-2xl border border-border bg-card p-4"><p className="font-display text-2xl font-bold text-amber-700">200K+</p><p className="text-xs text-muted-foreground">Tech roles open in Japan</p></div>
            </div>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Why choose AfriTalent</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" /> Curated, explainable matching — not a faceless job board.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" /> Verified talent &amp; verified companies for mutual trust.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" /> Visa sponsorship guidance &amp; relocation support.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" /> Free for talent — always. Premium tools when you want more.</li>
            </ul>
            {authReady && !user && <Link to="/register?role=talent" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background">Join as talent <ArrowRight className="h-4 w-4" /></Link>}
          </div>
        </div>
      </section>

      {/* Why AfriTalent */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("home.whyTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{t("home.whySub")}</p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-background p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background"><p.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split: For Talent / For Companies */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-8 sm:p-10">
            <Users className="h-8 w-8 text-amber-700" />
            <h3 className="mt-5 font-display text-2xl font-bold">{t("home.ftTitle")}</h3>
            <p className="mt-3 text-muted-foreground">{t("home.ftDesc")}</p>
            <ul className="mt-6 space-y-3 text-sm">
              {talentBullets.map((b) => <li key={b} className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-600" /> {b}</li>)}
            </ul>
            {authReady && !user && <Link to="/register?role=talent" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-amber-700 px-6 text-sm font-medium text-white transition-opacity hover:opacity-90">
              I'm Looking for Work <ArrowRight className="h-4 w-4" />
            </Link>}
          </div>
          <div className="rounded-3xl border border-border bg-foreground p-8 text-background sm:p-10">
            <Briefcase className="h-8 w-8" />
            <h3 className="mt-5 font-display text-2xl font-bold">{t("home.fcTitle")}</h3>
            <p className="mt-3 text-background/70">{t("home.fcDesc")}</p>
            <ul className="mt-6 space-y-3 text-sm text-background/80">
              {companyBullets.map((b) => <li key={b} className="flex items-center gap-2"><Star className="h-4 w-4" /> {b}</li>)}
            </ul>
            {authReady && !user && <Link to="/register?role=company" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-background px-6 text-sm font-medium text-foreground transition-opacity hover:opacity-90">
              I'm Hiring Talent <ArrowRight className="h-4 w-4" />
            </Link>}
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">{t("home.featTitle")}</h2>
              <p className="mt-3 text-muted-foreground">{t("home.featSub")}</p>
            </div>
            <Link to="/jobs" className="hidden items-center gap-1 text-sm font-medium sm:inline-flex">{t("home.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {featuredJobs.length === 0 ? (
              <p className="text-muted-foreground">{t("home.newRoles")}</p>
            ) : featuredJobs.map((j) => {
              const co = companies[j.company_id] || companies[j.company_name];
              return (
                <Link key={j.id} to={`/jobs?id=${j.id}`} className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {j.location || "Japan"} · {j.remote_type}</div>
                  <h3 className="mt-3 font-semibold group-hover:text-amber-700">{j.title}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    {co?.logo_url ? <img src={co.logo_url} alt="" className="h-5 w-5 rounded object-cover" /> : <div className="h-5 w-5 rounded bg-foreground/10" />}
                    <p className="text-sm text-muted-foreground">{j.company_name}</p>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            { v: "2,400+", l: t("home.stat1") },
            { v: "180+", l: t("home.stat2") },
            { v: "32", l: t("home.stat3") },
            { v: jobCount !== null ? `${jobCount}` : "—", l: t("home.stat4") },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-display text-3xl font-bold sm:text-4xl">{s.v}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 via-amber-50 to-background p-10 sm:p-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("home.finalTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{t("home.finalSub")}</p>
            {authReady && !user && (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register?role=talent" className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-base font-medium text-background transition-opacity hover:opacity-90">{t("home.ctaTalent")}</Link>
              <Link to="/register?role=company" className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-background px-7 text-base font-medium transition-colors hover:bg-accent">{t("home.ctaCompany")}</Link>
            </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}