const WORDSTAT_API = "https://api.direct.yandex.com/json/v5/keywordsresearch";

interface WordstatResult {
  phrase: string;
  volume: number;
}

function getToken(): string | null {
  return process.env.WORDSTAT_TOKEN || null;
}

async function wordstatRequest(
  method: string,
  params: Record<string, unknown>,
  retries = 2
): Promise<unknown> {
  const token = getToken();
  if (!token) throw new Error("WORDSTAT_TOKEN not set");

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(WORDSTAT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ru",
      },
      body: JSON.stringify({ method, params }),
    });

    if (res.status === 429) {
      const wait = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Wordstat API error ${res.status}: ${text}`);
    }
    return await res.json();
  }
  throw new Error("Wordstat API: max retries exceeded");
}

export async function getSearchVolume(phrase: string): Promise<number> {
  try {
    const result = await wordstatRequest("GetWordstatReport", {
      Phrases: [phrase],
      GeoID: [225],
    });
    const data = result as Record<string, unknown>;
    if (data.result && Array.isArray(data.result)) {
      const first = data.result[0] as Record<string, unknown>;
      if (first && typeof first.Shows === "number") return first.Shows;
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function collectSeedQueries(
  seeds: string[],
  topN = 10
): Promise<WordstatResult[]> {
  const token = getToken();
  if (!token) return [];

  const results: WordstatResult[] = [];
  for (const phrase of seeds) {
    try {
      const result = await wordstatRequest("GetWordstatReport", {
        Phrases: [phrase],
        GeoID: [225],
      });
      const data = result as Record<string, unknown>;
      if (data.result && Array.isArray(data.result)) {
        for (const item of data.result) {
          const r = item as Record<string, unknown>;
          if (r.Phrase && typeof r.Shows === "number") {
            results.push({ phrase: String(r.Phrase), volume: r.Shows as number });
          }
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    } catch {
      // best-effort
    }
  }

  const seen = new Map<string, number>();
  for (const r of results) {
    const key = r.phrase.toLowerCase().trim();
    if ((seen.get(key) ?? 0) < r.volume) seen.set(key, r.volume);
  }

  return Array.from(seen.entries())
    .map(([phrase, volume]) => ({ phrase, volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, topN);
}
