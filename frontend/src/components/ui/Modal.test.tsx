import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(
      <Modal open={false} title="Edit" onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exposes an accessible dialog with its title and content", () => {
    render(
      <Modal open title="Edit property" onClose={vi.fn()}>
        <input aria-label="Name" />
      </Modal>
    );

    expect(screen.getByRole("dialog", { name: "Edit property" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveFocus();
  });

  it("keeps focus in the active field while the parent re-renders", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open title="Edit property" onClose={onClose}>
        <input aria-label="Name" />
        <input aria-label="City" />
      </Modal>
    );

    await user.click(screen.getByLabelText("City"));
    await user.type(screen.getByLabelText("City"), "Paris");
    rerender(
      <Modal open title="Edit property" onClose={() => onClose()}>
        <input aria-label="Name" />
        <input aria-label="City" />
      </Modal>
    );

    expect(screen.getByLabelText("City")).toHaveFocus();
    expect(screen.getByLabelText("City")).toHaveValue("Paris");
  });

  it("closes on Escape and on the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open title="Edit property" onClose={onClose}>
        <p>Content</p>
      </Modal>
    );

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Close dialog" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
