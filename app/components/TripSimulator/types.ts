// app/components/TripSimulator/types.ts
// в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
// Shared types for TripSimulator components.
// These mirror the types in page.tsx вЂ” kept in sync manually.
// When page.tsx types evolve, update this file too.

export type Lang     = "en" | "ru";
export type SimUsage = "light" | "medium" | "heavy";

// Minimal CountryCode вЂ” extend when countries.json grows
export type CountryCode = string;

export type CountryMeta = {
  code: string;
  name: string;
  name_ru?: string;
  flag: string;
  region?: string;
  eu_member?: boolean;
  research_status?: string;
  tourist_ease?: number;
  tagline?: string;
  tagline_ru?: string;
  [key: string]: unknown;
};

export type SimStrategyId = "local" | "travel" | "nomad";

export interface SimStrategy {
  id: SimStrategyId;
  label: string;
  labelRu: string;
  totalCost: number;
  costNote: string;
  costNoteRu: string;
  score: number;
  isRecommended: boolean;
  why: string;
  whyRu: string;
  tradeoffs: string;
  tradeoffsRu: string;
  setupComplexity: "easy" | "moderate" | "complex";
  roamingNote: string;
  roamingNoteRu: string;
  applicable: boolean;
  inapplicableReason?: string;
  inapplicableReasonRu?: string;
}

// Minimal translation keys used by simulator components
export interface SimT {
  sim_title: string;
  sim_sub: string;
  sim_countries: string;
  sim_duration: string;
  sim_usage: string;
  sim_hotspot: string;
  sim_esim_only: string;
  sim_need_number: string;
  sim_yes: string;
  sim_no: string;
  sim_run: string;
  sim_recommended: string;
  sim_caveat_snapshot: string;
  back: string;
}
