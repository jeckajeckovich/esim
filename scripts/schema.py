# SimRoam — Normalized Plan Schema
# =================================
# Canonical schema for all plans in app/data/plans.json.
# Every parser must produce output conforming to this structure.
#
# Plan type separation:
#
#   operator_type:  who provides the plan (source)
#     "local_operator"       — national operator selling in their home market
#     "aggregator_snapshot"  — travel eSIM from marketplace (Airalo, Nomad etc.)
#     "regional_eu"          — cross-border EU setup (Orange Flex etc.)
#
#   plan_category:  strategic purpose (authoritative field)
#     "local_operator"       — standard domestic SIM
#     "travel_esim"          — instant data-only eSIM for travellers
#     "roaming_bundle"       — add-on that extends roaming capability
#     "balkans_roaming"      — plan whose key value is WB cross-border roaming
#     "eu_nomad"             — monthly EU-wide roaming plan for nomads
#
#   nomad_type:  additional classification (nullable)
#     "eu_nomad"             — EU cross-border monthly plan
#     "global_travel"        — per-country travel eSIM
#
#   benchmark_type: for travel eSIM snapshots
#     "travel_esim_short"    — covers <=7 days
#     "travel_esim_medium"   — covers 8-15 days
#     "travel_esim_monthly"  — covers 16-30 days
#     "eu_regional_travel_esim" — EU-wide regional plan
#
#   data_confidence: how reliable is this data
#     "verified_official"    — from operator official page, manually confirmed
#     "verified_manual"      — manually verified, not from official API
#     "community_verified"   — cross-checked community reports
#     "provider_listed"      — from provider listing (may change)
#     "price_snapshot"       — scraped from aggregator; indicative only
#     "needs_review"         — exists but not recently verified

from dataclasses import dataclass, field, asdict
from typing import Optional, List
import json
import re

VALID_CONFIDENCE = {
    "verified_official", "verified_manual", "community_verified",
    "provider_listed", "price_snapshot", "needs_review"
}
VALID_CATEGORIES = {
    "local_operator", "travel_esim", "roaming_bundle", "balkans_roaming", "eu_nomad"
}
VALID_OPERATOR_TYPES = {"local_operator", "aggregator_snapshot", "regional_eu"}


@dataclass
class Plan:
    # Identity
    id: str
    operator_id: str
    country_code: str
    operator_type: str         # see VALID_OPERATOR_TYPES
    plan_category: str         # see VALID_CATEGORIES — authoritative
    provider_name: str
    title: str

    # Pricing
    price_eur: float
    currency: str = "EUR"
    price_local: Optional[float] = None
    price_rub: Optional[float] = None

    # Duration
    duration_days: int = 30

    # Data
    data_gb_core: Optional[float] = None
    data_gb_apps: Optional[float] = None
    data_gb_total_display: Optional[str] = None
    apps_data_note: Optional[str] = None
    unlimited_data: bool = False
    data_gb: Optional[float] = None   # aggregator snapshots (no split)

    # Roaming — always explicit booleans, never None
    roaming_cap_gb: Optional[float] = None
    roaming_region: Optional[str] = None
    western_balkans_roaming: bool = False
    eu_roaming: bool = False
    roaming_after_quota_rate: Optional[str] = None

    # Classification
    nomad_type: Optional[str] = None
    benchmark_type: Optional[str] = None

    # Activation
    local_number: bool = True
    esim_supported: object = True
    physical_sim_supported: bool = False
    online_purchase: bool = True
    activation_before_arrival: bool = True
    store_visit_required: bool = False
    airport_purchase_available: bool = False

    # Registration
    registration_required: bool = True
    passport_required: bool = False
    kyc_required: bool = False
    address_required: bool = False
    foreign_passport_ok: bool = True
    eu_residency_required: bool = False

    # Renewal
    renewable: bool = True
    auto_renew: bool = False
    disposable_number: bool = False

    # Quality signals (internal, not shown in cards)
    setup_difficulty: str = "medium"
    friction_score: int = 5
    friction_notes: List[str] = field(default_factory=list)
    fair_use_policy: bool = False

    # Trust
    data_confidence: str = "needs_review"

    # Metadata
    highlight: Optional[str] = None
    why: Optional[str] = None
    why_ru: Optional[str] = None
    verified: bool = True
    last_verified: str = "2026-Q2"
    source_url: str = ""
    source_name: Optional[str] = None
    affiliate_url: str = ""
    affiliate_network: str = ""
    extension_options: List[dict] = field(default_factory=list)
    top_up_bonus: Optional[str] = None
    warnings: List[str] = field(default_factory=list)
    notes: Optional[str] = None

    def validate(self) -> List[str]:
        errors = []
        if not self.id:
            errors.append("id is required")
        if not self.operator_id:
            errors.append("operator_id is required")
        if not self.country_code:
            errors.append("country_code is required")
        if self.price_eur <= 0:
            errors.append(f"price_eur must be > 0, got {self.price_eur}")
        if self.duration_days <= 0:
            errors.append(f"duration_days must be > 0, got {self.duration_days}")
        if not self.source_url:
            errors.append("source_url is required")
        if self.data_gb_core is None and self.data_gb is None and not self.unlimited_data:
            errors.append("one of data_gb_core, data_gb, or unlimited_data=True required")
        if self.operator_type not in VALID_OPERATOR_TYPES:
            errors.append(f"invalid operator_type: {self.operator_type}")
        if self.plan_category not in VALID_CATEGORIES:
            errors.append(f"invalid plan_category: {self.plan_category}")
        if self.data_confidence not in VALID_CONFIDENCE:
            errors.append(f"invalid data_confidence: {self.data_confidence}")
        if not isinstance(self.western_balkans_roaming, bool):
            errors.append("western_balkans_roaming must be bool")
        if not isinstance(self.eu_roaming, bool):
            errors.append("eu_roaming must be bool")
        return errors


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "_", s)
    return s


def load_plans(path: str) -> List[dict]:
    with open(path) as f:
        return json.load(f)


def save_plans(plans: List[dict], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(plans, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(plans)} plans to {path}")
