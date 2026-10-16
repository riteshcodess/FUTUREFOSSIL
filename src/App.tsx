import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type PointerEvent } from "react";
import {
  archiveRecords,
  constellationEdges,
  constellationNodes,
  createRecorderProcessController,
  DEFAULT_TIME_FILTER,
  eventYear,
  findRelationshipPath,
  filterArchiveRecords,
  filterConstellation,
  formatHashRoute,
  formatArchiveDate,
  getPrototypeScenario,
  parseHashRoute,
  resolveCapsuleDetail,
  validateAudioFile,
  type ConstellationEdge,
  type ConstellationNode,
  type RelationshipPath,
  type RecorderState,
  type TimeFilter,
  type AppPage,
} from "./appLogic";

type Page = AppPage;
type IconName = "arrow" | "audio" | "calendar" | "check" | "close" | "filter" | "info" | "pause" | "play" | "record" | "search" | "shield" | "upload";
const NoticeContext = createContext<(message: string) => void>(() => undefined);
const useNotice = () => useContext(NoticeContext);

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    audio: <><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    pause: <><path d="M9 7v10M15 7v10" /></>,
    play: <path d="m9 7 8 5-8 5Z" />,
    record: <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.7 2.8 8.2 7 10 4.2-1.8 7-5.3 7-10V6Z" /><path d="m9 12 2 2 4-4" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 15v5h14v-5" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button className={`button ${variant} ${className}`} {...props}>{children}</button>;
}

function Wordmark({ go }: { go: (page: Page) => void }) {
  return <button className="wordmark" onClick={() => go("home")} aria-label="Future Fossil home"><span className="mark">F</span><span>FUTURE FOSSIL</span></button>;
}

function Header({ page, go }: { page: Page; go: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const notify = useNotice();
  const showMethod = () => {
    if (page !== "home") go("home");
    window.setTimeout(() => document.getElementById("proof")?.scrollIntoView({ behavior: "smooth" }), 50);
    setOpen(false);
  };
  return (
    <header className="header">
      <Wordmark go={go} />
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu"><span /><span /></button>
      <nav className={open ? "nav open" : "nav"} aria-label="Main navigation">
        <button className={page === "archive" || page === "timeline" ? "active" : ""} onClick={() => { go("archive"); setOpen(false); }}>Archive</button>
        <button className={page === "constellation" ? "active" : ""} onClick={() => { go("constellation"); setOpen(false); }}>Constellation</button>
        <button onClick={showMethod}>Method</button>
        <button onClick={() => notify("Archive guidelines: submit first-hand, lawful material and respect the privacy of others.")}>Guidelines</button>
        <Button variant="secondary" onClick={() => go("create")}>Preserve a memory</Button>
      </nav>
    </header>
  );
}

function Waveform({ active = false }: { active?: boolean }) {
  const bars = [22, 38, 58, 31, 70, 48, 82, 43, 63, 29, 76, 54, 35, 68, 45, 80, 40, 59, 27, 48, 66, 38, 74, 50, 30, 61, 42, 72, 36, 55, 24, 46];
  return <div className={`waveform ${active ? "active" : ""}`} aria-hidden="true">{bars.map((height, i) => <i key={i} style={{ height: `${height}%`, animationDelay: `${(i % 7) * 80}ms` }} />)}</div>;
}

function AudioControl({ duration = "08:42", compact = false, position, sample = false }: { duration?: string; compact?: boolean; position?: string; sample?: boolean }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className={`audio-player ${compact ? "compact" : ""}`}>
      <button className="play-button" onClick={() => setPlaying(!playing)} aria-label={sample ? (playing ? "Pause sample playback visualization" : "Animate sample playback visualization") : (playing ? "Pause audio" : "Play audio")}><Icon name={playing ? "pause" : "play"} /></button>
      <div className="audio-track"><Waveform active={playing} /><span className={playing ? "audio-progress playing" : "audio-progress"} /></div>
      <span className="mono">{position ?? (playing ? "00:17" : duration)}{sample && <small> SAMPLE PREVIEW</small>}</span>
    </div>
  );
}

function DateSummary({ record, compact = false }: { record: typeof archiveRecords[number]; compact?: boolean }) {
  return (
    <div className={`date-summary ${compact ? "compact" : ""}`}>
      <div><span>EVENT DATE</span><strong>{formatArchiveDate(record.eventDate, record.eventDateApproximate)}</strong><small>{record.eventDateNote}</small></div>
      <div><span>RECORDING DATE</span><strong>{formatArchiveDate(record.recordingDate)}</strong><small>Illustrative timestamp</small></div>
      <div><span>PUBLICATION DATE</span><strong>{formatArchiveDate(record.publicationDate)}</strong><small>Illustrative archive release</small></div>
    </div>
  );
}

function CapsuleCard({ record, openDetail, onTopic }: { record: typeof archiveRecords[number]; openDetail: (id: string) => void; onTopic: (topic: string) => void }) {
  return (
    <article className="capsule-card">
      <div className="capsule-index mono">{record.id.toUpperCase()}</div>
      <div className="capsule-main">
        <div className="eyebrow"><span>{record.type}</span><span>EVENT DATE · {formatArchiveDate(record.eventDate, record.eventDateApproximate)}</span></div>
        <h3>{record.title}</h3>
        <p>{record.description}</p>
        <DateSummary record={record} compact />
        <div className="tags">{record.topics.map((topic) => <button key={topic} onClick={() => onTopic(topic)}>{topic}</button>)}</div>
        <AudioControl duration={record.duration} compact sample />
      </div>
      <button className="card-arrow" onClick={() => openDetail(record.id)} aria-label={`Open ${record.title}`}><Icon name="arrow" size={24} /></button>
    </article>
  );
}

function Home({ go, openDetail, filterTopic }: { go: (page: Page) => void; openDetail: (id: string) => void; filterTopic: (topic: string) => void }) {
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="kicker">A PUBLIC VOICE ARCHIVE · EST. 2025</p>
              <h1>Humanity leaves traces.<br /><em>We preserve them.</em></h1>
              <p className="lede">Future Fossil is a living archive of spoken memories, witnessed events, and predictions—preserved in the voices of the people who carry them.</p>
              <div className="hero-actions">
                <Button onClick={() => go("archive")}>Explore the archive <Icon name="arrow" /></Button>
                <Button variant="ghost" onClick={() => go("create")}>Preserve a memory</Button>
              </div>
            </div>
            <aside className="hero-art !min-h-[420px] py-0 lg:-translate-x-[4.5vw] max-lg:!min-h-[340px] max-sm:!min-h-[300px]" aria-label="Archive transmission visualization showing an indexed voice record">
              <div className="orbital group !w-[450px] max-lg:!w-[350px] max-sm:!w-[290px]">
                <div className="orbit orbit-a" />
                <div className="orbit orbit-b" />
                <div className="orbit inset-[31%] border-dashed opacity-50" />
                <div className="absolute inset-[11%] animate-[spin_28s_linear_infinite] rounded-full border border-dashed border-[var(--line)] opacity-60" aria-hidden="true">
                  <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--amber)] bg-[var(--ink)] shadow-[0_0_14px_var(--amber)]" />
                  <span className="absolute bottom-[12%] right-[7%] h-1.5 w-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_12px_var(--cyan)]" />
                </div>
                <div className="absolute inset-[23%] rounded-full border border-[var(--amber)] opacity-20 animate-pulse" aria-hidden="true" />
                <div className="signal-core relative z-10">
                  <span>VOICE<br />RECORD</span>
                  <strong>001101</strong>
                  <i className="mx-auto mt-2 block h-px w-8 bg-[var(--amber)] opacity-70" />
                  <small className="mt-1 block font-mono text-[7px] tracking-[0.18em] text-[var(--cyan)]">SAMPLE SIGNAL</small>
                </div>
                <div className="datum d1">40°42′46″ N</div>
                <div className="datum d2">RECORDING DATE · 04 FEB 2025</div>
                <div className="absolute -left-2 bottom-[19%] hidden items-center gap-2 font-mono text-[8px] tracking-[0.14em] text-[var(--faint)] sm:flex">
                  <span className="h-px w-7 bg-[var(--line)]" />AUDIO / 48 KHZ
                </div>
                <div className="absolute -right-3 top-[18%] hidden items-center gap-2 font-mono text-[8px] tracking-[0.14em] text-[var(--faint)] sm:flex">
                  HASH / SAMPLE<span className="h-px w-7 bg-[var(--line)]" />
                </div>
                <div className="absolute bottom-[4%] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap border border-[var(--line)] bg-[var(--ink)] px-3 py-2 font-mono text-[8px] tracking-[0.14em] text-[var(--muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_8px_var(--cyan)]" />
                  PUBLIC INDEX · CAPSULE 2041
                </div>
                <div className="absolute -bottom-16 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2" aria-hidden="true">
                  <div className="relative flex h-12 w-80 items-center gap-0.5 border-x border-[var(--line)] px-3 max-sm:w-64">
                    <span className="absolute left-3 right-3 top-1/2 h-px bg-[var(--line)]" />
                    {[4, 6, 5, 8, 12, 7, 16, 11, 22, 15, 28, 18, 12, 25, 32, 20, 36, 24, 18, 30, 42, 26, 38, 22, 16, 29, 44, 34, 48, 30, 20, 37, 42, 24, 32, 18, 28, 40, 22, 35, 16, 26, 19, 31, 14, 22, 10, 18, 8, 13, 7, 10, 5, 7, 4, 5].map((height, index) => (
                      <span key={index} className="relative min-w-px flex-1 rounded-full bg-[var(--amber)] opacity-85 animate-[pulse_.9s_ease-in-out_infinite_alternate]" style={{ height, animationDelay: `${(index % 11) * 55}ms` }} />
                    ))}
                  </div>
                  <span className="font-mono text-[7px] tracking-[0.22em] text-[var(--cyan)]">VOICE SIGNAL / ACTIVE</span>
                </div>
              </div>
            </aside>
          </div>
          <div className="scroll-note"><span>SCROLL THROUGH TIME</span><span className="line" /></div>
        </section>

        <section className="timeline-preview">
          <div className="section-heading">
            <div><p className="kicker">CHRONOLOGICAL INDEX</p><h2>Every voice,<br /><em>placed in time.</em></h2></div>
            <p>Explore accounts by when they happened—not simply when they were recorded. Each date remains traceable to the speaker's own words.</p>
          </div>
          <div className="timeline">
            {["1948", "1969", "1986", "2001", "2025", "2040"].map((year, i) => (
              <button key={year} className={`timeline-node ${i === 2 ? "featured" : ""}`} onClick={() => go("archive")}>
                <span className="dot" /><span>{year}</span>{i === 2 && <b>7 capsules</b>}
              </button>
            ))}
          </div>
          <CapsuleCard record={archiveRecords[0]} openDetail={openDetail} onTopic={filterTopic} />
        </section>

        <section className="proof" id="proof">
          <div className="proof-number">01</div>
          <div className="proof-title"><p className="kicker cyan">ARCHIVAL INTEGRITY</p><h2>Proof of Time,<br />not proof of truth.</h2></div>
          <div className="proof-copy">
            <p>The production archive is designed to issue a tamper-evident receipt linking published audio and metadata to a publication moment.</p>
            <p className="muted">This frontend demonstrates the receipt structure only; it performs no cryptographic verification. A real receipt would not prove that a speaker's claims are factually true.</p>
            <button onClick={() => openDetail("ff-2041")}>How verification works <Icon name="arrow" /></button>
          </div>
        </section>

        <section className="featured">
          <div className="section-heading small">
            <div><p className="kicker">FROM THE ARCHIVE</p><h2>Recently preserved</h2></div>
            <Button variant="ghost" onClick={() => go("archive")}>View all capsules <Icon name="arrow" /></Button>
          </div>
          <div className="featured-grid">{archiveRecords.slice(1).map((record) => <CapsuleCard key={record.id} record={record} openDetail={openDetail} onTopic={filterTopic} />)}</div>
        </section>
      </main>
      <Footer go={go} openDetail={openDetail} />
    </>
  );
}

function TimeTravelExplorer({ value, onChange }: { value: TimeFilter; onChange: (value: TimeFilter) => void }) {
  const bounds = value.axis === "event" ? { min: 1976, max: 2040 } : { min: 2024, max: 2025 };
  const updateAxis = (axis: TimeFilter["axis"]) => onChange(axis === "event" ? { ...DEFAULT_TIME_FILTER } : { axis, startYear: 2024, endYear: 2025 });
  const reset = () => onChange(value.axis === "event" ? { ...DEFAULT_TIME_FILTER } : { axis: "recording", startYear: 2024, endYear: 2025 });
  const isFullRange = value.startYear === bounds.min && value.endYear === bounds.max;
  return (
    <section className="time-explorer" aria-label="Time Travel Explorer">
      <div className="time-explorer-title"><span>TIME TRAVEL EXPLORER</span><strong>{value.startYear}—{value.endYear}</strong><small>{value.axis === "event" ? "Filtering by event date · approximate dates use their stated range" : "Filtering by the sample recording-date field"}</small></div>
      <label><span>DATE BASIS</span><select value={value.axis} onChange={(event) => updateAxis(event.target.value as TimeFilter["axis"])}><option value="event">Event date</option><option value="recording">Recording date</option></select></label>
      <div className="time-range">
        <label><span>FROM {value.startYear}</span><input type="range" min={bounds.min} max={bounds.max} value={value.startYear} onChange={(event) => onChange({ ...value, startYear: Math.min(Number(event.target.value), value.endYear) })} /></label>
        <label><span>TO {value.endYear}</span><input type="range" min={bounds.min} max={bounds.max} value={value.endYear} onChange={(event) => onChange({ ...value, endYear: Math.max(Number(event.target.value), value.startYear) })} /></label>
      </div>
      <button disabled={isFullRange} onClick={reset}>Reset window</button>
    </section>
  );
}

function Archive({ initialView = "list", initialTopic = "All topics", openDetail, timeFilter, setTimeFilter, go }: { initialView?: "list" | "timeline"; initialTopic?: string; openDetail: (id: string) => void; timeFilter: TimeFilter; setTimeFilter: (value: TimeFilter) => void; go: (page: Page) => void }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All records");
  const [period, setPeriod] = useState("Any period");
  const [language, setLanguage] = useState("All languages");
  const [topic, setTopic] = useState(initialTopic);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<"list" | "timeline">(initialView);
  const [ascending, setAscending] = useState(true);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<number | null>(null);
  const scenario = import.meta.env.DEV ? getPrototypeScenario(typeof window === "undefined" ? "" : window.location.search, "archive") : null;
  const sourceRecords = scenario === "empty" ? [] : archiveRecords;
  const topics = Array.from(new Set(archiveRecords.flatMap((record) => record.topics))).sort();
  const timeIsActive = timeFilter.axis !== DEFAULT_TIME_FILTER.axis || timeFilter.startYear !== DEFAULT_TIME_FILTER.startYear || timeFilter.endYear !== DEFAULT_TIME_FILTER.endYear;
  const activeFilters = [type !== "All records", period !== "Any period", language !== "All languages", topic !== "All topics", timeIsActive].filter(Boolean).length;
  const filtered = useMemo(() => filterArchiveRecords(sourceRecords, { query, type, period, language, topic, ascending, timeFilter }), [sourceRecords, query, type, period, language, topic, ascending, timeFilter]);
  const clearFilters = () => { setType("All records"); setPeriod("Any period"); setLanguage("All languages"); setTopic("All topics"); setQuery(""); setTimeFilter({ ...DEFAULT_TIME_FILTER }); };
  useEffect(() => () => { if (searchTimer.current) window.clearTimeout(searchTimer.current); }, []);
  useEffect(() => setView(initialView), [initialView]);
  const runSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => setLoading(false), 550);
  };
  return (
    <main className="archive-page">
      <section className="archive-intro">
        <p className="kicker">PUBLIC INDEX / 001—∞</p>
        <div><h1 className="whitespace-nowrap">Explore the <em>human record.</em></h1><p>Search first-hand memories, witnessed events, ideas, and predictions. Dates are shown by their relationship to each record.</p></div>
      </section>
      <form className="search-bar" onSubmit={runSearch}>
        <Icon name="search" size={22} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a subject, event, date, or prediction" aria-label="Search archive" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" /></button>}
        <Button type="submit">Search archive</Button>
      </form>
      <TimeTravelExplorer value={timeFilter} onChange={setTimeFilter} />
      <div className="archive-tools">
        <button className="filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><Icon name="filter" /> Filters {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}</button>
        <div className="view-toggle"><span>VIEW</span><button aria-pressed={view === "list"} className={view === "list" ? "selected" : ""} onClick={() => view !== "list" && go("archive")}>List</button><button aria-pressed={view === "timeline"} className={view === "timeline" ? "selected" : ""} onClick={() => view !== "timeline" && go("timeline")}>Timeline</button></div>
      </div>
      <div className="archive-layout">
        {filtersOpen && <aside className="filters">
          <div className="filter-panel-head"><strong>FILTER THE ARCHIVE</strong><button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><Icon name="close" /></button></div>
          <FilterGroup label="Capsule type" options={["All records", "Memory", "Witness", "Prediction"]} active={type} setActive={setType} />
          <FilterGroup label="Event period" options={["Any period", "Before 2000", "2000—2020", "Since 2020"]} active={period} setActive={setPeriod} />
          <FilterGroup label="Language" options={["All languages", "English", "German", "Spanish"]} active={language} setActive={setLanguage} />
          <FilterGroup label="Topic" options={["All topics", ...topics]} active={topic} setActive={setTopic} />
          <button className="clear-filter" onClick={clearFilters}>Clear all filters</button>
        </aside>}
        <section className="results">
          <div className="results-header"><p><strong>{filtered.length.toString().padStart(2, "0")}</strong> records located</p><button onClick={() => setAscending(!ascending)}>Sort: Event date <span>{ascending ? "↓" : "↑"}</span></button></div>
          {scenario === "error" ? <div className="empty-state error"><div className="empty-mark"><Icon name="info" size={30} /></div><h2>Archive index unavailable</h2><p>The prototype could not read the public index. No records were changed.</p><Button variant="secondary" onClick={() => window.location.assign(window.location.pathname)}>Clear test scenario</Button></div> :
          sourceRecords.length === 0 ? <div className="empty-state"><div className="empty-mark"><Icon name="audio" size={30} /></div><h2>The public archive is empty</h2><p>No reviewed capsules have been published yet. Temporary drafts never appear in this index.</p></div> :
          loading ? <div className="loading-state" aria-live="polite"><span /><span /><span /><p>Searching the public index…</p></div> :
            <div className={view === "timeline" ? "timeline-results" : ""}>
              {filtered.length ? filtered.map((record) => <CapsuleCard key={record.id} record={record} openDetail={openDetail} onTopic={setTopic} />) : <div className="empty-state"><div className="empty-mark"><Icon name="search" size={30} /></div><h2>No public records match</h2><p>Try a broader event period, another language, topic, or fewer search terms. Draft and unreviewed capsules never appear here.</p><Button variant="secondary" onClick={clearFilters}>Reset search and filters</Button></div>}
            </div>}
        </section>
      </div>
    </main>
  );
}

function FilterGroup({ label, options, active, setActive }: { label: string; options: string[]; active: string; setActive?: (value: string) => void }) {
  return <fieldset><legend>{label}</legend>{options.map((option) => <label key={option}><input type="radio" name={label} checked={active === option} onChange={() => setActive?.(option)} /><span>{option}</span></label>)}</fieldset>;
}

function CapsuleConstellation({ go, openDetail, timeFilter, setTimeFilter }: { go: (page: Page) => void; openDetail: (id: string) => void; timeFilter: TimeFilter; setTimeFilter: (value: TimeFilter) => void }) {
  const scenario = import.meta.env.DEV ? getPrototypeScenario(typeof window === "undefined" ? "" : window.location.search, "constellation") : null;
  const sourceNodes = scenario === "empty" ? [] : constellationNodes;
  const [status, setStatus] = useState<"loading" | "ready" | "error">(scenario === "error" ? "error" : "loading");
  const [query, setQuery] = useState("");
  const [capsuleType, setCapsuleType] = useState("All types");
  const [topic, setTopic] = useState("All topics");
  const [relationshipType, setRelationshipType] = useState("All relationships");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [pathMode, setPathMode] = useState(false);
  const [pathSelection, setPathSelection] = useState<string[]>([]);
  const drag = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const loadTimer = useRef<number | null>(null);
  const notify = useNotice();

  useEffect(() => {
    if (scenario === "error") return;
    loadTimer.current = window.setTimeout(() => setStatus("ready"), 650);
    return () => { if (loadTimer.current) window.clearTimeout(loadTimer.current); };
  }, [scenario]);

  const topics = Array.from(new Set(constellationNodes.flatMap((node) => node.topics))).sort();
  const graphResult = useMemo(() => filterConstellation(sourceNodes, constellationEdges, { query, dateRange: "All dates", capsuleType, topic, relationshipType, timeFilter }), [sourceNodes, query, capsuleType, topic, relationshipType, timeFilter]);
  const visibleNodes = graphResult.nodes;
  const visibleEdges = graphResult.edges;
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const visibleEdgeIds = useMemo(() => new Set(visibleEdges.map((edge) => edge.id)), [visibleEdges]);
  const relationshipPath = useMemo(() => pathSelection.length === 2 ? findRelationshipPath(pathSelection[0], pathSelection[1], visibleEdges) : null, [pathSelection, visibleEdges]);
  const pathNodeIds = new Set(relationshipPath?.nodeIds ?? pathSelection);
  const pathEdgeIds = new Set(relationshipPath?.edgeIds ?? []);
  const noRelationships = relationshipType !== "All relationships" && visibleEdges.length === 0;
  const activeNode = constellationNodes.find((node) => node.id === selectedNode);
  const activeEdge = constellationEdges.find((edge) => edge.id === selectedEdge);
  const connectedIds = new Set(selectedNode ? constellationEdges.filter((edge) => edge.source === selectedNode || edge.target === selectedNode).flatMap((edge) => [edge.source, edge.target]) : []);
  useEffect(() => {
    if (selectedNode && !visibleNodeIds.has(selectedNode)) setSelectedNode(null);
    if (selectedEdge && !visibleEdgeIds.has(selectedEdge)) setSelectedEdge(null);
    setPathSelection((current) => {
      const next = current.filter((id) => visibleNodeIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [selectedNode, selectedEdge, visibleNodeIds, visibleEdgeIds]);
  const resetGraph = () => {
    setQuery(""); setCapsuleType("All types"); setTopic("All topics"); setRelationshipType("All relationships"); setSelectedNode(null); setSelectedEdge(null); setPathMode(false); setPathSelection([]); setZoom(1); setPan({ x: 0, y: 0 }); setTimeFilter({ ...DEFAULT_TIME_FILTER });
  };
  const reloadGraph = () => {
    setStatus("loading");
    if (loadTimer.current) window.clearTimeout(loadTimer.current);
    loadTimer.current = window.setTimeout(() => setStatus("ready"), 650);
  };
  const chooseNode = (id: string) => {
    if (pathMode) {
      setPathSelection((current) => current.length === 1 && current[0] !== id ? [current[0], id] : [id]);
      setSelectedNode(null);
      setSelectedEdge(null);
      return;
    }
    setSelectedNode(id); setSelectedEdge(null);
  };
  const chooseEdge = (id: string) => { setSelectedEdge(id); setSelectedNode(null); };
  const fitGraph = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const panBy = (x: number, y: number) => setPan((current) => ({ x: current.x + x, y: current.y + y }));
  const handleGraphKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "0"].includes(event.key)) event.preventDefault();
    if (event.key === "ArrowLeft") panBy(35, 0);
    if (event.key === "ArrowRight") panBy(-35, 0);
    if (event.key === "ArrowUp") panBy(0, 35);
    if (event.key === "ArrowDown") panBy(0, -35);
    if (event.key === "+") setZoom((current) => Math.min(1.6, current + .15));
    if (event.key === "-") setZoom((current) => Math.max(.7, current - .15));
    if (event.key === "0") fitGraph();
  };
  const startPan = (event: PointerEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePan = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const ratio = 1000 / event.currentTarget.getBoundingClientRect().width / zoom;
    setPan({ x: drag.current.panX + (event.clientX - drag.current.x) * ratio, y: drag.current.panY + (event.clientY - drag.current.y) * ratio });
  };
  const stopPan = (event: PointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  return (
    <main className="constellation-page">
      <section className="constellation-header">
        <div><p className="kicker">PUBLIC ARCHIVE / RELATIONSHIP MAP</p><h1>Every memory leaves <em>a connection.</em></h1></div>
        <p>This graph maps explainable relationships between public capsules. Placement shows clusters—not truth, importance, or factual confidence.</p>
      </section>
      <div className="constellation-toolbar">
        <div className="constellation-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a capsule or topic" aria-label="Search constellation" />{query && <button onClick={() => setQuery("")} aria-label="Clear graph search"><Icon name="close" /></button>}</div>
        <label><span>CAPSULE TYPE</span><select value={capsuleType} onChange={(event) => setCapsuleType(event.target.value)}><option>All types</option><option>Memory</option><option>Witnessed event</option><option>Prediction</option></select></label>
        <label><span>TOPIC</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option>All topics</option>{topics.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>RELATIONSHIP</span><select value={relationshipType} onChange={(event) => setRelationshipType(event.target.value)}><option>All relationships</option><option>Documented reference</option><option>Shared metadata</option><option>Inferred similarity</option></select></label>
      </div>
      <TimeTravelExplorer value={timeFilter} onChange={setTimeFilter} />
      <section className="graph-shell">
        <div className="graph-topbar">
          <div className="view-switch" aria-label="Archive view">
            <button className="selected" aria-pressed="true" disabled>Constellation</button>
            <button aria-pressed="false" onClick={() => go("timeline")}>Timeline</button>
            <button aria-pressed="false" onClick={() => go("archive")}>List</button>
          </div>
          <button className={`path-mode-toggle ${pathMode ? "active" : ""}`} aria-pressed={pathMode} onClick={() => { setPathMode(!pathMode); setPathSelection([]); setSelectedNode(null); setSelectedEdge(null); }}>{pathMode ? "Exit path mode" : "Trace a relationship path"}</button>
          <div className="graph-count"><span className="status-dot" />ILLUSTRATIVE DATA · {visibleNodes.length} CAPSULES · {visibleEdges.length} CONNECTIONS</div>
        </div>
        <details className="cluster-overview">
          <summary>Cluster overview <span>Browse related groups without changing the viewport</span></summary>
          <div>
            {[
              { label: "Watershed records", ids: ["FF-3001", "FF-3018", "FF-3042", "FF-3090"] },
              { label: "Urban movement", ids: ["FF-3121", "FF-3155", "FF-3184"] },
              { label: "Family records", ids: ["FF-3184", "FF-3207"] },
            ].map((cluster) => <section key={cluster.label}><strong>{cluster.label}</strong><span>{cluster.ids.filter((id) => visibleNodeIds.has(id)).length} visible capsules</span>{cluster.ids.map((id) => { const node = constellationNodes.find((item) => item.id === id)!; const hidden = !visibleNodeIds.has(id); return <button key={id} disabled={hidden} title={hidden ? "Hidden by active filters" : undefined} onClick={() => chooseNode(id)}>{node.title}{hidden ? " · filtered" : ""}</button>; })}</section>)}
          </div>
        </details>
        <div className="graph-stage">
          {pathMode && <div className="path-instruction" role="status">{pathSelection.length === 0 ? "Select an origin capsule" : pathSelection.length === 1 ? "Select a destination capsule" : relationshipPath ? `${relationshipPath.edgeIds.length} explainable connection${relationshipPath.edgeIds.length === 1 ? "" : "s"} found` : "No relationship path exists in this filtered view"}<button onClick={() => setPathSelection([])}>Clear</button></div>}
          {status === "loading" && <GraphState kind="loading" title="Mapping archive relationships" text="Reading public metadata and documented references…" />}
          {status === "error" && <GraphState kind="error" title="The constellation could not load" text="The public archive remains available in List view." action="Try again" onAction={reloadGraph} />}
          {status === "ready" && sourceNodes.length === 0 && <GraphState kind="empty" title="No public capsules yet" text="The constellation appears when reviewed capsules are published." />}
          {status === "ready" && sourceNodes.length > 0 && noRelationships && <GraphState kind="empty" title="No qualifying relationships" text={`No ${relationshipType.toLowerCase()} connections match the current capsule filters.`} action="Reset filters" onAction={resetGraph} />}
          {status === "ready" && sourceNodes.length > 0 && !noRelationships && visibleNodes.length === 0 && <GraphState kind="empty" title="No capsules match these filters" text="Adjust the date, type, topic, or search terms to reveal other capsules." action="Reset filters" onAction={resetGraph} />}
          {status === "ready" && visibleNodes.length > 0 && (
            <svg className="constellation-graph" viewBox="0 0 1000 610" role="img" tabIndex={0} aria-label="Interactive graph of illustrative public capsules and their relationships. Use arrow keys to pan, plus and minus to zoom, and zero to fit." onKeyDown={handleGraphKey} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={stopPan} onPointerCancel={stopPan}>
              <g className="cluster-labels"><text x="120" y="72">WATERSHED RECORDS</text><text x="690" y="62">URBAN MOVEMENT</text><text x="445" y="560">FAMILY RECORDS</text></g>
              <g transform={`translate(${(1 - zoom) * 500 + pan.x} ${(1 - zoom) * 305 + pan.y}) scale(${zoom})`}>
                {visibleEdges.map((edge) => {
                  const source = constellationNodes.find((node) => node.id === edge.source)!;
                  const target = constellationNodes.find((node) => node.id === edge.target)!;
                  const highlighted = edge.id === selectedEdge || edge.source === selectedNode || edge.target === selectedNode || pathEdgeIds.has(edge.id);
                  const dimmed = Boolean((selectedNode || selectedEdge || pathSelection.length === 2) && !highlighted);
                  return <g key={edge.id} className={`graph-edge graph-enter ${edge.type.toLowerCase().replace(/\s+/g, "-")} ${highlighted ? "highlighted" : ""} ${pathEdgeIds.has(edge.id) ? "path-edge" : ""} ${dimmed ? "dimmed" : ""}`} role="button" tabIndex={0} aria-label={`${edge.type} between ${source.title} and ${target.title}`} onClick={() => chooseEdge(edge.id)} onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseEdge(edge.id); } }}><line className="edge-hit" x1={source.x} y1={source.y} x2={target.x} y2={target.y} /><line x1={source.x} y1={source.y} x2={target.x} y2={target.y} /></g>;
                })}
                {visibleNodes.map((node) => {
                  const isSelected = node.id === selectedNode || pathNodeIds.has(node.id) || Boolean(activeEdge && (activeEdge.source === node.id || activeEdge.target === node.id));
                  const dimmed = Boolean((selectedNode && !connectedIds.has(node.id)) || (activeEdge && activeEdge.source !== node.id && activeEdge.target !== node.id) || (pathSelection.length === 2 && !pathNodeIds.has(node.id)));
                  return (
                    <g key={node.id} className={`graph-node graph-enter ${node.type.toLowerCase().replace(/\s+/g, "-")} ${isSelected ? "selected" : ""} ${pathNodeIds.has(node.id) ? "path-node" : ""} ${dimmed ? "dimmed" : ""}`} transform={`translate(${node.x} ${node.y})`} role="button" tabIndex={0} aria-label={`${node.type}: ${node.title}, event date ${formatArchiveDate(node.eventDate, node.eventDateApproximate)}`} onClick={() => chooseNode(node.id)} onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseNode(node.id); } }}>
                      <circle className="node-halo" r="30" /><circle className="node-body" r="14" /><circle className="node-core" r="3" />
                      <g className="graph-node-label"><rect x="-82" y="29" width="164" height="58" /><text x="0" y="44">{node.id} · {node.type.toUpperCase()}</text><text className="node-title" x="0" y="60">{node.title.length > 28 ? `${node.title.slice(0, 28)}…` : node.title}</text><text className="node-date" x="0" y="77">{formatArchiveDate(node.eventDate, node.eventDateApproximate)} · {node.topics[0]}</text></g>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
          <div className="graph-controls" aria-label="Graph controls">
            <button onClick={() => setZoom(Math.min(1.6, zoom + .15))} aria-label="Zoom in">+</button>
            <button onClick={() => setZoom(Math.max(.7, zoom - .15))} aria-label="Zoom out">−</button>
            <button onClick={fitGraph} aria-label="Fit graph to view">FIT</button>
            <button onClick={resetGraph} aria-label="Reset graph and filters">RESET</button>
            <button onClick={() => panBy(0, 35)} aria-label="Pan graph up">↑</button>
            <button onClick={() => panBy(0, -35)} aria-label="Pan graph down">↓</button>
            <button onClick={() => panBy(35, 0)} aria-label="Pan graph left">←</button>
            <button onClick={() => panBy(-35, 0)} aria-label="Pan graph right">→</button>
          </div>
          <div className="graph-legend">
            <span><i className="memory" />Memory</span><span><i className="witnessed" />Witnessed event</span><span><i className="prediction" />Prediction</span>
          </div>
          {(activeNode || activeEdge) && <button className="inspector-backdrop" onClick={() => { setSelectedNode(null); setSelectedEdge(null); }} aria-label="Close capsule inspector" />}
          {(activeNode || activeEdge) && <ConstellationPanel node={activeNode} edge={activeEdge} close={() => { setSelectedNode(null); setSelectedEdge(null); }} selectNode={chooseNode} openDetail={openDetail} />}
          {pathMode && pathSelection.length === 2 && relationshipPath && <RelationshipPathPanel path={relationshipPath} close={() => setPathSelection([])} selectNode={(id) => { setPathMode(false); setPathSelection([]); setSelectedEdge(null); setSelectedNode(id); }} />}
        </div>
        <div className="constellation-timebar" aria-label="Capsules ordered by event date">
          <div className="timebar-heading"><span>ORDINAL EVENT DATE INDEX</span><small>Ordered by date; spacing does not represent elapsed time. Approximate dates are marked “C.”</small></div>
          <div className="timebar-track">
            {[...visibleNodes].sort((a, b) => eventYear(a.eventDate) - eventYear(b.eventDate)).map((node) => (
              <button key={node.id} className={`${node.type.toLowerCase().replace(/\s+/g, "-")} ${selectedNode === node.id ? "selected" : ""}`} onClick={() => chooseNode(node.id)} aria-label={`${node.title}, event date ${formatArchiveDate(node.eventDate, node.eventDateApproximate)}`}>
                <span>{formatArchiveDate(node.eventDate, node.eventDateApproximate)}</span><i /><small>{node.id}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="relationship-legend"><span>CONNECTION EVIDENCE</span><i className="documented" />Documented reference <i className="shared" />Shared metadata <i className="inferred" />Inferred similarity <button onClick={() => notify("Documented references cite another capsule directly. Shared metadata links matching archive fields. Inferred similarity is machine-suggested from transcript language.")}>How links are made</button></div>
      </section>
    </main>
  );
}

function RelationshipPathPanel({ path, close, selectNode }: { path: RelationshipPath; close: () => void; selectNode: (id: string) => void }) {
  return (
    <aside className="relationship-path-panel" aria-label="Relationship path explanation">
      <div className="panel-head"><span>EXPLAINABLE PATH · {path.edgeIds.length} STEPS</span><button onClick={close} aria-label="Close relationship path"><Icon name="close" /></button></div>
      <div className="path-chain">{path.nodeIds.map((id, index) => <span key={id}><button onClick={() => selectNode(id)}>{id}</button>{index < path.nodeIds.length - 1 && <i>→</i>}</span>)}</div>
      <div className="path-evidence">{path.edgeIds.map((id, index) => { const edge = constellationEdges.find((item) => item.id === id)!; return <div key={id}><span>{index + 1} · {edge.type}</span><p>{edge.evidence}</p></div>; })}</div>
      <p className="path-disclaimer">This path explains archive relationships only. It does not verify that any capsule’s claims are factually true.</p>
    </aside>
  );
}

function GraphState({ kind, title, text, action, onAction }: { kind: "loading" | "empty" | "error"; title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className={`graph-state ${kind}`} role="status"><div className="graph-state-mark">{kind === "loading" ? <span /> : <Icon name={kind === "error" ? "info" : "search"} size={28} />}</div><h2>{title}</h2><p>{text}</p>{action && <Button variant="secondary" onClick={onAction}>{action}</Button>}</div>;
}

function ConstellationPanel({ node, edge, close, selectNode, openDetail }: { node?: ConstellationNode; edge?: ConstellationEdge; close: () => void; selectNode: (id: string) => void; openDetail: (id: string) => void }) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isModal, setIsModal] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setIsModal(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const previousFocus = document.activeElement && "focus" in document.activeElement ? document.activeElement as Element & { focus: () => void } : null;
    closeRef.current?.focus();
    return () => previousFocus?.focus();
  }, []);
  const handleDialogKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab" || !isModal || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  if (edge) {
    const source = constellationNodes.find((item) => item.id === edge.source)!;
    const target = constellationNodes.find((item) => item.id === edge.target)!;
    const inferred = edge.type === "Inferred similarity";
    return <aside ref={panelRef} className="constellation-panel edge-panel" role="dialog" aria-modal={isModal || undefined} aria-labelledby="connection-panel-title" onKeyDown={handleDialogKey}><div className="panel-head"><span>CONNECTION / {edge.id}</span><button ref={closeRef} onClick={close} aria-label="Close connection details"><Icon name="close" /></button></div><p className={`relation-badge ${inferred ? "inferred" : ""}`}>{edge.type}</p><h2 id="connection-panel-title">{source.title}<em> connects to </em>{target.title}</h2><div className="evidence-block"><span>SUPPORTING EVIDENCE</span><p>{edge.evidence}</p></div>{inferred && <div className="inference-note"><Icon name="info" /><p>This is a machine-inferred connection, not an explicit claim by either speaker and not evidence that either account is factually true.</p></div>}<div className="connected-actions"><button onClick={() => selectNode(source.id)}>{source.id} <Icon name="arrow" /></button><button onClick={() => selectNode(target.id)}>{target.id} <Icon name="arrow" /></button></div></aside>;
  }
  if (!node) return null;
  const related = constellationEdges.filter((item) => item.source === node.id || item.target === node.id);
  return <aside ref={panelRef} className="constellation-panel" role="dialog" aria-modal={isModal || undefined} aria-labelledby="capsule-panel-title" onKeyDown={handleDialogKey}><div className="panel-head"><span>CAPSULE / {node.id}</span><button ref={closeRef} onClick={close} aria-label="Close capsule details"><Icon name="close" /></button></div><p className="panel-type">{node.type}</p><h2 id="capsule-panel-title">{node.title}</h2><div className="panel-dates"><div><span>EVENT DATE</span><strong>{formatArchiveDate(node.eventDate, node.eventDateApproximate)}</strong><small>{node.eventDateNote}</small></div><div><span>RECORDING DATE</span><strong>{formatArchiveDate(node.recordingDate)}</strong><small>Illustrative timestamp</small></div></div><div className="tags">{node.topics.map((item) => <span key={item}>{item}</span>)}</div><blockquote>“{node.excerpt}”</blockquote><AudioControl duration={node.duration} sample /><div className="panel-related"><span>DIRECT CONNECTIONS · {related.length}</span>{related.map((item) => { const relatedId = item.source === node.id ? item.target : item.source; const relatedNode = constellationNodes.find((entry) => entry.id === relatedId)!; return <button key={item.id} onClick={() => selectNode(relatedId)}><span>{item.type}</span>{relatedNode.title}<Icon name="arrow" /></button>; })}</div><Button onClick={() => openDetail(node.id)}>Open full capsule <Icon name="arrow" /></Button></aside>;
}

function Create({ go }: { go: (page: Page) => void }) {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const audioUrlRef = useRef("");
  const [title, setTitle] = useState("The summer the river changed course");
  const [topic, setTopic] = useState("Landscape");
  const fileInput = useRef<HTMLInputElement>(null);
  const processController = useRef<ReturnType<typeof createRecorderProcessController> | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const discardRecording = useRef(false);
  if (!processController.current) processController.current = createRecorderProcessController(setRecorderState);
  const stopStream = () => {
    mediaStream.current?.getTracks().forEach((track) => track.stop());
    mediaStream.current = null;
  };
  const replaceAudioUrl = (file?: Blob) => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = file ? URL.createObjectURL(file) : "";
    setAudioUrl(audioUrlRef.current);
  };
  useEffect(() => () => {
    processController.current?.cancel();
    discardRecording.current = true;
    if (mediaRecorder.current?.state !== "inactive") mediaRecorder.current?.stop();
    stopStream();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);
  useEffect(() => {
    if (recorderState !== "recording") return;
    const interval = window.setInterval(() => setRecordingSeconds((seconds) => {
      const next = seconds + 1;
      if (next >= 1200 && mediaRecorder.current?.state === "recording") {
        setRecorderState("processing");
        mediaRecorder.current.stop();
      }
      return Math.min(next, 1200);
    }), 1000);
    return () => window.clearInterval(interval);
  }, [recorderState]);
  const captured = recorderState === "recorded";
  const status: Record<RecorderState, { label: string; note: string }> = {
    idle: { label: "MICROPHONE READY", note: "Your recording has not started" },
    recording: { label: "RECORDING IN PROGRESS", note: "Speak naturally · microphone active" },
    paused: { label: "RECORDING PAUSED", note: "Audio capture is temporarily stopped" },
    recorded: { label: "AUDIO READY", note: "Local playback available · transcript not generated" },
    reading: { label: "READING LOCAL AUDIO", note: "The selected file remains on this device" },
    transcribing: { label: "CHECKING AUDIO CONTAINER", note: "No transcription service is connected" },
    processing: { label: "PREPARING LOCAL PREVIEW", note: "No metadata is being extracted from this audio" },
    error: { label: "AUDIO COULD NOT BE PROCESSED", note: "The file may be unsupported or incomplete" },
  };
  const processAudio = (fromUpload = false) => {
    setFileError("");
    processController.current?.start(fromUpload);
  };
  const reset = (clearFile = false) => {
    processController.current?.cancel();
    discardRecording.current = true;
    if (mediaRecorder.current?.state !== "inactive") mediaRecorder.current?.stop();
    mediaRecorder.current = null;
    stopStream();
    setRecorderState("idle");
    setRecordingSeconds(0);
    setFileError("");
    if (clearFile) {
      setSelectedFile(null);
      replaceAudioUrl();
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  const startRecording = async () => {
    processController.current?.cancel();
    setFileError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setFileError("This browser does not support microphone recording.");
      setRecorderState("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      recordedChunks.current = [];
      discardRecording.current = false;
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunks.current.push(event.data); };
      recorder.onerror = () => {
        discardRecording.current = true;
        setFileError("The browser could not continue recording from this microphone.");
        setRecorderState("error");
        stopStream();
      };
      recorder.onstop = () => {
        stopStream();
        if (discardRecording.current) return;
        const blob = new Blob(recordedChunks.current, { type: recorder.mimeType || "audio/webm" });
        if (!blob.size) {
          setFileError("The microphone recording was empty.");
          setRecorderState("error");
          return;
        }
        const file = new File([blob], `future-fossil-recording-${Date.now()}.webm`, { type: blob.type });
        setSelectedFile(file);
        replaceAudioUrl(blob);
        setRecorderState("recorded");
      };
      recorder.start(250);
      setRecordingSeconds(0);
      setRecorderState("recording");
    } catch (error) {
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setFileError(denied ? "Microphone permission was denied. You can choose a local audio file instead." : "The microphone could not be opened. Check that it is available and try again.");
      setRecorderState("error");
      stopStream();
    }
  };
  const pauseRecording = () => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.pause();
      setRecorderState("paused");
    }
  };
  const resumeRecording = () => {
    if (mediaRecorder.current?.state === "paused") {
      mediaRecorder.current.resume();
      setRecorderState("recording");
    }
  };
  const finishRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      setRecorderState("processing");
      mediaRecorder.current.stop();
    }
  };
  const chooseFile = () => {
    if (!fileInput.current) return;
    fileInput.current.value = "";
    fileInput.current.click();
  };
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      processController.current?.cancel();
      setSelectedFile(null);
      setFileError(validation.error);
      setRecorderState("error");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
    replaceAudioUrl(file);
    processAudio(true);
  };
  const busy = ["reading", "transcribing", "processing"].includes(recorderState);
  const fileDescription = selectedFile ? `${selectedFile.name} · ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB · ${selectedFile.type || "audio file"}` : "Browser microphone recording · local draft";
  const localRecordingDate = formatArchiveDate(new Date().toISOString().slice(0, 10));
  const timerLabel = `${Math.floor(recordingSeconds / 60).toString().padStart(2, "0")}:${(recordingSeconds % 60).toString().padStart(2, "0")}`;
  return (
    <main className="create-page">
      <div className="stepper"><span className="current">01 <b>Record</b></span><i /><span className={captured ? "current" : ""}>02 <b>Describe</b></span><i /><span>03 <b>Review</b></span></div>
      <section className="create-heading"><p className="kicker">NEW CAPSULE / TEMPORARY DRAFT</p><h1>Leave a trace<br /><em>in your own voice.</em></h1><p>Speak naturally. You can review the transcript, dates, and extracted details before anything becomes public.</p></section>
      <section className={`recorder state-${recorderState}`} aria-live="polite">
        <input ref={fileInput} className="visually-hidden" type="file" accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4" onChange={handleFile} />
        <div className="recorder-status">
          <span className={recorderState === "recording" ? "live-dot" : recorderState === "error" ? "error-dot" : captured ? "complete-dot" : "idle-dot"}>{captured && <Icon name="check" size={12} />}</span>
          <div><strong>{status[recorderState].label}</strong><small>{status[recorderState].note}</small></div>
        </div>
        {captured ? <>
          {audioUrl && <audio className="local-audio" controls src={audioUrl}>Your browser does not support local audio playback.</audio>}
          <div className="capture-actions"><div><Button variant="secondary" onClick={() => reset(true)}>Clear & retry</Button>{selectedFile && <Button variant="ghost" onClick={chooseFile}>Replace file</Button>}</div><span className="mono">{fileDescription}</span></div>
          {selectedFile && <p className="local-file-note">This selected file was processed locally and was not uploaded or persisted remotely.</p>}
        </> : busy ? <>
          <div className="processing-mark"><Icon name={recorderState === "reading" ? "upload" : "audio"} size={28} /><span /></div>
          <p className="processing-note">{recorderState === "reading" ? "Reading this file locally. This prototype does not upload or persist it remotely." : "Keep this page open. Your temporary draft will be editable when local processing completes."}</p>
          <Button variant="ghost" onClick={() => reset(false)}>Cancel processing</Button>
        </> : recorderState === "error" ? <>
          <div className="error-message"><Icon name="info" size={26} /><p>{fileError || "We could not read that audio. Try MP3, WAV, or M4A under 250 MB."} Nothing was published or remotely stored.</p></div>
          <div className="recorder-actions"><Button variant="secondary" onClick={() => reset(true)}>Clear</Button><Button onClick={chooseFile}>Choose another file</Button></div>
        </> : <>
          <Waveform active={recorderState === "recording"} />
          <div className="timer">{timerLabel}<span>/ 20:00 MAX</span></div>
          <div className="recorder-actions">
            {recorderState === "idle" && <button className="record-button" onClick={startRecording} aria-label="Begin microphone recording"><span><Icon name="record" size={28} /></span>Begin recording</button>}
            {recorderState === "recording" && <>
              <Button variant="secondary" onClick={pauseRecording}><Icon name="pause" /> Pause</Button>
              <button className="record-button recording" onClick={finishRecording} aria-label="Stop microphone recording"><span><Icon name="close" size={26} /></span>Stop recording</button>
            </>}
            {recorderState === "paused" && <>
              <Button variant="secondary" onClick={resumeRecording}><Icon name="record" /> Resume</Button>
              <Button onClick={finishRecording}><Icon name="check" /> Finish recording</Button>
              <Button variant="ghost" onClick={() => reset(false)}>Discard</Button>
            </>}
          </div>
          {recorderState === "idle" && <><div className="or"><span />OR<span /></div><div className="upload-options">{selectedFile && <Button onClick={() => processAudio(true)}>Process selected file</Button>}<button className="upload-button" onClick={chooseFile}><Icon name="upload" /> {selectedFile ? "Replace local audio file" : "Choose a local audio file"} <small>MP3, WAV, M4A · nonempty · up to 250 MB</small></button>{selectedFile && <button className="clear-file" onClick={() => reset(true)}>Clear selected file</button>}</div><p className="local-file-note">Files are processed locally for this prototype and are not uploaded or persisted remotely.</p></>}
        </>}
      </section>
      <section className={`metadata-form ${captured ? "ready" : ""}`}>
        <div className="form-intro"><span className="number">02</span><div><p className="kicker">DESCRIBE THE RECORD</p><h2>Review the sample metadata.</h2><p>This prototype does not transcribe audio or extract metadata. The fields below are illustrative and remain editable.</p></div></div>
        <div className="fields">
          <label>Public title <span>ILLUSTRATIVE · EDITABLE</span><input disabled={!captured} value={captured ? title : ""} onChange={(e) => setTitle(e.target.value)} placeholder="Available after recording" /></label>
          <div className="field-row"><label>Event date <span>SAMPLE VALUE</span><input disabled={!captured} type="date" defaultValue={captured ? "1998-07-14" : ""} /><small className="field-help">Illustrative date · not extracted from the selected audio</small></label><label>Event date certainty <select disabled={!captured} defaultValue="Approximate"><option>Approximate</option><option>Exact — speaker stated</option><option>Unknown</option></select></label></div>
          <div className="field-row system-dates"><label>Recording date <span>LOCAL SESSION DATE</span><input disabled value={captured ? localRecordingDate : "Available after recording"} /></label><label>Publication date <span>NOT YET PUBLIC</span><input disabled value="Assigned only by a publication service" /></label></div>
          <label>Topics <span>ILLUSTRATIVE SAMPLE</span><div className="tag-editor">{captured && <button onClick={() => setTopic("")}>{topic} ×</button>}<input disabled={!captured} placeholder="Add a topic" /></div></label>
          <label>Transcript preview <span>UNAVAILABLE</span><textarea disabled value={captured ? "No transcript was generated. Transcription is unavailable in this frontend-only prototype." : ""} readOnly /></label>
          <div className="draft-notice"><Icon name="info" /><p><strong>This is a temporary draft.</strong> Unpublished audio is automatically deleted after 24 hours. Future Fossil is not a private storage vault.</p></div>
          <Button disabled={!captured} onClick={() => go("review")}>Continue to public review <Icon name="arrow" /></Button>
        </div>
      </section>
    </main>
  );
}

function Review({ go }: { go: (page: Page) => void }) {
  const [metadataReviewed, setMetadataReviewed] = useState(false);
  const [publicConsent, setPublicConsent] = useState(false);
  const [rightsConsent, setRightsConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submit = () => {
    if (metadataReviewed && publicConsent && rightsConsent) setSubmitted(true);
  };
  return (
    <main className="review-page">
      <div className="stepper"><span className="current">01 <b>Record</b></span><i /><span className="current">02 <b>Describe</b></span><i /><span className="current">03 <b>Review</b></span></div>
      <div className="review-header"><div><p className="kicker">FINAL PUBLICATION REVIEW</p><h1>Review before<br /><em>you release.</em></h1></div><p>Nothing is public yet. Verify each detail and acknowledge how your recording will be stored and accessed.</p></div>
      <div className="review-layout">
        <section className="public-preview">
          <div className="preview-label"><span>PUBLIC PREVIEW</span><span>CAPSULE FF—DRAFT</span></div>
          <h2>The summer the river changed course</h2>
          <p className="preview-description">A first-hand memory of a storm reshaping a river and the surrounding farmland during the summer of 1998.</p>
          <AudioControl duration="04:26" sample />
          <div className="date-grid"><div><span>EVENT DATE</span><strong>C. 14 JUL 1998</strong><small>Illustrative · approximate</small></div><div><span>RECORDING DATE</span><strong>08 MAR 2025</strong><small>Illustrative timestamp</small></div><div><span>PUBLICATION DATE</span><strong>NOT ASSIGNED</strong><small>No publication service connected</small></div></div>
          <div className="tags"><span>Landscape</span><span>Weather</span><span>Childhood</span></div>
          <button className="edit-link" onClick={() => go("create")}>← Return to edit details</button>
        </section>
        <aside className="review-checks">
          <div className="review-step-label"><span>01</span><strong>REVIEW METADATA</strong></div>
          <ReviewItem icon="check" tone="good" title="Illustrative metadata ready" text="This prototype shows 3 sample topics and 1 sample date. No live extraction was performed." />
          <ReviewItem icon="info" tone="warn" title="One uncertain date" text="The event date was inferred from “the summer of ’98.” It will display as approximate." />
          <ReviewItem icon="shield" tone="neutral" title="Privacy scan unavailable" text="No live privacy scan was performed in this frontend-only prototype. Review the sample content manually." />
          <label className="metadata-confirm"><input type="checkbox" checked={metadataReviewed} onChange={(e) => setMetadataReviewed(e.target.checked)} /><span>I reviewed the title, transcript, topics, and date uncertainty shown in the public preview.</span></label>
          <div className="moderation-status"><span><Icon name="audio" /></span><div><strong>MODERATION NOT STARTED</strong><p>Required human and automated checks begin after submission. The capsule remains private until approved.</p></div></div>
          <div className="review-step-label"><span>02</span><strong>CONFIRM PUBLIC VISIBILITY</strong></div>
          <div className="public-warning"><Icon name="info" /><p><strong>If approved, this is a public release.</strong> Anyone will be able to hear the audio, read the transcript, and find this capsule through archive search.</p></div>
          <div className="consent">
            <label><input type="checkbox" checked={publicConsent} onChange={(e) => setPublicConsent(e.target.checked)} /><span>I understand this capsule, including my voice and transcript, will be publicly accessible if approved.</span></label>
            <label><input type="checkbox" checked={rightsConsent} onChange={(e) => setRightsConsent(e.target.checked)} /><span>I confirm I have the right to submit this recording and it follows the archive guidelines.</span></label>
          </div>
          {submitted ? <div className="submission-confirmation" role="status"><Icon name="check" /><p><strong>Prototype review complete.</strong> Nothing was submitted, published, or persisted. A production service would begin moderation only after this step.</p></div> : <Button disabled={!metadataReviewed || !publicConsent || !rightsConsent} onClick={submit}>Complete prototype review <Icon name="arrow" /></Button>}
          <p className="review-fineprint">This frontend has no publication service. No archive receipt is issued.</p>
        </aside>
      </div>
    </main>
  );
}

function ReviewItem({ icon, tone, title, text }: { icon: IconName; tone: string; title: string; text: string }) {
  return <div className={`review-item ${tone}`}><span><Icon name={icon} /></span><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function Detail({ go, capsuleId, openDetail }: { go: (page: Page) => void; capsuleId: string; openDetail: (id: string) => void }) {
  const record = resolveCapsuleDetail(capsuleId);
  const notify = useNotice();
  const [selectedSegment, setSelectedSegment] = useState("00:00");
  const [metadataSupport, setMetadataSupport] = useState<"event" | "integrity" | null>(null);
  if (!record) {
    return <main className="detail-page"><button className="back-link" onClick={() => go("archive")}>← Back to archive</button><div className="empty-state"><div className="empty-mark"><Icon name="search" size={30} /></div><h1>Capsule not found</h1><p>No public capsule matches “{capsuleId}”. It may be unpublished, removed, or the link may be incorrect.</p><Button onClick={() => go("archive")}>Explore public archive</Button></div></main>;
  }
  const fromConstellation = record.id.startsWith("FF-3");
  const downloadTranscript = () => {
    const blob = new Blob([`${record.title}\n\n${record.description}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.id.toLowerCase()}-transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Transcript download started.");
  };
  return (
    <main className="detail-page">
      <button className="back-link" onClick={() => go(fromConstellation ? "constellation" : "archive")}>← Back to {fromConstellation ? "constellation" : "archive"}</button>
      <section className="detail-hero">
        <div className="detail-id"><span className="kicker">ILLUSTRATIVE PUBLIC CAPSULE</span><strong>{record.id}</strong></div>
        <div><div className="eyebrow"><span>{record.type}</span><span>EVENT DATE · {formatArchiveDate(record.eventDate, record.eventDateApproximate)}</span></div><h1>{record.title}</h1><p>{record.description}</p><AudioControl duration={record.duration} position={selectedSegment} sample /></div>
      </section>
      <section className="detail-body">
        <aside className="record-facts">
          <h3>Record context</h3>
          <dl><dt>Event date</dt><dd>{formatArchiveDate(record.eventDate, record.eventDateApproximate)}<small>{record.eventDateNote}</small></dd><dt>Recording date</dt><dd>{formatArchiveDate(record.recordingDate)}<small>Illustrative timestamp</small></dd><dt>Publication date</dt><dd>{formatArchiveDate(record.publicationDate)}<small>Illustrative archive release</small></dd><dt>Record status</dt><dd>Illustrative sample<small>Prototype data only · not a live publication</small></dd></dl>
          <h3>Extracted topics</h3><div className="tags">{record.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
          <h3>Metadata support</h3>
          <div className="metadata-support-actions"><button className={metadataSupport === "event" ? "active" : ""} onClick={() => setMetadataSupport("event")}>Event date source</button><button className={metadataSupport === "integrity" ? "active" : ""} onClick={() => setMetadataSupport("integrity")}>Integrity scope</button></div>
          {metadataSupport && <div className="metadata-support" role="status"><strong>{metadataSupport === "event" ? "EVENT DATE SUPPORT" : "INTEGRITY SUPPORT"}</strong><p>{metadataSupport === "event" ? `${record.eventDateNote}. No source-linked transcript excerpt is available for this illustrative sample.` : "The prototype displays receipt structure only. Integrity would show that published bytes are unchanged; it would not establish factual truth."}</p></div>}
        </aside>
        <article className="transcript">
          <div className="transcript-heading"><h2>Transcript</h2><button onClick={downloadTranscript}>Download .TXT</button></div>
          <p className="transcript-disclosure"><Icon name="info" /> Illustrative sample excerpt. Selecting a segment moves the local preview marker; no playable source audio is bundled.</p>
          <TranscriptLine time="00:00" text={record.description} active={selectedSegment === "00:00"} onSelect={setSelectedSegment} />
          <TranscriptLine time="00:18" text="No additional source-linked transcript text is available in this prototype record." active={selectedSegment === "00:18"} onSelect={setSelectedSegment} />
          <TranscriptLine time="00:39" text="Metadata remains labeled as illustrative and should not be interpreted as verified fact." active={selectedSegment === "00:39"} onSelect={setSelectedSegment} />
        </article>
      </section>
      <section className="integrity">
        <div><p className="kicker cyan">PROOF OF TIME</p><h2>Integrity receipt</h2><p>This illustrative prototype record does not carry a real cryptographic receipt. Integrity verification, if implemented, would never prove that an account is factually true.</p></div>
        <div className="hash"><span><Icon name="shield" /> NO LIVE RECEIPT · PROTOTYPE</span><dl><dt>CAPSULE</dt><dd>{record.id}</dd><dt>RECEIPT</dt><dd>NOT ISSUED</dd><dt>VERSION</dt><dd>Illustrative sample</dd></dl><button disabled>Unavailable for sample</button></div>
      </section>
      <section className="related"><p className="kicker">CONNECTED RECORDS</p><h2>Related capsules</h2>{archiveRecords.filter((item) => item.id.toUpperCase() !== record.id).slice(0, 2).map((item) => <CapsuleCard key={item.id} record={item} openDetail={openDetail} onTopic={(topic) => notify(`Open the archive to filter by ${topic}.`)} />)}</section>
    </main>
  );
}

function TranscriptLine({ time, text, active = false, onSelect }: { time: string; text: string; active?: boolean; onSelect: (time: string) => void }) {
  return <button className={`transcript-line ${active ? "active" : ""}`} aria-pressed={active} onClick={() => onSelect(time)} aria-label={`Set sample preview marker to ${time}`}><span>{time}</span><p>{text}</p></button>;
}

function Footer({ go, openDetail }: { go: (page: Page) => void; openDetail: (id: string) => void }) {
  const notify = useNotice();
  const information = (topic: string) => notify(`${topic} documentation is not included in this prototype.`);
  return <footer><div className="footer-main"><Wordmark go={go} /><p>A public archive of human memory,<br />preserved one voice at a time.</p><div><span>EXPLORE</span><button onClick={() => go("archive")}>Public archive</button><button onClick={() => go("create")}>Preserve a memory</button><button onClick={() => document.getElementById("proof")?.scrollIntoView({ behavior: "smooth" })}>How it works</button></div><div><span>ARCHIVE</span><button onClick={() => information("Archive guidelines")}>Guidelines</button><button onClick={() => information("Privacy")}>Privacy</button><button onClick={() => openDetail("ff-2041")}>Data & integrity</button></div></div><div className="footer-bottom"><span>© 2025 FUTURE FOSSIL</span><span>BUILT FOR THE LONG NOW</span><span>PROTOTYPE · LOCAL DATA</span></div></footer>;
}

export default function App() {
  const initialRoute = useRef(parseHashRoute(typeof window === "undefined" ? "" : window.location.hash));
  const [page, setPage] = useState<Page>(initialRoute.current.page);
  const [detailId, setDetailId] = useState(initialRoute.current.capsuleId ?? "ff-2041");
  const [archiveTopic, setArchiveTopic] = useState("All topics");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ ...DEFAULT_TIME_FILTER });
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | null>(null);
  useEffect(() => () => { if (noticeTimer.current) window.clearTimeout(noticeTimer.current); }, []);
  useEffect(() => {
    const syncRoute = () => {
      const route = parseHashRoute(window.location.hash);
      setPage(route.page);
      if (route.capsuleId) setDetailId(route.capsuleId);
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    if (!window.location.hash) window.history.replaceState({}, "", formatHashRoute({ page: initialRoute.current.page, capsuleId: initialRoute.current.capsuleId }));
    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);
  const notify = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 4200);
  };
  const go = (next: Page) => {
    if (next === "archive") setArchiveTopic("All topics");
    setPage(next);
    window.history.pushState({}, "", formatHashRoute({ page: next }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openDetail = (id: string) => { setDetailId(id); setPage("detail"); window.history.pushState({}, "", formatHashRoute({ page: "detail", capsuleId: id })); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const filterTopic = (topic: string) => { setArchiveTopic(topic); setPage("archive"); window.history.pushState({}, "", formatHashRoute({ page: "archive" })); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <NoticeContext.Provider value={notify}>
      <div className="app">
        <Header page={page} go={go} />
        {page === "home" && <Home go={go} openDetail={openDetail} filterTopic={filterTopic} />}
        {page === "archive" && <Archive initialView="list" initialTopic={archiveTopic} openDetail={openDetail} timeFilter={timeFilter} setTimeFilter={setTimeFilter} go={go} />}
        {page === "timeline" && <Archive initialView="timeline" openDetail={openDetail} timeFilter={timeFilter} setTimeFilter={setTimeFilter} go={go} />}
        {page === "constellation" && <CapsuleConstellation go={go} openDetail={openDetail} timeFilter={timeFilter} setTimeFilter={setTimeFilter} />}
        {page === "create" && <Create go={go} />}
        {page === "review" && <Review go={go} />}
        {page === "detail" && <Detail go={go} capsuleId={detailId} openDetail={openDetail} />}
        {notice && <div className="app-notice" role="status"><Icon name="info" /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss message"><Icon name="close" size={15} /></button></div>}
      </div>
    </NoticeContext.Provider>
  );
}
