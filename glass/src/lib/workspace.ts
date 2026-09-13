import { create } from "zustand";
import {
  FIXTURES,
  issueFromRecap,
  recapDoorHealth,
  recordFromDict,
  recordToDict,
  verifyQoract,
  type FixtureCase,
  type MediaActuatorRow,
  type QorActRecord,
  type VerifyResult,
} from "@/lib/qoract";

export type BindState = {
  kasCommitment: string;
  kasVerdict: string;
  hidBodiedOnHost: boolean;
  ivcJoined: boolean;
  sealed: boolean;
  signedBy: string;
};

type Workspace = {
  recapText: string;
  actuatorText: string;
  bind: BindState;
  fixtureId: string | null;
  record: QorActRecord | null;
  health: Record<string, unknown> | null;
  verify: VerifyResult | null;
  error: string | null;
  issuing: boolean;
  parseRecap: () => unknown;
  parseActuators: () => MediaActuatorRow[] | null;
  setRecapText: (v: string) => void;
  setActuatorText: (v: string) => void;
  setBind: (patch: Partial<BindState>) => void;
  loadFixture: (id: string) => Promise<void>;
  issue: () => Promise<void>;
  loadRecordJson: (text: string) => Promise<void>;
};

const emptyBind: BindState = {
  kasCommitment: "",
  kasVerdict: "",
  hidBodiedOnHost: false,
  ivcJoined: false,
  sealed: false,
  signedBy: "",
};

function pretty(v: unknown): string {
  return JSON.stringify(v, null, 2);
}

export const useWorkspace = create<Workspace>((set, get) => ({
  recapText: pretty(FIXTURES[0]!.recap),
  actuatorText: "",
  bind: { ...emptyBind },
  fixtureId: FIXTURES[0]!.id,
  record: null,
  health: null,
  verify: null,
  error: null,
  issuing: false,
  parseRecap: () => {
    const text = get().recapText.trim();
    if (!text) return null;
    return JSON.parse(text);
  },
  parseActuators: () => {
    const text = get().actuatorText.trim();
    if (!text) return null;
    const raw = JSON.parse(text);
    if (Array.isArray(raw)) {
      return raw.filter((row) => row && typeof row === "object") as MediaActuatorRow[];
    }
    if (raw && typeof raw === "object" && Array.isArray((raw as { spans?: unknown }).spans)) {
      return ((raw as { spans: unknown[] }).spans.filter(
        (row) => row && typeof row === "object",
      ) as MediaActuatorRow[]);
    }
    return null;
  },
  setRecapText: (v) => set({ recapText: v, fixtureId: null }),
  setActuatorText: (v) => set({ actuatorText: v, fixtureId: null }),
  setBind: (patch) => set({ bind: { ...get().bind, ...patch } }),
  loadFixture: async (id) => {
    const fx = FIXTURES.find((f) => f.id === id);
    if (!fx) return;
    set({
      fixtureId: id,
      recapText: pretty(fx.recap),
      actuatorText: fx.actuators ? pretty(fx.actuators) : "",
      bind: {
        kasCommitment: fx.kasCommitment ?? "",
        kasVerdict: fx.kasVerdict ?? "",
        hidBodiedOnHost: Boolean(fx.hidBodiedOnHost),
        ivcJoined: Boolean(fx.ivcJoined),
        sealed: Boolean(fx.sealed),
        signedBy: fx.signedBy ?? "",
      },
      error: null,
    });
    await get().issue();
  },
  issue: async () => {
    set({ issuing: true, error: null });
    try {
      let recap: unknown;
      try {
        recap = get().parseRecap();
      } catch {
        recap = get().recapText;
      }
      let actuators: MediaActuatorRow[] | null = null;
      try {
        actuators = get().parseActuators();
      } catch {
        actuators = null;
      }
      const bind = get().bind;
      const rec = await issueFromRecap(recap, {
        mediaActuatorLog: actuators,
        kasCommitment: bind.kasCommitment || null,
        kasVerdict: bind.kasVerdict || null,
        hidBodiedOnHost: bind.hidBodiedOnHost,
        ivcJoined: bind.ivcJoined,
        sealed: bind.sealed,
        signedBy: bind.signedBy || null,
        sidecarUsed: Boolean(actuators?.length),
      });
      const recapObj =
        recap && typeof recap === "object" && !Array.isArray(recap) ? recap : undefined;
      const verify = await verifyQoract(rec, {
        recapPayload: recapObj,
        expectedKasCommitment: bind.kasCommitment || null,
        signedBy: bind.signedBy || null,
      });
      set({
        record: rec,
        health: recapDoorHealth(rec),
        verify,
        issuing: false,
      });
      try {
        localStorage.setItem("qoract-last-draft", JSON.stringify(recordToDict(rec)));
      } catch {
        /* ignore */
      }
    } catch (err) {
      const rec = await issueFromRecap(null);
      set({
        record: rec,
        health: recapDoorHealth(rec),
        verify: { ok: true, reasons: [] },
        issuing: false,
        error: err instanceof Error ? err.message : "issue failed open",
      });
    }
  },
  loadRecordJson: async (text) => {
    try {
      const rec = recordFromDict(JSON.parse(text));
      if (!rec) {
        set({ error: "record is not an object" });
        return;
      }
      const verify = await verifyQoract(rec, {
        signedBy: get().bind.signedBy || null,
      });
      set({ record: rec, health: recapDoorHealth(rec), verify, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "unreadable record" });
    }
  },
}));

export function fixtureById(id: string): FixtureCase | undefined {
  return FIXTURES.find((f) => f.id === id);
}
