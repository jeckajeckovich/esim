"""
SimRoam — Telekom Germany Parser
===================================
Reads: sources/de/telekom_de.yaml
Outputs: normalized Plan dicts for Telekom Germany Prepaid plans

Telekom DE notes:
- STRICT German address required — not suitable for tourists
- Best network quality in Germany (T-Mobile global partner)
- Cannot activate before arrival (address check blocks this)
- friction_score 5 (would be higher but online process)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from base_parser import BaseParser
from typing import List


class TelekomDeParser(BaseParser):
    operator_id = "telekom_de"
    country_code = "DE"

    def parse(self) -> List[dict]:
        source = self.load_source()
        meta = source["meta"]
        plans = []

        for raw in source["plans"]:
            gb = self.parse_gb(raw["raw_data"])
            price = self.parse_price_eur(raw["raw_price_eur"])
            plan_id = self.make_id(raw["raw_title"])
            # Telekom is harder: address required prevents tourist use
            fx = self.friction_score(raw)

            plan = {
                "id": plan_id,
                "operator_id": self.operator_id,
                "country_code": self.country_code,
                "operator_type": "local_operator",
                "provider_name": "Telekom Germany",
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
                "activation_before_arrival": raw.get("raw_activation_before_arrival", False),
                "store_visit_required": raw.get("raw_store_visit", False),
                "airport_purchase_available": False,
                "registration_required": True,
                "passport_required": True,
                "kyc_required": raw.get("raw_kyc", True),
                "address_required": raw.get("raw_address_required", True),
                "foreign_passport_ok": True,
                "renewable": raw.get("raw_renewable", True),
                "auto_renew": raw.get("raw_auto_renew", True),
                "setup_difficulty": "medium",
                "friction_score": fx,
                "friction_notes": self.friction_notes(raw),
                "highlight": raw.get("raw_highlight"),
                "why": f"Germany's best network (T-Mobile globally). {raw.get('raw_data', '?')} + EU roaming. Requires German address — not suitable for most tourists.",
                "why_ru": f"Лучшая сеть Германии (T-Mobile глобально). {raw.get('raw_data', '?')} + роуминг ЕС. Требует немецкий адрес — не для большинства туристов.",
                "verified": True,
                "last_verified": meta["last_verified"],
                "source_url": meta["source_url"],
                "source_name": meta["source_name"],
                "affiliate_url": "",
                "affiliate_network": "",
                "warnings": [
                    raw.get("raw_tourist_warning", "German address required — not suitable for tourists"),
                    "Identity verification required",
                ],
                "notes": f"Best network quality in Germany. Requires German address. Best for expats or long-term visitors.",
            }
            plans.append(plan)

        return plans


if __name__ == "__main__":
    parser = TelekomDeParser()
    plans = parser.run()
    import json
    print(json.dumps(plans, indent=2, ensure_ascii=False))
