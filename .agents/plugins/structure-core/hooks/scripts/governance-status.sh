#!/usr/bin/env bash
# Structure SessionStart hook.
# Reports which governance artifacts exist so the session orients before touching code.
# Output is deliberately tiny — this runs on every session start.

set -u

dir="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$dir" 2>/dev/null || exit 0

# Only meaningful inside a repository.
[ -d .git ] || git rev-parse --git-dir >/dev/null 2>&1 || exit 0

present=""
missing=""

note() {
  if [ -e "$1" ]; then
    present="${present}${present:+, }$1"
  else
    missing="${missing}${missing:+, }$1"
  fi
}

note "CLAUDE.md"
note "CODINGSTYLE.md"
note "LOG.md"

# docs/adr may live under an existing docs tree.
adr_dir=""
for candidate in docs/adr doc/adr documentation/adr adr; do
  if [ -d "$candidate" ]; then
    adr_dir="$candidate"
    break
  fi
done
if [ -n "$adr_dir" ]; then
  present="${present}${present:+, }${adr_dir}/"
else
  missing="${missing}${missing:+, }docs/adr/"
fi

# DESIGN.md is only expected when the repo has UI.
has_ui=0
for probe in tailwind.config.js tailwind.config.ts components.json; do
  [ -f "$probe" ] && has_ui=1
done
if [ $has_ui -eq 0 ]; then
  if ls resources/js src/app src/components app/components 2>/dev/null | head -1 | grep -q .; then
    has_ui=1
  fi
fi
if [ -f DESIGN.md ]; then
  present="${present}${present:+, }DESIGN.md"
elif [ $has_ui -eq 1 ]; then
  missing="${missing}${missing:+, }DESIGN.md"
fi

echo "Structure governance:"
[ -n "$present" ] && echo "  Present: $present"

if [ -n "$missing" ]; then
  echo "  Missing: $missing — run /st-init to set up."
fi

# Surface the most recent log entry heading so the session knows where work stopped.
if [ -f LOG.md ]; then
  last_entry=$(grep -m1 '^## ' LOG.md 2>/dev/null | sed 's/^## //')
  [ -n "$last_entry" ] && echo "  Last log entry: $last_entry"
fi

echo "  Read CODINGSTYLE.md, DESIGN.md, and LOG.md before changing code in this repo."

exit 0
