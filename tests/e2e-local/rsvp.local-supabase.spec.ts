import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Local Supabase tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function clearRsvps() {
  const { error } = await adminClient
    .from("wedding_rsvps")
    .delete()
    .not("id", "is", null);

  if (error) {
    throw new Error(`Failed to clear RSVPs: ${error.message}`);
  }
}

type RsvpRow = {
  guest_name: string;
  dependent_of: string | null;
  isKid: boolean;
  sorbet: string;
  notes: string;
};

async function fetchRowsForPrimary(primaryName: string) {
  return adminClient
    .from("wedding_rsvps")
    .select("guest_name, dependent_of, isKid, sorbet, notes")
    .or(`guest_name.eq.${primaryName},dependent_of.eq.${primaryName}`);
}

test.beforeEach(async () => {
  await clearRsvps();
});

test.afterEach(async () => {
  await clearRsvps();
});

test("visitor submission persists RSVP rows to local Supabase", async ({ page }) => {
  const runId = Date.now().toString(36);
  const primaryName = `primary_guest_${runId}`;
  const adultGuest = `adult_guest_${runId}`;
  const childGuest = `child_guest_${runId}`;

  await page.goto("/");
  await page.getByRole("heading", { name: "Ryan & Emmie" }).waitFor();

  await page.getByLabel("Full Name").fill(primaryName);
  await page.getByLabel("Starter Selection").first().selectOption({ index: 1 });
  await page.getByLabel("Sorbet Selection").first().selectOption({ index: 1 });
  await page
    .getByLabel("Main Course Selection")
    .first()
    .selectOption({ index: 1 });
  await page.getByLabel("Dessert Selection").first().selectOption({ index: 1 });
  await page.getByLabel("Dietary Notes").first().fill("No peanuts");

  await page.getByRole("button", { name: "Add Guest" }).click();
  const dependents = page.locator(".dependent");
  const depAdult = dependents.nth(0);
  await depAdult.getByLabel("Guest Name").fill(adultGuest);
  await depAdult.getByLabel("Starter Selection").selectOption({ index: 1 });
  await depAdult.getByLabel("Sorbet Selection").selectOption({ index: 2 });
  await depAdult.getByLabel("Main Course Selection").selectOption({ index: 2 });
  await depAdult.getByLabel("Dessert Selection").selectOption({ index: 1 });
  await depAdult.getByLabel("Dietary Notes").fill("Vegetarian");

  await page.getByRole("button", { name: "Add Guest" }).click();
  const depChild = dependents.nth(1);
  await depChild.getByLabel("Guest Name").fill(childGuest);
  await depChild.getByRole("tab", { name: "Child" }).click();
  await depChild.getByLabel("Starter Selection").selectOption({ index: 1 });
  await depChild.getByLabel("Main Course Selection").selectOption({ index: 1 });
  await depChild.getByLabel("Dessert Selection").selectOption({ index: 1 });
  await depChild.getByLabel("Dietary Notes").fill("No dairy");

  await page.getByRole("button", { name: "Send RSVP" }).click();

  await expect(page).toHaveURL(/thank-you/);
  await expect(page.getByRole("heading", { name: "Thank You" })).toBeVisible();

  await expect
    .poll(async () => {
      const { data, error } = await fetchRowsForPrimary(primaryName);
      if (error) {
        throw new Error(`Failed to fetch RSVPs: ${error.message}`);
      }
      return data?.length ?? 0;
    })
    .toBe(3);

  const { data, error } = await fetchRowsForPrimary(primaryName);
  if (error || !data) {
    throw new Error(`Failed to fetch final RSVP rows: ${error?.message ?? "unknown error"}`);
  }

  const rows = data as RsvpRow[];
  const primaryRow = rows.find((row) => row.guest_name === primaryName);
  const adultRow = rows.find((row) => row.guest_name === adultGuest);
  const childRow = rows.find((row) => row.guest_name === childGuest);

  expect(primaryRow).toBeDefined();
  expect(primaryRow?.dependent_of).toBeNull();
  expect(primaryRow?.isKid).toBe(false);

  expect(adultRow).toBeDefined();
  expect(adultRow?.dependent_of).toBe(primaryName);
  expect(adultRow?.isKid).toBe(false);

  expect(childRow).toBeDefined();
  expect(childRow?.dependent_of).toBe(primaryName);
  expect(childRow?.isKid).toBe(true);
  expect(childRow?.sorbet).toBe("");
});
