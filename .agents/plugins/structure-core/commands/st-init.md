---
description: Bootstrap CLAUDE.md and the Structure governance docs in this repository
argument-hint: [--force]
---

Set up `CLAUDE.md` and the Structure four-document contract in this repository.

Use the `project-governance` skill. Follow it exactly — in particular the rule that decides
whether to detect or to ask.

**`CLAUDE.md` always comes first.** Do not survey, detect, or write any other document until
step 1 is done. It records what the project is for, and every later document is written to
serve that.

## Steps

1. **Start with CLAUDE.md.** Use `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md`.

   a. **Gather repo details first, silently** — the git remote (host and URL), the default
      branch, the existing branch naming in `git branch -a`, and any deploy config
      (`vercel.json`, `Dockerfile`, CI deploy jobs). These are facts; do not ask about them.

   b. **Ask for the requirements.** This is mandatory, even in a repo full of code — no file
      says what the project is *for*. Ask in one plain message, free-form:
      - What is this project, and who uses it?
      - What must it do? The main requirements or features, in priority order.
      - What is explicitly out of scope?
      - Any constraints — deadlines, compliance, performance targets, device or browser
        support, hosting limits?

   c. **Confirm the repo details** in one `AskUserQuestion` call, offering the detected values
      as options: host and default branch, branch naming, deploy target, environments.
      Only ask what step (a) could not settle. Four questions maximum.

   d. **Write CLAUDE.md** from the answers. Fill every `<!-- TODO -->`; delete a section that
      genuinely does not apply. Leave the **Project standards** section for step 7.

   If `CLAUDE.md` already exists, do not replace it. Read it, ask only for what it is missing
   from the list in (b) and (c), and add those sections — confirming before you change or
   remove anything already there. `--force` in `$ARGUMENTS` permits a rewrite only after the
   user confirms it.

2. **Survey.** Check which of these already exist at the repo root:
   `CODINGSTYLE.md`, `DESIGN.md`, `LOG.md`, `docs/adr/`.
   Never overwrite an existing file unless `$ARGUMENTS` contains `--force` and the user
   confirms which specific files to replace.

3. **Detect the stack.** Read manifests, lockfiles, config files, CI workflows, and the git
   remote. Read two or three representative source files to confirm the configs are actually
   followed. Do not ask about anything a file already states.

4. **Interview.** Batch the questions into a single `AskUserQuestion` call, offering the
   detected values as options. Ask only what the repo — and the CLAUDE.md answers from
   step 1 — cannot answer:
   - Are the existing conventions the intended standard, or legacy to migrate away from?
   - Is a test required for every change?
   - Any off-limits paths?
   - For UI repos with no design source: design system, color modes, spacing scale, brand colors.

   If the repo has UI and the user has Figma, ask them to paste the CSS of a representative
   frame instead of answering token questions abstractly.

   Skip the interview for a file that already exists and is being kept.

5. **Write the files.** Copy from `${CLAUDE_PLUGIN_ROOT}/templates/` and fill every
   `<!-- TODO -->` marker with detected or answered content. An unfilled placeholder must not
   survive into a committed file — delete a section that genuinely does not apply rather than
   leaving it blank.

   - `CODINGSTYLE.md` — stack table, verified command table, conventions, non-negotiables
   - `DESIGN.md` — only if the repo has UI; say so explicitly if you skip it
   - `LOG.md` — with a first entry recording this bootstrap
   - `docs/adr/README.md` and `docs/adr/0000-template.md`

   Place `docs/adr/` inside an existing docs tree if the repo already has one.

6. **Verify the command table.** Actually run the format, lint, and typecheck commands you
   recorded. A command table that has never been executed is a guess. Correct any that fail.

7. **Link CLAUDE.md to the documents.** Fill its **Project standards** section with one
   pointer per document that now exists — drop the line for any you skipped, such as
   `DESIGN.md` in a repo with no UI. If an existing `CLAUDE.md` holds conventions inline,
   migrate them into `CODINGSTYLE.md` and replace them with the pointer, confirming before
   removing anything.

8. **Report.** List what was created, what was skipped and why, and any question left
   unresolved as a `<!-- TODO -->` for later.

Do not commit. Leave the files staged-or-not as the user prefers and tell them what to review.
