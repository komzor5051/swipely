export interface Source {
  title: string;
  url: string;
  summary: string;
}

export async function searchSources(query: string, numResults = 6): Promise<Source[]> {
  const today = new Date().toISOString().split("T")[0];
  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EXA_API_KEY}`,
    },
    body: JSON.stringify({
      query: `${query} ${today}`,
      numResults,
      useAutoprompt: true,
      type: "auto",
      contents: {
        text: { maxCharacters: 2000 },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Exa search failed: ${response.status}`);
  }

  const data = await response.json();
  return (data.results ?? []).map((r: { title?: string; url: string; text?: string }) => ({
    title: r.title ?? "Untitled",
    url: r.url,
    summary: (r.text ?? "").slice(0, 500),
  }));
}
