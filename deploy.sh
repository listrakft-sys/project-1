#!/usr/bin/env bash
# Deploy to GitHub Pages: push source to main, build static export, push to gh-pages
# Usage: ./deploy.sh  (requires GITHUB_TOKEN in env)
set -euo pipefail

REPO="listrakft-sys/project-1"
cd "$(dirname "$0")"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_TOKEN not set"; exit 1
fi

# Verify token before doing anything
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user)
if [ "$STATUS" != "200" ]; then
  echo "ERROR: token invalid (HTTP $STATUS)"; exit 1
fi

git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"

echo "── [1/4] Pushing source (main) ──"
git push origin main

echo "── [2/4] Building static export ──"
cd frontend
GITHUB_PAGES=true npx next build
touch out/.nojekyll

echo "── [3/4] Pushing build to gh-pages ──"
cd out
git init -q 2>/dev/null || true
if [ ! -d .git ]; then
  git init -q
  git checkout -q -b gh-pages
fi
git add -A
git commit -qm "deploy: $(date +%Y-%m-%d\ %H:%M) — $(cd .. && git log --oneline -1 | cut -d' ' -f2-)" || true
git push -qf "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git" gh-pages

echo "── [4/4] Deploy pushed. Pages rebuild takes 1-3 min ──"
echo "Live: https://listrakft-sys.github.io/project-1/"
