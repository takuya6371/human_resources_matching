import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";
import AfricaLogo from "@/components/AfricaLogo";

export default function Footer() {
  const { t } = useLang();
  const [authed, setAuthed] = useState(false);
  useEffect(() => { base44.auth.isAuthenticated().then(setAuthed); }, []);

  const cols = [
    { title: t("footer.platform"), links: [{ label: t("footer.howItWorks"), path: "/how-it-works" }, { label: t("footer.jobs"), path: "/jobs" }, { label: t("footer.getStarted"), path: "/get-started" }] },
    { title: t("footer.company"), links: [{ label: t("footer.about"), path: "/about" }, { label: t("footer.contact"), path: "/contact" }, { label: t("footer.blog"), path: "/blog" }] },
    { title: t("footer.legal"), links: [{ label: t("footer.privacy"), path: "/privacy" }, { label: t("footer.terms"), path: "/terms" }] },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {!authed && (
            <div className="col-span-2 md:col-span-1">
              <Link to="/"><AfricaLogo size={36} /></Link>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">Connecting Africa's talent with Japan's companies. A curated bridge between ambition and opportunity.</p>
            </div>
          )}
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold">{c.title}</h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => <li key={l.label}><Link to={l.path} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{l.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} AfriTalent. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}