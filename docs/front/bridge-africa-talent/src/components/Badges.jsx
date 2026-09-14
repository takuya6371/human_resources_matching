import React from "react";
import { BadgeCheck, Crown } from "lucide-react";
import { isPremium } from "@/lib/subscription";

// Blue verified tick — shown when a profile is 100% complete (no text).
export function VerifiedTick({ size = 18, className = "" }) {
  return (
    <BadgeCheck
      className={`shrink-0 text-blue-500 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Verified by AfriTalent"
    />
  );
}

// Gold "Premium" tag — shown when the user is on a Premium plan.
export function PremiumTag({ size = 14, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 font-bold text-amber-600 ${className}`}
      style={{ fontSize: size }}
    >
      <Crown className="h-3 w-3" /> Premium
    </span>
  );
}

// Convenience: render both badges for a profile.
export function ProfileBadges({ profile, size = 16 }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {profile?.profile_completed && <VerifiedTick size={size} />}
      {isPremium(profile) && <PremiumTag />}
    </span>
  );
}