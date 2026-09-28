/**
 * CSV generation and security helpers for ADViora Leads Operations Dashboard.
 */

const FORMULA_INJECTION_REGEX = /^[\s\x00-\x1F\x7F]*[=+\-@\t\r|]/;

/**
 * Neutralizes spreadsheet formula injection and escapes special characters.
 * Checks for dangerous formula prefixes even when preceded by leading whitespace or ASCII control characters.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // If the cell begins with dangerous formula triggers (even after leading whitespace/control chars),
  // prepend a single quote to force spreadsheet parsers (Excel, Sheets) to treat it as plain text.
  if (FORMULA_INJECTION_REGEX.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180: escape internal double quotes by doubling them
  const escaped = str.replace(/"/g, '""');

  // Enclose in quotes
  return `"${escaped}"`;
}

/**
 * Builds a RFC 4180 compliant CSV string with a standard UTF-8 Byte Order Mark (BOM).
 * Guaranteed structure: Exactly one header row, followed strictly by data rows.
 */
export function buildCsvDocument(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));

  // UTF-8 BOM (\uFEFF) ensures Excel and external tools correctly detect UTF-8 encoding
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Masks Indian phone numbers for overview privacy: +91 98XXX XX210
 */
export function maskPhoneNumber(phone?: string, countryCode: string = '+91'): string {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return phone;

  const last10 = clean.slice(-10);
  const first2 = last10.slice(0, 2);
  const last3 = last10.slice(-3);

  return `${countryCode} ${first2}XXX XX${last3}`;
}
