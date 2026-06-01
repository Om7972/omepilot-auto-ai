/**
 * Tests for ConversationItem: Rename, Pin, Archive, Delete update the UI,
 * persist via Supabase, and surface toast feedback for Omepilot.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ConversationItem } from "./ConversationItem";

const updateMock = vi.fn();
const deleteMock = vi.fn();
const eqAfterUpdate = vi.fn().mockResolvedValue({ error: null });
const eqAfterDelete = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      update: (payload: unknown) => {
        updateMock(table, payload);
        return { eq: eqAfterUpdate };
      },
      delete: () => {
        deleteMock(table);
        return { eq: eqAfterDelete };
      },
    }),
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

vi.mock("./ShareDialog", () => ({ ShareDialog: () => null }));
vi.mock("./ExportChatDialog", () => ({ ExportChatDialog: () => null }));

// Radix dropdown / dialog in jsdom needs these pointer APIs
beforeEach(() => {
  if (!(Element.prototype as any).hasPointerCapture) {
    (Element.prototype as any).hasPointerCapture = () => false;
    (Element.prototype as any).setPointerCapture = () => {};
    (Element.prototype as any).releasePointerCapture = () => {};
  }
  if (!(Element.prototype as any).scrollIntoView) {
    (Element.prototype as any).scrollIntoView = () => {};
  }
});

function renderItem(overrides: Partial<React.ComponentProps<typeof ConversationItem>> = {}) {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const utils = render(
    <MemoryRouter>
      <ConversationItem
        id="c1"
        title="My chat"
        isPinned={false}
        isArchived={false}
        shareToken={null}
        onUpdate={onUpdate}
        onDelete={onDelete}
        {...overrides}
      />
    </MemoryRouter>
  );
  return { ...utils, onUpdate, onDelete };
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  const buttons = screen.getAllByRole("button");
  await user.click(buttons[buttons.length - 1]);
}

describe("ConversationItem actions", () => {
  beforeEach(() => {
    updateMock.mockClear();
    deleteMock.mockClear();
    eqAfterUpdate.mockClear();
    eqAfterDelete.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
    cleanup();
  });

  it("renames a conversation and shows a success toast", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderItem();
    await openMenu(user);
    await user.click(await screen.findByText("Rename"));

    const input = screen.getByDisplayValue("My chat") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "Renamed chat{Enter}");

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("conversations", { title: "Renamed chat" })
    );
    expect(toastSuccess).toHaveBeenCalledWith("Title updated");
    expect(onUpdate).toHaveBeenCalled();
  });

  it("pins a conversation and confirms with a toast", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderItem({ isPinned: false });
    await openMenu(user);
    await user.click(await screen.findByText("Pin chat"));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("conversations", { is_pinned: true })
    );
    expect(toastSuccess).toHaveBeenCalledWith("Pinned");
    expect(onUpdate).toHaveBeenCalled();
  });

  it("unpins when already pinned", async () => {
    const user = userEvent.setup();
    renderItem({ isPinned: true });
    await openMenu(user);
    await user.click(await screen.findByText("Pin chat"));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("conversations", { is_pinned: false })
    );
    expect(toastSuccess).toHaveBeenCalledWith("Unpinned");
  });

  it("archives a conversation and confirms with a toast", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderItem({ isArchived: false });
    await openMenu(user);
    await user.click(await screen.findByText("Archive"));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("conversations", { is_archived: true })
    );
    expect(toastSuccess).toHaveBeenCalledWith("Conversation archived");
    expect(onUpdate).toHaveBeenCalled();
  });

  it("unarchives when already archived", async () => {
    const user = userEvent.setup();
    renderItem({ isArchived: true });
    await openMenu(user);
    await user.click(await screen.findByText("Unarchive"));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("conversations", { is_archived: false })
    );
    expect(toastSuccess).toHaveBeenCalledWith("Conversation unarchived");
  });

  it("deletes a conversation with confirmation and shows a success toast", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderItem();
    await openMenu(user);
    await user.click(await screen.findByText("Delete"));

    const confirmBtn = await screen.findByRole("button", { name: "Delete" });
    await user.click(confirmBtn);

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("conversations"));
    expect(toastSuccess).toHaveBeenCalledWith("Conversation deleted");
    expect(onDelete).toHaveBeenCalled();
  });

  it("disables the cancel/delete buttons while deletion is in flight (loading feedback)", async () => {
    const user = userEvent.setup();
    renderItem();
    await openMenu(user);
    await user.click(await screen.findByText("Delete"));

    // Hold the first delete call (messages) so the handler stays pending
    let resolveHold: (v: unknown) => void = () => {};
    eqAfterDelete.mockImplementationOnce(
      () => new Promise((r) => { resolveHold = r; })
    );

    const confirmBtn = await screen.findByRole("button", { name: "Delete" });
    user.click(confirmBtn); // do NOT await — handler is held
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    );
    resolveHold({ error: null });
  });
});
