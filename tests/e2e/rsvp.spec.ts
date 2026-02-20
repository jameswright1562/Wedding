import { expect, test } from "@playwright/test";

test("visitor can submit RSVP with adult and child guests", async ({
  page,
}) => {
  await page.route("**/*", (route) => {
    if (route.request().url().includes("/rest/v1/wedding_rsvps")) {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: "[]",
      });
    }
    return route.continue();
  });

  await page.goto("/");
  await page.getByRole("heading", { name: "Ryan & Emmie" }).waitFor();

  await page.getByLabel("Full Name").fill("Alex Guest");
  await page.getByLabel("Starter Selection").first().selectOption({ index: 1 });
  await page.getByLabel("Sorbet Selection").first().selectOption({ index: 1 });
  await page
    .getByLabel("Main Course Selection")
    .first()
    .selectOption({ index: 1 });
  await page.getByLabel("Dessert Selection").first().selectOption({ index: 1 });
  await page.getByLabel("Dietary Notes").first().fill("No peanuts please");

  await page.getByRole("button", { name: "Add Guest" }).click();
  const dependents = page.locator(".dependent");
  await expect(dependents).toHaveCount(1);
  const dep1 = dependents.nth(0);
  await dep1.getByLabel("Guest Name").fill("Jamie PlusOne");
  await dep1.getByLabel("Starter Selection").selectOption({ index: 1 });
  await dep1.getByLabel("Sorbet Selection").selectOption({ index: 2 });
  await dep1.getByLabel("Main Course Selection").selectOption({ index: 2 });
  await dep1.getByLabel("Dessert Selection").selectOption({ index: 1 });
  await dep1.getByLabel("Dietary Notes").fill("Vegetarian");

  await page.getByRole("button", { name: "Add Guest" }).click();
  await expect(dependents).toHaveCount(2);
  const dep2 = dependents.nth(1);
  await dep2.getByLabel("Guest Name").fill("Casey Kiddo");
  await dep2.getByRole("tab", { name: "Child" }).click();
  await dep2.getByLabel("Starter Selection").selectOption({ index: 1 });
  await dep2.getByLabel("Main Course Selection").selectOption({ index: 1 });
  await dep2.getByLabel("Dessert Selection").selectOption({ index: 1 });
  await dep2.getByLabel("Dietary Notes").fill("No dairy");

  await page.getByRole("button", { name: "Send RSVP" }).click();

  await expect(page).toHaveURL(/thank-you/);
  await expect(page.getByRole("heading", { name: "Thank You" })).toBeVisible();
});
