"use client";
import React from "react";
import type { Lang, CountryCode, CountryMeta } from "./types";

interface SelectedCountriesProps {
  selected: CountryCode[];
  countriesMeta: Record<string, CountryMeta>;
  lang: Lang;
  onRemove: (code: CountryCode) => void;
}

export function SelectedCountries({ selected, countriesMeta, lang, onRemove }: SelectedCountriesProps) {
  const isRu = lang === "ru";

  if (selected.length === 0) {
    return (
      <div className="sim-empty-route">
        {isRu ? "Выберите страны слева" : "Select countries on the left"}
      </div>
    );
  }

  return (
    <div className="sim-route-list">
      {selected.map((code, i) => {
        const c = countriesMeta[code];
        if (!c) return null;
        return (
          <div key={code} className="sim-route-row selected-country-row">
            <span className="sim-route-arrow">{i > 0 ? "→" : "\u00a0"}</span>
            <span className="sim-route-flag">{c.flag}</span>
            <span className="sim-route-name">{isRu ? c.name_ru : c.name}</span>
            <button className="sim-route-remove" onClick={() => onRemove(code)} aria-label={`Remove ${c.name}`}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}