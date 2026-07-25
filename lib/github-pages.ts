/**
 * Working out where GitHub will actually publish a repository.
 *
 * The commonest way to end up with a blog that loads without any styling is a
 * `url` in site.config.ts that does not match the repository it is pushed to.
 * Nothing about that is guessable from inside the site — but the git remote
 * knows, so the mismatch can be caught before a deploy instead of after one.
 *
 * Pure, so the address rules are pinned by tests rather than learned from a
 * broken deploy.
 */

export interface Repository {
  owner: string;
  name: string;
}

/** Owner and repository from any spelling of a GitHub remote, or null. */
export function parseGitHubRemote(remote: string): Repository | null {
  const trimmed = remote.trim().replace(/\.git$/, "");

  // git@github.com:owner/name
  const ssh = /^git@github\.com:([^/]+)\/(.+)$/.exec(trimmed);
  if (ssh?.[1] && ssh[2]) {
    return { owner: ssh[1], name: ssh[2] };
  }

  // https://github.com/owner/name, with or without credentials
  const https = /^https?:\/\/(?:[^@/]+@)?github\.com\/([^/]+)\/(.+)$/.exec(trimmed);
  if (https?.[1] && https[2]) {
    return { owner: https[1], name: https[2] };
  }

  return null;
}

/**
 * Where GitHub Pages will serve that repository from.
 *
 * A repository named `<owner>.github.io` is a user site and is served from the
 * domain root; anything else is a project site and lives in a subdirectory. That
 * distinction is the whole reason `basePath` exists, and it is decided by the
 * repository's name — which is why naming it well is worth a sentence in the
 * README rather than a footnote.
 */
export function pagesUrl(repository: Repository): string {
  const userSite = `${repository.owner.toLowerCase()}.github.io`;
  return repository.name.toLowerCase() === userSite
    ? `https://${userSite}`
    : `https://${userSite}/${repository.name}`;
}

export type UrlVerdict =
  | { kind: "match" }
  | { kind: "custom-domain"; host: string }
  | { kind: "mismatch"; expected: string; found: string }
  | { kind: "unknown-remote"; remote: string };

/**
 * Compares the configured address with the one the remote implies.
 *
 * A custom domain is not a mismatch — the owner has pointed a domain at the
 * repository and the CNAME file handles it, so this steps aside rather than
 * insisting on a github.io address.
 */
export function checkDeployUrl(configuredUrl: string, remote: string): UrlVerdict {
  const repository = parseGitHubRemote(remote);
  if (!repository) {
    return { kind: "unknown-remote", remote };
  }

  let host: string;
  try {
    host = new URL(configuredUrl).hostname.toLowerCase();
  } catch {
    return { kind: "mismatch", expected: pagesUrl(repository), found: configuredUrl };
  }

  if (!host.endsWith(".github.io")) {
    return { kind: "custom-domain", host };
  }

  const expected = pagesUrl(repository);
  const normalize = (url: string): string => url.replace(/\/+$/, "").toLowerCase();

  return normalize(configuredUrl) === normalize(expected)
    ? { kind: "match" }
    : { kind: "mismatch", expected, found: configuredUrl };
}
