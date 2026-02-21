import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";
import { Control, Controller, UseFormRegister } from "react-hook-form";
import {
  desserts,
  kidDesserts,
  kidMains,
  kidStarters,
  mains,
  sorbets,
  starters,
} from "./menu-data";
import { Dependent, RSVPFormData } from "./types";

type Props = {
  index: number;
  onRemove: () => void;
  control: Control<RSVPFormData>;
  register: UseFormRegister<RSVPFormData>;
  type: Dependent["type"];
};

export function DependentCard({
  index,
  onRemove,
  control,
  register,
  type,
}: Props) {
  return (
    <div className="dependent">
      <div className="dependent__title">
        <span className="dependent__label">Guest {index + 1}</span>
        <button
          type="button"
          className="dependent__remove"
          onClick={onRemove}
          aria-label={`Remove guest ${index + 1}`}
        >
          Remove
        </button>
      </div>

      <label>
        Guest Name
        <input
          type="text"
          {...register(`dependents.${index}.name`, { required: true })}
          placeholder="Guest name"
        />
      </label>

      <Controller
        control={control}
        name={`dependents.${index}.type`}
        render={({ field }) => (
          <Tabs.Root value={field.value} onValueChange={field.onChange}>
            <Tabs.List
              className="tab-buttons"
              aria-label="Guest type"
              style={{ gap: "8px", padding: "1rem" }}
            >
              <Tabs.Trigger
                value="adult"
                className={clsx("tab-btn", { active: field.value === "adult" })}
              >
                Adult
              </Tabs.Trigger>
              <Tabs.Trigger
                value="dependant"
                className={clsx("tab-btn", {
                  active: field.value === "dependant",
                })}
              >
                Child
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content
              value="adult"
              className={clsx("tab-panel", { active: field.value === "adult" })}
            >
              <label>
                Starter Selection
                <select
                  {...register(`dependents.${index}.starterAdult`, {
                    required: field.value === "adult",
                  })}
                  disabled={field.value !== "adult"}
                >
                  <option value="">Select a starter</option>
                  {starters.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Sorbet Selection
                <select
                  {...register(`dependents.${index}.sorbet`, {
                    required: field.value === "adult",
                  })}
                  disabled={field.value !== "adult"}
                >
                  <option value="">Select a sorbet</option>
                  {sorbets.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Main Course Selection
                <select
                  {...register(`dependents.${index}.mainCourseAdult`, {
                    required: field.value === "adult",
                  })}
                  disabled={field.value !== "adult"}
                >
                  <option value="">Select a main course</option>
                  {mains.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Dessert Selection
                <select
                  {...register(`dependents.${index}.dessertAdult`, {
                    required: field.value === "adult",
                  })}
                  disabled={field.value !== "adult"}
                >
                  <option value="">Select a dessert</option>
                  {desserts.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </Tabs.Content>

            <Tabs.Content
              value="dependant"
              className={clsx("tab-panel", {
                active: field.value === "dependant",
              })}
            >
              <label>
                Starter Selection
                <select
                  {...register(`dependents.${index}.starterKid`, {
                    required: field.value === "dependant",
                  })}
                  disabled={field.value !== "dependant"}
                >
                  <option value="">Select a starter</option>
                  {kidStarters.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Main Course Selection
                <select
                  {...register(`dependents.${index}.mainCourseKid`, {
                    required: field.value === "dependant",
                  })}
                  disabled={field.value !== "dependant"}
                >
                  <option value="">Select a main course</option>
                  {kidMains.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Dessert Selection
                <select
                  {...register(`dependents.${index}.dessertKid`, {
                    required: field.value === "dependant",
                  })}
                  disabled={field.value !== "dependant"}
                >
                  <option value="">Select a dessert</option>
                  {kidDesserts.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </Tabs.Content>
          </Tabs.Root>
        )}
      />

      <label>
        Dietary Notes
        <textarea
          rows={2}
          placeholder="Allergies or notes"
          {...register(`dependents.${index}.notes`)}
        />
      </label>
    </div>
  );
}
