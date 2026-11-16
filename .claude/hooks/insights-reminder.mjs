#!/usr/bin/env node
// Stop hook: makes the engineering-insights skill run automatically.
//
// If files were edited (Edit/Write/MultiEdit/NotebookEdit) since the user's last
// prompt and the `engineering-insights` skill was not invoked in that span, block
// the stop once and tell Claude to run the wrap-up. Edits to `.claude/**` and to
// INSIGHTS files themselves don't count.
//
// Safety: `stop_hook_active` (we already blocked once) → allow; any read/parse
// error → allow. This hook must never wedge a session.
import { readFileSync } from 'node:fs';

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const SKILL = 'engineering-insights';

function allow() {
  process.exit(0);
}

function isRealUserPrompt(entry) {
  if (entry?.type !== 'user') return false;
  const content = entry.message?.content;
  if (typeof content === 'string') return true;
  // Tool results also arrive as type "user"; a real prompt has a text block and no tool_result.
  return (
    Array.isArray(content) &&
    content.some((b) => b?.type === 'text') &&
    !content.some((b) => b?.type === 'tool_result')
  );
}

function countsAsWork(filePath) {
  if (typeof filePath !== 'string') return false;
  const p = filePath.replace(/\\/g, '/');
  return !/(^|\/)\.claude\//.test(p) && !/INSIGHTS(\/|\.md$)/.test(p);
}

try {
  const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  if (input.stop_hook_active) allow();
  if (!input.transcript_path) allow();

  const entries = readFileSync(input.transcript_path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  let start = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (isRealUserPrompt(entries[i])) {
      start = i + 1;
      break;
    }
  }

  let edited = false;
  let ranSkill = false;
  for (const entry of entries.slice(start)) {
    if (entry.type !== 'assistant' || !Array.isArray(entry.message?.content)) continue;
    for (const block of entry.message.content) {
      if (block?.type !== 'tool_use') continue;
      if (EDIT_TOOLS.has(block.name)) {
        const fp = block.input?.file_path ?? block.input?.notebook_path;
        if (countsAsWork(fp)) edited = true;
      }
      if (block.name === 'Skill' && String(block.input?.skill ?? '').endsWith(SKILL)) ranSkill = true;
    }
  }

  if (edited && !ranSkill) {
    process.stdout.write(
      JSON.stringify({
        decision: 'block',
        reason:
          'Files were edited in this task. Before finishing, run the engineering-insights skill (wrap-up): ' +
          'append dated, path:line-evidenced entries to the touched module INSIGHTS.md (client/server/reviewer-core/e2e), ' +
          "or report 'Nothing worth recording: <reason>'.",
      }),
    );
  }
  allow();
} catch {
  allow();
}
