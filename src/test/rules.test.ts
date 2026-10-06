import { describe, expect, it } from "vitest";
import { daysSince, isLinkedInUrl, queryKeys } from "@/lib/stages";

describe("business rules", () => {
  it("customer query keys include the customer id", () => {
    expect(queryKeys.jobs("c1")).toEqual(["jobs", "c1"]);
    expect(queryKeys.applications("c2")).not.toEqual(queryKeys.applications("c1"));
  });
  it("days in stage counts whole days", () => {
    expect(daysSince("2026-10-01T00:00:00Z", new Date("2026-10-04T12:00:00Z"))).toBe(3);
  });
  it("only linkedin.com URLs are accepted", () => {
    expect(isLinkedInUrl("https://www.linkedin.com/in/x")).toBe(true);
    expect(isLinkedInUrl("https://linkedin.com.evil.test/in/x")).toBe(false);
    expect(isLinkedInUrl("linkedin.com/in/x")).toBe(false);
  });
});
