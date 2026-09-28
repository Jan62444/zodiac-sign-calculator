/**
 * Core zodiac sign calculation.
 *
 * We use the tropical zodiac with fixed Gregorian boundary dates. This is the
 * convention underlying virtually all Western popular astrology: the sign is
 * determined solely by month and day, never by the year, time of day, or the
 * Sun's actual astronomical longitude. That makes the calculation trivial and
 * deterministic, which is exactly the point — no ephemeris, no timezone, no
 * ambiguity about precession.
 */

/**
 * @typedef {Object} ZodiacSign
 * @property {string} name      Human-readable name, e.g. "Aries".
 * @property {string} symbol    Three-letter symbol, e.g. "ari".
 * @property {string} element   One of "fire", "earth", "air", "water".
 * @property {string} modality  One of "cardinal", "fixed", "mutable".
 * @property {number} index     Zero-based position in the tropical year, Aries = 0.
 */

/**
 * Ordered list of signs. Aries is first because the tropical zodiac year begins
 * at the March equinox, which is the Aries ingress.
 *
 * @type {readonly ZodiacSign[]}
 */
export const SIGNS = Object.freeze([
  { name: "Aries",       symbol: "ari", element: "fire",  modality: "cardinal", index: 0 },
  { name: "Taurus",      symbol: "tau", element: "earth", modality: "fixed",    index: 1 },
  { name: "Gemini",      symbol: "gem", element: "air",   modality: "mutable",  index: 2 },
  { name: "Cancer",      symbol: "can", element: "water", modality: "cardinal", index: 3 },
  { name: "Leo",         symbol: "leo", element: "fire",  modality: "fixed",    index: 4 },
  { name: "Virgo",       symbol: "vir", element: "earth", modality: "mutable",  index: 5 },
  { name: "Libra",       symbol: "lib", element: "air",   modality: "cardinal", index: 6 },
  { name: "Scorpio",     symbol: "sco", element: "water", modality: "fixed",    index: 7 },
  { name: "Sagittarius", symbol: "sag", element: "fire",  modality: "mutable",  index: 8 },
  { name: "Capricorn",   symbol: "cap", element: "earth", modality: "cardinal", index: 9 },
  { name: "Aquarius",    symbol: "aqu", element: "air",   modality: "fixed",    index: 10 },
  { name: "Pisces",      symbol: "pis", element: "water", modality: "mutable",  index: 11 }
]);

/**
 * Boundary day-of-month on which each sign begins, keyed by 1-based month.
 *
 * The tropical zodiac's sign boundaries fall on fixed Gregorian dates. In
 * practice the real equinox/solstice drifts by a day or so across years and
 * centuries, but the popular convention pins the boundaries to the 20th–23rd.
 * We use the most widely cited fixed dates (e.g. Aries begins March 21,
 * Taurus April 20). This is the one genuine edge: a birth on the cusp day
 * itself is counted as the sign that *begins* on that day.
 *
 * @type {readonly number[]}
 */
const SIGN_START_DAY = Object.freeze([
  0,    // index 0 unused (months are 1-based)
  20,   // January  -> Aquarius begins Jan 20
  19,   // February -> Pisces begins Feb 19
  21,   // March    -> Aries begins Mar 21
  20,   // April    -> Taurus begins Apr 20
  21,   // May      -> Gemini begins May 21
  21,   // June     -> Cancer begins Jun 21
  23,   // July     -> Leo begins Jul 23
  23,   // August   -> Virgo begins Aug 23
  23,   // September-> Libra begins Sep 23
  23,   // October  -> Scorpio begins Oct 23
  22,   // November -> Sagittarius begins Nov 22
  22    // December -> Capricorn begins Dec 22
]);

/**
 * Map a (month, day) pair to the zero-based index into {@link SIGNS}.
 *
 * @param {number} month  1–12.
 * @param {number} day    1–31 (validated against the month).
 * @returns {number}
 * @throws {TypeError} if month or day is not a finite integer.
 * @throws {RangeError} if month is out of range or day exceeds the days in that month.
 */
function signIndex(month, day) {
  if (!Number.isInteger(month) || !Number.isInteger(day)) {
    throw new TypeError("month and day must be integers");
  }
  if (month < 1 || month > 12) {
    throw new RangeError(`month must be 1–12, got ${month}`);
  }

  // Days per month in a non-leap year. February is the only month whose length
  // varies, and since the sign boundary (Pisces begins Feb 19) is well before
  // the 28th/29th, the leap-year distinction never affects the result. We still
  // validate the day so callers get a clear error rather than a silent success
  // on nonsense input like February 31.
  const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month]) {
    throw new RangeError(`day out of range for month ${month}: ${day}`);
  }

  // The sign that begins in a given month has index (month + 9) % 12:
  // January -> Aquarius (9), February -> Pisces (10), March -> Aries (0), etc.
  // On or after the boundary day, the sign whose boundary falls in this month
  // applies. Before it, the previous month's sign carries over. December's
  // predecessor wraps to Sagittarius (index 8) and January's to Capricorn
  // (index 9), which is why the arithmetic uses modulo 12.
  const signForMonth = (month + 9) % 12;
  if (day >= SIGN_START_DAY[month]) {
    return signForMonth;
  }
  return (signForMonth - 1 + 12) % 12;
}

/**
 * Determine the Western astrological sign for a Gregorian birth date.
 *
 * Only the month and day are consulted. The year, time, and timezone are
 * irrelevant under the tropical fixed-date convention, so we accept a Date
 * object purely as a convenient carrier and ignore everything else about it.
 *
 * @param {Date} date A Gregorian calendar date. Only month and day are read.
 * @returns {ZodiacSign}
 * @throws {TypeError} if `date` is not a Date.
 * @throws {RangeError} if `date` is Invalid (NaN).
 */
export function signFromDate(date) {
  if (!(date instanceof Date)) {
    throw new TypeError("date must be a Date");
  }
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("date is Invalid (NaN timestamp)");
  }
  // getMonth is 0-based; getUTCDate would tie us to the Date's stored instant,
  // which is not what we want — we want the local-calendar fields the caller
  // almost certainly constructed the Date with.
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return SIGNS[signIndex(month, day)];
}

/**
 * Determine the Western astrological sign from explicit month and day numbers.
 *
 * Use this when you already have numeric fields and want to avoid constructing
 * a Date (which would drag in timezone semantics you do not need).
 *
 * @param {number} month  1–12.
 * @param {number} day    1–31.
 * @returns {ZodiacSign}
 */
export function signFromMonthDay(month, day) {
  return SIGNS[signIndex(month, day)];
}
