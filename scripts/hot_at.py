"""
SimRoam — HoT Austria Parser
================================
Reads: sources/at/hot_at.yaml
Outputs: normalized Plan dicts for HoT Austria prepaid plans

HoT Austria notes:
- Foreign passports confirmed accepted
- Online activation available, no Austrian address required
- eSIM supported
- operator_type = "local_operator" with country_code = "AT"
- Good EU nomad option when combined with pan-EU travel
- EU roaming included but lower than Orange Flex (varies by tier)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from base_parser import BaseParser
from typing import List


class HotAtParser(BaseParser):
    operator_id = "hot_at"
    country_code = "AT"

    def parse(self) -> List[dict]:
        source = self.load_source()
        meta = source["meta"]
        plans = []

        for raw in source["plans"]:
            gb = self.parse_gb(raw["raw_data"])
            eu_roaming_gb = raw.get("raw_eu_roaming_gb")
            price = self.parse_price_eur(raw["raw_price_eur"])
            plan_id = self.make_id(raw["raw_title"])
            fx = self.friction_score(raw)

            plan = {
                "id": plan_id,
                "operator_id": self.operator_id,
                "country_code": self.country_code,
                "operator_type": "local_operator",
                "provider_name": "HoT Austria",
                "title": raw["raw_title"],
                "price_eur": price,
                "currency": "EUR",
                "duration_days": raw["raw_duration_days"],
                "data_gb_core": gb,
                "data_gb_total_display": raw["raw_data"],
                "unlimited_data": False,
                "eu_roaming": raw.get("raw_eu_roaming", True),
                "roaming_cap_gb": eu_roaming_gb,
                "roaming_region": "EU" if raw.get("raw_eu_roaming") else None,
                "western_balkans_roaming": False,
                "local_number": True,
                "esim_supported": raw.get("raw_esim", True),
                "online_purchase": raw.get("raw_online_purchase", True),
                "activation_before_arrival": raw.get("raw_activation_before_arrival", True),
                "store_visit_required": raw.get("raw_store_visit", False),
                "airport_purchase_available": False,
                "registration_required": True,
                "passport_required": True,
                "kyc_required": raw.get("raw_kyc", False),
                "address_required": False,
                "foreign_passport_ok": raw.get("raw_foreign_passport_confirmed", True),
                "eu_residency_required": False,
                "renewable": raw.get("raw_renewable", True),
                "auto_renew": raw.get("raw_auto_renew", False),
                "setup_difficulty": "easy",
                "friction_score": fx,
                "friction_notes": self.friction_notes(raw),
                "highlight": raw.get("raw_highlight"),
                "why": (
                    f"HoT Austria {raw['raw_title']}. {raw.get('raw_data', '?')} + {eu_roaming_gb} GB EU roaming. "
                    "Online eSIM, foreign passport accepted, no Austrian address required. "
                    "Good option for multi-country EU travel from Austria base."
                ),
                "why_ru": (
                    f"HoT Austria {raw['raw_title']}. {raw.get('raw_data', '?')} + {eu_roaming_gb} ГБ роуминга ЕС. "
                    "Онлайн eSIM, иностранный паспорт принимается, австрийский адрес не нужен."
                ),
                "verified": True,
                "last_verified": meta["last_verified"],
                "source_url": meta["source_url"],
                "source_name": meta["source_name"],
                "affiliate_url": "",
                "affiliate_network": "",
                "data_confidence": meta.get("data_confidence", "verified_manual"),
                "warnings": [
                    f"EU roaming capped at {eu_roaming_gb} GB/month",
                    "FUP enforcement for non-Austrian residents not fully documented",
                ],
                "notes": (
                    f"HoT Austria. {raw.get('raw_data', '?')} + {eu_roaming_gb} GB EU roaming. "
                    "Foreign passport accepted. Online activation. No Austrian address required."
                ),
            }
            plans.append(plan)

        return plans


if __name__ == "__main__":
    parser = HotAtParser()
    plans = parser.run()
    import json
    print(json.dumps(plans, indent=2, ensure_ascii=False))
