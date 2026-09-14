import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, GitFork, ExternalLink, Github } from "lucide-react";

export default function GithubRepos({ username }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) { setLoading(false); return; }
    setLoading(true); setError("");
    base44.functions.invoke("githubRepos", { username })
      .then((res) => {
        const data = res?.data || res;
        if (data?.error) { setError(data.error); setRepos([]); }
        else { setRepos(data?.repos || []); }
      })
      .catch(() => setError("Couldn't load repos right now."))
      .finally(() => setLoading(false));
  }, [username]);

  if (!username) return null;

  if (loading) return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Github className="h-4 w-4 animate-pulse" /> Loading GitHub repos…</div>
    </div>
  );
  if (error) return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Github className="h-4 w-4" /> {error}</div>
    </div>
  );
  if (repos.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Github className="h-4 w-4" />
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">GitHub projects · @{username}</h2>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {repos.map((r) => (
          <a key={r.html_url} href={r.html_url} target="_blank" rel="noreferrer" className="group rounded-xl border border-border p-4 transition-colors hover:border-foreground/20">
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-medium group-hover:text-amber-700">{r.name}</p>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">{r.description || "No description"}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              {r.language && <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> {r.language}</span>}
              <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" /> {r.stars}</span>
              <span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3" /> {r.forks}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}