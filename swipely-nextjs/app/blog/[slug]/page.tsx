import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractFaq, extractToc } from "@/lib/blog/utils";
import { TableOfContents } from "@/components/blog/TableOfContents";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: post } = await supabase
    .from("swipely_blog_posts")
    .select("title, meta_desc, slug, tags, published_at, cover_image")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return {};

  return {
    title: `${post.title} — Блог Swipely`,
    description: post.meta_desc ?? undefined,
    keywords: post.tags ?? undefined,
    openGraph: {
      title: post.title,
      description: post.meta_desc ?? undefined,
      type: "article",
      url: `https://swipely.ru/blog/${post.slug}`,
      publishedTime: post.published_at,
      ...(post.cover_image && {
        images: [{ url: post.cover_image, width: 1200, height: 630 }],
      }),
    },
    alternates: {
      canonical: `https://swipely.ru/blog/${post.slug}`,
    },
  };
}

// HTML content is generated server-side from our own Markdown pipeline (marked)
// and stored in Supabase — it is not user-supplied input, so this is safe.
function ArticleContent({ html }: { html: string }) {
  // eslint-disable-next-line react/no-danger
  return (
    <article
      className="prose prose-invert max-w-none prose-headings:text-foreground prose-a:text-[#0A84FF]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from("swipely_blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  const [{ data: prev }, { data: next }] = await Promise.all([
    supabase
      .from("swipely_blog_posts")
      .select("slug, title")
      .eq("status", "published")
      .lt("published_at", post.published_at)
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("swipely_blog_posts")
      .select("slug, title")
      .eq("status", "published")
      .gt("published_at", post.published_at)
      .order("published_at", { ascending: true })
      .limit(1)
      .single(),
  ]);

  const minutes = readingTime(post.content_md ?? "");
  const faqItems = extractFaq(post.content_md ?? "");
  const toc = extractToc(post.content_md ?? "");

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-12 lg:grid lg:grid-cols-[1fr_240px] lg:gap-12 lg:items-start">
      <main>
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/blog" className="hover:text-foreground transition-colors">
            Блог
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground truncate">{post.title}</span>
        </nav>


        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Команда Swipely</span>
            <span>·</span>
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            <span>·</span>
            <span>{minutes} мин чтения</span>
            {(post.tags ?? []).slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-[#0A84FF]/10 text-[#0A84FF] rounded-md text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <ArticleContent html={post.content_html ?? ""} />

        {(prev || next) && (
          <nav className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="p-4 border border-border rounded-lg hover:border-[#0A84FF]/60 transition-colors group"
              >
                <span className="text-muted-foreground text-xs">← Предыдущая</span>
                <p className="font-medium mt-1 line-clamp-2 group-hover:text-[#0A84FF] transition-colors">
                  {prev.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/blog/${next.slug}`}
                className="p-4 border border-border rounded-lg hover:border-[#0A84FF]/60 transition-colors text-right group"
              >
                <span className="text-muted-foreground text-xs">Следующая →</span>
                <p className="font-medium mt-1 line-clamp-2 group-hover:text-[#0A84FF] transition-colors">
                  {next.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}

        <div className="mt-10 p-6 bg-[#0A84FF]/5 rounded-xl border border-[#0A84FF]/20 text-center">
          <p className="text-lg font-semibold mb-2">
            Создай карусель за 30 секунд
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            18 шаблонов, ИИ-генерация текста, экспорт в PNG. Бесплатный старт без карты.
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-3 bg-[#0A84FF] text-[#0D0D14] rounded-full font-medium hover:bg-[#c8e83a] transition-colors"
          >
            Попробовать Swipely →
          </Link>
        </div>
      </main>

      {toc.length > 0 && (
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <TableOfContents items={toc} />
          </div>
        </aside>
      )}
      </div>

      {faqItems.length > 0 && (
        // FAQ schema — content extracted from our own pipeline-generated markdown, safe to render
        // eslint-disable-next-line react/no-danger
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map(({ question, answer }) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: { "@type": "Answer", text: answer },
              })),
            }),
          }}
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["BlogPosting", "Article"],
            headline: post.title,
            description: post.meta_desc,
            datePublished: post.published_at,
            dateModified: post.published_at,
            inLanguage: "ru",
            keywords: (post.tags ?? []).join(", "),
            ...(post.cover_image && { image: post.cover_image }),
            author: {
              "@type": "Organization",
              name: "Swipely",
              url: "https://swipely.ru",
            },
            publisher: {
              "@type": "Organization",
              name: "Swipely",
              url: "https://swipely.ru",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://swipely.ru/blog/${post.slug}`,
            },
          }),
        }}
      />
    </>
  );
}
