import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

// Every color here reads a CSS variable from app/globals.css rather than naming
// a value, so the theme has exactly one source of truth. `<alpha-value>` is what
// lets utilities like `text-ink/60` work against an unwrapped HSL token.
const token = (name: string): string => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: token("paper"),
        surface: token("surface"),
        rule: token("rule"),
        rubric: token("rubric"),
        ink: {
          DEFAULT: token("ink"),
          muted: token("ink-muted")
        },
        accent: {
          DEFAULT: token("accent"),
          contrast: token("accent-contrast")
        }
      },
      fontFamily: {
        // Display carries the personality (masthead, headings); body carries the
        // reading. Both are variable fonts loaded in app/fonts.ts.
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-serif", "Georgia", "serif"]
      },
      maxWidth: {
        measure: "var(--measure)"
      },
      letterSpacing: {
        // Metadata is set in small uppercase display type; it needs air.
        label: "0.12em"
      },
      // The reading treatment for Markdown bodies. Every color is a token, so
      // prose restyles with the rest of the site from app/globals.css.
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "hsl(var(--ink))",
            "--tw-prose-headings": "hsl(var(--ink))",
            "--tw-prose-lead": "hsl(var(--ink-muted))",
            "--tw-prose-links": "hsl(var(--accent))",
            "--tw-prose-bold": "hsl(var(--ink))",
            "--tw-prose-counters": "hsl(var(--ink-muted))",
            "--tw-prose-bullets": "hsl(var(--rule))",
            "--tw-prose-hr": "hsl(var(--rule))",
            "--tw-prose-quotes": "hsl(var(--ink))",
            "--tw-prose-quote-borders": "hsl(var(--accent))",
            "--tw-prose-captions": "hsl(var(--ink-muted))",
            "--tw-prose-code": "hsl(var(--ink))",
            "--tw-prose-pre-code": "hsl(var(--ink))",
            "--tw-prose-pre-bg": "hsl(var(--surface))",
            "--tw-prose-th-borders": "hsl(var(--rule))",
            "--tw-prose-td-borders": "hsl(var(--rule))",
            maxWidth: "var(--measure)",
            fontSize: "1.125rem",
            lineHeight: "1.75",
            h2: { fontFamily: "var(--font-display)", letterSpacing: "-0.01em", fontWeight: "600" },
            h3: { fontFamily: "var(--font-display)", letterSpacing: "-0.01em", fontWeight: "600" },
            // Links stay readable as text: an offset underline rather than a
            // color-only cue, which fails for readers who cannot see the hue.
            a: { textDecorationThickness: "1px", textUnderlineOffset: "3px" },
            blockquote: { fontStyle: "italic", fontWeight: "400" },
            "code::before": { content: '""' },
            "code::after": { content: '""' }
          }
        }
      }
    }
  },
  plugins: [typography]
};

export default config;
