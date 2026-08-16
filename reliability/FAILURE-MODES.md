# V2 Failure modes and recovery

| Failure | Behavior | Recovery |
|---|---|---|
| Source timeout | Request aborts at hard timeout | Exponential retry; source failure count increments |
| Source repeatedly fails | Circuit opens after 3 consecutive failures | Source skipped for 30 minutes, site serves last verified state |
| Duplicate cron | Postgres advisory lock rejects second daily run | Caller receives `already-running` |
| Duplicate document | `(source_id, content_hash)` unique constraint | Duplicate ignored |
| Duplicate job | `idempotency_key` unique constraint | Duplicate enqueue ignored |
| Worker dies | Lease expires | `recoverStale()` moves job to retry/dead |
| Job repeatedly fails | attempts reach max | Dead-letter state; admin shows it |
| Database unavailable | Public demo surfaces fallback; processing fails closed | Restore DB; retry run |
| AI unavailable | AI-dependent job remains review/retry capable | Existing published state remains untouched |
| Contradictory evidence | Claim marked disputed/manual | Human review required |
| Partial source run | Run marked partial, not falsely successful | Failed sources retry later |
