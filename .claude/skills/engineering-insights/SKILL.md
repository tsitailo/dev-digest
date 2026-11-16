---
name: engineering-insights
description: "Capture non-obvious engineering insights into the INSIGHTS.md of the module the task touched (client/, server/, reviewer-core/, e2e/). Runs AUTOMATICALLY, without being asked, at the end of every task that edited files (a Stop hook in .claude/settings.json enforces it), and mid-task right after discovering something non-obvious (root cause of a bug, misleading API, failed approach, decision with a reason). Also: /engineering-insights, 'capture insight', 'update INSIGHTS', 'wrap up', 'what did we learn'. '/engineering-insights prune' = monthly cleanup."
---

# Engineering Insights

Turn what a task taught us into short, evidence-backed entries in the `INSIGHTS.md` of the module the
work touched, so the next session starts smarter. **Append-only** in normal mode.

See `examples.md` for vague-vs-useful entries, `template.md` for a fresh INSIGHTS.md skeleton.

---

## 1. When to run — automatically

You do **not** wait to be asked.

1. **Wrap-up (mandatory)** — at the end of every task that edited files. Enforced by a Stop hook
   (`.claude/hooks/insights-reminder.mjs`, wired in `.claude/settings.json`): if files were edited since the
   user's last message and this skill was not invoked, the hook blocks the stop and tells you to run it.
2. **Capture as you go** — immediately after something non-obvious happens, while the evidence is
   fresh: a bug's real root cause, an API that behaves differently than its name suggests, an approach
   that failed and why, a decision made between real alternatives.

The skill always runs; writing an entry does not have to. A short mechanical task (rename, typo,
dependency bump that just worked) usually yields **nothing**: finish with
`Nothing worth recording: <reason>` — that closes the loop too.

## 2. Routing — which INSIGHTS.md

| Module | Path prefix | File |
|---|---|---|
| client | `client/` | `client/INSIGHTS.md` |
| server | `server/` (incl. `src/modules/repo-intel/`) | `server/INSIGHTS.md` |
| reviewer-core | `reviewer-core/` | `reviewer-core/INSIGHTS.md` |
| e2e | `e2e/` | `e2e/INSIGHTS.md` |

- Find touched modules from `git status --porcelain`, `git diff --name-only HEAD` and the session itself
  (an insight can be about a module you only read, e.g. a debugging dead end).
- An insight goes to the module **where the next reader will be working** when they need it.
  Cross-module insights (e.g. vendored contract drift) go to each affected module, one short entry each.
- Sub-areas of server get a tag at the start of the essence: `[repo-intel]`, `[reviews]`, `[db]`.
- `scripts/`, `.github/`, `.claude/`, root files: **not covered**. Mention the insight in your final
  message instead (suggest a CLAUDE.md edit if it matters).
- File missing → create it from `template.md`.

## 3. Anti-banality gate (apply to every candidate)

> **If it would be obvious to anyone reading the code, don't write it.**

Write the entry only if **all** are true:

- [ ] **Non-obvious** — cost real time to find, or contradicts what the code/name/docs suggest.
- [ ] **Actionable cold** — someone with zero session context knows what to *do* after reading it.
- [ ] **Evidenced** — cites at least one `path/file.ext:LINE` that proves it. No `path:line` → don't write it.
- [ ] **New** — not already in this INSIGHTS.md, the module's CLAUDE.md/README, or root CLAUDE.md.
      (If it duplicates an existing entry but adds a nuance, append the nuance as a new entry.)
- [ ] **Durable** — still true next month; not a one-off about this branch's temporary state.

Rejection is the default. 0–3 entries per task is normal; >5 means the gate is too loose.

## 4. Entry format — date + `path:line` on EVERY line

One bullet per entry, under the matching section, newest at the bottom of the section:

```
- 2026-11-16 · Context · <essence, imperative and specific> — evidence: server/src/app.ts:81
```

- **Date**: absolute `YYYY-MM-DD` (today), never "yesterday".
- **Category**: Pattern · Mistake · Context · Decision · Session · Question.
- **Essence**: one or two sentences. Lead with the action ("Do X", "Never Y", "Expect Z when …").
- **Evidence (required)**: `path:LINE` relative to repo root; several allowed, comma-separated.
  Open the file and confirm the line before writing it (lines drift). The evidence is a command's output?
  Cite the file:line that produces or reproduces it (e.g. `server/src/db/migrate.ts:45`, the failing test's
  line) — a bare command is not evidence.
- **Decision** entries add `Why: <reason / rejected alternative>`.
- **Recurring Errors** entries use `Symptom: … → Cause: … → Fix: …`.
- **Session Notes and Open Questions follow the same format** (category `Session` / `Question`) and also
  carry a `path:line` — the main changed line for a session, the suspicious line for a question.

### Section ↔ category map

| INSIGHTS.md section | Category | What goes there |
|---|---|---|
| What Works | Pattern | Approach that proved right here; reuse it |
| What Doesn't Work | Mistake | Antipattern / dead end and why it fails |
| Codebase Patterns | Context | Hidden structure, invariants, coupling not visible locally |
| Tool / Library Notes | Context | Library/tool quirks as used in this module (versions matter) |
| Decisions | Decision | Choice + `Why:` |
| Recurring Errors & Fixes | Mistake | `Symptom → Cause → Fix` for errors likely to recur |
| Session Notes | Session | One line per task: what was done + which entries were added |
| Open Questions | Question | Unverified suspicion / unresolved question; resolve via a later entry |

## 5. Append-only rules (normal mode)

- **Never edit or delete** existing entries. Only append bullets.
- **Conflict** with an older entry → append the new one with
  `Supersedes: 2026-10-02 "<old essence, first ~8 words>"`. The old entry is removed only in prune mode.
- **Open Question answered** → append the answer as a normal entry with `Resolves: <date> "<question>"`.
- Always append one **Session Notes** line to each file you wrote ≥1 entry to.

## 6. Procedure (wrap-up)

1. List candidate insights from the task (problems hit, surprises, decisions, failed attempts).
2. Run each through the gate (§3). Drop most.
3. Route survivors (§2). Read the target INSIGHTS.md fully to dedupe and spot conflicts.
4. Open every `path:line` you cite and confirm it shows the thing.
5. Append entries (§4, §5) with Edit. Don't reformat the file.
6. Self-check: every new `- ` line has `YYYY-MM-DD` and `path:LINE`.
7. Report: per file, the entries added — or `Nothing worth recording: <reason>`. Do **not** commit;
   the user spot-checks INSIGHTS as a draft and commits it with the work.

## 7. Prune mode — `/engineering-insights prune` (monthly)

The only mode allowed to rewrite. Stale guidance is worse than none — it is followed with high confidence.

1. For each entry: open its evidence. Code gone/changed so the claim is false → delete. Line moved → fix
   the reference.
2. Resolve `Supersedes:` pairs (drop the old one, drop the marker) and `Resolves:` pairs (drop the question).
3. Merge duplicates; tighten wording.
4. Promote rules that are stable and important into the module's `CLAUDE.md` and delete them here
   (CLAUDE.md is always loaded; INSIGHTS is the staging area).
5. Collapse Session Notes older than ~3 months into one line per month (keep date + `path:line`).
6. **Size limit ~200 entries**: if exceeded, split by domain into `INSIGHTS/<domain>.md`
   (e.g. `server/INSIGHTS/db.md`, `server/INSIGHTS/repo-intel.md`) and turn `INSIGHTS.md` into an index
   linking them, keeping the section structure in each file.
7. Show the user `git diff -- '**/INSIGHTS*'` for spot-check. Don't commit unless asked.
