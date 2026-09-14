import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard, Users, Building2, Briefcase, Sparkles, BarChart3, LogOut, Home } from "lucide-react";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/talents", label: "Talent Review", icon: Users },
  { to: "/admin/companies", label: "Company Review", icon: Building2 },
  { to: "/admin/jobs", label: "Job Moderation", icon: Briefcase },
  { to: "/admin/matching", label: "Matching Console", icon: Sparkles },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/team", label: "Team", icon: Users },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u.role !== "admin") { navigate("/", { replace: true }); return; }
      setChecked(true);
    }).catch(() => { navigate("/login", { replace: true }); });
  }, [navigate]);

  const logout = async () => {
    await base44.auth.logout();
    navigate("/");
  };

  if (!checked) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-0 px-0">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/30 md:block">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background"><span className="font-display text-sm font-bold">A</span></div>
          <span className="font-display font-semibold">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-border p-3">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"><Home className="h-4 w-4" /> Back to site</Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>

      <div className="flex-1">
        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-muted/30 px-3 py-2 md:hidden">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${isActive ? "bg-foreground text-background" : "text-muted-foreground"}`}>
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}