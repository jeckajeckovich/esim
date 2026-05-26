#!/usr/bin/env python3
"""
SimRoam — Plan Validator
=========================
Checks all plans in app/data/plans.json against the schema rules.

Usage:
  python3 scripts/validate.py
  python3 scripts/validate.py --country DE
  python3 scripts/validate.py --verbose
"""

import sys
import json
import argparse
from pathlib import Path

ROOT = Path(__file__).parent.parent
PLANS_PATH = ROOT / "app/data/plans.json"
sys.path.insert(0, str(ROOT / "parsers"))
from schema import Plan

REQUIRED_FIELDS = [
    "id", "operator_id", "country_code", "operator_type", "plan_category",
    "provider_name", "title", "price_eur", "duration_days",
    "source_url", "last_verified", "verified", "data_confidence",
    "western_balkans_roaming", "eu_roaming",
]

VALID_OPERATOR_TYPES = {"local_operator", "aggregator_snapshot", "regional_eu"}
VALID_CATEGORIES     = {"local_operator", "travel_esim", "roaming_bundle", "balkans_roaming", "eu_nomad"}
VALID_CONFIDENCE     = {"verified_official", "verified_manual", "community_verified",
                        "provider_listed", "price_snapshot", "needs_review"}
VALID_COUNTRIES      = {"RS", "DE", "AL", "ME", "BA", "MK", "EU", "PL", "AT",
                        "CZ", "SK", "NL", "BE", "FR", "ES", "PT", "IT", "RO"}


def validate_plan(p: dict, idx: int, verbose: bool = False) -> list[str]:
    errors = []
    pid = p.get("id", f"[plan #{idx}]")

    # Required fields
    for f in REQUIRED_FIELDS:
        if f not in p or p[f] is None:
            errors.append(f"{pid}: missing required field '{f}'")

    # operator_type
    if p.get("operator_type") not in VALID_OPERATOR_TYPES:
        errors.append(f"{pid}: invalid operator_type '{p.get('operator_type')}'")

    # plan_category — required, authoritative
    if p.get("plan_category") not in VALID_CATEGORIES:
        errors.append(f"{pid}: invalid or missing plan_category '{p.get('plan_category')}' — use one of {VALID_CATEGORIES}")

    # data_confidence
    if p.get("data_confidence") not in VALID_CONFIDENCE:
        errors.append(f"{pid}: invalid or missing data_confidence '{p.get('data_confidence')}'")
    # price
    if isinstance(p.get("price_eur"), (int, float)) and p["price_eur"] <= 0:
        errors.append(f"{pid}: price_eur must be > 0")

    # duration
    if isinstance(p.get("duration_days"), int) and p["duration_days"] <= 0:
        errors.append(f"{pid}: duration_days must be > 0")

    # data: at least one data field or unlimited
    local = p.get("operator_type") == "local_operator"
    has_data = (
        p.get("unlimited_data") or
        p.get("data_gb_core") is not None or
        p.get("data_gb") is not None
    )
    if not has_data:
        errors.append(f"{pid}: no data field set (need data_gb_core, data_gb, or unlimited_data=true)")

    # source_url should be non-empty
    if not p.get("source_url", "").strip():
        errors.append(f"{pid}: source_url is empty")

    # last_verified format
    lv = p.get("last_verified", "")
    if lv and not (len(lv) >= 6 and ("-Q" in lv or "-" in lv)):
        errors.append(f"{pid}: last_verified '{lv}' should be like '2026-Q2' or '2026-06'")

    # affiliate fields should exist (can be empty string)
    for af in ["affiliate_url", "affiliate_network"]:
        if af not in p:
            errors.append(f"{pid}: missing affiliate field '{af}' (set to empty string if unused)")

    if verbose and not errors:
        print(f"  ✓ {pid}")

    return errors


def main():
    parser = argparse.ArgumentParser(description="Validate SimRoam plans.json")
    parser.add_argument("--country", help="Filter by country code (e.g. DE)")
    parser.add_argument("--verbose", action="store_true", help="Show passing plans too")
    args = parser.parse_args()

    with open(PLANS_PATH) as f:
        plans = json.load(f)

    if args.country:
        plans = [p for p in plans if p.get("country_code") == args.country.upper()]
        print(f"Validating {len(plans)} plans for country: {args.country.upper()}")
    else:
        print(f"Validating {len(plans)} plans total")

    all_errors = []
    for i, plan in enumerate(plans):
        errors = validate_plan(plan, i, verbose=args.verbose)
        all_errors.extend(errors)

    # ID uniqueness check
    ids = [p.get("id") for p in plans if p.get("id")]
    dupes = [id for id in ids if ids.count(id) > 1]
    if dupes:
        for d in set(dupes):
            all_errors.append(f"Duplicate plan ID: '{d}'")

    print()
    if all_errors:
        print(f"❌ {len(all_errors)} error(s) found:")
        for e in all_errors:
            print(f"  {e}")
        sys.exit(1)
    else:
        print(f"✅ All plans valid")
        # Summary
        by_country = {}
        by_type = {}
        for p in plans:
            cc = p.get("country_code", "?")
            by_country[cc] = by_country.get(cc, 0) + 1
            t = p.get("operator_type", "?")
            by_type[t] = by_type.get(t, 0) + 1
        print(f"\nBy country: {dict(sorted(by_country.items()))}")
        print(f"By type: {by_type}")


if __name__ == "__main__":
    main()
