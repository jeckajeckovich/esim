#!/usr/bin/env node
// SimRoam — Data & Route Logic Audit
// ====================================
// Usage:  node scripts/audit-simroam.mjs
//         npm run audit
//
// Checks:
//   1.  Data file loading
//   2.  Duplicate IDs
//   3.  Cross-reference integrity (plans → operators, plans → countries)
//   4.  Missing required fields on plans
//   5.  Data quality signals (confidence, verification, source URLs)
//   6.  EU vs domestic roaming field consistency
//   7.  Route-type classification sanity
//   8.  Recommendation logic gates (pure_eu, pure_balkans, mixed)
//
// Outputs:  ✅ OK  ⚠ WARNING  ❌ ERROR  🔎 NEEDS VERIFICATION
// Exit code: 0 = no errors, 1 = errors found

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");

// ─── Counters ─────────────────────────────────────────────────────────────────
let errors   = 0;
let warnings = 0;
let needsVer = 0;
let passed   = 0;

function ok(msg)    { console.log(`  ✅ ${msg}`);        passed++;   }
function warn(msg)  { console.log(`  ⚠  ${msg}`);        warnings++; }
function err(msg)   { console.log(`  ❌ ${msg}`);         errors++;   }
function needs(msg) { console.log(`  🔎 ${msg}`);         needsVer++; }
function section(title) { console.log(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`); }

// ─── Load data files ──────────────────────────────────────────────────────────
section("1. DATA FILE LOADING");

let plans, operators, countries;

function loadJSON(relPath) {
  const full = join(ROOT, relPath);
  try {
    const raw = readFileSync(full, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    err(`Cannot load ${relPath}: ${e.message}`);
    return null;
  }
}

plans     = loadJSON("app/data/plans.json");
operators = loadJSON("app/data/operators.json");
countries = loadJSON("app/data/countries.json");

if (!plans)     { err("plans.json failed to load — stopping");     process.exit(1); }
if (!operators) { err("operators.json failed to load — stopping"); process.exit(1); }
if (!countries) { err("countries.json failed to load — stopping"); process.exit(1); }

ok(`plans.json loaded — ${plans.length} plans`);
ok(`operators.json loaded — ${Object.keys(operators).length} operators`);
ok(`countries.json loaded — ${Object.keys(countries).length} countries`);

// ─── 2. DUPLICATE IDs ─────────────────────────────────────────────────────────
section("2. DUPLICATE IDs");

const planIds = plans.map(p => p.id);
const dupeplanIds = planIds.filter((id, i) => planIds.indexOf(id) !== i);
const uniq = new Set(dupeplanIds);
if (uniq.size > 0) {
  for (const id of uniq) err(`Duplicate plan ID: "${id}"`);
} else {
  ok("No duplicate plan IDs");
}

const opIds   = Object.keys(operators);
const dupeOps = opIds.filter((id, i) => opIds.indexOf(id) !== i);
if (dupeOps.length > 0) {
  for (const id of dupeOps) err(`Duplicate operator key: "${id}"`);
} else {
  ok("No duplicate operator IDs");
}

const ccIds   = Object.keys(countries);
const dupeCCs = ccIds.filter((id, i) => ccIds.indexOf(id) !== i);
if (dupeCCs.length > 0) {
  for (const id of dupeCCs) err(`Duplicate country key: "${id}"`);
} else {
  ok("No duplicate country codes");
}

// ─── 3. CROSS-REFERENCE INTEGRITY ────────────────────────────────────────────
section("3. CROSS-REFERENCE INTEGRITY");

// Plans → operators
const missingOps = new Set();
for (const plan of plans) {
  const opId = plan.operator_id;
  if (!opId) { err(`Plan "${plan.id}" has no operator_id`); continue; }
  if (!operators[opId]) missingOps.add(opId);
}
if (missingOps.size === 0) {
  ok("All plan operator_ids exist in operators.json");
} else {
  for (const id of missingOps) err(`operator_id "${id}" referenced in plans but missing from operators.json`);
}

// Plans → countries (allow "EU" and "GLOBAL" as special pseudo-countries)
const PSEUDO_COUNTRIES = new Set(["EU", "GLOBAL"]);
const missingCCs = new Set();
for (const plan of plans) {
  const cc = plan.country_code;
  if (!cc) { err(`Plan "${plan.id}" has no country_code`); continue; }
  if (!PSEUDO_COUNTRIES.has(cc) && !countries[cc]) missingCCs.add(cc);
}
if (missingCCs.size === 0) {
  ok("All plan country_codes exist in countries.json");
} else {
  for (const cc of missingCCs) err(`country_code "${cc}" referenced in plans but missing from countries.json`);
}

// Countries → operators (ops[] list)
let brokenOpLinks = 0;
for (const [cc, country] of Object.entries(countries)) {
  for (const opId of (country.ops || [])) {
    if (!operators[opId]) {
      err(`Country "${cc}" ops list references missing operator "${opId}"`);
      brokenOpLinks++;
    }
  }
}
if (brokenOpLinks === 0) ok("All country ops[] lists reference valid operators");

// Operators → countries (country_code field)
let orphanOps = 0;
for (const [opId, op] of Object.entries(operators)) {
  const cc = op.country_code || op.country;
  if (cc && !PSEUDO_COUNTRIES.has(cc) && !countries[cc]) {
    warn(`Operator "${opId}" has country_code "${cc}" which is not in countries.json`);
    orphanOps++;
  }
}
if (orphanOps === 0) ok("All operator country_codes are valid");

// ─── 4. MISSING REQUIRED FIELDS ───────────────────────────────────────────────
section("4. MISSING REQUIRED PLAN FIELDS");

const REQUIRED_PLAN_FIELDS = [
  "id", "operator_id", "country_code", "operator_type", "plan_category",
  "provider_name", "title", "price_eur", "duration_days",
  "source_url", "last_verified", "data_confidence",
  "western_balkans_roaming", "eu_roaming"
];

let totalMissing = 0;
for (const plan of plans) {
  for (const field of REQUIRED_PLAN_FIELDS) {
    if (plan[field] === undefined || plan[field] === null) {
      err(`Plan "${plan.id}" missing required field: "${field}"`);
      totalMissing++;
    }
  }
}
if (totalMissing === 0) ok("All plans have required fields");

// ─── 5. DATA QUALITY: PRICING ─────────────────────────────────────────────────
section("5. PRICING QUALITY");

let pricingOk = true;
for (const plan of plans) {
  if (!plan.price_eur || plan.price_eur <= 0) {
    err(`Plan "${plan.id}" has missing or zero price_eur: ${plan.price_eur}`);
    pricingOk = false;
  }
  if (plan.duration_days === undefined || plan.duration_days <= 0) {
    err(`Plan "${plan.id}" has missing or invalid duration_days: ${plan.duration_days}`);
    pricingOk = false;
  }
}
if (pricingOk) ok("All plans have valid price_eur and duration_days");

// ─── 6. DATA QUALITY: DATA ALLOWANCE ─────────────────────────────────────────
section("6. DATA ALLOWANCE QUALITY");

let dataOk = true;
for (const plan of plans) {
  const hasCore   = plan.data_gb_core !== undefined && plan.data_gb_core !== null;
  const hasGb     = plan.data_gb     !== undefined && plan.data_gb     !== null;
  const isUnlim   = plan.unlimited_data === true;

  // Must have at least one data field
  if (!hasCore && !hasGb && !isUnlim) {
    err(`Plan "${plan.id}" has no data field (data_gb_core, data_gb, or unlimited_data=true)`);
    dataOk = false;
  }

  // Unlimited plans should have a fair-use or roaming cap note
  if (isUnlim && !plan.roaming_cap_gb && !plan.fair_use_policy && !plan.warnings?.length) {
    warn(`Plan "${plan.id}" is unlimited_data but has no roaming_cap_gb, fair_use_policy, or warnings`);
  }

  // Plans with domestic data but eu_roaming=true should have a roaming_cap_gb
  if (plan.eu_roaming === true && !plan.roaming_cap_gb) {
    warn(`Plan "${plan.id}" has eu_roaming=true but no roaming_cap_gb — domestic data ≠ EU roaming`);
  }

  // Plans with eu_roaming=true and roaming_cap_gb=0 is suspicious
  if (plan.eu_roaming === true && plan.roaming_cap_gb === 0) {
    warn(`Plan "${plan.id}" has eu_roaming=true but roaming_cap_gb=0 — likely a data entry error`);
  }

  // Local operator with EU member country_code should have explicit eu_roaming field
  if (plan.plan_category === "local_operator" && plan.eu_roaming === undefined) {
    warn(`Plan "${plan.id}" (local_operator) missing eu_roaming field`);
  }
}
if (dataOk) ok("All plans have at least one data field");

// ─── 7. SOURCE & VERIFICATION QUALITY ────────────────────────────────────────
section("7. SOURCE & VERIFICATION QUALITY");

const VALID_CONFIDENCE = new Set([
  "verified_official", "verified_manual", "community_verified",
  "provider_listed", "price_snapshot", "needs_review"
]);
const VALID_CATEGORIES = new Set([
  "local_operator", "travel_esim", "roaming_bundle", "balkans_roaming", "eu_nomad"
]);

for (const plan of plans) {
  // Invalid confidence
  if (!VALID_CONFIDENCE.has(plan.data_confidence)) {
    err(`Plan "${plan.id}" has invalid data_confidence: "${plan.data_confidence}"`);
  }

  // Invalid plan_category
  if (plan.plan_category && !VALID_CATEGORIES.has(plan.plan_category)) {
    err(`Plan "${plan.id}" has invalid plan_category: "${plan.plan_category}"`);
  }

  // verified=true without source_url is a contradiction
  if (plan.verified === true && !plan.source_url?.trim()) {
    err(`Plan "${plan.id}" is verified=true but has no source_url`);
  }

  // Missing last_verified
  if (!plan.last_verified?.trim()) {
    warn(`Plan "${plan.id}" missing last_verified`);
  }

  // needs_review plans should have at least one warning
  if (plan.data_confidence === "needs_review" && (!plan.warnings || plan.warnings.length === 0)) {
    warn(`Plan "${plan.id}" is needs_review but has no warnings array`);
  }

  // needs_review plans — flag for attention
  if (plan.data_confidence === "needs_review") {
    needs(`Plan "${plan.id}" is needs_review — verify before surfacing to users`);
  }
}

// Operators with seed status but empty source_url
let seedNoUrl = 0;
for (const [opId, op] of Object.entries(operators)) {
  if (op.research_status === "seed" && !op.source_url?.trim()) {
    warn(`Operator "${opId}" (seed) has no source_url`);
    seedNoUrl++;
  }
  if (!op.research_status) {
    warn(`Operator "${opId}" missing research_status field`);
  }
}
if (seedNoUrl === 0) ok("All seed operators have source_url");

// ─── 8. EU ROAMING ZONE CONSISTENCY ─────────────────────────────────────────
section("8. EU ROAMING ZONE CONSISTENCY");

// EU member states — must match EU_ROAMING_ZONE in page.tsx exactly
const EU_ROAMING_ZONE = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI",
  "FR","DE","GR","HU","IE","IT","LV","LT","LU",
  "MT","NL","PL","PT","RO","SK","SI","ES","SE",
]);
const WB_ALL           = new Set(["RS","BA","ME","AL","MK"]);
const WB_ROAMING_CAPABLE = new Set(["RS","ME","BA","MK"]); // AL excluded

// Local operator plans in EU countries should have eu_roaming=true
// (prepaid in EU must include EU roaming by regulation)
let euMemberNoRoaming = 0;
for (const plan of plans) {
  if (
    plan.plan_category === "local_operator" &&
    EU_ROAMING_ZONE.has(plan.country_code) &&
    plan.eu_roaming !== true
  ) {
    warn(`Plan "${plan.id}" (local_operator in EU country ${plan.country_code}) has eu_roaming != true — EU prepaid must include roaming`);
    euMemberNoRoaming++;
  }
}
if (euMemberNoRoaming === 0) ok("All EU local_operator plans have eu_roaming=true");

// Balkans plans should not have eu_roaming=true (unless explicitly a crossover plan)
for (const plan of plans) {
  if (
    WB_ALL.has(plan.country_code) &&
    plan.plan_category === "local_operator" &&
    plan.eu_roaming === true
  ) {
    warn(`Plan "${plan.id}" is a Balkans local_operator but has eu_roaming=true — verify this is intentional`);
  }
}

// Travel eSIM snapshots should have western_balkans_roaming=false
for (const plan of plans) {
  if (plan.plan_category === "travel_esim" && plan.western_balkans_roaming === true) {
    warn(`Plan "${plan.id}" is travel_esim but has western_balkans_roaming=true — unlikely to be correct`);
  }
}

ok("EU roaming zone consistency check completed");

// ─── 9. ROUTE CLASSIFICATION SANITY TESTS ────────────────────────────────────
section("9. ROUTE CLASSIFICATION LOGIC");

function classifyRoute(countries) {
  if (countries.length <= 1) return "single";
  const allEU     = countries.every(c => EU_ROAMING_ZONE.has(c));
  const allBalkan = countries.every(c => WB_ALL.has(c));
  const hasEU     = countries.some(c => EU_ROAMING_ZONE.has(c));
  const hasBalkan = countries.some(c => WB_ALL.has(c));
  if (allEU)              return "pure_eu";
  if (allBalkan)          return "pure_balkans";
  if (hasEU && hasBalkan) return "mixed_eu_balkans";
  return "mixed_complex";
}

// Scoring simulation — mirrors page.tsx useTripSim logic
function scoreStrategies(countries, days) {
  const routeType = classifyRoute(countries);
  const allBalkan = routeType === "pure_balkans";
  const allEU     = routeType === "pure_eu";
  const multi     = countries.length > 1;
  const hasWbCap  = countries.some(c => WB_ROAMING_CAPABLE.has(c));

  // Local score
  let local = 50;
  local -= (days / 14) * 5;  // rough cost proxy
  if (multi) local -= 10;
  if (allEU && multi) local -= 35;          // hard EU gate
  if (allBalkan && multi && hasWbCap) local += 8;

  // Nomad score
  const nomadApplicable = countries.every(c => EU_ROAMING_ZONE.has(c));
  let nomad = nomadApplicable ? 50 : 10;
  if (nomadApplicable && multi) nomad += 18;
  if (allEU && multi && nomadApplicable) nomad += 25;  // EU route boost
  if (allBalkan) nomad -= 60;

  // Travel eSIM score
  let travel = 65;  // 50 + 15 instant activation bonus
  if (multi && allEU) travel += 8;
  if (routeType === "mixed_eu_balkans") travel += 10;

  // WB roaming strategy (pure_balkans only)
  let wbRoaming = null;
  if (allBalkan && multi && hasWbCap) {
    wbRoaming = 60;
    const coveredRatio = countries.filter(c => WB_ROAMING_CAPABLE.has(c)).length / countries.length;
    wbRoaming += coveredRatio >= 1 ? 20 : coveredRatio >= 0.75 ? 8 : 0;
    if (countries.includes("AL")) wbRoaming -= 15;
    if (days <= 15) wbRoaming += 10;
  }

  const scores = { local: Math.round(local), nomad: Math.round(nomad), travel: Math.round(travel) };
  if (wbRoaming !== null) scores["wb_roaming"] = Math.round(wbRoaming);

  // Winner
  let winner = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  return { routeType, winner, scores };
}

const ROUTE_TESTS = [
  {
    id: "A",
    label: "ES → RO → MT",
    countries: ["ES","RO","MT"],
    days: 21,
    expectedRouteType: "pure_eu",
    rules: [
      {
        desc: "route_type must be pure_eu",
        check: r => r.routeType === "pure_eu",
        level: "error",
      },
      {
        desc: "local_per_country must NOT be recommended (score must be lower than EU alternatives)",
        check: r => r.scores.local < Math.max(r.scores.nomad, r.scores.travel),
        level: "error",
      },
      {
        desc: "EU roaming option (nomad or travel) should win",
        check: r => r.winner === "nomad" || r.winner === "travel",
        level: "error",
      },
    ],
  },
  {
    id: "B",
    label: "RS → ME → BA",
    countries: ["RS","ME","BA"],
    days: 14,
    expectedRouteType: "pure_balkans",
    rules: [
      {
        desc: "route_type must be pure_balkans",
        check: r => r.routeType === "pure_balkans",
        level: "error",
      },
      {
        desc: "WB roaming strategy should be considered (wb_roaming score should exist)",
        check: r => r.scores.wb_roaming !== undefined,
        level: "warning",
      },
      {
        desc: "WB roaming or travel eSIM should win (not plain local-per-country)",
        check: r => r.winner !== "local",
        level: "warning",
      },
    ],
  },
  {
    id: "C",
    label: "RS → HU → DE",
    countries: ["RS","HU","DE"],
    days: 14,
    expectedRouteType: "mixed_eu_balkans",
    rules: [
      {
        desc: "route_type must be mixed_eu_balkans",
        check: r => r.routeType === "mixed_eu_balkans",
        level: "error",
      },
      {
        desc: "nomad must NOT win (Orange Flex does not cover RS)",
        check: r => r.winner !== "nomad",
        level: "error",
      },
      {
        desc: "local score should be lower than travel eSIM for mixed route",
        check: r => r.scores.local < r.scores.travel,
        level: "warning",
      },
    ],
  },
  {
    id: "D",
    label: "DE → PL → FR",
    countries: ["DE","PL","FR"],
    days: 21,
    expectedRouteType: "pure_eu",
    rules: [
      {
        desc: "route_type must be pure_eu",
        check: r => r.routeType === "pure_eu",
        level: "error",
      },
      {
        desc: "local_per_country must NOT win",
        check: r => r.winner !== "local",
        level: "error",
      },
      {
        desc: "nomad should be competitive (nomad score > local score)",
        check: r => r.scores.nomad > r.scores.local,
        level: "warning",
      },
    ],
  },
  {
    id: "E",
    label: "RS → AL → ME",
    countries: ["RS","AL","ME"],
    days: 7,
    expectedRouteType: "pure_balkans",
    rules: [
      {
        desc: "route_type must be pure_balkans (AL should not reclassify as mixed)",
        check: r => r.routeType === "pure_balkans",
        level: "error",
      },
      {
        desc: "Albania penalty should reduce wb_roaming score but not eliminate it",
        check: r => r.scores.wb_roaming !== undefined && r.scores.wb_roaming > 0,
        level: "warning",
      },
      {
        desc: "nomad must NOT win (Balkans route)",
        check: r => r.winner !== "nomad",
        level: "error",
      },
    ],
  },
];

for (const test of ROUTE_TESTS) {
  console.log(`\n  Route ${test.id}: ${test.label}`);
  const result = scoreStrategies(test.countries, test.days);
  console.log(`    Route type: ${result.routeType}  |  Winner: ${result.winner}`);
  const scoreStr = Object.entries(result.scores).map(([k,v]) => `${k}=${v}`).join(", ");
  console.log(`    Scores: ${scoreStr}`);

  for (const rule of test.rules) {
    let passes;
    try { passes = rule.check(result); } catch { passes = false; }

    if (passes) {
      ok(rule.desc);
    } else if (rule.level === "error") {
      err(`FAIL: ${rule.desc}`);
    } else {
      warn(`SOFT FAIL: ${rule.desc}`);
    }
  }
}

// ─── 10. ADDITIONAL ROUTE EDGE CASES ─────────────────────────────────────────
section("10. ROUTE EDGE CASES");

// Single-country routes
const singleEU = classifyRoute(["DE"]);
singleEU === "single" ? ok(`Single country DE → "single" ✓`) : err(`Single DE should be "single", got "${singleEU}"`);

// Non-EU, non-Balkans country
const mixedComplex = classifyRoute(["RS","JP"]);
mixedComplex === "mixed_complex" ? ok(`RS+JP → "mixed_complex" ✓`) : err(`RS+JP should be "mixed_complex", got "${mixedComplex}"`);

// All 27 EU members should classify as pure_eu
const allEU27 = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"];
const route27 = classifyRoute(allEU27);
route27 === "pure_eu" ? ok(`All 27 EU members → "pure_eu" ✓`) : err(`All 27 EU → should be "pure_eu", got "${route27}"`);

// Albania alone
const alOnly = classifyRoute(["AL"]);
alOnly === "single" ? ok(`Albania single → "single" ✓`) : err(`AL single should be "single", got "${alOnly}"`);

// Albania + Serbia
const alrs = classifyRoute(["AL","RS"]);
alrs === "pure_balkans" ? ok(`AL+RS → "pure_balkans" ✓`) : err(`AL+RS should be "pure_balkans", got "${alrs}"`);

// ─── 11. PLAN CATEGORY DISTRIBUTION ─────────────────────────────────────────
section("11. PLAN CATEGORY DISTRIBUTION");

const catCounts = {};
for (const plan of plans) {
  const c = plan.plan_category || "unknown";
  catCounts[c] = (catCounts[c] || 0) + 1;
}
for (const [cat, count] of Object.entries(catCounts)) {
  console.log(`  ${VALID_CATEGORIES.has(cat) ? "✅" : "❌"} ${cat}: ${count} plan${count !== 1 ? "s" : ""}`);
  if (!VALID_CATEGORIES.has(cat)) errors++;
}

const confCounts = {};
for (const plan of plans) {
  const c = plan.data_confidence || "missing";
  confCounts[c] = (confCounts[c] || 0) + 1;
}
console.log("\n  Data confidence distribution:");
for (const [conf, count] of Object.entries(confCounts)) {
  const valid = VALID_CONFIDENCE.has(conf);
  const level = conf === "needs_review" ? "🔎" : valid ? "✅" : "❌";
  console.log(`  ${level} ${conf}: ${count}`);
  if (!valid) errors++;
}

// ─── FINAL SUMMARY ────────────────────────────────────────────────────────────
console.log(`
${"═".repeat(64)}
AUDIT SUMMARY
${"═".repeat(64)}
  ✅ Passed              : ${passed}
  ⚠  Warnings            : ${warnings}
  🔎 Needs verification  : ${needsVer}
  ❌ Errors              : ${errors}
${"═".repeat(64)}
`);

if (errors > 0) {
  console.log("  Fix all ❌ errors before deploying.\n");
  process.exit(1);
} else if (warnings > 0) {
  console.log("  No errors. Review ⚠ warnings before next data release.\n");
  process.exit(0);
} else {
  console.log("  All checks passed.\n");
  process.exit(0);
}
