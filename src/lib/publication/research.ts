import { db } from "@/lib/db";
import { researchSubject } from "@/lib/research/research-engine";
import type { BriefRequest } from "@/lib/types";
import type { PublicationResearch } from "@/lib/publication/types";
import { primarySourceCount, scoreOpportunity, sourceFamilies } from "@/lib/publication/scoring";

function normalizedWords(text: string) {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(x => x.length > 2));
}

function titleSimilarity(a: string, b: string) {
  const A = normalizedWords(a), B = normalizedWords(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const word of A) if (B.has(word)) common++;
  return common / Math.max(A.size, B.size);
}

async function noveltyFor(subject: string) {
  if (!process.env.DATABASE_URL) return 82;
  try {
    const sql = db();
    const rows = await sql`
      select title,primary_keyword
      from publication_articles
      where status in ('review','published')
      order by created_at desc
      limit 300
    `;
    let highest = 0;
    for (const row of rows as Array<{ title: string; primary_keyword: string }>) {
      highest = Math.max(highest, titleSimilarity(subject, `${row.title} ${row.primary_keyword}`));
    }
    return Math.max(15, Math.round(100 - highest * 85));
  } catch {
    return 75;
  }
}

export async function researchForPublication(
  keyword: string,
  audience = "smart-generalist",
  freshnessHours = 48
): Promise<PublicationResearch> {
  const request: BriefRequest = {
    subject: keyword,
    depth: "research",
    perspective: audience === "investor" ? "investor" :
      audience === "executive" ? "executive" :
      audience === "developer" ? "developer" :
      audience === "student" ? "student" :
      audience === "marketer" ? "marketer" : "general",
    sourcePolicy: "verified",
    freshnessRequirement: freshnessHours <= 72 ? "recent" : "current",
    format: "web"
  };
  const graph = await researchSubject(request);
  const novelty = await noveltyFor(graph.canonicalSubject || keyword);
  const opportunity = scoreOpportunity(graph, novelty);
  return {
    graph,
    opportunity,
    primarySourceCount: primarySourceCount(graph),
    independentFamilies: sourceFamilies(graph)
  };
}
