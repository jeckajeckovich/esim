import plansData from "../data/plans.json";
import operatorsData from "../data/operators.json";
import countriesData from "../data/countries.json";
const PLANS: any[] = plansData as any[];
const OPERATORS: any = operatorsData;
const COUNTRIES: any = countriesData;
const TRAVEL_ESIMS: any[] = [];
type CountryCode = string;
type Plan = any;
type TravelEsim = any;

export type PrefId = "cheapest" | "esim" | "nostore" | "roaming" | "longterm" | "tourist";

export interface ScoredPlan {
  plan: Plan;
  score: number;
  purchases: number;
  total_cost: number;
  total_data_gb: number | null; // null = unlimited
  days_covered: number;
  needs_repurchase: boolean;
  cost_per_day: number;
}

export interface ComparisonResult {
  best_overall: ScoredPlan;
  cheapest: ScoredPlan | null;
  easiest: ScoredPlan | null;
  best_esim: ScoredPlan | null;
  best_long_term: ScoredPlan | null;
  best_roaming: ScoredPlan | null;
  all_scored: ScoredPlan[];
  optimizer_message: string;
  travel_esim_comparison: TravelEsimComparison | null;
}

export interface TravelEsimComparison {
  travel_option: TravelEsim;
  local_option: ScoredPlan;
  local_saves_eur: number;
  local_saves_pct: number;
  local_data_ratio: number; // how many times more data
  verdict: string;
  verdict_detail: string;
}

function scorePlan(p: Plan, days: number, prefs: Set<PrefId>): ScoredPlan {
  const purchases = Math.ceil(days / p.duration_days);
  const total_cost = parseFloat((p.price_eur * purchases).toFixed(2));
  const total_data_gb = p.unlimited_data ? null : (p.data_gb || 0) * purchases;
  const days_covered = p.duration_days * purchases;
  const needs_repurchase = !p.renewable && purchases > 1;
  const cost_per_day = parseFloat((total_cost / days).toFixed(2));

  let score = 50;

  // Positive signals
  if (p.esim_supported && p.online_purchase) score += 12;
  if (p.activation_before_arrival) score += 8;
  if (p.local_number) score += 5;
  if (p.western_balkans_roaming) score += 6;
  if (p.roaming_cap_gb > 0) score += 4;
  if (p.renewable) score += 6;
  if (p.auto_renew) score += 3;
  if (!p.passport_required && !p.kyc_required) score += 8;

  // Friction penalty
  score -= p.friction_score * 3;

  // Cost penalty (relative)
  score -= total_cost * 0.3;

  // Data adequacy
  if (!p.unlimited_data && total_data_gb !== null) {
    if (total_data_gb >= days * 1) score += 8; // ≥1 GB/day
    if (total_data_gb >= days * 2) score += 4;
  }
  if (p.unlimited_data) score += 10;

  // Repurchase penalty
  if (needs_repurchase) score -= 15;
  if (p.disposable_number) score -= 6;
  if (p.fair_use_policy) score -= 4;
  if (p.address_required) score -= 12;

  // Preference boosts
  if (prefs.has("cheapest")) score += (50 - total_cost) * 0.8;
  if (prefs.has("esim") && p.esim_supported && p.activation_before_arrival) score += 28;
  if (prefs.has("nostore") && p.online_purchase && !p.physical_store_required) score += 20;
  if (prefs.has("roaming") && p.western_balkans_roaming) score += 20;
  if (prefs.has("longterm") && (p.auto_renew || p.renewable)) score += 15;
  if (prefs.has("tourist") && p.friction_score <= 3) score += 12;

  return { plan: p, score, purchases, total_cost, total_data_gb, days_covered, needs_repurchase, cost_per_day };
}

function buildOptimizerMessage(best: ScoredPlan, all: ScoredPlan[], days: number, country: CountryCode): string {
  const bp = best.plan;

  if (country === "ME") {
    const p15 = all.find(s => s.plan.id === "one_me_tourist_15");
    const p20 = all.find(s => s.plan.id === "one_me_tourist_20");
    if (p15 && p20 && days > 15 && days <= 30) {
      const save = (p15.plan.price_eur * 2) - p20.plan.price_eur;
      return `One Tourist 20 (€20/30d) beats buying two One Tourist 15 plans (€30 total) for your ${days}-day trip — saves €${save.toFixed(0)} and includes more roaming data.`;
    }
    const mtel = all.find(s => s.plan.id === "mtel_me_super");
    if (days >= 31 && days <= 45 && mtel) {
      return `For ${days} days, m:tel Super Tourist (€30/45d) covers your full stay in one purchase vs. combining two shorter plans at higher cost.`;
    }
  }

  if (country === "RS") {
    const yettel = all.find(s => s.plan.id === "yettel_rs_unlimited_30d");
    const prepaid = all.find(s => s.plan.id === "yettel_rs_prepaid_25gb");
    if (days <= 15 && prepaid) {
      return `Yettel Prepaid 25 GB covers your ${days}-day trip for just €${prepaid.plan.price_eur} — the most affordable option with full online activation before arrival.`;
    }
    if (days > 15 && days <= 30 && yettel) {
      return `For ${days} days, Yettel Unlimited eSIM (€${yettel.plan.price_eur}/30d) gives unlimited data vs. buying two 15-day plans — and you only need to activate once.`;
    }
  }

  if (country === "DE") {
    return `Germany requires KYC for all SIMs — the bottleneck is identity verification, not eSIM delivery. Plan for 1–2 days activation delay. Hotel addresses are often accepted for VideoIdent.`;
  }

  if (country === "AL") {
    return `Airport purchase at TIA is the most reliable Albania path. Remote online purchase attempts often fail. Plan to buy on arrival — takes ~5 minutes with your passport.`;
  }

  if (best.purchases === 1) {
    return `${bp.title} covers your full ${days}-day trip in a single purchase at €${best.total_cost}.`;
  }

  if (best.needs_repurchase) {
    return `${bp.title} is non-renewable — you'll need ${best.purchases} separate purchases for ${days} days. Consider a longer plan to avoid repeated activations.`;
  }

  return `${bp.title} (${bp.duration_days}d) needs ${best.purchases} renewals totaling €${best.total_cost} for your ${days}-day trip.`;
}

function buildTravelEsimComparison(local: ScoredPlan, country: CountryCode): TravelEsimComparison | null {
  const travel = TRAVEL_ESIMS.filter(t => t.country === country);
  if (!travel.length) return null;

  // Find the cheapest travel eSIM with reasonable data
  const sorted = [...travel].sort((a, b) => a.price_eur - b.price_eur);
  const t = sorted[0];

  const local_data = local.total_data_gb;
  const travel_data = t.data_gb;

  const local_saves_eur = parseFloat((t.price_eur - local.total_cost).toFixed(2));
  const local_saves_pct = t.price_eur > 0
    ? Math.round(((t.price_eur - local.total_cost) / t.price_eur) * 100)
    : 0;

  const local_data_ratio = (local_data && travel_data && travel_data > 0)
    ? parseFloat((local_data / travel_data).toFixed(1))
    : 0;

  let verdict: string;
  let verdict_detail: string;

  if (local_saves_eur > 0 && local_data_ratio > 1) {
    verdict = `Local SIM saves ${local_saves_pct}% and gives ${local_data_ratio}× more data`;
    verdict_detail = `${local.plan.title} at €${local.total_cost} vs ${t.provider} at €${t.price_eur}. Local gives ${local_data !== null ? local_data + " GB" : "unlimited"} vs ${t.data_gb} GB — plus a real local phone number.`;
  } else if (local_saves_eur > 0) {
    verdict = `Local SIM saves €${local_saves_eur} (${local_saves_pct}%)`;
    verdict_detail = `${local.plan.title} at €${local.total_cost} vs ${t.provider} at €${t.price_eur}. Local SIM includes a real local number.`;
  } else if (local.plan.friction_score <= 2) {
    verdict = `Local SIM: same price, easier than you think`;
    verdict_detail = `${local.plan.title} at €${local.total_cost} costs similar to ${t.provider} but includes a real local number and much more data.`;
  } else {
    verdict = `Travel eSIM is faster, local SIM is better value`;
    verdict_detail = `${t.provider} (€${t.price_eur}) is instant with no setup. But ${local.plan.title} at €${local.total_cost} gives ${local_data !== null ? local_data + " GB" : "unlimited"} data with a real local number.`;
  }

  return { travel_option: t, local_option: local, local_saves_eur, local_saves_pct, local_data_ratio, verdict, verdict_detail };
}

export function getRecommendations(country: CountryCode, days: number, prefs: Set<PrefId>): ComparisonResult {
  const countryPlans = PLANS.filter(p => p.country === country);
  const all_scored = countryPlans
    .map(p => scorePlan(p, days, prefs))
    .sort((a, b) => b.score - a.score);

  const best_overall = all_scored[0];
  const shown = new Set([best_overall.plan.id]);

  function pickBest(sorted: ScoredPlan[]): ScoredPlan | null {
    const pick = sorted.find(s => !shown.has(s.plan.id));
    if (pick) shown.add(pick.plan.id);
    return pick || null;
  }

  const cheapest = pickBest([...all_scored].sort((a, b) => a.total_cost - b.total_cost));
  const easiest = pickBest([...all_scored].sort((a, b) => a.plan.friction_score - b.plan.friction_score));
  const best_esim = pickBest(
    [...all_scored].filter(s => s.plan.esim_supported && s.plan.activation_before_arrival)
      .sort((a, b) => b.score - a.score)
  );
  const best_long_term = pickBest([...all_scored].sort((a, b) => b.plan.renewable ? 1 : -1));
  const best_roaming = pickBest(
    [...all_scored].filter(s => s.plan.western_balkans_roaming)
      .sort((a, b) => b.plan.roaming_cap_gb - a.plan.roaming_cap_gb)
  );

  const optimizer_message = buildOptimizerMessage(best_overall, all_scored, days, country);
  const travel_esim_comparison = buildTravelEsimComparison(best_overall, country);

  return {
    best_overall,
    cheapest,
    easiest,
    best_esim,
    best_long_term,
    best_roaming,
    all_scored,
    optimizer_message,
    travel_esim_comparison,
  };
}

export function getPlansByCountry(country: CountryCode): Plan[] {
  return PLANS.filter(p => p.country === country);
}

export function getOperator(id: string) {
  return OPERATORS[id];
}