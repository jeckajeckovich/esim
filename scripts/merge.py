#!/usr/bin/env python3
"""
SimRoam — Plan Merger
======================
Merges new/updated plans (from parsers) into app/data/plans.json.
Preserves plans for countries not being updated.

Strategy:
- By default: replace all plans for a given operator_id
- Use --append to add without removing existing plans for that operator
- Use --dry-run to see what would happen without writing

Usage:
  python3 scripts/merge.py --input /tmp/new_de_plans.json --operator vodafone_de
  python3 scripts/merge.py --input /tmp/new_de_plans.json --country DE
  python3 scripts/merge.py --input /tmp/new_de_plans.json --operator vodafone_de --dry-run
"""

import sys
import json
import argparse
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
PLANS_PATH = ROOT / "app/data/plans.json"
BACKUP_DIR = ROOT / ".plan_backups"


def backup_plans():
    """Create a timestamped backup before modifying plans.json."""
    BACKUP_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"plans_{ts}.json"
    shutil.copy(PLANS_PATH, backup_path)
    print(f"Backup: {backup_path}")
    return backup_path


def load_json(path):
    with open(path) as f:
        return json.load(f)


def save_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description="Merge plans into SimRoam database")
    parser.add_argument("--input", required=True, help="Path to new plans JSON file")
    parser.add_argument("--operator", help="Replace plans for this operator_id only")
    parser.add_argument("--country", help="Replace all plans for this country_code")
    parser.add_argument("--append", action="store_true", help="Add without removing existing")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()

    if not args.operator and not args.country:
        print("Error: specify --operator or --country to scope the merge")
        sys.exit(1)

    new_plans = load_json(args.input)
    current_plans = load_json(PLANS_PATH)

    if not isinstance(new_plans, list):
        print("Error: input must be a JSON array of plans")
        sys.exit(1)

    # Validate new plans have required fields
    for p in new_plans:
        if not p.get("id"):
            print(f"Error: plan missing 'id': {p}")
            sys.exit(1)

    # Determine which existing plans to keep
    if args.append:
        existing_to_keep = current_plans
    elif args.operator:
        existing_to_keep = [p for p in current_plans if p.get("operator_id") != args.operator]
        removed = [p for p in current_plans if p.get("operator_id") == args.operator]
    elif args.country:
        existing_to_keep = [p for p in current_plans if p.get("country_code") != args.country.upper()]
        removed = [p for p in current_plans if p.get("country_code") == args.country.upper()]

    merged = existing_to_keep + new_plans

    # Detect duplicate IDs
    ids = [p["id"] for p in merged]
    dupes = [id for id in ids if ids.count(id) > 1]
    if dupes:
        print(f"⚠ Duplicate IDs would be created: {set(dupes)}")
        if not args.append:
            print("Run with --append to merge without removing duplicates, or fix source data")
            sys.exit(1)

    print(f"Current plans: {len(current_plans)}")
    if not args.append:
        print(f"Removing {len(removed)} existing plan(s) for {args.operator or args.country}")
    print(f"Adding {len(new_plans)} new/updated plan(s)")
    print(f"Result: {len(merged)} total plans")

    if args.dry_run:
        print("\n[DRY RUN] No changes written.")
        print("Plans that would be written:")
        for p in merged:
            print(f"  {p['id']} | {p.get('provider_name')} | €{p.get('price_eur')} | {p.get('country_code')}")
        return

    backup_plans()
    save_json(merged, PLANS_PATH)
    print(f"\n✅ Merged successfully → {PLANS_PATH}")


if __name__ == "__main__":
    main()
