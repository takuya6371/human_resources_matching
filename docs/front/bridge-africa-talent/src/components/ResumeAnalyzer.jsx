import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, FileText, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";

export default function ResumeAnalyzer({ cvUrl }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!cvUrl) return;
    setLoading(true); setError(""); setAnalysis(null);
    try {
      const res = await base44.functions.invoke("analyzeResume", { cv_url: cvUrl });
      const data = res?.data || res;
      if (data?.error) setError(data.error);
      else setAnalysis(data?.analysis || data);
    } catch (e) { setError(e?.message || "Analysis failed"); }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-600" />
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">AI CV analysis 🤖</h2>
      </div>
      {!cvUrl ? (
        <p className="mt-3 text-sm text-muted-foreground">Upload a CV above, then run an AI analysis for skills, strengths, gaps, and Japan-market readiness.</p>
      ) : (
        <>
          <button onClick={analyze} disabled={loading} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="h-4 w-4" /> Analyze my CV</>}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {analysis && (
            <div className="mt-5 space-y-4 text-sm">
              {analysis.summary && <p className="text-muted-foreground">{analysis.summary}</p>}
              {analysis.japan_readiness && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0" /> {analysis.japan_readiness}</div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Block icon={CheckCircle2} title="Strengths" items={analysis.strengths} color="green" />
                <Block icon={AlertCircle} title="Areas to improve" items={analysis.gaps} color="amber" />
                <Block icon={FileText} title="Key skills" items={analysis.skills} color="blue" />
                <Block icon={Lightbulb} title="Suggested roles" items={analysis.suggested_roles} color="purple" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Block({ icon: Icon, title, items, color }) {
  const colors = { green: "text-green-700", amber: "text-amber-700", blue: "text-blue-700", purple: "text-purple-700" };
  return (
    <div className="rounded-xl border border-border p-4">
      <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${colors[color]}`}><Icon className="h-3.5 w-3.5" /> {title}</p>
      {items?.length ? (
        <ul className="mt-2 space-y-1">{items.map((x, i) => <li key={i} className="text-sm text-muted-foreground">· {x}</li>)}</ul>
      ) : <p className="mt-2 text-sm text-muted-foreground">—</p>}
    </div>
  );
}