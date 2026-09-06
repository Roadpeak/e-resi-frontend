/**
 * Parse what people actually type into numeric fields.
 *
 * `Number("5%")` and `Number("4,5")` are NaN, and NaN serialises to JSON as
 * null — so a commission typed as "5%" reached the API as null and came back
 * as three stacked validator errors ("must be a number… not less than 0… not
 * greater than 100"), which is the server shouting about a client-side
 * parsing gap. Tolerate the obvious human forms here instead: strip the %,
 * accept a comma decimal, trim currency-style thousands separators.
 *
 * Returns undefined for anything that still is not a number, so callers can
 * disable the submit rather than send garbage.
 */
export function parseHumanNumber(raw: string): number | undefined {
  const cleaned = raw
    .trim()
    .replace(/%$/, '')
    // "1,250,000" → thousands separators; "4,5" → comma decimal. If there is
    // exactly one comma and no dot, treat it as a decimal point; otherwise
    // commas are separators and drop out.
    .replace(/^(\d+),(\d+)$/, '$1.$2')
    .replace(/,/g, '')
    .trim();
  if (cleaned === '') return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}
