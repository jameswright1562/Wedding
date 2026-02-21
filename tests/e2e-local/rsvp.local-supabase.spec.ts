import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import {
  addGuest,
  fillAdultDependent,
  fillChildDependent,
  fillPrimaryGuest,
  openRsvpForm,
} from "../support/rsvp";

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
  id: string | number;
  guest_name: string;
  dependent_of: string | null;
  isKid: boolean;
  sorbet: string;
  notes: string;
};

async function fetchRowsForPrimary(primaryName: string) {
  return adminClient
    .from("wedding_rsvps")
    .select("id, guest_name, dependent_of, isKid, sorbet, notes")
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

  await openRsvpForm(page);

  await fillPrimaryGuest(page, {
    name: primaryName,
    notes: "No peanuts",
  });

  const depAdult = await addGuest(page);
  await fillAdultDependent(depAdult, {
    name: adultGuest,
    starterIndex: 1,
    sorbetIndex: 2,
    mainIndex: 2,
    dessertIndex: 1,
    notes: "Vegetarian",
  });

  const depChild = await addGuest(page);
  await fillChildDependent(depChild, {
    name: childGuest,
    starterIndex: 1,
    mainIndex: 1,
    dessertIndex: 1,
    notes: "No dairy",
  });

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

test("editing an existing RSVP replaces rows instead of duplicating them", async ({
  page,
}) => {
  const runId = Date.now().toString(36);
  const primaryName = `editable_primary_${runId}`;
  const removedAdultGuest = `old_adult_${runId}`;
  const replacementChildGuest = `new_child_${runId}`;

  await openRsvpForm(page);

  await fillPrimaryGuest(page, {
    name: primaryName,
    notes: "Initial notes",
  });

  const originalAdult = await addGuest(page);
  await fillAdultDependent(originalAdult, {
    name: removedAdultGuest,
  });

  await page.getByRole("button", { name: "Send RSVP" }).click();
  await expect(page).toHaveURL(/thank-you\?id=/);

  const firstSubmissionUrl = new URL(page.url());
  const inviteId = firstSubmissionUrl.searchParams.get("id");
  expect(inviteId).toBeTruthy();

  await expect
    .poll(async () => {
      const { data, error } = await fetchRowsForPrimary(primaryName);
      if (error) {
        throw new Error(`Failed to fetch initial rows: ${error.message}`);
      }
      return data?.length ?? 0;
    })
    .toBe(2);

  await page.getByRole("link", { name: "Go back to the RSVP form" }).click();
  await expect(page).toHaveURL(new RegExp(`\\/\\?id=${inviteId}&editing=true`));
  await expect(page.getByLabel("Full Name")).toHaveValue(primaryName);

  await page.getByRole("button", { name: "Remove guest 1" }).click();
  await expect(page.locator(".dependent")).toHaveCount(0);

  const replacementChild = await addGuest(page);
  await fillChildDependent(replacementChild, {
    name: replacementChildGuest,
    starterIndex: 1,
    mainIndex: 1,
    dessertIndex: 1,
    notes: "No nuts",
  });
  await page.getByLabel("Dietary Notes").first().fill("Updated notes");

  await page.getByRole("button", { name: "Send RSVP" }).click();
  await expect(page).toHaveURL(new RegExp(`thank-you\\?id=${inviteId}`));

  await expect
    .poll(async () => {
      const { data, error } = await fetchRowsForPrimary(primaryName);
      if (error) {
        throw new Error(`Failed to fetch updated rows: ${error.message}`);
      }
      return data?.length ?? 0;
    })
    .toBe(2);

  const { data, error } = await fetchRowsForPrimary(primaryName);
  if (error || !data) {
    throw new Error(`Failed to fetch final rows after edit: ${error?.message ?? "unknown error"}`);
  }

  const rows = data as RsvpRow[];
  const primaryRows = rows.filter(
    (row) => row.guest_name === primaryName && row.dependent_of === null,
  );
  const childRow = rows.find((row) => row.guest_name === replacementChildGuest);
  const staleAdultRow = rows.find((row) => row.guest_name === removedAdultGuest);

  expect(primaryRows).toHaveLength(1);
  expect(staleAdultRow).toBeUndefined();
  expect(childRow).toBeDefined();
  expect(childRow?.dependent_of).toBe(primaryName);
  expect(childRow?.isKid).toBe(true);
  expect(childRow?.sorbet).toBe("");
});

test("stores trimmed names for primary and dependent guests", async ({ page }) => {
  const runId = Date.now().toString(36);
  const primaryName = `trimmed_primary_${runId}`;
  const adultGuest = `trimmed_adult_${runId}`;

  await openRsvpForm(page);

  await fillPrimaryGuest(page, {
    name: `  ${primaryName}  `,
    notes: "Trim check",
  });

  const adult = await addGuest(page);
  await fillAdultDependent(adult, {
    name: `  ${adultGuest}  `,
  });

  await page.getByRole("button", { name: "Send RSVP" }).click();
  await expect(page).toHaveURL(/thank-you/);

  await expect
    .poll(async () => {
      const { data, error } = await fetchRowsForPrimary(primaryName);
      if (error) {
        throw new Error(`Failed to fetch trimmed rows: ${error.message}`);
      }
      return data?.length ?? 0;
    })
    .toBe(2);

  const { data, error } = await fetchRowsForPrimary(primaryName);
  if (error || !data) {
    throw new Error(
      `Failed to fetch final rows for trim check: ${error?.message ?? "unknown error"}`,
    );
  }

  const rows = data as RsvpRow[];
  const primaryRow = rows.find((row) => row.guest_name === primaryName);
  const adultRow = rows.find((row) => row.guest_name === adultGuest);

  expect(primaryRow).toBeDefined();
  expect(adultRow).toBeDefined();
  expect(adultRow?.dependent_of).toBe(primaryName);
});
