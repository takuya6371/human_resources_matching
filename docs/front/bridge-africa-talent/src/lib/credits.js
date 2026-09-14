import { base44 } from "@/api/base44Client";

export const REFERRAL_CREDITS = 1;
export const PROFILE_BONUS_CREDITS = 1;

export const CREDIT_RULES = [
  { icon: "UserPlus", title: "Complete your profile", desc: "Earn 1 credit when you finish your profile.", amount: 1 },
  { icon: "Gift", title: "Refer a friend", desc: "Earn 1 credit for each friend who completes their profile.", amount: 1 },
  { icon: "CalendarCheck", title: "Weekly login streak", desc: "Log in 3 days in a week to earn 1 credit.", amount: 1 },
];

export function getReferralLink(talentId) {
  if (!talentId) return "";
  return `${window.location.origin}/get-started?role=talent&ref=${talentId}`;
}

export async function awardCredits(talentId, amount) {
  if (!talentId || !amount) return;
  const t = await base44.entities.TalentProfile.get(talentId);
  await base44.entities.TalentProfile.update(talentId, { credits: (t.credits || 0) + amount });
}

export async function applyReferral(refCode) {
  if (!refCode) return;
  try {
    await awardCredits(refCode, REFERRAL_CREDITS);
  } catch {}
}