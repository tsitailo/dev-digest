---
name: engineering-insights
description: "Capture non-obvious engineering learnings into the per-module LEARNINGS.md (client, server, reviewer-core, repo-intel). Use at the END of every task/session (wrap-up, mandatory per CLAUDE.md), and mid-task right after discovering something non-obvious (root cause of a bug, misleading API, failed approach, decision with a reason). Triggers: /engineering-insights, 'capture learning', 'update LEARNINGS', 'wrap up', 'what did we learn'. Use '/engineering-insights prune' for the monthly cleanup."
---

# Engineering Insights

Turn what a session taught us into short, evidence-backed entries in the `LEARNINGS.md` of the
module the work touched, so the next session starts smarter. **Append-only** in normal mode.

See `examples.md` for vague-vs-useful entries, `template.md` for a fresh LEARNINGS.md skeleton.

---

## 1. When to run

Two triggers:

1. **Wrap-up** — at the end of every task/session. Mandatory (root `CLAUDE.md` → Learnings loop).
2. **Capture as you go** — immediately after something non-obvious happens, while the evidence is
   fresh: a bug's real root cause, an API that behaves differently than its name suggests, an approach
   that failed and why, a decision made between real alternatives.

Cadence: an entry is usually earned by a session that ran **>30 min and involved a problem, a decision
or a discovery**. A short mechanical session (rename, typo, dependency bump that just worked) normally
yields **nothing** — say so and stop. Writing nothing is a valid, common outcome.

## 2. Routing — which LEARNINGS.md

| Module | Path prefix | File |
|---|---|---|
| client | `client/` | `client/LEARNINGS.md` |
| server | `server/` (except repo-intel) | `server/LEARNINGS.md` |
| reviewer-core | `reviewer-core/` | `reviewer-core/LEARNINGS.md` |
| repo-intel | `server/src/modules/repo-intel/` | `server/src/modules/repo-intel/LEARNINGS.md` |

- **Most specific prefix wins**: anything under `server/src/modules/repo-intel/**` → repo-intel's file,
  never server's.
- Find touched modules from `git diff --name-only HEAD`, `git status --porcelain` and the session itself
  (a learning can be about a module you only read, e.g. a debugging dead end).
- A learning goes to the module **where the next reader will be working** when they need it. Cross-module
  learnings (e.g. vendored contract drift) go to each affected module, one short entry each.
- `e2e/`, `scripts/`, `.github/`, root files: **not covered**. Mention the learning in your final message
  instead (suggest a CLAUDE.md edit if it's important).
- File missing → create it from `template.md`.

## 3. Anti-banality gate (apply to every candidate)

> **If it would be obvious to anyone reading the code, don't write it.**

Write the entry only if **all** are true:

- [ ] **Non-obvious** — cost real time to find, or contradicts what the code/name/docs suggest.
- [ ] **Actionable cold** — someone with zero session context knows what to *do* after reading it.
- [ ] **Evidenced** — points to `path/file.ts:line` (or a command + its output) that proves it.
- [ ] **New** — not already in this LEARNINGS.md, the module's CLAUDE.md/README, or root CLAUDE.md.
      (If it duplicates an existing LEARNINGS entry but adds a nuance, append the nuance as a new entry.)
- [ ] **Durable** — still true next month; not a one-off about this branch's temporary state.

Rejection is the default. 0–3 entries per session is normal; >5 means the gate is too loose.

## 4. Entry format

One bullet per entry, under the matching section, newest at the bottom of the section:

```
- 2026-11-16 · Pattern · <essence, imperative and specific> — evidence: server/src/app.ts:81
```

- Date: absolute `YYYY-MM-DD` (today), never "yesterday".
- Category: one of **Pattern · Mistake · Context · Decision**.
- Essence: one or two sentences. Lead with the action ("Do X", "Never Y", "Expect Z when …").
- Evidence: `path:line` relative to repo root; several allowed, comma-separated. No line? Use a command
  (`pnpm typecheck` → error text) or a commit SHA.
- **Decision** entries add `Why: <reason / rejected alternative>`.
- **Recurring Errors** entries use `Symptom: … → Cause: … → Fix: …`.

### Section ↔ category map

| LEARNINGS.md section | Category | What goes there |
|---|---|---|
| What Works | Pattern | Approach that proved right here; reuse it |
| What Doesn't Work | Mistake | Antipattern / dead end and why it fails |
| Codebase Patterns | Context | Hidden structure, invariants, coupling not visible locally |
| Tool / Library Notes | Context | Library/tool quirks as used in this module (versions matter) |
| Decisions | Decision | Choice + `Why:` |
| Recurring Errors & Fixes | Mistake | `Symptom → Cause → Fix` for errors likely to recur |
| Session Notes | — | One dated line per session: what was done + which entries were added |
| Open Questions | — | Unverified suspicion / unresolved question; resolve via a later entry |

## 5. Append-only rules (normal mode)

- **Never edit or delete** existing entries. Only append bullets.
- **Conflict** with an older entry → append the new one with
  `Supersedes: 2026-10-02 "<old essence, first ~8 words>"`. The old entry is removed only in prune mode.
- **Open Question answered** → append the answer as a normal entry with
  `Resolves: <date> "<question>"`.
- Always append one **Session Notes** line when you wrote ≥1 entry to that file:
  `- 2026-11-16 — <task in ≤10 words>; added: Pattern (grounding), Decision (SSE retry).`

## 6. Procedure (wrap-up)

1. List candidate learnings from the session (problems hit, surprises, decisions, failed attempts).
2. Run each through the gate (§3). Drop most.
3. Route survivors (§2). Read the target LEARNINGS.md fully to dedupe and spot conflicts.
4. Verify every `path:line` you cite actually shows the thing (open it — lines drift).
5. Append entries (§4, §5) with Edit. Don't reformat the file.
6. Report: per file, the entries added — or `Nothing worth recording: <reason>`. Do **not** commit;
   the user spot-checks LEARNINGS as a draft and commits it with the work.

## 7. Prune mode — `/engineering-insights prune` (monthly)

The only mode allowed to rewrite. Stale guidance is worse than none — it is followed with high confidence.

1. For each entry: open its evidence. Code gone/changed so the claim is false → delete. Line moved → fix
   the reference.
2. Resolve `Supersedes:` pairs (drop the old one, drop the marker) and `Resolves:` pairs (drop the question).
3. Merge duplicates; tighten wording.
4. Promote rules that are stable and important into the module's `CLAUDE.md` and delete them here
   (CLAUDE.md is always loaded; LEARNINGS is the staging area).
5. Collapse Session Notes older than ~3 months into one line per month.
6. **Size limit ~200 entries**: if exceeded, split by domain into `LEARNINGS/<domain>.md`
   (e.g. `server/LEARNINGS/db.md`, `server/LEARNINGS/reviews.md`) and turn `LEARNINGS.md` into an index
   linking them, keeping the section structure in each file.
7. Show the user `git diff -- '**/LEARNINGS*'` for spot-check. Don't commit unless asked.
