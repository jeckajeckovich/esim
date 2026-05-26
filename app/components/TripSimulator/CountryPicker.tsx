"use client";
import React from "react";
import type { Lang, CountryCode, CountryMeta } from "./types";

interface CountryPickerProps {
  allCountries: [CountryCode, CountryMeta][];
  selected: CountryCode[];
  lang: Lang;
  onToggle: (code: CountryCode) => void;
}

const ALERT_PATH =
  "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01";

export function CountryPicker({ allCountries, selected, lang, onToggle }: CountryPickerProps) {
  const isRu = lang === "ru";

  function badge(c: CountryMeta, isSeed: boolean, isSel: boolean): { text: string; cls: string } | null {
    if (isSeed) return { text: isRu ? "Скоро" : "Coming soon", cls: "sim-cc-badge sim-cc-badge-seed" };
    if ((c.tourist_ease ?? 0) >= 9 && !c.eu_member) return { text: isRu ? "Туристический" : "Tourist favorite", cls: isSel ? "sim-cc-badge sim-cc-badge-sel" : "sim-cc-badge" };
    if (c.research_status === "verified" || c.research_status === "verified_official") return { text: isRu ? "Проверено" : "Verified", cls: isSel ? "sim-cc-badge sim-cc-badge-sel" : "sim-cc-badge" };
    return null;
  }

  return (
    <div className="sim-left">
      <span className="field-label">
        {isRu ? "Страны маршрута" : "Countries you're visiting"}
      </span>

      <div className="sim-country-grid country-grid">
        {allCountries.map(([code, c]) => {
          const isSel  = selected.includes(code);
          const isSeed = c.research_status === "seed" || c.research_status === "needs_verification";
          const b = badge(c, isSeed, isSel);
          return (
            <button
              key={code}
              className={["sim-cc country-card", isSel ? "sim-cc-sel selected" : "", isSeed ? "sim-cc-seed" : ""].filter(Boolean).join(" ")}
              onClick={() => onToggle(code)}
              title={isSeed ? (isRu ? "Данные ожидают проверки" : "Plans pending verification") : undefined}
            >
              {isSel && (
                <span className="sim-cc-check" aria-hidden>
                  <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              <span className="sim-cc-flag">{c.flag}</span>
              <span className="sim-cc-code">{code}</span>
              <span className="sim-cc-name">{isRu ? c.name_ru : c.name}</span>
              {b && <span className={`${b.cls} country-badge`}>{b.text}</span>}
            </button>
          );
        })}
      </div>

      <div className="sim-seed-note">
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
          <path d={ALERT_PATH} />
        </svg>
        {isRu
          ? "Страны «Скоро» — исследуем тарифы. Данные появятся при верификации."
          : 'Countries marked "Coming soon" are being researched. Plans will appear once verified.'}
      </div>
    </div>
  );
}