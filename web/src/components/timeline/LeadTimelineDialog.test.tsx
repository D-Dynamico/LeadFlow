import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { Lead } from "@/lib/types";

import { LeadTimelineDialog } from "./LeadTimelineDialog";

const lead: Lead = {
  id: "lead-1",
  name: "Ravi Sharma",
  company: "Acme Logistics",
  phone: null,
  status: "contacted",
  next_follow_up_at: null,
  follow_up_state: "none",
  last_note_preview: null,
  last_discussion_at: null,
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-01T10:00:00Z",
};

function renderDialog() {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <LeadTimelineDialog leadId="lead-1" tz="Asia/Kolkata" onClose={() => {}} />
    </QueryClientProvider>,
  );
}

const calledPaths = (fetchSpy: ReturnType<typeof vi.fn>) =>
  fetchSpy.mock.calls.map(([url]) => new URL(String(url)).pathname);

describe("LeadTimelineDialog", () => {
  // jsdom has no layout, so element scrolling is a no-op here.
  beforeAll(() => {
    Element.prototype.scrollTo = () => {};
  });
  afterEach(() => vi.unstubAllGlobals());

  it("hides the note form when the lead fails to load, and retries both requests", async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchSpy);
    renderDialog();

    expect(await screen.findByText("Could not load this lead")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("What was discussed?")).not.toBeInTheDocument();

    fetchSpy.mockClear();
    // One retry for the whole dialog, in the header.
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    await vi.waitFor(() =>
      expect(calledPaths(fetchSpy).sort()).toEqual([
        "/api/v1/leads/lead-1",
        "/api/v1/leads/lead-1/discussions",
      ]),
    );
  });

  it("shows the note form once the lead has loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(Response.json(url.includes("/discussions") ? [] : lead)),
      ),
    );
    renderDialog();

    expect(await screen.findByPlaceholderText("What was discussed?")).toBeInTheDocument();
    expect(screen.getByText("Lead created")).toBeInTheDocument();
  });
});
