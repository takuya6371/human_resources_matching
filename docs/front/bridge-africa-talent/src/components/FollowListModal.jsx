import React from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

export default function FollowListModal({ open, onClose, title, items }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
          {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No one yet.</p> : items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 text-sm font-bold">{(it.name || "?").charAt(0)}</div>
              {it.to ? <Link to={it.to} onClick={onClose} className="flex-1 text-sm font-medium hover:underline">{it.name}</Link> : <span className="flex-1 text-sm font-medium">{it.name}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}