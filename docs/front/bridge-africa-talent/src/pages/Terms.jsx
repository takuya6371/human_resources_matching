import React from "react";

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>
      <div className="prose mt-8 max-w-none text-muted-foreground">
        <p>By using AfriTalent, you agree to these terms. AfriTalent is a marketplace connecting talent with companies; we are not a party to any employment agreement.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">For talent</h2>
        <p>You agree to provide accurate information, keep your profile current, and engage honestly with companies. Misrepresentation may result in removal.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">For companies</h2>
        <p>You agree to post accurate roles, respect candidate privacy, and not discriminate unlawfully. Verification of your business is required to post roles.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Matching & fees</h2>
        <p>AfriTalent is free for talent. Company pricing, if applicable, is described separately at signup. We may curate and moderate matches and postings.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Liability</h2>
        <p>We provide the platform "as is" and are not liable for outcomes of interactions between talent and companies.</p>
      </div>
    </div>
  );
}