#!/usr/bin/env bash
# Structure PreToolUse hook for Bash.
# Dependency changes are ADR-gated: they stop for a record and user confirmation.
# Emits a permission prompt only for commands that add or remove a dependency —
# plain restore commands (`npm install`, `pip install -r ...`) pass through silently.

set -u

payload=$(cat)

# Extract the command field. jq when available, a narrow grep otherwise.
if command -v jq >/dev/null 2>&1; then
  cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)
else
  cmd=$(printf '%s' "$payload" \
    | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -1 \
    | sed 's/^"command"[[:space:]]*:[[:space:]]*"//; s/"$//')
fi

[ -n "${cmd:-}" ] || exit 0

# A trailing non-flag token distinguishes "add this package" from "restore the lockfile".
pkg_arg='[[:space:]]+[^-[:space:]]'

patterns=(
  "(npm|pnpm|yarn|bun)[[:space:]]+(add|install|i)${pkg_arg}"
  "(npm|pnpm|yarn|bun)[[:space:]]+(remove|uninstall|rm)${pkg_arg}"
  "composer[[:space:]]+(require|remove)${pkg_arg}"
  "pip3?[[:space:]]+(install|uninstall)${pkg_arg}"
  "(poetry|uv)[[:space:]]+(add|remove)${pkg_arg}"
  "cargo[[:space:]]+(add|remove)${pkg_arg}"
  "go[[:space:]]+get${pkg_arg}"
  "gem[[:space:]]+install${pkg_arg}"
  "dotnet[[:space:]]+add[[:space:]]+package${pkg_arg}"
  "flutter[[:space:]]+pub[[:space:]]+(add|remove)${pkg_arg}"
)

matched=""
for p in "${patterns[@]}"; do
  if printf '%s' "$cmd" | grep -Eq "$p"; then
    matched="yes"
    break
  fi
done

[ -n "$matched" ] || exit 0

msg="Structure ADR gate: this command changes the project's dependencies. Under the adr-workflow skill, a dependency change requires an Architecture Decision Record and explicit user confirmation BEFORE it runs. If you have not already drafted the ADR and had the user accept it, cancel this command, draft the ADR (what problem it solves, the alternatives considered and why they lost, and the consequences), confirm it with the user, then proceed. If the user has already accepted the decision or waived the ADR in this session, continue."

printf '{"hookSpecificOutput":{"permissionDecision":"ask"},"systemMessage":%s}\n' \
  "$(printf '%s' "$msg" | sed 's/\\/\\\\/g; s/"/\\"/g; s/^/"/; s/$/"/')"

exit 0
