import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Menu, X, Globe, LogOut, LayoutDashboard, UserCircle, Bell, Mail, ChevronDown, Bookmark, Briefcase, Users, Lightbulb, Rss, FileText, Info, Phone } from "lucide-react";
import { useLang } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AfricaLogo from "@/components/AfricaLogo";

function NavDropdown({ label, items, onClose }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        {label} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-2">
          <div className="w-44 rounded-xl border border-border bg-popover p-2 shadow-lg">
            {items.map((it) => (
              <NavLink key={it.path} to={it.path} onClick={onClose} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {it.icon && <it.icon className="h-4 w-4" />} {it.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [unread, setUnread] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLang();

  const refresh = () => {
    base44.auth.isAuthenticated().then((authed) => {
      if (!authed) { setUser(null); setProfile(null); setUnread(0); return; }
      base44.auth.me().then((u) => {
        setUser(u);
        if (u?.account_type === "talent") base44.entities.TalentProfile.filter({ user_id: u.id }).then((p) => setProfile(p[0] || null)).catch(() => {});
        else if (u?.account_type === "company") base44.entities.CompanyProfile.filter({ user_id: u.id }).then((p) => setProfile(p[0] || null)).catch(() => {});
        base44.entities.Notification.filter({ user_id: u.id, read: false }, "-created_date", 50).then((n) => setUnread(n.length)).catch(() => {});
        base44.entities.Message.filter({ to_user_id: u.id, read: false }, "-created_date", 50).then((m) => setUnreadMsgs(m.length)).catch(() => {});
      }).catch(() => {});
    });
  };
  useEffect(refresh, [location.pathname]);
  useEffect(() => {
    const unsubN = base44.entities.Notification.subscribe(() => refresh());
    const unsubM = base44.entities.Message.subscribe(() => refresh());
    return () => { unsubN?.(); unsubM?.(); };
  }, []);

  const handleLogout = async () => { await base44.auth.logout(); setUser(null); setProfile(null); navigate("/"); };

  const discover = [{ label: t("nav.jobs"), path: "/jobs", icon: Briefcase }, { label: t("nav.talent"), path: "/talents", icon: Users }];
  const community = [{ label: "Challenges", path: "/challenges", icon: Lightbulb }, { label: "Connect", path: "/connect", icon: Rss }];
  const resources = [{ label: "Blog", path: "/blog", icon: FileText }, { label: t("nav.about"), path: "/about", icon: Info }];

  const dashboardPath = user?.account_type === "company" ? "/company/dashboard" : user?.account_type === "talent" ? "/talent/dashboard" : user?.role === "admin" ? "/admin/dashboard" : null;
  const profilePath = user?.account_type === "company" ? "/company/profile" : user?.account_type === "talent" ? "/talent/profile" : null;
  const avatarUrl = user?.account_type === "talent" ? profile?.photo_url : user?.account_type === "company" ? profile?.logo_url : null;
  const initials = (user?.full_name || user?.email || "?").charAt(0).toUpperCase();

  const publicProfilePath = user?.account_type === "talent" && profile ? `/talent/${profile.id}` : user?.account_type === "company" && profile ? `/company/${profile.id}` : null;
  const menuItems = user?.account_type === "talent"
    ? [{ label: "Dashboard", path: "/talent/dashboard", icon: LayoutDashboard }, { label: "My Profile", path: "/talent/profile", icon: UserCircle }, { label: "Messages", path: "/messages", icon: Mail }, { label: "Saved", path: "/saved", icon: Bookmark }]
    : user?.account_type === "company"
      ? [{ label: "Dashboard", path: "/company/dashboard", icon: LayoutDashboard }, { label: "Company Profile", path: "/company/profile", icon: UserCircle }, { label: "Post a Job", path: "/company/post-job", icon: Briefcase }, { label: "Messages", path: "/messages", icon: Mail }, { label: "Saved", path: "/saved", icon: Bookmark }]
      : user?.role === "admin" ? [{ label: "Admin Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }] : [];
  if (publicProfilePath) menuItems.splice(1, 0, { label: "View public profile", path: publicProfilePath, icon: Globe });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" onClick={() => setOpen(false)}><AfricaLogo size={36} /></Link>

        {!user && (
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/how-it-works" className={({ isActive }) => `relative text-sm font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
            {({ isActive }) => <>{t("nav.howItWorks")}{isActive && <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-amber-500" />}</>}
          </NavLink>
          <NavDropdown label="Discover" items={discover} onClose={() => {}} />
          <NavDropdown label="Community" items={community} onClose={() => {}} />
          <NavDropdown label="Resources" items={resources} onClose={() => {}} />
          <NavLink to="/contact" className={({ isActive }) => `relative text-sm font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
            {({ isActive }) => <>{t("nav.contact")}{isActive && <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-amber-500" />}</>}
          </NavLink>
        </nav>
        )}

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {user && (
            <>
              <Link to="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent" aria-label="Notifications">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
              </Link>
              <Link to="/messages" className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent" aria-label="Messages">
                <Mail className="h-5 w-5 text-muted-foreground" />
                {unreadMsgs > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unreadMsgs > 99 ? "99+" : unreadMsgs}</span>}
              </Link>
            </>
          )}
          {!user ? (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t("nav.signIn")}</Link>
              <Link to="/get-started" className="inline-flex h-9 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90">{t("nav.getStarted")}</Link>
            </>
          ) : (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-foreground text-background ring-2 ring-transparent transition hover:ring-border">
                {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-sm font-bold">{initials}</span>}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg">
                    <div className="px-3 py-2"><p className="truncate text-sm font-medium">{user?.full_name || "Account"}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div>
                    <div className="my-1 border-t border-border" />
                    {menuItems.map((m) => <Link key={m.path} to={m.path} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"><m.icon className="h-4 w-4" /> {m.label}</Link>)}
                    <div className="my-1 border-t border-border" />
                    <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-accent"><LogOut className="h-4 w-4" /> {t("nav.signOut")}</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user && <Link to="/notifications" className="relative flex h-9 w-9 items-center justify-center" aria-label="Notifications"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}</Link>}
          <LanguageSwitcher />
          <button onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col px-4 py-4">
            {!user && (<>
            <NavLink to="/how-it-works" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">How It Works</NavLink>
            <p className="mt-2 text-xs font-bold uppercase text-muted-foreground">Discover</p>
            {discover.map((l) => <NavLink key={l.path} to={l.path} onClick={() => setOpen(false)} className="py-2 pl-3 text-sm">{l.label}</NavLink>)}
            <p className="mt-2 text-xs font-bold uppercase text-muted-foreground">Community</p>
            {community.map((l) => <NavLink key={l.path} to={l.path} onClick={() => setOpen(false)} className="py-2 pl-3 text-sm">{l.label}</NavLink>)}
            <p className="mt-2 text-xs font-bold uppercase text-muted-foreground">Resources</p>
            {resources.map((l) => <NavLink key={l.path} to={l.path} onClick={() => setOpen(false)} className="py-2 pl-3 text-sm">{l.label}</NavLink>)}
            <NavLink to="/contact" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{t("nav.contact")}</NavLink>
            </>)}
            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-4">
              {!user ? (
                <>
                  <Link to="/login" className="py-2 text-sm font-medium" onClick={() => setOpen(false)}>{t("nav.signIn")}</Link>
                  <Link to="/get-started" className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background" onClick={() => setOpen(false)}>{t("nav.getStarted")}</Link>
                </>
              ) : (
                <>
                  {menuItems.map((m) => <Link key={m.path} to={m.path} className="py-2 text-sm font-medium" onClick={() => setOpen(false)}>{m.label}</Link>)}
                  <Link to="/notifications" className="py-2 text-sm font-medium" onClick={() => setOpen(false)}>Notifications {unread > 0 && `(${unread})`}</Link>
                  <button onClick={() => { handleLogout(); setOpen(false); }} className="py-2 text-left text-sm font-medium text-muted-foreground">{t("nav.signOut")}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}