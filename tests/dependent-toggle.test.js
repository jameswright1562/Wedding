import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

describe("dependent toggle", () => {
  it("enables kid panel controls when DEPENDANT button is clicked", async () => {
    const html = await readFile(new URL("../index.html", import.meta.url), "utf-8");
    const script = await readFile(new URL("../script.js", import.meta.url), "utf-8");

    const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
    const { window } = dom;
    const { document } = window;

    // Execute the page script inside the JSDOM window so event handlers are wired
    window.eval(script);

    const addBtn = document.querySelector("#add-dependent");
    expect(addBtn).not.toBeNull();
    addBtn.click();

    const dependent = document.querySelector(".dependent");
    expect(dependent).not.toBeNull();

    const dependantBtn = dependent.querySelector('.tab-btn[data-type="dependant"]');
    expect(dependantBtn).not.toBeNull();

    const dependantPanel = dependent.querySelector('.tab-panel[data-panel="dependant"]');
    const adultPanel = dependent.querySelector('.tab-panel[data-panel="adult"]');
    expect(dependantPanel).not.toBeNull();
    expect(adultPanel).not.toBeNull();

    const kidControls = dependantPanel.querySelectorAll('select, input, textarea');
    kidControls.forEach((c) => expect(c.disabled).toBe(true));

    // Toggle to dependant (kid) panel
    dependantBtn.click();

    kidControls.forEach((c) => expect(c.disabled).toBe(false));

    const adultControls = adultPanel.querySelectorAll('select, input, textarea');
    adultControls.forEach((c) => expect(c.disabled).toBe(true));
  });
});
