# V4 Clean-Rebuild Stabilization

V4 was built from the last intact V3.1 package rather than from the conflict-damaged GitHub tree. This intentionally restores files that had been truncated during prior merges, including the database client, daily engine, importance engine, Brief Me page, and cron route.

The recommended upload method deletes the working-tree contents while preserving `.git`, then copies the V4 project into the repository. This prevents obsolete V1/V2/V3 files from lingering and causing duplicate routes or stale imports.

The V4 gate is: dependency install → typecheck → production build → static check → stabilization check → V4 system check.
