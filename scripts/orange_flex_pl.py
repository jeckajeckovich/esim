"""
SimRoam — Orange Flex Poland Parser
=====================================
Reads: sources/pl/orange_flex_pl.yaml
Outputs: normalized Plan dicts for Orange Flex Poland (EU nomad plans)

Orange Flex notes:
- App-only onboarding — no web purchase
- Foreign passports accepted, no EU residency needed
- Polish number — works across EU via roaming
- operator_type = "regional_eu" (not country-specific)
- nomad_type = "eu_nomad"
- country_code = "EU" (not PL — it's a regional nomad strategy)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from base_parser import BaseParser
from typing import List


class OrangeFlexPlParser(BaseParser):
    operator_id = "orange_flex_pl"
    country_code = "PL"  # Source country, but plan is regional

    def default_confidence(self, raw: dict) -> str:
        return "verified_manual"  # App-only provider; manually checked, not from official API scrape

    def parse(self) -> List[dict]:
        source = self.load_source()
        meta = source["meta"]
        plans = []

        for raw in source["plans"]:
            gb = self.parse_gb(raw["raw_data"])
            eu_roaming_gb = raw.get("raw_eu_roaming_gb", gb)
            price = self.parse_price_eur(raw["raw_price_eur"])
            plan_id = self.make_id(raw["raw_title"])

            plan = {
                "id": plan_id,
                "operator_id": self.operator_id,
                "country_code": "EU",  # Regional — not tied to one country
                "operator_type": "regional_eu",
                "nomad_type": raw.get("raw_nomad_type", "eu_nomad"),
                "provider_name": "Orange Flex Poland",
                "title": raw["raw_title"],
                "price_eur": price,
                "price_local": raw.get("raw_price_pln"),
                "currency": "EUR",
                "duration_days": raw["raw_duration_days"],
                "data_gb_core": gb,
                "data_gb_total_display": raw["raw_data"],
                "unlimited_data": False,
                "eu_roaming": True,
                "roaming_cap_gb": eu_roaming_gb,
                "roaming_region": "EU",
                "western_balkans_roaming": False,
                "local_number": True,
                "esim_supported": True,
                "online_purchase": True,
                "activation_before_arrival": True,
                "store_visit_required": False,
                "airport_purchase_available": False,
                "registration_required": True,
                "passport_required": raw.get("raw_passport_required", True),
                "kyc_required": raw.get("raw_kyc", False),
                "address_required": False,
                "foreign_passport_ok": raw.get("raw_foreign_passport_ok", True),
                "eu_residency_required": raw.get("raw_eu_residency_required", False),
                "renewable": raw.get("raw_renewable", True),
                "auto_renew": raw.get("raw_auto_renew", True),
                "setup_difficulty": "easy",
                "friction_score": 3,
                "friction_notes": [
                    "App-based onboarding",
                    "Foreign passport accepted",
                    "Polish number — usable across EU",
                    "No EU residency required",
                ],
                "highlight": raw.get("raw_highlight", "EU Nomad Pick"),
                "why": f"Orange Flex Poland — EU nomad strategy. €{price}/month with {eu_roaming_gb} GB EU roaming across all EU countries. Real phone number. App onboarding, foreign passport accepted. No EU residency required.",
                "why_ru": f"Orange Flex Poland — стратегия для EU nomad. €{price}/месяц с {eu_roaming_gb} ГБ роуминга ЕС по всем странам ЕС. Реальный номер. Активация через приложение, иностранный паспорт принимается.",
                "verified": True,
                "last_verified": meta["last_verified"],
                "source_url": meta["source_url"],
                "source_name": meta["source_name"],
                "affiliate_url": "",
                "affiliate_network": "",
                "data_confidence": self.default_confidence(raw),
                "warnings": [
                    "Polish number — not a local German/French/Italian number",
                    f"EU roaming capped at ~{eu_roaming_gb} GB/month",
                    "Not ideal for very heavy EU roaming (hotspot-heavy users)",
                    "Onboarding via app only — requires smartphone",
                ],
                "notes": f"Orange Flex Poland EU nomad setup. €{price}/month for {eu_roaming_gb} GB EU roaming usable across EU countries. Real Polish number. App onboarding, foreign passport accepted.",
            }
            plans.append(plan)

        return plans


if __name__ == "__main__":
    parser = OrangeFlexPlParser()
    plans = parser.run()
    import json
    print(json.dumps(plans, indent=2, ensure_ascii=False))