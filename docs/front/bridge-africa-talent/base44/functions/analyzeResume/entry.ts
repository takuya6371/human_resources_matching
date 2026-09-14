import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}
    const cvUrl = (body.cv_url || "").toString();
    if (!cvUrl) return Response.json({ error: 'cv_url is required' }, { status: 400 });

    const prompt = "You are an expert career coach and technical recruiter familiar with the Japanese tech job market. Analyze the attached CV/resume. Extract the candidate's key skills, top strengths, concrete areas to improve (especially for the Japanese market), and suggest 3-5 suitable role types. Be practical and concise. Return the result as JSON matching the provided schema.";

    const schema = {
      type: "object",
      properties: {
        summary: { type: "string", description: "2-3 sentence overview of the candidate" },
        skills: { type: "array", items: { type: "string" } },
        strengths: { type: "array", items: { type: "string" } },
        gaps: { type: "array", items: { type: "string" }, description: "Areas to improve" },
        suggested_roles: { type: "array", items: { type: "string" } },
        japan_readiness: { type: "string", description: "One line on readiness for the Japanese market" },
      },
      required: ["summary", "skills", "strengths", "gaps", "suggested_roles"],
    };

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [cvUrl],
      response_json_schema: schema,
    });
    return Response.json({ analysis: res });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}