from pathlib import Path
import re, sys, json
root=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]
required=[
 'package.json','VERSION.md','STABILIZATION.md','SYSTEMS.md','db/schema.sql','db/v3_migration.sql','db/v4_migration.sql','db/seed.sql',
 'src/app/page.tsx','src/app/api/brief/route.ts','src/app/api/cron/daily/route.ts','src/app/api/cron/worker/route.ts',
 'src/app/api/health/route.ts','src/lib/db.ts','src/lib/types.ts','src/lib/engine/daily.ts','src/lib/engine/worker.ts',
 'src/lib/engine/brief-object.ts','src/lib/engine/entity-resolution.ts','src/lib/engine/evidence-graph.ts','src/lib/engine/historical.ts'
]
for rel in required:
 p=root/rel
 if not p.exists(): errors.append(f'missing required file: {rel}')
 elif p.is_file() and p.stat().st_size==0: errors.append(f'critical file is empty: {rel}')

# Reject unresolved merge markers.
for p in root.rglob('*'):
 if not p.is_file() or '.git' in p.parts or 'node_modules' in p.parts: continue
 if p.suffix.lower() not in {'.ts','.tsx','.js','.json','.sql','.md','.py','.css'}: continue
 try: text=p.read_text(errors='ignore')
 except Exception: continue
 if re.search(r'^(<<<<<<<|=======|>>>>>>>)',text,re.M): errors.append(f'merge conflict marker: {p.relative_to(root)}')

# Lightweight SQL guardrails for common conflict corruption.
for rel in ['db/schema.sql','db/v3_migration.sql','db/v4_migration.sql']:
 p=root/rel
 if not p.exists(): continue
 text=p.read_text()
 if re.search(r',\s*\);',text): errors.append(f'suspicious trailing comma before closing table/statement: {rel}')
 if text.count('$$')%2: errors.append(f'unbalanced PostgreSQL dollar quote: {rel}')

# Check local alias imports resolve to files/directories.
exts=['.ts','.tsx','.js','.jsx']
for p in list((root/'src').rglob('*.ts'))+list((root/'src').rglob('*.tsx')):
 text=p.read_text(errors='ignore')
 for imp in re.findall(r'from\s+["\'](@/[^"\']+)["\']',text):
  rel=imp[2:]
  base=root/'src'/rel
  ok=base.exists() or any(Path(str(base)+e).exists() for e in exts) or any((base/f'index{e}').exists() for e in exts)
  if not ok: errors.append(f'unresolved local import {imp} in {p.relative_to(root)}')

# Contract markers that stabilization depends on.
contracts={
 'src/lib/types.ts':['export interface BriefRequest','export interface BriefPlan','export interface BriefResult'],
 'src/lib/engine/queue.ts':['idempotency_key','briefs_claim_job','lease_expires_at'],
 'src/app/api/cron/daily/route.ts':['CRON_SECRET'],
 'src/app/api/admin/intelligence/route.ts':['ADMIN_TOKEN'],
 'src/app/api/brief/route.ts':['composeBrief'],
}
for rel,needles in contracts.items():
 p=root/rel
 if not p.exists(): continue
 text=p.read_text()
 for n in needles:
  if n not in text: errors.append(f'contract marker {n!r} missing in {rel}')

# Package sanity.
try:
 pkg=json.loads((root/'package.json').read_text())
 if pkg.get('version')!='0.4.0': warnings.append('package version is not 0.4.0')
except Exception as e: errors.append(f'package.json invalid: {e}')

if errors:
 print('V4 STABILIZATION CHECK: FAILED')
 for e in errors: print(' -',e)
 if warnings:
  print('Warnings:'); [print(' -',w) for w in warnings]
 sys.exit(1)
print('V4 STABILIZATION CHECK: OK')
for w in warnings: print('warning:',w)
