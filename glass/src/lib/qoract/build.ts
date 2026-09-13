/** buildQoract â€” reference-and-bind. Fail closed. No new crypto ground. */

import {
  FORBIDDEN_SIGNERS,
  MediaKind,
  OUTCOME_AGENT,
  Rollup,
  SCHEMA,
  Verdict,
  type MediaSpan,
  type OutcomeSurface,
  type QorActRecord,
} from "./record";
import { clockCommitment } from "./verify";

export type MediaActuatorRow = Record<string, unknown>;

function s(v: unknown): string {
  return String(v ?? "").trim();
}

function classifyMedia(row: Record<string, unknown>): MediaSpan | null {
  const kindRaw = s(row.kind).toLowerCase();
  if (kindRaw !== MediaKind.PIXELS && kindRaw !== MediaKind.SPEECH) return null;
  const kind = kindRaw as MediaKind;
  let path = s(row.path) || "absent";
  const source = s(row.source) || "absent";
  const ticketId = s(row.ticket_id);
  const stem = s(row.stem) || null;
  const clockNs = Number.parseInt(String(row.clock_ns ?? 0), 10) || 0;
  let frameSeq: number | null = null;
  if (row.frame_seq !== undefined && row.frame_seq !== null && row.frame_seq !== "") {
    const n = Number.parseInt(String(row.frame_seq), 10);
    frameSeq = Number.isFinite(n) ? n : null;
  }

  const armed = Boolean(row.armed);
  const commit = Boolean(row.commit);
  const operator =
    Boolean(row.operator_post) ||
    path === "operator" ||
    source === "studio" ||
    source === "operator";
  const agent =
    [
      "arm",
      "local_hdmi",
      "agent_clip",
      "clutchbot",
      "match_agent",
      "mcp",
      "fast_moment",
    ].includes(source) ||
    path === "fast" ||
    path === "confirm";
  const leftover = path === "leftover" || source === "twitch_clip";

  if (kind === MediaKind.SPEECH) {
    const text = s(row.text);
    if (path === "hold" || !text || !commit) return null;
    let verdict: Verdict;
    if (!ticketId) verdict = Verdict.UNVERIFIABLE;
    else if (operator && agent) verdict = Verdict.MIXED;
    else if (operator) verdict = Verdict.HUMAN_AUTHORED;
    else if (agent) verdict = Verdict.AGENT_AUTHORED;
    else verdict = Verdict.UNVERIFIABLE;
    return {
      kind,
      verdict,
      commit: true,
      armed: false,
      path,
      source,
      ticket_id: ticketId,
      clock_ns: clockNs,
      frame_seq: frameSeq,
      stem: null,
    };
  }

  if (!commit || !stem) return null;
  let verdict: Verdict;
  if (leftover) {
    verdict = Verdict.AGENT_AUTHORED;
    path = "leftover";
  } else if (operator && agent) verdict = Verdict.MIXED;
  else if (operator) verdict = Verdict.HUMAN_AUTHORED;
  else if (agent) verdict = Verdict.AGENT_AUTHORED;
  else verdict = Verdict.UNVERIFIABLE;
  if (Boolean(row.locked_score_delta) && !operator) {
    verdict = Verdict.MIXED;
  }
  return {
    kind,
    verdict,
    commit: true,
    armed,
    path,
    source,
    ticket_id: ticketId,
    clock_ns: clockNs,
    frame_seq: frameSeq,
    stem,
  };
}

function outcome(args: {
  kasCommitment?: string | null;
  kasVerdict?: string | null;
  hidBodiedOnHost: boolean;
  ivcJoined: boolean;
}): OutcomeSurface {
  const kas = s(args.kasCommitment) || null;
  const kv = s(args.kasVerdict) || null;
  let verdict: Verdict;
  if (kas) verdict = Verdict.HUMAN_AUTHORED;
  else if (args.hidBodiedOnHost && args.ivcJoined) verdict = Verdict.HUMAN_AUTHORED;
  else verdict = Verdict.UNVERIFIABLE;
  return {
    verdict,
    agent_actuator: OUTCOME_AGENT,
    kas_commitment: kas,
    kas_verdict: kv,
    hid_bodied_on_host: Boolean(args.hidBodiedOnHost),
    ivc_joined: Boolean(args.ivcJoined),
  };
}

function rollupOf(
  out: OutcomeSurface | null,
  media: MediaSpan[],
): Rollup {
  if (out === null && media.length === 0) return Rollup.UNVERIFIABLE;
  if (out === null || media.length === 0) return Rollup.PARTIAL_SURFACES;
  if (
    out.verdict === Verdict.UNVERIFIABLE &&
    media.every((s) => s.verdict === Verdict.UNVERIFIABLE)
  ) {
    return Rollup.UNVERIFIABLE;
  }
  return Rollup.COMPLETE;
}

export type BuildArgs = {
  sessionId?: string | null;
  sessionDisplay?: string;
  recapPayload?: unknown;
  recapRef?: string | null;
  clockCommitment?: string | null;
  kasCommitment?: string | null;
  kasVerdict?: string | null;
  fusionProofRefs?: string[] | null;
  mediaActuatorLog?: MediaActuatorRow[] | null;
  hidBodiedOnHost?: boolean;
  ivcJoined?: boolean;
  sealed?: boolean;
  signedBy?: string | null;
  producerStatus?: string | null;
  hygieneNote?: string;
};

export async function buildQoract(args: BuildArgs): Promise<QorActRecord> {
  void args.producerStatus;
  const sid = s(args.sessionId) || null;
  const payload =
    args.recapPayload !== null &&
    typeof args.recapPayload === "object" &&
    !Array.isArray(args.recapPayload)
      ? (args.recapPayload as Record<string, unknown>)
      : null;
  let computed =
    payload !== null
      ? await clockCommitment(payload)
      : s(args.clockCommitment) || null;
  const given = s(args.clockCommitment) || null;
  let clockOk = true;
  if (given && computed && given !== computed) {
    computed = given;
    clockOk = false;
  } else if (computed === null) {
    computed = given;
  }

  const signer = s(args.signedBy).toLowerCase();
  const sealedRequested = Boolean(args.sealed);
  const sealedOk = !(
    sealedRequested &&
    (!signer || FORBIDDEN_SIGNERS.has(signer))
  );

  let out: OutcomeSurface;
  let media: MediaSpan[];
  let rollup: Rollup;
  let note = args.hygieneNote ?? "";

  if (sealedRequested && !sid) {
    out = outcome({
      kasCommitment: null,
      kasVerdict: null,
      hidBodiedOnHost: false,
      ivcJoined: false,
    });
    media = [];
    rollup = Rollup.UNVERIFIABLE;
    note = "pre-U1 sealed pack has no session_id";
  } else {
    out = outcome({
      kasCommitment: args.kasCommitment,
      kasVerdict: args.kasVerdict,
      hidBodiedOnHost: Boolean(args.hidBodiedOnHost),
      ivcJoined: Boolean(args.ivcJoined),
    });
    const spans: MediaSpan[] = [];
    for (const row of args.mediaActuatorLog ?? []) {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        const span = classifyMedia(row);
        if (span) spans.push(span);
      }
    }
    media = spans;
    rollup = rollupOf(out, media);
  }

  if (!clockOk) {
    rollup = Rollup.UNVERIFIABLE;
    note = (note + " clock_commitment mismatch").trim();
  }
  if (sealedRequested && !sealedOk) {
    rollup = Rollup.UNVERIFIABLE;
    note = (note + " forbidden or missing gamer signer").trim();
  }

  return {
    schema: SCHEMA,
    live: false,
    sealed: sealedRequested && sealedOk,
    session_id: sid,
    session_display: s(args.sessionDisplay),
    recap_ref: s(args.recapRef) || null,
    clock_commitment: computed,
    outcome: out,
    media,
    fusion_proof_refs: (args.fusionProofRefs ?? [])
      .map((x) => s(x))
      .filter(Boolean),
    rollup,
    hygiene_note: note,
    honesty: {
      outcome_agent_actuator: OUTCOME_AGENT,
      producer_status_ignored: true,
      kinds_v0: ["pixels", "speech"],
      edit_publish_narrative: "undeployed",
      deployed_verified: [],
      emulated: ["build_qoract offline"],
      undeployed: [
        "outcome.agent_actuator",
        "kind=edit",
        "kind=publish",
        "kind=narrative",
        "live Recap issuance",
      ],
    },
  };
}

