# Omepilot end-to-end & visual regression

Playwright suite covering:

1. **Conversation actions** (`conversations.spec.ts`) – Rename / Pin / Archive / Delete
   each round-trip through Supabase and survive a full `page.reload()`.
2. **Layout visual regression** (`visual.spec.ts`) – every primary route is
   screenshotted at **mobile (375)**, **tablet (768)**, and **desktop (1280)**
   to lock the sidebar width (260px), page padding (32px), content max-width
   (850px), chat gap (24px), and composer radius (28px) consistently.

## One-time setup

```bash
npx playwright install --with-deps
cp .env.e2e.example .env.e2e   # then fill values
```

Required env:

| Var                 | What                                           |
| ------------------- | ---------------------------------------------- |
| `E2E_BASE_URL`      | running app URL (default `http://localhost:8080`) |
| `E2E_USER_EMAIL`    | seeded test account email                      |
| `E2E_USER_PASSWORD` | seeded test account password                   |

The `auth.setup.ts` project signs in once and saves `e2e/.auth/user.json`;
all other specs reuse it via `storageState`.

## Run

```bash
npm run e2e                    # full suite, all viewports
npm run e2e -- --project=desktop
npm run e2e:update-snapshots   # refresh visual baselines after intentional UI change
```

## Notes

- Baselines are committed under `e2e/visual.spec.ts-snapshots/`. Generate them
  on the same OS/browser combo CI uses, otherwise font-rendering deltas will
  fail the diff (we already allow `maxDiffPixelRatio: 0.02`).
- The suite does **not** run in the Lovable preview sandbox – it is intended
  for local pre-merge verification and CI.
- `auth.setup.ts` will `skip` cleanly if credentials are missing, so a
  developer without an account can still run `npx playwright test --list`.
