# Admin Moderation Board (Generation 1)

## API Surface

- `GET /api/admin/mod/list?coll=signals|ideas|events&status=new|...`
  - Guarded via `_guard.ts`, requires Firebase ID token with `role` claim of `admin` or `moderator`.
  - Returns `{ rows: [...] }` ordered by `createdAt`.
- `POST /api/admin/mod/status`
  - Payload: `{ coll, id, to, note? }`
  - Transaction updates `status`, `statusAt`, `assignee`, creates history entry.
- `POST /api/admin/mod/bulk`
  - Payload: `{ coll, ids, action, payload }` where `action` ∈ { `status`, `assign`, `tag`, `archive` }.
  - Batch updates docs and, for `status`, adds a history entry.

## UI Overview (`/admin/mod`)

- Tabs per collection (`signals`, `ideas`, `events`).
- Status filter chips based on shared `STATUS_ORDER` and `STATUS_LABEL` constants.
- Bulk actions for status transitions and archive.
- SLA badge using shared SLA hours (48/72/24) with colored indicators (green/orange/red).
- Single-record "Следващ" button to advance to next status in workflow.

## Shared Types

Defined in `packages/shared/src/moderation.ts` and exported from `index.ts`:

```ts
export type RecordType = "signals" | "ideas" | "events";
export type ModerationStatus = "new" | "triaged" | "in_progress" | "resolved" | "rejected" | "archived";
```

Includes `STATUS_LABEL`, `STATUS_ORDER`, `SLA_HOURS` for reuse.

## SLA Escalation (Next Step)

Planned Cloud Function (see spec):

- Scheduled hourly (`functions.pubsub.schedule("every 1 hours")`).
- For each collection, query `status` in (`new`, `triaged`) older than configured SLA.
- Update documents with `{ escalated: true, escalatedAt: now }` and append history entry `{ action: "escalate" }`.
- Consider sending alert/notification to moderators (future generation).

## Firestore Security Notes

- Only Admin SDK should mutate moderated collections.
- Suggested rule snippet:

```text
match /{coll in ["signals","ideas","events"]}/{id} {
  allow update: if request.auth != null && request.auth.token.role in ["admin","moderator"];
  match /history/{hid} {
    allow read: if request.auth != null && request.auth.token.role in ["admin","moderator"];
    allow write: if false;
  }
}
```

If all writes go through Admin SDK, leave client `update` denied to prevent bypass.

## Acceptance Checklist

- `/[locale]/admin/mod` lists records for each collection/status, showing SLA badge and status label.
- Bulk actions update selected rows (status, assign, tag, archive) and append history entries.
- Single "Следващ" action advances workflow and sets assignee.
- RBAC: non-moderators receive 403 from `/api/admin/mod/*` endpoints.
- SLA badge colors: green (>6h left), amber (<6h left), red (overdue) with "Просрочено" label when negative.
- History tab (to be completed in next generation) will consume `history` subcollection created by status/bulk updates.
- (Future) Cron `slaEscalate` marks overdue items and records history entry.

## Testing Steps

1. Sign in as moderator/admin, obtain ID token (stored as `localStorage.idToken` via auth flow).
2. Load `/bg/admin/mod`; verify list renders without error.
3. Change status via single action; confirm Firestore document reflects new `status`, `statusAt`, `assignee`, and `history` subdoc.
4. Select multiple rows, run bulk `Resolved`; confirm all docs updated and history appended.
5. Adjust system clock or create backdated doc to verify SLA badges show amber/red states.
6. Attempt API call without token or as viewer; expect 403 response.
