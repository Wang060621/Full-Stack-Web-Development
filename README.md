# GrooveGavel Auctionary

GrooveGavel is a full-stack auction application with an Express/SQLite API and a Vue/Vite frontend. Users can register, sign in, publish auction lots, bid, ask and answer questions, search the catalogue, organise records by category, and keep unpublished drafts in their browser.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

No external database server, API key, or secret configuration is required. The backend uses the local `db.sqlite` file and creates its tables automatically.

## Install

From the project root:

```text
npm install
npm --prefix frontend install
```

## Run

Open two terminals in the project root.

Terminal 1 — API at `http://localhost:3333`:

```text
npm run dev
```

Terminal 2 — frontend at `http://127.0.0.1:5173`:

```text
npm run frontend:dev
```

The frontend uses `http://localhost:3333` by default. To point it at another API, set `VITE_API_URL` before starting Vite.

## Test from an empty database

Keep the API running, then use a third terminal:

```text
npm run test:clean
```

This removes auction, bid, question, user, and item-category data, resets generated IDs, and runs the complete API suite. Seeded category names remain available. To run the steps separately, use `npm run wipe` followed by `npm test`.

Build the production frontend with:

```text
npm run build
```

The compiled files are written to `frontend/dist/`.

## Iteration 5 extensions

- Sensitive-content checks reject disallowed language in new auction names/descriptions, questions, and answers. Validation failures return a JSON `error_message` and never write the rejected content.
- `GET /categories` returns the category catalogue. A new auction accepts up to three unique `category_ids`, and `GET /search?category_id=1` filters by category. Search covers both the auction name and description.
- The Sell a record page can save, reopen, update, and delete multiple drafts. Drafts are scoped to the signed-in user and stored only in that browser's local storage. Publishing a loaded draft removes it.

Core endpoints:

- `POST /users`, `POST /login`, `POST /logout`, `GET /users/:user_id`
- `POST /item`, `GET /item/:item_id`
- `POST /item/:item_id/bid`, `GET /item/:item_id/bid`
- `POST /item/:item_id/question`, `POST /question/:question_id`, `GET /item/:item_id/question`
- `GET /search`, `GET /categories`

Authenticated requests use the `X-Authorization` header returned by `POST /login`.

## Demonstration and acceptance

The five-minute demo route, manual edge cases, refresh/direct-navigation checks, security review, and packaging checklist are documented in [`docs/iteration-5-checklist.md`](docs/iteration-5-checklist.md).

The original assessment API specification is included in the project root. Earlier implementation notes are under `docs/`, and the Postman collection is under `postman/`.

## Troubleshooting

- If the frontend says it cannot reach the auction service, confirm the API is running on port 3333.
- If port 3333 is already in use, stop the other process before starting the API.
- Drafts do not sync between browsers or devices. Clearing site data deletes them.
- If schema changes are not visible, stop and restart the API so its startup migration can run.
