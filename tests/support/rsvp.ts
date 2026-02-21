import { expect, Locator, Page, Request } from "@playwright/test";

export type SubmissionRow = {
  id?: string | number;
  guest_name: string;
  starter: string;
  sorbet: string;
  main_course: string;
  dessert: string;
  notes: string;
  dependent_of: string | null;
  dependent_of_id?: string | number;
  isKid: boolean;
  submitted_at?: string;
};

type PrimaryGuestOptions = {
  name?: string;
  starterIndex?: number;
  sorbetIndex?: number;
  mainIndex?: number;
  dessertIndex?: number;
  notes?: string;
};

type AdultDependentOptions = {
  name?: string;
  starterIndex?: number;
  sorbetIndex?: number;
  mainIndex?: number;
  dessertIndex?: number;
  notes?: string;
};

type ChildDependentOptions = {
  name?: string;
  starterIndex?: number;
  mainIndex?: number;
  dessertIndex?: number;
  notes?: string;
};

export async function openRsvpForm(page: Page, path = "/") {
  await page.goto(path);
  await page.getByRole("heading", { name: "Ryan & Emmie" }).waitFor();
  await page.getByLabel("Full Name").waitFor();
}

export async function fillPrimaryGuest(
  page: Page,
  {
    name = "Alex Guest",
    starterIndex = 1,
    sorbetIndex = 1,
    mainIndex = 1,
    dessertIndex = 1,
    notes = "No peanuts please",
  }: PrimaryGuestOptions = {},
) {
  await page.getByLabel("Full Name").fill(name);
  await page.getByLabel("Starter Selection").first().selectOption({ index: starterIndex });
  await page.getByLabel("Sorbet Selection").first().selectOption({ index: sorbetIndex });
  await page.getByLabel("Main Course Selection").first().selectOption({ index: mainIndex });
  await page.getByLabel("Dessert Selection").first().selectOption({ index: dessertIndex });
  await page.getByLabel("Dietary Notes").first().fill(notes);
}

export async function addGuest(page: Page): Promise<Locator> {
  const dependents = page.locator(".dependent");
  const previousCount = await dependents.count();
  await page.getByRole("button", { name: "Add Guest" }).click();
  await expect(dependents).toHaveCount(previousCount + 1);
  return dependents.nth(previousCount);
}

export async function fillAdultDependent(
  card: Locator,
  {
    name = "Adult Guest",
    starterIndex = 1,
    sorbetIndex = 1,
    mainIndex = 1,
    dessertIndex = 1,
    notes = "Vegetarian",
  }: AdultDependentOptions = {},
) {
  await card.getByLabel("Guest Name").fill(name);
  await card.getByLabel("Starter Selection").selectOption({ index: starterIndex });
  await card.getByLabel("Sorbet Selection").selectOption({ index: sorbetIndex });
  await card.getByLabel("Main Course Selection").selectOption({ index: mainIndex });
  await card.getByLabel("Dessert Selection").selectOption({ index: dessertIndex });
  await card.getByLabel("Dietary Notes").fill(notes);
}

export async function fillChildDependent(
  card: Locator,
  {
    name = "Child Guest",
    starterIndex = 1,
    mainIndex = 1,
    dessertIndex = 1,
    notes = "No dairy",
  }: ChildDependentOptions = {},
) {
  await card.getByLabel("Guest Name").fill(name);
  await card.getByRole("tab", { name: "Child" }).click();
  await card.getByLabel("Starter Selection").selectOption({ index: starterIndex });
  await card.getByLabel("Main Course Selection").selectOption({ index: mainIndex });
  await card.getByLabel("Dessert Selection").selectOption({ index: dessertIndex });
  await card.getByLabel("Dietary Notes").fill(notes);
}

export function parseSubmissionRows(request: Request): SubmissionRow[] {
  const payload = request.postDataJSON();
  if (!Array.isArray(payload)) {
    throw new Error("Expected array payload for RSVP insert request.");
  }
  return payload as SubmissionRow[];
}
