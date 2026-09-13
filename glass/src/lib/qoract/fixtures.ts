import type { MediaActuatorRow } from "./build";

export type FixtureCase = {
  id: string;
  title: string;
  law: string;
  recap: unknown;
  actuators?: MediaActuatorRow[];
  kasCommitment?: string;
  kasVerdict?: string;
  hidBodiedOnHost?: boolean;
  ivcJoined?: boolean;
  sealed?: boolean;
  signedBy?: string;
};

const BODIED_LOCKED = {
  schema: "session-recap-1",
  ok: true,
  status: "live",
  session: "1842",
  duration_ms: 13000,
  event_count: 3,
  confirmed_event_count: 3,
  linked_clip_count: 0,
  incomplete: false,
  empty_reason: null,
  events: [
    { event_id: "1842_evt_0001", qualification: "confirmed", clip: { available: false } },
    { event_id: "1842_evt_0002", qualification: "confirmed", clip: { available: false } },
    { event_id: "1842_evt_0003", qualification: "confirmed", clip: { available: false } },
  ],
  freshness: { generated_at: "2026-08-25T00:00:00Z", stale: false },
};

const CLIP_LINKED = {
  schema: "session-recap-1",
  ok: true,
  status: "live",
  session: "s",
  duration_ms: 1,
  event_count: 1,
  confirmed_event_count: 1,
  linked_clip_count: 1,
  incomplete: false,
  empty_reason: null,
  events: [
    {
      event_id: "e1",
      event_type: "situation_shift",
      t_start_ns: 1000000,
      t_end_ns: 2000000,
      qualification: "confirmed",
      clip: { available: true, clip_id: "hdmi_clip_keep" },
    },
  ],
  freshness: { stale: false },
};

const JOURNAL_NOT_RECAP = {
  schema_version: "observation-journal-1",
  session_id: "session",
  record: {
    envelope_schema: "qoresence.observation-envelope.v0",
    input_availability: "not_on_this_host",
    clip: { status: "not_requested" },
  },
};

function make3bEvents() {
  return Array.from({ length: 22 }, (_, i) => ({
    event_id: `qoresence_06b8c404882b_evt_${String(i + 1).padStart(4, "0")}`,
    event_type: "situation_shift",
    session_id: "qoresence_06b8c404882b",
    bodied: false,
    score: { home: 7, away: 0 },
    clip: { available: false },
    qualification: "confirmed",
    schema_version: "event-1",
  }));
}

const QACT3B = {
  schema: "session-recap-1",
  ok: true,
  status: "live",
  session: "qoresence_06b8c404882b",
  duration_ms: 2336593,
  event_count: 22,
  confirmed_event_count: 22,
  linked_clip_count: 0,
  incomplete: false,
  empty_reason: null,
  events: make3bEvents(),
  freshness: { stale: false },
};

const DOOR_RECAP = {
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

export const FIXTURES: FixtureCase[] = [
  {
    id: "empty-hid",
    title: "Empty HID Â· DualSense on PS5",
    law: "Outcome UNVERIFIABLE unless KAS/PoSP or bodied+IVC. Empty laptop HID is valid observation.",
    recap: QACT3B,
  },
  {
    id: "bodied-locked",
    title: "Bodied locked Recap",
    law: "Q-ACT-3 offline. Partial surfaces. No pixels from Recap alone.",
    recap: BODIED_LOCKED,
  },
  {
    id: "clip-linked",
    title: "Linked clip Â· no initiator",
    law: "A Foundry clip link is not an authorship verdict. Recap door fail-open.",
    recap: CLIP_LINKED,
  },
  {
    id: "wrong-schema",
    title: "Observation journal (wrong schema)",
    law: "Garbage Recap still issues a draft. Fail-open. humanity_claim stays false.",
    recap: JOURNAL_NOT_RECAP,
  },
  {
    id: "fast-speech",
    title: "ClutchBot path=fast speech",
    law: "Confirm-path and fast-path chat are AGENT_AUTHORED speech, not a trigger pull.",
    recap: DOOR_RECAP,
    actuators: [
      {
        kind: "speech",
        commit: true,
        path: "fast",
        source: "clutchbot",
        ticket_id: "QORESENCE-COUPLING-TICKET-v0-1",
        text: "Clutch window opening.",
      },
    ],
  },
  {
    id: "confirm-speech",
    title: "Confirm-path speech sidecar",
    law: "path=confirm is still AGENT_AUTHORED. Sidecar authors speech only.",
    recap: QACT3B,
    actuators: [
      {
        kind: "speech",
        commit: true,
        path: "confirm",
        source: "clutchbot",
        ticket_id: "tick-3b-1",
        text: "Score update: 21-3.",
      },
    ],
  },
  {
    id: "hold-speech",
    title: "path=hold speech",
    law: "Hold / empty text is not a speech span.",
    recap: DOOR_RECAP,
    actuators: [
      { kind: "speech", commit: true, path: "hold", text: "Unlabeled." },
    ],
  },
  {
    id: "arm-no-file",
    title: "Arm without a file",
    law: "Arm/intent without a Foundry stem is not a pixels span.",
    recap: DOOR_RECAP,
    actuators: [
      {
        kind: "pixels",
        armed: true,
        commit: false,
        path: "fast",
        source: "arm",
        stem: "",
      },
    ],
  },
  {
    id: "operator-pixels",
    title: "Operator studio clip",
    law: "Operator post + stem commits HUMAN_AUTHORED pixels.",
    recap: DOOR_RECAP,
    actuators: [
      {
        kind: "pixels",
        commit: true,
        operator_post: true,
        path: "operator",
        source: "studio",
        stem: "hdmi_clip_aa",
      },
    ],
  },
  {
    id: "mixed-pixels",
    title: "Operator + fast clip",
    law: "Never round MIXED up to HUMAN. Operator and agent on one span is MIXED.",
    recap: DOOR_RECAP,
    actuators: [
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
  },
  {
    id: "kas-human",
    title: "KAS reference (hash only)",
    law: "Optional QorTroller KAS as a hash. Outcome HUMAN_AUTHORED. Not eligibility.",
    recap: BODIED_LOCKED,
    kasCommitment: "sha256:abc",
    kasVerdict: "INSUFFICIENT_KILLS",
  },
  {
    id: "hid-ivc",
    title: "HID bodied + IVC joined",
    law: "Bodied host HID with IVC join authors HUMAN outcome. HID without IVC stays UNVERIFIABLE.",
    recap: BODIED_LOCKED,
    hidBodiedOnHost: true,
    ivcJoined: true,
  },
  {
    id: "forbidden-signer",
    title: "Forbidden signer",
    law: "Forbidden signers: bridge, operator, qoresence, qortroller, qoract. Unseals.",
    recap: BODIED_LOCKED,
    sealed: true,
    signedBy: "operator",
  },
];

