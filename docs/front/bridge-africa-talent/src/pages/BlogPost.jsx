import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Calendar, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Image } from "@/components/ui/image";

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewed = useRef(false);

  useEffect(() => {
    if (!id) return;
    base44.entities.Blog.get(id)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!post || viewed.current) return;
    viewed.current = true;
    base44.entities.Blog.update(post.id, { views: (post.views || 0) + 1 }).catch(() => {});
  }, [post]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>;

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Article not found</h1>
        <Link to="/blog" className="mt-4 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">Back to blog</Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/blog" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>

      {post.category && <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{post.category}</span>}
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">{post.title}</h1>
      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {post.author_name || "AfriTalent"}</span>
        {post.published_date && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {post.published_date}</span>}
      </div>

      {post.cover_image_url && (
        <div className="mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
          <Image src={post.cover_image_url} alt={post.title} fittingType="fill" className="h-full w-full" />
        </div>
      )}

      {post.excerpt && <p className="mt-8 text-lg text-muted-foreground">{post.excerpt}</p>}

      <div className="mt-6 max-w-none text-foreground">
        <ReactMarkdown
          components={{
            h1: ({ node, ...p }) => <h1 className="mt-8 font-display text-2xl font-bold" {...p} />,
            h2: ({ node, ...p }) => <h2 className="mt-8 font-display text-xl font-bold" {...p} />,
            h3: ({ node, ...p }) => <h3 className="mt-6 font-display text-lg font-semibold" {...p} />,
            p: ({ node, ...p }) => <p className="mt-4 leading-relaxed text-muted-foreground" {...p} />,
            ul: ({ node, ...p }) => <ul className="mt-4 list-disc space-y-1 pl-6 text-muted-foreground" {...p} />,
            ol: ({ node, ...p }) => <ol className="mt-4 list-decimal space-y-1 pl-6 text-muted-foreground" {...p} />,
            a: ({ node, ...p }) => <a className="text-amber-600 underline" {...p} />,
            blockquote: ({ node, ...p }) => <blockquote className="mt-4 border-l-2 border-border pl-4 italic text-muted-foreground" {...p} />,
          }}
        >
          {post.body || ""}
        </ReactMarkdown>
      </div>
    </article>
  );
}