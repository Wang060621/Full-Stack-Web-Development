# GrooveGavel Vue front end

This directory is an independent Vue 3 application for the Auctionary Express API.

## Run locally

1. Start the back end from the repository root: npm run dev
2. In this directory, install dependencies: npm install
3. Start Vue: npm run dev
4. Open http://127.0.0.1:5173

The app uses http://localhost:3333 by default. Copy .env.example to .env.local
and change VITE_API_URL if the API runs elsewhere.

## Included routes

- / - auction list, search, pagination, and authenticated status filters
- /login and /register - user authentication
- /profile/:id - public profile and auction groups
- /items/new - authenticated auction creation
- /items/:id - details, bids, questions, and seller answers
- /items/:id/edit - edit form skeleton (the supplied API has no update endpoint)

Run npm run build to create a production build.
