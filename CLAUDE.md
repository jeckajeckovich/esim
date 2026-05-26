# SimRoam — Developer & Maintainer Guide

SimRoam is a trust-first telecom intelligence platform for travellers and digital nomads.
It compares local SIMs, travel eSIMs, and regional EU nomad setups with objective scoring.

**Core principle**: accuracy and trust matter more than speed.
Do not invent telecom facts. If data is uncertain, mark it `needs_review`.

---

## Architecture

```
sources/          Raw YAML snapshots per operator — ground truth
parsers/          Python parsers: YAML → normalized Plan dicts
scripts/          Pipeline tools: validate, diff, merge, orchestrate
app/data/         Generated JSON consumed by Next.js frontend
  plans.json      ← generated output (do not edit by hand)
  operators.json  ← manually maintained
  countries.json  ← manually maintained
app/page.tsx      Single-file Next.js app — all UI logic
app/globals.css   CSS — minimal, no Tailwind utility classes in prose
```

---

## Data confidence levels

Every plan has a `data_confidence` field. Levels from most to least reliable:

| Level | Meaning | Example |
|---|---|---|
| `verified_official` | Sourced from operator's official page, manually confirmed | Yettel Serbia, Vodafone DE |
| `verified_manual` | Manually verified, not from official API | Orange Flex PL |
| `community_verified` | Reported by multiple community sources | (future) |
| `provider_listed` | From provider's own listing, price may change | Airalo, Nomad |
| `price_snapshot` | Scraped from aggregator, treat as indicative | eSIMPlanet |
| `needs_review` | Data exists but not recently verified | Free Mobile FR |

**Rule**: Never surface `needs_review` data in UI without a visible caveat.

---

## Data pipeline workflow

### Adding or updating a plan

1. Update the source YAML in `sources/{country}/{operator}.yaml`
2. Run the parser to preview output:
   ```bash
   python3 parsers/vodafone_de.py
   ```
3. Run the full pipeline in preview mode:
   ```bash
   python3 scripts/pipeline.py --operator vodafone_de
   ```
4. Review the diff output carefully
5. Merge when satisfied:
   ```bash
   python3 scripts/pipeline.py --operator vodafone_de --merge
   ```
6. Validate the result:
   ```bash
   python3 scripts/validate.py
   ```

### Adding a new operator

1. Create `sources/{cc}/{operator_id}.yaml` — raw fields only
2. Create `parsers/{operator_id}.py` — extend `BaseParser`
3. Register in `scripts/pipeline.py`:
   ```python
   PARSER_REGISTRY["new_op"] = "new_op.py"
   COUNTRY_OPERATORS["CC"].append("new_op")
   ```
4. Run pipeline and validate

### Registered parsers (Tier A — automatable)

| Operator | Country | Parser | Status |
|---|---|---|---|
| Vodafone Germany | DE | `parsers/vodafone_de.py` | ✅ Active |
| O2 Germany | DE | `parsers/o2_de.py` | ✅ Active |
| Telekom Germany | DE | `parsers/telekom_de.py` | ✅ Active |
| Orange Flex Poland | EU | `parsers/orange_flex_pl.py` | ✅ Active |
| HoT Austria | AT | `parsers/hot_at.py` | ✅ Active |

### Tier B — manual (source YAMLs exist, no parsers yet)

| Country | Source file | Notes |
|---|---|---|
| Serbia | `sources/rs/serbia.yaml` | Yettel app-data decomposition required |
| Montenegro | `sources/me/montenegro.yaml` | One Tourist best option |
| Bosnia | `sources/ba_al_mk.yaml` | BH Telecom has English page |
| Albania | `sources/ba_al_mk.yaml` | Airport-only activation; online unreliable |
| North Macedonia | `sources/ba_al_mk.yaml` | A1 MK + Telekom MK |

---

## EU Nomad research

See `sources/eu_mvno/eu_nomad_comparison.yaml` for full comparison.

**Current ranking** (as of 2026-Q2):

1. **Orange Flex Poland** — Best documented option. €8/month, 12 GB EU roaming, foreign passport OK, app-only. `verified_manual`.
2. **HoT Austria** — Good second option. €9/month, 8 GB EU roaming, confirmed tourist-accessible. `verified_manual`.
3. **Free Mobile France** — Best roaming on paper (25 GB) but French address may block tourists. **`needs_review` — do NOT recommend until verified.**
4. **Iliad Italy** — Store activation required, Codice Fiscale uncertain, only 6 GB EU roaming. **`needs_review`.**
5. **Lycamobile** — FUP issues, complex recharge. Not recommended.

**Verification needed before promoting Free Mobile FR:**
- Can a non-EU-resident activate without a French bank account?
- Is hotel address accepted for billing?
- Exact EU roaming FUP cap in 2026

---

## Recommendation engine

The engine lives in `useRec()` in `app/page.tsx`. Key decisions:

- **Local vs Travel eSIM**: `buildTravelCmp()` — dual scoring (travelConvScore vs localValueScore), not price-only
- **EU Nomad**: shown when `days >= 14` AND not a Balkans country AND competitive vs cheapest travel eSIM
- **Balkans Nomad**: Orange Flex is NOT shown for RS/BA/ME/AL/MK — it doesn't cover W. Balkans roaming
- **Verdicts**: `travel_wins | travel_better | depends | local_better | local_wins`

**Anti-bias rules:**
- If travel eSIM is objectively better (short trip, no-KYC market, instant arrival), say so
- If local SIM wins, say so
- Never manipulate verdict to force affiliate clicks
- `localEasyEnough` flag prevents "no KYC" preference from pushing toward travel eSIM when local is already frictionless

---

## UI philosophy

Cards show **only**:
1. Price (total for trip duration)
2. Usable data (general-purpose GB, not app-specific)
3. Local number or not
4. Online activation or not
5. One important caveat (app data split, address required, etc.)
6. Why this plan (optimizer insight)

Everything else is behind **"Tap for full details"** (modal).

**Removed from UI**: friction scores, "Aggregator snapshot" label, "No KYC" badge, "Instant" badge, duplicate warning blocks.

**Confidence signals** (via `SourceBtn`):
- 🟢 `verified_official` — "Official source · 2026-Q2"
- 🟢 `verified_manual` — "Manually verified · 2026-Q2"
- 🔵 `provider_listed` — "Provider listing"
- 🟡 `price_snapshot` — "Price may vary"
- ⚪ `needs_review` — "Needs review"

---

## Adding a new country to the frontend

1. Add country entry to `app/data/countries.json`
2. Add country code to `CountryCode` type in `app/page.tsx`
3. Add operators to `app/data/operators.json`
4. Add plans (via parser or manual) to `app/data/plans.json`
5. If Balkans: it will automatically appear in the roaming matrix tab
6. If EU: EU nomad card will appear for 14+ day trips
7. Run `npm run build` to verify

---

## GitHub Actions

`.github/workflows/data-pipeline.yml` runs:
- **Nightly** (3:00 UTC): all parsers in preview mode + stale data check
- **Manual dispatch**: scope by operator or country, optional merge + commit
- **On push to sources/**: triggers on YAML changes

To trigger manually from GitHub → Actions → "SimRoam Data Pipeline" → Run workflow.

---

## What NOT to do

- Do NOT edit `app/data/plans.json` by hand — use the pipeline
- Do NOT invent roaming rules or data caps — check official sources
- Do NOT mark `data_confidence: verified_official` without checking the source URL
- Do NOT show `needs_review` data without a caveat in the UI
- Do NOT force local SIM or travel eSIM in recommendations — let the scoring engine decide
- Do NOT add Balkans-specific recommendations (like "One Montenegro is great") to pages outside Balkans