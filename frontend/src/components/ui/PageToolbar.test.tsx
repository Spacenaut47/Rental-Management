import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PageToolbar from "./PageToolbar";

describe("PageToolbar", () => {
  it("renders a page-specific filter control", async () => {
    const user = userEvent.setup();
    const onFilter = vi.fn();
    render(<PageToolbar title="Properties" onFilter={onFilter} />);

    await user.click(screen.getByRole("button", { name: "Filter properties" }));

    expect(onFilter).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /^Add/ })).not.toBeInTheDocument();
  });

  it("supports a page-specific filter label", () => {
    render(<PageToolbar title="Admin • Audit" filterLabel="Filter audit entries" onFilter={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Filter audit entries" })).toBeInTheDocument();
  });

  it("renders an add control only when the page is editable", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<PageToolbar title="Tenants" onFilter={vi.fn()} addLabel="Tenant" onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Add tenant" }));

    expect(onAdd).toHaveBeenCalledOnce();
  });
});
