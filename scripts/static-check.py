from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
json.load(open(root/'package.json'))
required=['src/lib/engine/daily.ts','src/lib/engine/queue.ts','src/lib/engine/source.ts','src/lib/engine/events.ts','src/app/api/cron/daily/route.ts','src/app/api/cron/worker/route.ts','db/schema.sql']
missing=[p for p in required if not (root/p).exists()]
if missing: raise SystemExit('missing: '+', '.join(missing))
imports=[]
for p in (root/'src').rglob('*.ts*'):
    txt=p.read_text()
    imports+=re.findall(r'from ["\']@/([^"\']+)["\']',txt)
bad=[]
for imp in imports:
    candidates=[root/'src'/f'{imp}.ts',root/'src'/f'{imp}.tsx',root/'src'/imp/'index.ts']
    if not any(x.exists() for x in candidates):bad.append(imp)
if bad: raise SystemExit('unresolved aliases: '+', '.join(sorted(set(bad))))
print('static check OK')
