import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, validAdminCookie } from "@/lib/admin-session";
import { draftOpportunity, publishArticle, researchKeyword } from "@/lib/publication/pipeline";
import { applyArticleProposal, applyBriefProposal } from "@/lib/publication/revalidation";
import { runPublicationWorker, schedulePublicationMaintenance } from "@/lib/publication/scheduler";

async function allowed(req: NextRequest) {
  const secret = process.env.ADMIN_TOKEN;
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (await validAdminCookie(cookie, secret)) return true;
  return Boolean(secret && req.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(req: NextRequest) {
  if (!await allowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL is required" }, { status: 503 });
  const sql = db();
  const [keywords, opportunities, articles, updates, queue] = await Promise.all([
    sql`select * from publication_keywords order by active desc,created_at desc limit 100`,
    sql`select o.*,k.keyword,k.category from publication_opportunities o join publication_keywords k on k.id=o.keyword_id order by o.created_at desc limit 100`,
    sql`select id,slug,title,category,status,editorial_mode,freshness_status,quality_score,published_at,last_revalidated_at,updated_at from publication_articles order by created_at desc limit 100`,
    sql`select id,target_type,target_id,status,review_mode,summary,reason,created_at from publication_update_proposals order by created_at desc limit 100`,
    sql`select target_type,status,count(*)::int count from publication_revalidation_queue group by target_type,status order by target_type,status`
  ]);
  return NextResponse.json({ keywords, opportunities, articles, updates, queue });
}

export async function POST(req: NextRequest) {
  if (!await allowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL is required" }, { status: 503 });
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.action) return NextResponse.json({ error: "action is required" }, { status: 400 });
  const sql = db();

  try {
    if (body.action === "add-keyword") {
      const keyword = String(body.keyword || "").trim().slice(0, 160);
      if (!keyword) return NextResponse.json({ error: "keyword is required" }, { status: 400 });
      const category = String(body.category || "General").trim().slice(0, 60);
      const audience = String(body.audience || "smart-generalist");
      const mode = ["auto","review","manual"].includes(String(body.mode)) ? String(body.mode) : "review";
      const rows = await sql`
        insert into publication_keywords(keyword,category,audience_key,editorial_mode)
        values(${keyword},${category},${audience},${mode})
        on conflict(keyword) do update set
          category=excluded.category,audience_key=excluded.audience_key,editorial_mode=excluded.editorial_mode,
          active=true,next_research_at=now(),updated_at=now()
        returning *
      `;
      return NextResponse.json({ ok: true, keyword: rows[0] });
    }
    if (body.action === "research-keyword") {
      return NextResponse.json({ ok: true, result: await researchKeyword(String(body.id)) });
    }
    if (body.action === "draft-opportunity") {
      return NextResponse.json({ ok: true, result: await draftOpportunity(String(body.id)) });
    }
    if (body.action === "publish-article") {
      return NextResponse.json({ ok: true, result: await publishArticle(String(body.id)) });
    }
    if (body.action === "publish-update") {
      const proposal = (await sql`
        select target_type from publication_update_proposals where id=${String(body.id)}::uuid
      `)[0] as {target_type?:string}|undefined;
      if (!proposal) return NextResponse.json({ error: "Update proposal not found" }, { status: 404 });
      const result = proposal.target_type === "brief"
        ? await applyBriefProposal(String(body.id))
        : await applyArticleProposal(String(body.id));
      return NextResponse.json({ ok: true, result });
    }
    if (body.action === "schedule-maintenance") {
      return NextResponse.json({ ok: true, result: await schedulePublicationMaintenance() });
    }
    if (body.action === "run-worker") {
      return NextResponse.json({ ok: true, result: await runPublicationWorker(Number(body.maxItems || 3)) });
    }
    if (body.action === "dismiss-opportunity") {
      await sql`update publication_opportunities set status='dismissed',updated_at=now() where id=${String(body.id)}::uuid`;
      return NextResponse.json({ ok: true });
    }
    if (body.action === "toggle-keyword") {
      await sql`update publication_keywords set active=not active,updated_at=now() where id=${String(body.id)}::uuid`;
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 409 });
  }
}
