export const WESTERN_BALKANS = ["RS", "ME", "BA", "AL", "MK"] as const;

export const EU_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE",
  "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
  "RO", "SK", "SI", "ES", "SE",
] as const;

export function isWesternBalkans(code: string) {
  return WESTERN_BALKANS.includes(code as any);
}

export function isEU(code: string) {
  return EU_COUNTRIES.includes(code as any);
}