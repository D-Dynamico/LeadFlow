import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AddDiscussionForm } from "./AddDiscussionForm";

function renderForm() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AddDiscussionForm leadId="lead-1" />
    </QueryClientProvider>,
  );
}

describe("AddDiscussionForm quick picks", () => {
  it("marks the picked option as pressed and clears it", async () => {
    renderForm();
    const tomorrow = screen.getByRole("button", { name: "Tomorrow 10 AM" });
    expect(tomorrow).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(tomorrow);
    expect(tomorrow).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "In 3 days" })).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(screen.getByRole("button", { name: "Clear follow-up" }));
    expect(tomorrow).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Next follow-up")).toHaveValue("");
  });
});
