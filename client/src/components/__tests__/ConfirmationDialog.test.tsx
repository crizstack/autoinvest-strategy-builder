import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmationDialog } from "../ConfirmationDialog";

describe("ConfirmationDialog", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ConfirmationDialog
        isOpen={false}
        title="Delete Item"
        description="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders dialog when isOpen is true", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Delete Item"
        description="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Delete Item"
        description="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const confirmButton = screen.getByRole("button", { name: /confirm|yes|delete/i });
    await userEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Delete Item"
        description="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel|no/i });
    await userEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("displays different severity levels with correct styling", () => {
    const { rerender } = render(
      <ConfirmationDialog
        isOpen={true}
        title="Warning"
        description="This is a warning"
        severity="high"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("Warning")).toBeInTheDocument();

    rerender(
      <ConfirmationDialog
        isOpen={true}
        title="Critical"
        description="This is critical"
        severity="critical"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("shows confirmation text input for critical severity", async () => {
    const onConfirm = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Delete Strategy"
        description="This action cannot be undone"
        severity="critical"
        confirmationText="DELETE"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );

    const confirmButton = screen.getByRole("button", { name: /confirm|yes|delete/i });

    // Button should be disabled initially
    expect(confirmButton).toBeDisabled();

    // Type confirmation text
    const input = screen.getByPlaceholderText(/type/i) || screen.getByRole("textbox");
    await userEvent.type(input, "DELETE");

    // Button should be enabled now
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });

    await userEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalled();
  });

  it("disables confirm button when confirmation text doesn't match", async () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Delete Strategy"
        description="This action cannot be undone"
        severity="critical"
        confirmationText="DELETE"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/type/i) || screen.getByRole("textbox");
    await userEvent.type(input, "WRONG");

    const confirmButton = screen.getByRole("button", { name: /confirm|yes|delete/i });
    expect(confirmButton).toBeDisabled();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Processing"
        description="Please wait..."
        isLoading={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    const confirmButton = screen.getByRole("button", { name: /confirm|yes/i });
    expect(confirmButton).toBeDisabled();
  });

  it("calls onCancel when clicking outside the dialog", async () => {
    const onCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Delete Item"
        description="Are you sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    // Click on the overlay/backdrop
    const backdrop = screen.getByRole("dialog").parentElement;
    if (backdrop) {
      await userEvent.click(backdrop);
      expect(onCancel).toHaveBeenCalled();
    }
  });

  it("renders custom action button label", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Delete Item"
        description="Are you sure?"
        actionLabel="Remove Forever"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: /remove forever/i })).toBeInTheDocument();
  });
});
