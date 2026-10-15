import { describe, expect, it } from "vitest";

import { AVATAR_TONES, avatarTone, initials } from "./avatar";

describe("initials", () => {
  it("takes the first and last word", () => {
    expect(initials("Ravi Kumar Sharma")).toBe("RS");
    expect(initials("priya raman")).toBe("PR");
  });

  it("handles one word, extra spaces and an empty name", () => {
    expect(initials("  Ananya  ")).toBe("A");
    expect(initials("   ")).toBe("?");
  });
});

describe("avatarTone", () => {
  it("is stable for the same id and always a known tone", () => {
    const id = "6f1c2d3e-0000-4000-8000-000000000001";
    expect(avatarTone(id)).toBe(avatarTone(id));
    expect(AVATAR_TONES).toContain(avatarTone(id));
  });

  it("spreads different ids across tones", () => {
    const tones = new Set(Array.from({ length: 40 }, (_, i) => avatarTone(`lead-${i}`)));
    expect(tones.size).toBeGreaterThan(3);
  });
});
