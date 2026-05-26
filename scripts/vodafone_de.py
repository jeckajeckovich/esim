"""
SimRoam — Vodafone Germany Parser
===================================
Reads: sources/de/vodafone_de.yaml
Outputs: normalized Plan dicts for Vodafone Germany CallYa plans

Vodafone DE notes:
- All CallYa plans support eSIM
- Online VideoIdent KYC — hotel address accepted
- No permanent German address required
- EU roaming included at same GB as plan allowance
- Auto-renew on Allnet Flat tiers
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from base_parser import BaseParser
from typing import List


class VodafoneDeParser(BaseParser):
    operator_id = "vodafone_de"
    country_code = "DE"

    def parse(self) -> List[dict]:
        source = self.load_source()
        meta = source["meta"]
        plans = []

        for raw in source["plans"]:
            gb = self.parse_gb(raw["raw_data"])
            price = self.parse_price_eur(raw["raw_price_eur"])
            plan_id = self.make_id(raw["raw_title"])
            fx = self.friction_score(raw)

            plan = {
                "id": plan_id,
                "operator_id": self.operator_id,
                "country_code": self.country_code,
                "operator_type": "local_operator",
                "provider_name": "Vodafone Germany",
                "title": raw["raw_title"],
                "price_eur": price,
                "currency": "EUR",
                "duration_days": raw["raw_duration_days"],
                # Data
                "data_gb_core": gb,
                "data_gb_total_display": raw["raw_data"],
                "unlimited_data": False,
                # Roaming
                "eu_roaming": raw.get("raw_eu_roaming", False),
                "roaming_cap_gb": raw.get("raw_eu_roaming_cap_gb"),
                "roaming_region": "EU" if raw.get("raw_eu_roaming") else None,
                "western_balkans_roaming": False,
                # Activation
                "local_number": raw.get("raw_local_number", True),
                "esim_supported": raw.get("raw_esim", True),
                "online_purchase": raw.get("raw_online_purchase", True),
                "activation_before_arrival": raw.get("raw_activation_before_arrival", True),
                "store_visit_required": raw.get("raw_store_visit", False),
                "airport_purchase_available": True,
                # Registration
                "registration_required": True,
                "passport_required": True,
                "kyc_required": raw.get("raw_kyc", False),
                "address_required": raw.get("raw_address_required", False),
                "foreign_passport_ok": True,
                # Renewal
                "renewable": raw.get("raw_renewable", True),
                "auto_renew": raw.get("raw_auto_renew", False),
                # Quality
                "setup_difficulty": "medium",
                "friction_score": fx,
                "friction_notes": self.friction_notes(raw),
                # Metadata
                "highlight": raw.get("raw_highlight"),
                "why": f"Vodafone Germany {raw['raw_title']}. {raw.get('raw_data', '?')} + EU roaming. Online identity verification — hotel address accepted.",
                "why_ru": f"Vodafone Германия {raw['raw_title']}. {raw.get('raw_data', '?')} + роуминг ЕС. Онлайн-верификация — адрес отеля принимается.",
                "verified": True,
                "last_verified": meta["last_verified"],
                "source_url": meta["source_url"],
                "source_name": meta["source_name"],
                "affiliate_url": "",
                "affiliate_network": "",
                "warnings": self.warnings(raw),
                "notes": f"Vodafone CallYa. {raw.get('raw_data', '?')} + EU roaming. No permanent address needed.",
            }
            plans.append(plan)

        return plans


if __name__ == "__main__":
    parser = VodafoneDeParser()
    plans = parser.run()
    import json
    print(json.dumps(plans, indent=2, ensure_ascii=False))
