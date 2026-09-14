import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Calendar, User } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function Blogs() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Blog.filter({ status: "published" }, "-published_date", 50)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-amber-600">AfriTalent Blog</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Stories from Africa × Japan</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Career insights, talent journeys, and hiring guidance for the Africa–Japan marketplace.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-muted-foreground">Loading articles...</p>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No articles published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {featured && (
              <Link to={`/blog/${featured.id}`} className="group grid overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/20 md:grid-cols-2">
                <div className="aspect-[16/10] bg-muted md:aspect-auto md:h-full">
                  {featured.cover_image_url && <Image src={featured.cover_image_url} alt={featured.title} fittingType="fill" className="h-full w-full" />}
                </div>
                <div className="flex flex-col justify-center p-6 md:p-8">
                  {featured.category && <span className="inline-block w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{featured.category}</span>}
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">{featured.title}</h2>
                  <p className="mt-2 line-clamp-3 text-muted-foreground">{featured.excerpt}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {featured.author_name || "AfriTalent"}</span>
                    {featured.published_date && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {featured.published_date}</span>}
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <Link key={p.id} to={`/blog/${p.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/20">
                    <div className="aspect-[16/10] bg-muted">
                      {p.cover_image_url && <Image src={p.cover_image_url} alt={p.title} fittingType="fill" className="h-full w-full" />}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      {p.category && <span className="inline-block w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{p.category}</span>}
                      <h3 className="mt-2 font-display text-lg font-semibold">{p.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
                      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {p.author_name || "AfriTalent"}</span>
                        {p.published_date && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {p.published_date}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}