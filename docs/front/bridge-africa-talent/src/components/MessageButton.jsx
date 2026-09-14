import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import AuthPrompt from "@/components/AuthPrompt";
import { base44 } from "@/api/base44Client";

export default function MessageButton({ toUserId, toName, size = "h-10 w-10", className = "" }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const onClick = async () => {
    const authed = await base44.auth.isAuthenticated().catch(() => false);
    if (!authed) { setOpen(true); return; }
    navigate(`/messages?to=${toUserId}&name=${encodeURIComponent(toName || "")}`);
  };

  return (
    <>
      <button onClick={onClick} className={`inline-flex ${size} items-center justify-center rounded-full border border-border hover:bg-accent ${className}`} title={`Message ${toName || ""}`}>
        <Mail className="h-4 w-4" />
      </button>
      <AuthPrompt open={open} onClose={() => setOpen(false)} title="Send a message" subtitle="Sign in or create an account to start a conversation." />
    </>
  );
}