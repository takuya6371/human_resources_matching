import React, { useState } from "react";
import { Copy, Check, Gift, UserPlus, CalendarCheck, Sparkles } from "lucide-react";
import { getReferralLink, CREDIT_RULES } from "@/lib/credits";

const ICONS = { UserPlus, Gift, CalendarCheck };

export default function CreditEarning({ profile }) {
  const [copied, setCopied] = useState(false);
  const link = getReferralLink(profile?.id);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h3 className="font-display text-lg font-bold">Earn credits</h3>
        <span className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">{profile?.credits || 0} credits</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">1 credit = 1 extra application. Run out of free applications? Earn more below.</p>

      <div className="mt-4 space-y-2">
        {CREDIT_RULES.map((r) => {
          const Icon = ICONS[r.icon] || Gift;
          return (
            <div key={r.title} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Icon className="h-4 w-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">+{r.amount}</span>
            </div>
          );
        })}
      </div>

      {link && (
        <div className="mt-4">
          <p className="text-xs font-medium">Your referral link</p>
          <div className="mt-1.5 flex items-center gap-2">
            <input readOnly value={link} className="h-9 flex-1 truncate rounded-lg border border-input bg-background px-3 text-xs" />
            <button onClick={copy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background">
              {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}