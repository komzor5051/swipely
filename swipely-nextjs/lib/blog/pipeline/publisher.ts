import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, renderMarkdown } from "@/lib/blog/utils";
import { generateFlash } from "@/lib/blog/gemini";

interface PublishInput {
  topicId: string;
  title: string;
  content: string;
  tags: string[];
  coverImage?: string | null;
}

export async function publishPost(input: PublishInput): Promise<string> {
  const supabase = createAdminClient();

  // Shorten title if > 55 chars (SEO best practice)
  let title = input.title;
  if (title.length > 55) {
    title = await generateFlash(
      `Сократи заголовок до 55 символов максимум, сохрани смысл и ключевые слова. Верни ТОЛЬКО заголовок, без кавычек.\n\nЗаголовок: "${title}"`
    );
    title = title.trim().replace(/^["«]|["»]$/g, "");
    if (title.length > 55) title = title.slice(0, 52) + "...";
  }

  const slug = slugify(title);
  const contentHtml = renderMarkdown(input.content);

  const metaDesc = await generateFlash(
    `Напиши SEO мета-описание (РОВНО 150-155 символов) для статьи с заголовком "${title}". Только текст, без кавычек.`
  );

  const { data, error } = await supabase
    .from("swipely_blog_posts")
    .insert({
      topic_id: input.topicId,
      slug,
      title,
      meta_desc: metaDesc.trim().slice(0, 160),
      content_md: input.content,
      content_html: contentHtml,
      cover_image: input.coverImage ?? null,
      tags: input.tags,
      cta_url: "https://swipely.ru",
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("slug")
    .single();

  if (error) throw new Error(`Publish failed: ${error.message}`);

  // Mark topic as used
  await supabase
    .from("swipely_blog_topics")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", input.topicId);

  return data.slug;
}
