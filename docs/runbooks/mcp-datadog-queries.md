# MCP & Portal usage — Datadog query cheat-sheet

The dev-portal logger emits structured `portal_*` events to Datadog
(see `web/api/helpers/portal-events.ts`). Each event carries:

| Field | Values |
|---|---|
| `@event` | `app_creation` \| `action_creation` \| `app_submission` \| `action_verification` |
| `@actor` | `human` \| `mcp` |
| `@team_id` | string |
| `@app_id` | string |
| `@action` | string (verification / action creation) |
| plus event-specific metadata in the payload |

## One-time setup: create log facets

In Datadog → **Logs → Configuration → Facets**, add facets for the fields
you'll filter on:

- `@event`
- `@actor`
- `@team_id`
- `@app_id`
- `@action`
- `@environment`
- `@nullifier_reused`
- `@app_mode`

If the facets already exist (Datadog auto-creates many) you can skip this.

## Widget queries (paste-ready)

All queries assume `service:developer-portal`. Adjust if your service tag differs.

### 1. Apps created (timeseries, split by actor)

```
service:developer-portal @event:app_creation
```

Visualization: timeseries / count, **group by `@actor`**. This gives the
Stripe-style "Apps created" chart with `human` vs `mcp` breakdown.

### 2. Mini-apps created via MCP (single counter)

```
service:developer-portal @event:app_creation @actor:mcp @app_mode:mini-app
```

### 3. Apps with at least one action verified (top list / counter)

```
service:developer-portal @event:action_verification
```

Visualization: query value, **measure: `count_unique(@app_id)`** over
your time window. This is the "apps with one action verified" milestone
without needing per-write deduplication.

### 4. Verifications per app (top list)

```
service:developer-portal @event:action_verification
```

Visualization: top list, group by `@app_id`, measure `count`. Optional
filter `@nullifier_reused:false` to count unique end-users only.

### 5. App store submissions (timeseries, split by actor)

```
service:developer-portal @event:app_submission
```

Visualization: timeseries / count, group by `@actor`.

### 6. Action creations (timeseries, split by actor)

```
service:developer-portal @event:action_creation
```

Visualization: timeseries / count, group by `@actor`.

### 7. MCP tool error rate (timeseries)

```
service:developer-portal "Unhandled MCP error"
```

Visualization: timeseries / count. Spikes here mean tool calls are hitting
the `-32603` internal-error fallback.

### 8. MCP funnel: app_creation → submission

A funnel chart in Datadog can be built from these two cohorts:

- Step 1 (entered): `service:developer-portal @event:app_creation @actor:mcp` measure `count_unique(@app_id)`
- Step 2 (converted): `service:developer-portal @event:app_submission @actor:mcp` measure `count_unique(@app_id)`

Use `@app_id` as the join key. For the activation step (verified at least
once), add a third query with `@event:action_verification`.

## Notes

- Verifications are emitted with `@actor:human` because end-users (not
  developers) submit proofs. To attribute verifications back to the way
  the app was *built*, correlate `@app_id` against
  `@event:app_creation @actor:mcp` over a longer lookback.
- All log volume scales with usage. If `action_verification` becomes
  noisy, switch the widget to a Datadog metric extracted via Logs →
  Generate Metrics on the same query.
- For dashboards-as-code: this repo doesn't currently check in Datadog
  terraform. If/when it does, the queries above should translate
  one-for-one into `datadog_dashboard_json` resources.
