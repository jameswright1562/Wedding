"use client";

import { useMemo } from "react";
import { ArrowBanner } from "@/components/ArrowBanner";
import { InviteDetails } from "@/components/InviteDetails";
import { InviteHeader } from "@/components/InviteHeader";
import { MenuSection } from "@/components/MenuSection";
import { RsvpForm } from "@/components/RsvpForm";

export default function Page() {
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

  return (
    <main className="invite">
      <InviteHeader />
      <InviteDetails date={inviteDate} />
      <MenuSection />
      <section className="invite__rsvp-form">
        <ArrowBanner />
        <RsvpForm />
      </section>
    </main>
  );
}
