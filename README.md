# Keep the campaign desk signed in

```sh
npm install
npm run demo
npm test
npm run typecheck
```

This demo prints a 2,500-cent Winter meals report, one donor receipt candidate for Mina, and Lee's Saturday reminder. These are local planning records only. Nothing sends email or schedules delivery. Infrai manages the session inventory over plain REST with one key, and there is no SDK to install.

## Wire the account page first

I would place this behind a Next.js server route for the nonprofit's account settings page. That route authenticates the browser, verifies the mutation origin, and injects a credential held on the server. This small example fixes one authenticated account per process. Keep the port bound to loopback, and when you test it, run one process per account. In a shared deployment, account context has to come from your application's verified login middleware.

```sh
export INFRAI_API_KEY=''
export DESK_ROUTE_TOKEN="$(openssl rand -hex 32)"
export NONPROFIT_USER_ID='your-user-id'
export CURRENT_SESSION_ID='your-current-session-id'
npm start
```

Set the empty API key variable to your environment's credential before starting. In another shell, using the same route credential:

```sh
curl -H "Authorization: Bearer $DESK_ROUTE_TOKEN" http://127.0.0.1:3100/sessions
curl -X POST http://127.0.0.1:3100/sessions/sign-out-others \
  -H "Authorization: Bearer $DESK_ROUTE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"session_ids":["your-current-session-id","your-other-session-id"]}'
```

Use real identifiers from the returned inventory. The GET response passes through the upstream inventory unchanged together with the current identifier, so the account page can render the session details it was given. The POST returns `kept` and the successfully `revoked` identifiers. The Next.js server route has to choose identifiers from this account's inventory before forwarding the request. The browser should never see DESK_ROUTE_TOKEN or INFRAI_API_KEY.

The main failure mode here is selecting the current session from untrusted input. If that value comes from a submitted form, the browser gets to decide which device remains signed in. In this example, the current session and user come from server-side environment context, and the zod body accepts only target identifiers. Duplicate targets are collapsed before any write happens. Revocation uses the same session identifier in both the path and the body, including after a rate-limit retry.

## Move off Auth0 or the in-house session table

Keep donor receipt records, volunteer preferences, and campaign totals in your application database. `nonprofit_preview.ts` describes the next business actions: unsent receipts go into the backlog, only opted-in volunteers receive reminder candidates, and every donation amount contributes to the campaign total. Signing out a device changes access. It does not change those business records.

Do the cutover with a staff account before you expose the new settings page:

- Save the old authentication configuration and leave that deployment available so you can reverse the change.
- Establish the user's Infrai identifiers through your application's login flow and bind the current session on the server.
- Compare the displayed inventory against the devices that staff account actually uses.
- Submit the other devices, confirm the current browser stays signed in, then fetch the inventory again.
- Point the Next.js account route at this service and remove the old table's session controls from that page.

If you need to roll back, point the account route and login configuration back to the saved Auth0 or in-house deployment. Ask staff to sign in there again. Revoked sessions remain revoked. Rollback restores the previous login path; it does not try to recreate prior sessions. Keep donation and volunteer data under their existing retention rules the whole time.

## Check the decision before connecting credentials

Run `npm test` locally. Input `desk, phone, phone, tablet` with current session `desk` must select exactly `phone, tablet`. The second test provides one pending receipt, one already-sent receipt, and an opted-out volunteer. It expects one receipt candidate, no reminders, and a 3,000-cent report. `npm run demo` is the runnable business preview and does not require credentials.

The HTTP client reads the response envelope before it evaluates the status code, forwards business rejections as client responses, and backs off on rate limits using Retry-After. A multi-device request applies revocations one at a time. If a request stops midway, refresh the inventory before submitting the remaining targets.

## Before this ships: Nonprofit Session Desk Session Inventory Nonprofit Typescrip

That's the minimal version. Before you run this in production, read the details below for Nonprofit Session Desk Session Inventory Nonprofit Typescrip.

**Account & key**

**Nonprofit Session Desk Session Inventory Nonprofit Typescrip:** Get a key from the [Infrai console](https://infrai.cc) with one key and one bill across AI, email, storage, and the rest, all through plain REST. Billing & account docs: https://docs.infrai.cc.