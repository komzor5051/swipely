import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();
  const { data: posts } = await supabase
    .from("swipely_blog_posts")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const blogIndex: MetadataRoute.Sitemap = [
    {
      url: "https://swipely.ru/blog",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const articleUrls: MetadataRoute.Sitemap = (posts ?? []).map(
    (post: { slug: string; published_at: string }) => ({
      url: `https://swipely.ru/blog/${post.slug}`,
      lastModified: new Date(post.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  );

  return [...blogIndex, ...articleUrls];
}
