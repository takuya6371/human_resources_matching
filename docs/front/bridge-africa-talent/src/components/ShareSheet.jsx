import React, { useState } from "react";
import { X, Link2, Twitter, Facebook, Linkedin, MessageCircle, Mail } from "lucide-react";

export default function ShareSheet({ open, onClose, url, title }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const enc = encodeURIComponent(shareUrl);
  const encTitle = encodeURIComponent(title || "");
  const options = [
    { label: "Copy link", icon: Link2, action: async () => { if (navigator.clipboard) await navigator.clipboard.writeText(shareUrl).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); } },
    { label: "X / Twitter", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${encTitle}&url=${enc}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${encTitle}%20${enc}` },
    { label: "Email", icon: Mail, href: `mailto:?subject=${encTitle}&body=${enc}` },
  ];
  const openShare = (href) => { window.open(href, "_blank", "noopener,noreferrer,width=600,height=600"); };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold">Share</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {options.map((o) => (
            <button key={o.label} onClick={() => o.action ? o.action() : openShare(o.href)} className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs font-medium hover:bg-accent">
              <o.icon className="h-5 w-5 text-muted-foreground" />
              {o.label === "Copy link" && copied ? "Copied!" : o.label}
            </button>
          ))}
        </div>
        {copied && <p className="mt-3 text-center text-xs text-green-700">Link copied to clipboard!</p>}
      </div>
    </div>
  );
}