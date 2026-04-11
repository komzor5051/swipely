import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Блог Swipely — карусели для соцсетей",
  description:
    "Советы по созданию каруселей для ВКонтакте, Instagram и Telegram. Примеры, шаблоны и инструменты для контент-маркетинга.",
  alternates: {
    canonical: "https://swipely.ru/blog",
  },
};

interface Post {
  slug: string;
  title: string;
  meta_desc: string | null;
  published_at: string;
  tags: string[];
  cover_image: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase
    .from("swipely_blog_posts")
    .select("slug, title, meta_desc, published_at, tags, cover_image")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Блог</h1>
      <p className="text-muted-foreground mb-10">
        Карусели для соцсетей: советы, примеры, инструменты
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {(posts ?? []).map((post: Post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block border border-border rounded-xl overflow-hidden hover:border-[#0A84FF]/60 transition-colors"
          >
            <div className="p-4">
              <h2 className="font-semibold text-base leading-snug mb-2 group-hover:text-[#0A84FF] transition-colors line-clamp-2">
                {post.title}
              </h2>
              {post.meta_desc && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.meta_desc}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                {(post.tags ?? []).slice(0, 2).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-[#0A84FF]/10 text-[#0A84FF] rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}

        {(!posts || posts.length === 0) && (
          <p className="col-span-2 text-center text-muted-foreground py-16">
            Статьи скоро появятся
          </p>
        )}
      </div>
    </main>
  );
}
