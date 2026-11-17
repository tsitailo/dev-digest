# Findings by severity — лічильники + фільтр на сторінці PR

> Status: implemented 2026-11-17 (client-only, no migration). E2E flow: `e2e/specs/08-pr-severity-filter.flow.json`.

## Context
На вкладці **Agent runs** сторінки PR знахідки розкидані по акордеонах прогонів. Таймлайн показує лише
`N findings · M blockers`. Загальної картини за критичністю немає, і не можна швидко лишити тільки CRITICAL.
Мета: рядок лічильників «3 CRITICAL · 5 WARNING · 2 SUGGESTION». Клік по рівню лишає видимими тільки його знахідки.
Плюс (за скріншотами) у кожному рядку таймлайну замість тексту стоять іконки-лічильники з поповером зі списком знахідок.

**Start-check (INSIGHTS):** прочитано `client/INSIGHTS.md` і `server/INSIGHTS.md`. Для задачі важливі 3 пункти:
1. Showcase-галерея монтується в smoke-тесті **без** `NextIntlClientProvider`. Новий компонент з `useTranslations` треба загорнути у свій провайдер у `Showcase.tsx:134`.
2. Відповіді reviews типізує `ReviewDto`, а не Zod-контракт. Тому фіча навмисно **без змін сервера/контрактів**, щоб не чіпати `reviewToDto`.
3. Тести `indexer-pipeline.test.ts` на Windows падають і на чистому checkout. Це не регресія фічі.

## Специфікація

### Рішення (погоджено)
- **Обсяг підрахунку:** останнє рев'ю **кожного агента** (ключ `agent_id ?? agent_name ?? review.id`; reviews приходять newest-first). Повторні запуски не дублюють числа.
- **Dismissed не рахуються** (як `blockers` у `ReviewRunAccordion.tsx:57`). Accepted рахуються.
- Рівні: `Severity` = `CRITICAL | WARNING | SUGGESTION` (`vendor/shared/contracts/findings.ts:11`). Порядок завжди такий.

### Що бачить користувач
| # | Місце | Вигляд / поведінка |
|---|---|---|
| A | `FindingsTab`, над «Review runs» | Рядок `[⛔ 3 CRITICAL] · [⚠ 5 WARNING] · [💡 2 SUGGESTION]`, праворуч підпис «latest run per agent». Кожен рівень це `<button aria-pressed>` у кольорах `SEV` (`vendor/ui/primitives/tokens.ts:6`). Рівень з `0` показується приглушеним і `disabled`. |
| A0 | **Наведення мишки (або focus) на лічильник рівня** | Над сторінкою з'являється попап-картка «3 CRITICAL FINDINGS» зі знахідками **цього рівня** з порахованих рев'ю. Вигляд як на скріншоті: іконка, title, category, `file:line`, `NN% conf`, rationale в 2 рядки, плюс ім'я агента. Попап показується через ~150 мс і не зникає, поки курсор на лічильнику або на самому попапі (є grace-delay ~200 мс, щоб у нього можна було перейти). Закривається по Esc, mouseleave/blur і click-outside. Клік по знахідці в попапі ставить фільтр цього рівня і скролить до її рев'ю. Для лічильника `0` попапа нема. |
| A1 | Клік по рівню | Фільтр `sev`=цей рівень. Кнопка активна, інші приглушені. З'являється «Clear filter». Повторний клік або Clear знімає фільтр. |
| A2 | Список при активному фільтрі | Лише акордеони порахованих рев'ю, у яких є збіги. Вони примусово розгорнуті, і в кожному показані тільки знахідки цього рівня без dismissed. **Кількість карток = числу на кнопці.** Під списком примітка «N other run(s) hidden while filtering» (старі прогони + рев'ю без збігів). |
| A3 | Порожньо | Немає рев'ю → рядок не рендериться. Усі нулі → `0 · 0 · 0`, усі disabled. |
| B | Рядок таймлайну (`RunHistory`), лише `status='done'` | Замість `N findings` стоять компактні іконки з числом для ненульових рівнів (`⛔2 ⚠1`) + `· 2 blockers`. Якщо всі нулі → `0 findings`. |
| B1 | Наведення на лічильники рядка | Той самий попап (спільний компонент), але зі знахідками **цього прогону**: «3 FINDINGS», від CRITICAL до SUGGESTION, як на скріншоті 2. Поведінка як в A0. |
| B2 | Клік по іконці рівня в таймлайні | Ставить той самий фільтр `sev` і скролить до рев'ю (наявний `onGoToReview`). |

- Стан фільтра живе в URL `?sev=critical` через наявний `setParam` у `page.tsx`. Він переживає reload, ним можна поділитись. Невалідне значення → без фільтра (`Severity.safeParse` по upper-case).
- Тексти йдуть у `client/messages/en/prReview.json` → нова секція `severity` (`groupLabel`, `critical`, `warning`, `suggestion`, `clearFilter`, `scopeHint`, `hiddenRuns`, `noMatches`, `popoverTitle`, `popoverLevelTitle`). Ключі camelCase.
- A11y: іконка + текст (ніколи лише колір), `aria-pressed`, група `role="group"` з `aria-label`.

### Дані
Сервер, БД і контракти **не змінюються**. Усе рахується з уже завантажених `usePrReviews(prId)` (findings у кожному `ReviewRecord`).
Для B рядок таймлайну знаходить своє рев'ю за `review.run_id === run.run_id`. Якщо рев'ю немає (видалене), лишається старий текст `findings_count · blockers`.

## План реалізації (тільки `client/`)

1. **Хелпери** `client/src/lib/findings-severity.ts` (чисті функції):
   - `latestReviewPerAgent(reviews: ReviewRecord[]): ReviewRecord[]`
   - `countBySeverity(findings): Record<Severity, number>` (без dismissed)
   - `matchesSeverity(f, sev | null)`, `parseSeverityParam(raw): Severity | null`
   - `SEVERITY_ORDER` перенести сюди з `FindingsPanel/constants.ts` і реекспортувати, щоб не дублювати.
2. **Спільний компонент** `client/src/components/severity-counters/SeverityCounters.tsx` + `index.ts`:
   пропси `counts`, `active: Severity | null`, `onSelect(sev | null)`, `variant: "full" | "compact"`.
   `full` дає A (кнопки з лейблом), `compact` дає B (іконка+число, нулі сховані). Іконки й кольори беруться з `SEV`, як у `SeverityBadge` (`vendor/ui/primitives/Badge.tsx:52`). Inline styles через CSS-змінні.
3. **`FindingsPanel`**: новий проп `severity?: Severity | null`. `visibleFindings(findings, hideLow, severity)` при заданому рівні фільтрує по ньому і прибирає dismissed. EmptyState лишається як є.
4. **`ReviewRunAccordion`**: пропи `severity` (прокидає в `FindingsPanel`) і `forceOpen` (`useEffect` → `setOpen(true)`, як наявний `targetRunId`).
5. **`FindingsTab`**: нові пропи `severity` / `onSeverityChange`. `useMemo` для `counted = latestReviewPerAgent(runs)` і `counts`. Рендер `SeverityCounters` (A). При фільтрі `runs` звужується до `counted` зі збігами плюс примітка про приховані.
6. **`page.tsx`**: `const severity = parseSeverityParam(search.get("sev"))` і передача в `FindingsTab` разом з `(s) => setParam("sev", s?.toLowerCase() ?? null)`.
7. **Спільний попап** `client/src/components/findings-popover/FindingsPopover.tsx` + `index.ts`. Пропи: `findings`, `title`, `anchorRef`, `open`, `onClose`, `onFindingClick?`. Рендериться через `createPortal` у `document.body`, `position: fixed` під якорем (з фліпом угору, якщо не влазить у viewport), `role="dialog"`, `aria-labelledby`, `max-height` + скрол, тінь і `var(--bg-elevated)`. Логіка hover живе в хуку `useHoverPopup()` (open-delay 150 мс, close-delay 200 мс, Esc, click-outside), щоб її поділяли A і B. `file:line` формується локально (`lineLabel` з `FindingCard/helpers.ts` route-private, спільний компонент не імпортує з `app/`), конфіденс через `ConfidenceNum`.
   `SeverityCounters` отримує проп `findingsBySeverity` і сам відкриває `FindingsPopover` на hover кожної кнопки (A0). У `compact` поповер один на весь блок лічильників, з усіма знахідками прогону (B1).
8. **`RunHistory`** (B): новий проп `reviewsByRunId` (Map з `FindingsTab`) і `onSelectSeverity`. Рядок `:192-197` замінити на `SeverityCounters variant="compact"` + blockers.
9. **i18n**: секція `severity` у `messages/en/prReview.json`.
10. **Showcase**: `SeverityCounters` (обидва варіанти, з попапом) у `src/components/showcase/Showcase.tsx`, загорнутий у власний `NextIntlClientProvider` (див. INSIGHTS).
11. **Spec-документ**: цей файл.

### Відомі обмеження
- Клік по рівню в рядку **старого** прогону (не останнього для агента) ставить фільтр, але цей прогін під фільтром схований, тож скролу до нього не буде. Фільтр рахує лише останні прогони.
- Hover-попап не відкривається на тач-пристроях без hover; клік по лічильнику там працює як фільтр.

## Тести
- **Unit** `client/src/lib/findings-severity.test.ts`:
  - `latestReviewPerAgent`: 2 рев'ю одного агента → бере новіше; різні агенти → обидва; `agent_id=null` → fallback на ім'я/ id.
  - `countBySeverity`: dismissed не рахуються, accepted рахуються, порожній масив → нулі.
  - `parseSeverityParam`: `critical`/`CRITICAL` → `CRITICAL`; `foo`/`null` → `null`.
- **RTL** `components/severity-counters/SeverityCounters.test.tsx`: рендерить «3 CRITICAL», «5 WARNING», «2 SUGGESTION»; клік → `onSelect("CRITICAL")`; повторний клік по активному → `onSelect(null)`; нуль → `disabled`; `aria-pressed`; `compact` ховає нулі.
- **RTL** `components/findings-popover/FindingsPopover.test.tsx` (fake timers + `fireEvent.mouseEnter`, `@testing-library/user-event` у проєкті нема): після hover і 150 мс видно `role="dialog"` з title знахідок; unhover → через 200 мс попап зникає; перехід курсора на попап тримає його відкритим; Esc закриває; клік по знахідці → `onFindingClick(f)`; лічильник `0` попап не відкриває. Там же hover по «CRITICAL» у `SeverityCounters` показує лише CRITICAL-знахідки.
- **RTL** `FindingsPanel.test.tsx`: з `severity="WARNING"` CRITICAL-картки нема, WARNING є; dismissed WARNING схована.
- **RTL** новий `FindingsTab/FindingsTab.test.tsx` (моки hooks як у `FindingsPanel.test.tsx:7`): 2 агенти × 2 прогони → числа лише з останніх; клік по CRITICAL → видно лише CRITICAL-картки, їх стільки ж, скільки на кнопці; з'являється «Clear filter» і примітка про приховані прогони.
- **RTL** `RunHistory.test.tsx`: done-run з рев'ю показує іконки-лічильники; hover → поповер з title знахідок; клік по рівню → `onSelectSeverity`; без рев'ю → старий текст `N findings`.
- **Smoke** `src/test/smoke.test.tsx` проходить зі showcase.
- **E2E** новий `e2e/specs/08-pr-severity-filter.flow.json` на сід-даних PR #482: Agent runs → `wait --text "CRITICAL"` → `hover` по кнопці CRITICAL → `wait --text "Hardcoded Stripe secret key in commit"` (попап) → `find role button click --name "CRITICAL"` → `wait --url sev=critical` → `wait --text "Hardcoded Stripe secret key in commit"`. Перед написанням перевірити severity сід-знахідок у `server/src/db/seed*`. Наявний `04-pr-findings` не ламається, бо текст «2 findings» у заголовку акордеона лишається.

## Verification
1. `cd client && pnpm typecheck && pnpm test`.
2. Сервер і reviewer-core не змінюються, typecheck там не обов'язковий. Контракти теж не чіпаємо.
3. `./scripts/dev.ps1` → PR #482 → Agent runs: перевірити A–A3 і B–B2, reload з `?sev=critical`, Dismiss знахідки зменшує лічильник, повторний запуск агента не подвоює числа.
4. `../scripts/e2e.sh` (або `cd e2e && npm test`) для flow 04 і 08.
5. В кінці `/engineering-insights` → `client/INSIGHTS.md`.
