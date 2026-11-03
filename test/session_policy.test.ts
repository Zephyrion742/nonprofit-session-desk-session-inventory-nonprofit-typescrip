import test from "node:test";
import assert from "node:assert/strict";
import { otherSessions, signOutBody } from "../src/session_policy.ts";
import { previewWork } from "../src/nonprofit_preview.ts";

test("keep the browser running the campaign desk and revoke each other device once", () => {
  const input = signOutBody.parse({ session_ids: ["desk", "phone", "phone", "tablet"] });
  assert.deepEqual(otherSessions(input.session_ids, "desk"), ["phone", "tablet"]);
  assert.equal(signOutBody.safeParse({ session_ids: [""] }).success, false);
});

test("receipt backlog and opted-in reminders feed a campaign preview", () => {
  const result = previewWork({ campaign: "Meals", donations: [
    { donor: "Mina", amountCents: 2500, receiptSent: false },
    { donor: "Jo", amountCents: 500, receiptSent: true }
  ], volunteers: [{ name: "Lee", optedIn: false, shift: "Saturday" }] });
  assert.deepEqual(result, { receipts: [{ donor: "Mina", amountCents: 2500 }], reminders: [], report: { campaign: "Meals", raisedCents: 3000 } });
});
