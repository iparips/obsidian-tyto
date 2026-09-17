#!/usr/bin/env bash
# Every markdown link into docs/architecture must resolve to a file that exists.
# Renaming or removing a file in that folder breaks links from specs and
# AGENTS.md, which nothing else catches.
set -u

cd "$(git rev-parse --show-toplevel)" || exit 1

broken=0
total=0

while IFS= read -r line; do
  src="${line%%:*}"
  target="${line#*:}"
  total=$((total + 1))

  dir="$(dirname "$src")"
  resolved="$dir/$target"

  if [ ! -f "$resolved" ]; then
    echo "BROKEN: $src -> $target"
    broken=$((broken + 1))
  fi
done < <(
  grep -rnoE '\]\([^)]*architecture/[0-9][0-9A-Za-z._/-]*\.md[^)]*\)' \
    --include='*.md' . \
    --exclude-dir=node_modules |
    grep -v '^\./docs/architecture/' |
    sed -E 's/^\.\///; s/:[0-9]+:\]\(/:/; s/\)$//; s/#[^:]*$//'
)

echo "checked $total links into docs/architecture, $broken broken"
[ "$broken" -eq 0 ]
