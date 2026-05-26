"use client";
import React from "react";
import { SelectedCountries } from "./SelectedCountries";
import type { Lang, CountryCode, CountryMeta, SimUsage, SimT } from "./types";

const SEARCH_PATH = "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z";
const ALERT_PATH  = "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01";

interface TripConfigPanelProps {
  selected: CountryCode[];
  countriesMeta: Record<string, CountryMeta>;
  days: number;
  usage: SimUsage;
  hotspot: boolean;
  eSIMOnly: boolean;
  needNumber: boolean;
  lang: Lang;
  t: SimT;
  onRemoveCountry: (code: CountryCode) => void;
  onDaysChange: (d: number) => void;
  onUsageChange: (u: SimUsage) => void;
  onHotspotChange: (v: boolean) => void;
  onESIMOnlyChange: (v: boolean) => void;
  onNeedNumberChange: (v: boolean) => void;
  onRun: () => void;
}

const DURATIONS = [7, 14, 21, 30, 45, 60] as const;

export function TripConfigPanel({
  selected, countriesMeta, days, usage, hotspot, eSIMOnly, needNumber,
  lang, t, onRemoveCountry, onDaysChange, onUsageChange,
  onHotspotChange, onESIMOnlyChange, onNeedNumberChange, onRun,
}: TripConfigPanelProps) {
  const isRu = lang === "ru";

  const usageHint = {
    light:  isRu ? "Карты, сообщения — ~0.3 ГБ/день" : "Maps, messaging — ~0.3 GB/day",
    medium: isRu ? "Обычное использование — ~1 ГБ/день" : "Regular use — ~1 GB/day",
    heavy:  isRu ? "Видео, раздача — ~3+ ГБ/день" : "Video, hotspot — ~3+ GB/day",
  }[usage];

  const usageLabel = (u: SimUsage) =>
    u === "light"  ? (isRu ? "Лёгкое"  : "Light")  :
    u === "medium" ? (isRu ? "Среднее" : "Medium") :
                     (isRu ? "Активное" : "Heavy");

  const toggles = [
    { label: t.sim_hotspot,     val: hotspot,    onChange: onHotspotChange    },
    { label: t.sim_esim_only,   val: eSIMOnly,   onChange: onESIMOnlyChange   },
    { label: t.sim_need_number, val: needNumber, onChange: onNeedNumberChange },
  ];

  const hasSeedInRoute = selected.some(code => {
    const meta = countriesMeta[code];
    return meta?.research_status === "seed" || meta?.research_status === "needs_verification";
  });

  return (
    <div className="sim-right">
      <div className="sim-config-card trip-panel">
        <div className="sim-config-title">{isRu ? "Ваш маршрут" : "Your trip"}</div>

        <div className="trip-section">
          <SelectedCountries selected={selected} countriesMeta={countriesMeta} lang={lang} onRemove={onRemoveCountry} />
        </div>

        <div className="sim-config-divider" />

        <div className="trip-section">
          <span className="field-label">{t.sim_duration}</span>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {DURATIONS.map(d => (
              <button key={d} className={`dur-btn${days === d ? " selected" : ""}`} onClick={() => onDaysChange(d)}>
                {d}{isRu ? "д" : "d"}
              </button>
            ))}
          </div>
        </div>

        <div className="trip-section">
          <span className="field-label">{t.sim_usage}</span>
          <div style={{ display: "flex", gap: 5, marginBottom: 4 }}>
            {(["light", "medium", "heavy"] as SimUsage[]).map(u => (
              <button key={u} className={`dur-btn${usage === u ? " selected" : ""}`} style={{ flex: 1, fontSize: 12 }} onClick={() => onUsageChange(u)}>
                {usageLabel(u)}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{usageHint}</div>
        </div>

        <div className="trip-section">
          <div style={{ display: "flex", flexDirection: "column", marginBottom: "1.25rem" }}>
            {toggles.map(({ label, val, onChange }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #e8eaef" }}>
                <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
                <div style={{ display: "flex", gap: 3 }}>
                  {([false, true] as const).map(v => (
                    <button key={String(v)} onClick={() => onChange(v)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid", fontFamily: "inherit", fontSize: 11, cursor: "pointer", background: val === v ? "#0f1117" : "#ffffff", color: val === v ? "#ffffff" : "#4b5563", borderColor: val === v ? "#0f1117" : "#e0e3ea" }}>
                      {v ? t.sim_yes : t.sim_no}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary" disabled={selected.length === 0} onClick={onRun}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
            <path d={SEARCH_PATH} />
          </svg>
          {t.sim_run}
        </button>
      </div>

      {hasSeedInRoute && (
        <div className="sim-helper-note trip-note">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 1 }}>
            <path d={ALERT_PATH} />
          </svg>
          <span>
            {isRu
              ? "Для некоторых стран тарифы ещё проверяются. Скоро добавим лучшие варианты eSIM и местных тарифов."
              : "No tariffs yet for some countries. We're actively adding the best eSIM and local plans — check back soon."}
          </span>
        </div>
      )}
    </div>
  );
}