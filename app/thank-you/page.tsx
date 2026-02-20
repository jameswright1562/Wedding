"use client";

import Link from "next/link";

export default function ThankYouPage({searchParams}: {searchParams: {id?: string}}) {
  return (
    <main className="invite" style={{ textAlign: "center" }}>
      <div className="flourish flourish--left" />
      <div className="flourish flourish--right" />
      <h1 className="invite__names" style={{ marginTop: 16 }}>
        Thank You
      </h1>
      <p className="invite__subhead" style={{ marginBottom: 24 }}>
        We&apos;ve received your RSVP. We can&apos;t wait to celebrate with you.
      </p>
      <p className="invite__subhead">Need to update your response?</p>
      <Link href={`/?id=${searchParams.id}`} style={{ color: "#f2d7a1", fontWeight: 600 }}>
        Go back to the RSVP form
      </Link>
    </main>
  );
}
