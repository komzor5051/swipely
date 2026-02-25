export function SectionHeader({
  tag,
  title,
  description,
  centered = true,
}: {
  tag?: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`mb-16 ${centered ? "text-center" : ""}`}>
      {tag && <span className="section-tag mb-4 inline-block">{tag}</span>}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mt-4">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
