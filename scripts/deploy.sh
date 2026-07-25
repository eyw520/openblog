#!/bin/sh
# Publish the blog.
#
# Deployment happens on GitHub, in .github/workflows/deploy.yml — this script's
# job is to catch every problem locally first, where the error messages are
# readable and the fix is one file away, and only then hand off.
set -eu

cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "Installing dependencies first..."
  if [ -f package-lock.json ]; then npm ci; else npm install; fi
fi

# Publishing uncommitted work is impossible — GitHub builds what it was pushed,
# so an uncommitted post would silently not appear.
if ! git diff --quiet HEAD 2>/dev/null; then
  echo ""
  echo "You have changes that are not committed yet, so they would not be published."
  echo "Commit them first, then run this again:"
  echo ""
  git status --short | sed 's/^/    /'
  echo ""
  exit 1
fi

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "main" ]; then
  echo "Deploys publish from main, but you are on '$branch'. Switch to main first."
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo ""
  echo "This blog has no GitHub repository yet, so there is nowhere to publish it."
  echo "Create one, then connect it:"
  echo ""
  echo "    git remote add origin https://github.com/<username>/<repository>.git"
  echo ""
  exit 1
fi

echo "Checking everything before publishing..."
make check

echo "Building the site..."
npm run build

echo "Publishing..."
git push origin main

echo ""
echo "Pushed. GitHub is building and publishing the site now — it usually takes"
echo "a minute or two. Watch it finish under the Actions tab of your repository."
echo ""
echo "If this is your first deploy, set Settings -> Pages -> Source to"
echo "\"GitHub Actions\" once, and the publish will complete."
