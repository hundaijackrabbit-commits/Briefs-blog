import { db } from "@/lib/db";
import type { OriginalityReport } from "@/lib/publication/types";

function tokens(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function ngrams(text: string, n = 7) {
  const t = tokens(text);
  const out = new Set<string>();
  for (let i = 0; i <= t.length - n; i++) out.add(t.slice(i, i + n).join(" "));
  return out;
}

function overlapRatio(a: string, b: string) {
  const A = ngrams(a), B = ngrams(b);
  if (!A.size || !B.size) return 0;
  let matches = 0;
  for (const g of A) if (B.has(g)) matches++;
  return matches / Math.max(1, Math.min(A.size, B.size));
}

function longestMatchWords(a: string, b: string, cap = 30) {
  const A = tokens(a), B = tokens(b);
  if (!A.length || !B.length) return 0;
  const index = new Map<string, number[]>();
  B.forEach((word, i) => index.set(word, [...(index.get(word) || []), i]));
  let best = 0;
  for (let i = 0; i < A.length; i++) {
    for (const j of index.get(A[i]) || []) {
      let k = 0;
      while (k < cap && i + k < A.length && j + k < B.length && A[i + k] === B[j + k]) k++;
      best = Math.max(best, k);
      if (best >= cap) return best;
    }
  }
  return best;
}

export async function originalityReport(
  draftText: string,
  sourceExcerpts: string[],
  excludeArticleId?: string
): Promise<OriginalityReport> {
  let maxSourceOverlap = 0;
  let maxLibraryOverlap = 0;
  let longestMatchingWords = 0;

  for (const source of sourceExcerpts.filter(Boolean)) {
    maxSourceOverlap = Math.max(maxSourceOverlap, overlapRatio(draftText, source));
    longestMatchingWords = Math.max(longestMatchingWords, longestMatchWords(draftText, source));
  }

  if (process.env.DATABASE_URL) {
    try {
      const sql = db();
      const rows = await sql`
        select s.body
        from publication_article_sections s
        join publication_articles a on a.id=s.article_id
        where a.status='published'
          and (${excludeArticleId ?? null}::uuid is null or a.id<>${excludeArticleId ?? null}::uuid)
        order by a.published_at desc nulls last
        limit 250
      `;
      for (const row of rows as Array<{ body: string }>) {
        maxLibraryOverlap = Math.max(maxLibraryOverlap, overlapRatio(draftText, String(row.body || "")));
        longestMatchingWords = Math.max(longestMatchingWords, longestMatchWords(draftText, String(row.body || "")));
      }
    } catch {
      // Originality still runs against researched source excerpts in degraded/no-DB mode.
    }
  }

  const warnings: string[] = [];
  if (maxSourceOverlap > 0.14) warnings.push("Draft has unusually high phrase overlap with a research source.");
  if (maxLibraryOverlap > 0.20) warnings.push("Draft is too similar to an existing Briefs article.");
  if (longestMatchingWords >= 14) warnings.push(`A ${longestMatchingWords}-word exact phrase match requires review.`);

  return {
    passed: warnings.length === 0,
    maxSourceOverlap,
    maxLibraryOverlap,
    longestMatchingWords,
    warnings
  };
}
