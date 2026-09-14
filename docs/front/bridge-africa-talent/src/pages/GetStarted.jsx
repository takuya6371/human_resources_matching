import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, Briefcase, ArrowRight } from "lucide-react";

export default function GetStarted() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.isAuthenticated().then((a) => {
      if (a) {
        base44.auth.me().then((u) => {
          setUser(u);
          setLoading(false);
          if (u.account_type) {
            navigate(u.account_type === "talent" ? "/talent/onboarding" : u.account_type === "company" ? "/company/onboarding" : "/admin/dashboard", { replace: true });
          }
        }).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [navigate]);

  const choose = (role) => {
    if (user) {
      base44.auth.updateMe({ account_type: role }).then(() => {
        navigate(role === "talent" ? "/talent/onboarding" : "/company/onboarding");
      });
    } else {
      navigate(`/register?role=${role}`);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight">How would you like to join?</h1>
        <p className="mt-4 text-muted-foreground">Choose the path that fits you. You can always switch later.</p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <button onClick={() => choose("talent")} className="group rounded-3xl border border-amber-200 bg-amber-50/50 p-8 text-left transition-all hover:border-amber-400 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-700 text-white"><Users className="h-6 w-6" /></div>
          <h2 className="mt-5 font-display text-xl font-bold">I'm a Talent</h2>
          <p className="mt-2 text-sm text-muted-foreground">I'm an African professional or graduate looking for opportunities with Japanese companies.</p>
          <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-amber-700">Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </button>
        <button onClick={() => choose("company")} className="group rounded-3xl border border-border bg-foreground p-8 text-left text-background transition-all hover:opacity-90 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background text-foreground"><Briefcase className="h-6 w-6" /></div>
          <h2 className="mt-5 font-display text-xl font-bold">I'm a Company</h2>
          <p className="mt-2 text-sm text-background/70">I represent a Japanese company looking to hire skilled African talent.</p>
          <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium">Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </button>
      </div>
      {user && <p className="mt-8 text-center text-sm text-muted-foreground">Signed in as {user.email} · <Link to="/login" className="underline">switch account</Link></p>}
    </div>
  );
}