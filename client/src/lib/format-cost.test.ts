import { describe, it, expect } from "vitest";
import { formatCost, formatTokens, formatTokenPair, formatTokenTotal } from "./format-cost";

describe("formatCost", () => {
  it("unknown cost is '—', never $0.00", () => {
    expect(formatCost(null)).toBe("—");
    expect(formatCost(undefined)).toBe("—");
    expect(formatCost(Number.NaN)).toBe("—");
  });
  it("a real zero is $0", () => expect(formatCost(0)).toBe("$0"));
  it("scales precision with magnitude", () => {
    expect(formatCost(0.00004)).toBe("<$0.0001");
    expect(formatCost(0.0013)).toBe("$0.0013");
    expect(formatCost(0.012)).toBe("$0.012");
    expect(formatCost(0.06)).toBe("$0.060");
    expect(formatCost(1.25)).toBe("$1.25");
  });
});

describe("formatTokens", () => {
  it("compacts to K / M", () => {
    expect(formatTokens(940)).toBe("940");
    expect(formatTokens(8200)).toBe("8.2K");
    expect(formatTokens(15000)).toBe("15K");
    expect(formatTokens(1_240_000)).toBe("1.2M");
  });
  it("pair and total; null when a side is unknown", () => {
    expect(formatTokenPair(8200, 1300)).toBe("8.2K→1.3K");
    expect(formatTokenPair(null, 1300)).toBeNull();
    expect(formatTokenTotal(8119, 1000)).toBe("9,119");
    expect(formatTokenTotal(100, undefined)).toBeNull();
  });
});
