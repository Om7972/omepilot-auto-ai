/**
 * Static "visual regression" checks: pin the layout tokens the user
 * specified (sidebar 260px, page padding 32px, content max-width 850px,
 * chat gap 24px, composer max-width 850px, composer radius 28px) and the
 * exact "Message Omepilot" placeholder. These are the single source of
 * truth applied across every route via <Sidebar/> + <ChatInterface/>, so
 * locking them in source guarantees consistency across routes and
 * breakpoints without needing a full browser snapshot harness.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(p: string) {
  return readFileSync(resolve(process.cwd(), p), "utf8");
}

describe("Omepilot layout tokens", () => {
  const sidebar = read("src/components/Sidebar.tsx");
  const chat = read("src/components/ChatInterface.tsx");

  it("sidebar uses 260px expanded width", () => {
    expect(sidebar).toMatch(/w-\[260px\]/);
  });

  it("chat scroll area uses 32px page padding (p-8)", () => {
    expect(chat).toMatch(/<ScrollArea[^>]*className="[^"]*\bp-8\b/);
  });

  it("message list uses 850px max width and 24px gap", () => {
    expect(chat).toMatch(/max-w-\[850px\][^"]*space-y-6/);
  });

  it("composer uses 850px max width and 28px radius", () => {
    expect(chat).toMatch(/max-w-\[850px\]/);
    expect(chat).toMatch(/rounded-\[28px\]/);
  });

  it('composer placeholder is exactly "Message Omepilot"', () => {
    expect(chat).toMatch(/placeholder="Message Omepilot"/);
    expect(chat).not.toMatch(/Message Copilot/);
  });
});

describe("No stray Copilot branding in chat surfaces", () => {
  it("ChatInterface contains no 'Copilot' references", () => {
    expect(read("src/components/ChatInterface.tsx")).not.toMatch(/Copilot/);
  });
  it("Sidebar contains no 'Copilot' references", () => {
    expect(read("src/components/Sidebar.tsx")).not.toMatch(/Copilot/);
  });
});
