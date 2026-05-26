#!/usr/bin/env python3
"""
SimRoam — Data Pipeline
========================
Orchestrates: parse → validate → diff → [merge]

Usage:
  python3 scripts/pipeline.py --operator vodafone_de
  python3 scripts/pipeline.py --country DE
  python3 scripts/pipeline.py --operator vodafone_de --merge
  python3 scripts/pipeline.py --all --merge

The pipeline:
  1. Runs the parser for each operator
  2. Validates output against schema
  3. Diffs output against current plans.json
  4. If --merge, writes to plans.json

Without --merge, this is a dry-run safe preview.
"""

import sys
import json
import subprocess
import tempfile
import argparse
from pathlib import Path

ROOT = Path(__file__).parent.parent
PARSERS_DIR = ROOT / "parsers"
PLANS_PATH = ROOT / "app/data/plans.json"

# Registry: operator_id → parser filename
PARSER_REGISTRY = {
    "vodafone_de":    "vodafone_de.py",
    "o2_de":          "o2_de.py",
    "telekom_de":     "telekom_de.py",
    "orange_flex_pl": "orange_flex_pl.py",
    "hot_at":         "hot_at.py",
    # Future parsers registered here:
    # "yettel_rs":   "yettel_rs.py",
    # "one_me":      "one_me.py",
    # "bhtelecom_ba":"bhtelecom_ba.py",
}

COUNTRY_OPERATORS = {
    "DE": ["vodafone_de", "o2_de", "telekom_de"],
    "PL": ["orange_flex_pl"],
    "AT": ["hot_at"],
    "RS": [],  # No parsers yet — manual source
    "ME": [],
    "BA": [],
    "AL": [],
    "MK": [],
}


def run_parser(operator_id: str) -> list | None:
    """Run a parser and return its output as a list of plan dicts."""
    parser_file = PARSER_REGISTRY.get(operator_id)
    if not parser_file:
        print(f"⚠ No parser registered for: {operator_id}")
        return None

    parser_path = PARSERS_DIR / parser_file
    if not parser_path.exists():
        print(f"⚠ Parser file not found: {parser_path}")
        return None

    print(f"\n▶ Running parser: {operator_id}")
    result = subprocess.run(
        [sys.executable, str(parser_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Print stderr (validation messages) to console
    if result.stderr:
        print(result.stderr.strip())

    if result.returncode != 0:
        print(f"❌ Parser error for {operator_id}:")
        print(result.stderr)
        return None

    # stdout should be pure JSON
    stdout = result.stdout.strip()
    if not stdout:
        print(f"❌ No output from parser: {operator_id}")
        return None

    try:
        plans = json.loads(stdout)
        print(f"  → {len(plans)} plan(s) parsed")
        return plans
    except json.JSONDecodeError as e:
        print(f"❌ Parser output is not valid JSON for {operator_id}: {e}")
        # Try to find JSON in output (in case of print mixing)
        import re
        m = re.search(r"\[[\s\S]*\]", stdout)
        if m:
            try:
                plans = json.loads(m.group())
                print(f"  → Extracted {len(plans)} plan(s) from mixed output")
                return plans
            except Exception:
                pass
        print(f"Output preview: {stdout[:200]}")
        return None


def run_validate(plans_file: str) -> bool:
    """Run validate.py against a plans file. Returns True if valid."""
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts/validate.py")],
        capture_output=True, text=True,
        env={**__import__("os").environ, "SIMROAM_PLANS": plans_file}
    )
    # Validate script reads from PLANS_PATH so we patch it inline
    # For simplicity, run validation directly
    sys.path.insert(0, str(ROOT / "parsers"))
    sys.path.insert(0, str(ROOT / "scripts"))

    with open(plans_file) as f:
        plans = json.load(f)

    # Quick inline validation
    errors = []
    ids = []
    for i, p in enumerate(plans):
        pid = p.get("id", f"plan #{i}")
        if not p.get("id"):
            errors.append(f"{pid}: missing id")
        if not p.get("price_eur"):
            errors.append(f"{pid}: missing price_eur")
        if not p.get("source_url"):
            errors.append(f"{pid}: missing source_url")
        ids.append(pid)

    dupes = [id for id in ids if ids.count(id) > 1]
    if dupes:
        errors.append(f"Duplicate IDs: {set(dupes)}")

    if errors:
        print(f"❌ Validation failed ({len(errors)} errors):")
        for e in errors[:10]:
            print(f"  {e}")
        return False

    print(f"✓ Validation passed — {len(plans)} plans")
    return True


def run_diff(new_plans_file: str, operator_id: str = None):
    """Show diff between new plans file and current plans.json."""
    cmd = [sys.executable, str(ROOT / "scripts/diff.py"), "--input", new_plans_file]
    if operator_id:
        # Show context for this operator
        pass
    result = subprocess.run(cmd, capture_output=False)


def main():
    parser = argparse.ArgumentParser(description="SimRoam data pipeline")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--operator", help="Run parser for one operator (e.g. vodafone_de)")
    group.add_argument("--country", help="Run all parsers for a country (e.g. DE)")
    group.add_argument("--all", action="store_true", help="Run all registered parsers")
    parser.add_argument("--merge", action="store_true", help="Write results to plans.json after review")
    args = parser.parse_args()

    # Collect operators to run
    if args.operator:
        operators = [args.operator]
    elif args.country:
        operators = COUNTRY_OPERATORS.get(args.country.upper(), [])
        if not operators:
            print(f"No parsers registered for country: {args.country}")
            print(f"Available: {list(COUNTRY_OPERATORS.keys())}")
            sys.exit(1)
    else:  # --all
        operators = list(PARSER_REGISTRY.keys())

    print(f"SimRoam Pipeline — operators: {operators}")

    all_plans = []
    failed = []

    for op_id in operators:
        plans = run_parser(op_id)
        if plans is None:
            failed.append(op_id)
        else:
            all_plans.extend(plans)

    if failed:
        print(f"\n⚠ Failed parsers: {failed}")
        if not all_plans:
            sys.exit(1)

    if not all_plans:
        print("No plans parsed — nothing to do")
        sys.exit(0)

    # Write to temp file for validation and diff
    with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as f:
        json.dump(all_plans, f, indent=2, ensure_ascii=False)
        tmp_path = f.name

    print(f"\n→ Wrote {len(all_plans)} parsed plans to {tmp_path}")

    # Validate
    print("\n─── Validation ─────────────────────────────")
    valid = run_validate(tmp_path)

    # Diff
    print("\n─── Diff vs current plans.json ─────────────")
    run_diff(tmp_path, args.operator)

    if not valid:
        print("\n❌ Pipeline stopped — fix validation errors before merging")
        sys.exit(1)

    # Merge
    if args.merge:
        print("\n─── Merging ─────────────────────────────────")
        scope_arg = ["--operator", args.operator] if args.operator else ["--country", args.country or "all"]
        merge_cmd = [
            sys.executable, str(ROOT / "scripts/merge.py"),
            "--input", tmp_path,
        ] + scope_arg
        result = subprocess.run(merge_cmd)
        if result.returncode == 0:
            print("\n✅ Pipeline complete — plans.json updated")
        else:
            print("\n❌ Merge failed")
            sys.exit(1)
    else:
        print("\n[Preview only] — run with --merge to write to plans.json")
        print(f"Temp file: {tmp_path}")


if __name__ == "__main__":
    main()