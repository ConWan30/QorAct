import assert from "node:assert/strict";
import { test } from "node:test";
import { buildQoract } from "./build";
import { issueFromRecap, recapDoorHealth } from "./recap-door";
import { recordFromDict } from "./reader";
import { Rollup, Verdict } from "./record";
import { clockCommitment, verifyQoract } from "./verify";

const RECAP = {
  schema: "session-recap-1",
  session: "sess-live-1",
  event_count: 2,
  status: "live",
};

test("determinism", async () => {
  const a = await buildQoract({
    sessionId: "s1",
    sessionDisplay: "a",
    recapPayload: RECAP,
  });
  const b = await buildQoract({
    sessionId: "s1",
    sessionDisplay: "a",
    recapPayload: RECAP,
  });
  assert.deepEqual(a, b);
  assert.equal(a.clock_commitment, await clockCommitment(RECAP));
});

test("producer status ignored in commitment", async () => {
  const dirty = { ...RECAP, status: "FORGED_OK" };
  assert.equal(await clockCommitment(RECAP), await clockCommitment(dirty));
});

test("empty hid without kas is unverifiable outcome", async () => {
  const rec = await buildQoract({
    sessionId: "s1",
    recapPayload: RECAP,
    hidBodiedOnHost: false,
    ivcJoined: false,
  });
  assert.ok(rec.outcome);
  assert.equal(rec.outcome.verdict, Verdict.UNVERIFIABLE);
  assert.equal(rec.outcome.agent_actuator, "undeployed");
  assert.equal(rec.rollup, Rollup.PARTIAL_SURFACES);
});

test("hid without ivc still unverifiable", async () => {
  const rec = await buildQoract({
    sessionId: "s1",
    hidBodiedOnHost: true,
    ivcJoined: false,
  });
  assert.ok(rec.outcome);
  assert.equal(rec.outcome.verdict, Verdict.UNVERIFIABLE);
});

test("kas reference allows human outcome", async () => {
  const rec = await buildQoract({
    sessionId: "s1",
    kasCommitment: "sha256:abc",
    kasVerdict: "INSUFFICIENT_KILLS",
  });
  assert.ok(rec.outcome);
  assert.equal(rec.outcome.verdict, Verdict.HUMAN_AUTHORED);
});

test("tampered kas fails verify", async () => {
  const rec = await buildQoract({ sessionId: "s1", kasCommitment: "sha256:abc" });
  const out = await verifyQoract(rec, { expectedKasCommitment: "sha256:OTHER" });
  assert.equal(out.ok, false);
  assert.ok(out.reasons.includes("kas_commitment reference mismatch"));
});

test("clock recompute", async () => {
  const rec = await buildQoract({ sessionId: "s1", recapPayload: RECAP });
  assert.equal((await verifyQoract(rec, { recapPayload: RECAP })).ok, true);
  const forged = { ...RECAP, event_count: 99 };
  assert.equal((await verifyQoract(rec, { recapPayload: forged })).ok, false);
});

test("arm without file is not pixels span", async () => {
  const rec = await buildQoract({
    sessionId: "s1",
    mediaActuatorLog: [
      {
        kind: "pixels",
        armed: true,
        commit: false,
        path: "fast",
        source: "arm",
        stem: "",
      },
    ],
  });
  assert.deepEqual(rec.media, []);
});

test("fast speech is agent", async () => {
  const rec = await buildQoract({
    sessionId: "s1",
    mediaActuatorLog: [
      {
        kind: "speech",
        commit: true,
        path: "fast",
        source: "clutchbot",
        ticket_id: "QORESENCE-COUPLING-TICKET-v0-1",
        text: "Clutch window opening.",
      },
    ],
  });
  assert.equal(rec.media.length, 1);
  assert.equal(rec.media[0]?.verdict, Verdict.AGENT_AUTHORED);
});

test("hold speech is not a span", async () => {
  const rec = await buildQoract({
    sessionId: "s1",
    mediaActuatorLog: [
      { kind: "speech", commit: true, path: "hold", text: "Unlabeled." },
    ],
  });
  assert.deepEqual(rec.media, []);
});

test("operator clip is human pixels", async () => {
  const rec = await buildQoract({
    sessionId: "s1",
    mediaActuatorLog: [
      {
        kind: "pixels",
        commit: true,
        operator_post: true,
        path: "operator",
        source: "studio",
        stem: "hdmi_clip_aa",
      },
    ],
  });
  assert.equal(rec.media[0]?.verdict, Verdict.HUMAN_AUTHORED);
});

test("operator and fast clip is mixed", async () => {
  const rec = await buildQoract({
    sessionId: "s1",
    mediaActuatorLog: [
      {
        kind: "pixels",
        commit: true,
        operator_post: true,
        path: "fast",
        source: "local_hdmi",
        stem: "hdmi_clip_bb",
        armed: true,
      },
    ],
  });
  assert.equal(rec.media[0]?.verdict, Verdict.MIXED);
});

test("forbidden signer unseals", async () => {
  const rec = await buildQoract({
    sessionId: "s1",
    sealed: true,
    signedBy: "operator",
  });
  assert.equal(rec.sealed, false);
  assert.equal(rec.rollup, Rollup.UNVERIFIABLE);
});

test("sealed pre-u1 unverifiable", async () => {
  const rec = await buildQoract({
    sessionId: null,
    sealed: true,
    signedBy: "ConWanZo",
  });
  assert.equal(rec.rollup, Rollup.UNVERIFIABLE);
});

test("live flag fails verify", async () => {
  const rec = await buildQoract({ sessionId: "s1" });
  assert.equal(rec.live, false);
  assert.equal((await verifyQoract(rec)).ok, true);
});

const DOOR = {
  schema: "session-recap-1",
  ok: true,
  status: "live",
  session: "sess-door-1",
  duration_ms: 12000,
  event_count: 1,
  confirmed_event_count: 0,
  linked_clip_count: 1,
  incomplete: true,
  events: [
    {
      qualification: "observed",
      clip: { available: true, clip_id: "hdmi_clip_aa" },
    },
  ],
  freshness: { stale: false },
};

test("recap alone does not author pixels", async () => {
  const rec = await issueFromRecap(DOOR);
  assert.equal(rec.session_id, "sess-door-1");
  assert.equal(rec.live, false);
  assert.equal(rec.sealed, false);
  assert.ok(rec.outcome);
  assert.equal(rec.outcome.verdict, Verdict.UNVERIFIABLE);
  assert.deepEqual(rec.media, []);
  assert.equal(rec.rollup, Rollup.PARTIAL_SURFACES);
  assert.match(rec.hygiene_note, /initiator unknown/);
});

test("malformed payload fail-open", async () => {
  const rec = await issueFromRecap("not-a-recap");
  assert.equal(rec.schema, "qoract-record-1");
  assert.equal(rec.live, false);
  assert.match(rec.hygiene_note, /not an object/);
});

test("actuator log authors speech only", async () => {
  const rec = await issueFromRecap(DOOR, {
    mediaActuatorLog: [
      {
        kind: "speech",
        commit: true,
        path: "fast",
        source: "clutchbot",
        ticket_id: "tick-1",
        text: "Clutch window opening.",
      },
    ],
  });
  assert.equal(rec.media.length, 1);
  assert.equal(rec.media[0]?.verdict, Verdict.AGENT_AUTHORED);
  assert.equal(rec.rollup, Rollup.COMPLETE);
});

test("reader null-safe", () => {
  assert.equal(recordFromDict(null), null);
  assert.equal(recordFromDict("x"), null);
  const rec = recordFromDict({
    schema: "qoract-record-1",
    rollup: "nope",
    media: [1],
  });
  assert.ok(rec);
  assert.equal(rec.rollup, Rollup.UNVERIFIABLE);
  assert.deepEqual(rec.media, []);
});

test("health never claims humanity", async () => {
  const rec = await issueFromRecap(DOOR);
  const health = recapDoorHealth(rec);
  assert.equal(health.humanity_claim, false);
  assert.equal(health.fail_open, true);
  assert.equal(health.live, false);
});

