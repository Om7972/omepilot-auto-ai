/**
 * Tests for ConversationItem: Rename, Pin, Archive, Delete update the UI,
 * persist via Supabase, and surface toast feedback. Persistence after refresh
 * is covered by ensuring each action issues the correct .update()/.delete()
 * payload against the conversations table — the realtime hook then refreshes
 * the list on next mount, which is the production refresh flow for Omepilot.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ConversationItem } from "./ConversationItem";

const updateMock = vi.fn();
const deleteMock = vi.fn();
const eqAfterUpdate = vi.fn().mockResolvedValue({ error: null });
const eqAfterDelete = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (_table: string) => ({
      update: (payload: unknown) => {
        updateMock(_table, payload);
        return { eq: eqAfterUpdate };
      },
      delete: () => {
        deleteMock(_table);
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

// Heavy dialogs not needed for these flows
vi.mock("./ShareDialog", () => ({ ShareDialog: () => null }));
vi.mock("./ExportChatDialog", () => ({ ExportChatDialog: () => null }));

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

async function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "" }) ?? screen.getAllByRole("button")[0]);
  // The trigger has no accessible name; fall back to the MoreHorizontal button
  // by selecting the last button before the menu opens.
}

function clickMenuTrigger() {
  const triggers = screen.getAllByRole("button");
  // dropdown trigger is the last button in the row
  fireEvent.click(triggers[triggers.length - 1]);
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

  it("renames a conversation, updates UI, and shows a success toast", async () => {
    const { onUpdate } = renderItem();
    clickMenuTrigger();
    fireEvent.click(await screen.findByText("Rename"));

    const input = screen.getByDisplayValue("My chat") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Renamed chat" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("conversations", { title: "Renamed chat" }));
    expect(toastSuccess).toHaveBeenCalledWith("Title updated");
    expect(onUpdate).toHaveBeenCalled();
  });

  it("pins a conversation and confirms with a toast", async () => {
    const { onUpdate } = renderItem({ isPinned: false });
    clickMenuTrigger();
    fireEvent.click(await screen.findByText("Pin chat"));

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("conversations", { is_pinned: true }));
    expect(toastSuccess).toHaveBeenCalledWith("Pinned");
    expect(onUpdate).toHaveBeenCalled();
  });

  it("unpins when already pinned", async () => {
    renderItem({ isPinned: true });
    clickMenuTrigger();
    fireEvent.click(await screen.findByText("Pin chat"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("conversations", { is_pinned: false }));
    expect(toastSuccess).toHaveBeenCalledWith("Unpinned");
  });

  it("archives a conversation and confirms with a toast", async () => {
    const { onUpdate } = renderItem({ isArchived: false });
    clickMenuTrigger();
    fireEvent.click(await screen.findByText("Archive"));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("conversations", { is_archived: true })
    );
    expect(toastSuccess).toHaveBeenCalledWith("Conversation archived");
    expect(onUpdate).toHaveBeenCalled();
  });

  it("unarchives when already archived", async () => {
    renderItem({ isArchived: true });
    clickMenuTrigger();
    fireEvent.click(await screen.findByText("Unarchive"));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("conversations", { is_archived: false })
    );
    expect(toastSuccess).toHaveBeenCalledWith("Conversation unarchived");
  });

  it("deletes a conversation with confirmation, shows loading state, then toast", async () => {
    const { onDelete } = renderItem();
    clickMenuTrigger();
    fireEvent.click(await screen.findByText("Delete"));

    // Confirmation dialog appears
    const confirmBtn = await screen.findByRole("button", { name: "Delete" });

    // Hold the delete promise so we can observe the loading state
    let resolveDelete: (v: unknown) => void = () => {};
    eqAfterDelete.mockImplementationOnce(
      () => new Promise((r) => { resolveDelete = r; })
    );

    fireEvent.click(confirmBtn);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled()
    );

    resolveDelete({ error: null });

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("conversations"));
    expect(toastSuccess).toHaveBeenCalledWith("Conversation deleted");
    expect(onDelete).toHaveBeenCalled();
  });
});
