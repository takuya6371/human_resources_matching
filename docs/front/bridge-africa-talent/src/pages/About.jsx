import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Compass, Heart, Globe2, ShieldCheck, Sparkles, ArrowRight, Users, Building2, Linkedin, MapPin } from "lucide-react";
import { Image } from "@/components/ui/image";

const DEFAULT_TEAM = [
  { name: "Yoshihiro Kawasaki", position: "CEO", photo: "https://media.base44.com/images/public/6a8c20abc1e4606a34e9dd6b/2c07ffc60_generated_image.png", bio: "Building a platform that connects talented people with companies and creates new opportunities through technology and innovation.", location: "Tokyo, Japan", linkedin: "", website: "" },
  { name: "Takuya Kanazawa", position: "Infrastructure Engineer", photo: "https://media.base44.com/images/public/6a8c20abc1e4606a34e9dd6b/4df61936d_generated_image.png", bio: "Keeps AfriTalent fast, secure, and reliable for talent and companies across Africa and Japan.", location: "Tokyo, Japan", linkedin: "", website: "" },
  { name: "Mugisha Dear Duvet", position: "Full-Stack Developer", photo: "https://media.base44.com/images/public/6a8c20abc1e4606a34e9dd6b/68462204d_generated_image.png", bio: "Builds the product end-to-end, turning ideas into features that connect Africa and Japan.", location: "Kigali, Rwanda", linkedin: "", website: "" },
  { name: "Damilola Esan", position: "AI Features", photo: "https://media.base44.com/images/public/6a8c20abc1e4606a34e9dd6b/64a14afe9_generated_image.png", bio: "Designs and ships the AI-powered matching and insight features across the platform.", location: "Lagos, Nigeria", linkedin: "", website: "" },
];

export default function About() {
  const [team, setTeam] = useState(DEFAULT_TEAM);

  useEffect(() => {
    base44.entities.TeamMember.filter({ active: true }, "display_order", 100).then((m) => {
      if (m.length) setTeam(m.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-amber-50/60 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800"><Globe2 className="h-3.5 w-3.5" /> Africa ↔ Japan</span>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">About AfriTalent</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Building bridges between two worlds of opportunity — one trusted match at a time.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Our mission</h2>
            <p className="mt-4 text-muted-foreground">AfriTalent exists to connect the remarkable talent of Africa and its global diaspora with the dynamic companies of Japan. We believe opportunity shouldn't be bounded by geography — and that the right match can transform careers and businesses alike.</p>
            <p className="mt-4 text-muted-foreground">Japan faces a growing talent shortage. Africa holds one of the world's youngest, most ambitious talent pools. We exist to make that connection trusted, curated, and human.</p>
            <div className="mt-6 flex gap-3">
              <Link to="/get-started?role=talent" className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background">Join as talent <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/get-started?role=company" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium hover:bg-accent">Hire talent</Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Compass, title: "Curated, not crowded", desc: "We focus on quality matches over volume." },
              { icon: Heart, title: "Human-centered", desc: "Real support through every step of the journey." },
              { icon: ShieldCheck, title: "Verified & trusted", desc: "Both sides reviewed for mutual trust." },
              { icon: Sparkles, title: "Intelligent matching", desc: "Explainable scores, not a faceless job board." },
            ].map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><v.icon className="h-5 w-5" /></div>
                <h3 className="mt-3 font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">Meet the team</h2>
          <p className="mt-3 text-muted-foreground">The people building the bridge between Africa and Japan.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-muted">
                {m.photo ? <Image src={m.photo} alt={m.name} fittingType="fill" className="h-full w-full" /> : <div className="flex h-full items-center justify-center text-2xl font-bold">{(m.name || "?").charAt(0)}</div>}
              </div>
              <h3 className="mt-4 font-semibold">{m.name}</h3>
              <p className="mt-0.5 text-sm text-amber-700">{m.position}</p>
              {m.bio && <p className="mt-2 text-xs text-muted-foreground">{m.bio}</p>}
              {m.location && <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {m.location}</p>}
              {(m.linkedin || m.website) && (
                <div className="mt-3 flex justify-center gap-3">
                  {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Linkedin className="h-4 w-4" /></a>}
                  {m.website && <a href={m.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe2 className="h-4 w-4" /></a>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/get-started" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium hover:bg-accent">Join our community <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-8">
              <Users className="h-8 w-8 text-amber-700" />
              <h3 className="mt-4 font-display text-xl font-bold">For Talent</h3>
              <p className="mt-2 text-sm text-muted-foreground">Showcase your skills, get matched with vetted Japanese employers, and access relocation and language support — free, always.</p>
            </div>
            <div className="rounded-3xl border border-border bg-foreground p-8 text-background">
              <Building2 className="h-8 w-8" />
              <h3 className="mt-4 font-display text-xl font-bold">For Companies</h3>
              <p className="mt-2 text-sm text-background/70">Access a curated pool of skilled African professionals and graduates. Post roles, review matched candidates, and manage your pipeline.</p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link to="/get-started" className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-base font-medium text-background transition-opacity hover:opacity-90">Join the bridge <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}