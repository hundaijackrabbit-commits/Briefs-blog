from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
errors=[]
try: json.loads((root/'package.json').read_text())
except Exception as e: errors.append(f'package.json invalid: {e}')
required=[
 'src/lib/db.ts','src/lib/engine/daily.ts','src/lib/engine/worker.ts','src/lib/engine/brief-object.ts',
 'src/lib/engine/editorial-intelligence.ts','src/lib/engine/editorial-composer.ts','src/lib/engine/publisher.ts',
 'src/lib/engine/citations.ts','src/lib/engine/freshness-maintainer.ts','src/lib/engine/internal-links.ts','src/lib/engine/v4.ts',
 'src/app/api/cron/daily/route.ts','src/app/api/cron/worker/route.ts','src/app/api/brief/route.ts',
 'src/app/api/admin/editorial/route.ts','src/app/admin/editorial/page.tsx','src/app/brief-me/page.tsx',
 'db/schema.sql','db/v3_migration.sql','db/v4_migration.sql','SYSTEMS.md','VERSION.md'
]
for rel in required:
 p=root/rel
 if not p.exists(): errors.append(f'missing {rel}')
 elif p.stat().st_size<20: errors.append(f'truncated {rel} ({p.stat().st_size} bytes)')

for f in list((root/'src').rglob('*.ts'))+list((root/'src').rglob('*.tsx')):
 text=f.read_text(errors='replace')
 for m in re.finditer(r'from\s+[\"\'](@/[^\"\']+)[\"\']',text):
  imp=m.group(1)[2:]
  base=root/'src'/imp
  candidates=[base.with_suffix('.ts'),base.with_suffix('.tsx'),base/'index.ts',base/'index.tsx']
  if not any(x.exists() for x in candidates): errors.append(f'unresolved import {m.group(1)} in {f.relative_to(root)}')

schema=(root/'db/schema.sql').read_text()
for table in ['editorial_revisions','publication_snapshots','corrections','internal_link_suggestions']:
 if f'create table if not exists {table}' not in schema: errors.append(f'schema missing {table}')
if 'Briefs.blog V4: Autonomous Editorial Foundation' not in schema: errors.append('schema missing V4 migration block')

if errors:
 print('V4 CHECK FAILED')
 for e in errors: print('-',e)
 sys.exit(1)
print('V4 CHECK OK')
