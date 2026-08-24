/**
 * Climate and daylight for a Kenyan development.
 *
 * Redfin buys this from The Weather Channel and Shadowmap. We compute it
 * instead, which is honest for two reasons.
 *
 * Daylight is pure astronomy: the length of a day at a given latitude on a
 * given date follows from the Earth's tilt, so the numbers below are derived
 * rather than sourced, and are correct to within a few minutes.
 *
 * Temperature and rainfall are long-run monthly norms for Kenya's climate
 * zones, which are unusually stable — the country sits on the equator, so the
 * year is organised around two rainy seasons rather than four temperature
 * seasons, and a monthly average from one year resembles the next closely
 * enough to publish. A live API would be more precise about *this* week, which
 * is not what someone choosing a home is asking.
 */

export interface MonthlyClimate {
  month: string;
  /** Average daily high and low, °C. */
  high: number;
  low: number;
  /** Average monthly rainfall, mm. */
  rain: number;
}

export interface ClimateSummary {
  zone: string;
  months: MonthlyClimate[];
  /** Daylight hours at the solstices, computed from latitude. */
  sun: { longest: number; shortest: number; annual: number };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Kenya's climate zones, by the altitude and latitude that actually drive them.
 *
 * Highland Nairobi at 1,795 m is temperate despite sitting on the equator;
 * Mombasa at sea level is hot and humid; the Rift and the north are hotter and
 * drier. Long rains fall March–May, short rains October–December, which is the
 * shape a resident recognises.
 */
const ZONES = {
  highland: {
    label: 'Highland — cool and temperate',
    high: [25, 26, 25, 24, 22, 21, 21, 22, 25, 25, 23, 23],
    low: [12, 13, 14, 14, 13, 11, 11, 11, 11, 13, 14, 13],
    rain: [64, 56, 93, 219, 176, 35, 17, 23, 31, 53, 109, 86],
  },
  coastal: {
    label: 'Coastal — warm and humid',
    high: [32, 32, 33, 31, 29, 29, 28, 28, 29, 30, 31, 32],
    low: [24, 24, 25, 24, 23, 22, 21, 21, 22, 23, 24, 24],
    rain: [25, 18, 64, 196, 320, 119, 89, 64, 63, 86, 97, 61],
  },
  savannah: {
    label: 'Savannah — warm and seasonal',
    high: [31, 32, 32, 30, 29, 28, 27, 28, 30, 31, 30, 30],
    low: [17, 18, 19, 19, 18, 16, 15, 16, 17, 18, 18, 18],
    rain: [38, 42, 78, 168, 96, 22, 12, 14, 21, 62, 142, 78],
  },
  arid: {
    label: 'Arid — hot and dry',
    high: [35, 36, 36, 34, 33, 32, 31, 32, 34, 35, 34, 34],
    low: [23, 24, 25, 25, 24, 23, 22, 22, 23, 24, 24, 23],
    rain: [8, 10, 24, 68, 42, 9, 6, 6, 9, 34, 71, 32],
  },
} as const;

/**
 * Which zone a development sits in.
 *
 * Altitude decides this more than latitude does, and we do not store altitude
 * — so it is inferred from position: the coastal strip east of 39°E, the arid
 * north above 1°N, and the highlands around the Nairobi–Nakuru corridor.
 */
function zoneFor(lat: number, lng: number): keyof typeof ZONES {
  if (lng > 39) return 'coastal';
  if (lat > 1) return 'arid';
  // The highland corridor: Nairobi, Kiambu, Nakuru, Nyeri, Eldoret.
  if (lat > -1.6 && lat < 0.8 && lng > 35 && lng < 37.5) return 'highland';
  return 'savannah';
}

/**
 * Daylight hours on a given day, from latitude.
 *
 * The standard sunrise equation: solar declination from the day of the year,
 * then the hour angle at sunrise. Near the equator this correctly produces the
 * ~12-hour day that barely changes all year, which is the point worth showing
 * a Kenyan buyer — the contrast with Redfin's 8.7-vs-4.3 is the interesting
 * part, not a number we would have to invent.
 */
function daylightHours(lat: number, dayOfYear: number): number {
  const rad = Math.PI / 180;
  const declination = 23.45 * Math.sin(rad * (360 / 365) * (dayOfYear - 81));
  const cosH = -Math.tan(lat * rad) * Math.tan(declination * rad);
  // Polar day or night — impossible in Kenya, but the maths must not return NaN.
  if (cosH >= 1) return 0;
  if (cosH <= -1) return 24;
  return (2 * Math.acos(cosH)) / rad / 15;
}

export function climateFor(lat?: number | null, lng?: number | null): ClimateSummary | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const zone = ZONES[zoneFor(lat, lng)];

  // Day 172 is the June solstice, day 355 the December one.
  const june = daylightHours(lat, 172);
  const december = daylightHours(lat, 355);

  return {
    zone: zone.label,
    months: MONTHS.map((month, i) => ({
      month,
      high: zone.high[i],
      low: zone.low[i],
      rain: zone.rain[i],
    })),
    sun: {
      longest: Math.max(june, december),
      shortest: Math.min(june, december),
      annual: (june + december) / 2,
    },
  };
}

/** The two wet seasons, named the way a resident would name them. */
export function rainySeasons(months: MonthlyClimate[]): string {
  const wettest = [...months].sort((a, b) => b.rain - a.rain).slice(0, 3).map((m) => m.month);
  const long = wettest.filter((m) => ['Mar', 'Apr', 'May'].includes(m));
  const short = wettest.filter((m) => ['Oct', 'Nov', 'Dec'].includes(m));
  const parts: string[] = [];
  if (long.length) parts.push(`long rains ${long[long.length - 1]}–${long[0]}`);
  if (short.length) parts.push(`short rains around ${short.join(' and ')}`);
  return parts.join(', ');
}
