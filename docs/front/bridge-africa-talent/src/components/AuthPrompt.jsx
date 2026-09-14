import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Sparkles } from "lucide-react";

export default function AuthPrompt({ open, onClose, title = "Join the conversation.", subtitle = "Sign in or create an account to interact with this post." }) {
  const location = useLocation();
  const navigate = useNavigate();
  if (!open) return null;
  const returnTo = encodeURIComponent(location.pathname + location.search);
  const go = (path) => navigate(`${path}?returnTo=${returnTo}`);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Sparkles className="h-6 w-6" /></div>
        <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button onClick={() => go("/login")} className="h-10 rounded-full bg-foreground text-sm font-medium text-background">Sign In</button>
          <button onClick={() => go("/register")} className="h-10 rounded-full border border-border text-sm font-medium hover:bg-accent">Create Account</button>
        </div>
      </div>
    </div>
  );
}