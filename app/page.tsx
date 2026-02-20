"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowBanner } from "@/components/ArrowBanner";
import { InviteDetails } from "@/components/InviteDetails";
import { InviteHeader } from "@/components/InviteHeader";
import { MenuSection } from "@/components/MenuSection";
import { RsvpForm } from "@/components/RsvpForm";
import { Dependent, RSVPFormData } from "@/components/types";
import { supabaseClient } from "@/lib/supabaseClient";

export default function Page({ searchParams }: { searchParams: { id?: string } }) {
  const inviteId = searchParams.id ?? null;
  const inviteDate = useMemo(
    () => ({
      month: "January",
      day: "Thursday",
      number: "14",
      time: "15:30 PM",
      year: "2027",
    }),
    [],
  );
  const [loading, setLoading] = useState(Boolean(inviteId));
  const [form, setForm] = useState<RSVPFormData | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadRsvp = async () => {
      if (!inviteId || !supabaseClient) {
        if (isActive) {
          setForm(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      const { data, error } = await supabaseClient
        .from("wedding_rsvps")
        .select()
        .or(`id.eq.${inviteId},dependent_of_id.eq.${inviteId}`);

      if (!isActive) {
        return;
      }

      if (error) {
        console.error(error);
        setForm(null);
      } else {
        const rows = data ?? [];
        const dependents : Dependent[] = rows.filter((item: RSVPFormData) => item.dependent_of_id === inviteId).map((item: RSVPFormData)=> {
          return {
            id: item.id,
            name: item.guest_name,
            dessertAdult: item.dessert,
            notes: item.notes,
            starterAdult: item.starter,
            sorbet: item.sorbet,
            type: item.isKid ? "dependant" : "adult",
            dessertKid: item.dessert,
            mainCourseAdult: item.main_course,
            mainCourseKid: item.main_course,
            starterKid: item.starter,
          };
        });
        const mainGuest = rows.find((item) => item.dependent_of_id === null);

        if (!mainGuest) {
          setForm(null);
        } else {
          mainGuest.dependents = dependents;
          setForm(mainGuest);
        }
      }
      console.log(form)
      setLoading(false);
    };

    void loadRsvp();

    return () => {
      isActive = false;
    };
  }, [inviteId]);

  return (
    <main className="invite">
      <InviteHeader />
      <InviteDetails date={inviteDate} />
      <MenuSection />
      {loading ? null : (
        <section className="invite__rsvp-form">
          <ArrowBanner />
          <RsvpForm form={form} />
        </section>
      )}
    </main>
  );
}
