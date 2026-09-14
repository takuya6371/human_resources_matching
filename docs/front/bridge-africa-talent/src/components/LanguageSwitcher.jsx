import React, { useState } from "react";
import { Globe, Check } from "lucide-react";
import { useLang } from "@/lib/i18n";

const LANGS = [
  { code: "en", label: "English", short: "EN" },
  { code: "ja", label: "日本語", short: "JA" },
  { code: "fr", label: "Français", short: "FR" },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium transition-colors hover:bg-accent">
        <Globe className="h-4 w-4" /> <span>{current.short}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-border bg-popover p-1 shadow-lg">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent ${l.code === lang ? "font-medium" : "text-muted-foreground"}`}>
                {l.label} {l.code === lang && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}