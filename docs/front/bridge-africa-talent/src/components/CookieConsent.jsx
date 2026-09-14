import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("afritalent_cookie_consent");
    if (!consent) setVisible(true);
    else {
      try {
        const parsed = JSON.parse(consent);
        setAnalytics(!!parsed.analytics);
        setMarketing(!!parsed.marketing);
      } catch {}
    }
  }, []);

  const save = (a, m) => {
    localStorage.setItem("afritalent_cookie_consent", JSON.stringify({ analytics: a, marketing: m, timestamp: Date.now() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-6">
      {!showPrefs ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              <h3 className="font-semibold">We value your privacy</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              By clicking "Accept", you agree to the storing of cookies on your device to enhance site navigation, analyze site usage, and assist in our marketing efforts. See our{" "}
              <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link> for more information.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={() => setShowPrefs(true)} className="rounded-full border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-accent">Preferences</button>
            <button onClick={() => save(false, false)} className="rounded-full border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-accent">Reject</button>
            <button onClick={() => save(true, true)} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">Accept</button>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold">Cookie Preferences</h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><p className="text-sm font-medium">Necessary</p><p className="text-xs text-muted-foreground">Required for core site function. Always on.</p></div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">On</span>
            </label>
            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><p className="text-sm font-medium">Analytics</p><p className="text-xs text-muted-foreground">Help us understand site usage.</p></div>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><p className="text-sm font-medium">Marketing</p><p className="text-xs text-muted-foreground">Personalized outreach and ads.</p></div>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="h-4 w-4" />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => save(analytics, marketing)} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">Save preferences</button>
          </div>
        </div>
      )}
    </div>
  );
}