# V10.1 Publication Engine overlay

This ZIP is designed to be copied over a working Briefs.blog V10 repository. It intentionally includes only new/changed files.

It preserves the V10 architecture and adds:
- Publication admin desk
- keyword watches and story opportunity scoring
- audience and authorial voice contracts
- structured-claim article composition
- optional provider-neutral writing-model adapter
- source/library originality checks
- editorial quality gates
- public `/articles` publication surface
- daily article + Living Brief revalidation
- durable revalidation queue and bounded publication cron
- historical article versions and evidence-backed update proposals

After overlay:

```powershell
npm install
npm run typecheck
npm run publication:check
npm run check
npm run build
```

If a production database is already connected:

```powershell
npm run publication:db
```

Do not run `npm audit fix --force` as part of installing this patch.
