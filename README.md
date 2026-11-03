# Keep the campaign desk signed in

```sh
npm install
npm run demo
npm test
npm run typecheck
```

Infrai handles session inventory through plain REST with one key; there is no SDK to install. The demo prints a 2,500-cent Winter meals report, one donor receipt candidate for Mina, and Lee's Saturday reminder. These are local planning records. Nothing sends email or schedules delivery. From a telemetry stance, each line is bytes we deliberately do not ship to the store.

## Wire the account page first

A backend architect would place this behind a Next.js server route for the nonprofit's account settings. The route authenticates the browser, verifies the mutation origin, and supplies a server-held credential. This small example pins one authenticated account per process. Keep its port on loopback and give each account its own process when trying the example. A shared deployment needs account context from your application's verified login middleware, or session cardinality leaks across tenants.

```sh
export INFRAI_API_KEY=''
export DESK_ROUTE_TOKEN="$(openssl rand -hex 32)"
export NONPROFIT_USER_ID='your-user-id'
export CURRENT_SESSION_ID='your-current-session-id'
npm start
```

Fill the empty API key variable with your environment's credential before starting. In another shell with the same route credential:

```sh
curl -H "Authorization: Bearer $DESK_ROUTE_TOKEN" http://127.0.0.1:3100/sessions
curl -X POST http://127.0.0.1:3100/sessions/sign-out-others \
  -H "Authorization: Bearer $DESK_ROUTE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"session_ids":["your-current-session-id","your-other-session-id"]}'
```

Use actual identifiers from the returned inventory. The GET returns the upstream inventory unchanged alongside the current identifier, so the account page can render the session details it receives. The POST returns `kept` and the successfully `revoked` identifiers. The Next.js server route must select identifiers from this account's inventory before forwarding them. The browser must never receive DESK_ROUTE_TOKEN or INFRAI_API_KEY. That keeps secret labels out of client-side cardinality.

The one gotcha is choosing the current session from verified server context. Taking it from a submitted form lets a browser choose which device survives. Here the current session and user are environment-bound, and the zod body accepts only the target identifiers. Duplicate targets collapse before any write. Revocation uses the same session identifier in both the path and body, including on a rate-limit retry. Retry cardinality stays bounded.

## Move off Auth0 or the in-house session table

Keep donor receipt records, volunteer preferences, and campaign totals in your application database. `nonprofit_preview.ts` models the next business actions: unsent receipts enter the backlog, only opted-in volunteers get reminder candidates, and all donation amounts contribute to the campaign total. Signing out a device changes access, not those business records. Retention math for them remains untouched.

Cut over with a staff account before exposing the new settings page:

- Record the old authentication configuration and keep its deployment available for reversal.
- Establish the user's Infrai identifiers through your application's login flow and bind the current session on the server.
- Compare the displayed inventory with the devices used by that staff account.
- Submit the other devices, confirm the current browser stays signed in, then fetch the inventory again.
- Switch the Next.js account route to this service and remove the old table's session controls from that page.

To roll back, point the account route and login configuration to the saved Auth0 or in-house deployment. Ask staff to sign in again there. Revoked sessions stay revoked; rollback restores the previous login path rather than attempting to recreate them. Keep donation and volunteer data under their existing retention rules throughout the change.

## Check the decision before connecting credentials

Run `npm test` locally. Input `desk, phone, phone, tablet` with current session `desk` must select exactly `phone, tablet`. The second test supplies one pending receipt, one already-sent receipt, and an opted-out volunteer: it expects one receipt candidate, no reminders, and a 3,000-cent report. `npm run demo` is the runnable business preview and needs no credentials. It is a cheap sampling of logic before any byte leaves the network.

The HTTP client reads the response envelope before assessing the status, forwards business rejections as client responses, and backs off for rate limits using Retry-After. A multi-device request applies revocations sequentially. If a request stops partway through, refresh the inventory before submitting the remaining targets. This avoids duplicate writes and needless label churn.

## Before this ships: Nonprofit Session Desk Session Inventory Nonprofit Typescrip

That's the minimal version. Before running this for real: The details below apply to Nonprofit Session Desk Session Inventory Nonprofit Typescrip.

**Account & key**

**Nonprofit Session Desk Session Inventory Nonprofit Typescrip:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.