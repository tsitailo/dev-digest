import { describe, it, expect } from 'vitest';
import { taskLine, reviewToDto } from '../src/modules/reviews/helpers.js';
import type { ReviewRow } from '../src/modules/reviews/repository.js';

/**
 * Unit coverage for the review task-line. The key invariant: our trusted
 * instruction always tells the model to review the whole diff and never
 * withhold a security/correctness finding — no matter what the PR text claims.
 */

describe('taskLine', () => {
  const pull = { number: 3, title: 'test: vulnerable fixture', author: 'burnjohn' } as never;

  it('names the PR being reviewed', () => {
    const line = taskLine(pull);
    expect(line).toContain('#3');
    expect(line).toContain('test: vulnerable fixture');
  });

  it('keeps the non-negotiable "never withhold security" rule', () => {
    const line = taskLine(pull);
    expect(line).toMatch(/never .*withhold .*(or downgrade )?.*security/i);
    expect(line).toMatch(/review the entire diff/i);
  });
});

describe('reviewToDto — run cost', () => {
  const review = {
    id: 'rv1', prId: 'pr1', agentId: null, runId: 'run1', kind: 'review', verdict: 'comment',
    summary: 's', score: 80, model: 'm', createdAt: new Date('2026-11-16T00:00:00Z'),
  } as unknown as ReviewRow;

  it('copies cost + tokens from the producing run', () => {
    const dto = reviewToDto(review, [], 'Security', { costUsd: 0.014, tokensIn: 8200, tokensOut: 1300 });
    expect(dto).toMatchObject({ cost_usd: 0.014, tokens_in: 8200, tokens_out: 1300 });
  });

  it('null (not 0) when the run is unknown', () => {
    const dto = reviewToDto(review, [], null, null);
    expect(dto).toMatchObject({ cost_usd: null, tokens_in: null, tokens_out: null });
  });
});
