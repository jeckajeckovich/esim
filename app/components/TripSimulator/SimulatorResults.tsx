"use client";
// app/components/TripSimulator/SimulatorResults.tsx
// ──────────────────────────────────────────────────
// Renders the three strategy result cards after the user runs the simulator.
// Shows: route summary, per-strategy header (label + cost), why text,
// meta grid (setup / roaming / tradeoffs), CTA links.
//
// Props intentionally avoid importing from page.tsx:
// - strategically-typed SimStrategy (via ./types)
// - countryFlags: a [CountryCode, flag] map for the route summary
// - onGoSingle: callback for "All plans →" deep-dive (local strategy only)

import React from "react";
import type { Lang, CountryCode, SimStrategy, SimUsage, SimT } from "./types";

const LINK_PATH =
  "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3";

interface SimulatorResultsProps {
  strategies: SimStrategy[];
  simCountries: CountryCode[];
  simDays: number;
  simUsage: SimUsage;
  eSIMOnly: boolean;
  needNumber: boolean;
  lang: Lang;
  t: SimT;
  countryFlags: Record<string, string>;    // code → flag emoji
  countryNames: Record<string, string>;    // code → display name
  onGoSingle: (code: CountryCode, days: number) => void;
}

function strategyColor(s: SimStrategy): string {
  return s.id === "local" ? "#2563eb" : s.id === "nomad" ? "#4f46e5" : "#78350f";
}
function strategyBg(s: SimStrategy): string {
  return s.id === "local" ? "#eff6ff" : s.id === "nomad" ? "#eef2ff" : "#fffbeb";
}
function strategyBorder(s: SimStrategy): string {
  return s.id === "local" ? "#93c5fd" : s.id === "nomad" ? "#818cf8" : "#fcd34d";
}

function complexityLabel(c: SimStrategy["setupComplexity"], isRu: boolean): string {
  if (c === "easy")     return isRu ? "Легко"    : "Easy";
  if (c === "moderate") return isRu ? "Умеренно" : "Moderate";
  return isRu ? "Сложно" : "Complex";
}

export function SimulatorResults({
  strategies,
  simCountries,
  simDays,
  simUsage,
  eSIMOnly,
  needNumber,
  lang,
  t,
  countryFlags,
  countryNames,
  onGoSingle,
}: SimulatorResultsProps) {
  const isRu = lang === "ru";

  const usageText =
    simUsage === "light"  ? (isRu ? "лёгкое"  : "light")  :
    simUsage === "medium" ? (isRu ? "среднее" : "medium") :
                             (isRu ? "активное" : "heavy");

  return (
    <div style={{ marginTop: "2rem" }}>
      {/* Route summary row */}
      <div
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 600, color: "#0f1117" }}>
          {simCountries.map(c => countryFlags[c] ?? c).join(" → ")}
        </span>
        <span>·</span>
        <span>
          {simDays} {isRu ? "дн." : "days"}
        </span>
        <span>·</span>
        <span>
          {usageText} {isRu ? "использование" : "usage"}
        </span>
        {needNumber && (
          <>
            <span>·</span>
            <span>{isRu ? "нужен номер" : "need number"}</span>
          </>
        )}
        {eSIMOnly && (
          <>
            <span>·</span>
            <span>eSIM only</span>
          </>
        )}
      </div>

      {/* Strategy cards */}
      {strategies.map(s => (
        <div
          key={`${s.id}-${s.label}`}
          style={{
            background: s.applicable
              ? s.isRecommended
                ? strategyBg(s)
                : "#ffffff"
              : "#f9fafb",
            border: `${s.isRecommended ? 2 : 1}px solid ${
              s.applicable ? strategyBorder(s) : "#e0e3ea"
            }`,
            borderRadius: 12,
            padding: "1.125rem 1.25rem",
            marginBottom: 10,
            opacity: s.applicable ? 1 : 0.7,
          }}
        >
          {/* Card header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div>
              {s.isRecommended && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: strategyColor(s),
                    marginBottom: 3,
                  }}
                >
                  ✦ {t.sim_recommended}
                </div>
              )}
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: s.applicable ? "#0f1117" : "#6b7280",
                }}
              >
                {isRu ? s.labelRu : s.label}
              </div>
            </div>

            {s.applicable && (
              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                  marginLeft: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: strategyColor(s),
                  }}
                >
                  €{s.totalCost}
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>
                  {isRu ? s.costNoteRu : s.costNote}
                </div>
              </div>
            )}
          </div>

          {/* Not applicable reason */}
          {!s.applicable && (
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                fontStyle: "italic",
              }}
            >
              {isRu ? s.inapplicableReasonRu : s.inapplicableReason}
            </div>
          )}

          {/* Applicable: why + meta + CTAs */}
          {s.applicable && (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: "#374151",
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                {isRu ? s.whyRu : s.why}
              </div>

              {/* 3-cell meta grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                {[
                  {
                    label: isRu ? "Активация" : "Setup",
                    val: complexityLabel(s.setupComplexity, isRu),
                  },
                  {
                    label: isRu ? "Роуминг" : "Roaming",
                    val: isRu ? s.roamingNoteRu : s.roamingNote,
                  },
                  {
                    label: isRu ? "Что учесть" : "Tradeoffs",
                    val: isRu ? s.tradeoffsRu : s.tradeoffs,
                  },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    style={{
                      background: "#f2f4f8",
                      borderRadius: 8,
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "#9ca3af",
                        marginBottom: 3,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Travel eSIM price caveat */}
              {s.id === "travel" && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#92400e",
                    fontStyle: "italic",
                  }}
                >
                  ⚠ {t.sim_caveat_snapshot}
                </div>
              )}

              {/* Local single-country deep-dive */}
              {s.id === "local" && simCountries.length === 1 && (
                <button
                  className="btn-ghost"
                  style={{ marginTop: 8, fontSize: 11 }}
                  onClick={() => onGoSingle(simCountries[0], simDays)}
                >
                  {isRu
                    ? `Все тарифы — ${countryNames[simCountries[0]] ?? simCountries[0]} →`
                    : `All ${countryNames[simCountries[0]] ?? simCountries[0]} plans →`}
                </button>
              )}

              {/* Orange Flex link */}
              {s.id === "nomad" && (
                <a
                  href="https://flex.orange.pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-source"
                  style={{
                    marginTop: 8,
                    display: "inline-flex",
                    borderColor: "#c7d2fe",
                    background: "#eef2ff",
                    color: "#4f46e5",
                  }}
                >
                  <svg
                    width={11}
                    height={11}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    style={{ flexShrink: 0 }}
                  >
                    <path d={LINK_PATH} />
                  </svg>{" "}
                  Orange Flex →
                </a>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
