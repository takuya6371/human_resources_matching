import React from "react";

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>
      <div className="prose mt-8 max-w-none text-muted-foreground">
        <p>AfriTalent ("we", "us") respects your privacy. This policy explains how we collect, use, and protect your data in line with Japan's APPI and, where applicable, the GDPR.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Data we collect</h2>
        <p>Account information (name, email), profile data you submit (professional details, skills, languages, visa status), documents you upload (CV, certificates), and usage data via cookies.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">How we use it</h2>
        <p>To match talent with companies, facilitate communication, verify identities, and improve our services. We do not sell your data.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Cookies</h2>
        <p>We use necessary cookies for core function, and optional analytics/marketing cookies with your consent (see the cookie banner). You can change preferences at any time.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Your rights</h2>
        <p>You may request access, correction, or deletion of your data. Contact us to exercise these rights.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Data retention</h2>
        <p>We retain profile data while your account is active and for a reasonable period afterward, then delete it unless law requires otherwise.</p>
      </div>
    </div>
  );
}