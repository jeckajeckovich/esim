export type RoamVal = "yes" | "limited" | "no";

export const ROAMING_MATRIX: Record<string, Record<string, RoamVal>> = {
  RS: { RS: "yes", BA: "no", ME: "no", AL: "no", MK: "no" },
  ME: { RS: "yes", BA: "yes", ME: "yes", AL: "limited", MK: "yes" },
  AL: { RS: "no", BA: "no", ME: "limited", AL: "yes", MK: "no" },
  BA: { RS: "yes", BA: "yes", ME: "yes", AL: "limited", MK: "yes" },
  MK: { RS: "yes", BA: "yes", ME: "yes", AL: "limited", MK: "yes" },
  DE: { RS: "no", BA: "no", ME: "no", AL: "no", MK: "no" },
};

export const ROAMING_NOTES: Record<string, Record<string, string>> = {
  RS: {
    RS: "All Serbian plans work domestically",
    BA: "No Serbian tourist plan includes WB roaming to Bosnia",
    ME: "No Serbian tourist plan includes WB roaming. Yettel Transit has 500 MB EU roaming only (not WB)",
    AL: "No WB roaming from Serbian plans",
    MK: "No Serbian tourist plan includes WB roaming to North Macedonia",
  },
  ME: {
    RS: "One Tourist 15: 8.5 GB · One Tourist 20: 11 GB · One Tourist 25: 13.5 GB WB roaming · m:tel Tourist: 5–8 GB WB",
    BA: "One Tourist 20: 11 GB · One Tourist 25: 13.5 GB WB roaming includes Bosnia",
    ME: "Full domestic coverage",
    AL: "Limited — Albania coverage not guaranteed on all WB roaming plans. Verify before travel.",
    MK: "One Tourist 20: 11 GB · One Tourist 25: 13.5 GB WB roaming includes N. Macedonia",
  },
  BA: {
    RS: "BH Telecom tourist eSIM includes WB roaming to Serbia",
    BA: "Full domestic coverage",
    ME: "BH Telecom tourist eSIM includes WB roaming to Montenegro",
    AL: "Limited — Albania not guaranteed",
    MK: "BH Telecom tourist eSIM includes WB roaming to N. Macedonia",
  },
  MK: {
    RS: "A1 Roam Surf Balkan S (2 GB, €4.82) or L (5 GB, €8.05) add-on covers WB including Serbia",
    BA: "A1 Roam Surf Balkan add-on covers Bosnia",
    ME: "A1 Roam Surf Balkan add-on covers Montenegro",
    AL: "Limited — Albania not guaranteed in WB roaming add-on",
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

export const MATRIX_CC = ["RS", "BA", "ME", "AL", "MK"] as const;