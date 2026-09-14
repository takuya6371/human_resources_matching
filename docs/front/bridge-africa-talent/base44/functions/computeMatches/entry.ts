import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const JLPT_ORDER = { none: 0, N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };

function scoreMatch(job, talent) {
  let score = 0;
  const reasons = [];
  const breakdown = [];

  if (job.industry && talent.industry) {
    const ji = job.industry.toLowerCase();
    const ti = talent.industry.toLowerCase();
    if (ji && ti && (ji.includes(ti) || ti.includes(ji))) { score += 30; reasons.push("Industry match"); breakdown.push({ label: "Industry", value: 30 }); }
    else { breakdown.push({ label: "Industry", value: 0 }); }
  }

  if (job.jlpt_required && job.jlpt_required !== "none") {
    const req = JLPT_ORDER[job.jlpt_required] || 0;
    const have = JLPT_ORDER[talent.jlpt_level] || 0;
    if (have >= req) { score += 25; reasons.push(`Meets JLPT ${job.jlpt_required}`); breakdown.push({ label: "Japanese (JLPT)", value: 25 }); }
    else { breakdown.push({ label: "Japanese (JLPT)", value: 0 }); }
  } else {
    score += 10; breakdown.push({ label: "Japanese (JLPT)", value: 10 });
  }

  if (talent.skills && job.requirements) {
    const reqTokens = job.requirements.toLowerCase().split(/[^a-z0-9+#.]+/).filter((t) => t.length > 2);
    const talentSkills = talent.skills.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
    const overlap = talentSkills.filter((s) => reqTokens.some((t) => t === s || t.includes(s) || s.includes(t)));
    const v = Math.min(overlap.length * 5, 25);
    if (overlap.length) { score += v; reasons.push(`${overlap.length} matching skill${overlap.length > 1 ? "s" : ""}`); }
    breakdown.push({ label: "Skills overlap", value: v });
  }

  let visaV = 0;
  if (job.visa_sponsorship && (talent.visa_status === "needs_sponsorship" || talent.visa_status === "student")) { visaV += 10; reasons.push("Visa sponsorship offered"); }
  if (talent.visa_status === "has_work_rights" || talent.visa_status === "citizen") { visaV += 10; reasons.push("Has work rights"); }
  score += visaV; breakdown.push({ label: "Visa", value: visaV });

  let remoteV = 0;
  if (job.remote_type === "remote" && talent.remote_willing) { remoteV += 10; reasons.push("Open to remote"); }
  if (job.remote_type !== "remote" && talent.relocate_willing) { remoteV += 5; reasons.push("Willing to relocate"); }
  score += remoteV; breakdown.push({ label: "Location fit", value: remoteV });

  return { score: Math.max(0, Math.min(100, score)), reasons, breakdown };
}

function hardFiltersPass(job, talent) {
  // Hard filter: talent must meet the required JLPT level
  if (job.jlpt_required && job.jlpt_required !== "none") {
    const req = JLPT_ORDER[job.jlpt_required] || 0;
    const have = JLPT_ORDER[talent.jlpt_level] || 0;
    if (have < req) return { pass: false, reason: `Requires JLPT ${job.jlpt_required} (you have ${talent.jlpt_level || "none"})` };
  }
  return { pass: true };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}
    const talentId = (body.talent_id || "").toString();
    const jobId = (body.job_id || "").toString();

    if (talentId) {
      const talent = await base44.asServiceRole.entities.TalentProfile.get(talentId);
      if (!talent) return Response.json({ error: 'Talent not found' }, { status: 404 });
      const [jobs, companies] = await Promise.all([
        base44.asServiceRole.entities.Job.filter({ status: "active" }, "-created_date", 200),
        base44.asServiceRole.entities.CompanyProfile.list("-created_date", 200),
      ]);
      const coUserMap = {};
      companies.forEach((c) => { coUserMap[c.id] = c.user_id; });
      const matches = jobs.map((j) => {
        const hf = hardFiltersPass(j, talent);
        if (!hf.pass) return { job: jobSummary(j, coUserMap), score: 0, reasons: [], breakdown: [], hardPass: false, hardReason: hf.reason };
        const s = scoreMatch(j, talent);
        return { job: jobSummary(j, coUserMap), score: s.score, reasons: s.reasons, breakdown: s.breakdown, hardPass: true };
      }).filter((m) => m.hardPass).sort((a, b) => b.score - a.score).slice(0, 24);
      return Response.json({ matches });
    }

    if (jobId) {
      const job = await base44.asServiceRole.entities.Job.get(jobId);
      if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
      const talents = await base44.asServiceRole.entities.TalentProfile.filter({ status: "approved" }, "-created_date", 200);
      const matches = talents.map((t) => {
        const hf = hardFiltersPass(job, t);
        if (!hf.pass) return { talent: talentSummary(t), score: 0, reasons: [], breakdown: [], hardPass: false, hardReason: hf.reason };
        const s = scoreMatch(job, t);
        return { talent: talentSummary(t), score: s.score, reasons: s.reasons, breakdown: s.breakdown, hardPass: true };
      }).filter((m) => m.hardPass).sort((a, b) => b.score - a.score).slice(0, 24);
      return Response.json({ matches });
    }

    return Response.json({ error: 'talent_id or job_id is required' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function jobSummary(j, coUserMap) {
  return {
    id: j.id, title: j.title, company_id: j.company_id, company_name: j.company_name,
    company_user_id: coUserMap[j.company_id] || null,
    location: j.location, remote_type: j.remote_type, industry: j.industry,
    jlpt_required: j.jlpt_required, visa_sponsorship: j.visa_sponsorship, salary_range: j.salary_range,
  };
}
function talentSummary(t) {
  return {
    id: t.id, user_id: t.user_id, full_name: t.full_name, headline: t.headline, current_role: t.current_role,
    country_of_residence: t.country_of_residence, industry: t.industry, skills: t.skills,
    jlpt_level: t.jlpt_level, photo_url: t.photo_url,
  };
}