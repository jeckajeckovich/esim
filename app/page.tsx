"use client";
import { useState, useMemo, type ReactNode } from "react";
import plansData from "./data/plans.json";
import operatorsData from "./data/operators.json";
import countriesData from "./data/countries.json";
import {
  CountryPicker,
  TripConfigPanel,
  SimulatorResults,
} from "./components/TripSimulator";

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Types РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
type Lang = "en" | "ru";
type CountryCode =
  // Western Balkans
  "RS" | "DE" | "AL" | "ME" | "BA" | "MK" |
  // EU РІР‚вЂќ verified or partially verified
  "AT" | "PL" | "BE" |
  // EU РІР‚вЂќ seed (operator candidates, plans pending)
  "BG" | "HR" | "CY" | "CZ" | "DK" | "EE" | "FI" | "FR" | "GR" |
  "HU" | "IE" | "IT" | "LV" | "LT" | "LU" | "MT" | "NL" | "PT" |
  "RO" | "SK" | "SI" | "ES" | "SE";
type PrefId = "cheapest" | "esim" | "nostore" | "roaming" | "longterm" | "tourist";
type TabId = "rec" | "all" | "travel" | "setup" | "roaming";
type PageId = "home" | "results" | "countries" | "country" | "sim";
type RegionFilter = "popular" | "balkans" | "eu" | "all";
type PlanType = "local_operator" | "travel_esim" | "aggregator_snapshot" | "regional_eu";

interface Plan {
  id: string; operator_id: string; country_code: CountryCode | "EU";
  operator_type: PlanType; provider_name: string; title: string;
  price_eur?: number; price_local?: number; price_rub?: number; currency: string;
  duration_days: number;
  data_gb?: number; data_gb_core?: number; data_gb_apps?: number;
  data_gb_total_display?: string; apps_data_note?: string;
  unlimited_data: boolean;
  roaming_cap_gb?: number; roaming_region?: string; western_balkans_roaming?: boolean;
  eu_roaming?: boolean;
  local_number: boolean; esim_supported: boolean | "unknown";
  physical_sim_supported?: boolean; online_purchase: boolean;
  activation_before_arrival: boolean; store_visit_required: boolean;
  airport_purchase_available?: boolean; registration_required?: boolean;
  passport_required?: boolean; kyc_required?: boolean;
  renewable: boolean; auto_renew?: boolean; disposable_number?: boolean;
  setup_difficulty?: "easy" | "medium" | "hard"; friction_score?: number;
  friction_notes?: string[]; fair_use_policy?: boolean;
  extension_options?: { topup_local: number; total_validity_days: number; note?: string }[];
  top_up_bonus?: string; highlight?: string;
  why?: string; why_ru?: string; verified?: boolean; last_verified?: string;
  source_url: string; source_name?: string;
  affiliate_url?: string; affiliate_network?: string;
  data_confidence?: string;  // "verified_official" | "verified_manual" | "community_verified" | "provider_listed" | "price_snapshot" | "needs_review"
  plan_category?: string;    // "local_operator" | "travel_esim" | "roaming_bundle" | "balkans_roaming" | "eu_nomad"
  nomad_type?: string;       // "eu_nomad" | "global_travel" | null
  benchmark_type?: string;
  warnings?: string[]; notes?: string;
}
interface Operator {
  id: string; name: string; country: CountryCode | null;
  network: string; esim: boolean; url: string; tourist_score: number;
  notes: string; operator_type?: string;
}
interface CountryMeta {
  code: CountryCode; name: string; name_ru: string; flag: string;
  tagline: string; tagline_ru: string; headline: string; headline_ru: string;
  summary: string; summary_ru: string;
  tourist_ease: number; esim_quality: number; weak_english?: boolean;
  reality_check: string; reality_check_ru: string;
  ops: string[]; insights: Record<string, string>; insights_ru: Record<string, string>;
  cross_border_note?: string; cross_border_note_ru?: string;
  // EU expansion fields
  region?: string;
  eu_member?: boolean;
  research_status?: "seed" | "needs_verification" | "verified";
  esim_market_status?: string;
  remote_activation_status?: string;
  tourist_friendliness?: string;
  residency_required_for_prepaid?: string;
  foreign_passport_possible?: boolean | string;
}

const PLANS = plansData as Plan[];
const OPERATORS = operatorsData as Record<string, Operator>;
const COUNTRIES = countriesData as Record<CountryCode, CountryMeta>;

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Helpers РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function getPriceEur(p: Plan): number {
  if (p.price_eur) return p.price_eur;
  if (p.price_rub) return parseFloat((p.price_rub / 91).toFixed(2));
  return 0;
}
function getDataCore(p: Plan): number | null {
  if (p.unlimited_data) return null;
  if (p.data_gb_core !== undefined) return p.data_gb_core;
  if (p.data_gb !== undefined) return p.data_gb;
  return null;
}
function getDataShort(p: Plan, totalCore?: number | null): string {
  if (p.unlimited_data) return "РІв‚¬С›";
  const n = totalCore !== undefined ? totalCore : getDataCore(p);
  if (n === null) return "?";
  return n >= 1000 ? `${Math.round(n / 1000)} TB` : `${n} GB`;
}
function fc(fx: number) { return fx <= 3 ? "#15803d" : fx <= 6 ? "#b45309" : "#b91c1c"; }
// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Plan category helpers РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
// plan_category is the authoritative field (added in data architecture stabilisation).
// operator_type is kept for backwards compat and as a fallback.
// Rule: always prefer plan_category when present.

function isLocal(p: Plan): boolean {
  const cat = p.plan_category;
  if (cat) return cat === "local_operator";
  return p.operator_type === "local_operator";
}

function isSnap(p: Plan): boolean {
  const cat = p.plan_category;
  if (cat) return cat === "travel_esim";
  return p.operator_type === "aggregator_snapshot" || p.operator_type === "travel_esim";
}

function isEuNomad(p: Plan): boolean {
  const cat = p.plan_category;
  if (cat) return cat === "eu_nomad";
  return p.operator_type === "regional_eu";
}

function isBalkansRoaming(p: Plan): boolean {
  return p.plan_category === "balkans_roaming";
}

function isRoamingBundle(p: Plan): boolean {
  return p.plan_category === "roaming_bundle";
}

// Plans suitable for per-country recommendation scoring (local + balkans_roaming)
function isScorable(p: Plan): boolean {
  return isLocal(p) || isBalkansRoaming(p) || isRoamingBundle(p);
}

function hasAppData(p: Plan): boolean { return !!(p.data_gb_apps && p.data_gb_apps > 0 && p.data_gb_core !== undefined); }
interface ReportCtx {
  countryCode: string;
  countryName: string;
  tripDuration: number;
  section: string;
  planTitle?: string;
  providerName?: string;
  sourceUrl?: string;
  lastVerified?: string;
}

function buildReportMailto(ctx: ReportCtx): string {
  const subject = encodeURIComponent("SimRoam data correction");
  const hasPlan = !!(ctx.planTitle || ctx.providerName);

  const lines: string[] = [
    "Hi,",
    "",
    "I found a data issue in SimRoam and would like to report it.",
    "",
    "РІвЂќР‚РІвЂќР‚РІвЂќР‚ Context РІвЂќР‚РІвЂќР‚РІвЂќР‚",
    `Country: ${ctx.countryName} (${ctx.countryCode})`,
    `Trip duration: ${ctx.tripDuration} days`,
    `Section: ${ctx.section}`,
  ];

  if (hasPlan) {
    lines.push("");
    lines.push("РІвЂќР‚РІвЂќР‚РІвЂќР‚ Plan details РІвЂќР‚РІвЂќР‚РІвЂќР‚");
    if (ctx.planTitle)    lines.push(`Plan: ${ctx.planTitle}`);
    if (ctx.providerName) lines.push(`Provider: ${ctx.providerName}`);
    if (ctx.lastVerified) lines.push(`Last verified: ${ctx.lastVerified}`);
    if (ctx.sourceUrl)    lines.push(`Source: ${ctx.sourceUrl}`);
  }

  lines.push("");
  lines.push("РІвЂќР‚РІвЂќР‚РІвЂќР‚ What's wrong РІвЂќР‚РІвЂќР‚РІвЂќР‚");
  lines.push("(Please describe the issue here)");
  lines.push("");
  lines.push("Thanks");

  const body = encodeURIComponent(lines.join("\n"));
  return `mailto:hello@jeckovich.uk?subject=${subject}&body=${body}`;
}

function ReportErrorLink({ ctx, lang }: { ctx: ReportCtx; lang: Lang }) {
  const label = lang === "ru" ? "Р РЋР С•Р С•Р В±РЎвЂ°Р С‘РЎвЂљРЎРЉ Р С•Р В± Р С•РЎв‚¬Р С‘Р В±Р С”Р Вµ" : "Report data error";
  return (
    <a
      href={buildReportMailto(ctx)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, color: "#9ca3af", textDecoration: "none",
        padding: "2px 0", lineHeight: 1.4,
      }}
      title={lang === "ru" ? "Р С›РЎвЂљР С—РЎР‚Р В°Р Р†Р С‘РЎвЂљРЎРЉ Р С‘РЎРѓР С—РЎР‚Р В°Р Р†Р В»Р ВµР Р…Р С‘Р Вµ Р С—Р С• email" : "Send a correction by email"}
    >
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      {label}
    </a>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ i18n РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
const T = {
  en: {
    tagline: "connectivity intelligence",
    where: "Where are you going?",
    trip_length: "Trip length",
    priorities: "What matters most?",
    find: (c: string) => `Find best plans in ${c}`,
    select_dest: "Select a destination to continue",
    browse: "Browse by country",
    countries: "Countries",
    back: "Back",
    best_overall: "Best overall",
    best_instant: "Easiest setup",
    best_value: "Best value",
    best_unlimited: "Best unlimited",
    best_long_stay: "Best long stay",
    cheapest: "Cheapest",
    more_options: "More options",
    tab_rec: "Recommendation",
    tab_all: "All plans",
    tab_travel: "vs Travel eSIM",
    tab_setup: "Setup difficulty",
    tab_roaming: "Roaming matrix",
    verified: "Verified",
    official_source: "Official source",
    view_snapshot: "View offer",
    buy_esim: "Buy travel eSIM",
    why_this: "Why this plan?",
    duration_opt: "Duration optimizer",
    reality_check: "Reality check",
    travel_esim_intro: "Travel eSIMs (Airalo, Nomad, GigSky, GoMoWorldРІР‚В¦) offer instant no-KYC setup РІР‚вЂќ but cost significantly more per GB and include no local phone number.",
    travel_esim_disclaimer: "Prices are aggregator snapshots and may change. Verify at source before purchasing.",
    all_travel_esims: "Travel eSIM options for this country",
    travel_esim_note: "Travel eSIMs are best for: same-day arrival with no setup time, short visits under 3 days, or when local SIM activation is impractical.",
    operators: "Operators",
    all_local_plans: "All local plans",
    all_snapshot_plans: "Travel eSIM prices",
    friction_setup: "Setup friction",
    easy: "Easy", medium: "Moderate", hard: "High friction",
    activate_before: "Activate before arrival",
    store_required: "Physical store or airport visit required",
    setup_intro: "Friction score rates how hard activation actually is in practice РІР‚вЂќ not just on paper.",
    pref_cheapest: "Cheapest option", pref_esim: "Instant eSIM",
    pref_nostore: "No store visit", pref_roaming: "Balkans roaming",
    pref_longterm: "Long-term stay", pref_tourist: "Tourist friendly",
    days_7: "7 days", days_14: "14 days", days_21: "21 days", days_30: "30 days", days_45: "45 days", days_60: "60 days",
    tourist_ease: "Tourist ease", esim_quality: "eSIM quality",
    close: "Close",
    local_wins: (pct: number, ld: string, td: string) => `Local SIM saves ${pct}% РІР‚вЂќ ${ld} general data vs ${td}`,
    local_better: (pct: number, ld: string, td: string) => `Local SIM saves ${pct}% РІР‚вЂќ ${ld} vs ${td} + real phone number`,
    local_similar: "Local SIM: similar price, real local number + more data",
    travel_wins: "Travel eSIM: instant setup. Local SIM requires passport registration.",
    roaming_matrix_title: "Western Balkans roaming matrix",
    roaming_matrix_desc: "Which SIMs work across Western Balkans borders.",
    matrix_sim_from: "SIM from РІвЂ вЂ™",
    matrix_note: "РІСљвЂ¦ Full roaming  РІС™В РїС‘РЏ Limited / fair use  РІСњРЉ No roaming",
    plans_in: (c: string, n: number) => `${n} local plans in ${c}`,
    per_gb: "/GB",
    no_local_num: "No local number",
    data_only: "Data-only",
    instant: "Instant",
    snapshot_label: "Price snapshot",
    confidence_official: "Official source",
    confidence_manual: "Manually verified",
    confidence_provider: "Provider listing",
    confidence_snapshot: "Price may vary",
    confidence_review: "Needs review",
    verify_price: "Verify current price before buying",
    app_data_label: "App-only data",
    for_trip: (d: number) => `For ${d}-day trip`,
    purchases: (n: number) => `${n}Р“вЂ” purchase${n !== 1 ? "s" : ""}`,
    ext_options: "Extension options",
    general_data: "General data",
    shown_as: "Shown as",
    // РІвЂќР‚РІвЂќР‚ Trip Simulator РІвЂќР‚РІвЂќР‚
    sim_title: "Trip Simulator",
    sim_sub: "Multi-country connectivity intelligence",
    sim_countries: "Countries you're visiting",
    sim_add_country: "Add country",
    sim_duration: "Total trip duration",
    sim_usage: "Expected data usage",
    sim_usage_light: "Light",
    sim_usage_medium: "Medium",
    sim_usage_heavy: "Heavy",
    sim_hotspot: "Need hotspot / tethering?",
    sim_esim_only: "eSIM only?",
    sim_need_number: "Need a local phone number?",
    sim_yes: "Yes",
    sim_no: "No",
    sim_run: "Find best setup",
    sim_strategy_local: "Local SIM per country",
    sim_strategy_travel: "Travel eSIM",
    sim_strategy_nomad: "EU Nomad setup",
    sim_recommended: "Recommended",
    sim_total_cost: "Estimated total",
    sim_per_month: "/month",
    sim_why: "Why this setup?",
    sim_tradeoffs: "Tradeoffs",
    sim_setup_complexity: "Setup",
    sim_roaming_note: "Roaming",
    sim_not_applicable: "Not applicable for this route",
    sim_no_data: "No data available for this country yet",
    sim_back: "Back to simulator",
    sim_caveat_snapshot: "Travel eSIM prices are estimates РІР‚вЂќ verify before buying",
  },
  ru: {
    tagline: "Р В°Р Р…Р В°Р В»Р С‘РЎвЂљР С‘Р С”Р В° РЎРѓР Р†РЎРЏР В·Р С‘",
    where: "Р С™РЎС“Р Т‘Р В° Р ВµР Т‘Р ВµРЎвЂљР Вµ?",
    trip_length: "Р вЂќР В»Р С‘РЎвЂљР ВµР В»РЎРЉР Р…Р С•РЎРѓРЎвЂљРЎРЉ",
    priorities: "Р В§РЎвЂљР С• Р Р†Р В°Р В¶Р Р…Р ВµР Вµ?",
    find: (c: string) => `Р СћР В°РЎР‚Р С‘РЎвЂћРЎвЂ№ Р Т‘Р В»РЎРЏ ${c}`,
    select_dest: "Р вЂ™РЎвЂ№Р В±Р ВµРЎР‚Р С‘РЎвЂљР Вµ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎС“",
    browse: "Р вЂ™РЎРѓР Вµ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№",
    countries: "Р РЋРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№",
    back: "Р СњР В°Р В·Р В°Р Т‘",
    best_overall: "Р вЂєРЎС“РЎвЂЎРЎв‚¬Р С‘Р в„– Р Р†РЎвЂ№Р В±Р С•РЎР‚",
    best_instant: "Р СџРЎР‚Р С•РЎвЂ°Р Вµ Р В°Р С”РЎвЂљР С‘Р Р†Р С‘РЎР‚Р С•Р Р†Р В°РЎвЂљРЎРЉ",
    best_value: "Р вЂ™РЎвЂ№Р С–Р С•Р Т‘Р Р…Р ВµР Вµ Р Р†РЎРѓР ВµР С–Р С•",
    best_unlimited: "Р вЂР ВµР В·Р В»Р С‘Р СР С‘РЎвЂљ",
    best_long_stay: "Р вЂќР В»РЎРЏ Р Т‘Р С•Р В»Р С–Р С•Р С–Р С• Р С—РЎР‚Р ВµР В±РЎвЂ№Р Р†Р В°Р Р…Р С‘РЎРЏ",
    cheapest: "Р РЋР В°Р СРЎвЂ№Р в„– Р Т‘Р ВµРЎв‚¬РЎвЂР Р†РЎвЂ№Р в„–",
    more_options: "Р вЂўРЎвЂ°РЎвЂ Р Р†Р В°РЎР‚Р С‘Р В°Р Р…РЎвЂљРЎвЂ№",
    tab_rec: "Р В Р ВµР С”Р С•Р СР ВµР Р…Р Т‘Р В°РЎвЂ Р С‘РЎРЏ",
    tab_all: "Р вЂ™РЎРѓР Вµ РЎвЂљР В°РЎР‚Р С‘РЎвЂћРЎвЂ№",
    tab_travel: "vs Travel eSIM",
    tab_setup: "Р С’Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ",
    tab_roaming: "Р В Р С•РЎС“Р СР С‘Р Р…Р С–",
    verified: "Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚Р ВµР Р…Р С•",
    official_source: "Р С›РЎвЂћР С‘РЎвЂ Р С‘Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– РЎРѓР В°Р в„–РЎвЂљ",
    view_snapshot: "Р С›РЎвЂљР С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ Р С—РЎР‚Р ВµР Т‘Р В»Р С•Р В¶Р ВµР Р…Р С‘Р Вµ",
    buy_esim: "Р С™РЎС“Р С—Р С‘РЎвЂљРЎРЉ Travel eSIM",
    why_this: "Р СџР С•РЎвЂЎР ВµР СРЎС“ РЎРЊРЎвЂљР С•РЎвЂљ РЎвЂљР В°РЎР‚Р С‘РЎвЂћ?",
    duration_opt: "Р С›Р С—РЎвЂљР С‘Р СР С‘Р В·Р В°РЎвЂ Р С‘РЎРЏ",
    reality_check: "Р В§РЎвЂљР С• Р Р†Р В°Р В¶Р Р…Р С• Р В·Р Р…Р В°РЎвЂљРЎРЉ",
    travel_esim_intro: "Р СћРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р Вµ eSIM (Airalo, Nomad, GigSkyРІР‚В¦) РІР‚вЂќ Р СР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…Р В°РЎРЏ Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ Р В±Р ВµР В· РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘Р С‘. Р СњР С• РЎРѓРЎС“РЎвЂ°Р ВµРЎРѓРЎвЂљР Р†Р ВµР Р…Р Р…Р С• Р Т‘Р С•РЎР‚Р С•Р В¶Р Вµ Р В·Р В° Р вЂњР вЂ Р С‘ Р В±Р ВµР В· Р СР ВµРЎРѓРЎвЂљР Р…Р С•Р С–Р С• Р Р…Р С•Р СР ВµРЎР‚Р В°.",
    travel_esim_disclaimer: "Р В¦Р ВµР Р…РЎвЂ№ Р С•РЎР‚Р С‘Р ВµР Р…РЎвЂљР С‘РЎР‚Р С•Р Р†Р С•РЎвЂЎР Р…РЎвЂ№Р Вµ РІР‚вЂќ Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚РЎРЏР в„–РЎвЂљР Вµ Р В°Р С”РЎвЂљРЎС“Р В°Р В»РЎРЉР Р…РЎвЂ№Р Вµ Р Р…Р В° РЎРѓР В°Р в„–РЎвЂљР Вµ Р С—РЎР‚Р С•Р Р†Р В°Р в„–Р Т‘Р ВµРЎР‚Р В° Р С—Р ВµРЎР‚Р ВµР Т‘ Р С—Р С•Р С”РЎС“Р С—Р С”Р С•Р в„–.",
    all_travel_esims: "Р СћРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р Вµ eSIM Р Т‘Р В»РЎРЏ РЎРЊРЎвЂљР С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№",
    travel_esim_note: "Р СћРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р В°РЎРЏ eSIM Р С•Р С—РЎР‚Р В°Р Р†Р Т‘Р В°Р Р…Р В°, Р ВµРЎРѓР В»Р С‘: Р Р…РЎС“Р В¶Р ВµР Р… Р С‘Р Р…РЎвЂљР ВµРЎР‚Р Р…Р ВµРЎвЂљ РЎРѓРЎР‚Р В°Р В·РЎС“ Р С—Р С• Р С—РЎР‚Р С‘Р В»РЎвЂРЎвЂљРЎС“, Р С—Р С•Р ВµР В·Р Т‘Р С”Р В° Р Т‘Р С• 3 Р Т‘Р Р…Р ВµР в„–, Р С‘Р В»Р С‘ Р СР ВµРЎРѓРЎвЂљР Р…РЎС“РЎР‹ SIM Р С—Р С•Р В»РЎС“РЎвЂЎР С‘РЎвЂљРЎРЉ Р В·Р В°РЎвЂљРЎР‚РЎС“Р Т‘Р Р…Р С‘РЎвЂљР ВµР В»РЎРЉР Р…Р С•.",
    operators: "Р С›Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚РЎвЂ№",
    all_local_plans: "Р СљР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р Вµ РЎвЂљР В°РЎР‚Р С‘РЎвЂћРЎвЂ№",
    all_snapshot_plans: "Р СћРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р Вµ eSIM РІР‚вЂќ РЎвЂ Р ВµР Р…РЎвЂ№",
    friction_setup: "Р РЋР В»Р С•Р В¶Р Р…Р С•РЎРѓРЎвЂљРЎРЉ Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘Р С‘",
    easy: "Р вЂєР ВµР С–Р С”Р С•", medium: "Р Р€Р СР ВµРЎР‚Р ВµР Р…Р Р…Р С•", hard: "Р РЋР В»Р С•Р В¶Р Р…Р С•",
    activate_before: "Р СљР С•Р В¶Р Р…Р С• Р В°Р С”РЎвЂљР С‘Р Р†Р С‘РЎР‚Р С•Р Р†Р В°РЎвЂљРЎРЉ Р Т‘Р С• Р С—РЎР‚Р С‘Р В»РЎвЂРЎвЂљР В°",
    store_required: "Р СћРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ Р Р†Р С‘Р В·Р С‘РЎвЂљ Р Р† Р С•РЎвЂћР С‘РЎРѓ Р С•Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚Р В° Р С‘Р В»Р С‘ Р В°РЎРЊРЎР‚Р С•Р С—Р С•РЎР‚РЎвЂљ",
    setup_intro: "Р СњР В°РЎРѓР С”Р С•Р В»РЎРЉР С”Р С• Р С—РЎР‚Р С•РЎРѓРЎвЂљР С• Р В°Р С”РЎвЂљР С‘Р Р†Р С‘РЎР‚Р С•Р Р†Р В°РЎвЂљРЎРЉ РЎвЂљР В°РЎР‚Р С‘РЎвЂћ Р Р…Р В° Р С—РЎР‚Р В°Р С”РЎвЂљР С‘Р С”Р Вµ РІР‚вЂќ Р Р…Р Вµ Р Р…Р В° Р В±РЎС“Р СР В°Р С–Р Вµ.",
    pref_cheapest: "Р вЂќР ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ Р Р†РЎРѓР ВµР С–Р С•", pref_esim: "Р СћР С•Р В»РЎРЉР С”Р С• eSIM",
    pref_nostore: "Р вЂР ВµР В· Р С•РЎвЂћР С‘РЎРѓР В° Р С•Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚Р В°", pref_roaming: "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р С—Р С• Р вЂР В°Р В»Р С”Р В°Р Р…Р В°Р С",
    pref_longterm: "Р вЂќР В»Р С‘РЎвЂљР ВµР В»РЎРЉР Р…Р С•Р Вµ Р С—РЎР‚Р ВµР В±РЎвЂ№Р Р†Р В°Р Р…Р С‘Р Вµ", pref_tourist: "Р вЂќР В»РЎРЏ РЎвЂљРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР С•Р Р†",
    days_7: "7 Р Т‘Р Р…Р ВµР в„–", days_14: "14 Р Т‘Р Р…Р ВµР в„–", days_21: "21 Р Т‘Р ВµР Р…РЎРЉ", days_30: "30 Р Т‘Р Р…Р ВµР в„–", days_45: "45 Р Т‘Р Р…Р ВµР в„–", days_60: "60 Р Т‘Р Р…Р ВµР в„–",
    tourist_ease: "Р Р€Р Т‘Р С•Р В±РЎРѓРЎвЂљР Р†Р С• Р Т‘Р В»РЎРЏ РЎвЂљРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР С•Р Р†", esim_quality: "eSIM",
    close: "Р вЂ”Р В°Р С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ",
    local_wins: (pct: number, ld: string, td: string) => `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ Р Р…Р В° ${pct}% РІР‚вЂќ ${ld} РЎР‚Р ВµР В°Р В»РЎРЉР Р…Р С•Р С–Р С• РЎвЂљРЎР‚Р В°РЎвЂћР С‘Р С”Р В° Р Р†Р СР ВµРЎРѓРЎвЂљР С• ${td}`,
    local_better: (pct: number, ld: string, td: string) => `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ Р Р…Р В° ${pct}% РІР‚вЂќ ${ld} Р Р†Р СР ВµРЎРѓРЎвЂљР С• ${td}, Р С—Р В»РЎР‹РЎРѓ Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚`,
    local_similar: "Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM: РЎРѓР С•Р С—Р С•РЎРѓРЎвЂљР В°Р Р†Р С‘Р СР В°РЎРЏ РЎвЂ Р ВµР Р…Р В°, РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚ Р С‘ Р В±Р С•Р В»РЎРЉРЎв‚¬Р Вµ РЎвЂљРЎР‚Р В°РЎвЂћР С‘Р С”Р В°",
    travel_wins: "Travel eSIM: Р В±Р ВµР В· РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘Р С‘, Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ Р Т‘Р С• Р С—РЎР‚Р С‘Р В»РЎвЂРЎвЂљР В°. Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM РЎвЂљРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљ Р С—Р В°РЎРѓР С—Р С•РЎР‚РЎвЂљ.",
    roaming_matrix_title: "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р С—Р С• Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№Р С Р вЂР В°Р В»Р С”Р В°Р Р…Р В°Р С",
    roaming_matrix_desc: "Р С™Р В°Р С”Р С‘Р Вµ SIM-Р С”Р В°РЎР‚РЎвЂљРЎвЂ№ РЎР‚Р В°Р В±Р С•РЎвЂљР В°РЎР‹РЎвЂљ Р В·Р В° Р С—РЎР‚Р ВµР Т‘Р ВµР В»Р В°Р СР С‘ РЎРѓР Р†Р С•Р ВµР в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р Р† РЎР‚Р ВµР С–Р С‘Р С•Р Р…Р Вµ.",
    matrix_sim_from: "SIM Р С‘Р В· РІвЂ вЂ™",
    matrix_note: "РІСљвЂ¦ Р СџР С•Р В»Р Р…РЎвЂ№Р в„– РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–  РІС™В РїС‘РЏ Р С›Р С–РЎР‚Р В°Р Р…Р С‘РЎвЂЎР ВµР Р…Р Р…РЎвЂ№Р в„–  РІСњРЉ Р СњР ВµРЎвЂљ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В°",
    plans_in: (c: string, n: number) => `${n} РЎвЂљР В°РЎР‚Р С‘РЎвЂћ${n === 1 ? "" : n < 5 ? "Р В°" : "Р С•Р Р†"} Р Р† ${c}`,
    per_gb: "/Р вЂњР вЂ",
    no_local_num: "Р вЂР ВµР В· Р СР ВµРЎРѓРЎвЂљР Р…Р С•Р С–Р С• Р Р…Р С•Р СР ВµРЎР‚Р В°",
    data_only: "Р СћР С•Р В»РЎРЉР С”Р С• Р С‘Р Р…РЎвЂљР ВµРЎР‚Р Р…Р ВµРЎвЂљ",
    instant: "Р РЋРЎР‚Р В°Р В·РЎС“",
    snapshot_label: "Р В¦Р ВµР Р…Р В° Р С•РЎР‚Р С‘Р ВµР Р…РЎвЂљР С‘РЎР‚Р С•Р Р†Р С•РЎвЂЎР Р…Р В°РЎРЏ",
    confidence_official: "Р С›РЎвЂћР С‘РЎвЂ Р С‘Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р С‘РЎРѓРЎвЂљР С•РЎвЂЎР Р…Р С‘Р С”",
    confidence_manual: "Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚Р ВµР Р…Р С• Р Р†РЎР‚РЎС“РЎвЂЎР Р…РЎС“РЎР‹",
    confidence_provider: "Р вЂќР В°Р Р…Р Р…РЎвЂ№Р Вµ Р С—РЎР‚Р С•Р Р†Р В°Р в„–Р Т‘Р ВµРЎР‚Р В°",
    confidence_snapshot: "Р В¦Р ВµР Р…Р В° Р СР С•Р В¶Р ВµРЎвЂљ Р С‘Р В·Р СР ВµР Р…Р С‘РЎвЂљРЎРЉРЎРѓРЎРЏ",
    confidence_review: "Р СћРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљ Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р С‘",
    verify_price: "Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚РЎРЉРЎвЂљР Вµ РЎвЂ Р ВµР Р…РЎС“ Р С—Р ВµРЎР‚Р ВµР Т‘ Р С—Р С•Р С”РЎС“Р С—Р С”Р С•Р в„–",
    app_data_label: "Р СћР С•Р В»РЎРЉР С”Р С• Р Т‘Р В»РЎРЏ Р С—РЎР‚Р С‘Р В»Р С•Р В¶Р ВµР Р…Р С‘Р в„–",
    for_trip: (d: number) => `Р СњР В° ${d} Р Т‘Р Р…Р ВµР в„–`,
    purchases: (n: number) => `${n}Р“вЂ” Р С—Р С•Р С”РЎС“Р С—Р С”${n === 1 ? "Р В°" : n < 5 ? "Р С‘" : "Р С•Р С”"}`,
    ext_options: "Р СџРЎР‚Р С•Р Т‘Р В»Р ВµР Р…Р С‘Р Вµ",
    general_data: "Р СљР С•Р В±Р С‘Р В»РЎРЉР Р…РЎвЂ№Р в„– Р С‘Р Р…РЎвЂљР ВµРЎР‚Р Р…Р ВµРЎвЂљ",
    shown_as: "Р С›РЎвЂљР С•Р В±РЎР‚Р В°Р В¶Р В°Р ВµРЎвЂљРЎРѓРЎРЏ Р С”Р В°Р С”",
    // РІвЂќР‚РІвЂќР‚ Р СљРЎС“Р В»РЎРЉРЎвЂљР С‘РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– РІвЂќР‚РІвЂќР‚
    sim_title: "Р СљРЎС“Р В»РЎРЉРЎвЂљР С‘РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–",
    sim_sub: "Р С›Р С—РЎвЂљР С‘Р СР В°Р В»РЎРЉР Р…Р В°РЎРЏ РЎРѓР Р†РЎРЏР В·РЎРЉ Р Т‘Р В»РЎРЏ Р С—Р С•Р ВµР В·Р Т‘Р С”Р С‘ Р С—Р С• Р Р…Р ВµРЎРѓР С”Р С•Р В»РЎРЉР С”Р С‘Р С РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р В°Р С",
    sim_countries: "Р РЋРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°",
    sim_add_country: "Р вЂќР С•Р В±Р В°Р Р†Р С‘РЎвЂљРЎРЉ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎС“",
    sim_duration: "Р вЂќР В»Р С‘РЎвЂљР ВµР В»РЎРЉР Р…Р С•РЎРѓРЎвЂљРЎРЉ Р С—Р С•Р ВµР В·Р Т‘Р С”Р С‘",
    sim_usage: "Р СџР С•РЎвЂљРЎР‚Р ВµР В±Р В»Р ВµР Р…Р С‘Р Вµ РЎвЂљРЎР‚Р В°РЎвЂћР С‘Р С”Р В°",
    sim_usage_light: "Р вЂєРЎвЂР С–Р С”Р С•Р Вµ",
    sim_usage_medium: "Р РЋРЎР‚Р ВµР Т‘Р Р…Р ВµР Вµ",
    sim_usage_heavy: "Р С’Р С”РЎвЂљР С‘Р Р†Р Р…Р С•Р Вµ",
    sim_hotspot: "Р СњРЎС“Р В¶Р Р…Р В° РЎР‚Р В°Р В·Р Т‘Р В°РЎвЂЎР В° Р С‘Р Р…РЎвЂљР ВµРЎР‚Р Р…Р ВµРЎвЂљР В°?",
    sim_esim_only: "Р СћР С•Р В»РЎРЉР С”Р С• eSIM?",
    sim_need_number: "Р СњРЎС“Р В¶Р ВµР Р… Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚?",
    sim_yes: "Р вЂќР В°",
    sim_no: "Р СњР ВµРЎвЂљ",
    sim_run: "Р СњР В°Р в„–РЎвЂљР С‘ Р В»РЎС“РЎвЂЎРЎв‚¬Р С‘Р в„– Р Р†Р В°РЎР‚Р С‘Р В°Р Р…РЎвЂљ",
    sim_strategy_local: "Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Р† Р С”Р В°Р В¶Р Т‘Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Вµ",
    sim_strategy_travel: "Р СћРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р В°РЎРЏ eSIM",
    sim_strategy_nomad: "EU Nomad (Orange Flex)",
    sim_recommended: "Р В Р ВµР С”Р С•Р СР ВµР Р…Р Т‘РЎС“Р ВµР С",
    sim_total_cost: "Р СџРЎР‚Р С‘Р СР ВµРЎР‚Р Р…Р В°РЎРЏ РЎРѓРЎвЂљР С•Р С‘Р СР С•РЎРѓРЎвЂљРЎРЉ",
    sim_per_month: "/Р СР ВµРЎРѓ.",
    sim_why: "Р СџР С•РЎвЂЎР ВµР СРЎС“ РЎРЊРЎвЂљР С•РЎвЂљ Р Р†Р В°РЎР‚Р С‘Р В°Р Р…РЎвЂљ?",
    sim_tradeoffs: "Р В§РЎвЂљР С• РЎС“РЎвЂЎР ВµРЎРѓРЎвЂљРЎРЉ",
    sim_setup_complexity: "Р С’Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ",
    sim_roaming_note: "Р В Р С•РЎС“Р СР С‘Р Р…Р С–",
    sim_not_applicable: "Р СњР Вµ Р С—Р С•Р Т‘РЎвЂ¦Р С•Р Т‘Р С‘РЎвЂљ Р Т‘Р В»РЎРЏ РЎРЊРЎвЂљР С•Р С–Р С• Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°",
    sim_no_data: "Р вЂќР В°Р Р…Р Р…РЎвЂ№РЎвЂ¦ Р С—Р С• РЎРЊРЎвЂљР С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Вµ Р С—Р С•Р С”Р В° Р Р…Р ВµРЎвЂљ",
    sim_back: "Р вЂ™Р ВµРЎР‚Р Р…РЎС“РЎвЂљРЎРЉРЎРѓРЎРЏ",
    sim_caveat_snapshot: "Р В¦Р ВµР Р…РЎвЂ№ РЎвЂљРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘РЎвЂ¦ eSIM Р С•РЎР‚Р С‘Р ВµР Р…РЎвЂљР С‘РЎР‚Р С•Р Р†Р С•РЎвЂЎР Р…РЎвЂ№Р Вµ РІР‚вЂќ Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚РЎРЏР в„–РЎвЂљР Вµ Р С—Р ВµРЎР‚Р ВµР Т‘ Р С—Р С•Р С”РЎС“Р С—Р С”Р С•Р в„–",
  },
} as const;

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Roaming data РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
type RoamVal = "yes" | "limited" | "no";
// Balkans roaming matrix: which SIMs from country A work in country B.
// Values are from-country perspective РІР‚вЂќ does a SIM purchased in 'from' roam in 'to'?
// ME is the strongest for multi-country: One Tourist includes RS, BA, ME, MK.
// AL is the weakest: most operators have no meaningful WB roaming.
const ROAMING_MATRIX: Record<string, Record<string, RoamVal>> = {
  RS: { RS: "yes",     BA: "no",      ME: "no",      AL: "no",      MK: "no"     },
  ME: { RS: "yes",     BA: "yes",     ME: "yes",     AL: "limited", MK: "yes"    },
  AL: { RS: "no",      BA: "no",      ME: "limited", AL: "yes",     MK: "no"     },
  BA: { RS: "yes",     BA: "yes",     ME: "yes",     AL: "limited", MK: "yes"    },
  MK: { RS: "yes",     BA: "yes",     ME: "yes",     AL: "limited", MK: "yes"    },
  DE: { RS: "no",      BA: "no",      ME: "no",      AL: "no",      MK: "no"     },
};
// Plan-specific notes shown on hover/tap for each cell
const ROAMING_NOTES: Record<string, Record<string, string>> = {
  RS: {
    RS: "All Serbian plans work domestically",
    BA: "No Serbian tourist plan includes WB roaming to Bosnia",
    ME: "No Serbian tourist plan includes WB roaming. Yettel Transit has 500 MB EU roaming only (not WB)",
    AL: "No WB roaming from Serbian plans",
    MK: "No Serbian tourist plan includes WB roaming to North Macedonia",
  },
  ME: {
    RS: "One Tourist 15: 8.5 GB Р’В· One Tourist 20: 11 GB Р’В· One Tourist 25: 13.5 GB WB roaming Р’В· m:tel Tourist: 5РІР‚вЂњ8 GB WB",
    BA: "One Tourist 20: 11 GB Р’В· One Tourist 25: 13.5 GB WB roaming includes Bosnia",
    ME: "Full domestic coverage",
    AL: "Limited РІР‚вЂќ Albania coverage not guaranteed on all WB roaming plans. Verify before travel.",
    MK: "One Tourist 20: 11 GB Р’В· One Tourist 25: 13.5 GB WB roaming includes N. Macedonia",
  },
  BA: {
    RS: "BH Telecom tourist eSIM includes WB roaming to Serbia",
    BA: "Full domestic coverage",
    ME: "BH Telecom tourist eSIM includes WB roaming to Montenegro",
    AL: "Limited РІР‚вЂќ Albania not guaranteed",
    MK: "BH Telecom tourist eSIM includes WB roaming to N. Macedonia",
  },
  MK: {
    RS: "A1 Roam Surf Balkan S (2 GB, РІвЂљВ¬4.82) or L (5 GB, РІвЂљВ¬8.05) add-on covers WB including Serbia",
    BA: "A1 Roam Surf Balkan add-on covers Bosnia",
    ME: "A1 Roam Surf Balkan add-on covers Montenegro",
    AL: "Limited РІР‚вЂќ Albania not guaranteed in WB roaming add-on",
    MK: "Full domestic coverage",
  },
  AL: {
    RS: "No WB roaming from Albanian plans",
    BA: "No WB roaming from Albanian plans",
    ME: "No WB roaming from Albanian plans",
    AL: "Full domestic coverage",
    MK: "No WB roaming from Albanian plans",
  },
};
const MATRIX_CC: CountryCode[] = ["RS", "BA", "ME", "AL", "MK"];

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Icons РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function Ic({ d, size = 14, color }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flexShrink: 0, display: "block" }}>
      <path d={d} />
    </svg>
  );
}
const IC = {
  globe:    "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2c0 0-4 4.5-4 10s4 10 4 10 4-4.5 4-10-4-10-4-10z",
  back:     "M19 12H5m7 7-7-7 7-7",
  coin:     "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3",
  mobile:   "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 16h.01",
  homeoff:  "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  antenna:  "M2 12h2m16 0h2M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z",
  calendar: "M3 4h18v18H3V4zm0 7h18M8 2v4m8-4v4",
  backpack: "M16 21V8a4 4 0 0 0-8 0v13M3 10h18M8 21h8",
  alert:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01",
  info:     "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 7v4m0 4h.01",
  check:    "M20 6 9 17l-5-5",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",
  link:     "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3",
  bulb:     "M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V18H9v-3.8A6 6 0 0 1 6 9a6 6 0 0 1 6-6z",
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  compare:  "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
  verified: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z",
  gift:     "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7m0-5a3 3 0 0 1 0 6 3 3 0 0 1 0-6z",
  language: "M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10m1.5-3h7",
  plane:    "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  x:        "M18 6 6 18M6 6l12 12",
};

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Badge types & builder РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
type BC = "badge-ok" | "badge-warn" | "badge-bad" | "badge-info" | "badge-muted" | "badge-purple" | "badge-green" | "badge-travel" | "badge-snapshot";

// Returns max 3 decision-relevant tags. Only signals that change a user's choice.
function mkBadges(p: Plan): { t: string; c: BC }[] {
  const b: { t: string; c: BC }[] = [];
  if (isSnap(p)) {
    b.push({ t: "No local number", c: "badge-bad" });
    return b;
  }
  // 1. Activation method (most important for tourists)
  if (p.esim_supported === true && p.activation_before_arrival && p.online_purchase) {
    b.push({ t: "Online activation", c: "badge-ok" });
  } else if (p.esim_supported === "unknown") {
    b.push({ t: "eSIM unconfirmed", c: "badge-warn" });
  } else if (p.esim_supported === false) {
    b.push({ t: "Physical SIM", c: "badge-muted" });
  }
  // 2. Local number
  if (p.local_number) {
    b.push({ t: "Local number", c: "badge-ok" });
  }
  // 3. One roaming signal if meaningful
  if (p.western_balkans_roaming && p.roaming_cap_gb && p.roaming_cap_gb > 0) {
    b.push({ t: `${p.roaming_cap_gb} GB Balkans roaming`, c: "badge-info" });
  } else if (p.eu_roaming && p.roaming_cap_gb && p.roaming_cap_gb > 0) {
    b.push({ t: `EU roaming included`, c: "badge-info" });
  } else if (p.store_visit_required) {
    b.push({ t: "Store visit required", c: "badge-bad" });
  }
  return b;
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Scoring engine РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
interface Scored {
  plan: Plan;
  score: number;
  purchases: number;
  total_cost: number;
  total_data_core: number | null;
  cost_per_day: number;
}

// Cost-per-GB for a local plan over the trip (null = unlimited)
function ppgLocal(s: Scored): number | null {
  if (s.plan.unlimited_data) return null;
  if (!s.total_data_core || s.total_data_core === 0) return null;
  return parseFloat((s.total_cost / s.total_data_core).toFixed(2));
}

function scorePlan(p: Plan, days: number, prefs: Set<PrefId>): Scored {
  const eur = getPriceEur(p);
  const purchases = Math.ceil(days / p.duration_days);
  const total_cost = parseFloat((eur * purchases).toFixed(2));
  const corePerPeriod = getDataCore(p);
  const total_data_core = p.unlimited_data ? null : (corePerPeriod !== null ? corePerPeriod * purchases : null);
  const cost_per_day = parseFloat((total_cost / days).toFixed(2));
  const fx = p.friction_score || 5;

  if (isSnap(p)) return { plan: p, score: -500, purchases, total_cost, total_data_core, cost_per_day };

  let s = 50;

  // eSIM + online activation
  if (p.esim_supported === true && p.online_purchase) s += 12;
  if (p.activation_before_arrival) s += 8;

  // Local number
  if (p.local_number) s += 5;

  // Roaming value
  if (p.western_balkans_roaming) s += 6;

  // Renewal flexibility
  if (p.renewable) s += 6;
  if (p.auto_renew) s += 3;

  // Registration burden РІР‚вЂќ distinguish between online KYC and true address/store requirement
  if (!p.passport_required && !p.kyc_required && !p.registration_required) s += 10;
  else if (p.kyc_required && p.online_purchase && !p.store_visit_required) s += 2; // online KYC only РІР‚вЂќ moderate, not severe
  else if (!p.kyc_required) s += 4;

  // Friction penalty РІР‚вЂќ cap effective friction for online-only markets (e.g. Germany KYC is online, not a store visit)
  const effectiveFx = (p.kyc_required && p.online_purchase && !p.store_visit_required && fx <= 5)
    ? Math.min(fx, 4)  // online KYC capped at 4 effective friction
    : fx;
  s -= effectiveFx * 3;

  // Cost РІР‚вЂќ scale penalty with trip length so short trips aren't over-penalised
  const costWeight = days <= 7 ? 0.15 : days <= 14 ? 0.25 : 0.35;
  s -= total_cost * costWeight;

  // Data adequacy
  if (total_data_core !== null) {
    if (total_data_core >= days * 1) s += 8;
    if (total_data_core >= days * 2) s += 5;
  }
  if (p.unlimited_data) s += 10;

  // Multi-purchase penalty (non-renewable multi-buy is risky)
  if (!p.renewable && purchases > 1) s -= 15;

  // Misc quality signals
  if (p.disposable_number) s -= 5;
  if (p.fair_use_policy) s -= 4;
  if (p.esim_supported === "unknown") s -= 8;
  if (p.store_visit_required) s -= 10;

  // App-only data is less useful than general data
  if (hasAppData(p)) s -= Math.min((p.data_gb_apps || 0) / 8, 5);

  // User priority boosts
  if (prefs.has("cheapest")) s += (50 - total_cost) * 0.8;
  if (prefs.has("esim") && p.esim_supported === true && p.activation_before_arrival) s += 28;
  if (prefs.has("nostore") && p.online_purchase && !p.store_visit_required) s += 20;
  if (prefs.has("roaming") && p.western_balkans_roaming) s += 20;
  if (prefs.has("longterm") && (p.auto_renew || p.renewable)) s += 15;
  if (prefs.has("tourist") && fx <= 3) s += 12;

  return { plan: p, score: s, purchases, total_cost, total_data_core, cost_per_day };
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Objective travel-vs-local comparison РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
// Verdict is derived from a multi-factor score, NOT just price %.
// travel_wins = travel eSIM is objectively better for this scenario.
// local_wins  = local SIM is clearly better.
// depends     = genuinely depends on what the user prioritises.
type Verdict = "local_wins" | "local_better" | "depends" | "travel_better" | "travel_wins";

interface TravelCmp {
  localOpt: Scored;
  snap: Plan;           // most relevant snapshot (closest duration match, then cheapest)
  savePct: number;      // positive = local cheaper, negative = travel cheaper
  localDataStr: string;
  snapDataStr: string;
  localPpg: number | null;
  snapPpg: number | null;
  verdict: Verdict;
  verdictReason: string;   // plain-English explanation shown in UI
  verdictReasonRu: string;
  travelWins: boolean;     // true when travel eSIM is the genuinely recommended option
  whyFactors: { label: string; labelRu: string; side: "travel" | "local" }[];
}

function buildTravelCmp(best: Scored, allScored: Scored[], snaps: Plan[], days: number, prefs: Set<PrefId>): TravelCmp | null {
  if (!snaps.length) return null;

  // РІвЂќР‚РІвЂќР‚ Pick most relevant snapshot РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
  // Prefer covering + meaningful data (>=3 GB); fall back gracefully.
  const coveringMeaningful = snaps.filter(s => s.duration_days >= days && (s.data_gb || 0) >= 3);
  const coveringAny = snaps.filter(s => s.duration_days >= days);
  const snap =
    coveringMeaningful.sort((a, b) => getPriceEur(a) - getPriceEur(b))[0] ||
    coveringAny.sort((a, b) => getPriceEur(a) - getPriceEur(b))[0] ||
    [...snaps].sort((a, b) => getPriceEur(a) - getPriceEur(b))[0];

  // РІвЂќР‚РІвЂќР‚ Pick most representative local plan for comparison РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
  // Use cheapest adequate plan (РІвЂ°Тђ0.5 GB/day, min 3 GB) that:
  // - covers trip in one purchase or is renewable
  // - doesn't require store visit
  // Sort: cost first, then friction, then prefer activation_before_arrival
  // (avoids picking address-restricted plans like Telekom DE over tourist-friendly ones)
  const minData = Math.max(days * 0.3, 3); // at least 0.3 GB/day or 3 GB РІР‚вЂќ avoids entry-level but not overly strict
  const adequateScored = [...allScored]
    .filter(s => (s.purchases === 1 || s.plan.renewable) &&
      !s.plan.store_visit_required &&
      (s.plan.unlimited_data || (s.total_data_core !== null && s.total_data_core >= minData)));
  const comparableLocal = adequateScored
    .sort((a, b) => {
      // Primary: cost
      if (Math.abs(a.total_cost - b.total_cost) > 1) return a.total_cost - b.total_cost;
      // Secondary: prefer activation_before_arrival (tourist-accessible)
      const aBefore = a.plan.activation_before_arrival ? 0 : 1;
      const bBefore = b.plan.activation_before_arrival ? 0 : 1;
      if (aBefore !== bBefore) return aBefore - bBefore;
      // Tertiary: lower friction
      return (a.plan.friction_score || 5) - (b.plan.friction_score || 5);
    })[0]
    || [...allScored].filter(s => s.purchases === 1 || s.plan.renewable).sort((a, b) => a.total_cost - b.total_cost)[0]
    || best;

  const tEur = getPriceEur(snap);
  const lEur = comparableLocal.total_cost;
  // positive = local is cheaper; negative = travel is cheaper
  const savePct = tEur > 0 ? Math.round(((tEur - lEur) / tEur) * 100) : 0;

  const localDataStr = comparableLocal.plan.unlimited_data ? "РІв‚¬С›"
    : comparableLocal.total_data_core !== null ? `${comparableLocal.total_data_core} GB` : "?";
  const snapDataStr = snap.data_gb ? `${snap.data_gb} GB` : "?";

  const lPpg = ppgLocal(comparableLocal);
  const sPpg = snap.data_gb ? parseFloat((tEur / snap.data_gb).toFixed(2)) : null;
  // true = local is cheaper per GB
  const localBetterPpg = lPpg !== null && sPpg !== null && lPpg < sPpg;
  // true = local is dramatically cheaper per GB (< half travel's price)
  const localMuchBetterPpg = lPpg !== null && sPpg !== null && lPpg < sPpg * 0.5;
  // true = travel is actually cheaper overall
  const travelCheaper = savePct < 0;
  // true = travel margin is tiny (under РІвЂљВ¬2) РІР‚вЂќ not worth weighting heavily
  const travelMarginTiny = travelCheaper && Math.abs(tEur - lEur) < 2;
  // local data core for trip vs snap data РІР‚вЂќ how much more does local offer?
  const localDataAdv = (comparableLocal.total_data_core !== null && snap.data_gb)
    ? comparableLocal.total_data_core / snap.data_gb : 0;

  const localFx = comparableLocal.plan.friction_score || 5;
  const needsPassport = !!(comparableLocal.plan.passport_required || comparableLocal.plan.registration_required);
  const needsStore = !!comparableLocal.plan.store_visit_required;
  const localHasNumber = comparableLocal.plan.local_number;
  const wantsNoKyc = prefs.has("esim") || prefs.has("nostore") || prefs.has("tourist");
  const wantsLong = prefs.has("longterm") || days >= 30;
  const wantsRoaming = prefs.has("roaming");
  const isShortTrip = days <= 7;
  // If local SIM is already frictionless (online eSIM, activate before arrival, low fx),
  // the "no KYC" preference advantage for travel is much weaker.
  const localEasyEnough = localFx <= 3 && comparableLocal.plan.esim_supported === true
    && comparableLocal.plan.activation_before_arrival && !needsStore;

  // РІвЂќР‚РІвЂќР‚ Travel convenience score РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
  let travelConvScore = 0;
  if (needsPassport) travelConvScore += 3;
  if (needsStore) travelConvScore += 3;
  if (localFx >= 6) travelConvScore += 2;
  if (isShortTrip) travelConvScore += 2;
  // wantsNoKyc boost is halved when local SIM is already easy to activate online
  if (wantsNoKyc) travelConvScore += localEasyEnough ? 1 : 2;

  // РІвЂќР‚РІвЂќР‚ Local value score РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
  let localValueScore = 0;
  if (savePct >= 40) localValueScore += 4;
  else if (savePct >= 20) localValueScore += 3;
  else if (savePct >= 5) localValueScore += 1;
  else if (travelCheaper && !travelMarginTiny) localValueScore -= 2;  // travel meaningfully cheaper
  else if (travelMarginTiny) localValueScore -= 1;                    // travel barely cheaper РІР‚вЂќ small penalty
  if (wantsLong) localValueScore += 3;
  if (wantsRoaming && comparableLocal.plan.western_balkans_roaming) localValueScore += 2;
  if (localHasNumber) localValueScore += 1;
  if (localMuchBetterPpg) localValueScore += 2;
  // Local gives dramatically more data for same/similar price
  if (localDataAdv >= 3 && !travelCheaper) localValueScore += 2;
  else if (localDataAdv >= 2 && !travelCheaper) localValueScore += 1;

  const travelEdge = travelConvScore - localValueScore;

  let verdict: Verdict;
  let travelWins: boolean;

  if (travelEdge >= 4) {
    verdict = "travel_wins"; travelWins = true;
  } else if (travelEdge >= 2) {
    verdict = "travel_better"; travelWins = true;
  } else if (Math.abs(travelEdge) < 2) {
    verdict = "depends"; travelWins = false;
  } else if (localValueScore - travelConvScore >= 4) {
    verdict = "local_wins"; travelWins = false;
  } else {
    verdict = "local_better"; travelWins = false;
  }

  // РІвЂќР‚РІвЂќР‚ Verdict reason РІР‚вЂќ uses actual numbers, never generic РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
  let verdictReason: string;
  let verdictReasonRu: string;

  // Human-readable data strings for verdict text
  const localDataLabel = localDataStr === "РІв‚¬С›" ? "unlimited data" : `${localDataStr} general data`;
  const localDataLabelRu = localDataStr === "РІв‚¬С›" ? "Р В±Р ВµР В·Р В»Р С‘Р СР С‘РЎвЂљР Р…РЎвЂ№Р в„– РЎвЂљРЎР‚Р В°РЎвЂћР С‘Р С”" : `${localDataStr} Р С•Р В±РЎвЂ°Р ВµР С–Р С• РЎвЂљРЎР‚Р В°РЎвЂћР С‘Р С”Р В°`;
  const priceDiff = parseFloat(Math.abs(tEur - lEur).toFixed(2));
  const dataRatioStr = (localDataAdv >= 2 && snap.data_gb)
    ? `${Math.round(localDataAdv)}Р“вЂ” more data (${localDataStr} vs ${snapDataStr})`
    : null;
  const dataRatioStrRu = (localDataAdv >= 2 && snap.data_gb)
    ? `Р Р† ${Math.round(localDataAdv)}Р“вЂ” Р В±Р С•Р В»РЎРЉРЎв‚¬Р Вµ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦ (${localDataStr} Р С—РЎР‚Р С•РЎвЂљР С‘Р Р† ${snapDataStr})`
    : null;

  if (verdict === "travel_wins") {
    if (travelCheaper && !travelMarginTiny) {
      verdictReason = `Travel eSIM wins РІР‚вЂќ it's cheaper (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur}), instant, and requires no passport. Local SIM offers ${dataRatioStr || "more data"} but costs more.`;
      verdictReasonRu = `Travel eSIM Р Р†РЎвЂ№Р С‘Р С–РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ РІР‚вЂќ Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur}), Р СР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…РЎвЂ№Р в„– Р С‘ Р В±Р ВµР В· Р С—Р В°РЎРѓР С—Р С•РЎР‚РЎвЂљР В°. Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Т‘Р В°РЎвЂРЎвЂљ ${dataRatioStrRu || "Р В±Р С•Р В»РЎРЉРЎв‚¬Р Вµ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦"}, Р Р…Р С• РЎРѓРЎвЂљР С•Р С‘РЎвЂљ Р Т‘Р С•РЎР‚Р С•Р В¶Р Вµ.`;
    } else if (needsStore) {
      verdictReason = `Travel eSIM wins for ${days} days РІР‚вЂќ it avoids the store visit and passport registration. The ${priceDiff > 0 ? `РІвЂљВ¬${priceDiff} extra` : "same"} cost is worth the convenience.`;
      verdictReasonRu = `Travel eSIM Р Р†РЎвЂ№Р С‘Р С–РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ Р Р…Р В° ${days} Р Т‘Р Р…Р ВµР в„– РІР‚вЂќ Р В±Р ВµР В· Р СР В°Р С–Р В°Р В·Р С‘Р Р…Р В° Р С‘ РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘Р С‘. ${priceDiff > 0 ? `Р СџР ВµРЎР‚Р ВµР С—Р В»Р В°РЎвЂљР В° РІвЂљВ¬${priceDiff}` : "Р С›Р Т‘Р С‘Р Р…Р В°Р С”Р С•Р Р†Р В°РЎРЏ РЎвЂ Р ВµР Р…Р В°"} Р С•Р С—РЎР‚Р В°Р Р†Р Т‘Р В°Р Р…Р В° РЎС“Р Т‘Р С•Р В±РЎРѓРЎвЂљР Р†Р С•Р С.`;
    } else if (localFx >= 6) {
      verdictReason = `Travel eSIM wins here. Local SIM requires KYC verification РІР‚вЂќ expect a 1РІР‚вЂњ2 day activation delay. Travel eSIM is instant and ${savePct > 0 ? `saves ${savePct}%` : `costs РІвЂљВ¬${priceDiff} more`}.`;
      verdictReasonRu = `Travel eSIM Р Р†РЎвЂ№Р С‘Р С–РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ. Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM РЎвЂљРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљ KYC-Р Р†Р ВµРЎР‚Р С‘РЎвЂћР С‘Р С”Р В°РЎвЂ Р С‘РЎР‹ (1РІР‚вЂњ2 Р Т‘Р Р…РЎРЏ). Travel eSIM Р СР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…РЎвЂ№Р в„– Р С‘ ${savePct > 0 ? `РЎРЊР С”Р С•Р Р…Р С•Р СР С‘РЎвЂљ ${savePct}%` : `РЎРѓРЎвЂљР С•Р С‘РЎвЂљ Р Р…Р В° РІвЂљВ¬${priceDiff} Р Т‘Р С•РЎР‚Р С•Р В¶Р Вµ`}.`;
    } else {
      verdictReason = `Travel eSIM is the better pick: instant activation, no passport needed${travelMarginTiny ? ", and the cost difference is negligible" : ""}.`;
      verdictReasonRu = `Travel eSIM РІР‚вЂќ Р В»РЎС“РЎвЂЎРЎв‚¬Р С‘Р в„– Р Р†РЎвЂ№Р В±Р С•РЎР‚: Р СР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…Р В°РЎРЏ Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ, Р В±Р ВµР В· Р С—Р В°РЎРѓР С—Р С•РЎР‚РЎвЂљР В°${travelMarginTiny ? ", РЎР‚Р В°Р В·Р Р…Р С‘РЎвЂ Р В° Р Р† РЎвЂ Р ВµР Р…Р Вµ Р СР С‘Р Р…Р С‘Р СР В°Р В»РЎРЉР Р…Р В°" : ""}.`;
    }
  } else if (verdict === "travel_better") {
    if (travelCheaper && !travelMarginTiny) {
      verdictReason = `Travel eSIM is probably better РІР‚вЂќ cheaper (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur}), no registration needed. Local SIM gives ${dataRatioStr || "more data"} with a real phone number.`;
      verdictReasonRu = `Travel eSIM, РЎРѓР С”Р С•РЎР‚Р ВµР Вµ Р Р†РЎРѓР ВµР С–Р С•, Р В»РЎС“РЎвЂЎРЎв‚¬Р Вµ РІР‚вЂќ Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur}), Р В±Р ВµР В· РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘Р С‘. Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Т‘Р В°РЎвЂРЎвЂљ ${dataRatioStrRu || "Р В±Р С•Р В»РЎРЉРЎв‚¬Р Вµ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦"} Р С‘ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚.`;
    } else if (localFx >= 6) {
      verdictReason = `Travel eSIM is probably the better choice. Local SIM requires KYC РІР‚вЂќ plan for a 1РІР‚вЂњ2 day delay. Travel eSIM works immediately${savePct > 0 ? ` and saves ${savePct}%` : ""}.`;
      verdictReasonRu = `Travel eSIM, РЎРѓР С”Р С•РЎР‚Р ВµР Вµ Р Р†РЎРѓР ВµР С–Р С•, Р В»РЎС“РЎвЂЎРЎв‚¬Р Вµ. Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM РЎвЂљРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљ KYC (1РІР‚вЂњ2 Р Т‘Р Р…РЎРЏ). Travel eSIM РЎР‚Р В°Р В±Р С•РЎвЂљР В°Р ВµРЎвЂљ РЎРѓРЎР‚Р В°Р В·РЎС“${savePct > 0 ? ` Р С‘ РЎРЊР С”Р С•Р Р…Р С•Р СР С‘РЎвЂљ ${savePct}%` : ""}.`;
    } else if (travelMarginTiny) {
      verdictReason = `Travel eSIM edges ahead: the price is nearly identical (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur}) but activation is instant with no registration.`;
      verdictReasonRu = `Travel eSIM Р Р…Р ВµР СР Р…Р С•Р С–Р С• Р В»РЎС“РЎвЂЎРЎв‚¬Р Вµ: РЎвЂ Р ВµР Р…РЎвЂ№ Р С—Р С•РЎвЂЎРЎвЂљР С‘ Р С•Р Т‘Р С‘Р Р…Р В°Р С”Р С•Р Р†РЎвЂ№Р Вµ (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur}), Р Р…Р С• Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ Р СР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…Р В°РЎРЏ Р С‘ Р В±Р ВµР В· РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘Р С‘.`;
    } else {
      verdictReason = `Travel eSIM is probably better for this trip: simpler activation, no passport, and the price gap${savePct > 0 ? ` (${savePct}% cheaper locally)` : ""} doesn't outweigh the convenience.`;
      verdictReasonRu = `Travel eSIM, РЎРѓР С”Р С•РЎР‚Р ВµР Вµ Р Р†РЎРѓР ВµР С–Р С•, Р В»РЎС“РЎвЂЎРЎв‚¬Р Вµ Р Т‘Р В»РЎРЏ РЎРЊРЎвЂљР С•Р в„– Р С—Р С•Р ВµР В·Р Т‘Р С”Р С‘: Р С—РЎР‚Р С•РЎвЂ°Р Вµ Р В°Р С”РЎвЂљР С‘Р Р†Р С‘РЎР‚Р С•Р Р†Р В°РЎвЂљРЎРЉ, Р В±Р ВµР В· Р С—Р В°РЎРѓР С—Р С•РЎР‚РЎвЂљР В°${savePct > 0 ? `, РЎвЂ¦Р С•РЎвЂљРЎРЏ Р СР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ Р Р…Р В° ${savePct}% Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ` : ""}.`;
    }
  } else if (verdict === "depends") {
    const localPpgStr = lPpg !== null ? `РІвЂљВ¬${lPpg}/GB` : null;
    const snapPpgStr  = sPpg !== null ? `РІвЂљВ¬${sPpg}/GB` : null;
    // ME-style: travel cheaper but local gives massive data advantage
    if (travelCheaper && localDataAdv >= 10) {
      verdictReason = `Genuinely depends. Travel eSIM (РІвЂљВ¬${tEur.toFixed(2)}) is cheaper, but local SIM gives ${dataRatioStr || "far more data"} with a real phone number. Budget travellers РІвЂ вЂ™ travel. Heavy users РІвЂ вЂ™ local.`;
      verdictReasonRu = `Р вЂќР ВµР в„–РЎРѓРЎвЂљР Р†Р С‘РЎвЂљР ВµР В»РЎРЉР Р…Р С• Р В·Р В°Р Р†Р С‘РЎРѓР С‘РЎвЂљ Р С•РЎвЂљ Р С—Р С•РЎвЂљРЎР‚Р ВµР В±Р Р…Р С•РЎРѓРЎвЂљР ВµР в„–. Travel eSIM (РІвЂљВ¬${tEur.toFixed(2)}) Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ, Р Р…Р С• Р СР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Т‘Р В°РЎвЂРЎвЂљ ${dataRatioStrRu || "Р Р…Р В°Р СР Р…Р С•Р С–Р С• Р В±Р С•Р В»РЎРЉРЎв‚¬Р Вµ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦"} РЎРѓ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р С Р Р…Р С•Р СР ВµРЎР‚Р С•Р С.`;
    } else if (localBetterPpg && localPpgStr && snapPpgStr) {
      verdictReason = `Close call. Local SIM: ${localDataLabel} at ${localPpgStr}${localHasNumber ? " + real number" : ""}. Travel eSIM: instant, no passport, ${snapDataStr} at ${snapPpgStr}.`;
      verdictReasonRu = `Р СџРЎР‚Р С‘Р СР ВµРЎР‚Р Р…Р С• РЎР‚Р В°Р Р†Р Р…Р С•. Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM: ${localDataLabelRu} Р В·Р В° ${localPpgStr}${localHasNumber ? " + РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚" : ""}. Travel eSIM: Р СР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…Р С•, Р В±Р ВµР В· Р С—Р В°РЎРѓР С—Р С•РЎР‚РЎвЂљР В°, ${snapDataStr} Р В·Р В° ${snapPpgStr}.`;
    } else if (!localBetterPpg && snapPpgStr && localPpgStr) {
      verdictReason = `Close call. Travel eSIM is cheaper per GB (${snapPpgStr} vs ${localPpgStr})${localHasNumber ? ". Local SIM adds a real phone number" : ""}. Local gives ${localDataStr} vs ${snapDataStr}.`;
      verdictReasonRu = `Р СџРЎР‚Р С‘Р СР ВµРЎР‚Р Р…Р С• РЎР‚Р В°Р Р†Р Р…Р С•. Travel eSIM Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ Р В·Р В° Р вЂњР вЂ (${snapPpgStr} Р С—РЎР‚Р С•РЎвЂљР С‘Р Р† ${localPpgStr})${localHasNumber ? ". Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Т‘Р В°РЎвЂРЎвЂљ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚" : ""}. Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ: ${localDataStr} Р С—РЎР‚Р С•РЎвЂљР С‘Р Р† ${snapDataStr}.`;
    } else {
      verdictReason = `Depends on priorities. Local SIM: ${localDataLabel}${localHasNumber ? " + real number" : ""} for РІвЂљВ¬${lEur}. Travel eSIM: instant activation, no registration, for РІвЂљВ¬${tEur.toFixed(2)}.`;
      verdictReasonRu = `Р вЂ”Р В°Р Р†Р С‘РЎРѓР С‘РЎвЂљ Р С•РЎвЂљ Р С—РЎР‚Р С‘Р С•РЎР‚Р С‘РЎвЂљР ВµРЎвЂљР С•Р Р†. Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ: ${localDataLabelRu}${localHasNumber ? " + РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚" : ""} Р В·Р В° РІвЂљВ¬${lEur}. Travel eSIM: Р СР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…Р С•, Р В±Р ВµР В· РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘Р С‘, Р В·Р В° РІвЂљВ¬${tEur.toFixed(2)}.`;
    }
  } else if (verdict === "local_wins") {
    if (savePct >= 40 && dataRatioStr) {
      verdictReason = `Local SIM clearly wins: ${dataRatioStr} for ${savePct}% less (РІвЂљВ¬${lEur} vs РІвЂљВ¬${tEur.toFixed(2)})${localHasNumber ? " plus a real phone number" : ""}. Passport registration is a one-time 5-minute step.`;
      verdictReasonRu = `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM РЎРЏР Р†Р Р…Р С• Р Р†РЎвЂ№Р С‘Р С–РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ: ${dataRatioStrRu} Р В·Р В° ${savePct}% Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ (РІвЂљВ¬${lEur} vs РІвЂљВ¬${tEur.toFixed(2)})${localHasNumber ? " Р С—Р В»РЎР‹РЎРѓ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚" : ""}. Р В Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘РЎРЏ РІР‚вЂќ 5 Р СР С‘Р Р…РЎС“РЎвЂљ.`;
    } else if (savePct >= 20) {
      verdictReason = `Local SIM wins: ${savePct}% cheaper (РІвЂљВ¬${lEur} vs РІвЂљВ¬${tEur.toFixed(2)})${lPpg && sPpg ? ` and ${Math.round(sPpg / lPpg)}Р“вЂ” better value per GB` : ""}${localHasNumber ? ", plus a real local number" : ""}.`;
      verdictReasonRu = `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Р†РЎвЂ№Р С‘Р С–РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ: Р Р…Р В° ${savePct}% Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ (РІвЂљВ¬${lEur} vs РІвЂљВ¬${tEur.toFixed(2)})${lPpg && sPpg ? ` Р С‘ Р Р† ${Math.round(sPpg / lPpg)}Р“вЂ” Р Р†РЎвЂ№Р С–Р С•Р Т‘Р Р…Р ВµР Вµ Р В·Р В° Р вЂњР вЂ` : ""}${localHasNumber ? ", Р С—Р В»РЎР‹РЎРѓ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚" : ""}.`;
    } else if (wantsLong) {
      verdictReason = `Local SIM wins for a ${days}-day stay: ${localDataLabel} for РІвЂљВ¬${lEur}${localHasNumber ? " with a real number" : ""}. Passport registration takes minutes and pays off over a longer trip.`;
      verdictReasonRu = `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Р†РЎвЂ№Р С‘Р С–РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ Р Т‘Р В»РЎРЏ ${days}-Р Т‘Р Р…Р ВµР Р†Р Р…Р С•Р С–Р С• Р С—РЎР‚Р ВµР В±РЎвЂ№Р Р†Р В°Р Р…Р С‘РЎРЏ: ${localDataLabelRu} Р В·Р В° РІвЂљВ¬${lEur}${localHasNumber ? " РЎРѓ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р С Р Р…Р С•Р СР ВµРЎР‚Р С•Р С" : ""}. Р В Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘РЎРЏ Р В·Р В°Р в„–Р СРЎвЂРЎвЂљ Р Р…Р ВµРЎРѓР С”Р С•Р В»РЎРЉР С”Р С• Р СР С‘Р Р…РЎС“РЎвЂљ.`;
    } else {
      verdictReason = `Local SIM wins: ${localDataLabel} for РІвЂљВ¬${lEur}${localHasNumber ? " with a real local number" : ""}. Travel eSIM offers ${snapDataStr} for РІвЂљВ¬${tEur.toFixed(2)} with no registration needed.`;
      verdictReasonRu = `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Р†РЎвЂ№Р С‘Р С–РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ: ${localDataLabelRu} Р В·Р В° РІвЂљВ¬${lEur}${localHasNumber ? " РЎРѓ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р С Р Р…Р С•Р СР ВµРЎР‚Р С•Р С" : ""}. Travel eSIM РІР‚вЂќ ${snapDataStr} Р В·Р В° РІвЂљВ¬${tEur.toFixed(2)} Р В±Р ВµР В· РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘Р С‘.`;
    }
  } else {
    // local_better
    if (savePct >= 20 && localBetterPpg && lPpg && sPpg) {
      verdictReason = `Local SIM is better value: ${savePct}% cheaper at РІвЂљВ¬${lPpg}/GB vs РІвЂљВ¬${sPpg}/GB. Travel eSIM is a valid alternative if instant, no-registration access is your priority.`;
      verdictReasonRu = `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Р†РЎвЂ№Р С–Р С•Р Т‘Р Р…Р ВµР Вµ: Р Р…Р В° ${savePct}% Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ, РІвЂљВ¬${lPpg}/Р вЂњР вЂ Р С—РЎР‚Р С•РЎвЂљР С‘Р Р† РІвЂљВ¬${sPpg}/Р вЂњР вЂ. Travel eSIM РІР‚вЂќ РЎР‚Р В°Р В·РЎС“Р СР Р…Р В°РЎРЏ Р В°Р В»РЎРЉРЎвЂљР ВµРЎР‚Р Р…Р В°РЎвЂљР С‘Р Р†Р В° Р Т‘Р В»РЎРЏ Р СР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…Р С•Р С–Р С• Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р В° Р В±Р ВµР В· РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘Р С‘.`;
    } else if (savePct >= 5) {
      verdictReason = `Local SIM is better value overall РІР‚вЂќ ${savePct}% cheaper with ${localDataStr} general data${localHasNumber ? " and a real phone number" : ""}. Travel eSIM is faster if you need instant activation.`;
      verdictReasonRu = `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Р† РЎвЂ Р ВµР В»Р С•Р С Р Р†РЎвЂ№Р С–Р С•Р Т‘Р Р…Р ВµР Вµ РІР‚вЂќ Р Р…Р В° ${savePct}% Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ РЎРѓ ${localDataStr} РЎвЂљРЎР‚Р В°РЎвЂћР С‘Р С”Р В°${localHasNumber ? " Р С‘ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р С Р Р…Р С•Р СР ВµРЎР‚Р С•Р С" : ""}. Travel eSIM Р В±РЎвЂ№РЎРѓРЎвЂљРЎР‚Р ВµР Вµ Р Т‘Р В»РЎРЏ Р СР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…Р С•Р в„– Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘Р С‘.`;
    } else {
      verdictReason = `Local SIM is the better value pick: ${localDataLabel} for РІвЂљВ¬${lEur}${localHasNumber ? " with a real number" : ""}. Travel eSIM (РІвЂљВ¬${tEur.toFixed(2)}) suits same-day-arrival or zero-hassle use.`;
      verdictReasonRu = `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Р†РЎвЂ№Р С–Р С•Р Т‘Р Р…Р ВµР Вµ: ${localDataLabelRu} Р В·Р В° РІвЂљВ¬${lEur}${localHasNumber ? " РЎРѓ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р С Р Р…Р С•Р СР ВµРЎР‚Р С•Р С" : ""}. Travel eSIM (РІвЂљВ¬${tEur.toFixed(2)}) РІР‚вЂќ Р Т‘Р В»РЎРЏ Р С—РЎР‚Р С‘Р В»РЎвЂРЎвЂљР В° Р Р† РЎвЂљР С•РЎвЂљ Р В¶Р Вµ Р Т‘Р ВµР Р…РЎРЉ Р С‘Р В»Р С‘ Р В±Р ВµР В· Р В»Р С‘РЎв‚¬Р Р…Р С‘РЎвЂ¦ РЎС“РЎРѓР С‘Р В»Р С‘Р в„–.`;
    }
  }

  // РІвЂќР‚РІвЂќР‚ Why factors РІР‚вЂќ key signals shown as pill tags РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
  const whyFactors: { label: string; labelRu: string; side: "travel" | "local" }[] = [];
  // Price signal РІР‚вЂќ show whichever side is cheaper, with amount
  if (travelCheaper && !travelMarginTiny) {
    whyFactors.push({ label: `Travel eSIM cheaper (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur})`, labelRu: `Travel eSIM Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur})`, side: "travel" });
  } else if (travelMarginTiny) {
    whyFactors.push({ label: `Similar price (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur})`, labelRu: `Р СџР С•РЎвЂ¦Р С•Р В¶Р В°РЎРЏ РЎвЂ Р ВµР Р…Р В° (РІвЂљВ¬${tEur.toFixed(2)} vs РІвЂљВ¬${lEur})`, side: "travel" });
  } else if (savePct >= 10) {
    whyFactors.push({ label: `Local SIM ${savePct}% cheaper (РІвЂљВ¬${lEur} vs РІвЂљВ¬${tEur.toFixed(2)})`, labelRu: `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ Р Р…Р В° ${savePct}% Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ`, side: "local" });
  }
  // Per-GB signal
  if (localBetterPpg && lPpg && sPpg) {
    whyFactors.push({ label: `Better РІвЂљВ¬/GB locally (РІвЂљВ¬${lPpg} vs РІвЂљВ¬${sPpg})`, labelRu: `Р вЂ™РЎвЂ№Р С–Р С•Р Т‘Р Р…Р ВµР Вµ Р В·Р В° Р вЂњР вЂ (РІвЂљВ¬${lPpg} vs РІвЂљВ¬${sPpg})`, side: "local" });
  } else if (!localBetterPpg && sPpg && lPpg) {
    whyFactors.push({ label: `Travel eSIM better РІвЂљВ¬/GB (РІвЂљВ¬${sPpg} vs РІвЂљВ¬${lPpg})`, labelRu: `Travel eSIM Р Р†РЎвЂ№Р С–Р С•Р Т‘Р Р…Р ВµР Вµ Р В·Р В° Р вЂњР вЂ (РІвЂљВ¬${sPpg} vs РІвЂљВ¬${lPpg})`, side: "travel" });
  }
  // Registration / friction
  if (needsPassport && !localEasyEnough) {
    whyFactors.push({ label: "Local SIM requires passport", labelRu: "Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM РЎвЂљРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљ Р С—Р В°РЎРѓР С—Р С•РЎР‚РЎвЂљ", side: "travel" });
  } else if (!needsPassport) {
    whyFactors.push({ label: "No registration needed", labelRu: "Р вЂР ВµР В· РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р В°РЎвЂ Р С‘Р С‘", side: "travel" });
  }
  if (localFx >= 6) {
    whyFactors.push({ label: `Local SIM: KYC verification required РІР‚вЂќ activation may take 1РІР‚вЂњ2 days`, labelRu: `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM: РЎвЂљРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ KYC-Р Р†Р ВµРЎР‚Р С‘РЎвЂћР С‘Р С”Р В°РЎвЂ Р С‘РЎРЏ РІР‚вЂќ Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ Р В·Р В°Р Р…Р С‘Р СР В°Р ВµРЎвЂљ 1РІР‚вЂњ2 Р Т‘Р Р…РЎРЏ`, side: "travel" });
  }
  // Local advantages
  if (localHasNumber) whyFactors.push({ label: "Includes real local number", labelRu: "Р В Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚", side: "local" });
  if (comparableLocal.plan.western_balkans_roaming) whyFactors.push({ label: "Balkans roaming included", labelRu: "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р С—Р С• Р вЂР В°Р В»Р С”Р В°Р Р…Р В°Р С", side: "local" });
  if (localDataAdv >= 3 && !travelCheaper) whyFactors.push({ label: `${Math.round(localDataAdv)}Р“вЂ” more data locally`, labelRu: `Р вЂ™ ${Math.round(localDataAdv)}Р“вЂ” Р В±Р С•Р В»РЎРЉРЎв‚¬Р Вµ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦`, side: "local" });
  // Trip context
  if (isShortTrip && !localEasyEnough) whyFactors.push({ label: "Short trip РІР‚вЂќ convenience matters", labelRu: "Р С™Р С•РЎР‚Р С•РЎвЂљР С”Р В°РЎРЏ Р С—Р С•Р ВµР В·Р Т‘Р С”Р В° РІР‚вЂќ РЎС“Р Т‘Р С•Р В±РЎРѓРЎвЂљР Р†Р С• Р Р†Р В°Р В¶Р Р…Р С•", side: "travel" });
  if (wantsLong) whyFactors.push({ label: "Long stay РІР‚вЂќ value matters more", labelRu: "Р вЂќР В»Р С‘РЎвЂљР ВµР В»РЎРЉР Р…Р С•Р Вµ Р С—РЎР‚Р ВµР В±РЎвЂ№Р Р†Р В°Р Р…Р С‘Р Вµ РІР‚вЂќ Р Р†РЎвЂ№Р С–Р С•Р Т‘Р В° Р Р†Р В°Р В¶Р Р…Р ВµР Вµ", side: "local" });

  return {
    localOpt: comparableLocal, snap, savePct, localDataStr, snapDataStr,
    localPpg: lPpg, snapPpg: sPpg, verdict, verdictReason, verdictReasonRu, travelWins, whyFactors,
  };
}

function useRec(country: CountryCode | null, days: number, prefs: Set<PrefId>) {
  return useMemo(() => {
    if (!country) return null;
    const locals = PLANS.filter(p => p.country_code === country && isScorable(p));
    const snaps  = PLANS.filter(p => p.country_code === country && isSnap(p));
    const scored = locals.map(p => scorePlan(p, days, prefs)).sort((a, b) => b.score - a.score);
    if (!scored.length) return null;

    // Category picks РІР‚вЂќ each from a different sort, never repeat a plan ID
    const shown = new Set<string>();
    function pick(arr: Scored[]): Scored | null {
      const f = arr.find(s => !shown.has(s.plan.id));
      if (f) shown.add(f.plan.id);
      return f || null;
    }
    const best = scored[0];
    shown.add(best.plan.id);

    const cheapest    = pick([...scored].sort((a, b) => a.total_cost - b.total_cost));
    const easiest     = pick([...scored].sort((a, b) => (a.plan.friction_score || 5) - (b.plan.friction_score || 5)));
    const bestEsim    = pick(scored
      .filter(s => s.plan.esim_supported === true && s.plan.activation_before_arrival && s.plan.online_purchase)
      .sort((a, b) => (a.plan.friction_score || 5) - (b.plan.friction_score || 5)));
    const bestUnlim   = pick(scored.filter(s => s.plan.unlimited_data));
    const bestLong    = pick([...scored].sort((a, b) => {
      const sa = (a.plan.auto_renew ? 4 : 0) + (a.plan.renewable ? 2 : 0) + (a.plan.duration_days >= 30 ? 1 : 0);
      const sb = (b.plan.auto_renew ? 4 : 0) + (b.plan.renewable ? 2 : 0) + (b.plan.duration_days >= 30 ? 1 : 0);
      return sb - sa;
    }));
    const bestRoaming = pick(scored
      .filter(s => s.plan.western_balkans_roaming && (s.plan.roaming_cap_gb || 0) > 0)
      .sort((a, b) => (b.plan.roaming_cap_gb || 0) - (a.plan.roaming_cap_gb || 0)));

    // Multi-factor travel vs local comparison
    const travelCmp = buildTravelCmp(best, scored, snaps, days, prefs);

    // РІвЂќР‚РІвЂќР‚ EU Nomad recommendation РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
    // Orange Flex is a region-agnostic plan РІР‚вЂќ surface it when the trip profile
    // makes it genuinely competitive (multi-week, EU country, value-seeking).
    // We compare it against: cheapest travel snap and cheapest local plan.
    const euNomadPlans = PLANS.filter(isEuNomad);
    let euNomadRec: {
      plan: Plan;
      isRelevant: boolean;
      vsBestLocal: string;
      vsTravel: string;
      vsBestLocalRu: string;
      vsTravelRu: string;
    } | null = null;

    if (euNomadPlans.length > 0) {
      const nomad = euNomadPlans[0]; // Orange Flex
      const nomadEur = getPriceEur(nomad);
      const nomadData = getDataCore(nomad) || 0;
      const cheapestLocalCost = Math.min(...scored.map(s => s.total_cost));
      const cheapestSnapEur = snaps.length > 0
        ? Math.min(...snaps.map(getPriceEur))
        : Infinity;
      const vsSnapSavePct = cheapestSnapEur < Infinity
        ? Math.round(((cheapestSnapEur - nomadEur) / cheapestSnapEur) * 100)
        : 0;

      // Relevant when: EU multi-week trip, value-seeker, or longterm pref
      // NOT shown on Balkans pages РІР‚вЂќ EU nomad is an EU strategy, not a Balkans strategy
      const BALKANS_CC = ["RS", "BA", "ME", "AL", "MK"];
      const isBalkanCountry = BALKANS_CC.includes(country);
      const isRelevant = !isBalkanCountry &&
        (days >= 14 || prefs.has("longterm")) &&
        // Only suggest if genuinely competitive vs travel eSIM (saves РІвЂ°Тђ10% or is cheaper)
        (vsSnapSavePct >= 0 || nomadEur <= cheapestSnapEur + 2);

      // VS local: compare monthly cost
      const localMonthlyEst = cheapestLocalCost / days * 30;
      const nomadCheaperThanLocal = nomadEur < localMonthlyEst;
      const vsBestLocal = nomadCheaperThanLocal
        ? `РІвЂљВ¬${nomadEur}/month is cheaper than the cheapest local option (РІвЂ°в‚¬РІвЂљВ¬${localMonthlyEst.toFixed(0)}/month equivalent). EU roaming only РІР‚вЂќ does not cover Balkans or non-EU countries.`
        : `Local SIM is cheaper for single-country stays. Orange Flex is an alternative if you plan multi-country EU travel. EU roaming only РІР‚вЂќ not for Balkans or Switzerland.`;
      const vsBestLocalRu = nomadCheaperThanLocal
        ? `РІвЂљВ¬${nomadEur}/Р СР ВµРЎРѓРЎРЏРЎвЂ  Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ Р СР ВµРЎРѓРЎвЂљР Р…Р С•Р С–Р С• Р Р†Р В°РЎР‚Р С‘Р В°Р Р…РЎвЂљР В° (РІвЂ°в‚¬РІвЂљВ¬${localMonthlyEst.toFixed(0)}/Р СР ВµРЎРѓРЎРЏРЎвЂ ). Р СћР С•Р В»РЎРЉР С”Р С• РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ РІР‚вЂќ Р Р…Р Вµ Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ Р вЂР В°Р В»Р С”Р В°Р Р…РЎвЂ№ Р С‘ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р Р†Р Р…Р Вµ Р вЂўР РЋ.`
        : `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Т‘Р ВµРЎв‚¬Р ВµР Р†Р В»Р Вµ Р Т‘Р В»РЎРЏ Р С•Р Т‘Р Р…Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№. Orange Flex РІР‚вЂќ Р В°Р В»РЎРЉРЎвЂљР ВµРЎР‚Р Р…Р В°РЎвЂљР С‘Р Р†Р В° Р Т‘Р В»РЎРЏ Р С—Р С•Р ВµР В·Р Т‘Р С•Р С” Р С—Р С• Р Р…Р ВµРЎРѓР С”Р С•Р В»РЎРЉР С”Р С‘Р С РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р В°Р С Р вЂўР РЋ. Р СћР С•Р В»РЎРЉР С”Р С• РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ.`;
      const vsTravel = vsSnapSavePct > 0
        ? `Saves ${vsSnapSavePct}% vs cheapest travel eSIM (РІвЂљВ¬${cheapestSnapEur.toFixed(2)}) and includes a real phone number. EU roaming only РІР‚вЂќ does not cover non-EU countries.`
        : `Similar price to travel eSIM, includes a real Polish number, and works monthly across EU countries. EU roaming only РІР‚вЂќ not for Balkans or Switzerland.`;
      const vsTravelRu = vsSnapSavePct > 0
        ? `Р В­Р С”Р С•Р Р…Р С•Р СР С‘РЎвЂљ ${vsSnapSavePct}% Р С—Р С• РЎРѓРЎР‚Р В°Р Р†Р Р…Р ВµР Р…Р С‘РЎР‹ РЎРѓ travel eSIM (РІвЂљВ¬${cheapestSnapEur.toFixed(2)}) Р С‘ Р Р†Р С”Р В»РЎР‹РЎвЂЎР В°Р ВµРЎвЂљ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚. Р СћР С•Р В»РЎРЉР С”Р С• РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ РІР‚вЂќ Р Р…Р Вµ Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р Р†Р Р…Р Вµ Р вЂўР РЋ.`
        : `Р СџР С•РЎвЂ¦Р С•Р В¶Р В°РЎРЏ РЎвЂ Р ВµР Р…Р В° РЎРѓ travel eSIM, Р Р†Р С”Р В»РЎР‹РЎвЂЎР В°Р ВµРЎвЂљ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р С—Р С•Р В»РЎРЉРЎРѓР С”Р С‘Р в„– Р Р…Р С•Р СР ВµРЎР‚, РЎР‚Р В°Р В±Р С•РЎвЂљР В°Р ВµРЎвЂљ Р ВµР В¶Р ВµР СР ВµРЎРѓРЎРЏРЎвЂЎР Р…Р С• Р С—Р С• Р вЂўР РЋ. Р СћР С•Р В»РЎРЉР С”Р С• РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ РІР‚вЂќ Р Р…Р Вµ Р Т‘Р В»РЎРЏ Р вЂР В°Р В»Р С”Р В°Р Р… Р С‘ Р РЃР Р†Р ВµР в„–РЎвЂ Р В°РЎР‚Р С‘Р С‘.`;

      euNomadRec = { plan: nomad, isRelevant, vsBestLocal, vsTravel, vsBestLocalRu, vsTravelRu };
    }

    // РІвЂќР‚РІвЂќР‚ Balkans arbitrage recommendation РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
    // Detect when buying a SIM from a *different* Balkans country is smarter.
    // Only surfaces if: (a) current country has no WB roaming plans, (b) user
    // wants roaming pref, or (c) days >= 14 and we detect a multi-country need.
    let balkansArbitrageRec: {
      plan: Plan;
      fromCountry: "ME" | "MK";
      message: string;
      messageRu: string;
      roamingCoverage: string;
      totalCost: number;
    } | null = null;

    const BALKANS_COUNTRIES: CountryCode[] = ["RS", "BA", "ME", "AL", "MK"];
    const isBalkanCountry = country !== null && BALKANS_COUNTRIES.includes(country);
    const hasNoWbRoaming = !scored.some(s => s.plan.western_balkans_roaming && (s.plan.roaming_cap_gb || 0) > 0);
    const wantsRoamingSignal = prefs.has("roaming") || days >= 14;

    if (isBalkanCountry && hasNoWbRoaming && wantsRoamingSignal && country !== "ME") {
      // Best arbitrage: Montenegro One Tourist 20 (РІвЂљВ¬20, 11 GB WB roaming, 30d)
      // It covers RS, BA, MK via WB roaming and is a better deal than buying separately
      const mePlan = PLANS.find(p => p.id === "one_me_tourist_20");
      if (mePlan) {
        const meEur = getPriceEur(mePlan);
        const localCheapest = scored.length > 0 ? Math.min(...scored.map(s => s.total_cost)) : 0;
        // Only show if ME plan isn't dramatically more expensive
        if (meEur <= localCheapest * 2.5 || prefs.has("roaming")) {
          const roamingGb = mePlan.roaming_cap_gb ?? 11;
          balkansArbitrageRec = {
            plan: mePlan,
            fromCountry: "ME",
            message: `Consider buying a Montenegro SIM instead. One Tourist 20 (РІвЂљВ¬${meEur}, 30d) includes ${roamingGb} GB Western Balkans roaming usable in ${country === "RS" ? "Serbia" : country === "BA" ? "Bosnia" : "North Macedonia"} РІР‚вЂќ and covers the whole WB region.`,
            messageRu: `Р В Р В°РЎРѓРЎРѓР СР С•РЎвЂљРЎР‚Р С‘РЎвЂљР Вµ РЎвЂЎР ВµРЎР‚Р Р…Р С•Р С–Р С•РЎР‚РЎРѓР С”РЎС“РЎР‹ SIM. One Tourist 20 (РІвЂљВ¬${meEur}, 30Р Т‘) Р Р†Р С”Р В»РЎР‹РЎвЂЎР В°Р ВµРЎвЂљ ${roamingGb} Р вЂњР вЂ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° Р С—Р С• Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№Р С Р вЂР В°Р В»Р С”Р В°Р Р…Р В°Р С, РЎР‚Р В°Р В±Р С•РЎвЂљР В°РЎР‹РЎвЂ°Р ВµР С–Р С• Р Р† ${country === "RS" ? "Р РЋР ВµРЎР‚Р В±Р С‘Р С‘" : country === "BA" ? "Р вЂР С•РЎРѓР Р…Р С‘Р С‘" : "Р РЋР ВµР Р†Р ВµРЎР‚Р Р…Р С•Р в„– Р СљР В°Р С”Р ВµР Т‘Р С•Р Р…Р С‘Р С‘"} РІР‚вЂќ Р С‘ Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ Р Р†Р ВµРЎРѓРЎРЉ РЎР‚Р ВµР С–Р С‘Р С•Р Р… WB.`,
            roamingCoverage: "Serbia, Bosnia, Montenegro, North Macedonia",
            totalCost: meEur,
          };
        }
      }
    }

    // A1 MK Roam Surf is the cheapest WB add-on РІР‚вЂќ show for Serbia if looking for roaming
    if (country === "RS" && prefs.has("roaming") && !balkansArbitrageRec) {
      const mkPlan = PLANS.find(p => p.id === "a1_mk_roam_balkan_l");
      if (mkPlan) {
        balkansArbitrageRec = {
          plan: mkPlan,
          fromCountry: "MK",
          message: `A1 North Macedonia Roam Surf Balkan L (5 GB, РІвЂљВ¬${getPriceEur(mkPlan)}) is the cheapest WB roaming add-on in the region РІР‚вЂќ but requires buying an A1 MK base plan first.`,
          messageRu: `A1 Р РЋР ВµР Р†Р ВµРЎР‚Р Р…Р В°РЎРЏ Р СљР В°Р С”Р ВµР Т‘Р С•Р Р…Р С‘РЎРЏ Roam Surf Balkan L (5 Р вЂњР вЂ, РІвЂљВ¬${getPriceEur(mkPlan)}) РІР‚вЂќ РЎРѓР В°Р СРЎвЂ№Р в„– Р Т‘Р ВµРЎв‚¬РЎвЂР Р†РЎвЂ№Р в„– WB РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р Р† РЎР‚Р ВµР С–Р С‘Р С•Р Р…Р Вµ, Р Р…Р С• РЎвЂљРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљ РЎРѓР Р…Р В°РЎвЂЎР В°Р В»Р В° Р С”РЎС“Р С—Р С‘РЎвЂљРЎРЉ Р В±Р В°Р В·Р С•Р Р†РЎвЂ№Р в„– РЎвЂљР В°РЎР‚Р С‘РЎвЂћ A1 MK.`,
          roamingCoverage: "Serbia, Bosnia, Montenegro, North Macedonia",
          totalCost: getPriceEur(mkPlan),
        };
      }
    }
    // РІвЂќР‚РІвЂќР‚ Optimizer message РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
    // Declared here, after scored/best are established, inside useMemo.
    let optimizerMsg = "";
    if (travelCmp?.travelWins && days <= 7) {
      const snap = travelCmp.snap;
      optimizerMsg = `For a ${days}-day trip, travel eSIM (${snap.provider_name}, РІвЂљВ¬${getPriceEur(snap).toFixed(2)}) is worth considering РІР‚вЂќ instant activation, no passport required. Local SIM (${best.plan.title}, РІвЂљВ¬${best.total_cost}) gives more data if you're willing to register.`;
    } else if (country === "ME") {
      const p15 = scored.find(s => s.plan.id === "one_me_tourist_15");
      const p20 = scored.find(s => s.plan.id === "one_me_tourist_20");
      if (p15 && p20 && days > 15 && days <= 30) {
        optimizerMsg = `One Tourist 20 (РІвЂљВ¬20/30d) beats 2Р“вЂ” One Tourist 15 (РІвЂљВ¬${p15.plan.price_eur! * 2}) for ${days} days РІР‚вЂќ saves РІвЂљВ¬${(p15.plan.price_eur! * 2) - p20.plan.price_eur!} with more roaming.`;
      } else if (days > 30) {
        optimizerMsg = `For ${days} days in Montenegro, m:tel Super Tourist (РІвЂљВ¬30/45d) covers your full stay in one purchase.`;
      } else if (days <= 7 && travelCmp) {
        optimizerMsg = `Short Montenegro trip: travel eSIM (${travelCmp.snap.provider_name}, РІвЂљВ¬${getPriceEur(travelCmp.snap).toFixed(2)}) is viable for instant setup. One Tourist 15 (РІвЂљВ¬15) gives 500 GB + local number if you register.`;
      }
    } else if (country === "RS") {
      if (days <= 7) {
        optimizerMsg = `A1 Welcome SIM (200 GB real data, РІвЂљВ¬8.27) is best for heavy users. Yettel Pripejd (РІвЂљВ¬5.13) for moderate use. Travel eSIM from РІвЂљВ¬5.50 if you need zero-hassle instant setup. Note: Yettel's "25 GB" = 5 GB general + 20 GB app-specific.`;
      } else if (days <= 15) {
        optimizerMsg = `Yettel Pripejd (РІвЂљВ¬5.13/15d, 5 GB real data) or Yettel Transit (РІвЂљВ¬10.26, 100 GB real data) for medium stays. Travel eSIM is not better value here. Displayed totals include app-specific GB.`;
      } else if (days <= 30) {
        optimizerMsg = `Yettel Pripejd Plus (РІвЂљВ¬8.12/30d, 10 GB real data) for budget month-long stays. A1 Mega auto-renews but eSIM unconfirmed. Travel eSIM is significantly worse value for 30-day stays.`;
      } else {
        optimizerMsg = `45+ days: A1 Mega (РІвЂљВ¬8.55/month, auto-renew) or monthly Yettel Pripejd Plus (РІвЂљВ¬8.12). App-specific GB does not count toward general browsing.`;
      }
    } else if (country === "DE") {
      if (days <= 7) {
        optimizerMsg = `Short Germany trip: travel eSIM (e.g. Airalo ~РІвЂљВ¬19, 10 GB) gives instant connectivity with no identity check. Local SIM (Vodafone CallYa M, РІвЂљВ¬14.99, 50 GB) offers far better РІвЂљВ¬/GB with online verification РІР‚вЂќ takes 1РІР‚вЂњ2 hours, hotel address accepted.`;
      } else if (days <= 14) {
        optimizerMsg = `For ${days} days: Vodafone CallYa M (РІвЂљВ¬14.99, 50 GB) or O2 Prepaid M (РІвЂљВ¬9.99, 20 GB) are solid choices РІР‚вЂќ both support online eSIM with identity verification using a hotel address. Activation is typically same-day.`;
      } else {
        optimizerMsg = `Germany: Vodafone CallYa (50РІР‚вЂњ100 GB, from РІвЂљВ¬14.99) or O2 (20РІР‚вЂњ40 GB, from РІвЂљВ¬9.99) offer excellent long-stay value with full EU roaming. Identity verification is fully online РІР‚вЂќ hotel address accepted. Telekom has the best network but requires a German address.`;
      }
    } else if (country === "AL") {
      if (days <= 3) {
        optimizerMsg = `Very short Albania trip: travel eSIM is worth considering to avoid the airport SIM queue. For longer stays, Vodafone Albania at TIA (~5 min with passport) gives far better value.`;
      } else {
        optimizerMsg = `Airport purchase at TIA is most reliable in Albania РІР‚вЂќ remote online purchase often fails. Buy Vodafone Albania on arrival: ~5 min with passport.`;
      }
    } else if (best.purchases === 1) {
      optimizerMsg = `${best.plan.title} covers your full ${days}-day trip in one purchase at РІвЂљВ¬${best.total_cost}.`;
    } else {
      optimizerMsg = `${best.plan.title} (${best.plan.duration_days}d) needs ${best.purchases} renewals totalling РІвЂљВ¬${best.total_cost} for ${days} days.`;
    }

    return { best, cheapest, easiest, bestEsim, bestUnlim, bestLong, bestRoaming, all: scored, snaps, travelCmp, euNomadRec, balkansArbitrageRec, optimizerMsg };
  }, [country, days, prefs]);
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Small UI components РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function Badges({ bs, max = 99 }: { bs: { t: string; c: BC }[]; max?: number }) {
  return (
    <div className="badge-row">
      {bs.slice(0, max).map((b, i) => <span key={i} className={`badge ${b.c}`}>{b.t}</span>)}
    </div>
  );
}

function FBar({ plan, lang }: { plan: Plan; lang: Lang }) {
  const t = T[lang];
  const fx = plan.friction_score || 5;
  const lbl = plan.setup_difficulty === "easy" ? t.easy : plan.setup_difficulty === "hard" ? t.hard : t.medium;
  return (
    <div className="friction-wrap">
      <span className="friction-label">{t.friction_setup}</span>
      <div className="friction-track"><div className="friction-fill" style={{ width: `${fx * 10}%`, background: fc(fx) }} /></div>
      <span className="friction-val" style={{ color: fc(fx) }}>{fx}/10 РІР‚вЂќ <strong>{lbl}</strong></span>
    </div>
  );
}

function Alrt({ type, children }: { type: "warn" | "info" | "ok" | "purple"; children: ReactNode }) {
  const icon = type === "ok" ? IC.check : type === "warn" ? IC.alert : type === "purple" ? IC.bulb : IC.info;
  return (
    <div className={`alert alert-${type}`} style={{ marginTop: 6 }}>
      <Ic d={icon} size={13} /><span>{children}</span>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Source button РІР‚вЂќ confidence-aware РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
// Renders a trust signal based on data_confidence, not operator_type.
// This separates "how trustworthy is this data" from "what kind of plan is it".
function SourceBtn({ plan, lang }: { plan: Plan; lang: Lang }) {
  const t = T[lang];
  const conf = plan.data_confidence || (isSnap(plan) ? "price_snapshot" : "verified_official");
  const href = (plan.affiliate_url && plan.affiliate_url !== "") ? plan.affiliate_url : plan.source_url;
  const hasBuyLink = !!(plan.affiliate_url && plan.affiliate_url !== "");
  const linkLabel = hasBuyLink ? t.buy_esim : isSnap(plan) ? t.view_snapshot : t.official_source;
  const linkClass = hasBuyLink ? "btn-buy-esim" : isSnap(plan) ? "btn-source-snap" : "btn-source";

  let trustBadge: ReactNode = null;
  if (conf === "verified_official") {
    trustBadge = <span className="verified-badge"><Ic d={IC.verified} size={12} /> {t.confidence_official} Р’В· {plan.last_verified}</span>;
  } else if (conf === "verified_manual") {
    trustBadge = <span className="verified-badge"><Ic d={IC.check} size={12} /> {t.confidence_manual} Р’В· {plan.last_verified}</span>;
  } else if (conf === "provider_listed") {
    trustBadge = <span className="verified-badge" style={{ background: "#eff6ff", borderColor: "#93c5fd", color: "#1d4ed8" }}><Ic d={IC.info} size={11} /> {t.confidence_provider}</span>;
  } else if (conf === "price_snapshot") {
    trustBadge = <span className="snapshot-badge"><Ic d={IC.alert} size={11} /> {t.confidence_snapshot}</span>;
  } else if (conf === "needs_review") {
    trustBadge = <span className="snapshot-badge" style={{ borderColor: "#d1d5db", background: "#f9fafb", color: "#6b7280" }}>{t.confidence_review}</span>;
  }

  return (
    <div className="verified-row">
      {trustBadge}
      <a className={linkClass} href={href} target="_blank" rel="noopener noreferrer">
        <Ic d={IC.link} size={11} /> {linkLabel}
      </a>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ App-data note block РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function AppDataNote({ plan }: { plan: Plan }) {
  if (!hasAppData(plan)) return null;
  return (
    <div className="app-data-block">
      <Ic d={IC.info} size={12} />
      <span>
        <strong>{plan.data_gb_core} GB general data</strong>
        {plan.data_gb_apps ? ` + ${plan.data_gb_apps} GB app-specific` : ""}
        {plan.apps_data_note ? `: ${plan.apps_data_note}` : ""}
      </span>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Plan modal РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function Modal({ plan, days, lang, onClose }: { plan: Plan; days: number; lang: Lang; onClose: () => void }) {
  const t = T[lang];
  const op = OPERATORS[plan.operator_id];
  const ctx = COUNTRIES[plan.country_code as CountryCode];
  const countryDisplay = ctx ? `${ctx.flag} ${lang === "ru" ? ctx.name_ru : ctx.name}` : plan.country_code;
  const eur = getPriceEur(plan);
  const purchases = isSnap(plan) ? 1 : Math.ceil(days / plan.duration_days);
  const total = parseFloat((eur * purchases).toFixed(2));
  const why = lang === "ru" ? plan.why_ru || plan.why : plan.why;
  const priceDisp = (plan.price_rub && !plan.price_eur)
    ? `РІвЂљР…${plan.price_rub} (РІвЂ°в‚¬РІвЂљВ¬${eur})`
    : `РІвЂљВ¬${eur}`;

  const cells: [string, string][] = isSnap(plan) ? [
    ["Provider", op?.name || plan.provider_name],
    ["Data", plan.data_gb ? `${plan.data_gb} GB` : "?"],
    ["Duration", `${plan.duration_days} days`],
    ["Price", priceDisp],
    ["РІвЂ°в‚¬ Cost per GB", plan.data_gb ? `РІвЂљВ¬${(eur / plan.data_gb).toFixed(2)}${t.per_gb}` : "РІР‚вЂќ"],
    ["Local number", "No РІР‚вЂќ data-only"],
    ["KYC", "None required"],
    ["Activation", "Instant РІР‚вЂќ QR scan"],
    ["Source", plan.source_name || "Provider listing"],
  ] : [
    [t.for_trip(days), `РІвЂљВ¬${total} Р’В· ${t.purchases(purchases)}`],
    ["Price / period", priceDisp + (plan.price_local ? ` (${plan.price_local} ${plan.currency})` : "")],
    ["Duration", `${plan.duration_days} days`],
    [t.general_data, plan.unlimited_data ? "Unlimited" : `${plan.data_gb_core !== undefined ? plan.data_gb_core : (plan.data_gb || "?")} GB`],
    ...(plan.data_gb_total_display && plan.data_gb_total_display !== `${plan.data_gb_core} GB`
      ? [[t.shown_as, plan.data_gb_total_display]] as [string, string][]
      : []),
    ...(plan.roaming_cap_gb && plan.roaming_cap_gb > 0
      ? [["Western Balkans roaming", `${plan.roaming_cap_gb} GB`]] as [string, string][]
      : []),
    ["Local number", plan.local_number ? "Yes" : "No"],
    ["eSIM", plan.esim_supported === true ? "Yes" : plan.esim_supported === "unknown" ? "Unconfirmed" : "No"],
    ["Activate before arrival", plan.activation_before_arrival ? "Yes" : "No"],
    ["Online purchase", plan.online_purchase ? "Yes" : "Store / airport only"],
    ["KYC / Passport", plan.kyc_required ? "Required" : plan.passport_required ? "Passport required" : "None needed"],
    ["Renewable", plan.renewable ? (plan.auto_renew ? "Yes (auto)" : "Yes") : "No"],
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div className="modal-title">{plan.title}</div>
            <div className="modal-subtitle">
              {op?.name || plan.provider_name} Р’В· {countryDisplay}
              {plan.data_confidence === "price_snapshot" && <span className="badge badge-snapshot" style={{ marginLeft: 8 }}>{t.confidence_snapshot}</span>}
              {plan.data_confidence === "needs_review" && <span className="badge badge-muted" style={{ marginLeft: 8 }}>{t.confidence_review}</span>}
              {isEuNomad(plan) && <span className="badge badge-eu-nomad" style={{ marginLeft: 8 }}>EU Nomad</span>}
            </div>
          </div>
          <button onClick={onClose} aria-label={t.close} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
            <Ic d={IC.x} size={18} />
          </button>
        </div>

        {plan.highlight && <div style={{ marginBottom: 10 }}><span className="badge badge-info">{plan.highlight}</span></div>}

        <Badges bs={mkBadges(plan)} />

        {/* Show confidence note when price may change or data needs review */}
        {(plan.data_confidence === "price_snapshot" || plan.data_confidence === "provider_listed") && (
          <div className="confidence-note">
            <Ic d={IC.alert} size={12} />
            <span>{t.travel_esim_disclaimer}</span>
          </div>
        )}
        {plan.data_confidence === "needs_review" && (
          <div className="confidence-note confidence-note-grey">
            <Ic d={IC.info} size={12} />
            <span>{lang === "ru" ? "Р В­РЎвЂљР С‘ Р Т‘Р В°Р Р…Р Р…РЎвЂ№Р Вµ РЎвЂљРЎР‚Р ВµР В±РЎС“РЎР‹РЎвЂљ Р С—Р С•Р Р†РЎвЂљР С•РЎР‚Р Р…Р С•Р в„– Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р С‘." : "This data is pending re-verification."}</span>
          </div>
        )}

        <AppDataNote plan={plan} />

        <div className="modal-detail-grid">
          {cells.map(([k, v]) => (
            <div key={k} className="modal-cell">
              <div className="modal-key">{k}</div>
              <div className="modal-val">{v}</div>
            </div>
          ))}
        </div>

        {plan.top_up_bonus && (
          <div className="topup-badge"><Ic d={IC.gift} size={12} />{plan.top_up_bonus}</div>
        )}

        {plan.extension_options && plan.extension_options.length > 0 && (
          <div className="ext-options">
            <div className="ext-title">{t.ext_options}</div>
            {plan.extension_options.map((e, i) => (
              <div key={i} className="ext-row">
                <span>Top-up {e.topup_local} {plan.currency}</span>
                <span>РІвЂ вЂ™ {e.total_validity_days} days total{e.note ? ` Р’В· ${e.note}` : ""}</span>
              </div>
            ))}
          </div>
        )}

        {why && (
          <div className="optimizer-block" style={{ marginTop: 10 }}>
            <div className="optimizer-title"><Ic d={IC.bulb} size={11} /> {t.why_this}</div>
            <div className="optimizer-text">{why}</div>
          </div>
        )}

        {/* Warnings РІР‚вЂќ deduplicated, max 2 shown (rest behind scroll) */}
        {(plan.warnings || [])
          .filter((w, i, arr) => arr.indexOf(w) === i)   // deduplicate
          .filter(w => w && w.length > 0)
          .slice(0, 2)
          .map((w, i) => <Alrt key={i} type="warn">{w}</Alrt>)}

        {plan.notes && <div className="notes-text">{plan.notes}</div>}

        <SourceBtn plan={plan} lang={lang} />
        <div style={{ marginTop: 6 }}>
          <ReportErrorLink lang={lang} ctx={{
            countryCode: plan.country_code,
            countryName: COUNTRIES[plan.country_code as CountryCode]?.name ?? plan.country_code,
            tripDuration: days,
            section: isSnap(plan) ? "Travel eSIM benchmark" : "Plan details",
            planTitle: plan.title,
            providerName: op?.name || plan.provider_name,
            sourceUrl: plan.source_url,
            lastVerified: plan.last_verified,
          }} />
        </div>
        <button className="modal-close" onClick={onClose}>{t.close}</button>
      </div>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Top featured card РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function TopCard({ s, tag, featured, lang, country, days, onOpen }: {
  s: Scored; tag: string; featured?: boolean; lang: Lang;
  country: CountryCode; days: number; onOpen: () => void;
}) {
  const { plan: p, total_cost, purchases, total_data_core } = s;
  const op = OPERATORS[p.operator_id];
  const isRu = lang === "ru";
  const dataDisp = p.unlimited_data ? "РІв‚¬С›" : (total_data_core !== null ? `${total_data_core} GB` : "?");

  // Activation signal РІР‚вЂќ one word, most important fact for tourists
  const activationLabel = p.esim_supported === true && p.activation_before_arrival
    ? (isRu ? "eSIM" : "eSIM")
    : p.esim_supported === false
      ? (isRu ? "Р В¤Р С‘Р В·Р С‘РЎвЂЎР ВµРЎРѓР С”Р В°РЎРЏ SIM" : "Physical SIM")
      : null;

  // Number signal
  const numberLabel = p.local_number
    ? (isRu ? "Р СљР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚" : "Local number")
    : null;

  // One caveat РІР‚вЂќ the most important restriction
  let caveat: string | null = null;
  if (hasAppData(p)) {
    caveat = isRu
      ? `${p.data_gb_core} Р вЂњР вЂ Р С•Р В±РЎвЂ°Р ВµР С–Р С• РЎвЂљРЎР‚Р В°РЎвЂћР С‘Р С”Р В° Р’В· ${p.data_gb_apps} Р вЂњР вЂ РЎвЂљР С•Р В»РЎРЉР С”Р С• Р Т‘Р В»РЎРЏ Р С—РЎР‚Р С‘Р В»Р С•Р В¶Р ВµР Р…Р С‘Р в„–`
      : `${p.data_gb_core} GB general Р’В· ${p.data_gb_apps} GB apps only`;
  } else if (p.store_visit_required) {
    caveat = isRu ? "Р СњРЎС“Р В¶Р ВµР Р… Р Р†Р С‘Р В·Р С‘РЎвЂљ Р Р† Р СР В°Р С–Р В°Р В·Р С‘Р Р… Р С‘Р В»Р С‘ Р В°РЎРЊРЎР‚Р С•Р С—Р С•РЎР‚РЎвЂљ" : "Store or airport visit required";
  } else if (p.fair_use_policy) {
    caveat = isRu ? "Р вЂќР ВµР в„–РЎРѓРЎвЂљР Р†РЎС“Р ВµРЎвЂљ Р В»Р С‘Р СР С‘РЎвЂљ РЎРѓР С—РЎР‚Р В°Р Р†Р ВµР Т‘Р В»Р С‘Р Р†Р С•Р С–Р С• Р С‘РЎРѓР С—Р С•Р В»РЎРЉР В·Р С•Р Р†Р В°Р Р…Р С‘РЎРЏ" : "Fair use policy applies";
  } else if (!p.renewable && purchases > 1) {
    caveat = isRu ? "Р СњР Вµ Р С—РЎР‚Р С•Р Т‘Р В»Р ВµР Р†Р В°Р ВµРЎвЂљРЎРѓРЎРЏ РІР‚вЂќ Р Р…РЎС“Р В¶Р Р…Р В° Р С—Р С•Р Р†РЎвЂљР С•РЎР‚Р Р…Р В°РЎРЏ Р С—Р С•Р С”РЎС“Р С—Р С”Р В°" : "Non-renewable РІР‚вЂќ requires repurchase";
  } else if (p.esim_supported === "unknown") {
    caveat = isRu ? "eSIM Р Р…Р Вµ Р С—Р С•Р Т‘РЎвЂљР Р†Р ВµРЎР‚Р В¶Р Т‘РЎвЂР Р… РІР‚вЂќ РЎС“РЎвЂљР С•РЎвЂЎР Р…Р С‘РЎвЂљР Вµ Р С—Р ВµРЎР‚Р ВµР Т‘ Р С—Р С•Р С”РЎС“Р С—Р С”Р С•Р в„–" : "eSIM availability unconfirmed";
  }

  // Roaming signal РІР‚вЂќ only if meaningful
  const roamingLabel = p.western_balkans_roaming && p.roaming_cap_gb
    ? `${p.roaming_cap_gb} GB Balkans roaming`
    : p.eu_roaming && p.roaming_cap_gb
      ? "EU roaming included"
      : null;

  const t = T[lang];

  return (
    <div className={`${featured ? "card-featured" : "card"} card-clickable`} style={{ marginBottom: 8 }} onClick={onOpen}>
      {/* Header: operator + tag */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>{op?.name || p.provider_name}</div>
        <span className="badge badge-info" style={{ flexShrink: 0, marginLeft: 8, fontSize: 10 }}>{tag}</span>
      </div>

      {/* Plan title */}
      <div style={{ fontSize: 16, fontWeight: 700, color: "#0f1117", letterSpacing: "-0.02em", marginBottom: 10 }}>{p.title}</div>

      {/* Core stats: price Р’В· data Р’В· duration */}
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f1117", letterSpacing: "-0.03em" }}>РІвЂљВ¬{total_cost}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{isRu ? "Р В·Р В° Р С—Р С•Р ВµР В·Р Т‘Р С”РЎС“" : "for trip"}</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f1117", letterSpacing: "-0.03em" }}>{dataDisp}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{isRu ? "РЎвЂљРЎР‚Р В°РЎвЂћР С‘Р С”" : hasAppData(p) ? "general" : "data"}</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f1117", letterSpacing: "-0.03em" }}>{p.duration_days}{isRu ? "Р Т‘" : "d"}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{isRu ? "РЎРѓРЎР‚Р С•Р С”" : "validity"}</div>
        </div>
      </div>

      {/* 2РІР‚вЂњ3 inline signals РІР‚вЂќ no badge spam */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: caveat ? 6 : 10, fontSize: 11, color: "#4b5563" }}>
        {activationLabel && <span>РІСљвЂњ {activationLabel}</span>}
        {numberLabel && <span>РІСљвЂњ {numberLabel}</span>}
        {roamingLabel && <span>РІСљвЂњ {roamingLabel}</span>}
      </div>

      {/* One caveat line РІР‚вЂќ amber, compact */}
      {caveat && (
        <div style={{ fontSize: 11, color: "#b45309", marginBottom: 10, lineHeight: 1.4 }}>РІС™В  {caveat}</div>
      )}

      <SourceBtn plan={p} lang={lang} />
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{isRu ? "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ РІвЂ вЂ™" : "More details РІвЂ вЂ™"}</div>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Alt card (compact list row) РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function AltCard({ s, tag, lang, onOpen }: { s: Scored; tag: string; lang: Lang; onOpen: () => void }) {
  const { plan: p, total_cost, purchases, total_data_core } = s;
  const op = OPERATORS[p.operator_id];
  const isRu = lang === "ru";
  const dataStr = p.unlimited_data ? "РІв‚¬С›" : (total_data_core !== null ? `${total_data_core} GB` : "?");
  // One caveat РІР‚вЂќ only if the data isn't what it seems
  const caveat = hasAppData(p)
    ? (isRu ? `${p.data_gb_core} Р вЂњР вЂ Р С•Р В±РЎвЂ°Р ВµР С–Р С• + ${p.data_gb_apps} Р вЂњР вЂ Р С—РЎР‚Р С‘Р В»Р С•Р В¶Р ВµР Р…Р С‘Р в„–` : `${p.data_gb_core} GB general + ${p.data_gb_apps} GB apps`)
    : p.store_visit_required
      ? (isRu ? "Р СњРЎС“Р В¶Р ВµР Р… Р С•РЎвЂћР С‘РЎРѓ Р С•Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚Р В°" : "Store required")
      : null;
  return (
    <div className="alt-card" onClick={onOpen}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1117" }}>{p.title}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>
          {op?.name || p.provider_name} Р’В· {p.duration_days}{isRu ? "Р Т‘" : "d"}
          {purchases > 1 ? ` Р’В· ${purchases}Р“вЂ”` : ""}
          {tag ? ` Р’В· ${tag}` : ""}
        </div>
        {caveat && <div style={{ fontSize: 10, color: "#b45309", marginTop: 3 }}>{caveat}</div>}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1117" }}>РІвЂљВ¬{total_cost}</div>
        <div style={{ fontSize: 10, color: "#9ca3af" }}>{dataStr}</div>
      </div>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Snapshot row (travel eSIM list item) РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function SnapCard({ plan, lang, country, days, onOpen }: {
  plan: Plan; lang: Lang; country: CountryCode; days: number; onOpen: () => void;
}) {
  const t = T[lang];
  const op = OPERATORS[plan.operator_id];
  const eur = getPriceEur(plan);
  const ppg = plan.data_gb ? `РІвЂљВ¬${(eur / plan.data_gb).toFixed(2)}${t.per_gb}` : null;
  const priceDisp = (plan.price_rub && !plan.price_eur) ? `РІвЂљР…${plan.price_rub}` : `РІвЂљВ¬${eur.toFixed(2)}`;
  return (
    <div className="alt-card snapshot-card" onClick={onOpen}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1117" }}>{op?.name || plan.provider_name}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", margin: "1px 0 5px" }}>
          {plan.data_gb} GB Р’В· {plan.duration_days} days Р’В· data only
        </div>
        <div style={{ fontSize: 10, color: "#92400e" }}>{t.verify_price}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#78350f" }}>{priceDisp}</div>
        {ppg && <div style={{ fontSize: 10, color: "#9ca3af" }}>{ppg}</div>}
      </div>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ EU Nomad card РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function EuNomadCard({ euNomadRec, lang, days, onOpen }: {
  euNomadRec: NonNullable<ReturnType<typeof useRec>>["euNomadRec"];
  lang: Lang;
  days: number;
  onOpen: (p: Plan) => void;
}) {
  if (!euNomadRec || !euNomadRec.isRelevant) return null;
  const { plan, vsBestLocal, vsTravel, vsBestLocalRu, vsTravelRu } = euNomadRec;
  const op = OPERATORS[plan.operator_id];
  const eur = getPriceEur(plan);
  const isRu = lang === "ru";

  return (
    <div className="eu-nomad-card" onClick={() => onOpen(plan)}>
      <div className="eu-nomad-header">
        <div className="eu-nomad-icon">СЂСџРЉРЊ</div>
        <div>
          <div className="eu-nomad-label">
            {isRu ? "EU Nomad" : "EU Nomad Setup"}
          </div>
          <div className="eu-nomad-title">{plan.title}</div>
        </div>
        <span className="badge badge-eu-nomad" style={{ marginLeft: "auto", flexShrink: 0 }}>
          {isRu ? "EU Nomad" : "EU Nomad Pick"}
        </span>
      </div>

      <div className="eu-nomad-stats">
        <div className="eu-nomad-stat">
          <div className="eu-nomad-stat-val">РІвЂљВ¬{eur}/mo</div>
          <div className="eu-nomad-stat-lbl">{isRu ? "Р Р† Р СР ВµРЎРѓРЎРЏРЎвЂ " : "per month"}</div>
        </div>
        <div className="eu-nomad-stat">
          <div className="eu-nomad-stat-val">{plan.roaming_cap_gb != null ? plan.roaming_cap_gb : plan.data_gb_core} GB</div>
          <div className="eu-nomad-stat-lbl">{isRu ? "РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ" : "EU roaming"}</div>
        </div>
        <div className="eu-nomad-stat">
          <div className="eu-nomad-stat-val">СЂСџвЂЎВµСЂСџвЂЎВ±</div>
          <div className="eu-nomad-stat-lbl">{isRu ? "РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚" : "real number"}</div>
        </div>
      </div>

      <div className="eu-nomad-feats">
        <div className="eu-nomad-feat"><Ic d={IC.check} size={11} color="#4f46e5" /> {isRu ? "Р В Р В°Р В±Р С•РЎвЂљР В°Р ВµРЎвЂљ Р С—Р С• Р Р†РЎРѓР ВµР СРЎС“ Р вЂўР РЋ" : "Works across all EU countries"}</div>
        <div className="eu-nomad-feat"><Ic d={IC.check} size={11} color="#4f46e5" /> {isRu ? "Р ВР Р…Р С•РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Р…РЎвЂ№Р в„– Р С—Р В°РЎРѓР С—Р С•РЎР‚РЎвЂљ" : "Foreign passport accepted"}</div>
        <div className="eu-nomad-feat"><Ic d={IC.check} size={11} color="#4f46e5" /> {isRu ? "Р С’Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ РЎвЂЎР ВµРЎР‚Р ВµР В· Р С—РЎР‚Р С‘Р В»Р С•Р В¶Р ВµР Р…Р С‘Р Вµ" : "App-based activation"}</div>
        <div className="eu-nomad-feat"><Ic d={IC.check} size={11} color="#4f46e5" /> {isRu ? "Р вЂР ВµР В· РЎР‚Р ВµР В·Р С‘Р Т‘Р ВµР Р…РЎвЂљРЎРѓРЎвЂљР Р†Р В° Р вЂўР РЋ" : "No EU residency required"}</div>
      </div>

      <div className="eu-nomad-vs">
        <div className="eu-nomad-vs-row">
          <span className="eu-nomad-vs-label">vs Travel eSIM</span>
          <span className="eu-nomad-vs-text">{isRu ? vsTravelRu : vsTravel}</span>
        </div>
        <div className="eu-nomad-vs-row" style={{ marginTop: 4 }}>
          <span className="eu-nomad-vs-label">vs Local SIM</span>
          <span className="eu-nomad-vs-text">{isRu ? vsBestLocalRu : vsBestLocal}</span>
        </div>
      </div>

      <div className="eu-nomad-caveats">
        <span style={{ color: "#6366f1", fontWeight: 600 }}>РІС™В  </span>
        {isRu
          ? "Р СџР С•Р В»РЎРЉРЎРѓР С”Р С‘Р в„– Р Р…Р С•Р СР ВµРЎР‚ РІР‚вЂќ Р Р…Р Вµ Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Т‘Р В»РЎРЏ Р С”Р В°Р В¶Р Т‘Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№. Р В Р С•РЎС“Р СР С‘Р Р…Р С–: ~12 Р вЂњР вЂ/Р СР ВµРЎРѓ, РЎвЂљР С•Р В»РЎРЉР С”Р С• РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р вЂўР РЋ. Р СњР Вµ РЎР‚Р В°Р В±Р С•РЎвЂљР В°Р ВµРЎвЂљ Р Р† Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№РЎвЂ¦ Р вЂР В°Р В»Р С”Р В°Р Р…Р В°РЎвЂ¦ Р С‘ Р РЃР Р†Р ВµР в„–РЎвЂ Р В°РЎР‚Р С‘Р С‘."
          : "Polish number РІР‚вЂќ not local. EU roaming capped (~12 GB/mo). EU countries only РІР‚вЂќ does NOT work in Western Balkans (Serbia, Montenegro etc.) or Switzerland."}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <a
          href={plan.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-source"
          style={{ borderColor: "#c7d2fe", background: "#eef2ff", color: "#4f46e5" }}
          onClick={e => e.stopPropagation()}
        >
          <Ic d={IC.link} size={11} /> {isRu ? "Orange Flex" : "Orange Flex"}
        </a>
        <div style={{ fontSize: 11, color: "#6366f1" }}>{isRu ? "Р СџР С•Р Т‘РЎР‚Р С•Р В±Р Р…Р ВµР Вµ РІвЂ вЂ™" : "Full details РІвЂ вЂ™"}</div>
      </div>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Travel eSIM tab РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function TravelTab({ snaps, travelCmp, lang, country, days, onOpen }: {
  snaps: Plan[];
  travelCmp: TravelCmp | null;
  lang: Lang;
  country: CountryCode;
  days: number;
  onOpen: (p: Plan) => void;
}) {
  const t = T[lang];
  const ctx = COUNTRIES[country];

  // Card colour: green border = local wins, amber = travel wins, grey = depends
  const cmpCardClass = travelCmp
    ? travelCmp.travelWins ? "vs-card vs-card-travel" : "vs-card vs-card-local"
    : "vs-card";

  return (
    <div>
      <div style={{ fontSize: 13, color: "#374151", marginBottom: "1rem", lineHeight: 1.65 }}>
        {t.travel_esim_intro}
      </div>

      {/* РІвЂќР‚РІвЂќР‚ Local vs Travel comparison card РІвЂќР‚РІвЂќР‚ */}
      {travelCmp && (
        <div className={cmpCardClass}>
          {/* Verdict label */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4, color: travelCmp.travelWins ? "#92400e" : travelCmp.verdict === "depends" ? "#374151" : "#15803d" }}>
            {travelCmp.verdict === "travel_wins"   && "РІСљв‚¬ Travel eSIM recommended for this trip"}
            {travelCmp.verdict === "travel_better" && "РІСљв‚¬ Travel eSIM probably better here"}
            {travelCmp.verdict === "depends"       && "РІС™вЂ“ Depends on your priorities"}
            {travelCmp.verdict === "local_better"  && "СЂСџвЂњВ¶ Local SIM better value"}
            {travelCmp.verdict === "local_wins"    && "СЂСџвЂњВ¶ Local SIM clearly wins"}
          </div>
          <div className="vs-verdict" style={{ color: travelCmp.travelWins ? "#92400e" : travelCmp.verdict === "depends" ? "#374151" : "#15803d" }}>
            {lang === "ru" ? travelCmp.verdictReasonRu : travelCmp.verdictReason}
          </div>

          {/* Why factors */}
          {travelCmp.whyFactors.length > 0 && (
            <div className="why-factors">
              {travelCmp.whyFactors.slice(0, 5).map((f, i) => (
                <div key={i} className={`why-factor why-factor-${f.side}`}>
                  <Ic d={f.side === "travel" ? IC.plane : IC.check} size={10} />
                  <span>{lang === "ru" ? f.labelRu : f.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="vs-row" style={{ marginTop: 12 }}>
            {/* Local SIM side */}
            <div className={`vs-option${!travelCmp.travelWins && travelCmp.verdict !== "depends" ? " highlight" : ""}`}>
              <div className="vs-provider">Local SIM</div>
              <div className="vs-price" style={{ color: travelCmp.travelWins ? "#374151" : "#0f1117" }}>РІвЂљВ¬{travelCmp.localOpt.total_cost}</div>
              <div className="vs-price-sub">{travelCmp.localOpt.plan.title}</div>
              {travelCmp.localOpt.plan.local_number
                ? <div className="vs-feat ok"><Ic d={IC.check} size={11} /> Local phone number</div>
                : <div className="vs-feat no"><Ic d={IC.x} size={11} /> No local number</div>}
              <div className="vs-feat ok"><Ic d={IC.check} size={11} /> {travelCmp.localDataStr} general data</div>
              {travelCmp.localPpg !== null && <div className="vs-feat ok"><Ic d={IC.check} size={11} /> РІвЂљВ¬{travelCmp.localPpg}/GB</div>}
              {travelCmp.localOpt.plan.western_balkans_roaming && (
                <div className="vs-feat ok"><Ic d={IC.check} size={11} /> Balkans roaming included</div>
              )}
              {travelCmp.localOpt.plan.verified && (
                <div className="vs-feat ok"><Ic d={IC.check} size={11} /> Verified official source</div>
              )}
              {(travelCmp.localOpt.plan.passport_required || travelCmp.localOpt.plan.registration_required) && (
                <div className="vs-feat warn"><Ic d={IC.alert} size={11} /> Passport required</div>
              )}
              {travelCmp.localOpt.plan.store_visit_required && (
                <div className="vs-feat warn"><Ic d={IC.alert} size={11} /> Store visit required</div>
              )}
              {hasAppData(travelCmp.localOpt.plan) && (
                <div className="vs-feat warn"><Ic d={IC.alert} size={11} /> +{travelCmp.localOpt.plan.data_gb_apps} GB app-specific only</div>
              )}
            </div>
            {/* Travel eSIM side */}
            <div className={`vs-option${travelCmp.travelWins ? " highlight highlight-travel" : ""}`}>
              <div className="vs-provider">{travelCmp.snap.provider_name}</div>
              <div className="vs-price" style={{ color: travelCmp.travelWins ? "#92400e" : "#374151" }}>РІвЂљВ¬{getPriceEur(travelCmp.snap).toFixed(2)}</div>
              <div className="vs-price-sub">{travelCmp.snapDataStr} Р’В· {travelCmp.snap.duration_days} days</div>
              <div className="vs-feat ok"><Ic d={IC.check} size={11} /> {t.instant} activation</div>
              <div className="vs-feat ok"><Ic d={IC.check} size={11} /> No KYC or passport</div>
              <div className="vs-feat ok"><Ic d={IC.check} size={11} /> Works before landing</div>
              {travelCmp.snapPpg !== null && <div className={`vs-feat ${travelCmp.localPpg !== null && travelCmp.snapPpg < travelCmp.localPpg ? "ok" : "no"}`}><Ic d={travelCmp.localPpg !== null && travelCmp.snapPpg < travelCmp.localPpg ? IC.check : IC.x} size={11} /> РІвЂљВ¬{travelCmp.snapPpg}/GB</div>}
              <div className="vs-feat no"><Ic d={IC.x} size={11} /> {t.no_local_num}</div>
              <div className="vs-feat no"><Ic d={IC.x} size={11} /> {t.data_only}</div>
              <div className="vs-feat warn"><Ic d={IC.alert} size={11} /> {t.verify_price}</div>
            </div>
          </div>
        </div>
      )}

      {/* РІвЂќР‚РІвЂќР‚ Snapshot list РІвЂќР‚РІвЂќР‚ */}
      <div className="sec-title">{t.all_travel_esims}</div>
      <div className="confidence-note">
        <Ic d={IC.alert} size={12} />
        <span>{t.travel_esim_disclaimer}</span>
      </div>
      {snaps.map(p => (
        <SnapCard key={p.id} plan={p} lang={lang} country={country} days={days} onOpen={() => onOpen(p)} />
      ))}
      <Alrt type="info">{t.travel_esim_note}</Alrt>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Setup difficulty tab РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function SetupTab({ all, lang, onOpen }: { all: Scored[]; lang: Lang; onOpen: (p: Plan) => void }) {
  const t = T[lang];
  const sorted = [...all].sort((a, b) => (a.plan.friction_score || 5) - (b.plan.friction_score || 5));
  return (
    <div>
      <div style={{ fontSize: 13, color: "#374151", marginBottom: "1rem", lineHeight: 1.65 }}>{t.setup_intro}</div>
      {sorted.map(({ plan: p }) => {
        const op = OPERATORS[p.operator_id];
        const fx = p.friction_score || 5;
        const lbl = p.setup_difficulty === "easy" ? t.easy : p.setup_difficulty === "hard" ? t.hard : t.medium;
        return (
          <div key={p.id} className="card card-clickable" style={{ marginBottom: 8 }} onClick={() => onOpen(p)}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{op?.name || p.provider_name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: fc(fx) }}>{fx}/10</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{lbl}</div>
              </div>
            </div>
            <FBar plan={p} lang={lang} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {(p.friction_notes || []).map((n, i) => <span key={i} className="badge badge-muted">{n}</span>)}
            </div>
            {p.activation_before_arrival && <Alrt type="ok">{t.activate_before}</Alrt>}
            {p.store_visit_required && <Alrt type="warn">{t.store_required}</Alrt>}
          </div>
        );
      })}
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Roaming matrix tab РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function RoamingMatrix({ country, lang, countries_data }: { country: CountryCode; lang: Lang; countries_data: typeof COUNTRIES }) {
  const t = T[lang];
  const isRu = lang === "ru";
  const [tip, setTip] = useState<string | null>(null);
  const ctx = countries_data[country];

  const cell = (from: CountryCode, to: CountryCode) => {
    const v: RoamVal = ROAMING_MATRIX[from]?.[to] || "no";
    const note = ROAMING_NOTES[from]?.[to];
    const icon = v === "yes" ? "РІСљвЂ¦" : v === "limited" ? "РІС™В РїС‘РЏ" : "РІСњРЉ";
    const cls = v === "yes" ? "matrix-cell-ok" : v === "limited" ? "matrix-cell-warn" : "matrix-cell-no";
    return (
      <span className={cls} style={{ cursor: note ? "help" : "default" }}
        onMouseEnter={() => note && setTip(note)}
        onMouseLeave={() => setTip(null)}
        onClick={() => note && setTip(tip === note ? null : note)}>
        {icon}
      </span>
    );
  };

  // Country-specific arbitrage insight
  const arbitrageNote = isRu
    ? ctx?.cross_border_note_ru
    : ctx?.cross_border_note;

  return (
    <div>
      <div style={{ fontSize: 13, color: "#374151", marginBottom: 12, lineHeight: 1.6 }}>
        {t.roaming_matrix_desc}
      </div>
      <div className="roaming-matrix">
        <div className="matrix-header">{t.roaming_matrix_title}</div>
        <div style={{ overflowX: "auto" }}>
          <table className="matrix-table">
            <thead>
              <tr>
                <th>{t.matrix_sim_from}</th>
                {MATRIX_CC.map(c => <th key={c}>{COUNTRIES[c].flag} {COUNTRIES[c].code}</th>)}
              </tr>
            </thead>
            <tbody>
              {MATRIX_CC.map(from => (
                <tr key={from} style={{ background: from === country ? "#eff6ff" : undefined }}>
                  <td style={{ fontWeight: from === country ? 700 : 500, color: from === country ? "#1d4ed8" : undefined }}>
                    {COUNTRIES[from].flag} {isRu ? COUNTRIES[from].name_ru : COUNTRIES[from].name}
                    {from === country && <span className="badge badge-info" style={{ marginLeft: 6, fontSize: 9 }}>{isRu ? "Р Р†РЎвЂ№Р В±РЎР‚Р В°Р Р…Р С•" : "selected"}</span>}
                  </td>
                  {MATRIX_CC.map(to => <td key={to}>{cell(from, to)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tip && <div className="matrix-tooltip">{tip}</div>}
        <div className="matrix-note">{t.matrix_note}</div>
      </div>

      {/* Country-specific callouts */}
      {country === "RS" && (
        <>
          <Alrt type="warn">
            {isRu
              ? "Yettel Р С‘ A1 Р Р…Р Вµ Р Р†Р С”Р В»РЎР‹РЎвЂЎР В°РЎР‹РЎвЂљ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р С—Р С• Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№Р С Р вЂР В°Р В»Р С”Р В°Р Р…Р В°Р С. Р вЂќР В»РЎРЏ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В° Р С—Р С• Р Р…Р ВµРЎРѓР С”Р С•Р В»РЎРЉР С”Р С‘Р С РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р В°Р С РЎР‚Р ВµР С–Р С‘Р С•Р Р…Р В° РЎР‚Р В°РЎРѓРЎРѓР СР С•РЎвЂљРЎР‚Р С‘РЎвЂљР Вµ РЎвЂЎР ВµРЎР‚Р Р…Р С•Р С–Р С•РЎР‚РЎРѓР С”РЎС“РЎР‹ SIM."
              : "Serbian tourist plans (Yettel, A1) do not include Western Balkans roaming. For multi-country Balkans travel, consider a Montenegro SIM below."}
          </Alrt>
          <Alrt type="info">
            {isRu
              ? "Yettel Transit: 500 Р СљР вЂ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° Р вЂўР РЋ. Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№РЎвЂ¦ Р вЂР В°Р В»Р С”Р В°Р Р… Р Р…Р Вµ Р Р†Р С”Р В»РЎР‹РЎвЂЎРЎвЂР Р…."
              : "Yettel Transit includes 500 MB EU roaming only РІР‚вЂќ not Western Balkans."}
          </Alrt>
        </>
      )}
      {country === "ME" && (
        <Alrt type="info">
          {isRu
            ? "One Tourist 15: 8.5 Р вЂњР вЂ WB Р’В· One Tourist 20: 11 Р вЂњР вЂ WB Р’В· One Tourist 25: 13.5 Р вЂњР вЂ WB РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° РІР‚вЂќ Р С‘РЎРѓР С—Р С•Р В»РЎРЉР В·РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ Р Р† Р РЋР ВµРЎР‚Р В±Р С‘Р С‘, Р вЂР С•РЎРѓР Р…Р С‘Р С‘, Р РЋР ВµР Р†Р ВµРЎР‚Р Р…Р С•Р в„– Р СљР В°Р С”Р ВµР Т‘Р С•Р Р…Р С‘Р С‘."
            : "One Tourist 15: 8.5 GB WB Р’В· One Tourist 20: 11 GB WB Р’В· One Tourist 25: 13.5 GB WB roaming РІР‚вЂќ usable in Serbia, Bosnia, North Macedonia."}
        </Alrt>
      )}
      {country === "MK" && (
        <Alrt type="info">
          {isRu
            ? "A1 Roam Surf Balkan S (2 Р вЂњР вЂ, ~РІвЂљВ¬4.82) Р С‘ L (5 Р вЂњР вЂ, ~РІвЂљВ¬8.05) РІР‚вЂќ Р Р…Р В°Р С‘Р В±Р С•Р В»Р ВµР Вµ Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р Р…РЎвЂ№Р Вµ Р С—Р В°Р С”Р ВµРЎвЂљРЎвЂ№ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° Р С—Р С• Р вЂР В°Р В»Р С”Р В°Р Р…Р В°Р С Р Р† РЎР‚Р ВµР С–Р С‘Р С•Р Р…Р Вµ."
            : "A1 Roam Surf Balkan S (2 GB, ~РІвЂљВ¬4.82) and L (5 GB, ~РІвЂљВ¬8.05) are the cheapest WB roaming add-ons in the region."}
        </Alrt>
      )}
      {country === "AL" && (
        <Alrt type="warn">
          {isRu
            ? "Р С›Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚РЎвЂ№ Р С’Р В»Р В±Р В°Р Р…Р С‘Р С‘ Р Р…Р Вµ Р С—Р С•Р Т‘Р Т‘Р ВµРЎР‚Р В¶Р С‘Р Р†Р В°РЎР‹РЎвЂљ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р С—Р С• Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№Р С Р вЂР В°Р В»Р С”Р В°Р Р…Р В°Р С. Р вЂќР В»РЎРЏ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В° Р С—Р С• Р Р…Р ВµРЎРѓР С”Р С•Р В»РЎРЉР С”Р С‘Р С РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р В°Р С Р Р…РЎС“Р В¶Р Р…Р В° Р С•РЎвЂљР Т‘Р ВµР В»РЎРЉР Р…Р В°РЎРЏ SIM."
            : "Most Albanian operators do not include Western Balkans roaming. For multi-country Balkans routes, a separate SIM is needed."}
        </Alrt>
      )}
      {country === "BA" && (
        <Alrt type="info">
          {isRu
            ? "BH Telecom Р Р†Р С”Р В»РЎР‹РЎвЂЎР В°Р ВµРЎвЂљ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р С—Р С• Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№Р С Р вЂР В°Р В»Р С”Р В°Р Р…Р В°Р С. Р ТђР С•РЎР‚Р С•РЎв‚¬Р С‘Р в„– Р Р†Р В°РЎР‚Р С‘Р В°Р Р…РЎвЂљ Р Т‘Р В»РЎРЏ РЎвЂљРЎР‚Р В°Р Р…Р В·Р С‘РЎвЂљР В° РЎвЂЎР ВµРЎР‚Р ВµР В· Р РЋР В°РЎР‚Р В°Р ВµР Р†Р С•."
            : "BH Telecom tourist eSIM includes WB roaming. Convenient for routes transiting through Sarajevo."}
        </Alrt>
      )}

      {/* Cross-border arbitrage note */}
      {arbitrageNote && (
        <div style={{ marginTop: 10, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, marginBottom: 3, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isRu ? "СЂСџвЂ”С” Р вЂР В°Р В»Р С”Р В°Р Р…РЎРѓР С”Р В°РЎРЏ РЎРѓРЎвЂљРЎР‚Р В°РЎвЂљР ВµР С–Р С‘РЎРЏ" : "СЂСџвЂ”С” Balkans arbitrage"}
          </div>
          {arbitrageNote}
        </div>
      )}
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ All Plans Tab РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
type SortKey = "score" | "price" | "data" | "ppg" | "duration" | "operator";
type FilterKey = "esim" | "number" | "balkans" | "instant" | "eu_roaming";

function AllPlansTab({ locals, snaps, days, lang, country, onModal }: {
  locals: Scored[];
  snaps: Plan[];
  days: number;
  lang: Lang;
  country: CountryCode;
  onModal: (p: Plan) => void;
}) {
  const [sort,    setSort]    = useState<SortKey>("score");
  const [grouped, setGrouped] = useState(false);
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const t = T[lang];
  const isRu = lang === "ru";

  function togFilter(f: FilterKey) {
    setFilters(prev => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });
  }

  // Apply filters
  const filtered = locals.filter(({ plan: p }) => {
    if (filters.has("esim") && p.esim_supported !== true) return false;
    if (filters.has("number") && !p.local_number) return false;
    if (filters.has("balkans") && !p.western_balkans_roaming) return false;
    if (filters.has("instant") && !p.activation_before_arrival) return false;
    if (filters.has("eu_roaming") && !p.eu_roaming) return false;
    return true;
  });

  // Apply sort
  const sortedLocals = [...filtered].sort((a, b) => {
    switch (sort) {
      case "price":    return a.total_cost - b.total_cost;
      case "data":     return (b.total_data_core ?? 999999) - (a.total_data_core ?? 999999);
      case "ppg": {
        const pa = a.total_data_core ? a.total_cost / a.total_data_core : 999;
        const pb = b.total_data_core ? b.total_cost / b.total_data_core : 999;
        return pa - pb;
      }
      case "duration": return a.plan.duration_days - b.plan.duration_days;
      case "operator": return (OPERATORS[a.plan.operator_id]?.name || a.plan.provider_name)
        .localeCompare(OPERATORS[b.plan.operator_id]?.name || b.plan.provider_name);
      default:         return b.score - a.score; // "score"
    }
  });

  // Minimal plan row РІР‚вЂќ price, data, duration, operator, one caveat
  function PlanRow({ scored }: { scored: Scored }) {
    const { plan: p, total_cost, purchases, total_data_core } = scored;
    const op = OPERATORS[p.operator_id];
    const dataStr = p.unlimited_data ? "РІв‚¬С›" : (total_data_core !== null ? `${total_data_core} GB` : "?");
    const ppg = total_data_core && !p.unlimited_data ? `РІвЂљВ¬${(total_cost / total_data_core).toFixed(2)}/GB` : null;
    const caveat = hasAppData(p)
      ? (isRu ? `${p.data_gb_core} Р вЂњР вЂ Р С•Р В±РЎвЂ°Р ВµР С–Р С• + ${p.data_gb_apps} Р вЂњР вЂ Р С—РЎР‚Р С‘Р В»Р С•Р В¶Р ВµР Р…Р С‘Р в„–` : `${p.data_gb_core} GB general + ${p.data_gb_apps} GB apps`)
      : p.store_visit_required ? (isRu ? "Р СњРЎС“Р В¶Р ВµР Р… Р С•РЎвЂћР С‘РЎРѓ Р С•Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚Р В°" : "Store required")
      : p.western_balkans_roaming && p.roaming_cap_gb ? `${p.roaming_cap_gb} GB ${isRu ? "WB РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–" : "WB roaming"}`
      : p.eu_roaming && p.roaming_cap_gb ? `EU roaming`
      : null;

    return (
      <div className="alt-card" onClick={() => onModal(p)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1117" }}>{p.title}</div>
          <div style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>
            {op?.name || p.provider_name} Р’В· {p.duration_days}{isRu ? "Р Т‘" : "d"}
            {purchases > 1 ? ` Р’В· ${purchases}Р“вЂ”` : ""}
          </div>
          {caveat && <div style={{ fontSize: 10, color: "#b45309", marginTop: 3 }}>{caveat}</div>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>РІвЂљВ¬{total_cost}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{dataStr}</div>
          {ppg && <div style={{ fontSize: 10, color: "#9ca3af" }}>{ppg}</div>}
        </div>
      </div>
    );
  }

  // Group by operator
  function renderGrouped() {
    const groups = new Map<string, Scored[]>();
    sortedLocals.forEach(s => {
      const key = OPERATORS[s.plan.operator_id]?.name || s.plan.provider_name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    });
    return Array.from(groups.entries()).map(([opName, items]) => (
      <div key={opName} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#4b5563", margin: "0 0 6px", paddingBottom: 4, borderBottom: "1px solid #e8eaef" }}>
          {opName} <span style={{ fontWeight: 400, color: "#9ca3af" }}>({items.length})</span>
        </div>
        {items.map(s => <PlanRow key={s.plan.id} scored={s} />)}
      </div>
    ));
  }

  const SORT_OPTS: { key: SortKey; label: string; labelRu: string }[] = [
    { key: "score",    label: "Best match",  labelRu: "Р СџР С• РЎР‚Р ВµР в„–РЎвЂљР С‘Р Р…Р С–РЎС“" },
    { key: "price",    label: "Price РІвЂ вЂ",     labelRu: "Р В¦Р ВµР Р…Р В° РІвЂ вЂ" },
    { key: "data",     label: "Data РІвЂ вЂњ",      labelRu: "Р вЂќР В°Р Р…Р Р…РЎвЂ№Р Вµ РІвЂ вЂњ" },
    { key: "ppg",      label: "РІвЂљВ¬/GB",        labelRu: "РІвЂљВ¬/Р вЂњР вЂ" },
    { key: "duration", label: "Duration РІвЂ вЂ",  labelRu: "Р РЋРЎР‚Р С•Р С” РІвЂ вЂ" },
    { key: "operator", label: "Operator AРІР‚вЂњZ",labelRu: "Р С›Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚ Р С’РІР‚вЂњР Р‡" },
  ];

  const FILTER_OPTS: { key: FilterKey; label: string; labelRu: string }[] = [
    { key: "esim",      label: "eSIM",           labelRu: "eSIM" },
    { key: "instant",   label: "Before arrival", labelRu: "Р вЂќР С• Р С—РЎР‚Р С‘Р В»РЎвЂРЎвЂљР В°" },
    { key: "number",    label: "Local number",   labelRu: "Р СљР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚" },
    { key: "balkans",   label: "Balkans roaming",labelRu: "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂР В°Р В»Р С”Р В°Р Р…РЎвЂ№" },
    { key: "eu_roaming",label: "EU roaming",     labelRu: "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ" },
  ];

  const hasFilters = filters.size > 0;

  return (
    <div>
      {/* Sort controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", flexShrink: 0 }}>
          {isRu ? "Р РЋР С•РЎР‚РЎвЂљР С‘РЎР‚Р С•Р Р†Р С”Р В°" : "Sort"}
        </span>
        {SORT_OPTS.map(o => (
          <button
            key={o.key}
            onClick={() => setSort(o.key)}
            style={{
              padding: "3px 9px", borderRadius: 20, border: "1px solid",
              fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              background: sort === o.key ? "#0f1117" : "#ffffff",
              color: sort === o.key ? "#ffffff" : "#4b5563",
              borderColor: sort === o.key ? "#0f1117" : "#e0e3ea",
            }}
          >{isRu ? o.labelRu : o.label}</button>
        ))}
        <button
          onClick={() => setGrouped(g => !g)}
          style={{
            padding: "3px 9px", borderRadius: 20, border: "1px solid",
            fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            background: grouped ? "#eff6ff" : "#ffffff",
            color: grouped ? "#1d4ed8" : "#4b5563",
            borderColor: grouped ? "#93c5fd" : "#e0e3ea",
          }}
        >{isRu ? "Р СџР С• Р С•Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚Р В°Р С" : "By operator"}</button>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {FILTER_OPTS.map(f => (
          <button
            key={f.key}
            onClick={() => togFilter(f.key)}
            style={{
              padding: "3px 9px", borderRadius: 20, border: "1px solid",
              fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              background: filters.has(f.key) ? "#f0fdf4" : "#f6f7f9",
              color: filters.has(f.key) ? "#15803d" : "#6b7280",
              borderColor: filters.has(f.key) ? "#86efac" : "#e0e3ea",
            }}
          >{isRu ? f.labelRu : f.label}</button>
        ))}
        {hasFilters && (
          <button
            onClick={() => setFilters(new Set())}
            style={{ padding: "3px 9px", borderRadius: 20, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
          >{isRu ? "РІСљвЂў Р С›РЎвЂЎР С‘РЎРѓРЎвЂљР С‘РЎвЂљРЎРЉ" : "РІСљвЂў Clear"}</button>
        )}
      </div>

      {/* Count */}
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
        {sortedLocals.length} {isRu ? "РЎвЂљР В°РЎР‚Р С‘РЎвЂћ" + (sortedLocals.length === 1 ? "" : sortedLocals.length < 5 ? "Р В°" : "Р С•Р Р†") : `plan${sortedLocals.length !== 1 ? "s" : ""}`}
        {hasFilters && <span style={{ color: "#b45309" }}> РІР‚вЂќ filtered</span>}
      </div>

      {sortedLocals.length === 0 && (
        <div style={{ padding: "2rem 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
          {isRu ? "Р СњР ВµРЎвЂљ РЎвЂљР В°РЎР‚Р С‘РЎвЂћР С•Р Р† Р Т‘Р В»РЎРЏ Р Р†РЎвЂ№Р В±РЎР‚Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦ РЎвЂћР С‘Р В»РЎРЉРЎвЂљРЎР‚Р С•Р Р†" : "No plans match the selected filters"}
        </div>
      )}

      {/* Plans */}
      {grouped ? renderGrouped() : sortedLocals.map(s => <PlanRow key={s.plan.id} scored={s} />)}

      {/* Snapshots РІР‚вЂќ always below, unaffected by local sort/filter */}
      {snaps.length > 0 && (
        <>
          <div className="sec-divider" style={{ marginTop: 16 }}>
            <span>{t.all_snapshot_plans}</span>
          </div>
          <div className="confidence-note">
            <Ic d={IC.alert} size={12} />
            <span>{t.travel_esim_disclaimer}</span>
          </div>
          {snaps.map(p => (
            <SnapCard key={p.id} plan={p} lang={lang} country={country} days={days} onOpen={() => onModal(p)} />
          ))}
        </>
      )}
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Results page РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function ResultsPage({ country, days, prefs, lang, onBack, onModal }: {
  country: CountryCode; days: number; prefs: Set<PrefId>; lang: Lang;
  onBack: () => void; onModal: (p: Plan) => void;
}) {
  const [tab, setTab] = useState<TabId>("rec");
  const t = T[lang];
  const ctx = COUNTRIES[country];
  const rec = useRec(country, days, prefs);

  // No local plans found for this country РІР‚вЂќ show empty state instead of blank screen
  if (!rec) {
    const ctx2 = COUNTRIES[country];
    const t2 = T[lang];
    return (
      <div className="results-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
          <button className="btn-ghost" onClick={onBack}><Ic d={IC.back} size={13} /> {t2.back}</button>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{ctx2?.flag ?? "СЂСџвЂњРЋ"}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1117", marginBottom: 8 }}>
            No plans found for {lang === "ru" ? ctx2?.name_ru : ctx2?.name} yet
          </div>
          <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 20, lineHeight: 1.6 }}>
            We&apos;re still gathering verified data for this country.{" "}
            Check back soon or explore another destination.
          </div>
          <button className="btn-ghost" onClick={onBack} style={{ margin: "0 auto" }}>
            <Ic d={IC.back} size={13} /> Back to countries
          </button>
        </div>
      </div>
    );
  }

  const BALKANS: CountryCode[] = ["RS", "BA", "ME", "AL", "MK"];
  const isBalkan = BALKANS.includes(country);

  const TABS: { id: TabId; label: string }[] = [
    { id: "rec",     label: t.tab_rec },
    { id: "all",     label: t.tab_all },
    { id: "travel",  label: t.tab_travel },
    { id: "setup",   label: t.tab_setup },
    ...(isBalkan ? [{ id: "roaming" as TabId, label: t.tab_roaming }] : []),
  ];

  // Build alt list without duplicating best
  const shownIds = new Set([rec.best.plan.id]);
  function pickAlt(s: Scored | null): Scored | null {
    if (!s || shownIds.has(s.plan.id)) return null;
    shownIds.add(s.plan.id);
    return s;
  }
  const alts: { s: Scored; tag: string }[] = [
    { s: pickAlt(rec.cheapest)!,    tag: t.cheapest },
    { s: pickAlt(rec.easiest)!,     tag: t.best_instant },
    { s: pickAlt(rec.bestEsim)!,    tag: "Best eSIM" },
    { s: pickAlt(rec.bestUnlim)!,   tag: t.best_unlimited },
    { s: pickAlt(rec.bestLong)!,    tag: t.best_long_stay },
    { s: pickAlt(rec.bestRoaming)!, tag: "Best roaming" },
  ].filter((x): x is { s: Scored; tag: string } => !!x.s);

  return (
    <div className="results-wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
        <button className="btn-ghost" onClick={onBack}><Ic d={IC.back} size={13} /> {t.back}</button>
      </div>

      <div className="chip-row">
        <span className="chip">{ctx.flag} {lang === "ru" ? ctx.name_ru : ctx.name}</span>
        <span className="chip">{days} {lang === "ru" ? "Р Т‘Р Р…." : "days"}</span>
        {[...prefs].map(p => <span key={p} className="chip">{p}</span>)}
      </div>

      <div className="reality-block">
        <div className="reality-title"><Ic d={IC.star} size={10} /> {t.reality_check}</div>
        <div className="reality-text">{lang === "ru" ? ctx.reality_check_ru : ctx.reality_check}</div>
        {(ctx as any).cross_border_note && (
          <div style={{ fontSize: 11, color: "#92400e", marginTop: 6, paddingTop: 6, borderTop: "1px solid #fde68a", lineHeight: 1.5 }}>
            СЂСџвЂ”С” {lang === "ru" ? (ctx as any).cross_border_note_ru : (ctx as any).cross_border_note}
          </div>
        )}
      </div>

      {ctx.weak_english && (
        <Alrt type="purple">
          <Ic d={IC.language} size={13} /> All {ctx.name} operator websites are in Montenegrin РІР‚вЂќ use Google Translate.
        </Alrt>
      )}
      {country === "DE" && (
        <Alrt type="info">Germany: identity verification required for all SIMs РІР‚вЂќ fully online, hotel address accepted. Activation typically same day. Telekom requires a German address.</Alrt>
      )}
      {country === "AL" && (
        <Alrt type="info"><Ic d={IC.plane} size={13} /> Airport purchase at TIA is most reliable РІР‚вЂќ remote online purchase often fails.</Alrt>
      )}

      <div className="tab-bar" style={{ marginTop: "1rem" }}>
        {TABS.map(({ id, label }) => (
          <button key={id} className={`tab-btn${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div style={{ paddingTop: "1.25rem" }}>

        {/* РІвЂќР‚РІвЂќР‚ Recommendation tab РІвЂќР‚РІвЂќР‚ */}
        {tab === "rec" && (
          <>
            <div className="top-label">
              {t.best_overall} РІР‚вЂќ {days} {lang === "ru" ? "Р Т‘Р Р…." : "days"} in {lang === "ru" ? ctx.name_ru : ctx.name}
            </div>
            <TopCard s={rec.best} tag={t.best_overall} featured lang={lang} country={country} days={days} onOpen={() => onModal(rec.best.plan)} />

            <div className="optimizer-block">
              <div className="optimizer-title"><Ic d={IC.bulb} size={11} /> {t.duration_opt}</div>
              <div className="optimizer-text">{rec.optimizerMsg}</div>
            </div>

            {/* vs Travel eSIM summary */}
            {rec.travelCmp && (
              <div className={`card${rec.travelCmp.travelWins ? " card-amber" : rec.travelCmp.verdict === "depends" ? "" : " card-green"}`} style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4, display: "flex", alignItems: "center", gap: 5, color: rec.travelCmp.travelWins ? "#92400e" : rec.travelCmp.verdict === "depends" ? "#4b5563" : "#15803d" }}>
                  <Ic d={IC.compare} size={12} color={rec.travelCmp.travelWins ? "#92400e" : rec.travelCmp.verdict === "depends" ? "#4b5563" : "#15803d"} />
                  {rec.travelCmp.verdict === "travel_wins"   && "РІСљв‚¬ Travel eSIM recommended for this trip"}
                  {rec.travelCmp.verdict === "travel_better" && "РІСљв‚¬ Travel eSIM probably better here"}
                  {rec.travelCmp.verdict === "depends"       && "РІС™вЂ“ Depends on your priorities"}
                  {rec.travelCmp.verdict === "local_better"  && "СЂСџвЂњВ¶ Local SIM better value"}
                  {rec.travelCmp.verdict === "local_wins"    && "СЂСџвЂњВ¶ Local SIM clearly wins"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: rec.travelCmp.travelWins ? "#92400e" : rec.travelCmp.verdict === "depends" ? "#374151" : "#15803d" }}>
                  {lang === "ru" ? rec.travelCmp.verdictReasonRu : rec.travelCmp.verdictReason}
                </div>
                {rec.travelCmp.whyFactors.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                    {rec.travelCmp.whyFactors.slice(0, 3).map((f, i) => (
                      <span key={i} className={`badge ${f.side === "travel" ? "badge-travel" : "badge-ok"}`}>
                        {lang === "ru" ? f.labelRu : f.label}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: rec.travelCmp.travelWins ? "#92400e" : "#4b5563", marginTop: 8 }}>
                  vs {rec.travelCmp.snap.provider_name} at РІвЂљВ¬{getPriceEur(rec.travelCmp.snap).toFixed(2)} РІР‚вЂќ see "{t.tab_travel}" tab for full comparison
                </div>
              </div>
            )}

            {/* Balkans arbitrage РІР‚вЂќ cross-border SIM suggestion */}
            {rec.balkansArbitrageRec && (
              <div
                style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "0.875rem 1rem", marginTop: 10, cursor: "pointer" }}
                onClick={() => rec.balkansArbitrageRec && onModal(rec.balkansArbitrageRec.plan)}
              >
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#92400e", marginBottom: 4 }}>
                  СЂСџвЂ”С” {lang === "ru" ? "Р вЂР В°Р В»Р С”Р В°Р Р…РЎРѓР С”Р С‘Р в„– Р В°РЎР‚Р В±Р С‘РЎвЂљРЎР‚Р В°Р В¶" : "Balkans arbitrage"}
                </div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, marginBottom: 6 }}>
                  {lang === "ru" ? rec.balkansArbitrageRec.messageRu : rec.balkansArbitrageRec.message}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {lang === "ru" ? "Р СџР С•Р С”РЎР‚РЎвЂ№РЎвЂљР С‘Р Вµ WB РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В°: " : "WB roaming coverage: "}
                  {rec.balkansArbitrageRec.roamingCoverage} Р’В· РІвЂљВ¬{rec.balkansArbitrageRec.totalCost}
                </div>
                <div style={{ fontSize: 10, color: "#b45309", marginTop: 4 }}>
                  {lang === "ru" ? "Р СњР В°Р В¶Р СР С‘РЎвЂљР Вµ Р Т‘Р В»РЎРЏ Р Т‘Р ВµРЎвЂљР В°Р В»Р ВµР в„– РІвЂ вЂ™" : "Tap for plan details РІвЂ вЂ™"}
                </div>
              </div>
            )}

            {alts.length > 0 && (
              <>
                <div className="sec-title">{t.more_options}</div>
                {alts.map(({ s, tag }) => (
                  <AltCard key={s.plan.id} s={s} tag={tag} lang={lang} onOpen={() => onModal(s.plan)} />
                ))}
              </>
            )}

            {/* EU Nomad recommendation РІР‚вЂќ shown when relevant for multi-week EU travel */}
            {rec.euNomadRec?.isRelevant && (
              <EuNomadCard
                euNomadRec={rec.euNomadRec}
                lang={lang}
                days={days}
                onOpen={onModal}
              />
            )}
          </>
        )}

        {/* РІвЂќР‚РІвЂќР‚ All plans tab РІвЂќР‚РІвЂќР‚ */}
        {tab === "all" && (
          <AllPlansTab
            locals={rec.all}
            snaps={rec.snaps}
            days={days}
            lang={lang}
            country={country}
            onModal={onModal}
          />
        )}

        {tab === "travel"  && <TravelTab snaps={rec.snaps} travelCmp={rec.travelCmp} lang={lang} country={country} days={days} onOpen={onModal} />}
        {tab === "setup"   && <SetupTab all={rec.all} lang={lang} onOpen={onModal} />}
        {tab === "roaming" && isBalkan && <RoamingMatrix country={country} lang={lang} countries_data={COUNTRIES} />}
        {tab === "roaming" && !isBalkan && (
          <div>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 12, lineHeight: 1.65 }}>
              All German prepaid plans include full EU roaming at no extra charge. Data used while roaming in EU/EEA countries counts against your monthly allowance.
            </div>
            <Alrt type="info">EU roaming included on Vodafone CallYa and O2 Prepaid plans. Switzerland and some non-EU countries excluded.</Alrt>
            <Alrt type="info">Fair use: EU law limits roaming to your home allowance. Throttling may apply if you use the plan exclusively abroad for extended periods.</Alrt>
          </div>
        )}
      </div>
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Country detail page РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function CountryPage({ code, lang, onBack, onModal }: {
  code: CountryCode; lang: Lang; onBack: () => void; onModal: (p: Plan) => void;
}) {
  const t = T[lang];
  const ctx = COUNTRIES[code];
  const ops = ctx.ops.map(opId => ({ opId, ...OPERATORS[opId] }));
  const localPlans = PLANS.filter(p => p.country_code === code && isLocal(p));
  const insights = lang === "ru" ? ctx.insights_ru : ctx.insights;

  return (
    <div className="results-wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
        <button className="btn-ghost" onClick={onBack}><Ic d={IC.back} size={13} /> {t.back}</button>
      </div>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>{ctx.flag} {lang === "ru" ? ctx.name_ru : ctx.name}</div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
          {lang === "ru" ? ctx.headline_ru : ctx.headline}
        </div>
        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>
          {lang === "ru" ? ctx.summary_ru : ctx.summary}
        </div>
        <div className="score-row" style={{ marginTop: 12 }}>
          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 90 }}>{t.tourist_ease}</span>
          <div className="score-track"><div className="score-fill" style={{ width: `${ctx.tourist_ease * 10}%`, background: "#15803d" }} /></div>
          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 32 }}>{ctx.tourist_ease}/10</span>
        </div>
        <div className="score-row" style={{ marginTop: 5 }}>
          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 90 }}>{t.esim_quality}</span>
          <div className="score-track"><div className="score-fill" style={{ width: `${ctx.esim_quality * 10}%`, background: "#2563eb" }} /></div>
          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 32 }}>{ctx.esim_quality}/10</span>
        </div>
      </div>

      <div className="reality-block">
        <div className="reality-title"><Ic d={IC.star} size={10} /> {t.reality_check}</div>
        <div className="reality-text">{lang === "ru" ? ctx.reality_check_ru : ctx.reality_check}</div>
      </div>

      {ctx.weak_english && (
        <Alrt type="purple"><Ic d={IC.language} size={13} /> Websites in Montenegrin only РІР‚вЂќ use Google Translate.</Alrt>
      )}

      <div className="insight-grid" style={{ marginTop: "1rem" }}>
        {Object.entries(insights).map(([k, v]) => (
          <div key={k} className="insight-card">
            <div className="insight-label">{k}</div>
            <div className="insight-val">{v}</div>
          </div>
        ))}
      </div>

      <div className="sec-title">{t.operators}</div>
      {ops.map(op => (
        <div key={op.opId} className="op-card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{op.name}</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
            {op.network}
            {op.tourist_score ? ` Р’В· Tourist score ${op.tourist_score}/10` : ""}
            {(op as any).research_status === "seed" && (
              <span style={{ marginLeft: 6, color: "#b45309" }}>Р’В· {lang === "ru" ? "Р С•Р В¶Р С‘Р Т‘Р В°Р ВµРЎвЂљ Р Р†Р ВµРЎР‚Р С‘РЎвЂћР С‘Р С”Р В°РЎвЂ Р С‘Р С‘" : "pending verification"}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.55, marginBottom: 8 }}>{op.notes}</div>
          <div className="badge-row" style={{ marginBottom: 6 }}>
            <span className={`badge ${op.esim ? "badge-info" : "badge-muted"}`}>{op.esim ? "eSIM" : "Physical SIM only"}</span>
          </div>
          {(op.url || (op as any).source_url) ? (
            <a className="btn-source" href={(op as any).source_url || op.url} target="_blank" rel="noopener noreferrer">
              <Ic d={IC.link} size={11} /> {lang === "ru" ? "Р РЋР В°Р в„–РЎвЂљ Р С•Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚Р В°" : "Official website"}
            </a>
          ) : (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{lang === "ru" ? "Р ВРЎРѓРЎвЂљР С•РЎвЂЎР Р…Р С‘Р С” Р С•Р В¶Р С‘Р Т‘Р В°Р ВµРЎвЂљ Р Р†Р ВµРЎР‚Р С‘РЎвЂћР С‘Р С”Р В°РЎвЂ Р С‘Р С‘" : "Source pending verification"}</span>
          )}
        </div>
      ))}

      <div className="sec-title">{t.all_local_plans}</div>
      {localPlans.length > 0 ? (
        localPlans.map(p => {
          const op = OPERATORS[p.operator_id];
          const dataStr = p.unlimited_data ? "РІв‚¬С›"
            : (p.data_gb_total_display || (p.data_gb_core !== undefined ? `${p.data_gb_core} GB` : (p.data_gb ? `${p.data_gb} GB` : "?")));
          return (
            <div key={p.id} className="alt-card" onClick={() => onModal(p)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", margin: "1px 0 6px" }}>{op?.name || p.provider_name} Р’В· {p.duration_days}d</div>
                <div className="badge-row" style={{ marginBottom: 0 }}>
                  {mkBadges(p).map((b, i) => <span key={i} className={`badge ${b.c}`}>{b.t}</span>)}
                </div>
                {hasAppData(p) && (
                  <div style={{ fontSize: 10, color: "#b45309", marginTop: 3 }}>
                    РІС™В  {p.data_gb_core} GB general + {p.data_gb_apps} GB app-specific
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>РІвЂљВ¬{getPriceEur(p)}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{p.duration_days}d Р’В· {dataStr}</div>
              </div>
            </div>
          );
        })
      ) : (
        /* Empty state for seed countries РІР‚вЂќ show as research status, not failure */
        <div style={{ background: "#f9fafb", border: "1px solid #e8eaef", borderRadius: 10, padding: "1.25rem", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            {lang === "ru"
              ? "Р СћР В°РЎР‚Р С‘РЎвЂћРЎвЂ№ Р С•Р В¶Р С‘Р Т‘Р В°РЎР‹РЎвЂљ Р Р†Р ВµРЎР‚Р С‘РЎвЂћР С‘Р С”Р В°РЎвЂ Р С‘Р С‘"
              : "Verified plans pending"}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.65, marginBottom: 10 }}>
            {lang === "ru"
              ? `Р С›Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚РЎвЂ№ ${lang === "ru" ? ctx.name_ru : ctx.name} Р Т‘Р С•Р В±Р В°Р Р†Р В»Р ВµР Р…РЎвЂ№ Р С”Р В°Р С” Р С”Р В°Р Р…Р Т‘Р С‘Р Т‘Р В°РЎвЂљРЎвЂ№. Р вЂ™Р ВµРЎР‚Р С‘РЎвЂћР С‘РЎвЂ Р С‘РЎР‚Р С•Р Р†Р В°Р Р…Р Р…РЎвЂ№Р Вµ РЎвЂљР В°РЎР‚Р С‘РЎвЂћР Р…РЎвЂ№Р Вµ Р Т‘Р В°Р Р…Р Р…РЎвЂ№Р Вµ Р С—Р С•РЎРЏР Р†РЎРЏРЎвЂљРЎРѓРЎРЏ Р С—Р С•РЎРѓР В»Р Вµ РЎР‚РЎС“РЎвЂЎР Р…Р С•Р в„– Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р С‘.`
              : `Operator candidates for ${ctx.name} have been added. Verified tariff data will appear once manually confirmed from official sources.`}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {lang === "ru" ? "Р РЋРЎвЂљР В°РЎвЂљРЎС“РЎРѓ: " : "Research status: "}
            <span style={{ fontWeight: 600, color: "#b45309" }}>
              {ctx.research_status === "seed" ? (lang === "ru" ? "Р СњР В°РЎвЂЎР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– РЎРЊРЎвЂљР В°Р С—" : "Seed РІР‚вЂќ operators listed") :
               ctx.research_status === "needs_verification" ? (lang === "ru" ? "Р СћРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљ Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р С‘" : "Needs verification") :
               (lang === "ru" ? "Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚Р ВµР Р…Р С•" : "Verified")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Homepage country picker РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
// Used only on the homepage. Shows Popular by default, with Balkans/EU/All tabs.
// Selected country is passed to parent; "Browse all" navigates to CountriesPage.

type HomeTab = "popular" | "balkans" | "eu" | "all";

const HOME_TABS: { id: HomeTab; en: string; ru: string }[] = [
  { id: "popular", en: "Popular",  ru: "Р СџР С•Р С—РЎС“Р В»РЎРЏРЎР‚Р Р…РЎвЂ№Р Вµ" },
  { id: "balkans", en: "Balkans",  ru: "Р вЂР В°Р В»Р С”Р В°Р Р…РЎвЂ№"     },
  { id: "eu",      en: "EU",       ru: "Р вЂўР РЋ"          },
  { id: "all",     en: "All",      ru: "Р вЂ™РЎРѓР Вµ"          },
];

const HOME_LABELS: Record<HomeTab, { en: string; ru: string }> = {
  popular: { en: "Popular destinations",  ru: "Р СџР С•Р С—РЎС“Р В»РЎРЏРЎР‚Р Р…РЎвЂ№Р Вµ Р Р…Р В°Р С—РЎР‚Р В°Р Р†Р В»Р ВµР Р…Р С‘РЎРЏ" },
  balkans: { en: "Western Balkans",        ru: "Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№Р Вµ Р вЂР В°Р В»Р С”Р В°Р Р…РЎвЂ№"       },
  eu:      { en: "EU countries",           ru: "Р РЋРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р вЂўР РЋ"              },
  all:     { en: "All countries",          ru: "Р вЂ™РЎРѓР Вµ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№"             },
};

// Derive a short badge for a country card
function countryBadge(c: CountryMeta, isRu: boolean): { text: string; cls: string } | null {
  if (c.research_status === "seed" || c.research_status === "needs_verification") {
    return { text: isRu ? "Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р В° РЎвЂљР В°РЎР‚Р С‘РЎвЂћР С•Р Р†" : "Research pending", cls: "hbadge-pending" };
  }
  if (c.eu_member && (c.tourist_ease ?? 0) >= 8) {
    return { text: isRu ? "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ" : "Best EU roaming", cls: "hbadge-eu" };
  }
  if (!c.eu_member && (c.tourist_ease ?? 0) >= 9) {
    return { text: isRu ? "Р вЂєРЎР‹Р В±Р С‘Р СРЎвЂ№Р в„– РЎвЂљРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР В°Р СР С‘" : "Tourist favorite", cls: "hbadge-fav" };
  }
  if (c.research_status === "verified" || c.research_status === "verified_official") {
    return { text: isRu ? "Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚Р ВµР Р…Р С•" : "Verified", cls: "hbadge-ok" };
  }
  return null;
}

function HomePicker({ lang, selected, onSelect, onConfirm, onBrowseAll }: {
  lang: Lang;
  selected: CountryCode | null;
  onSelect: (c: CountryCode) => void;
  onConfirm: (c: CountryCode) => void;
  onBrowseAll: () => void;
}) {
  const isRu = lang === "ru";
  const all = Object.entries(COUNTRIES) as [CountryCode, CountryMeta][];
  const [tab, setTab] = useState<HomeTab>("popular");
  const [showAll, setShowAll] = useState(false);
  const [pendingMsg, setPendingMsg] = useState<CountryCode | null>(null);

  function hasPlans(code: CountryCode): boolean {
    return PLANS.some(p => p.country_code === code && (isScorable(p) || isSnap(p)));
  }

  const tabCountries = useMemo((): [CountryCode, CountryMeta][] => {
    switch (tab) {
      case "popular": return all.filter(([code]) => POPULAR_CODES.has(code));
      case "balkans": return all.filter(([code]) => BALKANS_CODES.has(code));
      case "eu":      return all.filter(([, c]) => c.eu_member === true || c.region === "EU" || EU_MEMBER_CODES.has(c.code));
      case "all":     return all;
    }
  }, [tab, all]);

  const isPopular = tab === "popular";

  function Card([code, c]: [CountryCode, CountryMeta], large: boolean) {
    const isSel      = selected === code;
    const isSeed     = c.research_status === "seed" || c.research_status === "needs_verification" || !hasPlans(code);
    const showingMsg = pendingMsg === code;
    const badge      = countryBadge(c, isRu);
    const tagline    = isRu ? c.tagline_ru : c.tagline;

    function handleClick() {
      if (isSeed) {
        setPendingMsg(showingMsg ? null : code);
      } else {
        setPendingMsg(null);
        onSelect(code);
        onConfirm(code);
      }
    }

    return (
      <div key={code} className="hcard-wrap">
        <button
          className={`hcard${isSel ? " hcard-sel" : ""}${large ? " hcard-lg" : ""}${isSeed ? " hcard-seed" : ""}`}
          onClick={handleClick}
          aria-expanded={isSeed ? showingMsg : undefined}
        >
          {badge && <span className={`hbadge ${badge.cls}`}>{badge.text}</span>}
          <span className="hcard-flag">{c.flag}</span>
          <span className="hcard-name">{isRu ? c.name_ru : c.name}</span>
          {tagline && !isSeed && <span className="hcard-insight">{tagline}</span>}
        </button>

        {isSeed && showingMsg && (
          <div className="hcard-pending-msg">
            {isRu
              ? "Р СћР В°РЎР‚Р С‘РЎвЂћРЎвЂ№ Р Т‘Р В»РЎРЏ РЎРЊРЎвЂљР С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ РЎРѓР ВµР в„–РЎвЂЎР В°РЎРѓ Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚РЎРЏРЎР‹РЎвЂљРЎРѓРЎРЏ. Р РЋР С”Р С•РЎР‚Р С• Р Т‘Р С•Р В±Р В°Р Р†Р С‘Р С."
              : "Tariffs for this country are being researched. Check back soon."}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hpicker">
      <div className="hpicker-head">
        <span className="field-label">{isRu ? "Р С™РЎС“Р Т‘Р В° Р ВµР Т‘Р ВµРЎвЂљР Вµ?" : "Where are you going?"}</span>
        <div className="htabs">
          {HOME_TABS.map(t => (
            <button
              key={t.id}
              className={`htab${tab === t.id ? " active" : ""}`}
              onClick={() => { setTab(t.id); setShowAll(false); setPendingMsg(null); }}
            >
              {isRu ? t.ru : t.en}
            </button>
          ))}
        </div>
      </div>

      <div className="hpicker-label">
        {isRu ? HOME_LABELS[tab].ru : HOME_LABELS[tab].en}
      </div>

      <div className={`hgrid${isPopular ? " hgrid-pop" : ""}`}>
        {tabCountries.map(entry => Card(entry, isPopular))}
      </div>

      <button className="hbrowse-all" onClick={onBrowseAll}>
        <Ic d={IC.globe} size={12} />
        {isRu ? "Р вЂ™РЎРѓР Вµ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ РЎРѓ Р С—Р С•Р С‘РЎРѓР С”Р С•Р С РІвЂ вЂ™" : "Browse all countries РІвЂ вЂ™"}
      </button>
    </div>
  );
}

const POPULAR_CODES  = new Set(["RS","DE","PL","FR","ES","IT","ME","AL"]);
const BALKANS_CODES  = new Set(["RS","ME","AL","BA","MK","HR","SI","BG","GR","RO"]);
const EU_MEMBER_CODES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR",
  "DE","GR","HU","IE","IT","LV","LT","LU","MT","NL",
  "PL","PT","RO","SK","SI","ES","SE"
]);

function CountriesPage({ lang, onSelect }: { lang: Lang; onSelect: (c: CountryCode) => void }) {
  const t = T[lang];
  const isRu = lang === "ru";
  const all = Object.entries(COUNTRIES) as [CountryCode, CountryMeta][];

  const [filter, setFilter] = useState<RegionFilter>("popular");
  const [query,  setQuery]  = useState("");

  const filtered = useMemo((): [CountryCode, CountryMeta][] => {
    const base = (() => {
      switch (filter) {
        case "popular": return all.filter(([code]) => POPULAR_CODES.has(code));
        case "eu":      return all.filter(([, c]) => c.eu_member === true || c.region === "EU" || EU_MEMBER_CODES.has(c.code));
        case "balkans": return all.filter(([code]) => BALKANS_CODES.has(code));
        default:        return all;
      }
    })();
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return all.filter(([, c]) =>
      c.name.toLowerCase().includes(q) ||
      (c.name_ru?.toLowerCase().includes(q)) ||
      c.code.toLowerCase().includes(q)
    );
  }, [filter, query, all]);

  const FILTER_OPTS: { id: RegionFilter; en: string; ru: string }[] = [
    { id: "popular", en: "Popular",  ru: "Р СџР С•Р С—РЎС“Р В»РЎРЏРЎР‚Р Р…РЎвЂ№Р Вµ" },
    { id: "eu",      en: "EU",       ru: "Р вЂўР РЋ"         },
    { id: "balkans", en: "Balkans",  ru: "Р вЂР В°Р В»Р С”Р В°Р Р…РЎвЂ№"     },
    { id: "all",     en: "All",      ru: "Р вЂ™РЎРѓР Вµ"         },
  ];

  const SECTION_TITLE: Record<RegionFilter, { en: string; ru: string }> = {
    popular: { en: "Popular destinations",    ru: "Р СџР С•Р С—РЎС“Р В»РЎРЏРЎР‚Р Р…РЎвЂ№Р Вµ Р Р…Р В°Р С—РЎР‚Р В°Р Р†Р В»Р ВµР Р…Р С‘РЎРЏ" },
    eu:      { en: "EU countries",            ru: "Р РЋРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р вЂўР РЋ"              },
    balkans: { en: "Western Balkans",          ru: "Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№Р Вµ Р вЂР В°Р В»Р С”Р В°Р Р…РЎвЂ№"       },
    all:     { en: "All countries",            ru: "Р вЂ™РЎРѓР Вµ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№"             },
  };

  const sectionLabel = query
    ? (isRu
        ? `${filtered.length} ${filtered.length === 1 ? "РЎР‚Р ВµР В·РЎС“Р В»РЎРЉРЎвЂљР В°РЎвЂљ" : filtered.length < 5 ? "РЎР‚Р ВµР В·РЎС“Р В»РЎРЉРЎвЂљР В°РЎвЂљР В°" : "РЎР‚Р ВµР В·РЎС“Р В»РЎРЉРЎвЂљР В°РЎвЂљР С•Р Р†"}`
        : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`)
    : isRu ? SECTION_TITLE[filter].ru : SECTION_TITLE[filter].en;

  function CountryTile([code, c]: [CountryCode, CountryMeta]) {
    const isSeed = c.research_status === "seed" || c.research_status === "needs_verification";
    const tagline = isRu ? c.tagline_ru : c.tagline;
    return (
      <button key={code} className="ctile" onClick={() => onSelect(code)}>
        <span className="ctile-flag">{c.flag}</span>
        <span className="ctile-name">{isRu ? c.name_ru : c.name}</span>
        {!isSeed && tagline && (
          <span className="ctile-tag">{tagline}</span>
        )}
        {!isSeed && (
          <span className="ctile-scores">
            <span className="ctile-score-bar" style={{ "--pct": `${c.tourist_ease * 10}%`, "--col": "#15803d" } as React.CSSProperties} title={`Tourist ease: ${c.tourist_ease}/10`} />
            <span className="ctile-score-bar" style={{ "--pct": `${c.esim_quality * 10}%`,  "--col": "#2563eb" } as React.CSSProperties} title={`eSIM: ${c.esim_quality}/10`}    />
          </span>
        )}
        {isSeed && (
          <span className="ctile-pending">
            {isRu ? "Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р В° РЎвЂљР В°РЎР‚Р С‘РЎвЂћР С•Р Р†" : "Research pending"}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="cpanel">
      {/* РІвЂќР‚РІвЂќР‚ Header РІвЂќР‚РІвЂќР‚ */}
      <div className="cpanel-head">
        <h2 className="cpanel-title">{t.countries}</h2>

        {/* Search */}
        <div className="csearch">
          <svg className="csearch-icon" width={14} height={14} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="csearch-input"
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); }}
            placeholder={isRu ? "Р СџР С•Р С‘РЎРѓР С” РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№РІР‚В¦" : "Search countryРІР‚В¦"}
            aria-label={isRu ? "Р СџР С•Р С‘РЎРѓР С” РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№" : "Search country"}
          />
          {query && (
            <button className="csearch-clear" onClick={() => setQuery("")} aria-label="Clear search">РІСљвЂў</button>
          )}
        </div>

        {/* Filter chips РІР‚вЂќ hidden while searching so results are always "all" */}
        {!query && (
          <div className="cfilters">
            {FILTER_OPTS.map(o => (
              <button
                key={o.id}
                className={`cfilter${filter === o.id ? " active" : ""}`}
                onClick={() => setFilter(o.id)}
              >
                {isRu ? o.ru : o.en}
              </button>
            ))}
          </div>
        )}

        {/* Section label */}
        <div className="csection-label">{sectionLabel}</div>
      </div>

      {/* РІвЂќР‚РІвЂќР‚ Grid РІвЂќР‚РІвЂќР‚ */}
      {filtered.length > 0 ? (
        <div className="cgrid">
          {filtered.map(CountryTile)}
        </div>
      ) : (
        <div className="cno-results">
          {isRu ? "Р РЋРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р Р…Р Вµ Р Р…Р В°Р в„–Р Т‘Р ВµР Р…РЎвЂ№" : "No countries found"}
        </div>
      )}
    </div>
  );
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Trip Simulator РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
// Evaluates three strategies for multi-country trips using existing plan data.
// Does NOT invent facts РІР‚вЂќ all costs and caveats come from real plans.json data.

type SimUsage = "light" | "medium" | "heavy";

interface SimInputs {
  countries: CountryCode[];
  days: number;
  usage: SimUsage;
  needsHotspot: boolean;
  eSIMOnly: boolean;
  needsNumber: boolean;
}

type SimStrategyId = "local" | "travel" | "nomad";

interface SimStrategy {
  id: SimStrategyId;
  label: string;
  labelRu: string;
  totalCost: number;
  costNote: string;      // e.g. "2Р“вЂ” purchases" or "1 plan covers all"
  costNoteRu: string;
  score: number;         // 0РІР‚вЂњ100 internal score for ranking
  isRecommended: boolean;
  why: string;
  whyRu: string;
  tradeoffs: string;
  tradeoffsRu: string;
  setupComplexity: "easy" | "moderate" | "complex";
  roamingNote: string;
  roamingNoteRu: string;
  applicable: boolean;   // false when this strategy doesn't make sense for the route
  inapplicableReason?: string;
  inapplicableReasonRu?: string;
}

// Map usage level to minimum GB/day requirement
function usageToMinGbPerDay(usage: SimUsage): number {
  if (usage === "light")  return 0.3;
  if (usage === "heavy")  return 3.0;
  return 1.0; // medium
}

// Build prefs set from simulator inputs РІР‚вЂќ reuses existing scoring boosts
function simToPrefs(inputs: SimInputs): Set<PrefId> {
  const p = new Set<PrefId>();
  if (inputs.usage === "light")   p.add("cheapest");
  if (inputs.eSIMOnly)            p.add("esim");
  if (inputs.needsNumber)         p.add("tourist");
  if (inputs.days >= 30)          p.add("longterm");
  if (inputs.needsHotspot)        p.add("cheapest"); // hotspot users care about total GB
  return p;
}

// Find cheapest adequate local plan for a country given trip days and usage
function bestLocalForCountry(country: CountryCode, daysInCountry: number, inputs: SimInputs): {
  plan: Plan | null;
  cost: number;
  purchases: number;
  notes: string[];
  storeRequired: boolean;
  esimOk: boolean;
} {
  const locals = PLANS.filter(p => p.country_code === country && isLocal(p));
  if (!locals.length) return { plan: null, cost: 0, purchases: 0, notes: [`No data for ${country}`], storeRequired: false, esimOk: false };

  const prefs = simToPrefs(inputs);
  const minGbTotal = Math.max(usageToMinGbPerDay(inputs.usage) * daysInCountry, 2);

  const scored = locals
    .map(p => scorePlan(p, daysInCountry, prefs))
    .filter(s => {
      if (inputs.eSIMOnly && s.plan.esim_supported !== true) return false;
      // Adequate data check
      if (!s.plan.unlimited_data) {
        const core = s.total_data_core ?? 0;
        if (core < minGbTotal) return false;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);

  // Fallback without eSIM filter if nothing found
  const fallback = !scored.length ? locals
    .map(p => scorePlan(p, daysInCountry, prefs))
    .sort((a, b) => b.score - a.score) : scored;

  if (!fallback.length) return { plan: null, cost: 0, purchases: 0, notes: [], storeRequired: false, esimOk: false };

  const best = fallback[0];
  const notes: string[] = [];
  if (hasAppData(best.plan)) notes.push(`${best.plan.data_gb_core} GB general data`);
  if (best.plan.store_visit_required) notes.push("Requires store or airport visit");
  if (best.plan.esim_supported === "unknown") notes.push("eSIM availability unconfirmed");

  return {
    plan: best.plan,
    cost: best.total_cost,
    purchases: best.purchases,
    notes,
    storeRequired: !!best.plan.store_visit_required,
    esimOk: best.plan.esim_supported === true,
  };
}

// Find cheapest travel eSIM covering a country
function bestSnapForCountry(country: CountryCode): { plan: Plan | null; cost: number } {
  const snaps = PLANS.filter(p => p.country_code === country && isSnap(p));
  if (!snaps.length) return { plan: null, cost: 0 };
  const best = [...snaps].sort((a, b) => getPriceEur(a) - getPriceEur(b))[0];
  return { plan: best, cost: getPriceEur(best) };
}

const BALKANS: CountryCode[] = ["RS", "BA", "ME", "AL", "MK"];

// Full list of EU member states that participate in EU data roaming regulation.
// This is the ground truth for "will an EU SIM roam here for free?".
// Non-EU countries (CH, UK, RS, ME, AL, BA, MK, NO, IS) are excluded.
const EU_ROAMING_ZONE: CountryCode[] = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI",
  "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];

// Keep EU_COUNTRIES as alias for backwards compat in single-country rec tab
const EU_COUNTRIES = EU_ROAMING_ZONE;

// WB countries where regional roaming bundles exist (One ME, m:tel, BH Telecom etc.)
// These operators can cover multiple WB countries in one plan.
const WB_ROAMING_CAPABLE: CountryCode[] = ["RS", "ME", "BA", "MK"]; // AL excluded РІР‚вЂќ no confirmed WB roaming
const WB_ALL: CountryCode[] = ["RS", "BA", "ME", "AL", "MK"];

// Route types РІР‚вЂќ determined before scoring
type RouteType = "single" | "pure_eu" | "pure_balkans" | "mixed_eu_balkans" | "mixed_complex";

function classifyRoute(countries: CountryCode[]): RouteType {
  if (countries.length <= 1) return "single";
  const allEU      = countries.every(c => EU_ROAMING_ZONE.includes(c));
  const allBalkan  = countries.every(c => WB_ALL.includes(c));
  const hasEU      = countries.some(c => EU_ROAMING_ZONE.includes(c));
  const hasBalkan  = countries.some(c => WB_ALL.includes(c));
  if (allEU)     return "pure_eu";
  if (allBalkan) return "pure_balkans";
  if (hasEU && hasBalkan) return "mixed_eu_balkans";
  return "mixed_complex";
}

function useTripSim(inputs: SimInputs): SimStrategy[] {
  return useMemo(() => {
    const { countries, days } = inputs;
    if (!countries.length || days <= 0) return [];

    const daysPerCountry = Math.round(days / countries.length);
    const routeType  = classifyRoute(countries);
    const allBalkan  = routeType === "pure_balkans";
    const allEU      = routeType === "pure_eu";
    const mixedEuBalkans = routeType === "mixed_eu_balkans";
    const isSingle   = routeType === "single";
    const multiCountry = countries.length > 1;

    // Derived flags used across strategies
    const hasWbRoamingCapable = countries.some(c => WB_ROAMING_CAPABLE.includes(c));
    const wbCoveredCount      = countries.filter(c => WB_ROAMING_CAPABLE.includes(c)).length;
    const hasStore = countries.some(c => {
      const r = bestLocalForCountry(c, daysPerCountry, inputs);
      return r.storeRequired;
    });

    // РІвЂќР‚РІвЂќР‚ Strategy A: Local SIM per country РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
    const localResults = countries.map(c => ({
      country: c,
      ...bestLocalForCountry(c, daysPerCountry, inputs),
    }));
    const localTotalCost       = parseFloat(localResults.reduce((sum, r) => sum + r.cost, 0).toFixed(2));
    const localMissingCountries = localResults.filter(r => !r.plan).map(r => r.country);
    const localStoreRequired    = localResults.some(r => r.storeRequired);
    const localAllESIM          = localResults.every(r => r.esimOk);
    const localHasAppData       = localResults.some(r => r.plan && hasAppData(r.plan));

    let localScore = 50;
    localScore -= localTotalCost * (days <= 7 ? 0.15 : days <= 14 ? 0.25 : 0.35);
    if (multiCountry) localScore -= 10;
    if (localStoreRequired) localScore -= 15;
    if (localAllESIM) localScore += 15;
    if (inputs.usage === "heavy") localScore += 10;
    if (inputs.needsNumber) localScore += 15;
    if (days >= 21) localScore += 10;
    if (inputs.needsHotspot) localScore += 8;

    // РІвЂќР‚РІвЂќР‚ Route-type gates on local score РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
    // pure_eu: separate local SIMs per country is WRONG РІР‚вЂќ EU roaming removes the
    // need for this. Apply a hard penalty so it can never beat EU alternatives.
    if (routeType === "pure_eu" && multiCountry) {
      localScore -= 35;  // hard gate: local-per-country should not win EU multi-country
    }
    // pure_balkans: local still valid, but if WB roaming covers most countries
    // it gets a smaller penalty (fewer separate SIMs needed in practice).
    if (routeType === "pure_balkans" && multiCountry && hasWbRoamingCapable) {
      localScore += 8;   // slight boost: Balkans local SIMs often have WB roaming built in
    }

    const localWhy = routeType === "pure_eu" && multiCountry
      ? [
          "Local SIMs per country not recommended for EU routes",
          "An EU SIM with roaming is more practical than buying separately in each country",
          ...(localAllESIM ? ["All plans support eSIM РІР‚вЂќ no physical SIM needed"] : []),
        ]
      : routeType === "pure_balkans" && hasWbRoamingCapable
        ? [
            `Local Balkans SIM with regional roaming РІР‚вЂќ ${localResults.filter(r=>r.plan).length}/${countries.length} countries covered`,
            ...(inputs.needsNumber ? ["Includes real local phone number"] : []),
          ]
        : [
            ...(multiCountry ? [`Separate SIM for each country РІР‚вЂќ ${localResults.filter(r=>r.plan).length}/${countries.length} countries covered`] : ["Single country РІР‚вЂќ straightforward local SIM"]),
            ...(inputs.needsNumber ? ["Includes real local phone number"] : []),
            ...(inputs.usage === "heavy" ? ["Best value for heavy data users"] : []),
            ...(localAllESIM ? ["All eSIM РІР‚вЂќ no physical SIM needed"] : []),
          ];

    const localWhyRu = routeType === "pure_eu" && multiCountry
      ? [
          "Р СљР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р Вµ SIM Р Р† Р С”Р В°Р В¶Р Т‘Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Вµ Р Р…Р Вµ РЎР‚Р ВµР С”Р С•Р СР ВµР Р…Р Т‘РЎС“РЎР‹РЎвЂљРЎРѓРЎРЏ Р Т‘Р В»РЎРЏ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР С•Р Р† Р С—Р С• Р вЂўР РЋ",
          "SIM РЎРѓ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р С•Р С Р вЂўР РЋ Р С—РЎР‚Р В°Р С”РЎвЂљР С‘РЎвЂЎР Р…Р ВµР Вµ, РЎвЂЎР ВµР С Р С•РЎвЂљР Т‘Р ВµР В»РЎРЉР Р…Р В°РЎРЏ Р С—Р С•Р С”РЎС“Р С—Р С”Р В° Р Р† Р С”Р В°Р В¶Р Т‘Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Вµ",
        ]
      : routeType === "pure_balkans" && hasWbRoamingCapable
        ? [
            `Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ Р В±Р В°Р В»Р С”Р В°Р Р…РЎРѓР С”Р В°РЎРЏ SIM РЎРѓ РЎР‚Р ВµР С–Р С‘Р С•Р Р…Р В°Р В»РЎРЉР Р…РЎвЂ№Р С РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р С•Р С РІР‚вЂќ ${localResults.filter(r=>r.plan).length}/${countries.length} РЎРѓРЎвЂљРЎР‚Р В°Р Р…`,
            ...(inputs.needsNumber ? ["Р вЂ™Р С”Р В»РЎР‹РЎвЂЎР В°Р ВµРЎвЂљ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚"] : []),
          ]
        : [
            ...(multiCountry ? [`Р С›РЎвЂљР Т‘Р ВµР В»РЎРЉР Р…Р В°РЎРЏ SIM Р Р† Р С”Р В°Р В¶Р Т‘Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Вµ РІР‚вЂќ ${localResults.filter(r=>r.plan).length}/${countries.length} РЎРѓРЎвЂљРЎР‚Р В°Р Р… Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р Р…РЎвЂ№`] : ["Р С›Р Т‘Р Р…Р В° РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р В° РІР‚вЂќ Р С—РЎР‚Р С•РЎРѓРЎвЂљР С•Р в„– Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– РЎвЂљР В°РЎР‚Р С‘РЎвЂћ"]),
            ...(inputs.needsNumber ? ["Р вЂ™Р С”Р В»РЎР‹РЎвЂЎР В°Р ВµРЎвЂљ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚"] : []),
            ...(inputs.usage === "heavy" ? ["Р вЂєРЎС“РЎвЂЎРЎв‚¬Р В°РЎРЏ РЎвЂ Р ВµР Р…Р Р…Р С•РЎРѓРЎвЂљРЎРЉ Р Т‘Р В»РЎРЏ Р В°Р С”РЎвЂљР С‘Р Р†Р Р…РЎвЂ№РЎвЂ¦ Р С—Р С•Р В»РЎРЉР В·Р С•Р Р†Р В°РЎвЂљР ВµР В»Р ВµР в„–"] : []),
            ...(localAllESIM ? ["Р вЂ™РЎРѓР Вµ eSIM РІР‚вЂќ РЎвЂћР С‘Р В·Р С‘РЎвЂЎР ВµРЎРѓР С”Р В°РЎРЏ SIM Р Р…Р Вµ Р Р…РЎС“Р В¶Р Р…Р В°"] : []),
          ];

    const localTradeoffs = [
      ...(multiCountry && routeType !== "pure_balkans" ? ["Multiple activations required РІР‚вЂќ one per country"] : []),
      ...(multiCountry && routeType === "pure_eu" ? ["Unnecessary for EU routes РІР‚вЂќ EU roaming eliminates the need for multiple SIMs"] : []),
      ...(localStoreRequired ? ["One or more countries require store/airport visit"] : []),
      ...(localHasAppData ? ["Some plans include app-specific data that doesn't count as general internet"] : []),
    ].join(". ") || "No significant tradeoffs";

    const localTradeoffsRu = [
      ...(multiCountry && routeType !== "pure_balkans" ? ["Р СњРЎС“Р В¶Р Р…Р В° Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ Р Р† Р С”Р В°Р В¶Р Т‘Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Вµ"] : []),
      ...(multiCountry && routeType === "pure_eu" ? ["Р вЂќР В»РЎРЏ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР С•Р Р† Р С—Р С• Р вЂўР РЋ РЎРЊРЎвЂљР С• Р С‘Р В·Р В»Р С‘РЎв‚¬Р Р…Р Вµ РІР‚вЂќ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ Р Р†РЎРѓР Вµ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№"] : []),
      ...(localStoreRequired ? ["Р вЂ™ Р С•Р Т‘Р Р…Р С•Р в„– Р С‘Р В»Р С‘ Р Р…Р ВµРЎРѓР С”Р С•Р В»РЎРЉР С”Р С‘РЎвЂ¦ РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р В°РЎвЂ¦ Р Р…РЎС“Р В¶Р ВµР Р… Р Р†Р С‘Р В·Р С‘РЎвЂљ Р Р† Р СР В°Р С–Р В°Р В·Р С‘Р Р… Р С‘Р В»Р С‘ Р В°РЎРЊРЎР‚Р С•Р С—Р С•РЎР‚РЎвЂљ"] : []),
      ...(localHasAppData ? ["Р СњР ВµР С”Р С•РЎвЂљР С•РЎР‚РЎвЂ№Р Вµ РЎвЂљР В°РЎР‚Р С‘РЎвЂћРЎвЂ№ Р Р†Р С”Р В»РЎР‹РЎвЂЎР В°РЎР‹РЎвЂљ РЎвЂљРЎР‚Р В°РЎвЂћР С‘Р С” РЎвЂљР С•Р В»РЎРЉР С”Р С• Р Т‘Р В»РЎРЏ Р С—РЎР‚Р С‘Р В»Р С•Р В¶Р ВµР Р…Р С‘Р в„–"] : []),
    ].join(". ") || "Р вЂР ВµР В· РЎРѓРЎС“РЎвЂ°Р ВµРЎРѓРЎвЂљР Р†Р ВµР Р…Р Р…РЎвЂ№РЎвЂ¦ Р С”Р С•Р СР С—РЎР‚Р С•Р СР С‘РЎРѓРЎРѓР С•Р Р†";

    const localRoamingNote = routeType === "pure_eu" && multiCountry
      ? "EU roaming means a single EU SIM could cover all countries on this route"
      : routeType === "pure_balkans" && hasWbRoamingCapable
        ? "Western Balkans regional roaming available РІР‚вЂќ some operators cover multiple countries in one plan"
        : multiCountry
          ? "No cross-border roaming РІР‚вЂќ need separate SIM per country"
          : "Local coverage only";

    const localRoamingNoteRu = routeType === "pure_eu" && multiCountry
      ? "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ Р С—Р С•Р В·Р Р†Р С•Р В»РЎРЏР ВµРЎвЂљ Р С‘РЎРѓР С—Р С•Р В»РЎРЉР В·Р С•Р Р†Р В°РЎвЂљРЎРЉ Р С•Р Т‘Р Р…РЎС“ SIM Р Р†Р С• Р Р†РЎРѓР ВµРЎвЂ¦ РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р В°РЎвЂ¦ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°"
      : routeType === "pure_balkans" && hasWbRoamingCapable
        ? "Р вЂќР С•РЎРѓРЎвЂљРЎС“Р С—Р ВµР Р… РЎР‚Р ВµР С–Р С‘Р С•Р Р…Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№РЎвЂ¦ Р вЂР В°Р В»Р С”Р В°Р Р… РІР‚вЂќ Р Р…Р ВµР С”Р С•РЎвЂљР С•РЎР‚РЎвЂ№Р Вµ Р С•Р С—Р ВµРЎР‚Р В°РЎвЂљР С•РЎР‚РЎвЂ№ Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°РЎР‹РЎвЂљ Р Р…Р ВµРЎРѓР С”Р С•Р В»РЎРЉР С”Р С• РЎРѓРЎвЂљРЎР‚Р В°Р Р…"
        : multiCountry
          ? "Р СњР ВµРЎвЂљ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° РІР‚вЂќ Р С•РЎвЂљР Т‘Р ВµР В»РЎРЉР Р…Р В°РЎРЏ SIM Р Р† Р С”Р В°Р В¶Р Т‘Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Вµ"
          : "Р СћР С•Р В»РЎРЉР С”Р С• Р СР ВµРЎРѓРЎвЂљР Р…Р С•Р Вµ Р С—Р С•Р С”РЎР‚РЎвЂ№РЎвЂљР С‘Р Вµ";

    const localStrategy: SimStrategy = {
      id: "local",
      label: routeType === "pure_balkans" && hasWbRoamingCapable
        ? "Balkans local SIM with regional roaming"
        : "Local SIM per country",
      labelRu: routeType === "pure_balkans" && hasWbRoamingCapable
        ? "Р вЂР В°Р В»Р С”Р В°Р Р…РЎРѓР С”Р В°РЎРЏ SIM РЎРѓ РЎР‚Р ВµР С–Р С‘Р С•Р Р…Р В°Р В»РЎРЉР Р…РЎвЂ№Р С РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р С•Р С"
        : "Р СљР ВµРЎРѓРЎвЂљР Р…Р В°РЎРЏ SIM Р Р† Р С”Р В°Р В¶Р Т‘Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Вµ",
      totalCost: localTotalCost,
      costNote: multiCountry ? `${countries.length} plans` : "1 plan",
      costNoteRu: multiCountry ? `${countries.length} РЎвЂљР В°РЎР‚Р С‘РЎвЂћР В°` : "1 РЎвЂљР В°РЎР‚Р С‘РЎвЂћ",
      score: Math.round(localScore),
      isRecommended: false,
      why: localWhy.join(". ") || "Best for single-country or long-stay trips.",
      whyRu: localWhyRu.join(". ") || "Р вЂєРЎС“РЎвЂЎРЎв‚¬Р С‘Р в„– Р Р†Р В°РЎР‚Р С‘Р В°Р Р…РЎвЂљ Р Т‘Р В»РЎРЏ Р С—Р С•Р ВµР В·Р Т‘Р С”Р С‘ Р Р† Р С•Р Т‘Р Р…РЎС“ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎС“.",
      tradeoffs: localTradeoffs,
      tradeoffsRu: localTradeoffsRu,
      setupComplexity: localStoreRequired ? "complex" : localAllESIM ? "easy" : "moderate",
      roamingNote: localRoamingNote,
      roamingNoteRu: localRoamingNoteRu,
      applicable: true,
    };

    // РІвЂќР‚РІвЂќР‚ Strategy B: Travel eSIM РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
    const euRegionalEsim = PLANS.find(p =>
      p.country_code === "EU" && isSnap(p) && p.benchmark_type === "eu_regional_travel_esim"
    );
    const travelResults = countries.map(c => ({
      country: c,
      ...bestSnapForCountry(c),
    }));
    const perCountryTravelCost = parseFloat(travelResults.reduce((sum, r) => sum + r.cost, 0).toFixed(2));

    // For EU routes: prefer EU regional eSIM over per-country snapshots
    const euRegionalCost = euRegionalEsim
      ? getPriceEur(euRegionalEsim) * Math.ceil(days / 30)
      : Infinity;
    const useEuRegional = allEU && !!euRegionalEsim
  && euRegionalCost <= perCountryTravelCost * 1.2;
    const travelTotalCost = useEuRegional ? euRegionalCost : perCountryTravelCost;
    const travelCoveredCount = useEuRegional
      ? countries.filter(c => EU_ROAMING_ZONE.includes(c)).length
      : travelResults.filter(r => r.plan).length;

    let travelScore = 50;
    travelScore -= travelTotalCost * 0.2;
    travelScore += 15;  // instant activation bonus
    if (inputs.eSIMOnly)     travelScore += 10;
    if (!inputs.needsNumber) travelScore += 10;
    if (days <= 7)           travelScore += 15;
    if (days >= 21)          travelScore -= 15;
    if (inputs.usage === "heavy")  travelScore -= 10;
    if (inputs.needsNumber)        travelScore -= 15;
    if (inputs.needsHotspot)       travelScore -= 5;
    if (travelCoveredCount < countries.length) travelScore -= 20;

    // Route-type gate: travel eSIM is genuinely good for mixed EU+Balkans routes
    if (mixedEuBalkans) travelScore += 10;
    // EU route: travel eSIM competitive but nomad should still beat it if applicable
    if (routeType === "pure_eu" && multiCountry && useEuRegional) travelScore += 8;

    const travelApplicable = travelCoveredCount > 0;
    const travelWhy = useEuRegional
      ? [
          "Airalo Eurolink covers all EU countries on this route in one plan",
          "Instant activation РІР‚вЂќ no setup before travel",
          ...(days <= 14 ? ["Short-to-medium trip РІР‚вЂќ data-only eSIM is cost-effective"] : []),
          ...(mixedEuBalkans ? ["Covers EU portion of this mixed route"] : []),
          ...(mixedEuBalkans ? ["Р СџР С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ РЎвЂЎР В°РЎРѓРЎвЂљРЎРЉ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В° Р Р† Р вЂўР РЋ"] : []),
        ]
      : [
          "Instant activation РІР‚вЂќ no setup before travel required",
          ...(days <= 7 ? ["Short trip РІР‚вЂќ convenience outweighs cost"] : []),
          ...(!inputs.needsNumber ? ["No local number needed РІР‚вЂќ data-only works"] : []),
          ...(inputs.eSIMOnly ? ["Works entirely on eSIM"] : []),
        ];

    const travelWhyRu = useEuRegional
      ? [
          "Airalo Eurolink Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ Р Р†РЎРѓР Вµ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р вЂўР РЋ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В° Р Р† Р С•Р Т‘Р Р…Р С•Р С РЎвЂљР В°РЎР‚Р С‘РЎвЂћР Вµ",
          "Р СљР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…Р В°РЎРЏ Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ РІР‚вЂќ Р Р…Р Вµ Р Р…РЎС“Р В¶Р Р…Р В° Р Р…Р В°РЎРѓРЎвЂљРЎР‚Р С•Р в„–Р С”Р В° Р Т‘Р С• Р С—Р С•Р ВµР В·Р Т‘Р С”Р С‘",
          ...(mixedEuBalkans ? ["РџРѕРєСЂС‹РІР°РµС‚ С‡Р°СЃС‚СЊ РјР°СЂС€СЂСѓС‚Р° РІ Р•РЎ"] : []),
        ]
      : [
          "Р СљР С–Р Р…Р С•Р Р†Р ВµР Р…Р Р…Р В°РЎРЏ Р В°Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ РІР‚вЂќ Р Р…Р Вµ Р Р…РЎС“Р В¶Р Р…Р В° Р Р…Р В°РЎРѓРЎвЂљРЎР‚Р С•Р в„–Р С”Р В° Р Т‘Р С• Р С—Р С•Р ВµР В·Р Т‘Р С”Р С‘",
          ...(days <= 7 ? ["Р С™Р С•РЎР‚Р С•РЎвЂљР С”Р В°РЎРЏ Р С—Р С•Р ВµР В·Р Т‘Р С”Р В° РІР‚вЂќ РЎС“Р Т‘Р С•Р В±РЎРѓРЎвЂљР Р†Р С• Р Р†Р В°Р В¶Р Р…Р ВµР Вµ РЎвЂ Р ВµР Р…РЎвЂ№"] : []),
          ...(!inputs.needsNumber ? ["Р СљР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Р…Р С•Р СР ВµРЎР‚ Р Р…Р Вµ Р Р…РЎС“Р В¶Р ВµР Р… РІР‚вЂќ Р Т‘Р С•РЎРѓРЎвЂљР В°РЎвЂљР С•РЎвЂЎР Р…Р С• Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦"] : []),
        ];

    const travelTradeoffs = [
      "No real local phone number РІР‚вЂќ data only",
      "Higher РІвЂљВ¬/GB than local SIMs",
      "Prices are estimates РІР‚вЂќ verify before buying",
      ...(inputs.usage === "heavy" ? ["Data caps may be restrictive for heavy usage"] : []),
      ...(mixedEuBalkans ? ["Balkans countries need separate SIM РІР‚вЂќ not covered by EU eSIM"] : []),
    ].join(". ");

    const travelTradeoffsRu = [
      "Р СњР ВµРЎвЂљ РЎР‚Р ВµР В°Р В»РЎРЉР Р…Р С•Р С–Р С• Р СР ВµРЎРѓРЎвЂљР Р…Р С•Р С–Р С• Р Р…Р С•Р СР ВµРЎР‚Р В° РІР‚вЂќ РЎвЂљР С•Р В»РЎРЉР С”Р С• Р С‘Р Р…РЎвЂљР ВµРЎР‚Р Р…Р ВµРЎвЂљ",
      "Р вЂќР С•РЎР‚Р С•Р В¶Р Вµ Р В·Р В° Р вЂњР вЂ, РЎвЂЎР ВµР С Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р Вµ SIM",
      "Р В¦Р ВµР Р…РЎвЂ№ Р С•РЎР‚Р С‘Р ВµР Р…РЎвЂљР С‘РЎР‚Р С•Р Р†Р С•РЎвЂЎР Р…РЎвЂ№Р Вµ РІР‚вЂќ Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚РЎРЏР в„–РЎвЂљР Вµ Р С—Р ВµРЎР‚Р ВµР Т‘ Р С—Р С•Р С”РЎС“Р С—Р С”Р С•Р в„–",
      ...(inputs.usage === "heavy" ? ["Р вЂєР С‘Р СР С‘РЎвЂљРЎвЂ№ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦ Р СР С•Р С–РЎС“РЎвЂљ Р В±РЎвЂ№РЎвЂљРЎРЉ Р С•Р С–РЎР‚Р В°Р Р…Р С‘РЎвЂЎР С‘РЎвЂљР ВµР В»РЎРЉР Р…РЎвЂ№Р СР С‘"] : []),
      ...(mixedEuBalkans ? ["Р вЂР В°Р В»Р С”Р В°Р Р…РЎРѓР С”Р С‘Р Вµ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ РЎвЂљРЎР‚Р ВµР В±РЎС“РЎР‹РЎвЂљ Р С•РЎвЂљР Т‘Р ВµР В»РЎРЉР Р…Р С•Р в„– SIM РІР‚вЂќ EU eSIM РЎвЂљР В°Р С Р Р…Р Вµ РЎР‚Р В°Р В±Р С•РЎвЂљР В°Р ВµРЎвЂљ"] : []),
    ].join(". ");

    const travelStrategy: SimStrategy = {
      id: "travel",
      label: useEuRegional
        ? "Travel eSIM (EU regional)"
        : mixedEuBalkans
          ? "Travel eSIM (EU portion)"
          : "Travel eSIM",
      labelRu: useEuRegional
        ? "Travel eSIM (РЎР‚Р ВµР С–Р С‘Р С•Р Р…Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р вЂўР РЋ)"
        : mixedEuBalkans
          ? "Travel eSIM (РЎвЂЎР В°РЎРѓРЎвЂљРЎРЉ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В° Р вЂўР РЋ)"
          : "Travel eSIM",
      totalCost: travelTotalCost,
      costNote: useEuRegional
        ? "Airalo Eurolink Р’В· estimate"
        : travelCoveredCount < countries.length
          ? `${travelCoveredCount}/${countries.length} countries covered Р’В· estimate`
          : `${countries.length} plan${countries.length > 1 ? "s" : ""} Р’В· estimate`,
      costNoteRu: useEuRegional
        ? "Airalo Eurolink Р’В· Р С•РЎвЂ Р ВµР Р…Р С”Р В°"
        : travelCoveredCount < countries.length
          ? `${travelCoveredCount}/${countries.length} РЎРѓРЎвЂљРЎР‚Р В°Р Р… Р С—Р С•Р С”РЎР‚РЎвЂ№РЎвЂљР С• Р’В· Р С•РЎвЂ Р ВµР Р…Р С”Р В°`
          : `${countries.length} РЎвЂљР В°РЎР‚Р С‘РЎвЂћ Р’В· Р С•РЎвЂ Р ВµР Р…Р С”Р В°`,
      score: Math.round(travelScore),
      isRecommended: false,
      why: travelWhy.join(". "),
      whyRu: travelWhyRu.join(". "),
      tradeoffs: travelTradeoffs,
      tradeoffsRu: travelTradeoffsRu,
      setupComplexity: "easy",
      roamingNote: useEuRegional
        ? `EU regional eSIM covers all ${countries.length} countries`
        : mixedEuBalkans
          ? "EU eSIM covers EU countries РІР‚вЂќ Balkans require separate SIM"
          : multiCountry
            ? "Separate eSIM per country РІР‚вЂќ or use EU regional plan"
            : "Data-only coverage",
      roamingNoteRu: useEuRegional
        ? `Р В Р ВµР С–Р С‘Р С•Р Р…Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– EU eSIM Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ Р Р†РЎРѓР Вµ ${countries.length} РЎРѓРЎвЂљРЎР‚Р В°Р Р…`
        : mixedEuBalkans
          ? "EU eSIM Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р вЂўР РЋ РІР‚вЂќ Р Т‘Р В»РЎРЏ Р вЂР В°Р В»Р С”Р В°Р Р… Р Р…РЎС“Р В¶Р Р…Р В° Р С•РЎвЂљР Т‘Р ВµР В»РЎРЉР Р…Р В°РЎРЏ SIM"
          : multiCountry
            ? "Р С›РЎвЂљР Т‘Р ВµР В»РЎРЉР Р…РЎвЂ№Р в„– eSIM Р Р…Р В° Р С”Р В°Р В¶Р Т‘РЎС“РЎР‹ РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎС“ РІР‚вЂќ Р С‘Р В»Р С‘ РЎР‚Р ВµР С–Р С‘Р С•Р Р…Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– РЎвЂљР В°РЎР‚Р С‘РЎвЂћ"
            : "Р СџР С•Р С”РЎР‚РЎвЂ№РЎвЂљР С‘Р Вµ РЎвЂљР С•Р В»РЎРЉР С”Р С• Р Т‘Р В°Р Р…Р Р…РЎвЂ№Р СР С‘",
      applicable: travelApplicable,
      inapplicableReason: !travelApplicable ? "No travel eSIM data available for this route" : undefined,
      inapplicableReasonRu: !travelApplicable ? "Р СњР ВµРЎвЂљ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦ Р С—Р С• travel eSIM Р Т‘Р В»РЎРЏ РЎРЊРЎвЂљР С•Р С–Р С• Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°" : undefined,
    };

    // РІвЂќР‚РІвЂќР‚ Strategy C: EU Nomad (Orange Flex Poland) РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
    const nomadPlans  = PLANS.filter(isEuNomad);
    const nomadPlan   = nomadPlans[0];
    const nomadEur    = nomadPlan ? getPriceEur(nomadPlan) : 0;
    const nomadRoamGB = nomadPlan?.roaming_cap_gb ?? 12.03;

    const nomadApplicableCountries = countries.filter(c => EU_ROAMING_ZONE.includes(c));
    const nomadUncoveredCountries  = countries.filter(c => !EU_ROAMING_ZONE.includes(c));
    const nomadCoverage     = countries.length > 0 ? nomadApplicableCountries.length / countries.length : 0;
    const nomadFullyCovered   = nomadCoverage >= 1.0;
    const nomadPartiallyCovered = nomadCoverage > 0 && nomadCoverage < 1.0;
    const nomadApplicable = nomadPlan != null
      && nomadFullyCovered
      && days >= 7
      && !allBalkan;

    const nomadMonths       = Math.ceil(days / 30);
    const nomadTotalCost    = parseFloat((nomadEur * nomadMonths).toFixed(2));
    const nomadGbAvailable  = nomadRoamGB * nomadMonths;
    const gbNeeded          = usageToMinGbPerDay(inputs.usage) * days;
    const nomadDataOk       = nomadGbAvailable >= gbNeeded;

    let nomadScore = 50;
    if (nomadFullyCovered && multiCountry) nomadScore += 18;
    if (days >= 30) nomadScore += 6;
    else if (days >= 21) nomadScore += 3;

    // РІвЂќР‚РІвЂќР‚ Route-type gates on nomad score РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
    // pure_eu: this is EXACTLY what Orange Flex is designed for. Big boost.
    if (routeType === "pure_eu" && multiCountry && nomadFullyCovered) {
      nomadScore += 25; // primary recommendation for multi-country EU routes
    }
    // single EU country: nomad still valid but smaller boost (no multi-country advantage)
    if (routeType === "single" && nomadFullyCovered) {
      nomadScore += 5;
    }

    const nomadCostDiff    = nomadTotalCost - localTotalCost;
    const nomadCostPenalty = nomadCostDiff > 0
      ? nomadCostDiff * (routeType === "pure_eu" ? 0.6 : 1.2)  // lighter penalty for EU routes
      : Math.abs(nomadCostDiff) * 0.3;
    nomadScore -= Math.max(0, nomadCostPenalty);

    if (inputs.needsNumber)                     nomadScore += 6;
    if (inputs.eSIMOnly)                        nomadScore += 5;
    if (!nomadDataOk)                           nomadScore -= 18;
    if (!nomadDataOk && inputs.usage === "heavy") nomadScore -= 15;
    if (inputs.needsHotspot && inputs.usage === "heavy") nomadScore -= 8;
    if (!nomadFullyCovered)                     nomadScore -= 40;
    if (allBalkan)                              nomadScore -= 60;

    const uncoveredNames   = nomadUncoveredCountries.map(c => COUNTRIES[c]?.name ?? c);
    const uncoveredNamesRu = nomadUncoveredCountries.map(c => COUNTRIES[c]?.name_ru ?? c);

    const nomadWhy = nomadFullyCovered ? [
      routeType === "pure_eu" && multiCountry
        ? `One SIM for your entire EU route РІР‚вЂќ all ${countries.length} countries covered`
        : multiCountry
          ? `One SIM covers all ${countries.length} countries on this route`
          : `Works in ${nomadApplicableCountries.map(c => COUNTRIES[c]?.name).join(", ")}`,
      `РІвЂљВ¬${nomadEur}/month with ${nomadRoamGB} GB EU roaming`,
      "Real Polish phone number included",
      "App-based activation РІР‚вЂќ no store visit, no local address required",
      "Foreign passport accepted, no EU residency required",
    ] : [
      `Only covers ${nomadApplicableCountries.length}/${countries.length} countries on this route`,
      `${uncoveredNames.join(", ")} ${uncoveredNames.length === 1 ? "is" : "are"} NOT in the EU roaming zone`,
      "Orange Flex EU roaming does not extend to non-EU countries",
    ];

    const nomadWhyRu = nomadFullyCovered ? [
      routeType === "pure_eu" && multiCountry
        ? `Р С›Р Т‘Р Р…Р В° SIM Р Т‘Р В»РЎРЏ Р Р†РЎРѓР ВµР С–Р С• Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В° Р С—Р С• Р вЂўР РЋ РІР‚вЂќ Р Р†РЎРѓР Вµ ${countries.length} РЎРѓРЎвЂљРЎР‚Р В°Р Р… Р С—Р С•Р С”РЎР‚РЎвЂ№РЎвЂљРЎвЂ№`
        : multiCountry
          ? `Р С›Р Т‘Р Р…Р В° SIM Р Т‘Р В»РЎРЏ Р Р†РЎРѓР ВµРЎвЂ¦ ${countries.length} РЎРѓРЎвЂљРЎР‚Р В°Р Р… Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°`
          : `Р В Р В°Р В±Р С•РЎвЂљР В°Р ВµРЎвЂљ Р Р† ${nomadApplicableCountries.map(c => COUNTRIES[c]?.name_ru ?? c).join(", ")}`,
      `РІвЂљВ¬${nomadEur}/Р СР ВµРЎРѓРЎРЏРЎвЂ  РЎРѓ ${nomadRoamGB} Р вЂњР вЂ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° Р вЂўР РЋ`,
      "Р вЂ™Р С”Р В»РЎР‹РЎвЂЎР В°Р ВµРЎвЂљ РЎР‚Р ВµР В°Р В»РЎРЉР Р…РЎвЂ№Р в„– Р С—Р С•Р В»РЎРЉРЎРѓР С”Р С‘Р в„– Р Р…Р С•Р СР ВµРЎР‚",
      "Р С’Р С”РЎвЂљР С‘Р Р†Р В°РЎвЂ Р С‘РЎРЏ РЎвЂЎР ВµРЎР‚Р ВµР В· Р С—РЎР‚Р С‘Р В»Р С•Р В¶Р ВµР Р…Р С‘Р Вµ РІР‚вЂќ Р В±Р ВµР В· Р СР В°Р С–Р В°Р В·Р С‘Р Р…Р В°, Р В±Р ВµР В· Р СР ВµРЎРѓРЎвЂљР Р…Р С•Р С–Р С• Р В°Р Т‘РЎР‚Р ВµРЎРѓР В°",
      "Р ВР Р…Р С•РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р Р…РЎвЂ№Р в„– Р С—Р В°РЎРѓР С—Р С•РЎР‚РЎвЂљ Р С—РЎР‚Р С‘Р Р…Р С‘Р СР В°Р ВµРЎвЂљРЎРѓРЎРЏ, РЎР‚Р ВµР В·Р С‘Р Т‘Р ВµР Р…РЎвЂљРЎРѓРЎвЂљР Р†Р С• Р вЂўР РЋ Р Р…Р Вµ РЎвЂљРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ",
    ] : [
      `Р СџР С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ РЎвЂљР С•Р В»РЎРЉР С”Р С• ${nomadApplicableCountries.length}/${countries.length} РЎРѓРЎвЂљРЎР‚Р В°Р Р… Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°`,
      `${uncoveredNamesRu.join(", ")} Р СњР вЂў Р Р†РЎвЂ¦Р С•Р Т‘Р С‘РЎвЂљ Р Р† Р В·Р С•Р Р…РЎС“ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° Р вЂўР РЋ`,
      "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Orange Flex Р Р…Р Вµ РЎР‚Р В°РЎРѓР С—РЎР‚Р С•РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎРЏР ВµРЎвЂљРЎРѓРЎРЏ Р Р…Р В° РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№ Р Р†Р Р…Р Вµ Р вЂўР РЋ",
    ];

    const nomadTradeoffs = [
      "Polish number РІР‚вЂќ not a local number for each country visited",
      `EU roaming capped at ${nomadRoamGB} GB/month РІР‚вЂќ not unlimited`,
      ...(inputs.usage === "heavy" ? ["May not have enough data for heavy usage"] : []),
      ...(nomadUncoveredCountries.length > 0 ? [`EU roaming only РІР‚вЂќ ${uncoveredNames.join(", ")} require separate SIM or travel eSIM`] : []),
    ].join(". ");
    const nomadTradeoffsRu = [
      "Р СџР С•Р В»РЎРЉРЎРѓР С”Р С‘Р в„– Р Р…Р С•Р СР ВµРЎР‚ РІР‚вЂќ Р Р…Р Вµ Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р в„– Р Т‘Р В»РЎРЏ Р С”Р В°Р В¶Р Т‘Р С•Р в„– Р С—Р С•РЎРѓР ВµРЎвЂ°РЎвЂР Р…Р Р…Р С•Р в„– РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№",
      `Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ Р С•Р С–РЎР‚Р В°Р Р…Р С‘РЎвЂЎР ВµР Р… ${nomadRoamGB} Р вЂњР вЂ/Р СР ВµРЎРѓРЎРЏРЎвЂ  РІР‚вЂќ Р Р…Р Вµ Р В±Р ВµР В·Р В»Р С‘Р СР С‘РЎвЂљ`,
      ...(inputs.usage === "heavy" ? ["Р СљР С•Р В¶Р ВµРЎвЂљ Р Р…Р Вµ РЎвЂ¦Р Р†Р В°РЎвЂљР С‘РЎвЂљРЎРЉ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦"] : []),
      ...(nomadUncoveredCountries.length > 0 ? [`Р СћР С•Р В»РЎРЉР С”Р С• РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ РІР‚вЂќ ${uncoveredNamesRu.join(", ")} РЎвЂљРЎР‚Р ВµР В±РЎС“РЎР‹РЎвЂљ Р С•РЎвЂљР Т‘Р ВµР В»РЎРЉР Р…Р С•Р в„– SIM`] : []),
    ].join(". ");

    const nomadInapplicableReason = allBalkan
      ? "Orange Flex EU roaming does not extend to Western Balkans. Use local Balkan SIMs or travel eSIMs."
      : nomadPartiallyCovered
        ? `Mixed route РІР‚вЂќ Orange Flex covers ${nomadApplicableCountries.map(c => COUNTRIES[c]?.name).join(", ")} only. ${uncoveredNames.join(", ")} ${uncoveredNames.length === 1 ? "is" : "are"} outside EU roaming zone.`
        : days < 7
          ? "Too short a trip for a monthly plan"
          : "Route not covered by EU roaming zone";
    const nomadInapplicableReasonRu = allBalkan
      ? "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Orange Flex EU Р Р…Р Вµ РЎР‚Р В°РЎРѓР С—РЎР‚Р С•РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎРЏР ВµРЎвЂљРЎРѓРЎРЏ Р Р…Р В° Р вЂ”Р В°Р С—Р В°Р Т‘Р Р…РЎвЂ№Р Вµ Р вЂР В°Р В»Р С”Р В°Р Р…РЎвЂ№. Р ВРЎРѓР С—Р С•Р В»РЎРЉР В·РЎС“Р в„–РЎвЂљР Вµ Р СР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р Вµ SIM Р С‘Р В»Р С‘ travel eSIM."
      : nomadPartiallyCovered
        ? `Р РЋР СР ВµРЎв‚¬Р В°Р Р…Р Р…РЎвЂ№Р в„– Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљ РІР‚вЂќ Orange Flex Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ РЎвЂљР С•Р В»РЎРЉР С”Р С• ${nomadApplicableCountries.map(c => COUNTRIES[c]?.name_ru ?? c).join(", ")}. ${uncoveredNamesRu.join(", ")} Р В·Р В° Р С—РЎР‚Р ВµР Т‘Р ВµР В»Р В°Р СР С‘ Р В·Р С•Р Р…РЎвЂ№ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° Р вЂўР РЋ.`
        : days < 7
          ? "Р СџР С•Р ВµР В·Р Т‘Р С”Р В° РЎРѓР В»Р С‘РЎв‚¬Р С”Р С•Р С Р С”Р С•РЎР‚Р С•РЎвЂљР С”Р В°РЎРЏ Р Т‘Р В»РЎРЏ Р ВµР В¶Р ВµР СР ВµРЎРѓРЎРЏРЎвЂЎР Р…Р С•Р С–Р С• РЎвЂљР В°РЎР‚Р С‘РЎвЂћР В°"
          : "Р СљР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљ Р Р…Р Вµ Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљРЎРѓРЎРЏ Р В·Р С•Р Р…Р С•Р в„– РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° Р вЂўР РЋ";

    const nomadStrategy: SimStrategy = {
      id: "nomad",
      label: nomadFullyCovered && routeType === "pure_eu" && multiCountry
        ? "EU Nomad setup РІР‚вЂќ one SIM for your EU route"
        : nomadFullyCovered
          ? "EU Nomad setup (Orange Flex Poland)"
          : "EU Nomad РІР‚вЂќ partial route only",
      labelRu: nomadFullyCovered && routeType === "pure_eu" && multiCountry
        ? "EU Nomad РІР‚вЂќ Р С•Р Т‘Р Р…Р В° SIM Р Т‘Р В»РЎРЏ Р Р†РЎРѓР ВµР С–Р С• Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°"
        : nomadFullyCovered
          ? "EU Nomad (Orange Flex Poland)"
          : "EU Nomad РІР‚вЂќ РЎвЂЎР В°РЎРѓРЎвЂљР С‘РЎвЂЎР Р…Р С•Р Вµ Р С—Р С•Р С”РЎР‚РЎвЂ№РЎвЂљР С‘Р Вµ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°",
      totalCost: nomadTotalCost,
      costNote: `${nomadMonths} month${nomadMonths > 1 ? "s" : ""} Р’В· РІвЂљВ¬${nomadEur}/mo`,
      costNoteRu: `${nomadMonths} Р СР ВµРЎРѓ. Р’В· РІвЂљВ¬${nomadEur}/Р СР ВµРЎРѓ.`,
      score: nomadApplicable ? Math.round(nomadScore) : -999,
      isRecommended: false,
      why: nomadWhy.join(". "),
      whyRu: nomadWhyRu.join(". "),
      tradeoffs: nomadTradeoffs || "Suitable for this route.",
      tradeoffsRu: nomadTradeoffsRu || "Р СџР С•Р Т‘РЎвЂ¦Р С•Р Т‘Р С‘РЎвЂљ Р Т‘Р В»РЎРЏ РЎРЊРЎвЂљР С•Р С–Р С• Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°.",
      setupComplexity: "easy",
      roamingNote: nomadFullyCovered
        ? routeType === "pure_eu" && multiCountry
          ? `This route is fully inside the EU roaming area РІР‚вЂќ one SIM covers all ${countries.length} countries`
          : `EU roaming across all ${countries.length} countries on this route`
        : nomadPartiallyCovered
          ? `EU roaming in ${nomadApplicableCountries.map(c => COUNTRIES[c]?.name).join(", ")} only РІР‚вЂќ NOT in ${uncoveredNames.join(", ")}`
          : "EU roaming does not cover this route",
      roamingNoteRu: nomadFullyCovered
        ? routeType === "pure_eu" && multiCountry
          ? `Р вЂ™Р ВµРЎРѓРЎРЉ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљ Р Р† Р В·Р С•Р Р…Р Вµ РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–Р В° Р вЂўР РЋ РІР‚вЂќ Р С•Р Т‘Р Р…Р В° SIM Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ Р Р†РЎРѓР Вµ ${countries.length} РЎРѓРЎвЂљРЎР‚Р В°Р Р…`
          : `Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ Р С—Р С• Р Р†РЎРѓР ВµР С ${countries.length} РЎРѓРЎвЂљРЎР‚Р В°Р Р…Р В°Р С Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°`
        : nomadPartiallyCovered
          ? `Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ РЎвЂљР С•Р В»РЎРЉР С”Р С• Р Р† ${nomadApplicableCountries.map(c => COUNTRIES[c]?.name_ru ?? c).join(", ")} РІР‚вЂќ Р СњР вЂў Р Р† ${uncoveredNamesRu.join(", ")}`
          : "Р В Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ Р Р…Р Вµ Р С—Р С•Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ РЎРЊРЎвЂљР С•РЎвЂљ Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљ",
      applicable: nomadApplicable,
      inapplicableReason: !nomadApplicable ? nomadInapplicableReason : undefined,
      inapplicableReasonRu: !nomadApplicable ? nomadInapplicableReasonRu : undefined,
    };

    const strategies = [localStrategy, travelStrategy, nomadStrategy];

    // Mark the highest-scored applicable strategy as recommended
    const applicable = strategies.filter(s => s.applicable);
    if (applicable.length) {
      const winner = applicable.reduce((a, b) => a.score > b.score ? a : b);
      winner.isRecommended = true;
    }

    return strategies.sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
      if (a.applicable !== b.applicable) return a.applicable ? -1 : 1;
      return b.score - a.score;
    });
  }, [inputs]);
}

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Sim Page РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
function SimPage({ lang, onBack, onGoSingle }: {
  lang: Lang;
  onBack: () => void;
  onGoSingle: (country: CountryCode, days: number) => void;
}) {
  const t = T[lang];
  const isRu = lang === "ru";
  const ALL_COUNTRIES = Object.entries(COUNTRIES) as [CountryCode, CountryMeta][];

  const [simCountries, setSimCountries] = useState<CountryCode[]>([]);
  const [simDays,      setSimDays]      = useState(14);
  const [simUsage,     setSimUsage]     = useState<SimUsage>("medium");
  const [hotspot,      setHotspot]      = useState(false);
  const [eSIMOnly,     setESIMOnly]     = useState(false);
  const [needNumber,   setNeedNumber]   = useState(false);
  const [ran,          setRan]          = useState(false);

  const inputs: SimInputs = useMemo(() => ({
    countries: simCountries,
    days: simDays,
    usage: simUsage,
    needsHotspot: hotspot,
    eSIMOnly,
    needsNumber: needNumber,
  }), [simCountries, simDays, simUsage, hotspot, eSIMOnly, needNumber]);

  const strategies = useTripSim(inputs);

  function toggleCountry(code: CountryCode) {
    setSimCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
    setRan(false);
  }

  const complexityLabel = (c: SimStrategy["setupComplexity"]) =>
    c === "easy"     ? (isRu ? "Р вЂєР ВµР С–Р С”Р С•"     : "Easy") :
    c === "moderate" ? (isRu ? "Р Р€Р СР ВµРЎР‚Р ВµР Р…Р Р…Р С•"  : "Moderate") :
                       (isRu ? "Р РЋР В»Р С•Р В¶Р Р…Р С•"    : "Complex");

  const strategyColor = (s: SimStrategy) =>
    s.id === "local"  ? "#2563eb" :
    s.id === "nomad"  ? "#4f46e5" :
                        "#78350f";

  const strategyBg = (s: SimStrategy) =>
    s.id === "local"  ? "#eff6ff" :
    s.id === "nomad"  ? "#eef2ff" :
                        "#fffbeb";

  const strategyBorder = (s: SimStrategy) =>
    s.id === "local"  ? "#93c5fd" :
    s.id === "nomad"  ? "#818cf8" :
                        "#fcd34d";

  return (
    <div className="sim-wrap">
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: "1.25rem" }}>
        <Ic d={IC.back} size={13} /> {t.back}
      </button>

      <div className="sim-header">
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {t.sim_title}
        </div>
        <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>{t.sim_sub}</div>
      </div>

      <div className="sim-body">
        <CountryPicker
          allCountries={ALL_COUNTRIES as unknown as [string, import("./components/TripSimulator").CountryMeta][]}
          selected={simCountries}
          lang={lang}
          onToggle={(code) => toggleCountry(code as CountryCode)}
        />

        <TripConfigPanel
          selected={simCountries}
          countriesMeta={COUNTRIES as unknown as Record<string, any>}
          days={simDays}
          usage={simUsage}
          hotspot={hotspot}
          eSIMOnly={eSIMOnly}
          needNumber={needNumber}
          lang={lang}
          t={{
            sim_title:            t.sim_title,
            sim_sub:              t.sim_sub,
            sim_countries:        t.sim_countries,
            sim_duration:         t.sim_duration,
            sim_usage:            t.sim_usage,
            sim_hotspot:          t.sim_hotspot,
            sim_esim_only:        t.sim_esim_only,
            sim_need_number:      t.sim_need_number,
            sim_yes:              t.sim_yes,
            sim_no:               t.sim_no,
            sim_run:              t.sim_run,
            sim_recommended:      t.sim_recommended,
            sim_caveat_snapshot:  t.sim_caveat_snapshot,
            back:                 t.back,
          }}
          onRemoveCountry={(code) => toggleCountry(code as CountryCode)}
          onDaysChange={d  => { setSimDays(d);    setRan(false); }}
          onUsageChange={u  => { setSimUsage(u);   setRan(false); }}
          onHotspotChange={v => { setHotspot(v);   setRan(false); }}
          onESIMOnlyChange={v => { setESIMOnly(v); setRan(false); }}
          onNeedNumberChange={v => { setNeedNumber(v); setRan(false); }}
          onRun={() => setRan(true)}
        />
      </div>

      {ran && simCountries.length > 0 && (
        <SimulatorResults
          strategies={strategies}
          simCountries={simCountries}
          simDays={simDays}
          simUsage={simUsage}
          eSIMOnly={eSIMOnly}
          needNumber={needNumber}
          lang={lang}
          t={{
            sim_title:            t.sim_title,
            sim_sub:              t.sim_sub,
            sim_countries:        t.sim_countries,
            sim_duration:         t.sim_duration,
            sim_usage:            t.sim_usage,
            sim_hotspot:          t.sim_hotspot,
            sim_esim_only:        t.sim_esim_only,
            sim_need_number:      t.sim_need_number,
            sim_yes:              t.sim_yes,
            sim_no:               t.sim_no,
            sim_run:              t.sim_run,
            sim_recommended:      t.sim_recommended,
            sim_caveat_snapshot:  t.sim_caveat_snapshot,
            back:                 t.back,
          }}
          countryFlags={Object.fromEntries(
            Object.entries(COUNTRIES).map(([code, c]) => [code, (c as { flag: string }).flag])
          )}
          countryNames={Object.fromEntries(
            Object.entries(COUNTRIES).map(([code, c]) => [
              code,
              lang === "ru" ? (c as { name_ru: string }).name_ru : (c as { name: string }).name,
            ])
          )}
          onGoSingle={(code, days) => onGoSingle(code as CountryCode, days)}
        />
      )}
    </div>
  );
  }
  const DURS = [
  { d: 7,  key: "days_7"  as const },
  { d: 14, key: "days_14" as const },
  { d: 21, key: "days_21" as const },
  { d: 30, key: "days_30" as const },
  { d: 45, key: "days_45" as const },
  { d: 60, key: "days_60" as const },
];
const PREF_OPTS: { id: PrefId; icon: string; key: keyof typeof T["en"] }[] = [
  { id: "cheapest",  icon: IC.coin,     key: "pref_cheapest" },
  { id: "esim",      icon: IC.mobile,   key: "pref_esim" },
  { id: "nostore",   icon: IC.homeoff,  key: "pref_nostore" },
  { id: "roaming",   icon: IC.antenna,  key: "pref_roaming" },
  { id: "longterm",  icon: IC.calendar, key: "pref_longterm" },
  { id: "tourist",   icon: IC.backpack, key: "pref_tourist" },
];

export default function Home() {
  const [lang,          setLang]          = useState<Lang>("en");
  const [page,          setPage]          = useState<PageId>("home");
  const [country,       setCountry]       = useState<CountryCode | null>(null);
  const [days,          setDays]          = useState(14);
  const [prefs,         setPrefs]         = useState<Set<PrefId>>(new Set());
  const [countryDetail, setCountryDetail] = useState<CountryCode>("RS");
  const [modalPlan,     setModalPlan]     = useState<Plan | null>(null);
  const t = T[lang];

  function togPref(p: PrefId) {
    setPrefs(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  }
  function goCountry(c: CountryCode) { setCountryDetail(c); setPage("country"); }
  function goSingleFromSim(c: CountryCode, d: number) {
    setCountry(c); setDays(d); setPage("results");
  }

  return (
    <>
      <span className="sr-only">SimRoam РІР‚вЂќ travel connectivity intelligence</span>
      <nav className="nav">
        <div className="nav-logo"><div className="nav-dot" />SimRoam<span className="nav-sub">{t.tagline}</span></div>
        <div className="nav-right">
          <button className={`btn-lang${lang === "en" ? " active" : ""}`} onClick={() => setLang("en")}>EN</button>
          <button className={`btn-lang${lang === "ru" ? " active" : ""}`} onClick={() => setLang("ru")}>RU</button>
          <button className={`btn-ghost${page === "sim" ? " active" : ""}`} onClick={() => setPage("sim")}>
            <Ic d={IC.plane} size={13} /> {lang === "ru" ? "Р СљРЎС“Р В»РЎРЉРЎвЂљР С‘РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–" : "Route Planner"}
          </button>
          <button className="btn-ghost" onClick={() => setPage("countries")}><Ic d={IC.globe} size={13} /> {t.countries}</button>
        </div>
      </nav>

      {page === "home" && (
        <div className="home-wrap">

          {/* РІвЂќР‚РІвЂќР‚ Hero РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚ */}
          <div className="home-hero">
            <h1 className="home-hero-h1">
              {lang === "ru"
                ? "Р вЂєРЎС“РЎвЂЎРЎв‚¬Р В°РЎРЏ SIM Р Т‘Р В»РЎРЏ Р Р†Р В°РЎв‚¬Р ВµР в„– Р С—Р С•Р ВµР В·Р Т‘Р С”Р С‘"
                : "Find the best SIM for your trip"}
            </h1>
            <p className="home-hero-sub">
              {lang === "ru"
                ? "Р СљР ВµРЎРѓРЎвЂљР Р…РЎвЂ№Р Вµ SIM, РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С– Р вЂўР РЋ, РЎвЂљРЎС“РЎР‚Р С‘РЎРѓРЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р Вµ eSIM РІР‚вЂќ РЎРѓРЎР‚Р В°Р Р†Р Р…Р С‘Р Р†Р В°Р ВµР С Р С‘ РЎР‚Р ВµР С”Р С•Р СР ВµР Р…Р Т‘РЎС“Р ВµР С."
                : "Compare local prepaid SIMs, EU roaming plans and travel eSIMs."}
            </p>

            {/* Search РІР‚вЂќ navigates to CountriesPage */}
            <button
              className="home-search-btn"
              onClick={() => setPage("countries")}
              aria-label={lang === "ru" ? "Р СџР С•Р С‘РЎРѓР С” РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№" : "Search country"}
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="home-search-placeholder">
                {lang === "ru" ? "Р СџР С•Р С‘РЎРѓР С” РЎРѓРЎвЂљРЎР‚Р В°Р Р…РЎвЂ№РІР‚В¦" : "Search countryРІР‚В¦"}
              </span>
            </button>
          </div>

          {/* РІвЂќР‚РІвЂќР‚ Country picker (inline on homepage) РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚ */}
          <HomePicker
            lang={lang}
            selected={country}
            onSelect={c => setCountry(c)}
            onConfirm={c => { setCountry(c); setPage("results"); }}
            onBrowseAll={() => setPage("countries")}
          />

          {/* РІвЂќР‚РІвЂќР‚ Trip config row РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚ */}
          <div className="home-config">
            <div className="home-config-row">
              <span className="field-label">{t.trip_length}</span>
              <div className="dur-row">
                {DURS.map(({ d, key }) => (
                  <button key={d} className={`dur-btn${days === d ? " selected" : ""}`}
                    onClick={() => setDays(d)}>
                    {t[key] as string}
                  </button>
                ))}
              </div>
            </div>

            <div className="home-config-row">
              <span className="field-label">{t.priorities}</span>
              <div className="pref-grid">
                {PREF_OPTS.map(({ id, icon, key }) => (
                  <button key={id} className={`pref-tile${prefs.has(id) ? " selected" : ""}`}
                    onClick={() => togPref(id)}>
                    <Ic d={icon} size={14} />{t[key] as string}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" disabled={!country}
              onClick={() => { if (country) setPage("results"); }}>
              <Ic d={IC.search} size={15} />
              {country
                ? t.find(lang === "ru" ? COUNTRIES[country].name_ru : COUNTRIES[country].name)
                : t.select_dest}
            </button>
          </div>

          {/* РІвЂќР‚РІвЂќР‚ Route planner promo РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚ */}
          <div className="home-sim-card" onClick={() => setPage("sim")}>
            <div>
              <div className="home-sim-title">
                <Ic d={IC.plane} size={13} />
                {"  "}{lang === "ru" ? "Р СљРЎС“Р В»РЎРЉРЎвЂљР С‘РЎР‚Р С•РЎС“Р СР С‘Р Р…Р С–" : "Route Planner"}
              </div>
              <div className="home-sim-sub">
                {lang === "ru"
                  ? "Р вЂњР ВµРЎР‚Р СР В°Р Р…Р С‘РЎРЏ РІвЂ вЂ™ Р С’Р Р†РЎРѓРЎвЂљРЎР‚Р С‘РЎРЏ РІвЂ вЂ™ Р ВРЎвЂљР В°Р В»Р С‘РЎРЏ? Р СњР В°Р в„–Р Т‘РЎвЂР С Р В»РЎС“РЎвЂЎРЎв‚¬РЎС“РЎР‹ SIM Р Т‘Р В»РЎРЏ Р Р†РЎРѓР ВµР С–Р С• Р СР В°РЎР‚РЎв‚¬РЎР‚РЎС“РЎвЂљР В°."
                  : "Germany РІвЂ вЂ™ Austria РІвЂ вЂ™ Italy? Find the best SIM for your whole route."}
              </div>
            </div>
            <span className="home-sim-arrow">РІвЂ вЂ™</span>
          </div>

        </div>
      )}

      {page === "results" && country ? (
        <ResultsPage
          country={country} days={days} prefs={prefs} lang={lang}
          onBack={() => setPage("home")} onModal={p => setModalPlan(p)}
        />
      ) : page === "results" && !country ? (
        <div className="home-wrap">
          <div className="home-hero">
            <h1 className="home-hero-h1">
              {lang === "ru" ? "Р вЂєРЎС“РЎвЂЎРЎв‚¬Р В°РЎРЏ SIM Р Т‘Р В»РЎРЏ Р Р†Р В°РЎв‚¬Р ВµР в„– Р С—Р С•Р ВµР В·Р Т‘Р С”Р С‘" : "Find the best SIM for your trip"}
            </h1>
            <p className="home-hero-sub">
              {lang === "ru" ? "Р вЂ™РЎвЂ№Р В±Р ВµРЎР‚Р С‘РЎвЂљР Вµ Р Р…Р В°Р С—РЎР‚Р В°Р Р†Р В»Р ВµР Р…Р С‘Р Вµ, РЎвЂЎРЎвЂљР С•Р В±РЎвЂ№ Р С—РЎР‚Р С•Р Т‘Р С•Р В»Р В¶Р С‘РЎвЂљРЎРЉ." : "Select a destination to continue."}
            </p>
          </div>
          <HomePicker
            lang={lang}
            selected={null}
            onSelect={c => setCountry(c)}
            onConfirm={c => { setCountry(c); setPage("results"); }}
            onBrowseAll={() => setPage("countries")}
          />
        </div>
      ) : null}
      {page === "countries" && <CountriesPage lang={lang} onSelect={goCountry} />}
      {page === "country"   && (
        <CountryPage code={countryDetail} lang={lang} onBack={() => setPage("home")} onModal={p => setModalPlan(p)} />
      )}
      {page === "sim" && (
        <SimPage lang={lang} onBack={() => setPage("home")} onGoSingle={goSingleFromSim} />
      )}
      {modalPlan && (
        <Modal plan={modalPlan} days={days} lang={lang} onClose={() => setModalPlan(null)} />
      )}
      {/* Global footer РІР‚вЂќ report data issue */}
      <div style={{ textAlign: "center", padding: "1.5rem 1.25rem", borderTop: "1px solid #e8eaef", marginTop: "2rem" }}>
        <a
          href={buildReportMailto({
            countryCode: "",
            countryName: "",
            tripDuration: 0,
            section: "General data issue",
          })}
          style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          {lang === "ru" ? "Р РЋР С•Р С•Р В±РЎвЂ°Р С‘РЎвЂљРЎРЉ Р С•Р В± Р С•РЎв‚¬Р С‘Р В±Р С”Р Вµ Р Р† Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦" : "Report a data issue"} Р’В· hello@jeckovich.uk
        </a>
      </div>
    </>
  );
}
