# ADViora Leads Operations Dashboard — Verification Guide

## 1. Automated Verification Checks

To run the automated verification suite:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Linter
npm run lint

# 3. Unit & Integration Tests (Outside production with synthetic fixtures)
npm test

# 4. Production Build Validation
npm run build

# 5. Git Diff & Hygiene Check
git diff --check
```

---

## 2. Test Suite Coverage

The automated test suite (`tests/leads.test.mjs`) validates:

1. **Attribution Evidence Classification**:
   - Touchpoints with direct UTM tags (`utm_source`, `utm_medium`, etc.) are classified as `Attributed`.
   - Touchpoints with only click IDs (`gclid`, `fbclid`, `fbc`) are classified as `Attributed`.
   - Touchpoints with only platform/campaign IDs (`campaignid`, `adgroupid`) are classified as `Attributed`.
   - Touchpoints with only `utm_content` or `utm_term` are classified as `Attributed`.
   - Touchpoints with only browser cookie IDs (`fbp`) or hardware types (`device`) are classified as `Unattributed`.
2. **Same-Touchpoint Combined Filtering**:
   - Asserts that a combined filter (e.g. `utm_source=google` AND `utm_medium=cpc`) requires both values to match on the **exact same touchpoint document**, rather than matching across two separate touchpoints belonging to the same user.
3. **Date Range Boundaries & Timezone (Asia/Kolkata)**:
   - Evaluates half-open intervals `[startOfDayIST, nextDayStartIST)`.
   - Asserts midnight conversions to exact UTC boundaries.
   - Validates that custom date ranges reject reversed or malformed dates.
4. **All Time Metrics**:
   - Asserts that when `All Time` is selected, `Returning Leads` returns `'N/A'`.
5. **CSV Formula Injection Neutralization**:
   - Verifies that cells beginning with `=`, `+`, `-`, `@`, `\t`, `\r`, or `|` (even after leading ASCII spaces or control characters) are prepended with `'` and enclosed in RFC 4180 quotes.
6. **Phone Masking**:
   - Asserts that 10-digit phone numbers are masked for overview privacy: `+91 98XXX XX210`.
7. **Database Safety & Read-Only Guarantees**:
   - Dynamic database name parsing from `MONGODB_URI`.
   - Models configured with `autoIndex: false` and `autoCreate: false`.
   - Sanitized HTTP 503 response when `MONGODB_URI` is unconfigured.
