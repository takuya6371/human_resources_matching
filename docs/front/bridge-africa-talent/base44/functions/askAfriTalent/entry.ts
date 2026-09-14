import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch {}
    const question = (body.question || "").toString().slice(0, 1000);
    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    if (!question) return Response.json({ error: "Question is required" }, { status: 400 });

    const sys = "You are AfriTalent Bot, the friendly assistant for AfriTalent — a curated marketplace connecting skilled African professionals and graduates with vetted companies across Japan. Answer in 1-3 short sentences, max ~35 words. Be direct, friendly and specific. No long paragraphs or bullet lists. Topics: how it works, signing up, profiles, matching, jobs, visa sponsorship, Premium, credits. If unsure, point to the How It Works or Contact page.";

    const convo = history.map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n\n");
    const prompt = `${sys}\n\n${convo}\n\nUser: ${question}\n\nAssistant:`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const answer = typeof res === "string" ? res : (res?.answer || JSON.stringify(res));
    return Response.json({ answer });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}