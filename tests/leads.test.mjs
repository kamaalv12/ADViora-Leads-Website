import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import modules under test
import { sanitizeCsvCell, buildCsvDocument, maskPhoneNumber } from '../server/utils/csv.ts';
import { getDatabaseNameFromUri, cleanMongoUri } from '../server/config/db.ts';
import { getDateRangeBounds, getPartsInIST, getMidnightIST } from '../server/utils/timezone.ts';
import {
  LeadsQuerySchema,
  LeadDetailParamsSchema,
  LeadDetailQuerySchema,
  FiltersSearchSchema,
} from '../server/validators/leads.validator.ts';
import {
  ATTRIBUTION_EVIDENCE_FIELDS,
  ALL_17_TRACKING_FIELDS,
  MAX_CSV_EXPORT_LIMIT,
  APP_TIMEZONE,
} from '../lib/constants.ts';

describe('CSV Safety & Formula Injection Neutralization', () => {
  it('neutralizes standard formula prefixes', () => {
    assert.strictEqual(sanitizeCsvCell('=1+1'), `"'=1+1"`);
    assert.strictEqual(sanitizeCsvCell('+SUM(A1:A10)'), `"'+SUM(A1:A10)"`);
    assert.strictEqual(sanitizeCsvCell('-5'), `"'-5"`);
    assert.strictEqual(sanitizeCsvCell('@admin'), `"'@admin"`);
    assert.strictEqual(sanitizeCsvCell('|cmd'), `"'|cmd"`);
  });

  it('neutralizes dangerous formula prefixes with leading whitespace or control characters', () => {
    assert.strictEqual(sanitizeCsvCell('   =cmd'), `"'   =cmd"`);
    assert.strictEqual(sanitizeCsvCell('\t+1234'), `"'\t+1234"`);
    assert.strictEqual(sanitizeCsvCell('\r-999'), `"'\r-999"`);
    assert.strictEqual(sanitizeCsvCell('  \x1b=danger'), `"'  \x1b=danger"`);
    assert.strictEqual(sanitizeCsvCell(' \t @SUM(B1:B5)'), `"' \t @SUM(B1:B5)"`);
  });

  it('leaves safe strings untouched while escaping RFC 4180 internal quotes', () => {
    assert.strictEqual(sanitizeCsvCell('John Doe'), `"John Doe"`);
    assert.strictEqual(sanitizeCsvCell('Jane "Special" Smith'), `"Jane ""Special"" Smith"`);
    assert.strictEqual(sanitizeCsvCell('info@example.com'), `"info@example.com"`);
    assert.strictEqual(sanitizeCsvCell(null), `""`);
    assert.strictEqual(sanitizeCsvCell(undefined), `""`);
  });

  it('builds RFC 4180 compliant CSV with UTF-8 BOM and strict single header row', () => {
    const headers = ['Name', 'Phone', 'Email'];
    const rows = [
      ['Alice', '9876543210', 'alice@example.com'],
      ['Bob', '9876543211', 'bob@example.com'],
    ];

    const csv = buildCsvDocument(headers, rows);

    // Verify UTF-8 BOM
    assert.ok(csv.startsWith('\uFEFF'));

    const lines = csv.slice(1).split('\r\n');
    assert.strictEqual(lines.length, 3);
    assert.strictEqual(lines[0], `"Name","Phone","Email"`);
    assert.strictEqual(lines[1], `"Alice","9876543210","alice@example.com"`);
    assert.strictEqual(lines[2], `"Bob","9876543211","bob@example.com"`);
  });
});

describe('Phone Masking for Privacy', () => {
  it('masks standard 10-digit Indian phone numbers', () => {
    assert.strictEqual(maskPhoneNumber('9876543210', '+91'), '+91 98XXX XX210');
    assert.strictEqual(maskPhoneNumber('8123456789', '+91'), '+91 81XXX XX789');
  });

  it('handles empty or short numbers gracefully', () => {
    assert.strictEqual(maskPhoneNumber(''), '—');
    assert.strictEqual(maskPhoneNumber(undefined), '—');
    assert.strictEqual(maskPhoneNumber('123'), '123');
  });
});

describe('Dynamic Database Name Extraction', () => {
  it('extracts database name from standard MongoDB Atlas URI', () => {
    const uri = 'mongodb+srv://user:pass@cluster0.dt2fqzc.mongodb.net/adviora_prod?retryWrites=true&w=majority';
    assert.strictEqual(getDatabaseNameFromUri(uri), 'adviora_prod');
  });

  it('supports isolated test and staging databases dynamically', () => {
    const testUri = 'mongodb+srv://user:pass@cluster0.dt2fqzc.mongodb.net/adviora_test?retryWrites=true';
    assert.strictEqual(getDatabaseNameFromUri(testUri), 'adviora_test');

    const stagingUri = 'mongodb://localhost:27017/adviora_staging';
    assert.strictEqual(getDatabaseNameFromUri(stagingUri), 'adviora_staging');
  });

  it('strips accidental quotes from URI string', () => {
    const quoted = '"mongodb+srv://user:pass@cluster0.dt2fqzc.mongodb.net/adviora_prod?retryWrites=true"';
    assert.strictEqual(cleanMongoUri(quoted), 'mongodb+srv://user:pass@cluster0.dt2fqzc.mongodb.net/adviora_prod?retryWrites=true');
    assert.strictEqual(getDatabaseNameFromUri(quoted), 'adviora_prod');
  });

  it('throws error when database name is omitted in URI path', () => {
    const invalidUri = 'mongodb+srv://user:pass@cluster0.dt2fqzc.mongodb.net/?retryWrites=true';
    assert.throws(() => getDatabaseNameFromUri(invalidUri), /must specify an explicit database path/);
  });
});

describe('Attribution Evidence Classification', () => {
  function isAttributedTouchpoint(touchpoint) {
    return ATTRIBUTION_EVIDENCE_FIELDS.some(
      (field) => touchpoint[field] && typeof touchpoint[field] === 'string' && touchpoint[field].trim().length > 0
    );
  }

  it('preserves all 17 tracking fields in the data contract', () => {
    assert.strictEqual(ALL_17_TRACKING_FIELDS.length, 17);
    assert.ok(ALL_17_TRACKING_FIELDS.includes('fbp'));
    assert.ok(ALL_17_TRACKING_FIELDS.includes('device'));
    assert.ok(ALL_17_TRACKING_FIELDS.includes('utm_source'));
  });

  it('classifies direct UTM tags as Attributed', () => {
    assert.strictEqual(isAttributedTouchpoint({ utm_source: 'google', utm_medium: 'cpc' }), true);
    assert.strictEqual(isAttributedTouchpoint({ utm_campaign: 'brand_search' }), true);
  });

  it('classifies click IDs as Attributed', () => {
    assert.strictEqual(isAttributedTouchpoint({ gclid: 'EAIaIQobChMI...' }), true);
    assert.strictEqual(isAttributedTouchpoint({ fbclid: 'IwAR0...' }), true);
    assert.strictEqual(isAttributedTouchpoint({ fbc: 'fb.1.1554924722.AbCdEfGhIjKlMnOpQrStUvWxYz' }), true);
  });

  it('classifies utm_content-only and utm_term-only records as Attributed', () => {
    assert.strictEqual(isAttributedTouchpoint({ utm_content: 'banner_red' }), true);
    assert.strictEqual(isAttributedTouchpoint({ utm_term: 'digital consulting' }), true);
  });

  it('classifies platform, campaignid, adgroupid as Attributed', () => {
    assert.strictEqual(isAttributedTouchpoint({ platform: 'facebook' }), true);
    assert.strictEqual(isAttributedTouchpoint({ campaignid: '12345678' }), true);
    assert.strictEqual(isAttributedTouchpoint({ adgroupid: '87654321' }), true);
  });

  it('does NOT classify fbp alone or device alone as Attributed', () => {
    // fbp is a browser cookie ID; device is hardware telemetry
    assert.strictEqual(isAttributedTouchpoint({ fbp: 'fb.1.1596403881.1768' }), false);
    assert.strictEqual(isAttributedTouchpoint({ device: 'mobile' }), false);
    assert.strictEqual(isAttributedTouchpoint({ fbp: 'fb.1.1596403881.1768', device: 'desktop' }), false);
  });
});

describe('Date Boundaries & Half-Open Intervals (Asia/Kolkata)', () => {
  it('confirms single authoritative timezone is Asia/Kolkata', () => {
    assert.strictEqual(APP_TIMEZONE, 'Asia/Kolkata');
  });

  it('computes exact midnight in IST', () => {
    // Midnight 2026-09-28 in Asia/Kolkata (+05:30) is 2026-09-27 18:30:00 UTC
    const midnight = getMidnightIST(2026, 8, 28); // Month 8 is September
    assert.strictEqual(midnight.toISOString(), '2026-09-27T18:30:00.000Z');
  });

  it('computes today half-open interval [start, end)', () => {
    const { start, end, isAllTime } = getDateRangeBounds('today');
    assert.strictEqual(isAllTime, false);
    assert.ok(start !== null);
    assert.ok(end !== null);
    // Difference between end and start must be exactly 24 hours (86,400,000 ms)
    assert.strictEqual(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000);
  });

  it('computes 7days interval as 7 full calendar days', () => {
    const { start, end } = getDateRangeBounds('7days');
    assert.strictEqual(end.getTime() - start.getTime(), 7 * 24 * 60 * 60 * 1000);
  });

  it('returns isAllTime=true with null bounds for all-time preset', () => {
    const { start, end, isAllTime, label } = getDateRangeBounds('all');
    assert.strictEqual(isAllTime, true);
    assert.strictEqual(start, null);
    assert.strictEqual(end, null);
    assert.strictEqual(label, 'All Time');
  });

  it('validates custom date ranges and rejects reversed dates', () => {
    const valid = getDateRangeBounds('custom', '2026-09-20', '2026-09-25');
    assert.ok(valid.start < valid.end);

    assert.throws(
      () => getDateRangeBounds('custom', '2026-09-28', '2026-09-20'),
      /startDate must be before or equal to endDate/
    );
  });
});

describe('Zod Query Validation & Limits', () => {
  it('parses valid lead list query with defaults', () => {
    const parsed = LeadsQuerySchema.safeParse({});
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.range, '7days');
      assert.strictEqual(parsed.data.page, 1);
      assert.strictEqual(parsed.data.limit, 25);
      assert.strictEqual(parsed.data.sort, 'latest');
      assert.strictEqual(parsed.data.interest, 'all');
      assert.strictEqual(parsed.data.attribution, 'all');
    }
  });

  it('rejects unallowed limit values', () => {
    const parsed = LeadsQuerySchema.safeParse({ limit: '999' });
    assert.strictEqual(parsed.success, false);
  });

  it('requires startDate and endDate when range=custom', () => {
    const invalid = LeadsQuerySchema.safeParse({ range: 'custom' });
    assert.strictEqual(invalid.success, false);

    const valid = LeadsQuerySchema.safeParse({
      range: 'custom',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
    });
    assert.strictEqual(valid.success, true);
  });

  it('validates lead detail params and rejects invalid ObjectIds', () => {
    const valid = LeadDetailParamsSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
    assert.strictEqual(valid.success, true);

    const invalid = LeadDetailParamsSchema.safeParse({ id: 'not-an-id' });
    assert.strictEqual(invalid.success, false);

    const shortId = LeadDetailParamsSchema.safeParse({ id: '12345' });
    assert.strictEqual(shortId.success, false);
  });

  it('bounds lead detail pagination', () => {
    const valid = LeadDetailQuerySchema.safeParse({
      enquiriesPage: '1',
      enquiriesLimit: '10',
      touchpointsPage: '2',
      touchpointsLimit: '20',
    });
    assert.strictEqual(valid.success, true);

    // Limit > 50 rejected
    const invalid = LeadDetailQuerySchema.safeParse({
      enquiriesLimit: '100',
    });
    assert.strictEqual(invalid.success, false);
  });

  it('validates filter search field and rejects unknown fields', () => {
    const validSource = FiltersSearchSchema.safeParse({ field: 'utm_source', q: 'goog' });
    assert.strictEqual(validSource.success, true);

    const invalidField = FiltersSearchSchema.safeParse({ field: 'invalid_field' });
    assert.strictEqual(invalidField.success, false);
  });
});
