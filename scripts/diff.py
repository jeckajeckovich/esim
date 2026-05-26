#!/usr/bin/env python3
"""
SimRoam — Plan Diff
====================
Shows what changed between a proposed update and current plans.json.
Used before merging parser output to review changes.

Usage:
  python3 scripts/diff.py --input /tmp/new_plans.json
  python3 scripts/diff.py --input /tmp/new_plans.json --country DE
  python3 scripts/diff.py --input /tmp/new_plans.json --fields price_eur,data_gb_core
"""

import sys
import json
import argparse
from pathlib import Path

ROOT = Path(__file__).parent.parent
PLANS_PATH = ROOT / "app/data/plans.json"

PRICE_FIELDS = {"price_eur", "price_local", "price_rub"}
DATA_FIELDS = {"data_gb_core", "data_gb_apps", "data_gb", "unlimited_data"}
KEY_FIELDS = {"price_eur", "data_gb_core", "data_gb", "unlimited_data", "duration_days",
              "eu_roaming", "roaming_cap_gb", "esim_supported", "activation_before_arrival",
              "last_verified", "source_url"}


def load(path):
    with open(path) as f:
        return {p["id"]: p for p in json.load(f) if "id" in p}


def fmt_val(v):
    if v is None:
        return "—"
    if isinstance(v, float):
        return f"€{v:.2f}" if v > 0 else str(v)
    return str(v)


def diff_plans(old: dict, new: dict, fields=None, country=None):
    added = set(new) - set(old)
    removed = set(old) - set(new)
    changed = []

    for pid in set(old) & set(new):
        op = old[pid]
        np = new[pid]
        if country and op.get("country_code") != country and np.get("country_code") != country:
            continue
        diffs = []
        check_fields = fields if fields else KEY_FIELDS
        for f in check_fields:
            ov, nv = op.get(f), np.get(f)
            if ov != nv:
                diffs.append((f, ov, nv))
        if diffs:
            changed.append((pid, diffs))

    return added, removed, changed


def main():
    parser = argparse.ArgumentParser(description="Diff SimRoam plans")
    parser.add_argument("--input", required=True, help="Path to new/proposed plans.json")
    parser.add_argument("--country", help="Filter by country code")
    parser.add_argument("--fields", help="Comma-separated fields to check (default: key fields)")
    args = parser.parse_args()

    fields = set(args.fields.split(",")) if args.fields else None
    country = args.country.upper() if args.country else None

    old = load(PLANS_PATH)
    new = load(args.input)

    added, removed, changed = diff_plans(old, new, fields, country)

    # Filter by country for added/removed
    if country:
        added = {pid for pid in added if new[pid].get("country_code") == country}
        removed = {pid for pid in removed if old[pid].get("country_code") == country}

    print("=" * 60)
    print("SimRoam — Plan Diff")
    print("=" * 60)

    if not added and not removed and not changed:
        print("✅ No changes detected")
        return

    if added:
        print(f"\n➕ New plans ({len(added)}):")
        for pid in sorted(added):
            p = new[pid]
            print(f"  + {pid} | {p.get('provider_name')} | €{p.get('price_eur')} | {p.get('data_gb_core') or p.get('data_gb')} GB | {p.get('country_code')}")

    if removed:
        print(f"\n➖ Removed plans ({len(removed)}):")
        for pid in sorted(removed):
            p = old[pid]
            print(f"  - {pid} | {p.get('provider_name')} | €{p.get('price_eur')}")

    if changed:
        print(f"\n✏ Changed plans ({len(changed)}):")
        for pid, diffs in sorted(changed):
            p = new[pid]
            print(f"\n  {pid} ({p.get('provider_name')}, {p.get('country_code')}):")
            for field, ov, nv in diffs:
                emoji = "💰" if field in PRICE_FIELDS else "📊" if field in DATA_FIELDS else "→"
                print(f"    {emoji} {field}: {fmt_val(ov)} → {fmt_val(nv)}")

    print(f"\nSummary: {len(added)} added, {len(removed)} removed, {len(changed)} changed")


if __name__ == "__main__":
    main()
