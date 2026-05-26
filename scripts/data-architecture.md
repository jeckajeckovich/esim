# SimRoam — Data Architecture Reference

## Plan Type System

Plans have two orthogonal type fields:

### `operator_type` — who provides the plan (source provenance)

| Value | Meaning |
|---|---|
| `local_operator` | National operator selling in their home market |
| `aggregator_snapshot` | Travel eSIM from marketplace (Airalo, Nomad, etc.) |
| `regional_eu` | Cross-border EU setup (Orange Flex, etc.) |

### `plan_category` — what strategic purpose the plan serves (authoritative)

| Value | Description | Example |
|---|---|---|
| `local_operator` | Standard domestic SIM, no cross-border value | Yettel Serbia, Vodafone DE |
| `travel_esim` | Instant data-only eSIM for travellers | Airalo Serbia 10 GB |
| `roaming_bundle` | Add-on that extends roaming capability | A1 MK Roam Surf Balkan |
| `balkans_roaming` | Plan whose primary value is WB cross-border roaming | One Montenegro Tourist |
| `eu_nomad` | Monthly EU-wide roaming for nomads | Orange Flex Poland |

**Rule**: always use `plan_category` in logic. `operator_type` is kept for backwards compatibility only.

### `data_confidence` — how reliable is this data

| Value | When to use |
|---|---|
| `verified_official` | Fetched from operator's official page, manually confirmed |
| `verified_manual` | Manually verified from source, not from API |
| `community_verified` | Cross-checked community reports |
| `provider_listed` | From provider's own listing (Airalo etc.) — may change without notice |
| `price_snapshot` | Scraped from aggregator; treat as indicative only |
| `needs_review` | Data exists but not recently verified — show caveat in UI |

**Rule**: never surface `needs_review` data without a visible caveat.

---

## Helper Functions (page.tsx)

```typescript
isLocal(p)           // plan_category === "local_operator"
isSnap(p)            // plan_category === "travel_esim"
isEuNomad(p)         // plan_category === "eu_nomad"
isBalkansRoaming(p)  // plan_category === "balkans_roaming"
isRoamingBundle(p)   // plan_category === "roaming_bundle"
isScorable(p)        // local_operator OR balkans_roaming OR roaming_bundle
                     // these are the plans scored by the recommendation engine
```

`isScorable` is used in `useRec` to build the scored list — it includes plans that
provide cross-border value (balkans_roaming, roaming_bundle) alongside pure local plans.

---

## Roaming Fields

Both boolean fields must always be explicitly set (never null/missing):

| Field | Type | Meaning |
|---|---|---|
| `western_balkans_roaming` | `bool` | Plan provides roaming in Western Balkans region |
| `eu_roaming` | `bool` | Plan provides EU/EEA roaming |
| `roaming_cap_gb` | `float \| null` | GB of roaming included (null = same as domestic) |
| `roaming_region` | `string \| null` | e.g. "EU", "Balkans", country code |
| `roaming_after_quota_rate` | `string \| null` | e.g. "0.91 EUR/100 MB" |

---

## ROAMING_MATRIX (page.tsx)

A static `Record<string, Record<string, RoamVal>>` where `from` is the SIM country
and `to` is the destination country. Values: `"yes" | "limited" | "no"`.

**Rule**: only mark `"yes"` when a specific plan is confirmed to provide roaming.
Mark `"no"` when no tourist plan in that country provides WB roaming.
Mark `"limited"` only when coverage is partial or FUP-constrained.

Do NOT mark `"yes"` without a specific plan reference in ROAMING_NOTES.

---

## Adding a new country

1. Add source YAML to `sources/{cc}/`
2. Create parser in `parsers/{cc_operator}.py`
3. Register in `scripts/pipeline.py` PARSER_REGISTRY
4. Add country to `app/data/countries.json` with `cross_border_note` if relevant
5. Add `CountryCode` type to `app/page.tsx`
6. Update `ROAMING_MATRIX` and `ROAMING_NOTES` if the country has WB roaming
7. Run `python3 scripts/pipeline.py --country {CC} --merge`
8. Run `python3 scripts/validate.py`

---

## Adding a travel eSIM

Use `operator_type: "aggregator_snapshot"` and `plan_category: "travel_esim"`.
Always include:
- `benchmark_type`: one of `travel_esim_short | travel_esim_medium | travel_esim_monthly`
- `data_confidence: "provider_listed"` (minimum for Airalo/Nomad)
- `local_number: false`
- `western_balkans_roaming: false` (explicitly)
- `eu_roaming: false` (unless it's a EU regional eSIM)
- Warning: "Verify current price at {source} before purchasing"

---

## What NOT to do

- Do NOT set `western_balkans_roaming: true` without a `roaming_cap_gb`
- Do NOT use `data_confidence: "verified_official"` without a source URL
- Do NOT mix `plan_category: "balkans_roaming"` and `eu_roaming: true`
  (these are different roaming zones — a plan can't be both unless explicitly confirmed)
- Do NOT leave `western_balkans_roaming` or `eu_roaming` as `null` or missing
- Do NOT fabricate roaming compatibility — use `needs_review` if uncertain
