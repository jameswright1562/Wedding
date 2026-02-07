import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

describe("wedding invite page", () => {
  it("renders key invitation details and RSVP form", async () => {
    const html = await readFile(new URL("../index.html", import.meta.url), "utf-8");
    const dom = new JSDOM(html);
    const { document } = dom.window;

    expect(document.querySelector(".invite__names")?.textContent).toContain(
      "Ryan"
    );
    expect(document.querySelector(".invite__menu")).not.toBeNull();
    expect(document.querySelector("#rsvp-form")).not.toBeNull();
    expect(document.querySelectorAll(".arrow").length).toBe(2);
    expect(document.querySelector("#add-dependent")).not.toBeNull();
    expect(document.querySelector("#dependent-template")).not.toBeNull();
  });
});
