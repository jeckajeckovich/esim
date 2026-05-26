"""
SimRoam — O2 Germany Parser
==============================
Reads: sources/de/o2_de.yaml
Outputs: normalized Plan dicts for O2 Germany Prepaid plans

O2 DE notes:
- No permanent German address required (unlike Telekom)
- Online identity verification
- Continues at reduced speed (throttled) after data cap
- EU roaming included
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from base_parser import BaseParser
from typing import List


class O2DeParser(BaseParser):
    operator_id = "o2_de"
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

            throttled = raw.get("raw_throttled_after", False)
            notes_list = self.friction_notes(raw)

            plan = {
                "id": plan_id,
                "operator_id": self.operator_id,
                "country_code": self.country_code,
                "operator_type": "local_operator",
                "provider_name": "O2 Germany",
                "title": raw["raw_title"],
                "price_eur": price,
                "currency": "EUR",
                "duration_days": raw["raw_duration_days"],
                "data_gb_core": gb,
                "data_gb_total_display": raw["raw_data"],
                "unlimited_data": False,
                "eu_roaming": raw.get("raw_eu_roaming", False),
                "roaming_cap_gb": raw.get("raw_eu_roaming_cap_gb"),
                "roaming_region": "EU" if raw.get("raw_eu_roaming") else None,
                "western_balkans_roaming": False,
                "local_number": raw.get("raw_local_number", True),
                "esim_supported": raw.get("raw_esim", True),
                "online_purchase": raw.get("raw_online_purchase", True),
                "activation_before_arrival": raw.get("raw_activation_before_arrival", True),
                "store_visit_required": raw.get("raw_store_visit", False),
                "airport_purchase_available": True,
                "registration_required": True,
                "passport_required": True,
                "kyc_required": raw.get("raw_kyc", False),
                "address_required": raw.get("raw_address_required", False),
                "foreign_passport_ok": True,
                "renewable": raw.get("raw_renewable", True),
                "auto_renew": raw.get("raw_auto_renew", False),
                "setup_difficulty": "medium",
                "friction_score": fx,
                "friction_notes": notes_list,
                "highlight": raw.get("raw_highlight"),
                "why": f"O2 Germany {raw['raw_title']}. {raw.get('raw_data', '?')} + EU roaming. No permanent address needed. Online verification.",
                "why_ru": f"O2 Германия {raw['raw_title']}. {raw.get('raw_data', '?')} + роуминг ЕС. Постоянный адрес не требуется.",
                "verified": True,
                "last_verified": meta["last_verified"],
                "source_url": meta["source_url"],
                "source_name": meta["source_name"],
                "affiliate_url": "",
                "affiliate_network": "",
                "warnings": self.warnings(raw),
                "notes": f"O2 Prepaid. {raw.get('raw_data', '?')} + EU roaming." + (" Continues at low speed after data cap." if throttled else ""),
            }
            plans.append(plan)

        return plans


if __name__ == "__main__":
    parser = O2DeParser()
    plans = parser.run()
    import json
    print(json.dumps(plans, indent=2, ensure_ascii=False))
