# Week 5 acceptance and demonstration checklist

## Implemented extensions

- [x] Sensitive-word filtering for auction names, descriptions, questions, and answers
- [x] Clear 400 responses for rejected content
- [x] Category table and item/category join table
- [x] Read-only category catalogue endpoint
- [x] Category search filter
- [x] Up to three categories per auction
- [x] Browser-local draft creation, viewing, editing, and deletion
- [x] Draft storage errors and missing-draft errors shown in the UI

## Five-minute recording route

1. **00:00–00:35 — Start and orient.** Show the marketplace, responsive navigation, keyword search, category selector, loading/empty/error panels, and direct navigation to a lot.
2. **00:35–01:15 — Account flow.** Register with a strong password, sign out, show one invalid login, then sign in. Refresh the page to show that the session remains usable.
3. **01:15–02:15 — Drafts and categories.** Open **Sell a record**, enter partial details, select two categories, save the draft, refresh, reopen it, edit it, save again, create a second draft, and delete the second draft.
4. **02:15–03:05 — Filtering and validation.** Attempt to publish a lot containing `sh!t` and show the validation message. Replace it with valid text, choose a future end time, and publish. Show its two category badges, then find it with each category filter.
5. **03:05–04:10 — Auction flow.** In a second account, open the lot, place one invalid low bid and one valid bid, ask a valid question, and attempt one sensitive question. Return as the seller, show the bid history, attempt a sensitive answer, then post a valid answer.
6. **04:10–05:00 — Resilience and evidence.** Show a nonexistent lot URL, a protected URL while signed out, browser back/forward, a page refresh, the successful automated test run, and the production build output.

## Manual acceptance matrix

| Area | Happy path | Error/permission path | Refresh/direct path |
| --- | --- | --- | --- |
| Account | Register, login, logout | Weak password, duplicate email, bad credentials | Refresh authenticated page; direct protected URL while signed out |
| Auction | Create future auction; view detail | Missing fields, past date, sensitive content, nonexistent lot | Refresh detail; back to results; direct detail URL |
| Bidding | Bid above current price | Low bid, seller bidding, signed-out bidding, closed auction | Refresh and confirm bid history/current leader |
| Q&A | Buyer asks; seller answers | Seller asks own lot, buyer answers, sensitive text, missing question | Direct lot URL and refresh after answer |
| Search | Name/description, paging, category | Invalid status/category syntax, empty result | Back/forward between searches |
| Drafts | Save, list, reopen, update, delete | Empty draft, storage unavailable, missing draft ID | Refresh editor and reopen by `?draft=` URL |

## Automated and packaging acceptance

Run these from the project root while the API is running:

```text
npm run test:clean
npm run build
```

Before submission:

- [ ] Confirm every automated test passes from an empty database. Four supplied password-complexity assertions intentionally conflict with the restored 8–32-character registration rule.
- [x] Inspect images, buttons, inputs, textareas, selects, links, loading states, empty states, and error panels at desktop and narrow widths.
- [x] Search tracked source and documentation for passwords, tokens, private keys, API keys, email addresses, and personal data. Test fixtures contain only obviously fictitious accounts.
- [x] Confirm the submission excludes `.git/`, `node_modules/`, `frontend/node_modules/`, `db.sqlite`, temporary files, and prior archives.
- [x] Open the trial archive, confirm its top-level structure, and record both archive size and unpacked size.
- [x] Complete the five-minute recording rehearsal using the route above.

## API demonstrations for extensions

- Categories: `GET /categories`
- Category search: `GET /search?category_id=1`
- Multiple categories: include `"category_ids": [1, 2]` in an authenticated `POST /item`
- Invalid category: use an unknown category ID and expect HTTP 400
- Sensitive item/question/answer: submit `sh!t` in each supported text field and expect HTTP 400

## Acceptance run — 13 September 2026

- `npm run test:clean`: **131 passing, 4 password-complexity assertions failing** after restoring the original registration rule. Those four tests expect character-type requirements that the application intentionally does not enforce.
- `npm run build`: completed successfully; the largest compiled asset is the 3.29 MB record-cover atlas.
- Browser rehearsal: passed login, two-category auction creation, low and successful bids, sensitive and valid Q&A, category filtering, local draft save/reload/edit, back navigation, direct missing-lot handling, and a 390 × 844 responsive check. Browser console reported no warnings or errors.
- Sensitive-data scan: no API keys, client secrets, private-key blocks, or hard-coded application credentials found. Accounts under `tests/data/` are fictitious test fixtures.
- Final trial archive: `backups/GrooveGavel-week5-final.zip`; 75 files, 3.37 MiB compressed and 3.69 MiB unpacked. Archive inspection found no `.git`, `node_modules`, `db.sqlite`, `tmp`, or `backups` entries.
