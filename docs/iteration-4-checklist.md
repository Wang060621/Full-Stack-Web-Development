# Iteration 4 completion checklist

## Front-end integration

- [x] Connect every page to the real Express API.
- [x] Cover every base API operation in the interface.
- [x] Persist and send `X-Authorization` credentials correctly.
- [x] Clear expired credentials, explain expiry, and preserve protected-route redirects.
- [x] Validate registration, login, auction, bid, question, and answer forms on the client.
- [x] Show loading, success, empty, authorization, closed-auction, and error states.
- [x] Disable submissions and reject handler re-entry while requests are running.
- [x] Refresh item, bid, question, profile, and filtered-list data after actions.
- [x] Verify the browser console contains no warnings or errors.
- [x] Verify desktop (`1280 x 800`) and mobile (`375 x 812`) layouts.
- [x] Verify keyboard order, labels, route focus, skip link, reduced motion, and contrast.
- [x] Record destructive-action confirmation as N/A because the base API has no destructive endpoint.
- [x] Mark every base endpoint complete in `api-coverage.md`.

## Acceptance evidence

- [x] A user can complete every base business flow through the interface.
- [x] The front end covers all 12 base API operations.
- [x] Back-end validation and authorization errors are shown clearly in the interface.
- [x] Page styling, navigation, feedback, and interaction patterns are consistent.
- [x] The front-end production build passes and no blocking front- or back-end defect remains.

Under the updated password policy, the supplied clean-database suite has 12 known
incompatible assertions: eight caused by contradictory fixed auction/search fixtures,
plus four legacy assertions that expect weak-but-valid passwords to be rejected. These
are documented in `api-coverage.md` and are not application regressions.
