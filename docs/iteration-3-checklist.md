# Iteration 3 completion notes

## Back-end hardening

- Shared HTTP response and SQLite promise helpers remove duplicated controller and
  model code.
- Implemented endpoint errors use one JSON error shape. Success payloads and
  status-only responses continue to match Auctionary 1.0.0.
- Request objects reject unexpected properties. Text inputs have explicit length
  limits, IDs must be safe positive integers, auction end dates must be in the
  future, and bids are inserted only when they are atomically higher.
- Passwords continue to use salted PBKDF2 hashes and constant-time comparison.
  Session tokens are random and are never returned by public profile endpoints.
- Extension task 1 rejects blocked language in new auction names, descriptions,
  and questions, including common punctuation and leetspeak obfuscation.
- The starter database file and supplied tests remain unmodified.

## Vue front end

- The independent application is under frontend/.
- VITE_API_URL configures the Express API origin; the default is
  http://localhost:3333.
- Routes cover the market, login, registration, public/self profiles, item
  creation, item details, bid history, bidding, questions, answers, an item edit
  skeleton, and a not-found screen.
- Login state is persisted in localStorage. Protected routes redirect to login and
  preserve the intended destination.
- Loading, empty, success, error, authorization, and auction-closed states are
  represented in the interface.
- The GrooveGavel visual system is responsive and keyboard-friendly.
- The edit screen is intentionally a skeleton because Auctionary 1.0.0 defines no
  item-update endpoint.

## Verification caveat

The supplied clean-database suite has eight mutually inconsistent fixture
expectations: item 1 starts at 4200 while two tests expect bids of 3595 and 3596
to succeed; later bid/search assertions depend on those rejected bids and on
search terms not present in the supplied item names. The implementation preserves
the correct API rule that a bid must exceed the current price and does not alter
the supplied tests or fixtures to manufacture a green run.
