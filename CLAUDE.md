# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is an npm workspaces monorepo (`client`, `server`) with a root `package.json`.

```bash
npm install                 # installs both workspaces from the root
npm run dev                 # runs server (:4000) and client (:5173) concurrently
```

### Server (`server/`, run with `-w server` from root or `cd server` first)
```bash
npm run dev -w server       # tsx watch — auto-restarts on change
npm run build -w server     # tsc build to dist/
npm run test -w server      # vitest run (all tests, one-shot)
npx vitest run <path>       # run a single test file (from server/)
npx vitest run -t "<name>"  # run tests matching a name pattern
npm run prisma:migrate -w server   # create + apply a migration (prompts for name if omitted)
npm run prisma:generate -w server  # regenerate Prisma client after schema.prisma changes
npm run prisma:studio -w server    # GUI for inspecting/editing DB rows
npm run seed -w server             # loads demo user demo@example.com / password123 with sample items
```

### Client (`client/`)
```bash
npm run dev -w client       # Vite dev server
npm run build -w client     # tsc -b && vite build
npx tsc -b --noEmit          # typecheck only (from client/)
```

### Local database
PostgreSQL runs as a native Windows service (installed via winget, not Docker). Connection string lives in `server/.env` (`DATABASE_URL`), pointing at a local `inventory` database. `server/.env.example` documents all required env vars (JWT secret, SMTP config, client origin, port).

There is no CI-configured linter for the server; the client has `oxlint` (`npm run lint -w client`) but it isn't wired into a build gate.

## Architecture

### The simulation engine is the core of the app — and it's a pure, isolated module
`server/src/engine/` (`simulate.ts`, `evaluateCandidateBatch.ts`, `dateUtils.ts`, `types.ts`) has **zero dependencies on Prisma or any I/O** — it takes plain `BatchInput[]` / `ConsumptionRateInput` / `RecurringSupplyInput` objects and returns a `SimulationResult`. This is deliberate: the same `simulate()` function is called from two different contexts —
- `services/projection.service.ts` — projects forward from "today" for the UI (charts, warnings), with `includeFutureDeliveries: true`.
- `jobs/dailyProjectionJob.ts` — rolls real batches forward from their last snapshot to "today" (`includeFutureDeliveries: false`, since recurring deliveries only become real `Batch` rows when the user records them — the job never invents batches), then persists the result.

**Gotcha:** `simulate()`'s day loop is `for (offset = 0; offset <= horizonDays; offset++)` — inclusive of both endpoints, so `horizonDays: N` simulates `N + 1` calendar days. This caused a real off-by-one bug in the rollforward job (fixed by passing `elapsedDays - 1`); any new caller needs to reason about this explicitly rather than assuming `horizonDays` = number of days simulated.

FIFO consumption is **by soonest-expiry-first**, not receipt order — the goal is minimizing waste, not accounting purity. `evaluateCandidateBatch()` (used by the "accept this batch?" waste-check) works by appending the candidate as an extra batch and re-running `simulate()`, not via separate logic.

`Batch.quantityRemaining` is a **snapshot as of `quantityAsOfDate`**, not a live-decrementing counter — one simulation implementation both ages it forward (persisted nightly) and projects it into the future (not persisted). When adding batch-mutating logic, don't decrement `quantityRemaining` directly outside of `rollForwardItem` or the CRUD "manual correction" path (`batches.service.ts` `updateBatch`).

The engine's day-count crossover logic (surplus accumulation, `requestNewerExpiryFromDate` / `lastAcceptableDateForCurrentExpiry`) is validated against a hand-derived oracle in `engine/__tests__/simulate.medicineA.test.ts` — if you touch the delivery-intake safety check in `simulate.ts`, re-derive the expected crossover date by hand rather than trusting a snapshot-style assertion.

### Backend layering
`routes/` (thin HTTP wiring, `mergeParams: true` for nested `:itemId/batches/:batchId`) → `controllers/` (zod validation + DTO shaping, Decimal→number via `lib/decimal.ts`) → `services/` (business logic + Prisma calls) → `engine/` (pure). Auth check happens once via `requireAuth` middleware mounted on `itemsRouter`/`reportSettingsRouter`/`dashboardRouter`; ownership checks happen per-resource in the service layer (`assertItemOwnership` in `items.service.ts`, reused by `batches.service.ts` and `projection.service.ts`).

Errors are thrown as typed classes (`lib/errors.ts`: `NotFoundError`, `ForbiddenError`, `ConflictError`; `services/auth.service.ts`: `AuthError`; `services/projection.service.ts`: `ProjectionUnavailableError`) and mapped to HTTP status codes centrally in `middleware/errorHandler.ts`. All async route handlers are wrapped in `asyncHandler` so thrown errors reach that middleware instead of crashing the process.

Auth is JWT access token (short-lived, returned in the response body, held in memory on the client — never localStorage) + an opaque random refresh token, hashed with SHA-256 and stored in the `RefreshToken` table (not a JWT), delivered via an httpOnly cookie scoped to `/api/auth`. Refresh rotates the token (old one revoked, new one issued) on every use.

### Email Notification System (report generator independent of delivery channel)
`services/report.service.ts::generateInventoryReport(userId, {frequency})` is the single source of truth for a periodic inventory report — it is computed once and handed to whichever channel delivers it, never recomputed per-channel. It reuses `dashboard.service.ts::getDashboardOverview()` for Low Stock/Expiring Soon/Upcoming Recurring/overview counts and `projection.service.ts::getProjectionSummary()` per item for the Recommendation section — it never re-derives any of that business logic itself.

The Recommendation section's wording is a **verbatim port** of the client's recommendation-banner copy and visibility gating (`lib/recommendationText.ts`, ported from `client/src/lib/recommendation.ts` + `NextDeliveryRecommendationCallout.tsx`) — only the pure string-formatting/gating predicate is duplicated; the underlying numbers (`nextDeliveryRecommendedQuantity`, `atRiskExpiryDate`) still come exclusively from `getProjectionSummary()`. Keep `recommendationText.ts` in sync if that UI copy ever changes.

`reports/pdfTemplate.ts` (self-contained inline-styled HTML, no external assets) + `reports/pdfRenderer.ts` (Puppeteer: launch headless, `setContent`, `page.pdf()`, always `browser.close()` in a `finally`) render the PDF attachment; `reports/emailBodyTemplate.ts` renders the plain-text email body — both consume the same `InventoryReportData` from `report.service.ts`. `reports/channels/ReportChannel.ts` + `reports/channels/registry.ts` mirror the old notification system's interface-plus-registry *pattern* (not its code) so SMS/WhatsApp/Push can be added later as one new channel file + one registry line, with zero changes to report generation. `reports/mailer.ts` wraps `nodemailer`, falling back to `jsonTransport` + console logging when `SMTP_HOST` is unset (never hard-fails in local dev), same as before.

There is no per-event notification log or preference table anymore — `EmailReportSettings` (one row per user: `isEnabled`, `recipientEmails` (`String[]`, one row supports multiple recipients), `frequency`, `lastSentAt`) is the entire persisted state. Sending to multiple recipients renders the PDF/email body exactly once (`EmailReportChannel.ts::sendReportToRecipients`) and reuses it across every recipient rather than re-rendering per address; a failed send to one recipient doesn't stop the rest — each result is tracked individually (`{recipientEmail, success, error?}`) and surfaced back to the caller (the test-email endpoint returns `{sent, failed, failedAddresses}`; the scheduled job just logs failures and still advances `lastSentAt` as long as at least one recipient succeeded).

### Daily jobs
`jobs/dailyProjectionJob.ts` exports `runDailyProjectionJob()` as a plain async function (not tied to `node-cron`) specifically so it can be invoked directly in tests and later moved to a real queue/worker without touching its internals — it only ages batches forward now (no notification dispatch). `jobs/reportSchedulerJob.ts::runScheduledReportsJob()` follows the same plain-async-function convention: it finds all `isEnabled` `EmailReportSettings` rows and sends a report to any that are **due on a rolling interval anchored to `lastSentAt`** (WEEKLY: ≥7 days since last send; MONTHLY: ≥1 calendar month, via `addMonths`) — not a fixed calendar day, since the UI has no day-of-week/month picker. `jobs/scheduler.ts` is the only place `node-cron` is imported; it registers both jobs (06:00 and 07:00 respectively, report job after so batch data is fresh).

### Frontend
React Query owns all server state (`client/src/api/*.ts`, one file per resource, each exporting hooks like `useItems`, `useCreateBatch`). Mutations invalidate by the resource's query key prefix (e.g. `['items', itemId]`), which React Query matches against more specific keys like `['items', itemId, 'projection', 'summary']` automatically — no need to enumerate every dependent query key on invalidation. Auth state is a small React Context (`context/AuthContext.tsx`) wrapping an in-memory access token (`api/client.ts`); the axios response interceptor handles silent refresh-and-retry on a 401.

Tailwind is v4, wired via the `@tailwindcss/vite` plugin in `vite.config.ts` (not PostCSS/`tailwind.config.js` — that's the v3 pattern and doesn't apply here).

`components/batches/AcceptBatchDialog.tsx` only runs the pre-accept waste-check when the item already has a consumption rate set (the check is meaningless without one, and previously failed silently with no user feedback when it wasn't set — see git history if that regresses).
