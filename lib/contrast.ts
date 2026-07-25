/**
 * Colour contrast, from the theme tokens.
 *
 * Every colour on this site is an HSL token in app/globals.css, so whether the
 * text is readable is decidable without a browser: parse the tokens, compute
 * the ratios, compare against WCAG. That matters because there are three
 * presets in light and dark, and nobody is going to open all six.
 *
 * The maths is WCAG 2.1's, not an approximation — the same numbers a browser
 * audit reports, so a fix here is a fix there.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** WCAG AA needs 4.5:1 for body text, 3:1 for large text and interface parts. */
export const AA_TEXT = 4.5;
export const AA_LARGE = 3;

/** Parses an unwrapped token like "215 35% 12%". Returns null if malformed. */
export function parseHsl(value: string): Rgb | null {
  const match = /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*$/.exec(value);
  if (!match?.[1] || !match[2] || !match[3]) {
    return null;
  }
  return hslToRgb(Number(match[1]), Number(match[2]) / 100, Number(match[3]) / 100);
}

export function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = (((hue % 360) + 360) % 360) / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const offset = lightness - chroma / 2;

  const [r, g, b] = (
    [
      [chroma, second, 0],
      [second, chroma, 0],
      [0, chroma, second],
      [0, second, chroma],
      [second, 0, chroma],
      [chroma, 0, second]
    ][Math.floor(sector) % 6] ?? [0, 0, 0]
  ).map((channel) => Math.round((channel + offset) * 255));

  return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
}

/** Relative luminance, per WCAG 2.1. */
export function luminance({ r, g, b }: Rgb): number {
  const channel = (value: number): number => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two colours, from 1 (identical) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const lighter = Math.max(luminance(a), luminance(b));
  const darker = Math.min(luminance(a), luminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

/** The ratio between two raw token values, or null if either is unparseable. */
export function tokenContrast(foreground: string, background: string): number | null {
  const a = parseHsl(foreground);
  const b = parseHsl(background);
  return a && b ? contrastRatio(a, b) : null;
}

export interface TokenBlock {
  /** "ink" for the default, or the preset name. */
  preset: string;
  theme: "light" | "dark";
  tokens: Record<string, string>;
}

/**
 * Every palette defined in globals.css.
 *
 * `:root` is the default light palette; `:root.dark` its dark counterpart; and
 * `:root[data-preset="x"]` pairs for each preset. Read from the stylesheet
 * rather than a duplicate list, so a palette cannot be added without being
 * checked.
 */
export function parseThemeBlocks(css: string): TokenBlock[] {
  const blocks: TokenBlock[] = [];
  // Comments are stripped first. Declarations are found by splitting on ";",
  // and a comment sitting above a token would otherwise become part of that
  // segment and stop it matching — silently skipping the token rather than
  // failing, which is the worst thing a checker can do.
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const pattern = /(:root(?:\[data-preset="([a-z0-9-]+)"\])?(\.dark)?)\s*\{([^}]*)\}/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(withoutComments)) !== null) {
    const [, , preset, dark, body] = match;
    const tokens: Record<string, string> = {};

    for (const declaration of (body ?? "").split(";")) {
      const parsed = /^\s*--([a-z-]+)\s*:\s*([^;]+?)\s*$/.exec(declaration);
      if (parsed?.[1] && parsed[2]) {
        tokens[parsed[1]] = parsed[2];
      }
    }

    if (Object.keys(tokens).length > 0) {
      blocks.push({ preset: preset ?? "ink", theme: dark ? "dark" : "light", tokens });
    }
  }
  return blocks;
}

export interface ContrastPair {
  foreground: string;
  background: string;
  /** What this combination is used for, named as a reader would see it. */
  usage: string;
  minimum: number;
}

/**
 * The combinations the design actually puts on screen.
 *
 * Listed by hand because only the design knows which token sits on which — and
 * checking every pair would flag combinations that never meet.
 */
export const CHECKED_PAIRS: ContrastPair[] = [
  { foreground: "ink", background: "paper", usage: "body text", minimum: AA_TEXT },
  { foreground: "ink-muted", background: "paper", usage: "dates, captions, labels", minimum: AA_TEXT },
  { foreground: "accent", background: "paper", usage: "links", minimum: AA_TEXT },
  { foreground: "rubric", background: "paper", usage: "draft and warning text", minimum: AA_TEXT },
  { foreground: "ink", background: "surface", usage: "text on a raised panel", minimum: AA_TEXT },
  { foreground: "ink-muted", background: "surface", usage: "muted text on a panel", minimum: AA_TEXT },
  { foreground: "accent-contrast", background: "accent", usage: "text on an accent fill", minimum: AA_TEXT },
  // Dividers are decorative: WCAG requires no contrast for them, and this
  // design wants them faint. The floor only catches a rule that has effectively
  // vanished — not one that is merely subtle, which is the intent.
  { foreground: "rule", background: "paper", usage: "hairline rules (visible at all)", minimum: 1.2 }
];

export interface ContrastFailure {
  preset: string;
  theme: string;
  usage: string;
  pair: string;
  ratio: number;
  minimum: number;
}

/** Every combination that falls short, across every palette in the stylesheet. */
export function findContrastFailures(css: string, pairs = CHECKED_PAIRS): ContrastFailure[] {
  const failures: ContrastFailure[] = [];

  for (const block of parseThemeBlocks(css)) {
    for (const pair of pairs) {
      const foreground = block.tokens[pair.foreground];
      const background = block.tokens[pair.background];
      if (foreground === undefined || background === undefined) {
        continue; // A preset block may inherit a token it does not restate.
      }

      const ratio = tokenContrast(foreground, background);
      if (ratio !== null && ratio < pair.minimum) {
        failures.push({
          preset: block.preset,
          theme: block.theme,
          usage: pair.usage,
          pair: `${pair.foreground} on ${pair.background}`,
          ratio,
          minimum: pair.minimum
        });
      }
    }
  }
  return failures;
}
