import { SORT_ORDERS, type SiteConfig, type SortOrder } from "./define";

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
  });
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
