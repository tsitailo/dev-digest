# Run Cost Badge — specification & implementation plan

> Status: implemented 2026-11-16 (migration `server/src/db/migrations/0010_nervous_gressill.sql`).

## Context
Задача 3 лаби: показувати вартість і токени кожного прогону агента. Зараз движок уже рахує вартість,
але сервер її відкидає:
- `reviewer-core/src/llm/openrouter.ts:94-107` бере `usage.prompt_tokens/completion_tokens`; `costUsd` береться
  з `usage.cost` (OpenRouter), а якщо його немає — з інжектованого `estimateCost` (PriceBook,
  `server/src/platform/price-book.ts`). Адаптери OpenAI/Anthropic теж віддають `costUsd`
  (`server/src/adapters/llm/pricing.ts`).
- `reviewer-core/src/review/run.ts:157-216` сумує це по чанках у `outcome.costUsd` (null, якщо хоч один
  чанк без ціни).
- `server/src/modules/reviews/run-executor.ts:213` бере з outcome лише `tokensIn/tokensOut`; в `agent_runs`
  (`server/src/db/schema/runs.ts`) немає колонки для вартості, в контрактах її теж немає.

Мета: зберегти вже пораховану вартість на рівні run, віддати її в GET-роутах і показати в 4 місцях UI.
Жодних додаткових викликів моделі.

## Специфікація

### Що бачить користувач (4 місця)
| # | Місце | Компонент | Вигляд |
|---|---|---|---|
| 1 | Список PR, нова колонка **COST** | `pulls/_components/PRRow` | `$0.012` — вартість **останнього завершеного** run цього PR |
| 2 | Плашка вердикту на PR Detail | `VerdictBanner` (в `ReviewRunAccordion`) | `$0.014 · 8.2K→1.3K` |
| 3 | Таймлайн Agent runs (права колонка під часом) | `RunHistory` | `9,119 tok · $0.0013` |
| 4 | Run Trace → Stats, плитка **COST** поруч із TOKENS | `RunTraceDrawer/.../TraceBody` | `$0.06`, плитка TOKENS — `15K→1.2K` |

### Правила
- Бейдж є в кожного run зі `status='done'`. Для failed/cancelled/running бейджа немає.
- Немає даних (`cost_usd == null`, зокрема старі run до міграції або модель без ціни) → `—`, **ніколи** `$0.00`.
  Реальний нуль (безкоштовна модель, `cost_usd === 0`) → `$0`.
- Формат вартості: `<0.01` → 4 знаки (`$0.0013`), `<1` → 3 знаки (`$0.012`), інакше 2 (`$1.25`).
- Формат токенів: `<1000` як є, `<1M` → `8.2K`, інакше `1.2M`; у таймлайні загальна сума in+out з
  роздільником тисяч (`9,119 tok`).
- Без бекфілу старих run: з токенів × поточний прайс заднім числом не рахуємо (ціни змінюються).

### Дані / контракти (оновити **обидві** копії: `server/src/vendor/shared` і `client/src/vendor/shared`)
- `agent_runs.cost_usd` — `doublePrecision`, nullable (прецедент: `server/src/db/schema/ci.ts:23`).
- `RunStats` (`contracts/trace.ts`) + `cost_usd: z.number().nullish()` (nullish, бо старі трейси без поля).
- `RunSummary` (`contracts/trace.ts`) + `cost_usd: z.number().nullable()`.
- `ReviewRecord` (`contracts/review-api.ts`) + `cost_usd`, `tokens_in`, `tokens_out` — `nullish`, з
  `agent_runs` через `reviews.run_id`.
- `PrMeta` (`contracts/platform.ts`) + `cost_usd: z.number().nullish()` (лише в list endpoint, як `score`).

## План реалізації

### 0. Документ
`docs/specs/run-cost-badge.md` — специфікація вище (UI, правила, контракти). Перед роботою прочитати
`server/LEARNINGS.md`, `client/LEARNINGS.md`, `reviewer-core/LEARNINGS.md` (зараз порожні).

### 1. Server
1. Схема: `costUsd: doublePrecision('cost_usd')` в `agentRuns` → `cd server && pnpm db:generate` (→ `0010_*.sql`)
   → `pnpm db:migrate`.
2. `repository/run.repo.ts` `completeAgentRun`: новий `costUsd?: number | null` у `values` і `.set(...)`;
   `listRunsForPull`: `cost_usd: run.costUsd`. Прокинути тип у `repository.ts:156`.
3. `run-executor.ts`: `const { tokensIn, tokensOut, costUsd, grounding } = outcome;` → передати в
   `completeAgentRun` і в `trace.stats.cost_usd`. Шляхи failed/cancelled (`:81`, `:301`, `:424`) → `costUsd: null`.
4. Reviews: де будується `ReviewRecord` (`helpers.ts` `reviewToDto`) — додати `run?: {costUsd, tokensIn, tokensOut}`,
   у запиті списку рев'ю left join `agent_runs` по `run_id` (без N+1).
5. `pulls/routes.ts:114-156`: поруч із `latestReviewByPr` — один IN-запит до `agent_runs`
   (`prId in prIds`, `status='done'`, `orderBy ranAt desc`), перший рядок на PR → `cost_usd`.
6. Trace route: нічого, якщо він віддає `run_traces.trace` як є — нове поле піде само.

### 2. Client
1. Хелпери `client/src/lib/format-cost.ts`: `formatCost(usd: number | null | undefined)`,
   `formatTokens(n)`, `formatTokenPair(in, out)`. Замінити `formatTokens` у
   `RunTraceDrawer/helpers.ts:26` (зараз `15k→1.2k`) на спільний.
2. Компонент `RunCostBadge` (`client/src/components/run-cost-badge/`), 2 види:
   - `variant="compact"` → `$0.012` / `—` (список PR);
   - `variant="full"` → `$0.014 · 8.2K→1.3K`; проп `tokens="total"` дає `9,119 tok · $0.0013` (таймлайн).
   Моно-шрифт, `var(--text-muted)`, `title` з точною сумою і in/out.
3. Вбудувати:
   - `pulls/constants.ts` `GRID` + колонка (≈72px) перед UPDATED; `COLUMN_KEYS` + `cost`; `PRRow` — `compact`.
   - `VerdictBanner`: нові пропси `costUsd/tokensIn/tokensOut`, рядок під заголовком; `ReviewRunAccordion:140`
     передає з `review`.
   - `RunHistory.tsx:198` — під часом, лише коли `r.status === 'done'`.
   - `TraceBody.tsx:65` — плитка `trace.stat.cost` поруч із TOKENS.
4. i18n: `client/messages/en/prReview.json` (`list.columns.cost`), `runs.json`/де лежить `trace.stat.*` (`trace.stat.cost`),
   та сама структура в інших локалях, якщо вони є.

### 3. Тести
- server: `test/contracts.test.ts` — нові поля; unit на `completeAgentRun`/executor через mocks
  (`src/adapters/mocks.ts`: мок LLM повертає `costUsd`); `reviews.it.test.ts` — `cost_usd` у run summary і
  review; `pulls-status.test.ts`/it — `cost_usd` останнього done run, `null` коли run без вартості.
- client: юніт на `formatCost` (null→`—`, 0→`$0`, 0.0013, 0.012, 1.25) і `formatTokens`;
  RTL на `RunCostBadge` (обидва види); оновити `RunHistory.test.tsx`, `RunTraceDrawer.test.tsx`,
  `VerdictBanner.test.tsx`.

## Verification
1. `cd server && pnpm typecheck && pnpm exec vitest run --exclude '**/*.it.test.ts'`, потім `pnpm exec vitest run .it.test`.
2. `cd client && pnpm typecheck && pnpm test`; `cd reviewer-core && npm run typecheck` (контракти).
3. `./scripts/dev.sh` → запустити рев'ю PR через OpenRouter-агента → перевірити всі 4 місця;
   старий run (до міграції) показує `—`; failed run — без бейджа.
4. В кінці — `/engineering-insights`.
