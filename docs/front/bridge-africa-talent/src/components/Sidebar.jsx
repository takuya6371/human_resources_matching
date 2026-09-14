import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";

export default function Sidebar() {
  const { t } = useLang();
  const [user, setUser] = useState(null);
  const [unreadN, setUnreadN] = useState(0);
  const [unreadM, setUnreadM] = useState(0);
  const [feedNew, setFeedNew] = useState(0);
  const location = useLocation();

  const refresh = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const [n, m] = await Promise.all([
        base44.entities.Notification.filter({ user_id: u.id, read: false }, "-created_date", 100).catch(() => []),
        base44.entities.Message.filter({ to_user_id: u.id, read: false }, "-created_date", 100).catch(() => []),
      ]);
      setUnreadN(n.length);
      setUnreadM(m.length);
      setFeedNew(n.filter((x) => ["challenge", "opportunity", "idea"].includes(x.type)).length);
    } catch {}
  };

  useEffect(() => {
    refresh();
    const unsubN = base44.entities.Notification.subscribe(refresh);
    const unsubM = base44.entities.Message.subscribe(refresh);
    return () => { unsubN?.(); unsubM?.(); };
  }, []);

  if (!user || location.pathname.startsWith("/admin")) return null;

  const dashboardPath = user?.account_type === "company" ? "/company/dashboard" : user?.account_type === "talent" ? "/talent/dashboard" : "/";
  const profilePath = user?.account_type === "company" ? "/company/profile" : "/talent/profile";
  const items = [
    { to: "/newsfeed", bi: "bi-house-door-fill", label: t("sidebar.home"), badge: feedNew },
    { to: dashboardPath, bi: "bi-grid", label: t("sidebar.dashboard") },
    { to: "/jobs", bi: "bi-briefcase", label: t("sidebar.jobs") },
    { to: "/talents", bi: "bi-people", label: t("sidebar.talent") },
    { to: "/connect", bi: "bi-rss", label: t("sidebar.connect"), badge: feedNew },
    { to: "/challenges", bi: "bi-lightbulb", label: t("sidebar.challenges"), badge: feedNew },
    { to: "/messages", bi: "bi-chat-dots", label: t("sidebar.messages"), badge: unreadM },
    { to: "/notifications", bi: "bi-bell", label: t("sidebar.notifications"), badge: unreadN },
    { to: "/saved", bi: "bi-bookmark", label: t("sidebar.saved") },
    { to: profilePath, bi: "bi-person-circle", label: t("sidebar.profile") },
  ];

  return (
    <aside className="group fixed left-0 top-16 bottom-0 z-30 hidden w-16 flex-col border-r border-border bg-background/95 backdrop-blur transition-all duration-200 hover:w-60 md:flex">
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.map((it) => {
          const active = location.pathname === it.to;
          return (
            <Link key={it.to + it.label} to={it.to} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <span className="relative shrink-0">
                <i className={`bi ${it.bi} text-lg`} />
                {it.badge > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{it.badge > 99 ? "99+" : it.badge}</span>}
              </span>
              <span className="whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}