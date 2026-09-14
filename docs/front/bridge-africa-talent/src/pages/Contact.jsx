import React, { useState } from "react";
import { Mail, MapPin, MessageSquare, Clock, Send, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-amber-50/60 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800"><MessageSquare className="h-3.5 w-3.5" /> We'd love to help</span>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">Contact us</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Questions about talent, hiring, or partnerships? Reach out — a real human will get back to you.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {[
              { icon: Mail, title: "Email", value: "hello@afritalent.example" },
              { icon: MapPin, title: "Location", value: "Tokyo, Japan · Remote-first team" },
              { icon: Clock, title: "Support hours", value: "Mon–Fri, 9:00–18:00 JST" },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><c.icon className="h-5 w-5" /></div>
                <div><p className="font-medium">{c.title}</p><p className="text-sm text-muted-foreground">{c.value}</p></div>
              </div>
            ))}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
              <p className="text-sm font-medium text-amber-800">Prefer instant answers?</p>
              <p className="mt-1 text-sm text-muted-foreground">Ask AfriTalent Bot in the bottom-right corner — available 24/7.</p>
            </div>
          </div>

          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:col-span-3">
            {sent && <div className="mb-6 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 className="h-4 w-4" /> Thanks — your message has been received. We'll respond within two business days.</div>}
            <div className="grid gap-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className="text-sm font-medium">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3" /></div>
                <div><label className="text-sm font-medium">Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3" /></div>
              </div>
              <div className="grid gap-2"><label className="text-sm font-medium">Subject</label><input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-11 rounded-lg border border-input bg-background px-3" /></div>
              <div className="grid gap-2"><label className="text-sm font-medium">Message</label><textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2" /></div>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"><Send className="h-4 w-4" /> Send message</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}