#!/usr/bin/env bash
set -euo pipefail

# Build first with npm run build:pages. This publishes only dist, never source or .env files.
project_root="$(git rev-parse --show-toplevel)"
test -f "$project_root/dist/index.html"
if ! rg -q '/Chat_Hariu/assets/' "$project_root/dist/index.html"; then
  echo 'Expected a GitHub Pages build. Run npm run build:pages first.' >&2
  exit 1
fi
touch "$project_root/dist/.nojekyll"

# A separate index constructs a deployment commit without changing the checkout or staging area.
pages_index="$(mktemp)"
rm "$pages_index"
trap 'rm -f "$pages_index"' EXIT
export GIT_INDEX_FILE="$pages_index"
git read-tree --empty
git -C "$project_root/dist" --git-dir="$project_root/.git" --work-tree="$project_root/dist" add --all .
pages_tree="$(git write-tree)"
pages_parent=()
if git ls-remote --exit-code --heads origin gh-pages >/dev/null; then
  git fetch --no-tags origin gh-pages
  pages_parent=(-p "$(git rev-parse FETCH_HEAD)")
fi
pages_commit="$(git -c user.name='Tuslah deployment' -c user.email='deploy@users.noreply.github.com' commit-tree "$pages_tree" "${pages_parent[@]}" -m "Publish Tuslah demo from $(git rev-parse --short HEAD)")"
# No force push: a concurrent publisher will produce a normal non-fast-forward rejection.
git push origin "$pages_commit:refs/heads/gh-pages"
