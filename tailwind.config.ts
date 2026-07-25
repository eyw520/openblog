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
      }
    }
  },
  plugins: [typography]
};

export default config;
