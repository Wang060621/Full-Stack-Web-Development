# Auctionary API coverage

Source of truth: Auctionary Swagger 1.0.0, reviewed 8 September 2026. The stricter password checks shown below are also required by the supplied tests.

Status legend: **Done**, **Not started**, **N/A**. “Automated test” records the current implementation scope; run results belong in the verification section.

| Method and path | Login | Request fields and validation | Success | Error statuses | Backend | Automated test | Frontend |
|---|---|---|---|---|---|---|---|
| `POST /users` | No | JSON: `first_name`, `last_name`, `email`, `password`; all required; names non-blank; valid email; password 8-32 chars with upper/lowercase, number and special character; no extra fields; email unique | `201` `{ user_id }` | `400` validation/duplicate; `500` server | **Done** | **Pass** | **Not started** |
| `POST /login` | No | JSON: `email`, `password`; both required and non-blank; valid email; no extra fields; credentials must match | `200` `{ user_id, session_token }` | `400` validation/credentials; `500` server | **Done** | **Pass** | **Not started** |
| `POST /logout` | Yes, `X-Authorization` | No body; token must belong to a logged-in user | `200` | `401` missing/invalid token; `500` server | **Done** | **Pass** | **Not started** |
| `GET /users/{user_id}` | No | Path `user_id`: positive integer identifying an existing user | `200` user identity plus `selling`, `bidding_on`, `auctions_ended` item arrays | `404` user absent/invalid ID; `500` server | **Done** | **Pass** | **Not started** |
| `GET /search` | Only for `status` filters | Query: optional `q`; `status` in `BID`, `OPEN`, `ARCHIVE`; `limit` integer 1-100, default 20; `offset` integer >=0, default 0 | `200` item array | `400` invalid query/auth combination; `500` server | **Done** | **Pass** | **Not started** |
| `POST /item` | Yes | JSON: `name`, `description`, `starting_bid`, `end_date`; required by supplied tests; no extras; bid numeric; end date in future | `201` `{ item_id }` | `400`, `401`, `500` | **Done** | **Pass** | **Not started** |
| `GET /item/{item_id}` | No | Path `item_id`: integer identifying an existing item | `200` item details and current bid/holder | `404`, `500` | **Done** | **Pass** | **Not started** |
| `GET /item/{item_id}/bid` | No | Path `item_id`: integer identifying an existing item | `200` bid history array | `404`, `500` | **Done** | **Pass** | **Not started** |
| `POST /item/{item_id}/bid` | Yes | Path `item_id`; JSON: required integer `amount`; no extras; item open; amount above current bid; bidder cannot be seller | `201` | `400`, `401`, `403`, `404`, `500` | **Done** | **Pass** | **Not started** |
| `GET /item/{item_id}/question` | No | Path `item_id`: integer identifying an existing item | `200` question array | `404`, `500` | **Done** | **Pass** | **Not started** |
| `POST /item/{item_id}/question` | Yes | Path `item_id`; JSON: required non-blank `question_text`; no extras; asker cannot be seller | `200` | `400`, `401`, `403`, `404`, `500` | **Done** | **Pass** | **Not started** |
| `POST /question/{question_id}` | Yes | Path `question_id`; JSON: required non-blank `answer_text`; no extras; only item seller may answer | `200` | `400`, `401`, `403`, `404`, `500` | **Done** | **Pass** | **Not started** |

## Response shapes

- All validation errors from the implemented endpoints use `{ "error_message": "..." }`.
- Item summaries contain `item_id`, `name`, `description`, `end_date`, `creator_id`, `first_name`, and `last_name`.
- `GET /users/{user_id}` deliberately omits email, password, salt, and session token.
- Authentication uses the exact Swagger header name `X-Authorization`.

## Week 1 verification

- Official user creation tests: pass.
- Official login/logout tests: pass.
- User profile behavior: verified for missing users, empty profiles, active listings, ended listings, and distinct active bids.
- Postman/Newman collection: pass after a database wipe.
- Clean-database startup: pass; SQLite and all four starter tables are recreated automatically.

## Week 2 verification

- The supplied course test files are preserved without modifications. With their
  original fixture/expectation mismatch, the clean-database run reports 120 passing
  and 8 related failures.
- Independent manual flow: two new users, auction creation, rejected low/own bids,
  accepted bid, question and answer, item/bid/question reads, name and status
  searches, invalid pagination, unauthenticated creation, and missing resources.
- Independent checks follow the Swagger rules rather than the inconsistent fixed
  bid and search expectations. No application behavior depends on fixture IDs, names,
  or bid amounts.
