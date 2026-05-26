# SimRoam — Data Sources

This directory contains **raw source snapshots** for each operator.
These are the ground truth before normalization.

## Architecture

```
sources/
  {country_code}/
    {operator_id}.yaml   ← raw snapshot from official source
parsers/
  {operator_id}.py       ← operator-specific parser → normalized Plan objects
scripts/
  validate.py            ← checks all plans against schema
  merge.py               ← merges parsed output into app/data/plans.json
  diff.py                ← shows what changed since last run
  pipeline.py            ← runs: parse → validate → diff → merge
app/data/
  plans.json             ← generated output (do not edit by hand)
  operators.json         ← manually maintained (operator metadata)
  countries.json         ← manually maintained (country metadata)
```

## Source YAML Format

Each source file captures the raw data from the operator's website.
Fields map 1:1 to what's visible on the page — no interpretation yet.

```yaml
meta:
  operator_id: vodafone_de
  country_code: DE
  source_url: https://www.vodafone.de/hilfe/callya.html
  source_name: Vodafone Germany official
  last_verified: "2026-Q2"
  verified_by: manual
  notes: "Manually captured from Vodafone DE website"

plans:
  - raw_title: "CallYa Start"
    raw_price: "4,99 €"
    raw_data: "2 GB"
    raw_duration: "4 Wochen"
    raw_roaming: "EU-Roaming inklusive"
    raw_esim: true
    raw_online: true
    raw_kyc: "VideoIdent"
    raw_address: "hotel accepted"
    raw_number: true
    raw_renewable: true
    raw_auto_renew: false
```

## Workflow

### Manual update (current)
1. Check operator website
2. Update the source YAML
3. Run `python3 scripts/pipeline.py --country DE`
4. Review diff output
5. Commit if correct

### Semi-automated (future)
- GitHub Actions runs parsers nightly
- Diffs are posted as PR comments
- Human reviews and merges

## Adding a new operator
1. Create `sources/{country_code}/{operator_id}.yaml`
2. Create `parsers/{operator_id}.py`
3. Run `python3 scripts/pipeline.py --country {CC}`
4. Check output in `app/data/plans.json`