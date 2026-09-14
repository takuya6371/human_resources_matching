import React from "react";
import { BadgeCheck, Crown, Trophy, Star, Sparkles, Compass, Languages, Plane, Building2 } from "lucide-react";
import { isPremium } from "@/lib/subscription";

// Reputational badges computed from a profile. Crisp line icons, our own style.
export default function ReputationBadges({ profile, followers = 0, wins = 0, size = "sm" }) {
  if (!profile) return null;
  const badges = [];
  const isCompany = !!profile.company_name;

  if (profile.profile_completed) badges.push({ icon: BadgeCheck, label: "Verified", cls: "bg-blue-50 text-blue-700 border-blue-200" });
  if (isPremium(profile)) badges.push({ icon: Crown, label: "Premium", cls: "bg-amber-50 text-amber-700 border-amber-200" });
  if (wins >= 3) badges.push({ icon: Trophy, label: "Champion", cls: "bg-green-50 text-green-700 border-green-200" });
  else if (wins >= 1) badges.push({ icon: Trophy, label: "Winner", cls: "bg-green-50 text-green-700 border-green-200" });
  if (followers >= 100) badges.push({ icon: Star, label: "Top Voice", cls: "bg-purple-50 text-purple-700 border-purple-200" });
  else if (followers >= 20) badges.push({ icon: Sparkles, label: "Rising Star", cls: "bg-purple-50 text-purple-700 border-purple-200" });

  if (!isCompany) {
    if (Number(profile.years_experience) >= 7) badges.push({ icon: Compass, label: "Mentor", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" });
    const jlptRank = ["none", "N5", "N4", "N3", "N2", "N1"].indexOf(profile.jlpt_level);
    const engRank = ["basic", "conversational", "fluent", "native"].indexOf(profile.english_level);
    if (jlptRank >= 4 && engRank >= 2) badges.push({ icon: Languages, label: "Bilingual", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" });
    if (profile.visa_status === "has_work_rights" || profile.visa_status === "citizen") badges.push({ icon: Plane, label: "Work Ready", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" });
  } else {
    if (profile.visa_sponsorship) badges.push({ icon: Plane, label: "Visa Sponsor", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" });
    if (["201-1000", "1000+"].includes(profile.company_size)) badges.push({ icon: Building2, label: "Enterprise", cls: "bg-slate-100 text-slate-700 border-slate-200" });
  }

  if (badges.length === 0) return null;
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  const ic = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span key={b.label} className={`inline-flex items-center gap-1 rounded-full border ${b.cls} ${pad} font-medium`}>
          <b.icon className={ic} /> {b.label}
        </span>
      ))}
    </div>
  );
}