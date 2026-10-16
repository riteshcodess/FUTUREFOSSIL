export type RecorderState = "idle" | "recording" | "paused" | "recorded" | "reading" | "transcribing" | "processing" | "error";

export type ArchiveRecord = {
  id: string;
  eventDate: string;
  eventDateApproximate: boolean;
  eventDateNote: string;
  recordingDate: string;
  publicationDate: string;
  title: string;
  description: string;
  topics: string[];
  duration: string;
  type: "MEMORY" | "WITNESS" | "PREDICTION";
  language: string;
};

export type ConstellationNode = {
  id: string;
  x: number;
  y: number;
  type: "Memory" | "Witnessed event" | "Prediction";
  title: string;
  eventDate: string;
  eventDateApproximate: boolean;
  eventDateNote: string;
  recordingDate: string;
  publicationDate: string;
  topics: string[];
  excerpt: string;
  duration: string;
};

export type ConstellationEdge = {
  id: string;
  source: string;
  target: string;
  type: "Documented reference" | "Shared metadata" | "Inferred similarity";
  evidence: string;
};

export const archiveRecords: ArchiveRecord[] = [
  { id: "ff-2041", eventDate: "1986-05-14", eventDateApproximate: false, eventDateNote: "Speaker stated · exact", recordingDate: "2024-10-03", publicationDate: "2024-10-05", title: "The night the reactor news reached our kitchen", description: "A family remembers hearing the first radio reports from Chernobyl, and the silence that followed at school.", topics: ["Chernobyl", "Childhood", "Radio"], duration: "08:42", type: "MEMORY", language: "English" },
  { id: "ff-2388", eventDate: "2019-09", eventDateApproximate: true, eventDateNote: "AI inferred · approximate", recordingDate: "2025-01-18", publicationDate: "2025-01-20", title: "Before the glacier became a lake", description: "A field guide describes returning to the same Alpine marker over three decades.", topics: ["Climate", "Landscape", "Work"], duration: "12:16", type: "WITNESS", language: "German" },
  { id: "ff-2412", eventDate: "2040", eventDateApproximate: true, eventDateNote: "Speaker prediction · approximate", recordingDate: "2025-02-04", publicationDate: "2025-02-07", title: "A prediction about the last daily commute", description: "An urban planner imagines how shared streets may change work, distance, and belonging.", topics: ["Cities", "Prediction", "Mobility"], duration: "06:03", type: "PREDICTION", language: "English" },
];

export const constellationNodes: ConstellationNode[] = [
  { id: "FF-3001", x: 170, y: 180, type: "Memory", title: "The summer the river changed course", eventDate: "1998-07", eventDateApproximate: true, eventDateNote: "Speaker recalled · approximate", recordingDate: "2025-03-08", publicationDate: "2025-03-11", topics: ["Landscape", "Weather"], excerpt: "We woke after the storm and found the river had cut a new path beyond the eastern field.", duration: "04:26" },
  { id: "FF-3018", x: 350, y: 105, type: "Witnessed event", title: "Surveying the eastern bank", eventDate: "1998-07-21", eventDateApproximate: false, eventDateNote: "Speaker stated · exact", recordingDate: "2025-03-12", publicationDate: "2025-03-15", topics: ["Landscape", "Work"], excerpt: "The survey notebook names the same eastern field and records the changed waterline.", duration: "07:14" },
  { id: "FF-3042", x: 310, y: 310, type: "Memory", title: "What the orchard sounded like after rain", eventDate: "1999", eventDateApproximate: true, eventDateNote: "AI inferred · approximate", recordingDate: "2025-03-19", publicationDate: "2025-03-22", topics: ["Weather", "Childhood"], excerpt: "For weeks, water moved through places that had always been dry.", duration: "05:09" },
  { id: "FF-3090", x: 545, y: 225, type: "Prediction", title: "When flood maps become family documents", eventDate: "2040", eventDateApproximate: true, eventDateNote: "Speaker prediction · approximate", recordingDate: "2025-04-02", publicationDate: "2025-04-05", topics: ["Landscape", "Prediction"], excerpt: "I think families will inherit adaptation maps alongside deeds and photographs.", duration: "06:31" },
  { id: "FF-3121", x: 685, y: 120, type: "Witnessed event", title: "The final route of the number six bus", eventDate: "2024-11-03", eventDateApproximate: false, eventDateNote: "Speaker stated · exact", recordingDate: "2025-04-15", publicationDate: "2025-04-18", topics: ["Cities", "Mobility"], excerpt: "The driver named every stop before the old route closed for the last time.", duration: "09:02" },
  { id: "FF-3155", x: 820, y: 260, type: "Prediction", title: "A city without a daily commute", eventDate: "2040", eventDateApproximate: true, eventDateNote: "Speaker prediction · approximate", recordingDate: "2025-04-20", publicationDate: "2025-04-23", topics: ["Cities", "Mobility"], excerpt: "Shared streets may change the distance between work and belonging.", duration: "06:03" },
  { id: "FF-3184", x: 650, y: 405, type: "Memory", title: "Letters sent from the overnight train", eventDate: "1984", eventDateApproximate: true, eventDateNote: "Speaker recalled · approximate", recordingDate: "2025-05-03", publicationDate: "2025-05-06", topics: ["Mobility", "Family"], excerpt: "Each letter began with the station where morning found us.", duration: "08:18" },
  { id: "FF-3207", x: 430, y: 485, type: "Memory", title: "Keeping the weather notebooks", eventDate: "1976/2002", eventDateApproximate: false, eventDateNote: "Speaker-stated range", recordingDate: "2025-05-09", publicationDate: "2025-05-12", topics: ["Weather", "Family"], excerpt: "My mother wrote the rainfall in the margin of every kitchen calendar.", duration: "10:47" },
];

export const constellationEdges: ConstellationEdge[] = [
  { id: "E-01", source: "FF-3001", target: "FF-3018", type: "Documented reference", evidence: "FF-3018 explicitly names the river account and its eastern-field location at 02:14." },
  { id: "E-02", source: "FF-3001", target: "FF-3042", type: "Shared metadata", evidence: "Both capsules are tagged Weather and describe the same locally named river corridor." },
  { id: "E-03", source: "FF-3001", target: "FF-3090", type: "Inferred similarity", evidence: "Transcript similarity: family records used to understand changing flood boundaries. This link is machine-inferred." },
  { id: "E-04", source: "FF-3042", target: "FF-3207", type: "Documented reference", evidence: "The speaker in FF-3042 identifies the weather notebooks preserved in FF-3207." },
  { id: "E-05", source: "FF-3018", target: "FF-3090", type: "Shared metadata", evidence: "Shared topics: Landscape and adaptation records. No direct reference is claimed." },
  { id: "E-06", source: "FF-3121", target: "FF-3155", type: "Shared metadata", evidence: "Shared topics: Cities and Mobility; both discuss changing commute patterns." },
  { id: "E-07", source: "FF-3155", target: "FF-3184", type: "Inferred similarity", evidence: "Transcript similarity around distance, routine travel, and belonging. This link is machine-inferred." },
  { id: "E-08", source: "FF-3184", target: "FF-3207", type: "Documented reference", evidence: "FF-3184 explicitly mentions the family weather notebooks archived in FF-3207." },
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function formatArchiveDate(value: string, approximate = false) {
  if (value.includes("/")) return value.split("/").join("—");
  const [year, month, day] = value.split("-");
  const prefix = approximate ? "C. " : "";
  if (!month) return `${prefix}${year}`;
  const monthLabel = MONTHS[Number(month) - 1];
  if (!day) return `${prefix}${monthLabel} ${year}`;
  return `${prefix}${day.padStart(2, "0")} ${monthLabel} ${year}`;
}

export function eventYear(value: string) {
  return Number(value.slice(0, 4));
}

export function dateYearRange(value: string) {
  if (!value.includes("/")) {
    const year = eventYear(value);
    return { startYear: year, endYear: year };
  }
  const [start, end] = value.split("/").map(Number);
  return { startYear: start, endYear: end };
}

export type TimeFilter = {
  axis: "event" | "recording";
  startYear: number;
  endYear: number;
};

export const DEFAULT_TIME_FILTER: TimeFilter = { axis: "event", startYear: 1976, endYear: 2040 };

function dateForAxis(record: { eventDate: string; recordingDate: string }, axis: TimeFilter["axis"]) {
  return axis === "event" ? record.eventDate : record.recordingDate;
}

export function matchesTimeFilter(record: { eventDate: string; recordingDate: string }, filter?: TimeFilter) {
  if (!filter) return true;
  const range = dateYearRange(dateForAxis(record, filter.axis));
  return range.endYear >= filter.startYear && range.startYear <= filter.endYear;
}

export type ArchiveFilters = { query: string; type: string; period: string; language: string; topic: string; ascending: boolean; timeFilter?: TimeFilter };

export function filterArchiveRecords(records: ArchiveRecord[], filters: ArchiveFilters) {
  return records.filter((record) => {
    const year = eventYear(record.eventDate);
    const matchesType = filters.type === "All records" || record.type === filters.type.toUpperCase();
    const matchesLanguage = filters.language === "All languages" || record.language === filters.language;
    const matchesTopic = filters.topic === "All topics" || record.topics.includes(filters.topic);
    const matchesPeriod = filters.period === "Any period" || (filters.period === "Before 2000" && year < 2000) || (filters.period === "2000—2020" && year >= 2000 && year <= 2020) || (filters.period === "Since 2020" && year > 2020);
    const searchable = `${record.title} ${record.description} ${record.topics.join(" ")} ${formatArchiveDate(record.eventDate, record.eventDateApproximate)}`.toLowerCase();
    return matchesType && matchesLanguage && matchesTopic && matchesPeriod && matchesTimeFilter(record, filters.timeFilter) && searchable.includes(filters.query.toLowerCase());
  }).sort((a, b) => filters.ascending ? eventYear(a.eventDate) - eventYear(b.eventDate) : eventYear(b.eventDate) - eventYear(a.eventDate));
}

export type GraphFilters = { query: string; dateRange: string; capsuleType: string; topic: string; relationshipType: string; timeFilter?: TimeFilter };

export function filterConstellation(nodes: ConstellationNode[], edges: ConstellationEdge[], filters: GraphFilters) {
  const matchedNodes = nodes.filter((node) => {
    const year = eventYear(node.eventDate);
    const searchable = `${node.id} ${node.title} ${node.topics.join(" ")}`.toLowerCase();
    const matchesDate = filters.dateRange === "All dates" || (filters.dateRange === "Before 2000" && year < 2000) || (filters.dateRange === "2000—2025" && year >= 2000 && year <= 2025) || (filters.dateRange === "Future / predicted" && year > 2025);
    return searchable.includes(filters.query.toLowerCase()) && matchesDate && matchesTimeFilter(node, filters.timeFilter) && (filters.capsuleType === "All types" || node.type === filters.capsuleType) && (filters.topic === "All topics" || node.topics.includes(filters.topic));
  });
  const matchedIds = new Set(matchedNodes.map((node) => node.id));
  const visibleEdges = edges.filter((edge) => matchedIds.has(edge.source) && matchedIds.has(edge.target) && (filters.relationshipType === "All relationships" || edge.type === filters.relationshipType));
  if (filters.relationshipType === "All relationships") return { nodes: matchedNodes, edges: visibleEdges };
  const connectedIds = new Set(visibleEdges.flatMap((edge) => [edge.source, edge.target]));
  return { nodes: matchedNodes.filter((node) => connectedIds.has(node.id)), edges: visibleEdges };
}

export type RelationshipPath = { nodeIds: string[]; edgeIds: string[] };

export function findRelationshipPath(startId: string, endId: string, edges: ConstellationEdge[]): RelationshipPath | null {
  if (startId === endId) return { nodeIds: [startId], edgeIds: [] };
  const queue: Array<{ nodeIds: string[]; edgeIds: string[] }> = [{ nodeIds: [startId], edgeIds: [] }];
  const visited = new Set([startId]);
  while (queue.length) {
    const current = queue.shift()!;
    const nodeId = current.nodeIds[current.nodeIds.length - 1];
    for (const edge of edges) {
      const neighbor = edge.source === nodeId ? edge.target : edge.target === nodeId ? edge.source : null;
      if (!neighbor || visited.has(neighbor)) continue;
      const next = { nodeIds: [...current.nodeIds, neighbor], edgeIds: [...current.edgeIds, edge.id] };
      if (neighbor === endId) return next;
      visited.add(neighbor);
      queue.push(next);
    }
  }
  return null;
}

export type CapsuleDetail = {
  id: string;
  type: string;
  title: string;
  description: string;
  eventDate: string;
  eventDateApproximate: boolean;
  eventDateNote: string;
  recordingDate: string;
  publicationDate: string;
  topics: string[];
  duration: string;
};

export function resolveCapsuleDetail(id: string, records = archiveRecords, nodes = constellationNodes): CapsuleDetail | undefined {
  const archive = records.find((record) => record.id.toLowerCase() === id.toLowerCase());
  if (archive) return { ...archive, id: archive.id.toUpperCase(), type: archive.type === "WITNESS" ? "WITNESSED EVENT" : archive.type };
  const node = nodes.find((record) => record.id.toLowerCase() === id.toLowerCase());
  if (!node) return undefined;
  return { id: node.id, type: node.type.toUpperCase(), title: node.title, description: node.excerpt, eventDate: node.eventDate, eventDateApproximate: node.eventDateApproximate, eventDateNote: node.eventDateNote, recordingDate: node.recordingDate, publicationDate: node.publicationDate, topics: node.topics, duration: node.duration };
}

export const MAX_AUDIO_BYTES = 250 * 1024 * 1024;
const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a"];

export function validateAudioFile(file: Pick<File, "name" | "size" | "type">) {
  if (file.size <= 0) return { valid: false, error: "The selected file is empty." } as const;
  if (file.size > MAX_AUDIO_BYTES) return { valid: false, error: "The selected file is larger than 250 MB." } as const;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!AUDIO_TYPES.includes(file.type.toLowerCase()) && !AUDIO_EXTENSIONS.includes(extension)) return { valid: false, error: "Choose an MP3, WAV, or M4A audio file." } as const;
  return { valid: true, error: null } as const;
}

export type TimeoutScheduler = {
  setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout>;
  clearTimeout(handle: ReturnType<typeof setTimeout>): void;
};

export function createRecorderProcessController(onState: (state: RecorderState) => void, scheduler: TimeoutScheduler = globalThis) {
  let generation = 0;
  let handles: ReturnType<typeof setTimeout>[] = [];
  const cancel = () => {
    generation += 1;
    handles.forEach((handle) => scheduler.clearTimeout(handle));
    handles = [];
  };
  const start = (fromFile: boolean) => {
    cancel();
    const currentGeneration = generation;
    onState(fromFile ? "reading" : "transcribing");
    const schedule = (state: RecorderState, delay: number) => {
      handles.push(scheduler.setTimeout(() => {
        if (generation === currentGeneration) onState(state);
      }, delay));
    };
    schedule(fromFile ? "transcribing" : "processing", 650);
    schedule("processing", 1300);
    schedule("recorded", 2000);
  };
  return { start, cancel };
}

export function getPrototypeScenario(search: string, key: "archive" | "constellation") {
  if (!search) return null;
  const value = new URLSearchParams(search).get(key);
  return value === "empty" || value === "error" ? value : null;
}

export type AppPage = "home" | "archive" | "timeline" | "constellation" | "create" | "review" | "detail";
export type AppRoute = { page: AppPage; capsuleId?: string };

export function parseHashRoute(hash: string): AppRoute {
  const path = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (path[0] === "capsule") return path[1] ? { page: "detail", capsuleId: decodeURIComponent(path[1]) } : { page: "archive" };
  if (["archive", "timeline", "constellation", "create", "review"].includes(path[0])) return { page: path[0] as AppPage };
  return { page: "home" };
}

export function formatHashRoute(route: AppRoute) {
  if (route.page === "home") return "#/";
  if (route.page === "detail") return `#/capsule/${encodeURIComponent(route.capsuleId ?? "")}`;
  return `#/${route.page}`;
}
