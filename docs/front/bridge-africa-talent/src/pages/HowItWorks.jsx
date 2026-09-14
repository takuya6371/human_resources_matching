import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HowItWorks() {
  const [tab, setTab] = useState("talent");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  const talentSteps = [
    { bi: "bi-person-plus", title: "Create your profile", desc: "Sign up free and build a structured profile — skills, experience, education, and Japanese level (JLPT)." },
    { bi: "bi-file-earmark-arrow-up", title: "Upload your documents", desc: "Add your CV, certificates, and visa status so we can match you accurately." },
    { bi: "bi-stars", title: "Get matched", desc: "Our team curates matches between your profile and open roles at vetted Japanese companies." },
    { bi: "bi-handshake", title: "Interview & get hired", desc: "Connect with employers through in-platform messaging, interview, and receive an offer." },
  ];
  const companySteps = [
    { bi: "bi-building-add", title: "Register your company", desc: "Create a company account and complete your profile with hiring needs and language requirements." },
    { bi: "bi-patch-check-fill", title: "Get verified", desc: "We verify your business so talent can trust they're engaging with real employers." },
    { bi: "bi-briefcase", title: "Post roles", desc: "Publish job openings with structured requirements — role, language needs, visa sponsorship, location." },
    { bi: "bi-people", title: "Review matched talent", desc: "Receive curated candidate matches and manage your pipeline from shortlist to hired." },
  ];

  const steps = tab === "talent" ? talentSteps : companySteps;
  const active = steps[step];

  useEffect(() => { setStep(0); }, [tab]);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % steps.length), 4000);
    return () => clearTimeout(t);
  }, [step, playing, steps.length]);

  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">How it works</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">A guided, curated process — not a flood of applications. Watch the walkthrough below.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-muted p-1">
            <button onClick={() => setTab("talent")} className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${tab === "talent" ? "bg-foreground text-background" : "text-muted-foreground"}`}>For Talent</button>
            <button onClick={() => setTab("company")} className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${tab === "company" ? "bg-foreground text-background" : "text-muted-foreground"}`}>For Companies</button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-background to-background p-8">
            <button onClick={() => setPlaying((p) => !p)} className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 hover:bg-accent" title={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <AnimatePresence mode="wait">
              <motion.div key={`${tab}-${step}`} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -24, scale: 0.96 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.12, type: "spring", stiffness: 180, damping: 14 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-foreground text-background">
                  <i className={`bi ${active.bi} text-4xl`} />
                </motion.div>
                <div className="mt-5 text-xs font-bold uppercase tracking-widest text-amber-700">Step {step + 1} of {steps.length}</div>
                <h3 className="mt-2 font-display text-2xl font-bold">{active.title}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{active.desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 border-t border-border p-4">
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} className="group flex-1 text-left">
                <div className={`h-1.5 overflow-hidden rounded-full ${i === step ? "bg-amber-100" : "bg-muted"}`}>
                  {i === step && playing && <motion.div className="h-full bg-amber-500" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 4, ease: "linear" }} />}
                  {i === step && !playing && <div className="h-full w-1/2 bg-amber-500" />}
                </div>
                <p className={`mt-1.5 text-[11px] ${i === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.title}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/get-started" className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-base font-medium text-background transition-opacity hover:opacity-90">Get started <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}