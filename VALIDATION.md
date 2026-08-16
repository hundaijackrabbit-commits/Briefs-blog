# Validation Record — V3 Stabilized

## Completed in the build environment

- `python3 scripts/static-check.py` — **PASS**
- `python3 scripts/stabilization-check.py` — **PASS**
- ZIP integrity test — performed when packaging
- Required local import resolution — included in stabilization check
- Merge-marker scan — included in stabilization check
- Critical zero-byte file scan — included in stabilization check
- Lightweight SQL corruption scan — included in stabilization check

## Dependency-limited checks

`npm install --ignore-scripts` was attempted in the build environment but external package retrieval timed out. Therefore a meaningful Next.js/React TypeScript compile could not be completed there. A subsequent `npm run typecheck` correctly failed because `next`, `react`, `postgres`, and their type packages were not installed; those errors do **not** constitute an application compile result.

Run the following on the Windows development machine after extracting the project:

```powershell
npm install
npm run typecheck
npm run build
npm run stabilize
```

Do not promote V4 editorial automation to production until those commands pass on the dependency-complete project.
