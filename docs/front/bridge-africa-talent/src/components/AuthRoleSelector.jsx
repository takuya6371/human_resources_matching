import React from "react";
import { User, Building2 } from "lucide-react";

export default function AuthRoleSelector({ value, onChange }) {
  const opts = [{ k: "talent", label: "Talent", icon: User }, { k: "company", label: "Company", icon: Building2 }];
  return (
    <div className="grid grid-cols-2 gap-2">
      {opts.map((o) => (
        <button type="button" key={o.k} onClick={() => onChange(o.k)} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${value === o.k ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent"}`}>
          <o.icon className="h-4 w-4" /> Join as {o.label}
        </button>
      ))}
    </div>
  );
}