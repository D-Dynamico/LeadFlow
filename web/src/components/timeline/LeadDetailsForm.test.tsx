import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Lead } from "@/lib/types";

import { LeadDetailsForm } from "./LeadDetailsForm";

const lead: Lead = {
  id: "lead-1",
  name: "Ravi Sharme",
  company: "Acme Logistics",
  phone: "+91 98765 43210",
  status: "contacted",
  next_follow_up_at: null,
  follow_up_state: "none",
  last_note_preview: null,
  last_discussion_at: null,
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-01T10:00:00Z",
};

function renderForm(onDone = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <LeadDetailsForm lead={lead} onDone={onDone} />
    </QueryClientProvider>,
  );
  return onDone;
}

describe("LeadDetailsForm", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a field error and sends nothing when the name is cleared", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const onDone = renderForm();

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("fixes the name, clears the phone with null, and closes on success", async () => {
    const saved = { ...lead, name: "Ravi Sharma", phone: null };
    const fetchSpy = vi.fn().mockResolvedValue(Response.json(saved));
    vi.stubGlobal("fetch", fetchSpy);
    const onDone = renderForm();

    const name = screen.getByLabelText("Name");
    await userEvent.clear(name);
    await userEvent.type(name, "Ravi Sharma");
    await userEvent.clear(screen.getByLabelText("Phone (optional)"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await vi.waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toMatch(/\/leads\/lead-1$/);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({
      name: "Ravi Sharma",
      company: "Acme Logistics",
      phone: null,
    });
  });

  it("cancels on Escape without saving", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const onDone = renderForm();

    await userEvent.type(screen.getByLabelText("Name"), "{Escape}");

    expect(onDone).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
