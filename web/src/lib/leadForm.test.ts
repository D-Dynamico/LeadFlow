import { describe, expect, it } from "vitest";

import { leadFormField, leadFormSchema, leadToFormValues, toLeadUpdate } from "./leadForm";

describe("leadFormSchema", () => {
  it("requires a name and checks the phone format", () => {
    const result = leadFormSchema.safeParse({ name: "  ", company: "", phone: "call me" });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => [i.path[0], i.message]);
    expect(messages).toEqual([
      ["name", "Name is required"],
      ["phone", "6 to 32 digits, spaces, or + - ( )"],
    ]);
  });
});

describe("leadToFormValues", () => {
  it("turns a missing company or phone into empty inputs", () => {
    expect(leadToFormValues({ name: "Ravi", company: null, phone: null })).toEqual({
      name: "Ravi",
      company: "",
      phone: "",
    });
  });
});

describe("toLeadUpdate", () => {
  it("trims values and sends blank company or phone as null to clear them (D-18)", () => {
    expect(toLeadUpdate({ name: " Ravi Sharma ", company: "  ", phone: "" })).toEqual({
      name: "Ravi Sharma",
      company: null,
      phone: null,
    });
    expect(toLeadUpdate({ name: "Ravi", company: " Acme ", phone: "+91 98765 43210" })).toEqual({
      name: "Ravi",
      company: "Acme",
      phone: "+91 98765 43210",
    });
  });
});

describe("leadFormField", () => {
  it("maps API error fields onto form fields, falling back to name", () => {
    expect(leadFormField("phone")).toBe("phone");
    expect(leadFormField("body")).toBe("name");
  });
});
