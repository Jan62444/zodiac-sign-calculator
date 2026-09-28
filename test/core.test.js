import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { SIGNS, signFromDate, signFromMonthDay } from "../src/core.js";

// Boundary day-of-month on which each sign begins, keyed by 1-based month.
// Kept here as a local copy so the tests document the convention independently
// of the implementation's internal table.
const BOUNDARY = {
  1: 20, 2: 19, 3: 21, 4: 20, 5: 21, 6: 21,
  7: 23, 8: 23, 9: 23, 10: 23, 11: 22, 12: 22
};

// The sign that BEGINS in each 1-based month.
const SIGN_BEGINNING_IN_MONTH = {
  1: "Aquarius", 2: "Pisces", 3: "Aries", 4: "Taurus",
  5: "Gemini", 6: "Cancer", 7: "Leo", 8: "Virgo",
  9: "Libra", 10: "Scorpio", 11: "Sagittarius", 12: "Capricorn"
};

function signBefore(month) {
  // Sign carrying over from the previous month. December -> Sagittarius,
  // January -> Capricorn.
  const prev = month === 1 ? 12 : month - 1;
  return SIGN_BEGINNING_IN_MONTH[prev];
}

// Build a Date at local midnight on the given year/month/day. Year is arbitrary
// and irrelevant to the calculation; we pick a non-leap year to confirm that
// February 29 is not required for any boundary.
function d(year, month, day) {
  return new Date(year, month - 1, day);
}

describe("SIGNS table", () => {
  it("has exactly twelve entries", () => {
    assert.equal(SIGNS.length, 12);
  });

  it("is frozen", () => {
    assert.ok(Object.isFrozen(SIGNS));
  });

  it("has unique indices 0–11 in tropical-year order starting at Aries", () => {
    const indices = SIGNS.map((s) => s.index);
    assert.deepEqual(indices, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    assert.equal(SIGNS[0].name, "Aries");
  });

  it("gives every sign a lowercase three-letter symbol", () => {
    for (const s of SIGNS) {
      assert.match(s.symbol, /^[a-z]{3}$/);
    }
  });
});

describe("signFromDate", () => {
  it("returns the Aries sign for a date well inside Aries", () => {
    const result = signFromDate(d(2023, 3, 27));
    assert.equal(result.name, "Aries");
    assert.equal(result.element, "fire");
    assert.equal(result.modality, "cardinal");
    assert.equal(result.index, 0);
  });

  it("returns Pisces for a date well inside Pisces", () => {
    const result = signFromDate(d(2023, 2, 25));
    assert.equal(result.name, "Pisces");
    assert.equal(result.index, 11);
  });

  it("treats the boundary day itself as the sign that begins on it", () => {
    for (let month = 1; month <= 12; month++) {
      const result = signFromDate(d(2023, month, BOUNDARY[month]));
      assert.equal(
        result.name,
        SIGN_BEGINNING_IN_MONTH[month],
        `boundary day ${month}/${BOUNDARY[month]} should be ${SIGN_BEGINNING_IN_MONTH[month]}`
      );
    }
  });

  it("treats the day before the boundary as the preceding sign", () => {
    for (let month = 1; month <= 12; month++) {
      const result = signFromDate(d(2023, month, BOUNDARY[month] - 1));
      assert.equal(
        result.name,
        signBefore(month),
        `day before boundary ${month}/${BOUNDARY[month] - 1} should be ${signBefore(month)}`
      );
    }
  });

  it("wraps December 31 to Capricorn and January 1 to Capricorn", () => {
    // Dec 22 boundary -> Capricorn; Dec 31 still Capricorn.
    assert.equal(signFromDate(d(2023, 12, 31)).name, "Capricorn");
    // Jan 1 is before Jan 20 boundary, so it carries over from December: Capricorn.
    assert.equal(signFromDate(d(2023, 1, 1)).name, "Capricorn");
  });

  it("ignores the year: a 1900 date and a 2099 date on the same month/day match", () => {
    const a = signFromDate(d(1900, 7, 15));
    const b = signFromDate(d(2099, 7, 15));
    assert.deepEqual(a, b);
    assert.equal(a.name, "Cancer");
  });

  it("throws TypeError for a non-Date argument", () => {
    assert.throws(
      () => signFromDate("2023-03-21"),
      { name: "TypeError" }
    );
    assert.throws(
      () => signFromDate(null),
      { name: "TypeError" }
    );
  });

  it("throws RangeError for an Invalid Date", () => {
    assert.throws(
      () => signFromDate(new Date("not a date")),
      { name: "RangeError" }
    );
  });
});

describe("signFromMonthDay", () => {
  it("matches signFromDate for the same calendar fields", () => {
    const cases = [
      [3, 21], [3, 20], [7, 23], [7, 22], [12, 22], [1, 19], [2, 29]
    ];
    for (const [m, day] of cases) {
      const fromMD = signFromMonthDay(m, day);
      // Use year 2000 so February 29 is valid for the Date constructor.
      const fromD = signFromDate(d(2000, m, day));
      assert.deepEqual(fromMD, fromD, `${m}/${day} mismatch`);
    }
  });

  it("accepts February 29 (leap day) and classifies it as Pisces", () => {
    // Feb 19 is the Pisces boundary; Feb 29 is well inside Pisces.
    assert.equal(signFromMonthDay(2, 29).name, "Pisces");
  });

  it("throws RangeError for February 30", () => {
    assert.throws(
      () => signFromMonthDay(2, 30),
      { name: "RangeError" }
    );
  });

  it("throws RangeError for month 0 or 13", () => {
    assert.throws(() => signFromMonthDay(0, 15), { name: "RangeError" });
    assert.throws(() => signFromMonthDay(13, 15), { name: "RangeError" });
  });

  it("throws TypeError for non-integer inputs", () => {
    assert.throws(() => signFromMonthDay(3.5, 21), { name: "TypeError" });
    assert.throws(() => signFromMonthDay(3, 21.5), { name: "TypeError" });
    assert.throws(() => signFromMonthDay("3", 21), { name: "TypeError" });
  });
});
