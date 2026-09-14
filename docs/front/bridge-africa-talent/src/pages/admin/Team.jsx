import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Loader2, Save, Eye, EyeOff } from "lucide-react";

export default function AdminTeam() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const m = await base44.entities.TeamMember.list("-created_date", 100);
    setMembers(m); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const blank = { name: "", photo: "", position: "", bio: "", location: "", linkedin: "", website: "", display_order: 0, active: true };
  const save = async () => {
    setSaving(true);
    try {
      if (editing.id) await base44.entities.TeamMember.update(editing.id, editing);
      else { const created = await base44.entities.TeamMember.create(editing); setEditing(created); }
      await load(); setEditing(null);
    } catch (e) { alert("Could not save: " + (e?.message || "")); }
    setSaving(false);
  };
  const del = async (m) => { if (!confirm(`Delete ${m.name}?`)) return; await base44.entities.TeamMember.delete(m.id); await load(); };
  const toggleActive = async (m) => { await base44.entities.TeamMember.update(m.id, { active: !m.active }); await load(); };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold tracking-tight">Meet the team</h1><p className="mt-1 text-sm text-muted-foreground">Manage team members shown on the About page.</p></div>
        <button onClick={() => setEditing(blank)} className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background"><Plus className="h-4 w-4" /> Add member</button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div key={m.id} className={`rounded-2xl border border-border bg-card p-4 ${!m.active ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              {m.photo ? <img src={m.photo} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-bold">{(m.name || "?").charAt(0)}</div>}
              <div className="flex-1"><p className="font-medium">{m.name}</p><p className="text-xs text-amber-700">{m.position}</p></div>
            </div>
            {m.bio && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{m.bio}</p>}
            <div className="mt-3 flex gap-1.5">
              <button onClick={() => setEditing(m)} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium hover:bg-accent"><Save className="h-3 w-3" /> Edit</button>
              <button onClick={() => toggleActive(m)} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium hover:bg-accent">{m.active ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Show</>}</button>
              <button onClick={() => del(m)} className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold">{editing.id ? "Edit member" : "Add member"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Position" value={editing.position} onChange={(v) => setEditing({ ...editing, position: v })} />
              <Field label="Photo URL" value={editing.photo} onChange={(v) => setEditing({ ...editing, photo: v })} full />
              <Field label="Short bio" value={editing.bio} onChange={(v) => setEditing({ ...editing, bio: v })} full textarea />
              <Field label="Location" value={editing.location} onChange={(v) => setEditing({ ...editing, location: v })} />
              <Field label="Display order" type="number" value={String(editing.display_order || 0)} onChange={(v) => setEditing({ ...editing, display_order: Number(v) })} />
              <Field label="LinkedIn URL" value={editing.linkedin} onChange={(v) => setEditing({ ...editing, linkedin: v })} />
              <Field label="Website / social" value={editing.website} onChange={(v) => setEditing({ ...editing, website: v })} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Visible on About page</label>
            <div className="mt-5 flex gap-2">
              <button onClick={save} disabled={saving || !editing.name || !editing.position} className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50">{saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save</>}</button>
              <button onClick={() => setEditing(null)} className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, full, textarea, type }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="text-xs text-muted-foreground">{label}</label>
      {textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        : <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />}
    </div>
  );
}