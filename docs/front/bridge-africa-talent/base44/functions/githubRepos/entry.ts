import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}
    const username = (body.username || "").toString().trim().slice(0, 100).replace(/^@/, "");
    if (!username) return Response.json({ error: 'Username is required' }, { status: 400 });

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=8&type=owner`, {
      headers: {
        "User-Agent": "AfriTalent",
        "Accept": "application/vnd.github+json",
      },
    });
    if (!res.ok) {
      return Response.json({ error: `GitHub responded with ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    const repos = (Array.isArray(data) ? data : []).map((r) => ({
      name: r.name,
      description: r.description,
      html_url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      updated_at: r.updated_at,
      homepage: r.homepage,
    })).sort((a, b) => (b.stars || 0) - (a.stars || 0));
    return Response.json({ username, repos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}