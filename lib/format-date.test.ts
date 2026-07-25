import assert from "node:assert/strict";
import { test } from "node:test";

import { formatDate, formatDateShort, formatRfc822 } from "./format-date";

test("a calendar date renders as a long human date", () => {
  assert.equal(formatDate("2026-03-01"), "March 1, 2026");
});

test("the first of the month does not slip to the previous day in western zones", () => {
  // The bug this guards against only appears when the runtime is behind UTC.
  const previous = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
  try {
    assert.equal(formatDate("2026-03-01"), "March 1, 2026");
    assert.equal(formatDateShort("2026-03-01"), "Mar 1");
  } finally {
    process.env.TZ = previous;
  }
});

test("the short form omits the year", () => {
  assert.equal(formatDateShort("2026-12-25"), "Dec 25");
});

test("a locale changes the month name", () => {
  assert.equal(formatDate("2026-03-01", "fr"), "1 mars 2026");
});

test("RFC 822 output is what RSS readers expect", () => {
  assert.equal(formatRfc822("2026-03-01"), "Sun, 01 Mar 2026 00:00:00 GMT");
});

test("an unparseable date is passed through rather than shown as Invalid Date", () => {
  assert.equal(formatDate("sometime"), "sometime");
  assert.equal(formatDateShort(""), "");
  assert.equal(formatRfc822("nope"), "nope");
});
