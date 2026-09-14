import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronRight, ChevronLeft, Check, Rocket, CreditCard, Lock } from "lucide-react";

const GOALS = ["More Views", "More Engagement", "More Followers", "More Challenge Participants", "More Profile Visits", "More Applications", "More Messages", "More Website Visits"];
const DURATIONS = [{ d: 1, l: "1 Day" }, { d: 3, l: "3 Days" }, { d: 7, l: "7 Days" }, { d: 14, l: "14 Days" }];
const RECOMMENDED = "AI professionals, software developers, and technology companies in Japan";

export default function BoostModal({ open, onClose, post, itemType = "post", user, onDone }) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("More Views");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState(7);
  const [dailyBudget, setDailyBudget] = useState(500);
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  if (!open || !post) return null;
  const total = dailyBudget * duration;
  const label = itemType === "challenge" ? "challenge" : "post";

  const submit = async () => {
    setSubmitting(true);
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + duration);
      await base44.entities.Promotion.create({
        post_id: post.id, post_title: post.title, item_type: itemType,
        owner_id: user.id, owner_name: user.full_name, owner_type: user.account_type,
        goal, audience: audience || RECOMMENDED, duration_days: duration, daily_budget: dailyBudget, total_budget: total,
        status: "active", reach: 0, impressions: 0, profile_visits: 0, new_followers: 0, engagement: 0, link_clicks: 0,
        start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10),
      });
      setDone(true);
      if (onDone) onDone();
    } catch (e) { alert("Could not start promotion: " + (e?.message || "")); }
    setSubmitting(false);
  };

  const close = () => { setStep(1); setDone(false); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Rocket className="h-5 w-5 text-amber-600" /><h3 className="font-display text-lg font-bold">Boost your {label}</h3></div>
          <button onClick={close} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        {done ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check className="h-7 w-7" /></div>
            <h4 className="mt-4 font-display text-lg font-bold">Promotion active! 🚀</h4>
            <p className="mt-1 text-sm text-muted-foreground">Your {label} is now promoted and will reach more people.</p>
            <button onClick={close} className="mt-5 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">Done</button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-1">{[1, 2, 3, 4, 5, 6].map((s) => <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-amber-500" : "bg-muted"}`} />)}</div>
            <p className="mt-2 text-xs text-muted-foreground">Step {step} of 6</p>
            {step === 1 && (<div><p className="font-medium">What do you want to achieve?</p><div className="mt-3 grid grid-cols-2 gap-2">{GOALS.map((g) => <button key={g} onClick={() => setGoal(g)} className={`rounded-xl border p-3 text-left text-sm ${goal === g ? "border-amber-400 bg-amber-50" : "border-border hover:bg-accent"}`}>{g}</button>)}</div></div>)}
            {step === 2 && (<div><p className="font-medium">Choose your target audience</p><input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. AI, Software Development, Japan" className="mt-3 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /><div className="mt-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800"><strong>Recommended:</strong> {RECOMMENDED}</div></div>)}
            {step === 3 && (<div><p className="font-medium">Choose duration</p><div className="mt-3 grid grid-cols-4 gap-2">{DURATIONS.map((d) => <button key={d.d} onClick={() => setDuration(d.d)} className={`rounded-xl border p-3 text-sm ${duration === d.d ? "border-amber-400 bg-amber-50" : "border-border hover:bg-accent"}`}>{d.l}</button>)}</div></div>)}
            {step === 4 && (<div><p className="font-medium">Daily budget</p><div className="mt-3 flex items-center gap-2"><span className="text-sm">¥</span><input type="number" min={100} step={100} value={dailyBudget} onChange={(e) => setDailyBudget(Number(e.target.value))} className="h-10 w-32 rounded-lg border border-input bg-background px-3 text-sm" /><span className="text-sm text-muted-foreground">/ day</span></div><p className="mt-3 text-sm">Duration: {duration} days</p><p className="text-sm font-semibold">Estimated total: ¥{total.toLocaleString()}</p></div>)}
            {step === 5 && (<div><p className="font-medium">Review promotion</p><div className="mt-3 space-y-2 rounded-xl border border-border p-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="ml-2 max-w-[60%] truncate font-medium">{post.title}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span>{goal}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Audience</span><span className="text-right">{audience || RECOMMENDED}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{duration} days</span></div><div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span>¥{dailyBudget.toLocaleString()}/day</span></div><div className="flex justify-between border-t border-border pt-2 font-bold"><span>Estimated total</span><span>¥{total.toLocaleString()}</span></div></div></div>)}
            {step === 6 && (<div><p className="flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4" /> Payment</p><div className="mt-3 space-y-3"><div><label className="text-xs text-muted-foreground">Card number</label><input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="4242 4242 4242 4242" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div><div><label className="text-xs text-muted-foreground">Name on card</label><input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-muted-foreground">Expiry</label><input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div><div><label className="text-xs text-muted-foreground">CVC</label><input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="123" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div></div><div className="rounded-lg bg-muted/50 p-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">¥{total.toLocaleString()}</span></div></div></div></div>)}
            <div className="mt-5 flex items-center justify-between">
              <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="inline-flex h-10 items-center gap-1 rounded-full border border-border px-4 text-sm font-medium disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Back</button>
              {step < 6 ? <button onClick={() => setStep((s) => s + 1)} className="inline-flex h-10 items-center gap-1 rounded-full bg-foreground px-5 text-sm font-medium text-background">Next <ChevronRight className="h-4 w-4" /></button>
                : <button onClick={submit} disabled={submitting} className="inline-flex h-10 items-center gap-2 rounded-full bg-amber-500 px-5 text-sm font-medium text-white disabled:opacity-50">{submitting ? "Processing…" : `Pay ¥${total.toLocaleString()} & Boost`}</button>}
            </div>
            {step === 6 && <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Safe & secure payment</p>}
          </>
        )}
      </div>
    </div>
  );
}