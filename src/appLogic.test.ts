import { describe, expect, it } from "vitest";
import {
  MAX_AUDIO_BYTES,
  archiveRecords,
  constellationEdges,
  constellationNodes,
  createRecorderProcessController,
  findRelationshipPath,
  filterArchiveRecords,
  filterConstellation,
  formatHashRoute,
  formatArchiveDate,
  getPrototypeScenario,
  parseHashRoute,
  resolveCapsuleDetail,
  validateAudioFile,
  type RecorderState,
  type TimeoutScheduler,
} from "./appLogic";

function createScheduler() {
  let nextId = 1;
  const tasks = new Map<number, () => void>();
  const scheduler: TimeoutScheduler = {
    setTimeout(callback) {
      const id = nextId++;
      tasks.set(id, callback);
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeout(handle) {
      tasks.delete(handle as unknown as number);
    },
  };
  return {
    scheduler,
    runNext() {
      const next = tasks.entries().next().value as [number, () => void] | undefined;
      if (!next) return;
      tasks.delete(next[0]);
      next[1]();
    },
    runAll() {
      [...tasks.entries()].forEach(([id, callback]) => {
        tasks.delete(id);
        callback();
      });
    },
  };
}

describe("recorder processing", () => {
  it("does not update state after cancellation", () => {
    const states: RecorderState[] = [];
    const fake = createScheduler();
    const controller = createRecorderProcessController((state) => states.push(state), fake.scheduler);
    controller.start(true);
    controller.cancel();
    fake.runAll();
    expect(states).toEqual(["reading"]);
  });

  it("cancels stale work when a newer attempt begins", () => {
    const states: RecorderState[] = [];
    const fake = createScheduler();
    const controller = createRecorderProcessController((state) => states.push(state), fake.scheduler);
    controller.start(false);
    controller.start(true);
    fake.runAll();
    expect(states).toEqual(["transcribing", "reading", "transcribing", "processing", "recorded"]);
  });

  it.each([
    ["reading", 0],
    ["transcribing", 1],
    ["processing", 2],
  ] as const)("cancels safely during the %s stage and allows a subsequent attempt", (stage, advances) => {
    const states: RecorderState[] = [];
    const fake = createScheduler();
    const controller = createRecorderProcessController((state) => states.push(state), fake.scheduler);
    controller.start(true);
    for (let index = 0; index < advances; index += 1) fake.runNext();
    expect(states.at(-1)).toBe(stage);
    controller.cancel();
    fake.runAll();
    expect(states.at(-1)).toBe(stage);
    controller.start(false);
    fake.runAll();
    expect(states.at(-1)).toBe("recorded");
  });
});

describe("local audio file validation", () => {
  it("accepts supported, nonempty local audio", () => {
    expect(validateAudioFile({ name: "memory.m4a", size: 1024, type: "audio/mp4" }).valid).toBe(true);
  });

  it("rejects empty, oversized, and unsupported files", () => {
    expect(validateAudioFile({ name: "empty.mp3", size: 0, type: "audio/mpeg" }).valid).toBe(false);
    expect(validateAudioFile({ name: "large.wav", size: MAX_AUDIO_BYTES + 1, type: "audio/wav" }).valid).toBe(false);
    expect(validateAudioFile({ name: "notes.txt", size: 100, type: "text/plain" }).valid).toBe(false);
  });
});

describe("capsule navigation", () => {
  it("resolves the selected constellation capsule and handles unknown IDs", () => {
    expect(resolveCapsuleDetail("FF-3155")?.title).toBe("A city without a daily commute");
    expect(resolveCapsuleDetail("FF-UNKNOWN")).toBeUndefined();
  });
});

describe("date presentation", () => {
  it("formats exact, approximate, and range values consistently", () => {
    expect(formatArchiveDate("2025-03-08")).toBe("08 MAR 2025");
    expect(formatArchiveDate("1998-07", true)).toBe("C. JUL 1998");
    expect(formatArchiveDate("1976/2002")).toBe("1976—2002");
  });
});

describe("archive filtering", () => {
  it("filters records by a selected topic", () => {
    const result = filterArchiveRecords(archiveRecords, { query: "", type: "All records", period: "Any period", language: "All languages", topic: "Climate", ascending: true });
    expect(result.map((record) => record.id)).toEqual(["ff-2388"]);
  });

  it("removes the topic filter consistently", () => {
    const result = filterArchiveRecords(archiveRecords, { query: "", type: "All records", period: "Any period", language: "All languages", topic: "All topics", ascending: true });
    expect(result).toHaveLength(archiveRecords.length);
  });

  it("filters the same records by event or recording year", () => {
    const base = { query: "", type: "All records", period: "Any period", language: "All languages", topic: "All topics", ascending: true };
    expect(filterArchiveRecords(archiveRecords, { ...base, timeFilter: { axis: "event", startYear: 2019, endYear: 2019 } }).map((record) => record.id)).toEqual(["ff-2388"]);
    expect(filterArchiveRecords(archiveRecords, { ...base, timeFilter: { axis: "recording", startYear: 2025, endYear: 2025 } })).toHaveLength(2);
  });

  it("includes records whose approximate event range intersects the active window", () => {
    const rangeRecord = constellationNodes.find((node) => node.id === "FF-3207")!;
    const result = filterConstellation([rangeRecord], [], { query: "", dateRange: "All dates", capsuleType: "All types", topic: "All topics", relationshipType: "All relationships", timeFilter: { axis: "event", startYear: 2002, endYear: 2002 } });
    expect(result.nodes.map((node) => node.id)).toEqual(["FF-3207"]);
  });
});

describe("constellation filtering and states", () => {
  it("removes unrelated isolated nodes for a relationship filter", () => {
    const result = filterConstellation(constellationNodes, constellationEdges, { query: "number six", dateRange: "All dates", capsuleType: "All types", topic: "All topics", relationshipType: "Documented reference" });
    expect(result.edges).toHaveLength(0);
    expect(result.nodes).toHaveLength(0);
  });

  it("supports explicit empty and error prototype scenarios", () => {
    expect(getPrototypeScenario("?archive=empty", "archive")).toBe("empty");
    expect(getPrototypeScenario("?constellation=error", "constellation")).toBe("error");
    expect(getPrototypeScenario("", "archive")).toBeNull();
  });

  it("filters graph nodes with the shared time window", () => {
    const result = filterConstellation(constellationNodes, constellationEdges, { query: "", dateRange: "All dates", capsuleType: "All types", topic: "All topics", relationshipType: "All relationships", timeFilter: { axis: "event", startYear: 2024, endYear: 2024 } });
    expect(result.nodes.map((node) => node.id)).toEqual(["FF-3121"]);
  });

  it("finds an explainable relationship path and reports disconnected capsules", () => {
    expect(findRelationshipPath("FF-3001", "FF-3207", constellationEdges)).toEqual({ nodeIds: ["FF-3001", "FF-3042", "FF-3207"], edgeIds: ["E-02", "E-04"] });
    expect(findRelationshipPath("FF-3001", "FF-UNKNOWN", constellationEdges)).toBeNull();
  });
});

describe("frontend routes", () => {
  it("parses direct routes and formats capsule-specific URLs", () => {
    expect(parseHashRoute("#/constellation")).toEqual({ page: "constellation" });
    expect(parseHashRoute("#/capsule/FF-3155")).toEqual({ page: "detail", capsuleId: "FF-3155" });
    expect(parseHashRoute("#/capsule")).toEqual({ page: "archive" });
    expect(formatHashRoute({ page: "detail", capsuleId: "FF-3155" })).toBe("#/capsule/FF-3155");
  });
});
