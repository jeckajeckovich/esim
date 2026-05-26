"""
SimRoam — Base Parser
=====================
All operator parsers inherit from BaseParser.
Each parser reads its source YAML and outputs normalized Plan dicts.
"""

import yaml
import re
import json
from pathlib import Path
from typing import List, Optional
from schema import Plan, slugify


class BaseParser:
    """Base class for all SimRoam operator parsers."""

    operator_id: str = ""
    country_code: str = ""
    source_dir: Path = Path(__file__).parent.parent / "sources"

    def load_source(self) -> dict:
        """Load the YAML source file for this operator."""
        path = self.source_dir / self.country_code.lower() / f"{self.operator_id}.yaml"
        if not path.exists():
            raise FileNotFoundError(f"Source not found: {path}")
        with open(path) as f:
            return yaml.safe_load(f)

    def parse_gb(self, raw: str) -> Optional[float]:
        """Parse a data string like '25 GB' or '~33 GB' → float."""
        if raw is None:
            return None
        m = re.search(r"~?(\d+(?:\.\d+)?)", str(raw))
        return float(m.group(1)) if m else None

    def parse_price_eur(self, raw) -> float:
        """Parse a price value to EUR float."""
        if isinstance(raw, (int, float)):
            return float(raw)
        if isinstance(raw, str):
            m = re.search(r"\d+[,.]?\d*", raw.replace(",", "."))
            return float(m.group()) if m else 0.0
        return 0.0

    def make_id(self, title: str) -> str:
        """Generate a plan ID from operator_id and title."""
        slug = slugify(title)
        return f"{self.operator_id}_{slug}"

    def default_confidence(self, raw: dict) -> str:
        """Return appropriate data_confidence level for this operator's source type."""
        return "verified_official"

    def plan_category(self, raw: dict) -> str:
        """
        Determine plan_category from raw fields.
        Override in subclass when needed.
        - Plans with WB roaming → balkans_roaming
        - Default local → local_operator
        """
        if raw.get("raw_eu_roaming") and not raw.get("raw_store_visit"):
            return "local_operator"
        if raw.get("raw_address_required"):
            return "local_operator"
        return "local_operator"  # default; override in regional/travel parsers

    def friction_score(self, raw: dict) -> int:
        """
        Compute friction score from raw source fields.
        1 = instant/easy, 10 = maximum friction.
        """
        score = 3  # baseline for online eSIM

        if raw.get("raw_address_required"):
            score += 3
        if raw.get("raw_kyc") and not raw.get("raw_hotel_address_ok"):
            score += 2
        if raw.get("raw_store_visit"):
            score += 3
        if not raw.get("raw_esim"):
            score += 1
        if not raw.get("raw_activation_before_arrival"):
            score += 1

        return min(max(score, 1), 10)

    def friction_notes(self, raw: dict) -> List[str]:
        """Generate human-readable friction notes from raw fields."""
        notes = []
        if raw.get("raw_esim"):
            notes.append("eSIM — online delivery")
        if raw.get("raw_kyc"):
            kyc_type = raw.get("raw_kyc_type", "identity verification required")
            notes.append(kyc_type)
        if raw.get("raw_hotel_address_ok"):
            notes.append("Hotel address accepted")
        if raw.get("raw_address_required"):
            addr_type = raw.get("raw_address_type", "local address required")
            notes.append(addr_type)
        if raw.get("raw_activation_before_arrival"):
            notes.append("Activate before arrival")
        if raw.get("raw_store_visit"):
            notes.append("Store or airport visit required")
        return notes

    def warnings(self, raw: dict) -> List[str]:
        """Generate warnings list from raw source fields."""
        w = []
        if raw.get("raw_address_required"):
            w.append(raw.get("raw_tourist_warning", "Local address required — not suitable for tourists"))
        if raw.get("raw_kyc"):
            w.append("Identity verification required — online process")
        if raw.get("raw_throttled_after"):
            w.append("Continues at reduced speed after data allowance")
        return w

    def parse(self) -> List[dict]:
        """Override in subclass. Returns list of normalized plan dicts."""
        raise NotImplementedError

    def run(self) -> List[dict]:
        """Parse and validate all plans."""
        plans = self.parse()
        errors = []
        required = ["id", "operator_id", "country_code", "operator_type",
                    "provider_name", "title", "price_eur", "source_url"]
        for p in plans:
            for f in required:
                if not p.get(f):
                    errors.append(f"Plan {p.get('id', '?')}: missing '{f}'")
        if errors:
            print(f"⚠ Validation errors in {self.operator_id}:")
            for e in errors:
                print(f"  {e}")
        else:
            import sys; print(f"✓ {self.operator_id}: {len(plans)} plans valid")
        return plans
