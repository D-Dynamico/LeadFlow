import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AddLeadDialog } from "./AddLeadDialog";

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AddLeadDialog open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );
}

describe("AddLeadDialog", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a field error and sends nothing when the name is empty", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Add lead" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
