import { defineConfig } from "@/lib/config/define";

/**
 * YOUR BLOG'S SETTINGS. This is the file to edit — everything else is machinery.
 *
 * Changing `collections` is how you add a new kind of writing: name a folder
 * under content/, give it a label, and its index page, entry pages, navigation
 * link, and feed entries all appear. You never write a route by hand.
 *
 * Every option below is optional except title, description, author, url, and
 * collections. RECIPES.md maps common requests to the setting that answers them.
 */
export default defineConfig({
  title: "openblog",
  description: "A Markdown-first blog that deploys itself to GitHub Pages.",

  author: {
    name: "Your Name"
    // url: "https://example.com",
    // email: "you@example.com"
  },

  // Where the blog will live once deployed. For GitHub Pages this is
  // "https://<username>.github.io/<repository>" unless you use a custom domain,
  // in which case it is just "https://yourdomain.com".
  url: "https://example.github.io/openblog",

  // Each entry here becomes a section of the blog, backed by content/<name>/.
  collections: [
    {
      name: "posts",
      label: "Writing",
      route: "/writing",
      description: "Essays and notes, newest first."
      // sort: "date-desc",  // or "date-asc", or "title"
      // nav: true,          // false publishes it without a navigation link
      // feed: true          // false keeps it out of the RSS feed
    }
  ],

  // The front page. Its words live in content/pages/home.md.
  home: {
    latest: 5
    // collections: ["posts"]  // defaults to every collection
  },

  // Tag pages appear on their own once a post has `tags:` in its frontmatter.
  // These only move them; there is nothing to switch on.
  tags: {
    route: "/tags",
    label: "Tags",
    nav: false // true adds a Tags link to the navigation
  },

  // Ways to reach you, shown in the footer. Add as many as you like:
  //   { label: "Email", href: "mailto:you@example.com" },
  //   { label: "GitHub", href: "https://github.com/you" }
  social: [],

  display: {
    readingTime: true
    // copyright: "© 2026 Your Name"
  }
});
