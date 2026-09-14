import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, Crown, ShieldCheck, Lock, ArrowLeft, CreditCard } from "lucide-react";
import { isPremium, PLAN_TIERS } from "@/lib/subscription";

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [type, setType] = useState("talent");
  const [plan, setPlan] = useState("premium");
  const [cycle, setCycle] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const t = u.account_type === "company" ? "company" : "talent";
      setType(t);
      const p = t === "company"
        ? await base44.entities.CompanyProfile.filter({ user_id: u.id })
        : await base44.entities.TalentProfile.filter({ user_id: u.id });
      setProfile(p[0] || null);
      const qp = params.get("plan");
      if (qp) setPlan(qp);
      setLoading(false);
    }).catch(() => navigate("/login"));
  }, [navigate]);

  const tiers = PLAN_TIERS[type] || PLAN_TIERS.talent;
  const tier = tiers.find((t) => t.id === plan) || tiers[1];
  const monthly = tier.price;
  const total = cycle === "yearly" ? Math.round(monthly * 12 * 0.85) : monthly;
  const perMonthIfYearly = cycle === "yearly" ? Math.round(total / 12) : monthly;
  const savings = cycle === "yearly" ? monthly * 12 - total : 0;

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (plan === "free") {
      if (!profile) return;
      await base44.entities[type === "company" ? "CompanyProfile" : "TalentProfile"].update(profile.id, { plan: "free", premium_until: null });
      setDone(true);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const until = new Date();
    if (cycle === "yearly") until.setFullYear(until.getFullYear() + 1);
    else until.setMonth(until.getMonth() + 1);
    await base44.entities[type === "company" ? "CompanyProfile" : "TalentProfile"].update(profile.id, {
      plan,
      premium_until: until.toISOString().slice(0, 10),
    });
    setSubmitting(false);
    setDone(true);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700"><Check className="h-8 w-8" /></div>
        <h1 className="mt-6 font-display text-3xl font-bold">{plan === "free" ? "Switched to Free" : "Purchase complete"}</h1>
        <p className="mt-3 text-muted-foreground">{plan === "free" ? "You're on the Free plan." : `You're now on ${tier.name} (${cycle}). Welcome aboard!`}</p>
        <Link to={type === "company" ? "/company/dashboard" : "/talent/dashboard"} className="mt-8 inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to={type === "company" ? "/company/profile" : "/talent/profile"} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h1 className="font-display text-3xl font-bold tracking-tight">Choose your plan</h1>
      <p className="mt-2 text-muted-foreground">Select a plan and billing cycle to continue.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <button key={t.id} onClick={() => setPlan(t.id)} className={`relative rounded-2xl border p-5 text-left transition-colors ${plan === t.id ? (t.id === "free" ? "border-foreground bg-muted/30" : "border-amber-400 bg-amber-50") : (t.id === "free" ? "border-border hover:bg-accent" : "border-amber-200 hover:bg-amber-50/50")}`}>
            {t.id === "premium" && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white"><Crown className="h-3 w-3" /> POPULAR</span>}
            <p className="font-display text-lg font-bold">{t.name}</p>
            <p className="text-sm text-muted-foreground">¥{t.price.toLocaleString()}{t.price > 0 ? " / mo" : ""}</p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {t.features.slice(0, 4).map((f) => <li key={f}>· {f}</li>)}
            </ul>
          </button>
        ))}
      </div>

      {plan !== "free" && (
        <>
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-medium">Billing cycle</p>
            <div className="mt-3 inline-flex rounded-full border border-border bg-muted p-1">
              <button onClick={() => setCycle("monthly")} className={`rounded-full px-5 py-2 text-sm font-medium ${cycle === "monthly" ? "bg-foreground text-background" : "text-muted-foreground"}`}>Monthly</button>
              <button onClick={() => setCycle("yearly")} className={`rounded-full px-5 py-2 text-sm font-medium ${cycle === "yearly" ? "bg-foreground text-background" : "text-muted-foreground"}`}>Yearly · 15% off</button>
            </div>
            {cycle === "yearly" && <p className="mt-3 text-xs text-green-700">You save ¥{savings.toLocaleString()} per year (≈ ¥{perMonthIfYearly.toLocaleString()}/month).</p>}
          </div>

          <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="flex items-center gap-2 text-sm font-medium"><CreditCard className="h-4 w-4" /> Payment method</p>
              <div className="mt-4 space-y-3">
                <div><label className="text-xs text-muted-foreground">Card number</label><input required value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="4242 4242 4242 4242" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div>
                <div><label className="text-xs text-muted-foreground">Name on card</label><input required value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground">Expiry</label><input required value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div>
                  <div><label className="text-xs text-muted-foreground">CVC</label><input required value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="123" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-medium">Order summary</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{tier.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cycle</span><span className="capitalize">{cycle}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>¥{(cycle === "yearly" ? monthly * 12 : monthly).toLocaleString()}</span></div>
                {cycle === "yearly" && <div className="flex justify-between text-green-700"><span>Yearly discount (15%)</span><span>−¥{savings.toLocaleString()}</span></div>}
                <div className="flex justify-between text-green-700"><span>1-month free trial</span><span>¥0</span></div>
                <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold"><span>After trial</span><span>¥{total.toLocaleString()}{cycle === "yearly" ? "/yr" : "/mo"}</span></div>
              </div>
              <button type="submit" disabled={submitting} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background disabled:opacity-50">
                {submitting ? "Processing…" : "Start 1-month free trial"}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Safe &amp; secure · no commitment, cancel anytime</p>
            </div>
          </form>
        </>
      )}

      {plan === "free" && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">You're switching to the Free plan. You can upgrade again anytime.</p>
          <button onClick={submit} className="mt-4 inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background">Confirm switch to Free</button>
        </div>
      )}
    </div>
  );
}