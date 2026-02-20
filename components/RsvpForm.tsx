import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { hasSupabaseConfig, supabaseClient } from "@/lib/supabaseClient";
import { DependentCard } from "./DependentCard";
import { desserts, mains, sorbets, starters } from "./menu-data";
import { Dependent, RSVPFormData } from "./types";
import { useRouter } from "next/navigation";

const blankDependent = (): Dependent => ({
  name: "",
  type: "adult",
  notes: "",
  starterAdult: "",
  sorbet: "",
  mainCourseAdult: "",
  dessertAdult: "",
  starterKid: "",
  mainCourseKid: "",
  dessertKid: "",
});

const normalizeForMatch = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");

const levenshteinDistance = (left: string, right: string): number => {
  const matrix: number[][] = Array.from({ length: left.length + 1 }, () =>
    Array(right.length + 1).fill(0),
  );

  for (let i = 0; i <= left.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= right.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
};

const isCloseStringMatch = (
  left?: string | null,
  right?: string | null,
): boolean => {
  if (!left || !right) {
    return false;
  }

  const normalizedLeft = normalizeForMatch(left);
  const normalizedRight = normalizeForMatch(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  const maxLength = Math.max(normalizedLeft.length, normalizedRight.length);
  const distance = levenshteinDistance(normalizedLeft, normalizedRight);
  const allowedDistance = maxLength <= 6 ? 1 : Math.ceil(maxLength * 0.2);

  return distance <= allowedDistance;
};

const findBestMenuMatch = (
  currentValue: string | undefined,
  options: string[],
): string => {
  if (!currentValue) {
    return "";
  }

  const closest = options.find((option) => isCloseStringMatch(option, currentValue));
  return closest ?? currentValue;
};

const generateId = (): string => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function RsvpForm({ form }: { form?: RSVPFormData | null }) {
  const allowMockSubmit =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_SUPABASE_MOCK === "true";
  const router = useRouter();
  const [status, setStatus] = useState<{ message: string; isError: boolean }>({
    message: "",
    isError: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, watch } = useForm<RSVPFormData>({
    defaultValues: {
      guest_name: "",
      starter: "",
      sorbet: "",
      main_course: "",
      dessert: "",
      notes: "",
      dependents: [],
    },
  });

  useEffect(() => {
    if (!form) {
      return;
    }

    reset({
      ...form,
      starter: findBestMenuMatch(form.starter, starters),
      sorbet: findBestMenuMatch(form.sorbet, sorbets),
      main_course: findBestMenuMatch(form.main_course, mains),
      dessert: findBestMenuMatch(form.dessert, desserts),
      dependents: form.dependents ?? [],
    });
  }, [form, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "dependents",
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!hasSupabaseConfig || !supabaseClient) {
      if (allowMockSubmit) {
        setStatus({
          message: "Thank you! Your RSVP has been recorded.",
          isError: false,
        });
        reset();
        return;
      }
      setStatus({
        message:
          "Supabase is not configured. Add env vars to send RSVPs to the database.",
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ message: "Sending your RSVP...", isError: false });

    const submittedAt = new Date().toISOString();

    const id = form?.id ?? generateId();

    const primaryRow = {
      id,
      guest_name: data.guest_name.trim(),
      starter: data.starter,
      sorbet: data.sorbet,
      main_course: data.main_course,
      dessert: data.dessert,
      notes: data.notes,
      dependent_of: null,
      isKid: false,
      submitted_at: submittedAt,
    };

    const dependentRows = data.dependents
      .filter((d) => d.name.trim().length > 0)
      .map((d) => {
        const isKid = d.type === "dependant";
        return {
          guest_name: d.name.trim(),
          starter: isKid ? d.starterKid : d.starterAdult,
          sorbet: isKid ? "" : d.sorbet,
          main_course: isKid ? d.mainCourseKid : d.mainCourseAdult,
          dessert: isKid ? d.dessertKid : d.dessertAdult,
          notes: d.notes,
          isKid,
          dependent_of: primaryRow.guest_name,
          dependent_of_id: primaryRow.id,
          submitted_at: submittedAt,
          id: d.id ?? generateId(),
        };
      });

    try {
      if(form?.id)
      {
        await supabaseClient.from("wedding_rsvps").delete().select()
        .or(`id.eq.${id},dependent_of_id.in.(${id})`)
      }
      const { error, data } = await supabaseClient
        .from("wedding_rsvps")
        .insert([primaryRow, ...dependentRows]).select();

      if (error) {
        throw error;
      }

      setStatus({
        message: "Thank you! Your RSVP has been recorded.",
        isError: false,
      });
      reset();
      const mainGuest = data?.find((item) => item.id === primaryRow.id);
      router.push(`/thank-you?id=${mainGuest?.id}`);
    } catch (err) {
      console.error(err);
      setStatus({
        message: "Something went wrong. Please try again.",
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="rsvp-form" onSubmit={onSubmit}>
      <label>
        Full Name
        <input
          type="text"
          {...register("guest_name", { required: true })}
          placeholder="Your name"
        />
      </label>

      <label>
        Starter Selection
        <select {...register("starter", { required: true })}>
          <option value="">Select a starter</option>
          {starters.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sorbet Selection
        <select {...register("sorbet", { required: true })}>
          <option value="">Select a sorbet</option>
          {sorbets.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label>
        Main Course Selection
        <select {...register("main_course", { required: true })}>
          <option value="">Select a main course</option>
          {mains.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label>
        Dessert Selection
        <select {...register("dessert", { required: true })}>
          <option value="">Select a dessert</option>
          {desserts.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label>
        Dietary Notes
        <textarea
          rows={3}
          placeholder="Allergies or special requests"
          {...register("notes")}
        />
      </label>

      <div className="dependents">
        <div className="dependents__header">
          <h3>Additional Guests</h3>
          <button
            type="button"
            id="add-dependent"
            onClick={() => append(blankDependent())}
            aria-label="Add guest"
          >
            Add Guest
          </button>
        </div>
        <p className="dependents__hint">
          Add meal selections for any children or extra guests.
        </p>
        <div id="dependents-container" className="dependents__list">
          {fields.map((field, index) => (
            <DependentCard
              key={field.id}
              index={index}
              control={control}
              register={register}
              onRemove={() => remove(index)}
              type={watch(`dependents.${index}.type`)}
            />
          ))}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send RSVP"}
      </button>
      <p
        className="form-status"
        role="status"
        aria-live="polite"
        style={{ color: status.isError ? "#f7b3b3" : "#f2d7a1" }}
      >
        {status.message}
      </p>
    </form>
  );
}
