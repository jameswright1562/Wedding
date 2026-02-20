import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

export const metadata: Metadata = {
  title: "Ryan & Emmie | Wedding Invitation",
  description:
    "RSVP to celebrate Ryan and Emmie's wedding — select your meal choices and share dietary notes.",
};

export const viewport: Viewport = {
  themeColor: "#161421",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${greatVibes.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
