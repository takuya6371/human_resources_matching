import { base44 } from "@/api/base44Client";

export const FREE_MONTHLY_APPLICATIONS = 3;

export function isPremium(profile) {
  if (!profile || profile.plan === "free" || !profile.plan) return false;
  if (profile.premium_until && new Date(profile.premium_until) < new Date()) return false;
  return true;
}

export const PLAN_TIERS = {
  talent: [
    { id: "free", name: "Free", price: 0, features: ["Post a full profile — free", "Browse unlimited companies & jobs", "Apply to 3 companies per month", "Earn credits for extra applications"] },
    { id: "premium", name: "Premium", price: 1980, features: ["Everything in Free", "Unlimited applications every month", "Gold Premium tag on your profile", "Highlighted first when companies browse", "24/7 support in EN / JP / FR", "Refresh profile photo every 2 days"] },
    { id: "pro", name: "Pro", price: 4900, features: ["Everything in Premium", "AI resume & profile insights", "Top placement in matching", "Dedicated matching agent", "Multiple profile photos", "Boosted profile visibility"] },
  ],
  company: [
    { id: "free", name: "Free", price: 0, features: ["Post jobs, internships & programs — free", "Browse talent profiles", "Express interest in talent", "Logo changes once a week"] },
    { id: "premium", name: "Premium", price: 9800, features: ["Everything in Free", "Gold Premium tag on company profile", "Highlighted in jobs & talent browse", "Direct message talent — no mediated intro", "Priority placement in matching", "24/7 support in EN / JP / FR"] },
    { id: "pro", name: "Pro", price: 24800, features: ["Everything in Premium", "Unlimited direct messages", "AI candidate insights", "Dedicated account manager", "Boosted jobs & challenges", "Team seats included"] },
  ],
};

export async function getApplicationsThisMonth(talentId) {
  const apps = await base44.entities.Application.filter({ talent_id: talentId }, "-created_date", 100);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return apps.filter((a) => new Date(a.created_date) >= start).length;
}

export function remainingFreeApplications(profile, usedThisMonth) {
  if (isPremium(profile)) return Infinity;
  return Math.max(0, FREE_MONTHLY_APPLICATIONS - usedThisMonth + (profile.credits || 0));
}