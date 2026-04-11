import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase
    .from("swipely_blog_posts")
    .select("slug, title, meta_desc, published_at, tags")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  const items = (posts ?? [])
    .map(
      (post: { slug: string; title: string; meta_desc: string | null; published_at: string }) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://swipely.ru/blog/${post.slug}</link>
      <guid>https://swipely.ru/blog/${post.slug}</guid>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      ${post.meta_desc ? `<description><![CDATA[${post.meta_desc}]]></description>` : ""}
    </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Блог Swipely — карусели для соцсетей</title>
    <link>https://swipely.ru/blog</link>
    <description>Советы по созданию каруселей для ВКонтакте, Instagram и Telegram</description>
    <language>ru</language>
    <atom:link href="https://swipely.ru/blog/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600",
    },
  });
}
