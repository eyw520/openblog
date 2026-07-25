import { defineConfig } from "@/lib/config/define";

/**
 * YOUR BLOG'S SETTINGS. This is the file to edit — everything else is machinery.
 *
 * Changing `collections` is how you add a new kind of writing: name a folder
 * under content/, give it a label, and its index page, entry pages, navigation
 * link, and feed entries all appear. You never write a route by hand.
 */
export default defineConfig({
  title: "openblog",
  description: "A Markdown-first blog that deploys itself to GitHub Pages.",

  author: {
    name: "Your Name"
  },

  // Where the blog will live once deployed. For GitHub Pages this is
  // "https://<username>.github.io/<repository>" unless you use a custom domain,
  // in which case it is just "https://yourdomain.com".
  url: "https://example.github.io/openblog",

  collections: [
    {
      name: "posts",
      label: "Writing",
      route: "/writing",
      description: "Essays and notes, newest first."
    }
  ]
});
