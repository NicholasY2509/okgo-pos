#!/usr/bin/env bash
# Structure PreToolUse hook for Write|Edit.
# Fires once per session, the first time a file is edited while sitting on the repository's
# default branch. Branch selection is worthless at commit time — this is the last honest
# moment to raise it.
#
# Silent when: not a git repo, already on a feature branch, detached HEAD, or already
# prompted in this session.

set -u

payload=$(cat)

if command -v jq >/dev/null 2>&1; then
  session=$(printf '%s' "$payload" | jq -r '.session_id // empty' 2>/dev/null)
else
  session=$(printf '%s' "$payload" \
    | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
fi
[ -n "${session:-}" ] || session="nosession"

cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

current=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
# Detached HEAD, or a repo with no commits yet — nothing sensible to say.
[ -n "$current" ] && [ "$current" != "HEAD" ] || exit 0

# Resolve the real default branch instead of assuming "main".
default=$(git symbolic-ref --quiet refs/remotes/origin/HEAD 2>/dev/null | sed 's|.*/||')
if [ -z "$default" ]; then
  for b in main master trunk; do
    if git show-ref --verify --quiet "refs/heads/$b"; then
      default="$b"
      break
    fi
  done
fi
[ -n "$default" ] || exit 0

[ "$current" = "$default" ] || exit 0

# One prompt per session. The marker is keyed by session and repo.
tmp="${TMPDIR:-${TEMP:-/tmp}}"
repo_key=$(printf '%s' "$PWD" | tr -c 'A-Za-z0-9' '_' | tail -c 60)
marker="${tmp%/}/structure-branch-guard-${session}${repo_key}"

[ -e "$marker" ] && exit 0
: > "$marker" 2>/dev/null || true

msg="Structure branch guard: you are about to edit files while on '${current}', this repository's default branch. Per the branch-workflow skill, decide the branch BEFORE the first edit. If this is a big task (a feature, a multi-file refactor, a dependency or schema change, or anything spanning more than one commit), create the branch now with 'git switch -c <type>/<description>' and continue. If it is a minor single-file fix, ask the user whether to branch or work in place, then honor their answer without raising it again. If the user has already chosen to work on ${current}, proceed. This prompt appears once per session."

printf '{"hookSpecificOutput":{"permissionDecision":"ask"},"systemMessage":%s}\n' \
  "$(printf '%s' "$msg" | sed 's/\\/\\\\/g; s/"/\\"/g; s/^/"/; s/$/"/')"

exit 0
