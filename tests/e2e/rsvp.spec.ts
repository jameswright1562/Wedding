import { expect, test } from "@playwright/test";
import {
  addGuest,
  fillAdultDependent,
  fillChildDependent,
  fillPrimaryGuest,
  openRsvpForm,
  parseSubmissionRows,
  SubmissionRow,
} from "../support/rsvp";

test.describe("RSVP UI and Supabase breakage coverage", () => {
  test("submits adult and child guests and sends the expected payload", async ({
    page,
  }) => {
    let submittedRows: SubmissionRow[] = [];

    await page.route("**/rest/v1/wedding_rsvps*", async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }

      submittedRows = parseSubmissionRows(route.request());
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(submittedRows),
      });
    });

    await openRsvpForm(page);

    await fillPrimaryGuest(page, { name: "Alex Guest", notes: "No peanuts please" });

    const adultCard = await addGuest(page);
    await fillAdultDependent(adultCard, {
      name: "Jamie PlusOne",
      starterIndex: 1,
      sorbetIndex: 2,
      mainIndex: 2,
      dessertIndex: 1,
      notes: "Vegetarian",
    });

    const childCard = await addGuest(page);
    await fillChildDependent(childCard, {
      name: "Casey Kiddo",
      starterIndex: 1,
      mainIndex: 1,
      dessertIndex: 1,
      notes: "No dairy",
    });

    await page.getByRole("button", { name: "Send RSVP" }).click();

    await expect(page).toHaveURL(/thank-you\?id=/);
    expect(new URL(page.url()).searchParams.get("id")).toBeTruthy();
    expect(new URL(page.url()).searchParams.get("id")).not.toBe("undefined");
    await expect(page.getByRole("heading", { name: "Thank You" })).toBeVisible();

    expect(submittedRows).toHaveLength(3);

    const primaryRow = submittedRows.find((row) => row.guest_name === "Alex Guest");
    const adultRow = submittedRows.find((row) => row.guest_name === "Jamie PlusOne");
    const childRow = submittedRows.find((row) => row.guest_name === "Casey Kiddo");

    expect(primaryRow?.dependent_of).toBeNull();
    expect(primaryRow?.isKid).toBe(false);

    expect(adultRow?.dependent_of).toBe("Alex Guest");
    expect(adultRow?.isKid).toBe(false);
    expect(adultRow?.sorbet).toBeTruthy();

    expect(childRow?.dependent_of).toBe("Alex Guest");
    expect(childRow?.isKid).toBe(true);
    expect(childRow?.sorbet).toBe("");
  });

  test("prevents submission when required fields are empty", async ({ page }) => {
    let insertCallCount = 0;

    await page.route("**/rest/v1/wedding_rsvps*", async (route) => {
      if (route.request().method() === "POST") {
        insertCallCount += 1;
      }
      return route.continue();
    });

    await openRsvpForm(page);
    await page.getByRole("button", { name: "Send RSVP" }).click();

    await expect(page).toHaveURL(/\/$/);
    expect(insertCallCount).toBe(0);
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("does not submit removed guests", async ({ page }) => {
    let submittedRows: SubmissionRow[] = [];

    await page.route("**/rest/v1/wedding_rsvps*", async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }

      submittedRows = parseSubmissionRows(route.request());
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(submittedRows),
      });
    });

    await openRsvpForm(page);
    await fillPrimaryGuest(page, { name: "Remove Test Primary" });

    const firstAdult = await addGuest(page);
    await fillAdultDependent(firstAdult, { name: "Removed Guest" });

    const secondAdult = await addGuest(page);
    await fillAdultDependent(secondAdult, { name: "Kept Guest" });

    await page.getByRole("button", { name: "Remove guest 1" }).click();
    await expect(page.locator(".dependent")).toHaveCount(1);

    await page.getByRole("button", { name: "Send RSVP" }).click();
    await expect(page).toHaveURL(/thank-you\?id=/);

    expect(submittedRows.map((row) => row.guest_name)).toEqual([
      "Remove Test Primary",
      "Kept Guest",
    ]);
  });

  test("trims primary and dependent names before sending", async ({ page }) => {
    let submittedRows: SubmissionRow[] = [];

    await page.route("**/rest/v1/wedding_rsvps*", async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }

      submittedRows = parseSubmissionRows(route.request());
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(submittedRows),
      });
    });

    await openRsvpForm(page);
    await fillPrimaryGuest(page, { name: "  Trimmed Primary  " });

    const adultCard = await addGuest(page);
    await fillAdultDependent(adultCard, { name: "  Trimmed Dependent  " });

    await page.getByRole("button", { name: "Send RSVP" }).click();
    await expect(page).toHaveURL(/thank-you\?id=/);

    expect(submittedRows[0]?.guest_name).toBe("Trimmed Primary");
    expect(submittedRows[1]?.guest_name).toBe("Trimmed Dependent");
    expect(submittedRows[1]?.dependent_of).toBe("Trimmed Primary");
  });

  test("shows loading state while waiting for Supabase response", async ({ page }) => {
    let insertCallCount = 0;

    await page.route("**/rest/v1/wedding_rsvps*", async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }

      insertCallCount += 1;
      const submittedRows = parseSubmissionRows(route.request());
      await new Promise((resolve) => setTimeout(resolve, 800));
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(submittedRows),
      });
    });

    await openRsvpForm(page);
    await fillPrimaryGuest(page, { name: "Slow Guest" });

    await page.getByRole("button", { name: "Send RSVP" }).click();

    await expect(page.getByRole("button", { name: "Sending..." })).toBeDisabled();
    await expect(page.locator(".button-spinner")).toBeVisible();

    await expect(page).toHaveURL(/thank-you\?id=/);
    expect(insertCallCount).toBe(1);
  });

  test("shows an error on transient network failure and succeeds after retry flow", async ({
    page,
  }) => {
    let insertCallCount = 0;

    await page.route("**/rest/v1/wedding_rsvps*", async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }

      insertCallCount += 1;
      if (insertCallCount === 1) {
        return route.abort("failed");
      }

      const submittedRows = parseSubmissionRows(route.request());
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(submittedRows),
      });
    });

    await openRsvpForm(page);
    await fillPrimaryGuest(page, { name: "Retry Guest" });

    await page.getByRole("button", { name: "Send RSVP" }).click();
    await expect(page.getByRole("status")).toHaveText("Try again.");
    await expect(page.getByRole("button", { name: "Sending..." })).toBeDisabled();

    await openRsvpForm(page);
    await fillPrimaryGuest(page, { name: "Retry Guest" });
    await page.getByRole("button", { name: "Send RSVP" }).click();
    await expect(page).toHaveURL(/thank-you\?id=/);
    expect(insertCallCount).toBe(2);
  });

  test("shows an error when Supabase returns an insert error", async ({ page }) => {
    await page.route("**/rest/v1/wedding_rsvps*", async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }

      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "db down" }),
      });
    });

    await openRsvpForm(page);
    await fillPrimaryGuest(page, { name: "Error Guest" });
    await page.getByRole("button", { name: "Send RSVP" }).click();

    await expect(page.getByRole("status")).toHaveText("Try again.");
    await expect(page).toHaveURL(/\/$/);
  });

  test("loads existing invite data, then issues delete and insert on save", async ({
    page,
  }) => {
    let deleteCalled = false;
    let submittedRows: SubmissionRow[] = [];

    const existingRows = [
      {
        id: "invite-existing",
        guest_name: "Existing Guest",
        starter: "Tomato & roasted red pepper soup with basil pesto (V)",
        sorbet: "Lemon",
        main_course:
          "Braised blade of beef with dauphinoise potatoes & roasted vegetables",
        dessert: "Dark chocolate mousse, fresh raspberries & chocolate cookie",
        notes: "Existing notes",
        dependent_of: null,
        dependent_of_id: null,
        isKid: false,
      },
      {
        id: "dep-existing",
        guest_name: "Existing Child",
        starter: "Garlic bread",
        sorbet: "",
        main_course: "Fish fingers, chips & beans OR peas",
        dessert: "Mini chocolate brownie with vanilla ice cream",
        notes: "No dairy",
        dependent_of: "Existing Guest",
        dependent_of_id: "invite-existing",
        isKid: true,
      },
    ];

    await page.route("**/rest/v1/wedding_rsvps*", async (route) => {
      const method = route.request().method();

      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(existingRows),
        });
      }

      if (method === "DELETE") {
        deleteCalled = true;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
      }

      if (method === "POST") {
        submittedRows = parseSubmissionRows(route.request());
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(submittedRows),
        });
      }

      return route.continue();
    });

    await openRsvpForm(page, "/?id=invite-existing&editing=true");
    await expect(page.getByLabel("Full Name")).toHaveValue("Existing Guest");
    await expect(page.locator(".dependent")).toHaveCount(1);

    await page.getByLabel("Dietary Notes").first().fill("Updated notes");
    await page.getByRole("button", { name: "Send RSVP" }).click();

    await expect(page).toHaveURL(/thank-you\?id=invite-existing/);
    expect(deleteCalled).toBe(true);
    expect(submittedRows[0]?.id).toBe("invite-existing");
    expect(submittedRows[0]?.notes).toBe("Updated notes");
  });

  test("falls back to a blank form when loading invite data fails", async ({ page }) => {
    await page.route("**/rest/v1/wedding_rsvps*", async (route) => {
      const method = route.request().method();

      if (method === "GET") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "query failed" }),
        });
      }

      if (method === "POST") {
        const submittedRows = parseSubmissionRows(route.request());
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(submittedRows),
        });
      }

      return route.continue();
    });

    await openRsvpForm(page, "/?id=broken-invite&editing=true");
    await expect(page.getByLabel("Full Name")).toHaveValue("");

    await fillPrimaryGuest(page, { name: "Fallback Guest" });
    await page.getByRole("button", { name: "Send RSVP" }).click();

    await expect(page).toHaveURL(/thank-you\?id=/);
  });
});
