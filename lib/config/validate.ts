import { FIELD_TYPES } from "../content/fields";
import {
  ENTRY_LAYOUTS,
  INDEX_LAYOUTS,
  SORT_ORDERS,
  type SiteConfig,
  type SortOrder,
  THEME_PRESETS
} from "./define";

/**
 * Checks a site.config.ts for the mistakes that would otherwise surface as a
 * blank page or a broken deploy. Every message names the field, what was wrong,
 * and what to write instead — these are read by people who do not write code.
 *
 * Pure and total: it returns the full list of problems rather than throwing on
 * the first, so one run of the gate reports everything that needs fixing.
 */
export function validateConfig(config: SiteConfig): string[] {
  const errors: string[] = [];
  const field = (name: string, problem: string): void => {
    errors.push(`site.config.ts — ${name}: ${problem}`);
  };

  if (!isNonEmpty(config.title)) {
    field("title", 'must be your blog\'s name, for example title: "Field Notes".');
  }
  if (!isNonEmpty(config.description)) {
    field(
      "description",
      'must be one sentence describing the blog, for example description: "Essays on maps."'
    );
  }
  if (!isNonEmpty(config.author.name)) {
    field("author.name", 'must be your name, for example author: { name: "Ada Lovelace" }.');
  }

  validateUrl(config.url, field);
  validateCollections(config.collections, field);
  validateHome(config, field);
  validateComments(config, field);

  const preset = config.theme?.preset;
  if (preset !== undefined && !(THEME_PRESETS as readonly string[]).includes(preset)) {
    field("theme.preset", `"${preset}" is not a palette. Choose one of: ${THEME_PRESETS.join(", ")}.`);
  }

  config.social?.forEach((link, index) => {
    const at = `social[${index}]`;
    if (!isNonEmpty(link.label)) {
      field(`${at}.label`, 'must be the visible text, for example label: "Email".');
    }
    if (!isNonEmpty(link.href)) {
      field(`${at}.href`, 'must be where the link goes, for example href: "mailto:you@example.com".');
    } else if (!isAbsoluteUrl(link.href) && !link.href.startsWith("mailto:") && !link.href.startsWith("/")) {
      field(
        `${at}.href`,
        `"${link.href}" must start with "https://", "mailto:", or "/" — otherwise the link will not work.`
      );
    }
  });

  config.nav?.forEach((link, index) => {
    const at = `nav[${index}]`;
    if (!isNonEmpty(link.label)) {
      field(`${at}.label`, "must be the text shown in the navigation bar.");
    }
    if (!isNonEmpty(link.href)) {
      field(`${at}.href`, 'must be a path like "/about" or a full URL like "https://example.com".');
    } else if (!link.href.startsWith("/") && !isAbsoluteUrl(link.href)) {
      field(
        `${at}.href`,
        `"${link.href}" must start with "/" (a page on this blog) or "https://" (elsewhere).`
      );
    }
  });

  return errors;
}

type FieldReporter = (name: string, problem: string) => void;

function validateComments(config: SiteConfig, field: FieldReporter): void {
  const comments = config.comments;
  if (!comments) {
    return;
  }

  if (comments.provider !== "giscus") {
    field(
      "comments.provider",
      `"${String(comments.provider)}" is not supported. The only value is "giscus".`
    );
  }

  // "owner/name" — anything else means a copied URL or a bare repository name,
  // and giscus would silently render nothing at all.
  if (!/^[\w.-]+\/[\w.-]+$/.test(comments.repo)) {
    field(
      "comments.repo",
      `"${comments.repo}" must be the repository as owner/name, for example repo: "ada/notes" — ` +
        "not a full URL."
    );
  }

  for (const key of ["repoId", "categoryId", "category"] as const) {
    if (!isNonEmpty(comments[key])) {
      field(
        `comments.${key}`,
        "is missing. Visit https://giscus.app to read this value off your repository."
      );
    }
  }

  const declared = new Set(config.collections.map((collection) => collection.name));
  comments.collections?.forEach((name, index) => {
    if (!declared.has(name)) {
      field(
        `comments.collections[${index}]`,
        `"${name}" is not a collection you declared. Available: ${[...declared].join(", ") || "none"}.`
      );
    }
  });
}

function validateHome(config: SiteConfig, field: FieldReporter): void {
  const home = config.home;
  if (!home) {
    return;
  }

  if (home.latest !== undefined && (!Number.isInteger(home.latest) || home.latest < 0)) {
    field(
      "home.latest",
      `must be a whole number of posts to show, or 0 for none — got ${String(home.latest)}.`
    );
  }

  const declared = new Set(config.collections.map((collection) => collection.name));
  home.collections?.forEach((name, index) => {
    if (!declared.has(name)) {
      field(
        `home.collections[${index}]`,
        `"${name}" is not a collection you declared. Available: ${[...declared].join(", ") || "none"}.`
      );
    }
  });
}

function validateUrl(url: string, field: FieldReporter): void {
  if (!isNonEmpty(url)) {
    field("url", 'must be where the blog will live, for example url: "https://you.github.io/blog".');
    return;
  }
  if (!isAbsoluteUrl(url)) {
    field(
      "url",
      `"${url}" must be a full URL beginning with https://. ` +
        'For GitHub Pages that is "https://<username>.github.io/<repository>", ' +
        'or "https://yourdomain.com" if you use a custom domain.'
    );
  }
}

function validateCollections(collections: SiteConfig["collections"], field: FieldReporter): void {
  if (collections.length === 0) {
    field(
      "collections",
      'must declare at least one kind of writing, for example { name: "posts", label: "Writing" }.'
    );
    return;
  }

  const seenNames = new Set<string>();
  const seenRoutes = new Set<string>();

  collections.forEach((collection, index) => {
    const at = `collections[${index}]`;

    if (!/^[a-z0-9-]+$/.test(collection.name)) {
      field(
        `${at}.name`,
        `"${collection.name}" must be lowercase letters, numbers, and hyphens only — ` +
          "it is the folder name under content/."
      );
    } else if (seenNames.has(collection.name)) {
      field(`${at}.name`, `"${collection.name}" is declared twice; each collection needs its own name.`);
    }
    seenNames.add(collection.name);

    if (!isNonEmpty(collection.label)) {
      field(`${at}.label`, 'must be the name readers see, for example label: "Writing".');
    }

    if (collection.route !== undefined && !collection.route.startsWith("/")) {
      field(`${at}.route`, `"${collection.route}" must start with "/", for example route: "/writing".`);
    }

    const route = collection.route ?? `/${collection.name}`;
    if (seenRoutes.has(route)) {
      field(
        `${at}.route`,
        `"${route}" is already used by another collection; give this one a different route.`
      );
    }
    seenRoutes.add(route);

    if (collection.sort !== undefined && !isSortOrder(collection.sort)) {
      field(`${at}.sort`, `"${String(collection.sort)}" must be one of: ${SORT_ORDERS.join(", ")}.`);
    }

    if (
      collection.layout !== undefined &&
      !(ENTRY_LAYOUTS as readonly string[]).includes(collection.layout)
    ) {
      field(
        `${at}.layout`,
        `"${collection.layout}" is not a layout. Choose one of: ${ENTRY_LAYOUTS.join(", ")}, ` +
          "or add yours to components/layouts.tsx and to ENTRY_LAYOUTS in lib/config/define.ts."
      );
    }

    if (
      collection.indexLayout !== undefined &&
      !(INDEX_LAYOUTS as readonly string[]).includes(collection.indexLayout)
    ) {
      field(
        `${at}.indexLayout`,
        `"${collection.indexLayout}" is not an archive layout. Choose one of: ${INDEX_LAYOUTS.join(", ")}.`
      );
    }

    validateFieldSchema(at, collection.fields, field);
  });
}

/**
 * Checks a collection's declared field shapes. A schema is written once and
 * governs every file in the collection, so a mistake here is multiplied across
 * the whole section — worth catching precisely.
 */
function validateFieldSchema(
  at: string,
  fields: SiteConfig["collections"][number]["fields"],
  field: FieldReporter
): void {
  for (const [name, definition] of Object.entries(fields ?? {})) {
    const where = `${at}.fields.${name}`;

    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
      field(where, `"${name}" must be a plain word — it is the name written in the frontmatter.`);
    }

    if (!(FIELD_TYPES as readonly string[]).includes(definition.type)) {
      field(`${where}.type`, `"${definition.type}" must be one of: ${FIELD_TYPES.join(", ")}.`);
      continue;
    }

    if (definition.type === "choice" && (definition.options ?? []).length === 0) {
      field(
        `${where}.options`,
        'a "choice" field must list what may be chosen, for example options: ["easy", "hard"].'
      );
    }

    if (definition.type !== "choice" && definition.options !== undefined) {
      field(`${where}.options`, `only a "choice" field uses options; this one is "${definition.type}".`);
    }
  }
}

function isNonEmpty(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isAbsoluteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isSortOrder(value: string): value is SortOrder {
  return (SORT_ORDERS as readonly string[]).includes(value);
}
