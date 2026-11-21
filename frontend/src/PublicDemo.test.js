import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PublicDemo from "./PublicDemo";

test("a citation opens on the evidence heading, including links between related pages", async () => {
  const catalog = {
    reports: [{ publisher: "Shell", sector: "Oil and gas", edition: "2021", url: "https://example.org/report.pdf" }],
    pages: [[0, 92, 50, []], [0, 95, 50, []]], stop: [], topics: []
  };
  const initialUrl = window.location.href;
  const previousFetch = global.fetch;
  const previousScroll = HTMLElement.prototype.scrollIntoView;
  global.fetch = jest.fn(async url => ({ ok: true, json: async () => url.endsWith("catalog.json") ? catalog : {} }));
  HTMLElement.prototype.scrollIntoView = jest.fn();
  try {
    window.history.replaceState({}, "", "/?publisher=Shell&page=92");
    render(<PublicDemo />);
    const target = await screen.findByRole("heading", { name: "PDF page 92" });
    await waitFor(() => expect(target).toHaveFocus());
    fireEvent.click(screen.getByRole("link", { name: /Check reported progress/ }));
    const progress = await screen.findByRole("heading", { name: "PDF page 95" });
    await waitFor(() => expect(progress).toHaveFocus());
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  } finally {
    global.fetch = previousFetch;
    if (previousScroll) HTMLElement.prototype.scrollIntoView = previousScroll;
    else delete HTMLElement.prototype.scrollIntoView;
    window.history.replaceState({}, "", initialUrl);
  }
});
