// app/components/TripSimulator/index.ts
// Barrel export for all Trip Simulator UI components.
// Import from here in page.tsx:
//   import { CountryPicker, TripConfigPanel, ... } from "@/components/TripSimulator";

export { CountryPicker }       from "./CountryPicker";
export { TripConfigPanel }     from "./TripConfigPanel";
export { SelectedCountries }   from "./SelectedCountries";
export { SimulatorResults }    from "./SimulatorResults";
export type {
  Lang,
  CountryCode,
  CountryMeta,
  SimStrategy,
  SimStrategyId,
  SimUsage,
  SimT,
} from "./types";
