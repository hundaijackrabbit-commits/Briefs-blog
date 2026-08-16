# V4 Validation

Validated in the build workspace:

- `package.json` parses successfully.
- V4 import-resolution/system check: **PASS**.
- static repository check: **PASS**.
- stabilization check: **PASS**.
- TypeScript parser reached the project without reporting project-code errors beyond missing external packages in this offline environment.
- `npm install` was attempted but package download timed out in this environment, so a full Next.js production build could not be executed here.

## Required desktop gate before push

Run:

```powershell
npm install
npm run typecheck
npm run build
npm run staticcheck
npm run stabilize
npm run v4check
```

Do not push to `main` if any command fails.
