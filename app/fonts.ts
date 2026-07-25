import { Archivo, Newsreader } from "next/font/google";

// Two variable families, self-hosted at build time by next/font — no runtime
// request to Google, no layout shift. Both are SIL Open Font License, so they
// ship with the framework without a licensing question.
//
// The pairing is deliberate: a tight grotesque for headings and labels against a
// screen-tuned reading serif for prose. Swapping either one is a two-line change
// here plus the matching `fontFamily` entry in tailwind.config.ts.

/** Masthead, headings, and metadata labels. */
export const displayFont = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

/** Body copy — Newsreader's optical sizing keeps long-form text comfortable. */
export const bodyFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  style: ["normal", "italic"]
});
