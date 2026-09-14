import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Search, Globe } from "lucide-react";

export default function CompanyReview() {
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.CompanyProfile.list("-created_date", 200).then((c) => { setCompanies(c); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const update = async (id, status) => {
    await base44.entities.CompanyProfile.update(id, { status });
    setCompanies((c) => c.map((x) => x.id === id ? { ...x, status } : x));
    if (selected?.id === id) setSelected((s) => ({ ...s, status }));
  };

  const filtered = companies.filter((c) => (filter === "all" || c.status === filter) && (!search || c.company_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())));

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  return (
    <div className="px-6 py-8 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">Company review</h1>
      <p className="mt-1 text-sm text-muted-foreground">Verify new company accounts.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company or email" className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm" />
        </div>
        <div className="inline-flex rounded-full border border-border bg-muted p-1">
          {[{ k: "pending", l: "Pending" }, { k: "approved", l: "Approved" }, { k: "rejected", l: "Rejected" }, { k: "all", l: "All" }].map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)} className={`rounded-full px-4 py-1.5 text-xs font-medium ${filter === f.k ? "bg-foreground text-background" : "text-muted-foreground"}`}>{f.l}</button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No companies in this view.</p> : filtered.map((c) => (
            <button key={c.id} onClick={() => setSelected(c)} className={`w-full rounded-2xl border p-4 text-left transition-colors ${selected?.id === c.id ? "border-foreground bg-muted/40" : "border-border bg-card hover:bg-muted/30"}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium">{c.company_name}</p>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.industry} · {c.location}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">{selected.company_name}</h2>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Industry" value={selected.industry} />
                <Field label="Company size" value={selected.company_size} />
                <Field label="Location" value={selected.location} />
                <Field label="Website" value={selected.website} />
                <Field label="Remote policy" value={selected.remote_policy} />
                <Field label="Visa sponsorship" value={selected.visa_sponsorship ? "Yes" : "No"} />
              </div>
              {selected.description && <Field label="Description" value={selected.description} />}
              {selected.hiring_roles && <Field label="Hiring roles" value={selected.hiring_roles} />}
              {selected.language_requirements && <Field label="Language requirements" value={selected.language_requirements} />}
              {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-xs font-medium hover:bg-accent"><Globe className="h-3.5 w-3.5" /> Visit website</a>}

              <div className="mt-6 flex gap-2">
                <button onClick={() => update(selected.id, "approved")} className="inline-flex h-10 items-center gap-2 rounded-full bg-green-600 px-5 text-sm font-medium text-white"><CheckCircle2 className="h-4 w-4" /> Approve</button>
                <button onClick={() => update(selected.id, "rejected")} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium"><XCircle className="h-4 w-4" /> Reject</button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">Select a company to review the details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { pending: "bg-amber-50 text-amber-700", approved: "bg-green-50 text-green-700", rejected: "bg-red-50 text-red-700" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] || "bg-muted"}`}>{status}</span>;
}

function Field({ label, value }) {
  if (!value) return null;
  return <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 text-sm">{value}</p></div>;
}