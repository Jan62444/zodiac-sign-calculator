# zodiac-sign-calculator

Determines the Western astrological sign for a Gregorian birth date using the tropical zodiac's fixed boundary dates.

## Usage

```js
import { signFromDate, signFromMonthDay, SIGNS } from "zodiac-sign-calculator";

// From a Date object. Only month and day are read; year, time, and timezone
// are ignored.
const a = signFromDate(new Date(1990, 6, 23));   // { name: "Leo", ... }

// From explicit month/day numbers, when you already have fields and want to
// avoid constructing a Date.
const b = signFromMonthDay(7, 23);               // { name: "Leo", ... }

// SIGNS is a frozen, ordered array of the twelve sign descriptors.
SIGNS[0].name;   // "Aries"
SIGNS[0].element; // "fire"
```

Both functions return the same `ZodiacSign` object shape: `{ name, symbol, element, modality, index }`. `index` is the zero-based position in the tropical year, with Aries = 0.

## Why this exists

The problem is small but surprisingly easy to get wrong: the tropical zodiac's sign boundaries are fixed Gregorian dates, but the actual equinox and solstices drift by a day or so across years. This library commits to the popular fixed-date convention (Aries begins March 21, Taurus April 20, and so on) rather than attempting astronomical precision. The trade-off is simplicity and determinism: no ephemeris, no timezone, no year dependence. If you need arcsecond-accurate Sun longitudes, this is not the library for it.

## The awkward edge

Cusp days. The convention here is that the boundary day itself belongs to the sign that *begins* on it — March 21 is Aries, not Pisces. If your source of truth assigns cusp days to the preceding sign, every boundary result will be off by one.

February 29 is accepted and classified as Pisces (the Pisces boundary is February 19, well clear of leap-day concerns). February 30 is rejected with a `RangeError`.
