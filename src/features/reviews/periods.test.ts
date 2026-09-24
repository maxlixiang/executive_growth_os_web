import { describe, expect, it } from "vitest";
import { monthPeriod, quarterPeriod } from "./periods";

describe("review periods", () => {
  it("builds a leap-year natural month", () => {
    expect(monthPeriod("2028-02")).toEqual({ key: "2028-02", start: "2028-02-01", end: "2028-02-29", nextStart: "2028-03-01" });
  });

  it("rolls December into the next year", () => {
    expect(monthPeriod("2026-12")?.nextStart).toBe("2027-01-01");
  });

  it("builds Q4 across the year boundary", () => {
    expect(quarterPeriod("2026-Q4")).toEqual({ key: "2026-Q4", start: "2026-10-01", end: "2026-12-31", nextStart: "2027-01-01" });
  });

  it("rejects invalid keys", () => {
    expect(monthPeriod("2026-13")).toBeNull();
    expect(quarterPeriod("2026-Q5")).toBeNull();
  });
});
