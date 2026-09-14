import React from "react";
import { Check, Sparkles, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { isPremium, PLAN_TIERS } from "@/lib/subscription";

export default function PlanCard({ profile, type, onDowngrade }) {
  const current = profile?.plan || "free";
  const tiers = PLAN_TIERS[type] || PLAN_TIERS.talent;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-amber-500" />
        <h2 className="font-display text-lg font-bold">Your plan</h2>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${isPremium(profile) ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>
          {tiers.find((t) => t.id === current)?.name || "Free"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {tiers.map((t) => {
          const isCurrent = current === t.id;
          const isPaid = t.id !== "free";
          return (
            <div key={t.id} className={`relative rounded-xl border p-5 ${isCurrent ? "border-foreground bg-muted/30" : isPaid ? "border-amber-200 bg-amber-50/50" : "border-border"}`}>
              {t.id === "premium" && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white"><Crown className="h-3 w-3" /> POPULAR</span>}
              <div className="flex items-center gap-1.5">
                {isPaid && <Sparkles className="h-4 w-4 text-amber-500" />}
                <p className="font-display text-base font-bold">{t.name}</p>
              </div>
              <p className="text-sm text-muted-foreground">¥{t.price.toLocaleString()}{t.price > 0 ? " / month" : ""}</p>
              <ul className="mt-3 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs"><Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPaid ? "text-amber-600" : "text-muted-foreground"}`} /> {f}</li>
                ))}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <span className="inline-flex h-9 w-full items-center justify-center rounded-full border border-border text-sm font-medium">Current plan</span>
                ) : isPaid ? (
                  <Link to={`/checkout?plan=${t.id}`} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-foreground text-sm font-medium text-background"><Sparkles className="h-3.5 w-3.5" /> {isPremium(profile) ? "Switch" : "Upgrade"}</Link>
                ) : (
                  <button onClick={onDowngrade} className="inline-flex h-9 w-full items-center justify-center rounded-full border border-border text-sm font-medium hover:bg-accent">Switch to Free</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {profile?.premium_until && isPremium(profile) && <p className="mt-4 text-xs text-muted-foreground">Paid plan active until {profile.premium_until}</p>}
      {isPremium(profile) && <p className="mt-2 text-xs text-muted-foreground">Want to change tier? Use the buttons above — upgrades go through checkout.</p>}
    </div>
  );
}