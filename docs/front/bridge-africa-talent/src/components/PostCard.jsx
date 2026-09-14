import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, MessageCircle, Share2, Send, Building2, Rocket, Trash2, CornerDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import AuthPrompt from "@/components/AuthPrompt";
import ShareSheet from "@/components/ShareSheet";
import SaveButton from "@/components/SaveButton";
import { notify } from "@/lib/notify";

const TYPE_META = {
  opportunity: { label: "Opportunity", emoji: "💼", color: "bg-blue-50 text-blue-700" },
  scholarship: { label: "Scholarship", emoji: "🎓", color: "bg-purple-50 text-purple-700" },
  program: { label: "Program", emoji: "🚀", color: "bg-green-50 text-green-700" },
  social_problem: { label: "Seeking solutions", emoji: "💡", color: "bg-amber-50 text-amber-700" },
};

export default function PostCard({ post, user, allLikes, allComments, onRefresh, promoted, canBoost, onBoost }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const meta = TYPE_META[post.type] || TYPE_META.opportunity;
  const likes = allLikes.filter((l) => l.post_id === post.id);
  const liked = user ? likes.some((l) => l.user_id === user.id) : false;
  const likeRecord = likes.find((l) => l.user_id === user?.id);
  const allC = allComments.filter((c) => c.post_id === post.id);
  const topLevel = allC.filter((c) => !c.parent_comment_id).sort((a, b) => (a.created_date || "").localeCompare(b.created_date || ""));
  const repliesOf = (id) => allC.filter((c) => c.parent_comment_id === id).sort((a, b) => (a.created_date || "").localeCompare(b.created_date || ""));

  const guard = (fn) => () => { if (!user) { setAuthOpen(true); return; } fn(); };

  const toggleLike = async () => {
    setBusy(true);
    try {
      if (liked && likeRecord) {
        await base44.entities.Like.delete(likeRecord.id);
        await base44.entities.Post.update(post.id, { likes: Math.max(0, (post.likes || 0) - 1) });
      } else {
        await base44.entities.Like.create({ post_id: post.id, user_id: user.id });
        await base44.entities.Post.update(post.id, { likes: (post.likes || 0) + 1 });
        try { const co = await base44.entities.CompanyProfile.get(post.company_id); if (co?.user_id) notify({ userId: co.user_id, actorId: user.id, actorName: user.full_name, actorType: user.account_type, type: "like", title: `${user.full_name} liked your post`, body: post.title, targetType: "post", targetId: post.id }); } catch {}
      }
      onRefresh();
    } catch (e) {}
    setBusy(false);
  };

  const submitComment = async (parent = null) => {
    const body = parent ? replyText : comment;
    if (!body.trim()) return;
    setBusy(true);
    try {
      await base44.entities.Comment.create({ post_id: post.id, user_id: user.id, user_name: user.full_name, user_type: user.account_type, body: body.trim(), parent_comment_id: parent || null });
      await base44.entities.Post.update(post.id, { comments: (post.comments || 0) + 1 });
      if (parent) {
        const parentC = allC.find((c) => c.id === parent);
        if (parentC && parentC.user_id !== user.id) {
          try { const co = await base44.entities.CompanyProfile.get(post.company_id); const to = parentC.user_id; notify({ userId: to, actorId: user.id, actorName: user.full_name, actorType: user.account_type, type: "reply", title: `${user.full_name} replied to your comment`, body: body.trim(), targetType: "post", targetId: post.id }); } catch {}
        }
      } else {
        try { const co = await base44.entities.CompanyProfile.get(post.company_id); if (co?.user_id) notify({ userId: co.user_id, actorId: user.id, actorName: user.full_name, actorType: user.account_type, type: "comment", title: `${user.full_name} commented on your post`, body: body.trim(), targetType: "post", targetId: post.id }); } catch {}
      }
      if (parent) { setReplyText(""); setReplyTo(null); } else setComment("");
      setShowComments(true);
      onRefresh();
    } catch (e) {}
    setBusy(false);
  };

  const deleteComment = async (c) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await base44.entities.Comment.delete(c.id);
      await base44.entities.Post.update(post.id, { comments: Math.max(0, (post.comments || 0) - 1) });
      onRefresh();
    } catch (e) {}
  };

  const share = async () => {
    try { await base44.entities.Post.update(post.id, { shares: (post.shares || 0) + 1 }); onRefresh(); } catch (e) {}
    setShareOpen(true);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Link to={`/company/${post.company_id}`} className="flex flex-1 items-center gap-3">
          {post.company_logo ? <img src={post.company_logo} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10"><Building2 className="h-5 w-5 text-muted-foreground" /></div>}
          <div className="flex-1">
            <div className="flex items-center gap-2"><p className="text-sm font-semibold hover:underline">{post.company_name}</p>{promoted && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Promoted</span>}</div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.color}`}>{meta.emoji} {meta.label}</span>
          </div>
        </Link>
        {canBoost && <button onClick={() => onBoost(post)} className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50"><Rocket className="h-3 w-3" /> Boost</button>}
      </div>

      <h3 className="mt-3 font-display text-lg font-bold">{post.title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{post.body}</p>
      {post.image_url && <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-muted"><Image src={post.image_url} alt={post.title} fittingType="fill" className="h-full w-full" /></div>}
      {post.video_url && <div className="mt-3 overflow-hidden rounded-xl bg-muted"><div className="aspect-video w-full">{post.video_url.match(/youtube|youtu\.be|vimeo/) ? <iframe src={post.video_url} className="h-full w-full" allowFullScreen /> : <video src={post.video_url} controls className="h-full w-full" />}</div></div>}

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-sm">
        <button onClick={guard(toggleLike)} disabled={busy} className={`inline-flex items-center gap-1.5 ${liked ? "text-rose-600" : "text-muted-foreground hover:text-foreground"}`}>
          <Heart className={`h-4 w-4 ${liked ? "fill-rose-500" : ""}`} /> {post.likes || 0}
        </button>
        <button onClick={guard(() => setShowComments((s) => !s))} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <MessageCircle className="h-4 w-4" /> {post.comments || 0}
        </button>
        <button onClick={share} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <Share2 className="h-4 w-4" /> {post.shares || 0}
        </button>
        <div className="ml-auto"><SaveButton itemType="post" item={post} small /></div>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3">
          {topLevel.map((c) => (
            <div key={c.id} className="space-y-2">
              <CommentRow c={c} user={user} onDelete={deleteComment} onReply={() => { setReplyTo(c.id); setReplyText(""); }} />
              {repliesOf(c.id).map((r) => (
                <div key={r.id} className="ml-6"><CommentRow c={r} user={user} onDelete={deleteComment} onReply={() => { setReplyTo(r.id); setReplyText(""); }} nested /></div>
              ))}
              {replyTo === c.id && (
                <div className="ml-6 flex items-center gap-2">
                  <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && guard(() => submitComment(c.id))()} placeholder={`Reply to ${c.user_name}…`} className="h-9 flex-1 rounded-full border border-input bg-background px-4 text-sm" />
                  <button onClick={guard(() => submitComment(c.id))} disabled={busy || !replyText.trim()} className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-50"><Send className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          ))}
          {user && (
            <div className="flex items-center gap-2">
              <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && guard(submitComment)()} placeholder="Add a comment…" className="h-9 flex-1 rounded-full border border-input bg-background px-4 text-sm" />
              <button onClick={guard(submitComment)} disabled={busy || !comment.trim()} className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      )}
      <AuthPrompt open={authOpen} onClose={() => setAuthOpen(false)} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={`${window.location.origin}/connect?post=${post.id}`} title={post.title} />
    </div>
  );
}

function CommentRow({ c, user, onDelete, onReply, nested }) {
  return (
    <div className={`group rounded-xl bg-muted/50 p-3 ${nested ? "" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">{c.user_name} <span className="font-normal text-muted-foreground">· {c.user_type}</span></p>
        {user?.id === c.user_id && (
          <button onClick={() => onDelete(c)} className="hidden text-muted-foreground hover:text-rose-600 group-hover:block"><Trash2 className="h-3.5 w-3.5" /></button>
        )}
      </div>
      <p className="mt-0.5 text-sm text-foreground">{c.body}</p>
      {user && <button onClick={onReply} className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"><CornerDownRight className="h-3 w-3" /> Reply</button>}
    </div>
  );
}