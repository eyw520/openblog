import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CHECKED_PAIRS, findContrastFailures, parseThemeBlocks } from "../lib/contrast";

/**
 * Checks every palette in app/globals.css for readable contrast.
 *
 * Part of `make check`, because this is a class of bug that is invisible in
 * review, easy to introduce (one opacity modifier did it), and only shows up
 * for the readers least able to work around it. Three presets in light and dark
 * is six palettes nobody is going to open by hand.
 */
function main(): void {
  const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf-8");
  const blocks = parseThemeBlocks(css);

  if (blocks.length === 0) {
    console.error("No theme palettes found in app/globals.css — has the :root block moved?");
    process.exit(1);
  }

  const failures = findContrastFailures(css);

  if (failures.length > 0) {
    console.error("\nSome colours are too close to read:\n");
    for (const failure of failures) {
      console.error(
        `  • ${failure.preset} (${failure.theme}) — ${failure.usage}: ` +
          `${failure.pair} is ${failure.ratio.toFixed(2)}:1, needs ${failure.minimum}:1`
      );
    }
    console.error("\nAdjust the lightness of those tokens in app/globals.css.");
    console.error("Darkening a foreground or lightening a background both work.\n");
    process.exit(1);
  }

  console.log(
    `Contrast is sound: ${blocks.length} palette(s) × ${CHECKED_PAIRS.length} combinations checked.`
  );
}

main();
