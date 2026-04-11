import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import ViewerClient from "./ViewerClient";
import type { SlideData } from "@/components/slides/types";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function ViewerPage({ params }: Params) {
  const { id } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return notFound();
  }

  const { data: gen, error } = await admin
    .from("generations")
    .select("id, template, format, output_json, created_at")
    .eq("id", id)
    .single();

  if (error || !gen) {
    return notFound();
  }

  const outputJson = gen.output_json as { slides?: SlideData[]; post_caption?: string } | null;
  const slides: SlideData[] = outputJson?.slides ?? [];
  const format: "square" | "portrait" =
    gen.format === "square" ? "square" : "portrait";

  if (!slides.length) {
    return notFound();
  }

  return (
    <ViewerClient
      generationId={gen.id}
      template={gen.template}
      format={format}
      slides={slides}
      postCaption={outputJson?.post_caption ?? ""}
      createdAt={gen.created_at}
    />
  );
}
