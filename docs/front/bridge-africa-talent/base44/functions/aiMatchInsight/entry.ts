import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    let body = {};
    try { body = await req.json(); } catch {}
    const { job, talent } = body;
    if (!job || !talent) return Response.json({ error: "job and talent are required" }, { status: 400 });

    const prompt = `You are the AI matching assistant for AfriTalent, a platform connecting African talent with Japanese companies.
Given a job and a talent profile, explain in ~60 words why this talent is likely a good fit for this company, then note one potential concern.
Be specific and practical. Return plain text only.

Job: ${JSON.stringify(job)}
Talent: ${JSON.stringify(talent)}`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const insight = typeof res === "string" ? res : (res?.insight || JSON.stringify(res));
    return Response.json({ insight });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}