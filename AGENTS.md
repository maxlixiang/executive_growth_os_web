<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Executive Growth OS architecture rules

This section is for AI coding agents. User instructions belong in `README.md`; implementation invariants belong here.

- Identity is always `auth.users.id` (UUID). Email is a login attribute and `profiles.display_name` is an editable nickname. Never use email or nickname as a primary key or infer that a rename creates a new user.
- Private data is isolated by `user_id -> journey_id -> cycle_id`. Every query used for AI context, scoring, recommendations, reviews, interviews, or learning history must be scoped to the authenticated user and the active journey. Never mix data from two users or two journeys.
- Keep the preparation clock separate from the formal-learning clock. `preparation_started_on` anchors the two-week foundation course; `formal_started_on` is set only after baseline diagnosis and anchors two-month assessment cycles.
- Baseline assessment and formal periodic assessments are distinct records. A new or restarted journey is “not assessed”, never automatically scored as zero.
- Restart archives the current journey and preserves audit history. Archived learning, quiz results, evidence, gaps, plans, reviews, interviews, scores, and AI conclusions must not enter the new journey unless a future explicit import workflow is used.
- Trial journeys are first-class journeys. Trial data can be reviewed in all-history view but must not silently become formal baseline evidence.
- Normal cycle rollover inherits valid data within the same journey. Journey restart does not.
- Important mutations require authenticated server-side checks, validated input, and an `activity_events` audit record. Restart requires an explicit reason and the exact strong-confirmation phrase.
- AI scores must include a scoring version, rationale, evidence references, and confidence. The deterministic readiness rubric is knowledge 30 + case 30 + practice 40 per capability, with weighted aggregation and independent readiness gates.
- AI-extracted practice evidence starts as `candidate`. Only user-confirmed evidence may enter progress signals, AI growth context, reviews, or formal assessment; rejected or incomplete evidence remains preserved for audit history.
- Flexible reviews are user-triggered, may cover any valid date range, and are numbered by occurrence rather than calendar cadence. They summarize current-journey facts and must not directly update formal scores, active Focus, or the confirmed growth plan.
- Simulated interviews are user-triggered practice. Store the transcript and coaching feedback, but never treat completion as a formal assessment or directly update formal scores.
- `knowledge_progress`, `user_focuses`, and `user_growth_state` are current-journey derived snapshots. They may be rebuilt or reset on restart; source records and audit history remain journey-scoped and preserved.
