import { useState, useRef, useEffect } from "react";

// ─── Theme: Thrust Flight (red & black, Apple-inspired) ──────────────────────
const THEME = {
  bg: "#000000",
  surface: "#0a0a0a",
  surface2: "#141414",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  text: "#ffffff",
  textSecondary: "rgba(255,255,255,0.6)",
  textTertiary: "rgba(255,255,255,0.38)",
  textQuaternary: "rgba(255,255,255,0.22)",
  red: "#ff3b30",
  redDim: "rgba(255,59,48,0.12)",
  redGlow: "rgba(255,59,48,0.25)",
  green: "#30d158",
  separator: "rgba(255,255,255,0.06)",
};

const FONT_DISPLAY = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif`;
const FONT_TEXT = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`;
const FONT_MONO = `"SF Mono", ui-monospace, "Menlo", monospace`;

// ─── Training types ───────────────────────────────────────────────────────────

const TRAINING_TYPES = {
  IRA:  { label: "Instrument Rating",              short: "Instrument", stages: ["Stage 1", "Stage 2", "Stage 3"] },
  CAX:  { label: "Commercial / Complex",           short: "Commercial", stages: ["Stage 0", "Stage 1", "Stage 2", "Stage 3"] },
  CFII: { label: "Flight Instructor — Instrument", short: "CFII",       stages: ["Stage 1", "Stage 2"] },
};

// Default topics organized by training type → stage → category → topic list.
// Each [trainingType][stage] is an OBJECT keyed by category name, values are arrays of topics.
// Edit these defaults to change what shows up for brand-new lessons / brand-new installs.
// Existing users keep their saved data; their localStorage value takes precedence over these defaults.
const MASTER_TOPICS = {
  IRA: {
    "Stage 1": {
      "Preflight Procedures": [
        "Airplane Systems Related to IFR Operations (Anti-icing and Deicing)",
        "Airplane Flight Instruments Operation",
        "Instrument Flight Deck Check",
        "GPS Programming",
        "VOR Equipment Operation",
      ],
      "Flight by Reference to Instruments — Full/Partial": [
        "Straight-and-Level Flight",
        "Standard-Rate Turns",
        "Constant Rate Climbs and Descents",
        "Constant Airspeed Climbs and Descents",
        "Timed Turns to Magnetic Compass Headings",
        "Magnetic Compass Turns",
        "Autopilot Use, if Equipped",
        "Recovery From Unusual Flight Attitudes",
      ],
      "Systems and Equipment Malfunctions": [
        "Loss of Primary Flight Instrument Indications",
        "Use of Secondary Flight Displays when Primary Displays Fail",
      ],
      "Navigation Systems — Full and Partial": [
        "GPS Course Interception and Tracking",
        "VOR Radial Interception and Tracking",
        "Localizer Course Interception and Tracking",
        "Intercepting and Tracking DME Arcs",
        "Autopilot Use for Navigation, if Equipped",
      ],
    },
    "Stage 2": {
      "Air Traffic Control Clearances and Procedures": [
        "Approach Clearances",
        "VOR Holding",
        "GPS Holding",
        "Localizer Holding",
        "Intersection Holding",
      ],
      "Emergency Operations": [
        "No-Gyro Radar Vectoring and Approach Procedures",
        "Partial-Panel Approach Procedures",
        "Partial-Panel Missed Approach Procedures",
      ],
      "Instrument Approach Procedures (Full and Partial Panel)": [
        "ILS Approaches",
        "RNAV (GPS) Approaches",
        "Localizer Approaches",
        "VOR and VOR/DME Approaches",
        "Procedure Turn/Course Reversal",
        "Terminal Arrival Area (TAA)",
        "Vectors to the Approach Course",
        "Approach Procedure to Straight-In or Circling Landing Minimums",
        "Circling Approach",
        "Missed Approach",
        "Straight-In Landing",
        "Wake Turbulence Avoidance",
        "Wind Shear Avoidance",
        "Land and Hold Short Operations (LAHSO)",
      ],
    },
    "Stage 3": {
      "ATC Clearances and Procedures": [
        "Clearance Copying and Readback",
        "Compliance with ATC Clearances — Departure, Enroute, Arrival, Approach",
        "Holding Procedures",
      ],
      "Preflight Procedures": [
        "GPS Programming",
        "VOR Equipment Operation",
      ],
      "Navigation Systems (Full and Partial Panel)": [
        "GPS Course Interception and Tracking",
        "VOR Radial Interception and Tracking",
        "Localizer Course Interception and Tracking",
        "Intercepting and Tracking DME Arcs",
        "Autopilot Use for Navigation, if Equipped",
        "Standard Instrument Departure (SID)",
        "Obstacle Departure Procedure (ODP)",
        "Standard Terminal Arrival (STAR)",
        "Checklist Use",
        "Radio Communications",
        "ATC Services",
        "Use of Flight Deck Displays — Weather and Aeronautical Information",
      ],
      "Instrument Approach Procedures": [
        "ILS Approaches",
        "RNAV (GPS) Approaches",
        "Localizer Approaches",
        "VOR and VOR/DME Approaches",
        "Procedure Turn/Course Reversal",
        "Terminal Arrival Area (TAA)",
        "Vectors to the Approach Course",
        "Approach Procedure to Straight-In or Circling Landing Minimums",
        "Circling Approach",
        "Missed Approach",
        "Straight-In Landing",
        "Wake Turbulence Avoidance",
        "Wind Shear Avoidance",
        "Land and Hold Short Operations (LAHSO)",
      ],
      "Emergency Operations": [
        "Loss of Communications",
        "Systems and Equipment Malfunctions",
        "Loss of Primary Flight Instrument Indicators",
        "Airframe and Powerplant Icing",
        "Low Fuel Supply",
        "Engine Failure",
        "Partial Panel ILS Approaches",
        "Partial Panel RNAV (GPS) Approaches",
        "Partial Panel Localizer Approaches",
        "Partial Panel VOR and VOR/DME Approaches",
      ],
    },
  },
  CAX: {
    "Stage 0": {
      "Preflight Preparation": [
        "Slow Flight",
        "Power-Off Stalls",
        "Power-On Stalls",
        "Accelerated Stalls",
        "Steep Turns",
        "Chandelles",
        "Lazy Eights",
        "Steep Spiral",
        "Eights-On-Pylons",
        "Soft-Field Takeoff and Climb",
        "Soft-Field Approach and Landing",
        "Short-Field Takeoff and Maximum Performance Climb",
        "Short-Field Approach and Landing",
        "Power off 180° approaches and landings",
        "Describe standard entry into a traffic pattern as well as the steps to fly a normal traffic pattern.",
      ],
    },
    "Stage 1": {
      "Preflight Procedures": [
        "Self-Assessment",
        "Preflight Inspection",
        "Flight Deck Management",
        "Engine Starting",
        "Taxiing",
        "Before Takeoff Check/Run up",
      ],
      "Navigation": [
        "Pilotage and Dead Reckoning",
        "Lost Procedures",
        "Diversion",
        "Navigation Systems and Radar Services",
        "VOR Radial Interception and Tracking",
        "GPS Course Interception and Tracking",
        "Use of ATC Services",
        "Autopilot Use for Navigation, if Equipped",
      ],
      "Cross-Country Procedures": [
        "Collision Avoidance",
        "Flight Deck Management",
        "Power Settings and Mixture Control",
        "CFIT Awareness",
        "Estimating Visibility in Flight",
        "Flight on Federal Airways",
        "Opening and Closing Flight Plan",
      ],
      "Airport Operations": [
        "Radio Communications",
        "Lost Communication Procedures/ATC Light Signals",
        "Airport, Runway, and Taxiway Signs, Markings, and Lighting",
        "Traffic Patterns",
        "Runway Incursion Avoidance",
        "Wake Turbulence Avoidance",
        "Wind Shear Avoidance",
        "Land and Hold Short Operations (LAHSO)",
      ],
      "Slow Flight and Stalls": [
        "Maneuvering During Slow Flight",
        "Power-Off Stalls",
        "Power-On Stalls",
        "Accelerated Stalls",
      ],
      "Performance Maneuvers": [
        "Steep Turns",
        "Rejected Takeoff",
        "Go-Around/Rejected Landing",
        "Forward Slip to a Landing",
        "Power off 180° approaches and landings",
        "Soft-Field Takeoff and Climb",
        "Soft-Field Approach and Landing",
        "Short-Field Takeoff and Maximum Performance Climb",
        "Short-Field Approach and Landing",
      ],
      "Emergency Operations": [
        "Systems and Equipment Malfunctions",
        "Emergency Descent",
        "Emergency Approach and Landing (Simulated)",
        "Emergency Equipment and Survival Gear",
      ],
      "Postflight Procedures": [
        "After Landing, Parking, and Securing",
      ],
    },
    "Stage 2": {
      "Preflight Procedures": [
        "Self-Assessment",
        "Preflight Inspection",
        "Flight Deck Management",
        "Engine Starting",
        "Taxiing",
        "Before Takeoff Check/Runup",
      ],
      "Slow Flight and Stalls": [
        "Maneuvering During Slow Flight",
        "Power-Off Stalls",
        "Power-On Stalls",
        "Accelerated Stalls",
        "Spin Awareness",
      ],
      "Performance and Ground Reference Maneuvers": [
        "Steep Turns",
        "Chandelles",
        "Lazy Eights",
        "Eights-On-Pylons",
        "Steep Spiral",
      ],
      "Navigation": [
        "Pilotage and Dead Reckoning",
        "Navigation Systems and Radar Services",
        "Diversion",
        "Lost Procedures",
      ],
      "High Altitude Operations": [
        "Supplemental Oxygen Use",
        "Pressurization System Operation",
      ],
      "Airport Operations": [
        "Radio Communications",
        "Lost Communication Procedures/ATC Light Signals",
        "Airport, Runway, and Taxiway Signs, Markings, and Lighting",
        "Traffic Patterns",
        "Runway Incursion Avoidance",
        "Wake Turbulence Avoidance",
        "Wind Shear Avoidance",
        "Land and Hold Short Operations (LAHSO)",
      ],
      "Emergency Operations": [
        "Systems and Equipment Malfunctions",
        "Emergency Descent",
        "Emergency Approach and Landing (Simulated)",
        "Emergency Equipment and Survival Gear",
      ],
      "Takeoffs and Landings": [
        "Normal Takeoff and Climb",
        "Normal Approach and Landing",
        "Soft-Field Takeoff and Climb",
        "Soft-Field Approach and Landing",
        "Short-Field Takeoff and Maximum Performance Climb",
        "Short-Field Approach and Landing",
        "Power-Off 180 Accuracy Approach and Landing",
        "Go-Around/Rejected Landing",
      ],
    },
    "Stage 3": {
      "Preflight Preparation": [
        "Pilot Qualifications",
        "Airworthiness Requirements",
        "Weather Information",
        "Cross-Country Flight Planning",
        "National Airspace System",
        "Performance and Limitations",
        "Operation of Systems",
        "Human Factors",
      ],
      "Navigation": [
        "Pilotage and Dead Reckoning",
        "Navigation Systems and Radar Services",
        "Diversion",
        "Lost Procedures",
        "Navigation Log and Flight Plan Completion",
      ],
      "Slow Flight and Stalls": [
        "Maneuvering During Slow Flight",
        "Power-Off Stalls",
        "Power-On Stalls",
        "Accelerated Stalls",
        "Spin Awareness",
      ],
      "Performance and Ground Reference Maneuvers": [
        "Steep Turns",
        "Lazy Eights",
        "Eights-On-Pylons",
        "Steep Spiral",
        "Chandelles",
      ],
      "Takeoffs, Landings, and Go-Arounds": [
        "Soft-Field Takeoff and Climb",
        "Soft-Field Approach and Landing",
        "Short-Field Takeoff and Maximum Performance Climb",
        "Short-Field Approach and Landing",
        "Power-Off 180° Accuracy Approach and Landing",
        "Go-Around/Rejected Landing",
      ],
      "Postflight Debriefing": [
        "Critique maneuvers/procedures and SRM.",
        "Create a plan for skills that need improvement.",
        "Update the training record and logbook.",
      ],
      "Postflight Procedures": [
        "After Landing, Parking, and Securing",
      ],
      "Emergency Operations": [
        "Systems and Equipment Malfunctions",
        "Emergency Descent",
        "Emergency Approach and Landing (Simulated)",
        "Emergency Equipment and Survival Gear",
      ],
    },
  },
  CFII: {
    "Stage 1": {
      "ATC Clearances and Procedures": [
        "Clearance Copying and Readback",
        "Compliance with ATC Clearances — Departure, Enroute, Arrival, Approach",
        "Holding Procedures",
      ],
      "Preflight Procedures": [
        "GPS Programming",
        "VOR Equipment Operation",
      ],
      "Instrument Approach Procedures (Full and Partial Panel)": [
        "Instrument Cockpit Check",
        "Air Traffic Control Clearances",
        "Compliance with Departure, En Route, and Arrival Procedures and Clearances",
        "Straight and Level Flight",
        "Turns",
        "Change of Airspeed in Straight and Level and Turning Flight",
        "Constant Airspeed Climbs and Descents",
        "Timed Turns to Magnetic Compass Headings",
        "Steep Turns",
        "Recovery from Unusual Flight Attitudes",
        "Intercepting and Tracking Navigational Systems",
        "DME Arcs",
        "Holding Procedures",
        "Non-precision Instrument Approach",
        "Precision Instrument Approach",
        "Missed Approach",
        "Circling Approach",
        "Landing from a Straight-In Approach",
        "Checklist Use",
      ],
      "Emergency Operations": [
        "No-Gyro Radar Vectoring and Approach Procedures",
        "Partial-Panel Approach Procedures",
        "Loss of Communications",
        "Systems and Equipment Malfunctions",
        "Approach with Loss of Primary Flight Instrument Indicators",
      ],
    },
    "Stage 2": {
      "Preflight Briefing": [
        "Student-led briefing on the plan of action for the flight.",
      ],
      "Maneuvers Review": [
        "Instrument Cockpit Check",
        "Air Traffic Control Clearances",
        "Compliance with Departure, En Route, and Arrival Procedures and Clearances",
        "Straight and Level Flight",
        "Turns",
        "Change of Airspeed in Straight and Level and Turning Flight",
        "Constant Airspeed Climbs and Descents",
        "Timed Turns to Magnetic Compass Headings",
        "Steep Turns",
        "Recovery from Unusual Flight Attitudes",
        "Intercepting and Tracking Navigational Systems",
        "DME Arcs",
        "Holding Procedures",
        "Non-precision Instrument Approach",
        "Precision Instrument Approach",
        "Missed Approach",
        "Circling Approach",
        "Landing from a Straight-In Approach",
        "Loss of Communications",
        "Approach with Loss of Primary Flight Instrument Indicators",
      ],
    },
  },
};

// Shared snippet categories for the Notes tool. Every training type starts
// with the same three stored categories in this order: Maneuvers → Takeoffs
// → Landings. The ✈ Approach builder is the always-present first tab and is
// NOT a stored category — it's a special tab handled by the NotesSection
// component itself. Storage is still per-training-type so each can be
// customized separately.
const SHARED_SNIPPETS = {
  "Maneuvers": ["Maneuvering During Slow Flight","Power-Off Stalls","Power-On Stalls","Accelerated Stalls","Spin Awareness","Steep Turns","Chandelles","Lazy Eights","Eights-On-Pylons","Steep Spiral","Emergency Descent"],
  "Takeoffs": ["Normal Takeoff and Climb","Soft-Field Takeoff and Climb","Short-Field Takeoff and Maximum Performance Climb"],
  "Landings": ["Normal Approach and Landing","Soft-Field Approach and Landing","Short-Field Approach and Landing","Power-Off 180 Accuracy Approach and Landing","Go-Around/Rejected Landing"],
};
const DEFAULT_SNIPPETS = {
  IRA:  SHARED_SNIPPETS,
  CAX:  SHARED_SNIPPETS,
  CFII: SHARED_SNIPPETS,
};

// ─── Storage ──────────────────────────────────────────────────────────────────
const ls = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── Tools Registry ───────────────────────────────────────────────────────────
// The 6 tools that appear on the lesson page. Order can be customized in Settings.
// IDs are stable; display names can change.
const TOOLS = [
  { id: "hobbs",    name: "HOBBS & Time" },
  { id: "solar",    name: "Solar Information" },
  { id: "wind",     name: "Wind Component" },
  { id: "landings", name: "Landing Tracker" },
  { id: "imc",      name: "IMC Timer" },
  { id: "topics",   name: "Need to Cover" },
  { id: "notes",    name: "Notes" },
];
const DEFAULT_TOOL_ORDER = TOOLS.map(t => t.id);

function getToolOrder() {
  const saved = ls.get("cfi_tool_order", null);
  if (!Array.isArray(saved)) return DEFAULT_TOOL_ORDER;
  // Reconcile: keep saved order, append any new tools added since (so updates don't lose tools)
  const known = new Set(DEFAULT_TOOL_ORDER);
  const validSaved = saved.filter(id => known.has(id));
  const missing = DEFAULT_TOOL_ORDER.filter(id => !validSaved.includes(id));
  return [...validSaved, ...missing];
}
function getToolVisibility() {
  const saved = ls.get("cfi_tool_visible", null);
  if (!saved || typeof saved !== "object") {
    return Object.fromEntries(DEFAULT_TOOL_ORDER.map(id => [id, true]));
  }
  // Default any missing tool to visible
  const result = {};
  for (const id of DEFAULT_TOOL_ORDER) {
    result[id] = saved[id] === false ? false : true;
  }
  return result;
}

// Format stage with optional Retrain (RT) suffix.
// Accepts either a student object or stage+retrain values.
function stageLabel(stageOrObj, retrain) {
  if (typeof stageOrObj === "object" && stageOrObj !== null) {
    return stageLabel(stageOrObj.stage, stageOrObj.retrain);
  }
  if (!stageOrObj) return "";
  return retrain ? `${stageOrObj} RT` : stageOrObj;
}

// ─── Reusable Apple-style Card ────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: THEME.surface,
      borderRadius: 14,
      border: `1px solid ${THEME.border}`,
      overflow: "hidden",
      ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 600,
      color: THEME.textSecondary,
      letterSpacing: 0.3,
      textTransform: "uppercase",
      fontFamily: FONT_TEXT,
      padding: "0 4px 8px",
      ...style,
    }}>{children}</div>
  );
}

// ─── Student Selector ────────────────────────────────────────────────────────

// ─── Credit Badge ─────────────────────────────────────────────────────────────
// Reusable footer badge shown on the main pages (Student Selector + Lesson
// page) but skipped on secondary screens (History, Settings, etc.). Sits at
// the natural bottom of the page content — only visible when the user
// scrolls to the very end, like a traditional footer.
function CreditBadge() {
  return (
    <div style={{
      maxWidth: 580,
      marginLeft: "auto", marginRight: "auto",
      marginTop: 24,
      marginBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
      padding: "12px 16px",
      borderRadius: 14,
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      {/* Claude logo (Anthropic's mark) */}
      <svg viewBox="0 0 24 24" width="24" height="24" fill="#D97757" xmlns="http://www.w3.org/2000/svg" aria-label="Claude" style={{ flexShrink: 0 }}>
        <path d="M4.709 15.955l4.72-2.647.079-.23-.079-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.448.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.146-.103.018-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76.564-.34 2.205-1.064 1.353-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"/>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600,
          color: THEME.text, letterSpacing: -0.1,
          fontFamily: FONT_TEXT, lineHeight: 1.3,
        }}>Developed by Caleb Sanders</div>
        <div style={{
          fontSize: 11, color: THEME.textSecondary,
          fontFamily: FONT_TEXT, marginTop: 1, letterSpacing: -0.1,
        }}>AI Powered by Claude</div>
      </div>
    </div>
  );
}

function StudentSelector({ onSelect, onViewHistory, onOpenDayNight }) {
  const [students, setStudents] = useState(() => ls.get("cfi_students", []));
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("IRA");
  const [stage, setStage] = useState("");
  const [retrain, setRetrain] = useState(false);
  const [oneTime, setOneTime] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Count lessons per student for display
  function lessonCount(id) {
    return ls.get(`cfi_lessons_${id}`, []).length;
  }

  // Reset stage when training type changes
  function selectType(k) {
    setType(k);
    setStage("");
    setRetrain(false);
  }

  function create() {
    if (!name.trim() || !stage) return;
    const s = { id: Date.now().toString(), name: name.trim(), trainingType: type, stage, retrain, oneTime };
    if (!oneTime) { const u = [s, ...students]; setStudents(u); ls.set("cfi_students", u); }
    onSelect(s);
  }

  function del(id) {
    const u = students.filter(s => s.id !== id);
    setStudents(u); ls.set("cfi_students", u);
    // Also delete lesson archive
    try { localStorage.removeItem(`cfi_lessons_${id}`); } catch {}
    setConfirmDelete(null);
  }

  function resetForm() {
    setShowNew(false); setName(""); setStage(""); setRetrain(false); setOneTime(false); setType("IRA");
  }

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: FONT_TEXT, paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Branding header */}
      <div style={{ padding: "max(44px, calc(env(safe-area-inset-top, 0px) + 20px)) 24px 28px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 12px", borderRadius: 100,
          background: THEME.redDim, border: `1px solid ${THEME.red}40`,
          marginBottom: 20,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 6, background: THEME.red }} />
          <span style={{ fontSize: 11, color: THEME.red, fontWeight: 600, letterSpacing: 1.2, fontFamily: FONT_MONO }}>THRUST FLIGHT</span>
        </div>
        <h1 style={{
          margin: 0, fontSize: "clamp(28px, 6vw, 36px)",
          fontWeight: 700, letterSpacing: -0.8,
          fontFamily: FONT_DISPLAY,
          color: THEME.text,
        }}>Lesson Notes</h1>
        <p style={{ margin: "8px 0 0", color: THEME.textSecondary, fontSize: 16, fontWeight: 400 }}>
          Who are you flying with today?
        </p>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px" }}>
        {/* New student form */}
        {showNew ? (
          <Card style={{ padding: 20, marginBottom: 20 }}>
            <SectionLabel style={{ padding: "0 0 14px" }}>New Profile</SectionLabel>

            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && create()}
              placeholder="Student name" autoFocus
              style={{
                width: "100%", boxSizing: "border-box",
                background: THEME.surface2, border: `1px solid ${THEME.border}`,
                borderRadius: 11, padding: "13px 15px",
                color: THEME.text, fontSize: 16, fontFamily: FONT_TEXT,
                outline: "none", marginBottom: 14,
              }} />

            <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8, fontFamily: FONT_TEXT }}>
              Training
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {Object.entries(TRAINING_TYPES).map(([k, m]) => (
                <button key={k} onClick={() => selectType(k)} style={{
                  flex: 1, padding: "11px 4px", borderRadius: 10,
                  border: `1px solid ${type === k ? THEME.red : THEME.border}`,
                  background: type === k ? THEME.redDim : "transparent",
                  color: type === k ? THEME.red : THEME.textSecondary,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: FONT_TEXT, transition: "all 0.15s",
                }}>{k}</button>
              ))}
            </div>

            {/* Stage selector — appears once a training type is selected */}
            {type && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8, fontFamily: FONT_TEXT }}>
                  Stage
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                  {TRAINING_TYPES[type].stages.map(s => (
                    <button key={s} onClick={() => setStage(s)} style={{
                      flex: "1 1 auto", minWidth: 80, padding: "11px 10px", borderRadius: 10,
                      border: `1px solid ${stage === s ? THEME.red : THEME.border}`,
                      background: stage === s ? THEME.redDim : "transparent",
                      color: stage === s ? THEME.red : THEME.textSecondary,
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: FONT_TEXT, transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}>{s}</button>
                  ))}
                </div>
              </>
            )}

            {/* Retrain toggle — appears once stage is selected */}
            {stage && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11, background: retrain ? THEME.redDim : THEME.surface2, border: `1px solid ${retrain ? THEME.red + "60" : THEME.border}`, cursor: "pointer", marginBottom: 14, transition: "all 0.15s" }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: retrain ? "none" : `1.5px solid ${THEME.textQuaternary}`,
                  background: retrain ? THEME.red : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.15s",
                }}>
                  {retrain && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
                <input type="checkbox" checked={retrain} onChange={e => setRetrain(e.target.checked)} style={{ display: "none" }} />
                <div>
                  <div style={{ fontSize: 15, color: THEME.text, fontWeight: 500 }}>This is a retrain</div>
                  <div style={{ fontSize: 13, color: THEME.textSecondary, marginTop: 1 }}>Marks the lesson as a retrain (RT) of {stage}</div>
                </div>
              </label>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11, background: THEME.surface2, border: `1px solid ${THEME.border}`, cursor: "pointer", marginBottom: 14 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                border: oneTime ? "none" : `1.5px solid ${THEME.textQuaternary}`,
                background: oneTime ? THEME.red : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.15s",
              }}>
                {oneTime && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
              <input type="checkbox" checked={oneTime} onChange={e => setOneTime(e.target.checked)} style={{ display: "none" }} />
              <div>
                <div style={{ fontSize: 15, color: THEME.text, fontWeight: 500 }}>One-time student</div>
                <div style={{ fontSize: 13, color: THEME.textSecondary, marginTop: 1 }}>Won't be saved to your roster</div>
              </div>
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={create} disabled={!name.trim() || !stage} style={{
                flex: 1, padding: "13px",
                borderRadius: 11, border: "none",
                background: (name.trim() && stage) ? THEME.red : THEME.surface2,
                color: (name.trim() && stage) ? "#fff" : THEME.textTertiary,
                fontWeight: 600, fontSize: 15,
                cursor: (name.trim() && stage) ? "pointer" : "not-allowed",
                fontFamily: FONT_TEXT, letterSpacing: -0.2,
              }}>{oneTime ? "Start Flight" : "Save & Start"}</button>
              <button onClick={resetForm} style={{
                padding: "13px 18px", borderRadius: 11,
                background: THEME.surface2, border: `1px solid ${THEME.border}`,
                color: THEME.textSecondary, fontSize: 15, fontWeight: 500,
                cursor: "pointer", fontFamily: FONT_TEXT,
              }}>Cancel</button>
            </div>
          </Card>
        ) : (
          <button onClick={() => setShowNew(true)} style={{
            width: "100%", padding: "16px",
            borderRadius: 14, marginBottom: 12,
            background: THEME.red, border: "none",
            color: "#fff", fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: FONT_TEXT,
            letterSpacing: -0.2,
            boxShadow: `0 4px 20px ${THEME.redGlow}`,
          }}>+ New Student</button>
        )}

        {!showNew && (
          <button onClick={onOpenDayNight} style={{
            width: "100%", padding: "13px",
            borderRadius: 12, marginBottom: 20,
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            color: THEME.text, fontSize: 15, fontWeight: 500,
            cursor: "pointer", fontFamily: FONT_TEXT,
            letterSpacing: -0.2,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🌅</span>
              <span>Day / Night Calculator</span>
            </span>
            <span style={{ color: THEME.textQuaternary, fontSize: 17 }}>›</span>
          </button>
        )}

        {students.length > 0 && (
          <>
            <SectionLabel>Students</SectionLabel>
            <Card>
              {students.map((s, i) => {
                const count = lessonCount(s.id);
                return (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 16px",
                  borderBottom: i < students.length - 1 ? `0.5px solid ${THEME.separator}` : "none",
                }}>
                  <div onClick={() => onSelect(s)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 19,
                      background: THEME.redDim,
                      border: `1px solid ${THEME.red}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      color: THEME.red, fontWeight: 600, fontSize: 13,
                      fontFamily: FONT_TEXT, letterSpacing: -0.2,
                    }}>{s.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, color: THEME.text, fontWeight: 500, letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ fontSize: 13, color: THEME.textSecondary, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{s.trainingType}{s.stage ? ` · ${stageLabel(s)}` : ""}</span>
                        {count > 0 && (
                          <>
                            <span style={{ color: THEME.textQuaternary }}>·</span>
                            <span>{count} {count === 1 ? "lesson" : "lessons"}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {confirmDelete === s.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => del(s.id)} style={{ background: THEME.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "6px 11px", cursor: "pointer" }}>Delete</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textSecondary, fontSize: 12, padding: "6px 11px", cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      {count > 0 && (
                        <button onClick={() => onViewHistory(s)} title="View past lessons" style={{
                          background: "transparent",
                          border: `1px solid ${THEME.border}`,
                          borderRadius: 8, color: THEME.textSecondary,
                          fontSize: 13, fontWeight: 500,
                          padding: "6px 10px", cursor: "pointer",
                          fontFamily: FONT_TEXT, flexShrink: 0,
                        }}>History</button>
                      )}
                      <button onClick={() => setConfirmDelete(s.id)} style={{ background: "transparent", border: "none", color: THEME.textQuaternary, fontSize: 20, cursor: "pointer", padding: "4px 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
                    </>
                  )}
                </div>
              );})}
            </Card>
          </>
        )}
      </div>

      {/* Credit badge — fixed at bottom of screen */}
      <CreditBadge />
    </div>
  );
}

// ─── HOBBS Section (truly working calculator) ─────────────────────────────────

function HobbsSection({ data, setData }) {
  // data = { out, in_, total, calculatedField }
  // calculatedField: "out" | "in_" | "total" | null — which field was auto-calculated
  const [focusedField, setFocusedField] = useState(null);

  function update(field, value) {
    // Only allow numeric and decimal input (empty allowed for clearing)
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;

    let next = { ...data, [field]: value };

    // If user is clearing a field, also clear any field that was previously auto-calculated
    // (since its calculation depended on this field)
    if (value === "" && data.calculatedField) {
      next[data.calculatedField] = "";
      next.calculatedField = null;
    } else {
      next.calculatedField = null;
    }

    const out = parseFloat(next.out);
    const inn = parseFloat(next.in_);
    const tot = parseFloat(next.total);

    const hasOut = !isNaN(out), hasIn = !isNaN(inn), hasTot = !isNaN(tot);

    if (field === "out" && value !== "") {
      if (hasOut && hasIn) {
        next.total = (inn - out).toFixed(1);
        next.calculatedField = "total";
      } else if (hasOut && hasTot) {
        next.in_ = (out + tot).toFixed(1);
        next.calculatedField = "in_";
      }
    } else if (field === "in_" && value !== "") {
      if (hasOut && hasIn) {
        next.total = (inn - out).toFixed(1);
        next.calculatedField = "total";
      } else if (hasIn && hasTot) {
        next.out = (inn - tot).toFixed(1);
        next.calculatedField = "out";
      }
    } else if (field === "total" && value !== "") {
      if (hasOut && hasTot) {
        next.in_ = (out + tot).toFixed(1);
        next.calculatedField = "in_";
      } else if (hasIn && hasTot) {
        next.out = (inn - tot).toFixed(1);
        next.calculatedField = "out";
      }
    }

    setData(next);
  }

  const calcField = data.calculatedField;

  function makeFieldStyle(isCalculated) {
    return {
      width: "100%", boxSizing: "border-box",
      background: isCalculated ? THEME.redDim : THEME.surface2,
      border: `1.5px solid ${isCalculated ? THEME.red : THEME.border}`,
      borderRadius: 10, padding: "12px 10px",
      color: isCalculated ? THEME.red : THEME.text,
      fontSize: 18, fontWeight: 700,
      outline: "none", textAlign: "center",
      fontFamily: FONT_MONO, letterSpacing: -0.5,
      transition: "all 0.2s ease",
      boxShadow: isCalculated ? `0 0 0 4px ${THEME.redDim}` : "none",
    };
  }
  const labelStyle = {
    fontSize: 11, color: THEME.textSecondary,
    fontWeight: 600, marginBottom: 7, textAlign: "center",
    fontFamily: FONT_TEXT, letterSpacing: 0.2, textTransform: "uppercase",
    transition: "color 0.2s",
  };
  function makeLabelStyle(isCalculated) {
    return {
      ...labelStyle,
      color: isCalculated ? THEME.red : THEME.textSecondary,
    };
  }

  const fields = [
    { key: "out", label: "Out" },
    { key: "in_", label: "In" },
    { key: "total", label: "Total" },
  ];

  return (
    <Card style={{ padding: "16px 16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 12px" }}>
        <SectionLabel style={{ padding: 0 }}>HOBBS & Time</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {calcField && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600,
              color: THEME.red, fontFamily: FONT_TEXT,
              letterSpacing: 0.2, textTransform: "uppercase",
              animation: "fadeIn 0.3s ease",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 6, background: THEME.red, display: "inline-block" }} />
              Calculated
            </div>
          )}
          {(data.out || data.in_ || data.total) && (
            <button onClick={() => setData({ out: "", in_: "", total: "", calculatedField: null })} style={{
              background: "transparent", border: "none",
              color: THEME.red, fontSize: 14, fontWeight: 500,
              cursor: "pointer", padding: "2px 0", fontFamily: FONT_TEXT,
            }}>Clear All</button>
          )}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {fields.map(({ key, label }) => {
          const isCalc = calcField === key;
          const hasValue = data[key] !== "" && data[key] != null;
          const isFocused = focusedField === key;
          // Show × only when this field is focused AND has a value
          const showClear = isFocused && hasValue;
          return (
            <div key={key}>
              <div style={makeLabelStyle(isCalc)}>{label}</div>
              <div style={{ position: "relative" }}>
                <input
                  value={data[key]}
                  onChange={e => update(key, e.target.value)}
                  placeholder="—" inputMode="decimal"
                  style={{ ...makeFieldStyle(isCalc), paddingRight: showClear ? 30 : 10 }}
                  onFocus={e => { setFocusedField(key); if (!isCalc) e.target.style.borderColor = THEME.red; }}
                  onBlur={e => {
                    // Delay so tap on × can register before blur clears it
                    setTimeout(() => setFocusedField(curr => curr === key ? null : curr), 150);
                    if (!isCalc) e.target.style.borderColor = THEME.border;
                  }}
                />
                {showClear && (
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => update(key, "")}
                    style={{
                      position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                      background: isCalc ? `${THEME.red}30` : "rgba(255,255,255,0.12)",
                      border: "none", borderRadius: "50%",
                      width: 20, height: 20, padding: 0, cursor: "pointer",
                      color: isCalc ? THEME.red : THEME.textSecondary,
                      fontSize: 13, lineHeight: 1, fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    title="Clear">×</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: THEME.textTertiary, textAlign: "center", fontFamily: FONT_TEXT }}>
        {calcField
          ? `${calcField === "out" ? "Out" : calcField === "in_" ? "In" : "Total"} is auto-calculated — edit any field to override`
          : "Enter any two values — the third calculates automatically"}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </Card>
  );
}

// ─── Topic Picker ─────────────────────────────────────────────────────────────

function TopicPicker({ trainingType, stage, topics, setTopics, checked, setChecked }) {
  // Storage key is per training-type + stage so each combo has its own categorized topic map.
  // Value format: { "Category Name": ["Topic 1", "Topic 2"], ... }
  const masterKey = stage ? `cfi_topics_${trainingType}_${stage}` : `cfi_topics_${trainingType}`;

  const [open, setOpen] = useState(false);
  const [editMaster, setEditMaster] = useState(false);
  const [custom, setCustom] = useState("");
  const [newCatVal, setNewCatVal] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // category name currently being renamed
  const [editingCategoryVal, setEditingCategoryVal] = useState("");

  // Initial value: load from storage. If found as a flat array (legacy), migrate to { "General": [...] }.
  // If nothing stored, use the default map for this trainingType/stage combo.
  const [masterMap, setMasterMap] = useState(() => {
    const raw = stage ? localStorage.getItem(`cfi_topics_${trainingType}_${stage}`) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Migrate legacy flat array to a single-category map so nothing is lost
          return { "General": parsed };
        }
        if (parsed && typeof parsed === "object") return parsed;
      } catch {}
    }
    // Brand-new install for this combo — load from defaults
    const defaults = MASTER_TOPICS[trainingType] && MASTER_TOPICS[trainingType][stage];
    if (defaults) return defaults;
    return { "General": [] };
  });

  // Active category (which tab is selected) — defaults to the first category.
  // Special value CUSTOM_TAB ("__custom__") represents the always-pinned Custom presets tab.
  const CUSTOM_TAB = "__custom__";
  const categoryNames = Object.keys(masterMap);
  const [activeCategory, setActiveCategory] = useState(categoryNames[0] || null);

  // Presets — saved lists of topics specific to this training-type/stage combo.
  // Format: [{ id, name, topics: ["Topic A", "Topic B", ...] }, ...]
  const presetsKey = stage ? `cfi_presets_${trainingType}_${stage}` : `cfi_presets_${trainingType}`;
  const [presets, setPresets] = useState(() => ls.get(presetsKey, []));
  const [newPresetName, setNewPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [editingPresetName, setEditingPresetName] = useState("");
  // Pending preset to apply (waiting for user to choose Replace or Add)
  const [pendingPreset, setPendingPreset] = useState(null);
  // Topic about to be deleted from the picked list — shows inline Delete/Cancel buttons
  const [confirmRemoveTopic, setConfirmRemoveTopic] = useState(null);

  function savePresets(next) {
    setPresets(next);
    ls.set(presetsKey, next);
  }
  function saveCurrentAsPreset() {
    const name = newPresetName.trim();
    if (!name || topics.length === 0) { setNewPresetName(""); setShowSavePreset(false); return; }
    const next = [...presets, { id: Date.now().toString(), name, topics: [...topics] }];
    savePresets(next);
    setNewPresetName("");
    setShowSavePreset(false);
  }
  function deletePreset(id) {
    const p = presets.find(x => x.id === id);
    if (!p) return;
    if (!window.confirm(`Delete preset "${p.name}"?\n\nThis cannot be undone.`)) return;
    savePresets(presets.filter(x => x.id !== id));
  }
  function renamePreset(id, newName) {
    const trimmed = newName.trim();
    if (!trimmed) { setEditingPresetId(null); return; }
    savePresets(presets.map(p => p.id === id ? { ...p, name: trimmed } : p));
    setEditingPresetId(null);
  }
  function movePreset(idx, direction) {
    const next = [...presets];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    savePresets(next);
  }
  // Apply a preset's topics — either replacing the current selection or adding to it
  function applyPreset(preset, mode) {
    if (mode === "replace") {
      setTopics([...preset.topics]);
      // Clear "covered" state too, since those checkmarks belong to the old selection
      setChecked({});
    } else {
      // Add: dedupe but preserve current order, then append any new topics from the preset
      setTopics(prev => {
        const set = new Set(prev);
        const merged = [...prev];
        for (const t of preset.topics) {
          if (!set.has(t)) { merged.push(t); set.add(t); }
        }
        return merged;
      });
    }
    setPendingPreset(null);
  }

  // Keep activeCategory valid as categories are added/removed
  if (activeCategory && activeCategory !== CUSTOM_TAB && !categoryNames.includes(activeCategory) && categoryNames.length > 0) {
    // current active was deleted — switch to first available
    setActiveCategory(categoryNames[0]);
  } else if (!activeCategory && categoryNames.length > 0) {
    setActiveCategory(categoryNames[0]);
  }

  const currentList = (activeCategory && activeCategory !== CUSTOM_TAB && masterMap[activeCategory]) || [];

  function saveMap(next) {
    setMasterMap(next);
    ls.set(masterKey, next);
  }

  function toggle(t) {
    setTopics(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);
  }
  function toggleCheck(t) { setChecked(c => ({ ...c, [t]: !c[t] })); }

  function addTopic() {
    if (!custom.trim() || !activeCategory) return;
    const v = custom.trim();
    const list = masterMap[activeCategory] || [];
    if (!list.includes(v)) {
      saveMap({ ...masterMap, [activeCategory]: [...list, v] });
    }
    if (!topics.includes(v)) setTopics(ts => [...ts, v]);
    setCustom("");
  }
  function removeTopic(t) {
    if (!activeCategory) return;
    const list = masterMap[activeCategory] || [];
    saveMap({ ...masterMap, [activeCategory]: list.filter(x => x !== t) });
    // Also deselect from current lesson if it was there
    setTopics(ts => ts.filter(x => x !== t));
  }

  function addCategory() {
    const v = newCatVal.trim();
    if (!v || masterMap[v]) { setNewCatVal(""); setShowAddCategory(false); return; }
    saveMap({ ...masterMap, [v]: [] });
    setActiveCategory(v);
    setNewCatVal("");
    setShowAddCategory(false);
  }
  function deleteCategory(name) {
    if (!window.confirm(`Delete the "${name}" category and all its topics?\n\nThis cannot be undone.`)) return;
    const next = { ...masterMap };
    delete next[name];
    saveMap(next);
    // Switch to first remaining category
    const remaining = Object.keys(next);
    setActiveCategory(remaining[0] || null);
  }
  function renameCategory(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || masterMap[trimmed]) {
      setEditingCategory(null);
      return;
    }
    // Preserve order by rebuilding the object key-by-key
    const next = {};
    Object.keys(masterMap).forEach(k => {
      next[k === oldName ? trimmed : k] = masterMap[k];
    });
    saveMap(next);
    if (activeCategory === oldName) setActiveCategory(trimmed);
    setEditingCategory(null);
  }
  function moveCategory(idx, direction) {
    // Swap the category at `idx` with its neighbor at `idx + direction` (−1 = up, +1 = down)
    const keys = Object.keys(masterMap);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= keys.length) return;
    [keys[idx], keys[targetIdx]] = [keys[targetIdx], keys[idx]];
    // Rebuild the object in the new key order so iteration preserves the reorder
    const next = {};
    keys.forEach(k => { next[k] = masterMap[k]; });
    saveMap(next);
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: open || topics.length ? `0.5px solid ${THEME.separator}` : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: THEME.text, letterSpacing: -0.3, fontFamily: FONT_DISPLAY }}>Need to Cover</span>
          {topics.length > 0 && (
            <span style={{ background: THEME.redDim, color: THEME.red, fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 10, fontFamily: FONT_MONO }}>{topics.length}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {open && (
            <button onClick={() => setEditMaster(m => !m)} style={{
              background: "transparent", border: "none",
              color: editMaster ? THEME.red : THEME.textSecondary,
              fontSize: 15, fontWeight: 500, cursor: "pointer", padding: "4px 0",
              fontFamily: FONT_TEXT,
            }}>{editMaster ? "Done" : "Edit"}</button>
          )}
          <button onClick={() => { setOpen(o => !o); if (open) { setEditMaster(false); setShowAddCategory(false); setEditingCategory(null); } }} style={{
            background: "transparent", border: "none",
            color: THEME.red, fontSize: 15, fontWeight: 500,
            cursor: "pointer", fontFamily: FONT_TEXT, padding: "4px 0",
          }}>{open ? "Close" : (topics.length ? "Edit Picks" : "Add")}</button>
        </div>
      </div>

      {open && (
        <div style={{ padding: "12px 0 14px", borderBottom: topics.length ? `0.5px solid ${THEME.separator}` : "none", background: "rgba(255,255,255,0.015)" }}>
          {stage && (
            <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textTertiary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8, fontFamily: FONT_TEXT, padding: "0 16px" }}>
              Topics for {trainingType} · {stage}
            </div>
          )}

          {/* Category tabs (horizontal scroll, like Notes snippets).
              Styled differently from topic chips: smaller, uppercase, letter-spaced,
              with a bottom-border indicator instead of full pill fill, so the
              visual hierarchy is clear: categories = navigation, topics = content.
              touch-action: pan-x locks the scroll to horizontal only, preventing
              tiny vertical shifts during a swipe. align-items: stretch ensures
              every tab has the exact same height as its tallest sibling. */}
          <div style={{
            display: "flex", gap: 4, padding: "0 16px 0", overflowX: "auto",
            overflowY: "hidden", scrollbarWidth: "none",
            flexWrap: editMaster ? "wrap" : "nowrap",
            alignItems: editMaster ? "stretch" : "flex-end",
            touchAction: "pan-x",
            WebkitOverflowScrolling: "touch",
            borderBottom: editMaster ? "none" : `0.5px solid ${THEME.separator}`,
          }}>
            {/* Pinned Custom tab — always first, never editable/deletable */}
            {(() => {
              const active = activeCategory === CUSTOM_TAB;
              return (
                <div key={CUSTOM_TAB} style={{
                  display: "inline-flex", alignItems: "center",
                  borderBottom: active && !editMaster ? `2px solid ${THEME.red}` : "2px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap", flexShrink: 0,
                  background: active ? `${THEME.red}12` : "transparent",
                  borderRadius: 6,
                }}>
                  <button onClick={() => setActiveCategory(CUSTOM_TAB)} style={{
                    background: "transparent", border: "none",
                    color: active ? THEME.red : THEME.textSecondary,
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                    textTransform: "uppercase",
                    padding: "10px 12px",
                    cursor: "pointer", fontFamily: FONT_TEXT,
                    display: "inline-flex", alignItems: "center", gap: 4,
                    transition: "color 0.12s",
                  }}>
                    <span style={{ fontSize: 12, color: active ? THEME.red : "#f5b400" }}>★</span>
                    <span>Custom</span>
                    {presets.length > 0 && (
                      <span style={{
                        background: active ? THEME.red : THEME.surface2,
                        color: active ? "#fff" : THEME.textSecondary,
                        fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO,
                        padding: "1px 6px", borderRadius: 8,
                        marginLeft: 2,
                      }}>{presets.length}</span>
                    )}
                  </button>
                </div>
              );
            })()}
            {categoryNames.map((cat, idx) => {
              const active = cat === activeCategory;
              const isRenaming = editingCategory === cat;
              if (isRenaming) {
                return (
                  <input key={cat} autoFocus value={editingCategoryVal}
                    onChange={e => setEditingCategoryVal(e.target.value)}
                    onBlur={() => renameCategory(cat, editingCategoryVal)}
                    onKeyDown={e => {
                      if (e.key === "Enter") renameCategory(cat, editingCategoryVal);
                      if (e.key === "Escape") setEditingCategory(null);
                    }}
                    style={{
                      background: THEME.surface2, border: `1px solid ${THEME.red}`,
                      borderRadius: 6, padding: "5px 10px",
                      fontSize: 11, fontWeight: 700, color: THEME.text, letterSpacing: 0.4,
                      fontFamily: FONT_TEXT, minWidth: 110, outline: "none",
                      textTransform: "uppercase",
                    }} />
                );
              }
              return (
                <div key={cat} style={{
                  display: "inline-flex", alignItems: "center",
                  borderBottom: active && !editMaster ? `2px solid ${THEME.red}` : "2px solid transparent",
                  marginBottom: -1, // collapse onto the container's border
                  whiteSpace: "nowrap", flexShrink: 0,
                  background: editMaster && active ? `${THEME.red}12` : "transparent",
                  borderRadius: editMaster ? 6 : 0,
                }}>
                  {/* In edit mode: up/down arrows for reorder appear BEFORE the category name */}
                  {editMaster && (
                    <>
                      <button onClick={() => moveCategory(idx, -1)} disabled={idx === 0} aria-label="Move category up" style={{
                        background: "transparent", border: "none",
                        color: idx === 0 ? THEME.textQuaternary : THEME.text,
                        fontSize: 10, fontWeight: 700,
                        cursor: idx === 0 ? "default" : "pointer",
                        padding: "8px 3px 8px 6px", lineHeight: 1, opacity: idx === 0 ? 0.3 : 0.8,
                        fontFamily: FONT_MONO,
                      }}>▲</button>
                      <button onClick={() => moveCategory(idx, 1)} disabled={idx === categoryNames.length - 1} aria-label="Move category down" style={{
                        background: "transparent", border: "none",
                        color: idx === categoryNames.length - 1 ? THEME.textQuaternary : THEME.text,
                        fontSize: 10, fontWeight: 700,
                        cursor: idx === categoryNames.length - 1 ? "default" : "pointer",
                        padding: "8px 3px", lineHeight: 1, opacity: idx === categoryNames.length - 1 ? 0.3 : 0.8,
                        fontFamily: FONT_MONO,
                      }}>▼</button>
                    </>
                  )}
                  <button onClick={() => {
                    if (editMaster && active) {
                      // Already-active tab in edit mode: start renaming
                      setEditingCategory(cat);
                      setEditingCategoryVal(cat);
                    } else {
                      setActiveCategory(cat);
                    }
                  }} style={{
                    background: "transparent", border: "none",
                    color: active ? THEME.red : THEME.textTertiary,
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                    textTransform: "uppercase",
                    padding: editMaster ? "9px 6px 9px 6px" : "10px 12px",
                    cursor: "pointer", fontFamily: FONT_TEXT,
                    transition: "color 0.12s",
                  }}>{cat}</button>
                  {editMaster && (
                    <button onClick={() => deleteCategory(cat)} title="Delete category" style={{
                      background: "transparent", border: "none",
                      color: active ? THEME.red : THEME.textTertiary,
                      fontSize: 14, lineHeight: 1, padding: "8px 10px 8px 4px",
                      cursor: "pointer", opacity: 0.7,
                    }}>×</button>
                  )}
                </div>
              );
            })}
            {editMaster && !showAddCategory && (
              <button onClick={() => setShowAddCategory(true)} style={{
                background: "transparent", border: `1px dashed ${THEME.border}`,
                borderRadius: 6, color: THEME.textSecondary,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
                padding: "7px 12px", marginBottom: 2,
                cursor: "pointer", fontFamily: FONT_TEXT, flexShrink: 0,
              }}>+ Category</button>
            )}
            {editMaster && showAddCategory && (
              <input autoFocus value={newCatVal}
                onChange={e => setNewCatVal(e.target.value)}
                onBlur={() => { addCategory(); }}
                onKeyDown={e => {
                  if (e.key === "Enter") addCategory();
                  if (e.key === "Escape") { setNewCatVal(""); setShowAddCategory(false); }
                }}
                placeholder="CATEGORY NAME"
                style={{
                  background: THEME.surface2, border: `1px solid ${THEME.red}`,
                  borderRadius: 6, padding: "5px 10px", marginBottom: 2,
                  fontSize: 11, fontWeight: 700, color: THEME.text, letterSpacing: 0.4,
                  fontFamily: FONT_TEXT, minWidth: 130, outline: "none",
                  textTransform: "uppercase",
                  flexShrink: 0,
                }} />
            )}
          </div>

          {/* Custom tab body — preset management UI */}
          {activeCategory === CUSTOM_TAB && (
            <div style={{ padding: "14px 16px 0" }}>
              <div style={{
                fontSize: 12, color: THEME.textSecondary, fontFamily: FONT_TEXT,
                marginBottom: 12, lineHeight: 1.45,
              }}>
                Save your current selection as a named preset and recall it instantly on future lessons.
              </div>

              {/* Save current as preset */}
              {!showSavePreset && (
                <button onClick={() => {
                  if (topics.length === 0) {
                    window.alert("Pick some topics from the other tabs first, then come back to save them as a preset.");
                    return;
                  }
                  setShowSavePreset(true);
                }} style={{
                  width: "100%", padding: "11px",
                  background: THEME.red, border: "none",
                  borderRadius: 11, color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: FONT_TEXT, marginBottom: 14,
                  boxShadow: `0 2px 12px ${THEME.redGlow}`,
                }}>+ Save Current ({topics.length}) as Preset</button>
              )}
              {showSavePreset && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <input autoFocus value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") saveCurrentAsPreset();
                      if (e.key === "Escape") { setNewPresetName(""); setShowSavePreset(false); }
                    }}
                    placeholder={`Preset name (capturing ${topics.length} topic${topics.length === 1 ? "" : "s"})`}
                    style={{
                      flex: 1, background: THEME.surface2, border: `1px solid ${THEME.red}`,
                      borderRadius: 10, padding: "10px 13px",
                      color: THEME.text, fontSize: 14, fontFamily: FONT_TEXT, outline: "none",
                    }} />
                  <button onClick={saveCurrentAsPreset} style={{
                    background: THEME.red, border: "none", borderRadius: 10,
                    color: "#fff", fontWeight: 600, fontSize: 18,
                    width: 42, cursor: "pointer",
                  }}>✓</button>
                  <button onClick={() => { setNewPresetName(""); setShowSavePreset(false); }} style={{
                    background: THEME.surface2, border: `1px solid ${THEME.border}`,
                    borderRadius: 10, color: THEME.textSecondary,
                    fontWeight: 600, fontSize: 14, padding: "0 12px", cursor: "pointer",
                  }}>×</button>
                </div>
              )}

              {/* Preset list */}
              {presets.length === 0 ? (
                <div style={{
                  padding: "24px 16px", textAlign: "center",
                  border: `1px dashed ${THEME.border}`, borderRadius: 11,
                  color: THEME.textTertiary, fontSize: 13, fontFamily: FONT_TEXT,
                  fontStyle: "italic", lineHeight: 1.5,
                }}>
                  No presets yet. Pick topics from the other tabs,<br />then come back here to save them.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                  {presets.map((p, idx) => {
                    const isRenaming = editingPresetId === p.id;
                    return (
                      <div key={p.id} style={{
                        background: THEME.surface2, border: `1px solid ${THEME.border}`,
                        borderRadius: 10, padding: "10px 12px",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <span style={{ fontSize: 14, color: "#f5b400" }}>★</span>
                        {isRenaming ? (
                          <input autoFocus value={editingPresetName}
                            onChange={e => setEditingPresetName(e.target.value)}
                            onBlur={() => renamePreset(p.id, editingPresetName)}
                            onKeyDown={e => {
                              if (e.key === "Enter") renamePreset(p.id, editingPresetName);
                              if (e.key === "Escape") setEditingPresetId(null);
                            }}
                            style={{
                              flex: 1, background: THEME.bg, border: `1px solid ${THEME.red}`,
                              borderRadius: 7, padding: "5px 9px",
                              color: THEME.text, fontSize: 14, fontFamily: FONT_TEXT,
                              fontWeight: 600, outline: "none",
                            }} />
                        ) : (
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 600, color: THEME.text,
                              fontFamily: FONT_TEXT, letterSpacing: -0.2,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{p.name}</div>
                            <div style={{
                              fontSize: 11, color: THEME.textTertiary,
                              fontFamily: FONT_MONO, marginTop: 1,
                            }}>{p.topics.length} topic{p.topics.length === 1 ? "" : "s"}</div>
                          </div>
                        )}

                        {editMaster ? (
                          <>
                            <button onClick={() => movePreset(idx, -1)} disabled={idx === 0} aria-label="Move up" style={{
                              background: idx === 0 ? "transparent" : THEME.bg,
                              border: `0.5px solid ${THEME.border}`, borderRadius: 6,
                              color: idx === 0 ? THEME.textQuaternary : THEME.text,
                              fontSize: 11, fontWeight: 700,
                              cursor: idx === 0 ? "default" : "pointer",
                              padding: "5px 9px", lineHeight: 1, opacity: idx === 0 ? 0.4 : 1,
                              fontFamily: FONT_MONO, flexShrink: 0,
                            }}>▲</button>
                            <button onClick={() => movePreset(idx, 1)} disabled={idx === presets.length - 1} aria-label="Move down" style={{
                              background: idx === presets.length - 1 ? "transparent" : THEME.bg,
                              border: `0.5px solid ${THEME.border}`, borderRadius: 6,
                              color: idx === presets.length - 1 ? THEME.textQuaternary : THEME.text,
                              fontSize: 11, fontWeight: 700,
                              cursor: idx === presets.length - 1 ? "default" : "pointer",
                              padding: "5px 9px", lineHeight: 1, opacity: idx === presets.length - 1 ? 0.4 : 1,
                              fontFamily: FONT_MONO, flexShrink: 0,
                            }}>▼</button>
                            <button onClick={() => { setEditingPresetId(p.id); setEditingPresetName(p.name); }} aria-label="Rename" style={{
                              background: "transparent", border: `0.5px solid ${THEME.border}`,
                              borderRadius: 6, color: THEME.textSecondary,
                              fontSize: 11, fontWeight: 600,
                              padding: "5px 9px", cursor: "pointer", fontFamily: FONT_TEXT,
                              flexShrink: 0,
                            }}>Edit</button>
                            <button onClick={() => deletePreset(p.id)} aria-label="Delete" style={{
                              background: "transparent", border: `0.5px solid ${THEME.red}40`,
                              borderRadius: 6, color: THEME.red,
                              fontSize: 14, lineHeight: 1, padding: "5px 9px",
                              cursor: "pointer", flexShrink: 0,
                            }}>×</button>
                          </>
                        ) : (
                          <button onClick={() => setPendingPreset(p)} style={{
                            background: THEME.red, border: "none", borderRadius: 8,
                            color: "#fff", fontSize: 12, fontWeight: 600,
                            padding: "6px 12px", cursor: "pointer", fontFamily: FONT_TEXT,
                            flexShrink: 0, letterSpacing: -0.1,
                          }}>Load</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Replace / Add prompt */}
              {pendingPreset && (
                <div style={{
                  marginTop: 12, padding: "12px 14px",
                  background: `${THEME.red}10`, border: `1px solid ${THEME.red}50`,
                  borderRadius: 11,
                }}>
                  <div style={{ fontSize: 13, color: THEME.text, fontFamily: FONT_TEXT, marginBottom: 10, lineHeight: 1.45 }}>
                    Load <span style={{ fontWeight: 600 }}>"{pendingPreset.name}"</span> ({pendingPreset.topics.length} topic{pendingPreset.topics.length === 1 ? "" : "s"})?
                    {topics.length > 0 && <> You currently have <span style={{ fontWeight: 600 }}>{topics.length}</span> selected.</>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => applyPreset(pendingPreset, "replace")} style={{
                      flex: 1, background: THEME.red, border: "none", borderRadius: 9,
                      color: "#fff", fontSize: 13, fontWeight: 600,
                      padding: "9px", cursor: "pointer", fontFamily: FONT_TEXT,
                    }}>Replace</button>
                    <button onClick={() => applyPreset(pendingPreset, "add")} style={{
                      flex: 1, background: THEME.surface2, border: `1px solid ${THEME.border}`,
                      borderRadius: 9, color: THEME.text, fontSize: 13, fontWeight: 600,
                      padding: "9px", cursor: "pointer", fontFamily: FONT_TEXT,
                    }}>Add</button>
                    <button onClick={() => setPendingPreset(null)} style={{
                      background: "transparent", border: `1px solid ${THEME.border}`,
                      borderRadius: 9, color: THEME.textSecondary, fontSize: 13, fontWeight: 500,
                      padding: "9px 14px", cursor: "pointer", fontFamily: FONT_TEXT,
                    }}>Cancel</button>
                  </div>
                </div>
              )}

              {editMaster && presets.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic" }}>
                  Use ▲▼ to reorder · Tap Edit to rename · Tap × to delete
                </div>
              )}
            </div>
          )}

          {/* Topics for the active (regular) category */}
          {activeCategory && activeCategory !== CUSTOM_TAB && (
            <div style={{ padding: "14px 16px 0" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {currentList.map((t, i) => {
                  const on = topics.includes(t);
                  if (editMaster) {
                    return (
                      <div key={i} style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: THEME.surface2,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 100,
                        padding: "5px 4px 5px 12px",
                        fontSize: 13, fontFamily: FONT_TEXT, fontWeight: 500,
                        color: THEME.textSecondary,
                      }}>
                        <span>{t}</span>
                        <button onClick={() => removeTopic(t)} title="Remove from list" style={{
                          background: THEME.redDim, border: `1px solid ${THEME.red}40`,
                          borderRadius: 100, color: THEME.red,
                          width: 22, height: 22, cursor: "pointer",
                          fontSize: 14, lineHeight: 1, padding: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>×</button>
                      </div>
                    );
                  }
                  return (
                    <button key={i} onClick={() => toggle(t)} style={{
                      background: on ? THEME.red : THEME.surface2,
                      border: `1px solid ${on ? THEME.red : THEME.border}`,
                      borderRadius: 100,
                      color: on ? "#fff" : THEME.textSecondary,
                      fontSize: 13, padding: "6px 12px",
                      cursor: "pointer", fontFamily: FONT_TEXT, fontWeight: 500,
                      transition: "all 0.12s",
                    }}>{on ? "✓ " : ""}{t}</button>
                  );
                })}
                {currentList.length === 0 && (
                  <div style={{ color: THEME.textTertiary, fontSize: 13, fontStyle: "italic", padding: "4px 2px", fontFamily: FONT_TEXT }}>
                    No topics in this category yet
                  </div>
                )}
              </div>
              {!editMaster && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={custom} onChange={e => setCustom(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTopic()}
                    placeholder={`Add topic to ${activeCategory}`}
                    style={{
                      flex: 1, background: THEME.surface2, border: `1px solid ${THEME.border}`,
                      borderRadius: 10, padding: "10px 13px",
                      color: THEME.text, fontSize: 14, fontFamily: FONT_TEXT, outline: "none",
                    }} />
                  <button onClick={addTopic} style={{
                    background: THEME.red, border: "none", borderRadius: 10,
                    color: "#fff", fontWeight: 600, fontSize: 18,
                    width: 42, cursor: "pointer",
                  }}>+</button>
                </div>
              )}
              {editMaster && (
                <div style={{ marginTop: 4, fontSize: 12, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic" }}>
                  Tap × to remove a topic · Tap an active category tab to rename it · Use ▲▼ to reorder categories
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected list with checkable circles */}
      {topics.length > 0 && (
        <div>
          {topics.map((t, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 16px",
              borderBottom: i < topics.length - 1 ? `0.5px solid ${THEME.separator}` : "none",
              opacity: checked[t] ? 0.45 : 1,
              transition: "opacity 0.2s",
            }}>
              <button onClick={() => toggleCheck(t)} style={{
                width: 22, height: 22, borderRadius: 11,
                border: checked[t] ? "none" : `1.5px solid ${THEME.textQuaternary}`,
                background: checked[t] ? THEME.green : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.15s", padding: 0,
              }}>
                {checked[t] && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </button>
              <span style={{
                flex: 1, fontSize: 15, color: THEME.text, fontFamily: FONT_TEXT,
                textDecoration: checked[t] ? "line-through" : "none",
                letterSpacing: -0.2,
              }}>{t}</span>
              {confirmRemoveTopic === t ? (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { toggle(t); setConfirmRemoveTopic(null); }} style={{ background: THEME.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "6px 11px", cursor: "pointer" }}>Delete</button>
                  <button onClick={() => setConfirmRemoveTopic(null)} style={{ background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textSecondary, fontSize: 12, padding: "6px 11px", cursor: "pointer" }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmRemoveTopic(t)} style={{
                  background: "transparent", border: "none", color: THEME.textQuaternary,
                  cursor: "pointer", fontSize: 19, padding: "0 4px", lineHeight: 1,
                }}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Approach Builder ────────────────────────────────────────────────────────

// Approach types config — some have minimums options, some don't
const APPROACH_CONFIG = {
  "ILS":      { mins: [] },
  "LOC":      { mins: [] },
  "RNAV":     { mins: ["LPV", "LNAV/VNAV", "LNAV", "LP"] },
  "VOR":      { mins: [] },
  "NDB":      { mins: [] },
  "Visual":   { mins: [] },
};
const APPROACH_TYPES = Object.keys(APPROACH_CONFIG);

function ApproachBuilder({ onInsert, editMode }) {
  const airportKey = "cfi_airports_used";
  const runwaysKey = "cfi_airport_runways"; // map of { ICAO: ["16","34",...] }
  const [airports, setAirports] = useState(() => ls.get(airportKey, []));
  const [airportRunways, setAirportRunways] = useState(() => ls.get(runwaysKey, {}));
  const [airport, setAirport] = useState("");
  const [runway, setRunway] = useState("");
  const [approachType, setApproachType] = useState("");
  const [minimums, setMinimums] = useState("");
  const [isCircling, setIsCircling] = useState(false);
  const [circleRunway, setCircleRunway] = useState("");

  function selectAirport(code) {
    setAirport(code);
  }

  // Suggested runways for the currently-typed/selected airport (if known)
  const currentCode = airport.trim().toUpperCase();
  const suggestedRunways = currentCode ? (airportRunways[currentCode] || []) : [];

  function selectApproachType(type) {
    setApproachType(type);
    setMinimums(""); // reset minimums when changing type
    setIsCircling(false);
    setCircleRunway("");
  }

  // Whether this approach type requires minimums to be selected
  const minsOptions = approachType ? (APPROACH_CONFIG[approachType]?.mins || []) : [];
  const requiresMins = minsOptions.length > 0;
  const minsReady = !requiresMins || !!minimums;
  // Circling toggle is only available for RNAV approaches
  // Circle-to capability is available on every approach type now (ILS, LOC, RNAV, VOR, NDB, Visual).
  const supportsCircling = !!approachType;
  const circlingReady = !isCircling || circleRunway.trim().length > 0;

  function buildAndInsert() {
    if (!airport.trim() || !runway.trim() || !approachType) return;
    if (requiresMins && !minimums) return;
    if (isCircling && !circleRunway.trim()) return;
    const code = airport.trim().toUpperCase();
    const rw = runway.trim().toUpperCase();
    const circleRw = circleRunway.trim().toUpperCase();
    // Save airport to history
    if (!airports.includes(code)) {
      const next = [code, ...airports].slice(0, 12);
      setAirports(next); ls.set(airportKey, next);
    } else {
      const next = [code, ...airports.filter(a => a !== code)].slice(0, 12);
      setAirports(next); ls.set(airportKey, next);
    }
    // Remember this runway for the airport (and the circle-to runway if used)
    const existingRwys = airportRunways[code] || [];
    const rwysToAdd = [rw];
    if (isCircling && supportsCircling && circleRw) rwysToAdd.push(circleRw);
    let nextRwys = [...existingRwys];
    for (const r of rwysToAdd) {
      if (!nextRwys.includes(r)) nextRwys.push(r);
    }
    // Sort numerically (01, 02, ..., 36) for tidy display
    nextRwys = nextRwys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    if (nextRwys.length !== existingRwys.length || nextRwys.some((r, i) => r !== existingRwys[i])) {
      const nextMap = { ...airportRunways, [code]: nextRwys };
      setAirportRunways(nextMap);
      ls.set(runwaysKey, nextMap);
    }
    // Build the formatted note
    let formatted;
    if (isCircling && supportsCircling) {
      // Circling format (any approach type): "ILS 18 circle 36 @ KADS"
      formatted = `${approachType} ${rw} circle ${circleRw} @ ${code}`;
    } else {
      // Standard: "ILS 16 @ KADS" or "RNAV 18 @ KTRL (LPV)"
      formatted = minimums
        ? `${approachType} ${rw} @ ${code} (${minimums})`
        : `${approachType} ${rw} @ ${code}`;
    }
    onInsert(formatted);
    // Reset all fields for the next approach
    setAirport("");
    setRunway("");
    setApproachType("");
    setMinimums("");
    setIsCircling(false);
    setCircleRunway("");
  }

  function removeAirport(code, e) {
    e.stopPropagation();
    const next = airports.filter(a => a !== code);
    setAirports(next); ls.set(airportKey, next);
    if (airport === code) setAirport("");
  }

  function moveAirport(idx, direction) {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= airports.length) return;
    const next = [...airports];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    setAirports(next); ls.set(airportKey, next);
  }

  const canInsert = airport.trim() && runway.trim() && approachType && minsReady && circlingReady;

  return (
    <div style={{ padding: "4px 16px 14px" }}>
      {/* Airport */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
          Airport
        </div>
        {/* Recent airports */}
        {airports.length > 0 && !editMode && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {airports.map(code => (
              <div key={code} style={{
                display: "inline-flex", alignItems: "center",
                background: airport === code ? THEME.red : THEME.surface2,
                border: `1px solid ${airport === code ? THEME.red : THEME.border}`,
                borderRadius: 100,
                overflow: "hidden",
              }}>
                <button onClick={() => selectAirport(code)} style={{
                  background: "transparent", border: "none",
                  color: airport === code ? "#fff" : THEME.textSecondary,
                  fontSize: 13, fontWeight: 600,
                  padding: "5px 12px",
                  cursor: "pointer", fontFamily: FONT_MONO,
                  letterSpacing: 0.3,
                }}>{code}</button>
              </div>
            ))}
          </div>
        )}
        {/* Edit mode: full-width rows with reorder buttons and delete */}
        {airports.length > 0 && editMode && (
          <div style={{
            display: "flex", flexDirection: "column", gap: 4, marginBottom: 8,
            background: THEME.surface2, border: `1px solid ${THEME.border}`,
            borderRadius: 9, overflow: "hidden", padding: 4,
          }}>
            {airports.map((code, idx) => (
              <div key={code} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 8px",
                background: THEME.surface,
                borderRadius: 7,
              }}>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700,
                  color: THEME.textSecondary, letterSpacing: 0.3,
                  flex: 1,
                }}>{code}</span>
                <button onClick={() => moveAirport(idx, -1)} disabled={idx === 0} aria-label="Move up" style={{
                  background: idx === 0 ? "transparent" : THEME.surface2,
                  border: `1px solid ${THEME.border}`, borderRadius: 6,
                  color: idx === 0 ? THEME.textQuaternary : THEME.text,
                  fontSize: 11, fontWeight: 700,
                  cursor: idx === 0 ? "default" : "pointer",
                  padding: "4px 8px", lineHeight: 1, opacity: idx === 0 ? 0.4 : 1,
                  fontFamily: FONT_MONO,
                }}>▲</button>
                <button onClick={() => moveAirport(idx, 1)} disabled={idx === airports.length - 1} aria-label="Move down" style={{
                  background: idx === airports.length - 1 ? "transparent" : THEME.surface2,
                  border: `1px solid ${THEME.border}`, borderRadius: 6,
                  color: idx === airports.length - 1 ? THEME.textQuaternary : THEME.text,
                  fontSize: 11, fontWeight: 700,
                  cursor: idx === airports.length - 1 ? "default" : "pointer",
                  padding: "4px 8px", lineHeight: 1, opacity: idx === airports.length - 1 ? 0.4 : 1,
                  fontFamily: FONT_MONO,
                }}>▼</button>
                <button onClick={(e) => removeAirport(code, e)} aria-label="Remove" style={{
                  background: "transparent", border: `1px solid ${THEME.border}`,
                  borderRadius: 6, color: THEME.textTertiary,
                  fontSize: 14, lineHeight: 1, padding: "3px 9px",
                  cursor: "pointer",
                }}>×</button>
              </div>
            ))}
          </div>
        )}
        <input value={airport} onChange={e => setAirport(e.target.value.toUpperCase())}
          placeholder="Airport code (e.g. KADS, KDFW)"
          style={{
            width: "100%", boxSizing: "border-box",
            background: THEME.surface2, border: `1px solid ${airport ? THEME.red : THEME.border}`,
            borderRadius: 10, padding: "10px 13px",
            color: THEME.text, fontSize: 14,
            fontFamily: FONT_MONO, letterSpacing: 0.3,
            outline: "none", transition: "border-color 0.15s",
          }} />
      </div>

      {/* Runway */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
          Runway
        </div>
        {/* Suggested runways for the selected/typed airport */}
        {suggestedRunways.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {suggestedRunways.map(rw => (
              <button key={rw} onClick={() => setRunway(rw)} style={{
                background: runway === rw ? THEME.red : THEME.surface2,
                border: `1px solid ${runway === rw ? THEME.red : THEME.border}`,
                color: runway === rw ? "#fff" : THEME.textSecondary,
                fontSize: 13, fontWeight: 600,
                padding: "4px 11px", borderRadius: 100,
                cursor: "pointer", fontFamily: FONT_MONO,
                letterSpacing: 0.3,
              }}>{rw}</button>
            ))}
          </div>
        )}
        <input value={runway}
          onChange={e => {
            // Strip all non-digits, max 2 chars (runways are 01-36)
            const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
            setRunway(digits);
          }}
          placeholder="Runway number (e.g. 16)"
          inputMode="numeric"
          pattern="[0-9]*"
          style={{
            width: "100%", boxSizing: "border-box",
            background: THEME.surface2, border: `1px solid ${runway ? THEME.red : THEME.border}`,
            borderRadius: 10, padding: "10px 13px",
            color: THEME.text, fontSize: 14,
            fontFamily: FONT_MONO, letterSpacing: 0.3,
            outline: "none", transition: "border-color 0.15s",
          }} />
      </div>

      {/* Approach type */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
          Approach Type
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {APPROACH_TYPES.map(t => (
            <button key={t} onClick={() => selectApproachType(t)} style={{
              background: approachType === t ? THEME.red : THEME.surface2,
              border: `1px solid ${approachType === t ? THEME.red : THEME.border}`,
              borderRadius: 100,
              color: approachType === t ? "#fff" : THEME.textSecondary,
              fontSize: 13, padding: "6px 13px",
              cursor: "pointer", fontFamily: FONT_TEXT, fontWeight: 600,
              transition: "all 0.12s",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Minimums (only if approach type requires them) */}
      {requiresMins && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
            Minimums Flown
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {minsOptions.map(m => (
              <button key={m} onClick={() => setMinimums(m)} style={{
                background: minimums === m ? THEME.red : THEME.surface2,
                border: `1px solid ${minimums === m ? THEME.red : THEME.border}`,
                borderRadius: 100,
                color: minimums === m ? "#fff" : THEME.textSecondary,
                fontSize: 13, padding: "6px 13px",
                cursor: "pointer", fontFamily: FONT_TEXT, fontWeight: 600,
                transition: "all 0.12s",
              }}>{m}</button>
            ))}
          </div>
        </div>
      )}

      {/* Circling toggle (only available for RNAV) */}
      {supportsCircling && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: isCircling ? THEME.redDim : THEME.surface2, border: `1px solid ${isCircling ? THEME.red + "60" : THEME.border}`, cursor: "pointer", transition: "all 0.15s" }}>
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              border: isCircling ? "none" : `1.5px solid ${THEME.textQuaternary}`,
              background: isCircling ? THEME.red : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}>
              {isCircling && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
            </div>
            <input type="checkbox" checked={isCircling} onChange={e => { setIsCircling(e.target.checked); if (!e.target.checked) setCircleRunway(""); }} style={{ display: "none" }} />
            <span style={{ fontSize: 14, color: THEME.text, fontWeight: 500, fontFamily: FONT_TEXT }}>Circling approach</span>
          </label>

          {isCircling && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
                Circle to Runway
              </div>
              {/* Suggested runways for circling — exclude the one already chosen as the approach runway */}
              {suggestedRunways.filter(r => r !== runway).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {suggestedRunways.filter(r => r !== runway).map(rw => (
                    <button key={rw} onClick={() => setCircleRunway(rw)} style={{
                      background: circleRunway === rw ? THEME.red : THEME.surface2,
                      border: `1px solid ${circleRunway === rw ? THEME.red : THEME.border}`,
                      color: circleRunway === rw ? "#fff" : THEME.textSecondary,
                      fontSize: 13, fontWeight: 600,
                      padding: "4px 11px", borderRadius: 100,
                      cursor: "pointer", fontFamily: FONT_MONO,
                      letterSpacing: 0.3,
                    }}>{rw}</button>
                  ))}
                </div>
              )}
              <input value={circleRunway}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setCircleRunway(digits);
                }}
                placeholder="Runway number (e.g. 18)"
                inputMode="numeric"
                pattern="[0-9]*"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: THEME.surface2, border: `1px solid ${circleRunway ? THEME.red : THEME.border}`,
                  borderRadius: 10, padding: "10px 13px",
                  color: THEME.text, fontSize: 14,
                  fontFamily: FONT_MONO, letterSpacing: 0.3,
                  outline: "none", transition: "border-color 0.15s",
                }} />
            </div>
          )}
        </div>
      )}

      {/* Preview + insert */}
      <div style={{
        background: canInsert ? THEME.redDim : THEME.surface2,
        border: `1px solid ${canInsert ? THEME.red + "60" : THEME.border}`,
        borderRadius: 10, padding: "12px 14px",
        marginBottom: 10,
        transition: "all 0.2s",
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: canInsert ? THEME.red : THEME.textTertiary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4, fontFamily: FONT_TEXT }}>
          Preview
        </div>
        <div style={{ fontSize: 15, color: canInsert ? THEME.text : THEME.textTertiary, fontFamily: FONT_TEXT, fontWeight: 500, letterSpacing: -0.2 }}>
          {canInsert
            ? (isCircling
                ? `${approachType} ${runway} circle ${circleRunway} @ ${airport.toUpperCase()}`
                : (minimums
                    ? `${approachType} ${runway} @ ${airport.toUpperCase()} (${minimums})`
                    : `${approachType} ${runway} @ ${airport.toUpperCase()}`))
            : (isCircling && !circleRunway
                ? "Enter circle-to runway"
                : (requiresMins && approachType && !minimums
                    ? "Select minimums to continue"
                    : "Fill all fields above"))}
        </div>
      </div>

      <button onClick={buildAndInsert} disabled={!canInsert} style={{
        width: "100%", padding: "12px",
        background: canInsert ? THEME.red : THEME.surface2,
        border: "none", borderRadius: 11,
        color: canInsert ? "#fff" : THEME.textTertiary,
        fontSize: 15, fontWeight: 600,
        cursor: canInsert ? "pointer" : "not-allowed",
        fontFamily: FONT_TEXT, letterSpacing: -0.2,
        boxShadow: canInsert ? `0 4px 16px ${THEME.redGlow}` : "none",
        transition: "all 0.2s",
      }}>+ Add Approach Note</button>
    </div>
  );
}

// ─── Notes Section ────────────────────────────────────────────────────────────

function NotesSection({ trainingType, notes, setNotes }) {
  const snippetKey = `cfi_snippets_${trainingType}`;

  const [snippets, setSnippets] = useState(() => ls.get(snippetKey, DEFAULT_SNIPPETS[trainingType]));
  // Default the active tab to "Approach" (the always-present approach builder tab).
  // It's the most commonly used and is always available regardless of training type.
  const [activeGroup, setActiveGroup] = useState("Approach");
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [newSnippetVal, setNewSnippetVal] = useState("");
  const [editingCategory, setEditingCategory] = useState(null); // category being renamed
  const [categoryEditVal, setCategoryEditVal] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [activeSubInputIdx, setActiveSubInputIdx] = useState(null); // which note is showing sub-bullet input
  const [subInputText, setSubInputText] = useState("");
  // Reorder mode — drag-and-drop is locked unless this is true
  const [reorderMode, setReorderMode] = useState(false);
  // Long-press drag state for reordering notes
  const [draggingIdx, setDraggingIdx] = useState(null); // index of the note being dragged
  const [dropTargetIdx, setDropTargetIdx] = useState(null); // where it would be dropped
  const [dragY, setDragY] = useState(0); // visual Y offset of the dragged item
  // Tracks "finger is down on a note, long-press timer is ticking" — drives the
  // effect below to attach the non-passive touchmove listener early so iOS
  // doesn't lock the gesture into a scroll.
  const [pressArmedIdx, setPressArmedIdx] = useState(null);
  const longPressTimerRef = useRef(null);
  const dragStartRef = useRef({ y: 0, scrollY: 0 });
  const noteRefsRef = useRef({}); // map of index → DOM node
  // Note about to be deleted — shows inline Delete/Cancel buttons
  const [confirmRemoveNote, setConfirmRemoveNote] = useState(null); // note index
  const [confirmRemoveSub, setConfirmRemoveSub] = useState(null); // { noteIdx, subIdx }

  const groups = ["Approach", ...Object.keys(snippets)];
  const isApproachTab = activeGroup === "Approach";
  const activeList = snippets[activeGroup] || [];

  // Normalize: notes can be strings (legacy) or {text, subs} objects
  function noteText(n) { return typeof n === "string" ? n : n.text; }
  function noteSubs(n) { return typeof n === "string" ? [] : (n.subs || []); }

  function addNote(text, isApproach = false) { setNotes(n => [...n, { text, subs: [], isApproach }]); }
  function removeNote(i) { setNotes(n => n.filter((_, idx) => idx !== i)); }
  function moveNote(fromIdx, toIdx) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    setNotes(n => {
      if (toIdx >= n.length) return n;
      const next = [...n];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  }

  // ─── Long-press drag-and-drop for note reordering ──────────────────────────
  // How it works:
  // 1. User presses + holds on a note (~400ms) → enters drag mode (haptic feedback)
  // 2. User drags up/down → we calculate which note they're hovering over
  // 3. User releases → we move the dragged note to that position
  function getNoteIndexAtY(clientY) {
    // Find which note position the user's finger is currently over.
    // CRITICAL: the dragging note has a transform applied (translateY + scale)
    // so its getBoundingClientRect() reports a SHIFTED position. We must
    // subtract that transform to get its stable, "original" position, otherwise
    // hit-testing breaks when dragging downward (the dragged row's rect moves
    // into the slot below, fooling the algorithm).
    const entries = Object.entries(noteRefsRef.current)
      .filter(([, el]) => !!el)
      .map(([idxStr, el]) => {
        const idx = parseInt(idxStr, 10);
        const rect = el.getBoundingClientRect();
        // Undo the visual offset on the dragging note so its rect represents
        // where it *would* be if it weren't being dragged.
        if (idx === draggingIdx) {
          return {
            idx,
            rect: {
              top: rect.top - dragY,
              bottom: rect.bottom - dragY,
            },
          };
        }
        return { idx, rect };
      })
      .sort((a, b) => a.rect.top - b.rect.top);
    if (entries.length === 0) return null;

    // Above the first note: snap to first
    if (clientY < entries[0].rect.top) return entries[0].idx;
    // Below the last note: snap to last
    const last = entries[entries.length - 1];
    if (clientY > last.rect.bottom) return last.idx;

    // Inside or between notes: find the row whose vertical range contains the cursor.
    // Fall back to the closest center if we're in a tiny gap between rows.
    let containing = null;
    let closest = null;
    let closestDist = Infinity;
    for (const e of entries) {
      if (clientY >= e.rect.top && clientY <= e.rect.bottom) {
        containing = e.idx;
        break;
      }
      const center = (e.rect.top + e.rect.bottom) / 2;
      const dist = Math.abs(clientY - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = e.idx;
      }
    }
    let target = containing != null ? containing : closest;
    // Never return the dragging note's index — pick an adjacent one instead so
    // the user always sees a drop indicator while dragging.
    if (target === draggingIdx) {
      // Pick the next-closest note that ISN'T the dragging one
      let alt = null;
      let altDist = Infinity;
      for (const e of entries) {
        if (e.idx === draggingIdx) continue;
        const center = (e.rect.top + e.rect.bottom) / 2;
        const dist = Math.abs(clientY - center);
        if (dist < altDist) { altDist = dist; alt = e.idx; }
      }
      target = alt != null ? alt : target;
    }
    return target;
  }

  function startLongPress(idx, clientY, e) {
    // Cancel any pending timer
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    dragStartRef.current = { y: clientY, scrollY: window.scrollY };
    // Mark this note as press-armed so the global touchmove listener attaches
    // immediately (before iOS decides this gesture is a scroll).
    setPressArmedIdx(idx);
    longPressTimerRef.current = setTimeout(() => {
      setDraggingIdx(idx);
      setDropTargetIdx(idx);
      setDragY(0);
      // Stronger haptic feedback on supported devices (iOS doesn't support vibrate, but Android does)
      if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
      longPressTimerRef.current = null;
    }, 350);
  }

  function cancelLongPress() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setPressArmedIdx(null);
  }

  function handleDragMove(clientY) {
    if (draggingIdx === null) return;
    setDragY(clientY - dragStartRef.current.y);
    const overIdx = getNoteIndexAtY(clientY);
    if (overIdx !== null && overIdx !== dropTargetIdx) {
      setDropTargetIdx(overIdx);
    }
  }

  function endDrag() {
    cancelLongPress();
    if (draggingIdx !== null && dropTargetIdx !== null && draggingIdx !== dropTargetIdx) {
      moveNote(draggingIdx, dropTargetIdx);
    }
    setDraggingIdx(null);
    setDropTargetIdx(null);
    setDragY(0);
  }

  // Global pointer/touch listeners while dragging or pre-drag.
  // CRITICAL: this effect must run as soon as a long-press timer is queued so the
  // touchmove listener with passive:false is attached BEFORE the user starts
  // moving their finger. Otherwise iOS Safari locks the gesture into scroll
  // mode and our preventDefault() calls are ignored.
  //
  // We track the "armed" state in React state (not a ref) so this effect re-runs
  // when a long-press is initiated.
  useEffect(() => {
    // Run if we're either actively dragging, OR a long-press has been "armed"
    // (user has finger down on a note in reorder mode). Attaching the listener
    // during the press-armed window ensures the non-passive touchmove can call
    // preventDefault() the moment the user moves their finger — preventing iOS
    // Safari from claiming the gesture as a page scroll.
    if (draggingIdx === null && pressArmedIdx === null) return;

    function onMove(e) {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      // If we haven't entered drag mode yet, cancel long-press if user moves significantly (scrolling)
      if (draggingIdx === null) {
        const dy = Math.abs(clientY - dragStartRef.current.y);
        if (dy > 12) {
          cancelLongPress();
          setPressArmedIdx(null);
        }
        return;
      }
      // Prevent scrolling while dragging — non-passive listener required for this to work on iOS
      if (e.cancelable) e.preventDefault();
      handleDragMove(clientY);
    }
    function onEnd() {
      if (draggingIdx !== null) endDrag();
      else cancelLongPress();
      setPressArmedIdx(null);
    }

    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    return () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingIdx, dropTargetIdx, pressArmedIdx]);

  function addSubBullet(noteIdx, subText) {
    setNotes(n => n.map((note, idx) => {
      if (idx !== noteIdx) return note;
      const obj = typeof note === "string" ? { text: note, subs: [] } : note;
      return { ...obj, subs: [...(obj.subs || []), subText] };
    }));
  }
  function removeSubBullet(noteIdx, subIdx) {
    setNotes(n => n.map((note, idx) => {
      if (idx !== noteIdx) return note;
      const obj = typeof note === "string" ? { text: note, subs: [] } : note;
      return { ...obj, subs: obj.subs.filter((_, si) => si !== subIdx) };
    }));
  }
  function addCustomNote() {
    if (!customNote.trim()) return;
    addNote(customNote.trim());
    setCustomNote("");
  }
  function saveSnippetEdit(group, idx, val) {
    const updated = { ...snippets, [group]: snippets[group].map((s, i) => i === idx ? val : s) };
    setSnippets(updated); ls.set(snippetKey, updated);
    setEditingIdx(null);
  }
  function deleteSnippet(group, idx) {
    const updated = { ...snippets, [group]: snippets[group].filter((_, i) => i !== idx) };
    setSnippets(updated); ls.set(snippetKey, updated);
  }
  function addSnippetToGroup(group) {
    if (!newSnippetVal.trim()) return;
    const updated = { ...snippets, [group]: [...(snippets[group] || []), newSnippetVal.trim()] };
    setSnippets(updated); ls.set(snippetKey, updated);
    setNewSnippetVal("");
  }
  function renameCategory(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || snippets[trimmed]) {
      setEditingCategory(null);
      return;
    }
    // Preserve order by rebuilding the object
    const updated = {};
    Object.keys(snippets).forEach(k => {
      updated[k === oldName ? trimmed : k] = snippets[k];
    });
    setSnippets(updated); ls.set(snippetKey, updated);
    if (activeGroup === oldName) setActiveGroup(trimmed);
    setEditingCategory(null);
  }
  function deleteCategory(name) {
    if (!window.confirm(`Delete the "${name}" category and all its snippets?`)) return;
    const updated = { ...snippets };
    delete updated[name];
    setSnippets(updated); ls.set(snippetKey, updated);
    if (activeGroup === name) setActiveGroup("Approach");
  }
  function addCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed || snippets[trimmed]) return;
    const updated = { ...snippets, [trimmed]: [] };
    setSnippets(updated); ls.set(snippetKey, updated);
    setActiveGroup(trimmed);
    setNewCategoryName("");
    setShowAddCategory(false);
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: `0.5px solid ${THEME.separator}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: THEME.text, letterSpacing: -0.3, fontFamily: FONT_DISPLAY }}>Notes</span>
          {notes.length > 0 && (
            <span style={{ background: THEME.redDim, color: THEME.red, fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 10, fontFamily: FONT_MONO }}>{notes.length}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {!open && notes.length >= 2 && (
            <button onClick={() => setReorderMode(m => !m)} style={{
              background: "transparent", border: "none",
              color: reorderMode ? THEME.red : THEME.textSecondary,
              fontSize: 15, fontWeight: 500, cursor: "pointer", padding: "4px 0",
              fontFamily: FONT_TEXT,
            }}>{reorderMode ? "Done" : "Reorder"}</button>
          )}
          {open && (
            <button onClick={() => setEditMode(m => !m)} style={{
              background: "transparent", border: "none",
              color: editMode ? THEME.red : THEME.textSecondary,
              fontSize: 15, fontWeight: 500, cursor: "pointer", padding: "4px 0",
              fontFamily: FONT_TEXT,
            }}>{editMode ? "Done" : "Edit"}</button>
          )}
          <button onClick={() => { setOpen(o => !o); if (open) setEditMode(false); setReorderMode(false); }} style={{
            background: "transparent", border: "none",
            color: THEME.red, fontSize: 15, fontWeight: 500,
            cursor: "pointer", fontFamily: FONT_TEXT, padding: "4px 0",
          }}>{open ? "Close" : "Snippets"}</button>
        </div>
      </div>

      {/* Snippets panel */}
      {open && (
        <div style={{ background: "rgba(255,255,255,0.015)", borderBottom: `0.5px solid ${THEME.separator}` }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, padding: "12px 16px 8px", overflowX: "auto", scrollbarWidth: "none", flexWrap: editMode ? "wrap" : "nowrap" }}>
            {groups.map(g => {
              const isActive = activeGroup === g;
              const isEditingThis = editingCategory === g;
              const isProtected = g === "Approach";
              const canEdit = editMode && !isProtected;

              if (isEditingThis) {
                return (
                  <div key={g} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input value={categoryEditVal} onChange={e => setCategoryEditVal(e.target.value)}
                      autoFocus
                      onKeyDown={e => { if (e.key === "Enter") renameCategory(g, categoryEditVal); if (e.key === "Escape") setEditingCategory(null); }}
                      onBlur={() => renameCategory(g, categoryEditVal)}
                      style={{
                        background: THEME.surface2, border: `1px solid ${THEME.red}`,
                        borderRadius: 100, padding: "5px 12px",
                        color: THEME.text, fontSize: 13, fontFamily: FONT_TEXT, fontWeight: 500,
                        outline: "none", width: 140,
                      }} />
                  </div>
                );
              }

              return (
                <div key={g} style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      if (canEdit && isActive) {
                        setEditingCategory(g);
                        setCategoryEditVal(g);
                      } else {
                        setActiveGroup(g);
                      }
                    }}
                    style={{
                      padding: "6px 13px", borderRadius: 100,
                      background: isActive ? THEME.red : "transparent",
                      border: `1px solid ${isActive ? THEME.red : THEME.border}`,
                      color: isActive ? "#fff" : THEME.textSecondary,
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      fontFamily: FONT_TEXT, whiteSpace: "nowrap",
                    }}>
                    {g === "Approach" ? "✈ Approach" : g}
                    {canEdit && isActive && <span style={{ marginLeft: 6, opacity: 0.85, fontSize: 11 }}>✎</span>}
                  </button>
                  {canEdit && (
                    <button onClick={() => deleteCategory(g)} title="Delete category" style={{
                      background: THEME.redDim, border: `1px solid ${THEME.red}40`,
                      borderRadius: 100, color: THEME.red,
                      width: 24, height: 24, cursor: "pointer",
                      fontSize: 14, lineHeight: 1, padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>×</button>
                  )}
                </div>
              );
            })}

            {/* Add category button (only in edit mode) */}
            {editMode && !showAddCategory && (
              <button onClick={() => setShowAddCategory(true)} style={{
                padding: "6px 13px", borderRadius: 100,
                background: "transparent", border: `1px dashed ${THEME.red}80`,
                color: THEME.red, fontSize: 13, fontWeight: 500, cursor: "pointer",
                fontFamily: FONT_TEXT, whiteSpace: "nowrap", flexShrink: 0,
              }}>+ Category</button>
            )}
            {editMode && showAddCategory && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter") addCategory();
                    if (e.key === "Escape") { setShowAddCategory(false); setNewCategoryName(""); }
                  }}
                  placeholder="Category name"
                  style={{
                    background: THEME.surface2, border: `1px solid ${THEME.red}`,
                    borderRadius: 100, padding: "5px 12px",
                    color: THEME.text, fontSize: 13, fontFamily: FONT_TEXT, fontWeight: 500,
                    outline: "none", width: 130,
                  }} />
                <button onClick={addCategory} style={{
                  background: THEME.red, border: "none", borderRadius: 100,
                  color: "#fff", fontWeight: 600, fontSize: 13,
                  width: 26, height: 26, cursor: "pointer", padding: 0, lineHeight: 1,
                }}>✓</button>
              </div>
            )}
          </div>

          {/* Edit mode hint */}
          {editMode && (
            <div style={{ padding: "0 16px 8px", fontSize: 12, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic" }}>
              Tap an active category again to rename it. Tap × to delete.
            </div>
          )}

          {/* Approach builder (replaces snippet list when on Approach tab) */}
          {isApproachTab ? (
            <ApproachBuilder onInsert={(text) => addNote(text, true)} editMode={editMode} />
          ) : (
          <div style={{ padding: "0 16px 14px" }}>
            {activeList.length === 0 && (
              <div style={{ color: THEME.textTertiary, fontSize: 14, fontStyle: "italic", padding: "12px 4px", fontFamily: FONT_TEXT }}>
                No snippets yet
              </div>
            )}
            {activeList.map((s, i) => {
              const group = activeGroup;
              const realIdx = snippets[group] ? snippets[group].indexOf(s) : -1;
              const isEditing = editMode && editingIdx === i && group;

              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {isEditing ? (
                    <>
                      <input value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === "Enter") saveSnippetEdit(group, realIdx, editVal); if (e.key === "Escape") setEditingIdx(null); }}
                        style={{
                          flex: 1, background: THEME.surface2, border: `1px solid ${THEME.red}`,
                          borderRadius: 10, padding: "9px 12px",
                          color: THEME.text, fontSize: 14, fontFamily: FONT_TEXT, outline: "none",
                        }} />
                      <button onClick={() => saveSnippetEdit(group, realIdx, editVal)} style={{
                        background: THEME.red, border: "none", borderRadius: 9,
                        color: "#fff", fontWeight: 600, fontSize: 13,
                        padding: "9px 12px", cursor: "pointer",
                      }}>Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => editMode && group ? (() => { setEditingIdx(i); setEditVal(s); })() : addNote(s)} style={{
                        flex: 1,
                        background: THEME.surface2, border: `1px solid ${THEME.border}`,
                        borderRadius: 10, color: THEME.text,
                        fontSize: 14, padding: "10px 13px",
                        cursor: "pointer", textAlign: "left",
                        fontFamily: FONT_TEXT, lineHeight: 1.4,
                        WebkitTapHighlightColor: "transparent",
                      }}>
                        {s}
                      </button>
                      {editMode && group && (
                        <>
                          <button onClick={() => { setEditingIdx(i); setEditVal(s); }} style={{
                            background: "transparent", border: `1px solid ${THEME.border}`,
                            borderRadius: 9, color: THEME.textSecondary,
                            fontSize: 14, padding: "8px 11px", cursor: "pointer",
                          }}>Edit</button>
                          <button onClick={() => deleteSnippet(group, realIdx)} style={{
                            background: "transparent", border: `1px solid ${THEME.red}40`,
                            borderRadius: 9, color: THEME.red,
                            fontSize: 17, width: 36, height: 36, cursor: "pointer", lineHeight: 1,
                          }}>×</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {editMode && activeGroup !== "Approach" && (
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <input value={newSnippetVal} onChange={e => setNewSnippetVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addSnippetToGroup(activeGroup)}
                  placeholder={`Add snippet to ${activeGroup}`}
                  style={{
                    flex: 1, background: THEME.surface2, border: `1px solid ${THEME.border}`,
                    borderRadius: 10, padding: "10px 13px",
                    color: THEME.text, fontSize: 14, fontFamily: FONT_TEXT, outline: "none",
                  }} />
                <button onClick={() => addSnippetToGroup(activeGroup)} style={{
                  background: THEME.red, border: "none", borderRadius: 10,
                  color: "#fff", fontWeight: 600, fontSize: 18, width: 42, cursor: "pointer",
                }}>+</button>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* Custom note input */}
      <div style={{ padding: "12px 16px", borderBottom: notes.length ? `0.5px solid ${THEME.separator}` : "none", display: "flex", gap: 8 }}>
        <input value={customNote} onChange={e => setCustomNote(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addCustomNote()}
          placeholder="Add a note"
          style={{
            flex: 1, background: THEME.surface2, border: `1px solid ${THEME.border}`,
            borderRadius: 10, padding: "10px 13px",
            color: THEME.text, fontSize: 14, fontFamily: FONT_TEXT, outline: "none",
          }} />
        <button onClick={addCustomNote} style={{
          background: THEME.red, border: "none", borderRadius: 10,
          color: "#fff", fontWeight: 600, fontSize: 18, width: 42, cursor: "pointer",
        }}>+</button>
      </div>

      {/* Note list with long-press drag-and-drop reordering.
          The wrapper sets touch-action: none during reorderMode so the whole
          list area refuses to scroll while you're dragging — critical for iOS. */}
      <div style={{
        touchAction: reorderMode ? "none" : "auto",
      }}>
      {notes.map((note, i) => {
        const text = noteText(note);
        const subs = noteSubs(note);
        const isApproach = typeof note !== "string" && note.isApproach;
        const isAddingSub = activeSubInputIdx === i;
        const hasSubs = subs.length > 0;
        const isDragging = draggingIdx === i;
        const isAnyDragging = draggingIdx !== null;
        const isDropTarget = isAnyDragging && dropTargetIdx === i && draggingIdx !== i;

        function commitSub() {
          if (subInputText.trim()) {
            addSubBullet(i, subInputText.trim());
          }
          setSubInputText("");
        }

        return (
          <div key={i}
            ref={el => { noteRefsRef.current[i] = el; }}
            onTouchStart={(e) => {
              // Drag/reorder is locked unless user has tapped Reorder
              if (!reorderMode) return;
              // Don't start drag if user touched a button or input
              if (e.target.closest("button, input, textarea")) return;
              startLongPress(i, e.touches[0].clientY, e);
            }}
            onMouseDown={(e) => {
              if (!reorderMode) return;
              if (e.target.closest("button, input, textarea")) return;
              startLongPress(i, e.clientY, e);
            }}
            onTouchEnd={() => { if (draggingIdx === null) cancelLongPress(); }}
            onMouseUp={() => { if (draggingIdx === null) cancelLongPress(); }}
            style={{
              padding: "12px 16px",
              borderBottom: i < notes.length - 1 ? `0.5px solid ${THEME.separator}` : "none",
              opacity: isDragging ? 0.6 : 1,
              background: isDragging
                ? THEME.surface2
                : isDropTarget
                  ? THEME.redDim
                  : "transparent",
              borderTop: isDropTarget && dropTargetIdx < (draggingIdx ?? -1) ? `2px solid ${THEME.red}` : undefined,
              borderBottomColor: isDropTarget && dropTargetIdx > (draggingIdx ?? -1) ? THEME.red : undefined,
              borderBottomWidth: isDropTarget && dropTargetIdx > (draggingIdx ?? -1) ? "2px" : undefined,
              borderBottomStyle: isDropTarget && dropTargetIdx > (draggingIdx ?? -1) ? "solid" : undefined,
              transform: isDragging ? `translateY(${dragY}px) scale(1.03)` : "none",
              boxShadow: isDragging ? `0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px ${THEME.red}60` : "none",
              borderRadius: isDragging ? 14 : 0,
              transition: isDragging
                ? "box-shadow 0.2s, border-radius 0.2s, opacity 0.15s, background 0.15s"
                : "transform 0.18s, background 0.12s, opacity 0.12s",
              zIndex: isDragging ? 10 : 1,
              position: "relative",
              // CRITICAL for iOS: when reorder mode is on, disable browser's default
              // touch handling (scroll, pinch, etc.) so our drag gesture wins. Without
              // this, iOS Safari starts scrolling the moment you move your finger, and
              // any preventDefault() call inside touchmove is ignored.
              touchAction: reorderMode ? "none" : "auto",
              userSelect: reorderMode ? "none" : "auto",
              WebkitUserSelect: reorderMode ? "none" : "auto",
              WebkitTouchCallout: reorderMode ? "none" : "default",
              cursor: isDragging ? "grabbing" : reorderMode ? "grab" : "default",
            }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {reorderMode && (
                <span style={{
                  color: THEME.textSecondary,
                  fontSize: 16, lineHeight: "20px",
                  flexShrink: 0, marginTop: 1,
                  userSelect: "none", WebkitUserSelect: "none",
                }}>☰</span>
              )}
              <span style={{
                color: THEME.red,
                fontSize: isApproach ? 18 : 14,
                lineHeight: "20px",
                flexShrink: 0, marginTop: 1,
              }}>{isApproach ? "✈" : "▸"}</span>
              <span style={{
                flex: 1,
                fontSize: isApproach ? 17 : 15,
                fontWeight: isApproach ? 700 : 400,
                color: THEME.text, fontFamily: FONT_TEXT,
                lineHeight: 1.4, letterSpacing: -0.3,
              }}>{text}</span>
              <button onClick={() => { setActiveSubInputIdx(isAddingSub ? null : i); setSubInputText(""); }}
                title="Add sub-bullet"
                style={{
                  background: isAddingSub ? THEME.red : "transparent",
                  border: `1px solid ${isAddingSub ? THEME.red : THEME.border}`,
                  borderRadius: 7, color: isAddingSub ? "#fff" : THEME.textSecondary,
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                  padding: "3px 8px", flexShrink: 0, fontFamily: FONT_TEXT,
                  transition: "all 0.15s",
                }}>{isAddingSub ? "Done" : "+ Sub"}</button>
              {confirmRemoveNote === i ? (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { removeNote(i); setConfirmRemoveNote(null); }} style={{ background: THEME.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "6px 11px", cursor: "pointer" }}>Delete</button>
                  <button onClick={() => setConfirmRemoveNote(null)} style={{ background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textSecondary, fontSize: 12, padding: "6px 11px", cursor: "pointer" }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmRemoveNote(i)} style={{
                  background: "transparent", border: "none", color: THEME.textQuaternary,
                  cursor: "pointer", fontSize: 20, padding: "0 2px", flexShrink: 0, lineHeight: 1,
                }}>×</button>
              )}
            </div>

            {/* Sub-bullets */}
            {(hasSubs || isAddingSub) && !isDragging && (
              <div style={{ marginLeft: 28, marginTop: 6 }}>
                {subs.map((sub, si) => (
                  <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0" }}>
                    <span style={{ color: THEME.textTertiary, fontSize: 13, marginTop: 2, flexShrink: 0 }}>•</span>
                    <span style={{ flex: 1, fontSize: 14, color: THEME.textSecondary, fontFamily: FONT_TEXT, lineHeight: 1.5 }}>{sub}</span>
                    {confirmRemoveSub && confirmRemoveSub.noteIdx === i && confirmRemoveSub.subIdx === si ? (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => { removeSubBullet(i, si); setConfirmRemoveSub(null); }} style={{ background: THEME.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 600, padding: "5px 9px", cursor: "pointer" }}>Delete</button>
                        <button onClick={() => setConfirmRemoveSub(null)} style={{ background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textSecondary, fontSize: 11, padding: "5px 9px", cursor: "pointer" }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRemoveSub({ noteIdx: i, subIdx: si })} style={{
                        background: "transparent", border: "none", color: THEME.textQuaternary,
                        cursor: "pointer", fontSize: 17, padding: "0 3px", flexShrink: 0, lineHeight: 1,
                      }}>×</button>
                    )}
                  </div>
                ))}
                {isAddingSub && (
                  <div style={{ display: "flex", gap: 6, marginTop: hasSubs ? 6 : 2 }}>
                    <input value={subInputText} onChange={e => setSubInputText(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === "Enter") commitSub();
                        if (e.key === "Escape") { setActiveSubInputIdx(null); setSubInputText(""); }
                      }}
                      placeholder="Add detail about this approach"
                      style={{
                        flex: 1, background: THEME.surface2, border: `1px solid ${THEME.red}60`,
                        borderRadius: 9, padding: "8px 11px",
                        color: THEME.text, fontSize: 13, fontFamily: FONT_TEXT, outline: "none",
                      }} />
                    <button onClick={commitSub} disabled={!subInputText.trim()} style={{
                      background: subInputText.trim() ? THEME.red : THEME.surface2,
                      border: "none", borderRadius: 9,
                      color: subInputText.trim() ? "#fff" : THEME.textTertiary,
                      fontWeight: 600, fontSize: 16, width: 36,
                      cursor: subInputText.trim() ? "pointer" : "not-allowed",
                    }}>+</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </Card>
  );
}

// ─── IMC Timer ────────────────────────────────────────────────────────────────
// Live timer for actual instrument time in clouds. Tap Start when entering IMC,
// optionally enter entry altitude (MSL); tap Stop when exiting, optionally enter
// exit altitude. Total time accumulates across multiple cloud entries.

function IMCTimer({ imc, setImc }) {
  // Force re-render every second when timer is running so the live clock updates
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (imc.startTs == null) return;
    const id = setInterval(() => forceTick(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [imc.startTs]);

  const isRunning = imc.startTs != null;
  // Live elapsed seconds (only relevant when running)
  const liveSeconds = isRunning ? Math.floor((Date.now() - imc.startTs) / 1000) : 0;
  // Total displayed = accumulated + (live elapsed if running)
  const totalDisplaySecs = (imc.totalSeconds || 0) + liveSeconds;
  const totalHoursDecimal = totalDisplaySecs / 3600;

  function fmtClock(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function start() {
    if (navigator.vibrate) navigator.vibrate(15);
    setImc({ ...imc, startTs: Date.now() });
  }

  function stop() {
    if (navigator.vibrate) navigator.vibrate(15);
    const elapsed = imc.startTs ? Math.floor((Date.now() - imc.startTs) / 1000) : 0;
    setImc({ ...imc, startTs: null, totalSeconds: (imc.totalSeconds || 0) + elapsed });
  }

  function clearTimer() {
    if (!window.confirm("Clear IMC timer?\n\nThis will erase the total time and altitudes. This cannot be undone.")) return;
    setImc({ startTs: null, entryAlt: "", exitAlt: "", totalSeconds: 0 });
  }

  function setAlt(field, val) {
    if (val === "" || /^\d{0,5}$/.test(val)) {
      setImc({ ...imc, [field]: val });
    }
  }

  const hasContent = isRunning || (imc.totalSeconds || 0) > 0 || imc.entryAlt || imc.exitAlt;

  // Collapsed by default. Auto-expands while running so you can see/control the live timer.
  // After stopping, stays expanded so user can grab the total or enter altitudes.
  const [expanded, setExpanded] = useState(false);
  // Force expansion whenever the timer is running
  const isExpanded = expanded || isRunning;

  return (
    <Card style={{ padding: "10px 14px", marginBottom: 16 }}>
      {/* Slim header row — always visible, taps to toggle expansion */}
      <div onClick={() => setExpanded(e => !e)} style={{
        display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
        padding: "2px 0",
      }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>☁️</span>
        <SectionLabel style={{ padding: 0 }}>IMC Timer</SectionLabel>

        {/* Inline status — shows the relevant state at a glance even when collapsed */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8,
          fontSize: 12, color: THEME.textSecondary, fontFamily: FONT_TEXT,
          justifyContent: "flex-end",
        }}>
          {isRunning && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: THEME.red,
              fontFamily: FONT_MONO, letterSpacing: 0.4,
              background: `${THEME.red}1a`, border: `0.5px solid ${THEME.red}50`,
              padding: "2px 6px", borderRadius: 4,
            }}>● LIVE</span>
          )}
          {(totalDisplaySecs > 0 || isRunning) && (
            <span style={{ fontFamily: FONT_MONO, color: isRunning ? THEME.red : THEME.text, fontWeight: 600, letterSpacing: 0.3 }}>
              {fmtClock(totalDisplaySecs)}
            </span>
          )}
        </div>

        <span style={{
          color: THEME.textTertiary, fontSize: 13,
          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.18s",
        }}>›</span>
      </div>

      {/* Expanded body — only renders when expanded or running */}
      {isExpanded && (
        <div style={{ marginTop: 10 }}>
          {/* Live clock display */}
          <div style={{
            textAlign: "center", padding: "10px 8px", marginBottom: 10,
            background: isRunning ? `${THEME.red}15` : THEME.surface2,
            border: `1px solid ${isRunning ? `${THEME.red}50` : THEME.border}`,
            borderRadius: 10,
          }}>
            <div style={{
              fontSize: 26, fontWeight: 700, color: isRunning ? THEME.red : THEME.text,
              fontFamily: FONT_MONO, letterSpacing: 0.5, lineHeight: 1,
              textShadow: isRunning ? `0 0 12px ${THEME.red}40` : "none",
            }}>{fmtClock(totalDisplaySecs)}</div>
            <div style={{
              fontSize: 11, color: THEME.textSecondary, marginTop: 4,
              fontFamily: FONT_TEXT, letterSpacing: 0.2,
            }}>
              {isRunning ? (
                <span><span style={{ color: THEME.red, fontWeight: 600 }}>● IN CLOUDS</span> · Total Actual: <span style={{ color: THEME.text, fontFamily: FONT_MONO, fontWeight: 600 }}>{totalHoursDecimal.toFixed(1)} hrs</span></span>
              ) : (totalDisplaySecs > 0 ? (
                <span>Total Actual: <span style={{ color: THEME.text, fontFamily: FONT_MONO, fontWeight: 600 }}>{totalHoursDecimal.toFixed(1)} hrs</span></span>
              ) : (
                <span>Tap Start when entering IMC</span>
              ))}
            </div>
          </div>

          {/* Start/Stop button */}
          <button onClick={isRunning ? stop : start} style={{
            width: "100%", padding: "11px",
            borderRadius: 11,
            background: isRunning ? THEME.red : THEME.surface2,
            border: isRunning ? "none" : `1px solid ${THEME.border}`,
            color: isRunning ? "#fff" : THEME.text,
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            fontFamily: FONT_TEXT, letterSpacing: -0.2,
            boxShadow: isRunning ? `0 2px 12px ${THEME.redGlow}` : "none",
            transition: "transform 0.1s, background 0.15s",
          }}
          onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
          onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}>
            {isRunning ? "■ Stop (Exiting Clouds)" : (totalDisplaySecs > 0 ? "▶ Resume (Entering Clouds)" : "▶ Start (Entering Clouds)")}
          </button>

          {/* Optional altitudes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>Entry Alt (MSL)</div>
              <input value={imc.entryAlt || ""}
                onChange={e => setAlt("entryAlt", e.target.value)}
                placeholder="—" inputMode="numeric"
                style={{
                  width: "100%", boxSizing: "border-box", minWidth: 0,
                  background: THEME.surface2, border: `1px solid ${THEME.border}`,
                  borderRadius: 8, padding: "7px 8px",
                  color: THEME.text, fontSize: 14, fontFamily: FONT_MONO,
                  outline: "none", textAlign: "center",
                  appearance: "none", WebkitAppearance: "none",
                }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>Exit Alt (MSL)</div>
              <input value={imc.exitAlt || ""}
                onChange={e => setAlt("exitAlt", e.target.value)}
                placeholder="—" inputMode="numeric"
                style={{
                  width: "100%", boxSizing: "border-box", minWidth: 0,
                  background: THEME.surface2, border: `1px solid ${THEME.border}`,
                  borderRadius: 8, padding: "7px 8px",
                  color: THEME.text, fontSize: 14, fontFamily: FONT_MONO,
                  outline: "none", textAlign: "center",
                  appearance: "none", WebkitAppearance: "none",
                }} />
            </div>
          </div>

          {/* Clear button — only when there's something to clear */}
          {hasContent && !isRunning && (
            <button onClick={clearTimer} style={{
              width: "100%", padding: "9px", marginTop: 10,
              background: "transparent", border: `0.5px solid ${THEME.border}`,
              borderRadius: 9, color: THEME.textSecondary,
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              fontFamily: FONT_TEXT,
            }}>Clear Timer</button>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Wind Component ───────────────────────────────────────────────────────────
// Pre-flight wind calculator: type wind direction, speed, gust, and any one runway
// of a parallel pair. The tool figures out the opposite runway, calculates the
// headwind and crosswind components for both ends, and tells you the more
// favorable runway to land on. Includes a compass visual showing wind direction
// relative to the runway pair.

function WindComponent() {
  const [windDir, setWindDir] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [gust, setGust] = useState("");
  const [runway, setRunway] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Sanitize numeric inputs
  function setDigitsOnly(setter, maxLen) {
    return (e) => {
      const v = e.target.value.replace(/\D/g, "").slice(0, maxLen);
      setter(v);
    };
  }

  // Parse inputs
  const wDirNum = parseInt(windDir, 10);
  const wSpdNum = parseInt(windSpeed, 10);
  const gustNum = gust ? parseInt(gust, 10) : null;
  const rwyNum = parseInt(runway, 10);

  const validWindDir = !isNaN(wDirNum) && wDirNum >= 0 && wDirNum <= 360;
  const validWindSpd = !isNaN(wSpdNum) && wSpdNum >= 0 && wSpdNum <= 99;
  const validGust = gustNum === null || (!isNaN(gustNum) && gustNum > wSpdNum && gustNum <= 99);
  const validRwy = !isNaN(rwyNum) && rwyNum >= 1 && rwyNum <= 36;

  const ready = validWindDir && validWindSpd && validGust && validRwy;

  // Compute headwind/crosswind for a given runway heading + wind
  function computeComponents(rwyDeg, wDir, wSpd) {
    // Wind direction is "from" — the difference between the wind direction and
    // the runway heading gives us the angle of attack. Negative cos = tailwind.
    const angleDeg = wDir - rwyDeg;
    const angleRad = (angleDeg * Math.PI) / 180;
    const headwind = wSpd * Math.cos(angleRad);
    const crosswind = wSpd * Math.sin(angleRad);
    return { headwind, crosswind, angleDeg };
  }

  // Build results for both runways
  let rwyA = null, rwyB = null, favored = null, other = null;
  if (ready) {
    // Primary runway as typed; opposite is +/- 18 (mod 36, with 0 -> 36)
    const aNum = rwyNum;
    const bNum = ((rwyNum + 18 - 1) % 36) + 1; // keep in 1..36
    const aDeg = aNum * 10;
    const bDeg = bNum * 10;
    // Compute components for both the steady wind AND the gust (if present).
    // Both are displayed so pilots see the full picture — e.g. "HW 10 gusting 15".
    const aSteady = computeComponents(aDeg, wDirNum, wSpdNum);
    const bSteady = computeComponents(bDeg, wDirNum, wSpdNum);
    const aGust = gustNum != null ? computeComponents(aDeg, wDirNum, gustNum) : null;
    const bGust = gustNum != null ? computeComponents(bDeg, wDirNum, gustNum) : null;
    rwyA = {
      num: aNum, deg: aDeg,
      headwind: aSteady.headwind, crosswind: aSteady.crosswind,
      headwindGust: aGust ? aGust.headwind : null,
      crosswindGust: aGust ? aGust.crosswind : null,
    };
    rwyB = {
      num: bNum, deg: bDeg,
      headwind: bSteady.headwind, crosswind: bSteady.crosswind,
      headwindGust: bGust ? bGust.headwind : null,
      crosswindGust: bGust ? bGust.crosswind : null,
    };
    // The favored runway is the one with the higher (positive) headwind component.
    // Use peak (gust if present, steady otherwise) for the comparison — worst case.
    const aPeak = aGust ? aGust.headwind : aSteady.headwind;
    const bPeak = bGust ? bGust.headwind : bSteady.headwind;
    if (aPeak >= bPeak) {
      favored = rwyA; other = rwyB;
    } else {
      favored = rwyB; other = rwyA;
    }
  }

  function reset() {
    setWindDir(""); setWindSpeed(""); setGust(""); setRunway("");
  }

  // Format runway number to 2-digit string (e.g. 5 -> "05")
  function fmtRwy(n) { return String(n).padStart(2, "0"); }

  // Format component as a whole number (no decimals)
  function fmtComp(n) {
    return String(Math.round(Math.abs(n)));
  }

  return (
    <Card style={{ padding: "10px 14px", marginBottom: 16 }}>
      {/* Slim header row */}
      <div onClick={() => setExpanded(e => !e)} style={{
        display: "flex", alignItems: "center", gap: 8,
        cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
        padding: "2px 0",
      }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>💨</span>
        {/* Title only when no result yet — once we have a result the summary takes the space.
            Keeps everything on one line on small screens. */}
        {!(ready && favored) && (
          <SectionLabel style={{ padding: 0 }}>Wind Component</SectionLabel>
        )}

        {/* Inline summary when collapsed — compact ForeFlight-style with arrows + gust factor */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, color: THEME.textSecondary, fontFamily: FONT_MONO,
          minWidth: 0, // allow shrinking
        }}>
          {ready && favored && (() => {
            // Display *steady* component values only — the gust factor (the +increment)
            // is shown as a single "G+N" suffix so the line stays compact.
            const hw = fmtComp(favored.headwind);
            const xw = fmtComp(favored.crosswind);
            const isTailwind = favored.headwind < -0.5;
            // Peak gust factor — difference between gust and steady wind speed
            const gustFactor = gustNum != null ? Math.max(0, gustNum - wSpdNum) : 0;
            const hasGust = gustFactor > 0;
            return (
              <>
                <span style={{ color: THEME.green, fontWeight: 700, letterSpacing: 0.3 }}>
                  RWY {fmtRwy(favored.num)}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span style={{ color: isTailwind ? THEME.red : THEME.textSecondary, fontSize: 14, lineHeight: 1 }}>
                    {isTailwind ? "↑" : "↓"}
                  </span>
                  <span style={{ color: isTailwind ? THEME.red : THEME.text, fontWeight: 600 }}>{hw}</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span style={{ color: THEME.textSecondary, fontSize: 14, lineHeight: 1 }}>
                    {favored.crosswind >= 0.5 ? "←" : favored.crosswind <= -0.5 ? "→" : "·"}
                  </span>
                  <span style={{ color: THEME.text, fontWeight: 600 }}>{xw}</span>
                </span>
                {hasGust && (
                  <span style={{
                    color: THEME.red, fontWeight: 700,
                    fontSize: 11, letterSpacing: 0.4,
                    background: `${THEME.red}1a`, border: `0.5px solid ${THEME.red}50`,
                    padding: "1px 5px", borderRadius: 3,
                  }}>G+{gustFactor}</span>
                )}
              </>
            );
          })()}
        </div>

        <span style={{
          color: THEME.textTertiary, fontSize: 13,
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.18s",
          flexShrink: 0,
        }}>›</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          {/* Wind inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>Direction</div>
              <input value={windDir} onChange={setDigitsOnly(setWindDir, 3)}
                placeholder="—" inputMode="numeric"
                style={{
                  width: "100%", boxSizing: "border-box", minWidth: 0,
                  background: THEME.surface2, border: `1px solid ${windDir && !validWindDir ? THEME.red : THEME.border}`,
                  borderRadius: 8, padding: "7px 8px",
                  color: THEME.text, fontSize: 14, fontFamily: FONT_MONO,
                  outline: "none", textAlign: "center",
                  appearance: "none", WebkitAppearance: "none",
                }} />
              <div style={{ fontSize: 9, color: THEME.textTertiary, marginTop: 2, textAlign: "center", fontFamily: FONT_TEXT, letterSpacing: 0.1 }}>°</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>Speed</div>
              <input value={windSpeed} onChange={setDigitsOnly(setWindSpeed, 2)}
                placeholder="—" inputMode="numeric"
                style={{
                  width: "100%", boxSizing: "border-box", minWidth: 0,
                  background: THEME.surface2, border: `1px solid ${windSpeed && !validWindSpd ? THEME.red : THEME.border}`,
                  borderRadius: 8, padding: "7px 8px",
                  color: THEME.text, fontSize: 14, fontFamily: FONT_MONO,
                  outline: "none", textAlign: "center",
                  appearance: "none", WebkitAppearance: "none",
                }} />
              <div style={{ fontSize: 9, color: THEME.textTertiary, marginTop: 2, textAlign: "center", fontFamily: FONT_TEXT, letterSpacing: 0.1 }}>kts</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>Gust</div>
              <input value={gust} onChange={setDigitsOnly(setGust, 2)}
                placeholder="—" inputMode="numeric"
                style={{
                  width: "100%", boxSizing: "border-box", minWidth: 0,
                  background: THEME.surface2, border: `1px solid ${gust && !validGust ? THEME.red : THEME.border}`,
                  borderRadius: 8, padding: "7px 8px",
                  color: THEME.text, fontSize: 14, fontFamily: FONT_MONO,
                  outline: "none", textAlign: "center",
                  appearance: "none", WebkitAppearance: "none",
                }} />
              <div style={{ fontSize: 9, color: THEME.textTertiary, marginTop: 2, textAlign: "center", fontFamily: FONT_TEXT, letterSpacing: 0.1 }}>opt.</div>
            </div>
          </div>

          {/* Runway input */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>Runway</div>
            <input value={runway} onChange={setDigitsOnly(setRunway, 2)}
              placeholder="e.g. 16" inputMode="numeric"
              style={{
                width: "100%", boxSizing: "border-box",
                background: THEME.surface2, border: `1px solid ${runway && !validRwy ? THEME.red : THEME.border}`,
                borderRadius: 8, padding: "8px 10px",
                color: THEME.text, fontSize: 14, fontFamily: FONT_MONO,
                outline: "none", textAlign: "center", letterSpacing: 0.3,
                appearance: "none", WebkitAppearance: "none",
              }} />
          </div>

          {/* Results — ForeFlight-style display: both runways shown with arrow indicators.
              Steady wind shown by default; gust appended as "10 → 15" when present. */}
          {ready && favored && other && (() => {
            // Helper: format component value, showing both steady and gust if applicable.
            // Returns a JSX-ready string like "4" or "10 → 15".
            function fmtPair(steady, gust) {
              const s = fmtComp(steady);
              if (gust == null) return s;
              const g = fmtComp(gust);
              if (s === g) return s; // when wind is direct on/perpendicular, steady & gust may round equal for crosswind
              return `${s}-${g}`;
            }
            // Arrow direction for headwind/tailwind:
            //   headwind > 0 → ↓ (red, pointing down at the runway)
            //   headwind < 0 → ↑ (red warning, tailwind)
            //   ≈ 0 → no vertical component
            function HWArrow({ headwind, color }) {
              const isHead = headwind >= 0.5;
              const isTail = headwind <= -0.5;
              if (!isHead && !isTail) return <span style={{ display: "inline-block", width: 14 }} />;
              return (
                <span style={{
                  display: "inline-block", color, fontSize: 16, lineHeight: 1, marginRight: 4,
                  transform: "translateY(1px)",
                }}>{isHead ? "↓" : "↑"}</span>
              );
            }
            // Crosswind arrow: positive crosswind = from the right (arrow pointing LEFT, since wind blows that way)
            // Negative crosswind = from the left (arrow pointing RIGHT)
            function XWArrow({ crosswind, color }) {
              const isFromR = crosswind >= 0.5;
              const isFromL = crosswind <= -0.5;
              if (!isFromR && !isFromL) return <span style={{ display: "inline-block", width: 14 }} />;
              return (
                <span style={{
                  display: "inline-block", color, fontSize: 16, lineHeight: 1, marginRight: 4,
                  transform: "translateY(1px)",
                }}>{isFromR ? "←" : "→"}</span>
              );
            }
            // Build a runway card. Best one gets the red glow.
            function RunwayCard({ rwy, isBest }) {
              const hw = Math.abs(rwy.headwind);
              const hwGust = rwy.headwindGust != null ? Math.abs(rwy.headwindGust) : null;
              const xw = Math.abs(rwy.crosswind);
              const xwGust = rwy.crosswindGust != null ? Math.abs(rwy.crosswindGust) : null;
              const isTailwind = rwy.headwind < -0.5;
              // Wind summary string — "340° at 10G15 kt" or "340° at 10 kt"
              const windStr = `${String(wDirNum).padStart(3, "0")}° at ${wSpdNum}${gustNum != null ? `G${gustNum}` : ""} kt`;
              return (
                <div style={{
                  padding: "12px 14px", marginBottom: 8,
                  background: isBest ? `${THEME.green}15` : THEME.surface2,
                  border: `1px solid ${isBest ? `${THEME.green}50` : THEME.border}`,
                  borderRadius: 10,
                }}>
                  {/* Row 1: RWY label + Best Wind badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 22, fontWeight: 700,
                      color: isBest ? THEME.green : THEME.text,
                      fontFamily: FONT_MONO, letterSpacing: 0.3, lineHeight: 1,
                      textShadow: isBest ? `0 0 12px ${THEME.green}40` : "none",
                    }}>
                      RWY {fmtRwy(rwy.num)}
                    </span>
                    {isBest && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: THEME.green,
                        fontFamily: FONT_MONO, letterSpacing: 0.5,
                        background: `${THEME.green}20`, border: `1px solid ${THEME.green}60`,
                        padding: "2px 7px", borderRadius: 4, textTransform: "uppercase",
                      }}>Best Wind</span>
                    )}
                    <span style={{ flex: 1, textAlign: "right", fontSize: 10, color: THEME.textTertiary, fontFamily: FONT_TEXT }}>
                      Heading {rwy.deg}°
                    </span>
                  </div>
                  {/* Wind readout — only on favored card, shows full wind including gust */}
                  {isBest && (
                    <div style={{
                      fontSize: 11, color: THEME.textSecondary, fontFamily: FONT_MONO,
                      letterSpacing: 0.3, marginBottom: 8, fontWeight: 500,
                    }}>
                      Wind {windStr}
                    </div>
                  )}
                  {/* Row 2: headwind / crosswind with arrows */}
                  <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: FONT_MONO, fontSize: 15, color: THEME.text, fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      <HWArrow headwind={rwy.headwind} color={isTailwind ? THEME.red : THEME.textSecondary} />
                      <span style={{ color: isTailwind ? THEME.red : THEME.text }}>
                        {fmtPair(hw, hwGust)}
                      </span>
                      <span style={{ marginLeft: 5, fontSize: 11, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontWeight: 500 }}>
                        kt {isTailwind ? "tailwind" : "headwind"}
                      </span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      <XWArrow crosswind={rwy.crosswind} color={THEME.textSecondary} />
                      <span>{fmtPair(xw, xwGust)}</span>
                      <span style={{ marginLeft: 5, fontSize: 11, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontWeight: 500 }}>
                        kt crosswind
                      </span>
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <>
                <RunwayCard rwy={favored} isBest={true} />
                <RunwayCard rwy={other} isBest={false} />
              </>
            );
          })()}

          {/* Reset button */}
          {(windDir || windSpeed || gust || runway) && (
            <button onClick={reset} style={{
              width: "100%", padding: "9px", marginTop: 10,
              background: "transparent", border: `0.5px solid ${THEME.border}`,
              borderRadius: 9, color: THEME.textSecondary,
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              fontFamily: FONT_TEXT,
            }}>Reset</button>
          )}
        </div>
      )}
    </Card>
  );
}


// ─── Landing Tracker ──────────────────────────────────────────────────────────
// Logs touch-and-go and full-stop landings during a flight. Each tap timestamps
// the landing and auto-determines if it counts as a NIGHT landing for currency
// per 14 CFR 61.57(b)(1): night = 1 hour after sunset to 1 hour before sunrise.

function LandingTracker({ landings, setLandings, landingAirport, setLandingAirport }) {
  const [airportQuery, setAirportQuery] = useState("");
  const [showLog, setShowLog] = useState(false);

  // Filter airports by query
  function filterAirports(q) {
    if (!q || q.length < 2) return [];
    const upper = q.toUpperCase();
    return AIRPORTS.filter(([icao, name]) =>
      icao.startsWith(upper) || icao.includes(upper) || name.toUpperCase().includes(upper)
    ).slice(0, 6);
  }
  const apResults = !landingAirport ? filterAirports(airportQuery) : [];

  // Determine if a given timestamp is "night" per 61.57(b)(1):
  // 1 hour after sunset to 1 hour before sunrise at the airport's location.
  function isNightLandingPerCurrency(timestamp, airport) {
    if (!airport) return null; // can't determine without airport
    const lat = airport[2];
    const lon = airport[3];
    const ts = new Date(timestamp);
    // Use the local-date version of the timestamp (the actual calendar day at the airport)
    const localDate = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate());
    const tw = getTwilightTimes(localDate, lat, lon);
    if (!tw.sunrise || !tw.sunset) return null;
    // Night currency starts 1 hour after sunset
    const nightStart = new Date(tw.sunset.getTime() + 60 * 60 * 1000);
    // Night currency ends 1 hour before sunrise
    const nightEnd = new Date(tw.sunrise.getTime() - 60 * 60 * 1000);
    // It's night if currentTime is after nightStart OR before nightEnd
    if (ts >= nightStart) return true;
    if (ts < nightEnd) return true;
    return false;
  }

  function logLanding(type) {
    const now = Date.now();
    const isNight = landingAirport ? isNightLandingPerCurrency(now, landingAirport) : null;
    const newLanding = {
      id: now.toString(),
      type, // "touchgo" or "fullstop"
      timestamp: now,
      isNight,
      airport: landingAirport ? landingAirport[0] : null,
    };
    setLandings([...landings, newLanding]);
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(15);
  }

  function removeLanding(id) {
    setLandings(landings.filter(l => l.id !== id));
  }

  // Counter totals
  const tgCount = landings.filter(l => l.type === "touchgo").length;
  const fsCount = landings.filter(l => l.type === "fullstop").length;
  const nightCount = landings.filter(l => l.isNight === true).length;
  const dayCount = landings.filter(l => l.isNight === false).length;

  function formatLandingTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  return (
    <Card style={{ padding: "12px 14px", marginBottom: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <SectionLabel style={{ padding: 0 }}>Landing Tracker</SectionLabel>
      </div>

      {/* Airport selector */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 5, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>
          Airport
        </div>
        {landingAirport ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: THEME.redDim, border: `1px solid ${THEME.red}40`, borderRadius: 8 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: THEME.red, letterSpacing: 0.3 }}>{landingAirport[0]}</span>
            <span style={{ flex: 1, fontSize: 12, color: THEME.text, fontFamily: FONT_TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{landingAirport[1]}</span>
            <button onClick={() => { setLandingAirport(null); setAirportQuery(""); }} style={{
              background: "transparent", border: "none", color: THEME.red,
              fontSize: 14, cursor: "pointer", padding: 0, lineHeight: 1,
            }}>×</button>
          </div>
        ) : (
          <>
            <input value={airportQuery} onChange={e => setAirportQuery(e.target.value)}
              placeholder="ICAO or name (e.g. KADS)"
              autoCapitalize="characters"
              style={{
                width: "100%", boxSizing: "border-box",
                background: THEME.surface2, border: `1px solid ${THEME.border}`,
                borderRadius: 8, padding: "7px 10px",
                color: THEME.text, fontSize: 13, fontFamily: FONT_TEXT,
                outline: "none",
              }} />
            {apResults.length > 0 && (
              <div style={{ marginTop: 5, background: THEME.surface2, borderRadius: 8, border: `1px solid ${THEME.border}`, overflow: "hidden" }}>
                {apResults.map(ap => (
                  <div key={ap[0]} onClick={() => { setLandingAirport(ap); setAirportQuery(""); }} style={{
                    padding: "7px 10px", cursor: "pointer",
                    borderBottom: `0.5px solid ${THEME.separator}`,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: THEME.red, minWidth: 48 }}>{ap[0]}</span>
                    <span style={{ fontSize: 11, color: THEME.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ap[1]}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 5, fontSize: 10, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic" }}>
              Pick an airport to determine night vs day landings.
            </div>
          </>
        )}
      </div>

      {/* Two tap buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: landings.length > 0 ? 10 : 0 }}>
        <button onClick={() => logLanding("touchgo")} style={{
          padding: "11px 10px", borderRadius: 10,
          background: THEME.surface2, border: `1px solid ${THEME.border}`,
          color: THEME.text, fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: FONT_TEXT,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          transition: "transform 0.1s, background 0.15s",
        }}
        onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
        onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}>
          <span>Touch & Go</span>
          {tgCount > 0 && <span style={{ fontSize: 11, color: THEME.textSecondary, fontFamily: FONT_MONO }}>{tgCount}</span>}
        </button>
        <button onClick={() => logLanding("fullstop")} style={{
          padding: "11px 10px", borderRadius: 10,
          background: THEME.surface2, border: `1px solid ${THEME.border}`,
          color: THEME.text, fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: FONT_TEXT,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          transition: "transform 0.1s, background 0.15s",
        }}
        onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
        onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}>
          <span>Full Stop</span>
          {fsCount > 0 && <span style={{ fontSize: 11, color: THEME.textSecondary, fontFamily: FONT_MONO }}>{fsCount}</span>}
        </button>
      </div>

      {/* Summary + log toggle */}
      {landings.length > 0 && (
        <>
          <button onClick={() => setShowLog(s => !s)} style={{
            width: "100%", padding: "9px 12px",
            background: "transparent", border: `0.5px solid ${THEME.border}`,
            borderRadius: 9, color: THEME.textSecondary,
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            fontFamily: FONT_TEXT,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span><span style={{ color: THEME.text, fontWeight: 600, fontFamily: FONT_MONO }}>{landings.length}</span> total</span>
              {dayCount > 0 && <span style={{ color: THEME.textTertiary }}>· <span style={{ color: THEME.text, fontFamily: FONT_MONO }}>{dayCount}</span> day</span>}
              {nightCount > 0 && <span style={{ color: THEME.textTertiary }}>· <span style={{ color: THEME.red, fontFamily: FONT_MONO, fontWeight: 600 }}>{nightCount}</span> night</span>}
            </span>
            <span style={{ color: THEME.textTertiary, fontSize: 14 }}>{showLog ? "▾" : "▸"}</span>
          </button>

          {/* Expandable log of individual landings */}
          {showLog && (
            <div style={{ marginTop: 8, background: THEME.surface2, borderRadius: 9, border: `0.5px solid ${THEME.border}`, overflow: "hidden" }}>
              {[...landings].reverse().map((l, idx) => (
                <div key={l.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px",
                  borderBottom: idx < landings.length - 1 ? `0.5px solid ${THEME.separator}` : "none",
                }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 12, color: THEME.textSecondary,
                    minWidth: 42,
                  }}>{formatLandingTime(l.timestamp)}</span>
                  <span style={{
                    fontSize: 12, color: THEME.text, fontFamily: FONT_TEXT,
                    flex: 1,
                  }}>{l.type === "touchgo" ? "Touch & Go" : "Full Stop"}</span>
                  {l.isNight === true && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: THEME.red, fontFamily: FONT_MONO,
                      background: THEME.redDim, border: `0.5px solid ${THEME.red}40`,
                      padding: "2px 6px", borderRadius: 4, letterSpacing: 0.3,
                    }}>NIGHT</span>
                  )}
                  {l.isNight === false && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: THEME.textSecondary, fontFamily: FONT_MONO,
                      background: "transparent", border: `0.5px solid ${THEME.border}`,
                      padding: "2px 6px", borderRadius: 4, letterSpacing: 0.3,
                    }}>DAY</span>
                  )}
                  {l.isNight === null && (
                    <span style={{
                      fontSize: 10, color: THEME.textTertiary, fontFamily: FONT_MONO,
                    }}>—</span>
                  )}
                  <button onClick={() => removeLanding(l.id)} style={{
                    background: "transparent", border: "none",
                    color: THEME.textQuaternary, fontSize: 16,
                    cursor: "pointer", padding: "0 2px", lineHeight: 1,
                  }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 11, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic", lineHeight: 1.45 }}>
            Per <span style={{ fontFamily: FONT_MONO, fontSize: 10 }}>14 CFR 61.57(b)(1)</span>, night for landing currency = 1 hour after sunset to 1 hour before sunrise.
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Lesson Settings ──────────────────────────────────────────────────────────
// Lets the user reorder and toggle visibility of the 6 tools on the lesson page.
// Preferences saved globally to localStorage and apply to all students.

function LessonSettings({ onBack }) {
  const [order, setOrder] = useState(() => getToolOrder());
  const [visible, setVisible] = useState(() => getToolVisibility());

  const toolName = (id) => (TOOLS.find(t => t.id === id) || {}).name || id;

  function moveTool(idx, direction) {
    const newOrder = [...order];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    setOrder(newOrder);
    ls.set("cfi_tool_order", newOrder);
  }

  function toggleVisibility(id) {
    const next = { ...visible, [id]: !visible[id] };
    setVisible(next);
    ls.set("cfi_tool_visible", next);
  }

  function resetAll() {
    if (!window.confirm("Reset tool order and visibility to defaults?\n\nAll 6 tools will be visible in the original order.")) return;
    const defaultOrder = DEFAULT_TOOL_ORDER;
    const defaultVisible = Object.fromEntries(defaultOrder.map(id => [id, true]));
    setOrder(defaultOrder);
    setVisible(defaultVisible);
    ls.set("cfi_tool_order", defaultOrder);
    ls.set("cfi_tool_visible", defaultVisible);
  }

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: FONT_TEXT, paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `0.5px solid ${THEME.separator}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "12px 16px" }}>
          <button onClick={onBack} style={{
            background: "transparent", border: "none",
            color: THEME.red, fontSize: 16, fontWeight: 500,
            cursor: "pointer", padding: "4px 0", fontFamily: FONT_TEXT,
          }}>‹ Lesson</button>
        </div>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "8px 16px 16px" }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: THEME.red, textTransform: "uppercase", fontFamily: FONT_MONO }}>
            Settings
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: -1, color: THEME.text, fontFamily: FONT_DISPLAY, lineHeight: 1.1 }}>
          Lesson Tools
        </h1>
        <p style={{ margin: "6px 0 18px", color: THEME.textSecondary, fontSize: 15, lineHeight: 1.4 }}>
          Customize the order and visibility of tools on the lesson page. Changes apply to all students.
        </p>

        <Card style={{ padding: "8px 0", marginBottom: 14 }}>
          {order.map((id, idx) => {
            const isVisible = visible[id] !== false;
            return (
              <div key={id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 14px",
                borderBottom: idx < order.length - 1 ? `0.5px solid ${THEME.separator}` : "none",
                opacity: isVisible ? 1 : 0.5,
              }}>
                <span style={{
                  fontSize: 15, color: THEME.text,
                  fontFamily: FONT_TEXT, fontWeight: 500,
                  flex: 1, letterSpacing: -0.2,
                }}>{toolName(id)}</span>

                {/* Visibility toggle (iOS-style) */}
                <button onClick={() => toggleVisibility(id)} aria-label={`Toggle ${toolName(id)}`} style={{
                  background: isVisible ? THEME.green : THEME.surface2,
                  border: `1px solid ${isVisible ? THEME.green : THEME.border}`,
                  borderRadius: 100,
                  width: 44, height: 26,
                  cursor: "pointer", padding: 0,
                  position: "relative",
                  transition: "background 0.2s, border-color 0.2s",
                  flexShrink: 0,
                }}>
                  <span style={{
                    position: "absolute",
                    top: 2, left: isVisible ? 20 : 2,
                    width: 20, height: 20,
                    background: "#fff", borderRadius: "50%",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }} />
                </button>

                {/* Reorder up/down */}
                <button onClick={() => moveTool(idx, -1)} disabled={idx === 0} aria-label="Move up" style={{
                  background: idx === 0 ? "transparent" : THEME.surface2,
                  border: `1px solid ${THEME.border}`, borderRadius: 7,
                  color: idx === 0 ? THEME.textQuaternary : THEME.text,
                  fontSize: 12, fontWeight: 700,
                  cursor: idx === 0 ? "default" : "pointer",
                  padding: "5px 9px", lineHeight: 1, opacity: idx === 0 ? 0.4 : 1,
                  fontFamily: FONT_MONO, flexShrink: 0,
                }}>▲</button>
                <button onClick={() => moveTool(idx, 1)} disabled={idx === order.length - 1} aria-label="Move down" style={{
                  background: idx === order.length - 1 ? "transparent" : THEME.surface2,
                  border: `1px solid ${THEME.border}`, borderRadius: 7,
                  color: idx === order.length - 1 ? THEME.textQuaternary : THEME.text,
                  fontSize: 12, fontWeight: 700,
                  cursor: idx === order.length - 1 ? "default" : "pointer",
                  padding: "5px 9px", lineHeight: 1, opacity: idx === order.length - 1 ? 0.4 : 1,
                  fontFamily: FONT_MONO, flexShrink: 0,
                }}>▼</button>
              </div>
            );
          })}
        </Card>

        <div style={{ fontSize: 11, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic", lineHeight: 1.5, marginBottom: 16, textAlign: "center" }}>
          Tap the toggle to hide a tool · Use ▲▼ to reorder
        </div>

        <button onClick={resetAll} style={{
          width: "100%", padding: "12px",
          background: "transparent", border: `1px solid ${THEME.border}`,
          borderRadius: 11, color: THEME.textSecondary,
          fontSize: 14, fontWeight: 500, cursor: "pointer",
          fontFamily: FONT_TEXT,
        }}>Reset to Default</button>
      </div>
    </div>
  );
}

// ─── Main Notes App ───────────────────────────────────────────────────────────

function NotesApp({ student, onBack, onViewHistory, onOpenDayNight, onOpenSettings,
  hobbs, setHobbs, topics, setTopics, checkedTopics, setCheckedTopics, notes, setNotes,
  loggingSplit, clearLoggingSplit,
  landings, setLandings, landingAirport, setLandingAirport,
  imc, setImc,
  currentLessonId, setCurrentLessonId,
  isEditing, onExitEditMode, onLessonCleared }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Tool ordering and visibility — read from localStorage at render time so changes
  // made on the Settings page reflect when the user returns.
  const toolOrder = getToolOrder();
  const toolVisibility = getToolVisibility();
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Build text for clipboard — notes ONLY (clean, focused)
  function buildClipboardText() {
    const lines = [];
    if (!notes.length) return "";
    notes.forEach(n => {
      const text = typeof n === "string" ? n : n.text;
      const subs = typeof n === "string" ? [] : (n.subs || []);
      const isApproach = typeof n !== "string" && n.isApproach;
      if (isApproach) {
        // Approaches use an airplane icon
        lines.push(`✈ ${text}`);
      } else {
        // Other main notes use a small triangle
        lines.push(`▸ ${text}`);
      }
      // Sub-bullets use a small indented bullet
      subs.forEach(s => lines.push(`   • ${s}`));
    });
    return lines.join("\n");
  }

  // Build full text for archive — student info, HOBBS, topics, AND notes
  function buildArchiveText() {
    const lines = [];
    const headerSuffix = student.stage ? ` — ${stageLabel(student)}` : "";
    lines.push(`${student.name} — ${student.trainingType}${headerSuffix}`);
    lines.push(today);
    if (hobbs.out || hobbs.in_ || hobbs.total) {
      const parts = [];
      if (hobbs.out) parts.push(`Out ${hobbs.out}`);
      if (hobbs.in_) parts.push(`In ${hobbs.in_}`);
      if (hobbs.total) parts.push(`Total ${hobbs.total}`);
      lines.push(parts.join(" · "));
    }
    if (topics.length) {
      lines.push("");
      lines.push("Need to Cover:");
      topics.forEach(t => lines.push(`${checkedTopics[t] ? "✓" : "•"} ${t}`));
    }
    if (notes.length) {
      lines.push("");
      lines.push("Notes:");
      notes.forEach(n => {
        const text = typeof n === "string" ? n : n.text;
        const subs = typeof n === "string" ? [] : (n.subs || []);
        const isApproach = typeof n !== "string" && n.isApproach;
        if (isApproach) {
          lines.push(`✈ ${text}`);
        } else {
          lines.push(`▸ ${text}`);
        }
        subs.forEach(s => lines.push(`   • ${s}`));
      });
    }
    return lines.join("\n");
  }

  function saveLesson(opts = {}) {
    const isDraft = !!opts.draft;
    // Archive captures the FULL lesson — student info, HOBBS, topics, notes, landings, etc.
    const hasContent = hobbs.out || hobbs.in_ || hobbs.total || topics.length || notes.length || (landings && landings.length) || (imc && imc.totalSeconds > 0);
    if (!hasContent) return false;

    const archiveKey = `cfi_lessons_${student.id}`;
    const existing = ls.get(archiveKey, []);

    // Use the stable currentLessonId if we have one (from edit or prior save in this session).
    // Otherwise generate a new one and remember it so subsequent saves update in-place.
    let lessonId = currentLessonId;
    let originalTimestamp = null;
    if (lessonId) {
      // Look up the original timestamp so re-saves preserve when the lesson actually happened
      const prior = existing.find(l => l.id === lessonId);
      if (prior) originalTimestamp = prior.timestamp;
    }
    if (!lessonId) {
      lessonId = Date.now().toString();
      if (setCurrentLessonId) setCurrentLessonId(lessonId);
    }

    const lesson = {
      id: lessonId,
      timestamp: originalTimestamp || Date.now(),
      dateLabel: today,
      hobbs,
      topics,
      checkedTopics,
      notes,
      loggingSplit: loggingSplit || null,
      landings: landings || [],
      landingAirport: landingAirport || null,
      imc: imc || null,
      isDraft,
      formattedText: buildArchiveText(),
      studentSnapshot: { name: student.name, trainingType: student.trainingType, stage: student.stage, retrain: student.retrain },
    };

    // Upsert: replace if ID already exists, otherwise prepend
    const idx = existing.findIndex(l => l.id === lessonId);
    let next;
    if (idx >= 0) {
      next = [...existing];
      next[idx] = lesson;
    } else {
      next = [lesson, ...existing];
    }
    ls.set(archiveKey, next);
    return true;
  }

  // ─── Auto-draft ─────────────────────────────────────────────────────────────
  // If the user makes any change and then sits idle for 5 seconds, save what we
  // have to the archive as a DRAFT. This protects against "I forgot to tap Save
  // Lesson and closed the app" — your work-in-progress is always recoverable
  // from History. The upsert-by-currentLessonId logic guarantees no duplicates:
  // every auto-save updates the same archive entry, and the final manual Save
  // Lesson flips isDraft to false on that same entry.
  const autoSaveTimerRef = useRef(null);
  // Pack the values that should trigger an auto-save into a tracking object.
  // We don't include functions or React state-setters since they don't change.
  useEffect(() => {
    // Skip auto-save for empty lessons (nothing to save yet)
    const hasContent = hobbs.out || hobbs.in_ || hobbs.total ||
                       topics.length || notes.length ||
                       (landings && landings.length) || (imc && imc.totalSeconds > 0);
    if (!hasContent) return;

    // Clear any pending timer; restart the 5-second countdown
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveLesson({ draft: true });
      autoSaveTimerRef.current = null;
    }, 5000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hobbs, topics, checkedTopics, notes, landings, landingAirport, imc, loggingSplit]);

  function copyAll() {
    // Cancel any pending auto-draft so it can't race with the manual save below
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    // Clipboard gets ONLY the notes — not student info, HOBBS, or "Need to Cover"
    const clipboardText = buildClipboardText();
    if (clipboardText) {
      navigator.clipboard.writeText(clipboardText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    } else {
      // Still show "copied" feedback even when there are no notes, but write empty
      navigator.clipboard.writeText("").then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    }

    // Also archive the lesson when copying — explicitly NOT a draft
    saveLesson({ draft: false });
  }

  function handleSaveOnly() {
    // Cancel any pending auto-draft so it can't race with the manual save below
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const ok = saveLesson({ draft: false });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      if (isEditing && onExitEditMode) onExitEditMode();
    } else {
      window.alert("Nothing to save yet — fill in HOBBS, topics, notes, or landings first.");
    }
  }

  function clearAll() {
    if (!window.confirm("Clear this lesson?\n\nThis will erase HOBBS, landings, topics, notes, and the logging split. This cannot be undone.")) return;
    // Cancel any pending auto-draft so it can't fire after we've wiped state
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    // Also remove the in-progress draft from the archive if it exists.
    // Without this, clearing the lesson page would leave an orphaned draft in History.
    if (currentLessonId) {
      const archiveKey = `cfi_lessons_${student.id}`;
      const existing = ls.get(archiveKey, []);
      const lesson = existing.find(l => l.id === currentLessonId);
      if (lesson && lesson.isDraft) {
        ls.set(archiveKey, existing.filter(l => l.id !== currentLessonId));
      }
    }
    // Wipe the entire lesson state slot in App() — this is the single source of truth.
    // The lifted state will reset to defaults on next render.
    if (onLessonCleared) {
      onLessonCleared();
    } else {
      // Fallback for edge cases — manually clear each field
      setHobbs({ out: "", in_: "", total: "", calculatedField: null });
      setTopics([]); setCheckedTopics({}); setNotes([]);
      if (setLandings) setLandings([]);
      if (setLandingAirport) setLandingAirport(null);
      if (clearLoggingSplit) clearLoggingSplit();
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: FONT_TEXT, paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
      {/* iOS-style large title nav */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `0.5px solid ${THEME.separator}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <button onClick={onBack} style={{
              background: "transparent", border: "none",
              color: THEME.red, fontSize: 16, fontWeight: 400,
              cursor: "pointer", padding: "4px 0",
              display: "flex", alignItems: "center", gap: 2,
              fontFamily: FONT_TEXT,
            }}>‹ Students</button>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {!student.oneTime && (
                <button onClick={onViewHistory} style={{
                  background: "transparent", border: "none",
                  color: THEME.red, fontSize: 16, fontWeight: 400,
                  cursor: "pointer", padding: "4px 8px", fontFamily: FONT_TEXT,
                }}>History</button>
              )}
              <button onClick={onOpenSettings} aria-label="Settings" style={{
                background: "transparent", border: "none",
                color: THEME.red,
                cursor: "pointer", padding: "4px 0", fontFamily: FONT_TEXT,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Gear icon SVG */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Large title section */}
      <div style={{ maxWidth: 580, margin: "0 auto", padding: "8px 16px 16px" }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 1,
            color: THEME.red, textTransform: "uppercase", fontFamily: FONT_MONO,
          }}>{student.trainingType}{student.stage ? ` · ${stageLabel(student)}` : ""}{student.oneTime ? " · One-time" : ""} · {today}</span>
        </div>
        <h1 style={{
          margin: 0, fontSize: 34, fontWeight: 700,
          letterSpacing: -1, color: THEME.text, fontFamily: FONT_DISPLAY,
          lineHeight: 1.1,
        }}>{student.name}</h1>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "0 16px" }}>
        {isEditing && (
          <div style={{
            padding: "10px 14px",
            marginBottom: 14,
            background: `${THEME.red}1a`,
            border: `1px solid ${THEME.red}40`,
            borderRadius: 10,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 14 }}>✏️</span>
            <div style={{ flex: 1, fontSize: 12, color: THEME.text, fontFamily: FONT_TEXT, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600 }}>Editing saved lesson.</span>{" "}
              <span style={{ color: THEME.textSecondary }}>Tap Save Lesson when done — the original will be replaced.</span>
            </div>
          </div>
        )}
        {/* Tools — rendered in user-customized order, hidden tools skipped.
            Order and visibility are configured on the Settings page (gear icon). */}
        {(() => {
          const renderTool = (id) => {
            switch (id) {
              case "hobbs":
                return <HobbsSection data={hobbs} setData={setHobbs} />;
              case "solar":
                return (
                  <>
                    <button onClick={() => onOpenDayNight(hobbs.total || "")} style={{
                      width: "100%", padding: "11px",
                      background: "transparent", border: `1px solid ${THEME.border}`,
                      borderRadius: 11, color: THEME.textSecondary,
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      fontFamily: FONT_TEXT, marginBottom: loggingSplit ? 8 : 16,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                      <span style={{ fontSize: 14 }}>☀️</span>
                      <span>Solar Information</span>
                    </button>
                    {loggingSplit && (
                      <div style={{
                        display: "flex", alignItems: "center",
                        padding: "8px 14px",
                        marginBottom: 16,
                        background: THEME.surface,
                        border: `0.5px solid ${THEME.border}`,
                        borderRadius: 10,
                        gap: 12,
                      }}>
                        <span style={{ fontSize: 13, opacity: 0.7 }}>☀️</span>
                        <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 14, fontFamily: FONT_TEXT, fontSize: 13, color: THEME.textSecondary, letterSpacing: -0.1 }}>
                          <span>Day <span style={{ color: THEME.text, fontFamily: FONT_MONO, fontWeight: 600, letterSpacing: 0 }}>{loggingSplit.dayHours.toFixed(1)}</span></span>
                          <span>Night <span style={{ color: THEME.red, fontFamily: FONT_MONO, fontWeight: 600, letterSpacing: 0 }}>{loggingSplit.nightHours.toFixed(1)}</span></span>
                          <span style={{ color: THEME.textTertiary }}>Total <span style={{ color: THEME.textSecondary, fontFamily: FONT_MONO, fontWeight: 500, letterSpacing: 0 }}>{loggingSplit.totalHours.toFixed(1)}</span></span>
                        </div>
                      </div>
                    )}
                  </>
                );
              case "wind":
                return <WindComponent />;
              case "landings":
                return <LandingTracker landings={landings} setLandings={setLandings} landingAirport={landingAirport} setLandingAirport={setLandingAirport} />;
              case "imc":
                return <IMCTimer imc={imc} setImc={setImc} />;
              case "topics":
                return <TopicPicker trainingType={student.trainingType} stage={student.stage} topics={topics} setTopics={setTopics} checked={checkedTopics} setChecked={setCheckedTopics} />;
              case "notes":
                return <NotesSection trainingType={student.trainingType} notes={notes} setNotes={setNotes} />;
              default:
                return null;
            }
          };
          return toolOrder
            .filter(id => toolVisibility[id] !== false)
            .map(id => <div key={id}>{renderTool(id)}</div>);
        })()}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={copyAll} style={{
            flex: 1,
            background: copied ? THEME.green : THEME.red,
            border: "none", borderRadius: 13,
            color: "#fff", fontWeight: 600, fontSize: 15,
            padding: "14px 10px", cursor: "pointer",
            fontFamily: FONT_TEXT, letterSpacing: -0.2,
            transition: "all 0.25s",
            boxShadow: copied ? "0 4px 24px rgba(48,209,88,0.3)" : `0 4px 20px ${THEME.redGlow}`,
          }}>{copied ? "✓ Copied" : "Copy Notes"}</button>
          <button onClick={handleSaveOnly} style={{
            flex: 1,
            background: saved ? THEME.green : THEME.surface,
            border: saved ? "none" : `1px solid ${THEME.border}`,
            borderRadius: 13,
            color: saved ? "#fff" : THEME.text,
            fontSize: 15, fontWeight: 600,
            padding: "14px 10px", cursor: "pointer",
            fontFamily: FONT_TEXT, letterSpacing: -0.2,
            transition: "all 0.25s",
            boxShadow: saved ? "0 4px 24px rgba(48,209,88,0.3)" : "none",
          }}>{saved ? "✓ Saved" : "Save Lesson"}</button>
          <button onClick={clearAll} style={{
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            borderRadius: 13, color: THEME.textSecondary,
            fontSize: 14, padding: "14px 14px", cursor: "pointer",
            fontFamily: FONT_TEXT, fontWeight: 500,
          }}>Clear</button>
        </div>

        {/* Live preview */}
        {notes.length > 0 && (
          <Card style={{ padding: 14, marginBottom: 20 }}>
            <SectionLabel style={{ padding: "0 0 8px" }}>Clipboard Preview</SectionLabel>
            <pre style={{
              margin: 0, fontSize: 13,
              color: THEME.textSecondary,
              fontFamily: FONT_MONO,
              whiteSpace: "pre-wrap", lineHeight: 1.55,
              maxHeight: 240, overflowY: "auto",
            }}>{buildClipboardText()}</pre>
            <div style={{ marginTop: 10, fontSize: 11, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic" }}>
              Only notes are copied. Full lesson (HOBBS, topics, etc.) is saved to History.
            </div>
          </Card>
        )}
      </div>
      <CreditBadge />
    </div>
  );
}

// ─── Past Lessons List ────────────────────────────────────────────────────────

function PastLessonsList({ student, onBack, onSelectLesson }) {
  const archiveKey = `cfi_lessons_${student.id}`;
  // Drafts always sorted to the top; within each group, newest first
  const [lessons, setLessons] = useState(() => {
    const raw = ls.get(archiveKey, []);
    return [...raw].sort((a, b) => {
      if (!!a.isDraft !== !!b.isDraft) return a.isDraft ? -1 : 1;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  function deleteLesson(id) {
    const next = lessons.filter(l => l.id !== id);
    setLessons(next); ls.set(archiveKey, next);
    setConfirmDelete(null);
  }

  function lessonSummary(l) {
    const bits = [];
    if (l.topics?.length) bits.push(`${l.topics.length} topic${l.topics.length === 1 ? "" : "s"}`);
    if (l.notes?.length) bits.push(`${l.notes.length} note${l.notes.length === 1 ? "" : "s"}`);
    if (l.hobbs?.total) bits.push(`${l.hobbs.total} hrs`);
    return bits.join(" · ") || "—";
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (sameDay) return `Today · ${time}`;
    if (isYesterday) return `Yesterday · ${time}`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ` · ${time}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: FONT_TEXT, paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `0.5px solid ${THEME.separator}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "12px 16px" }}>
          <button onClick={onBack} style={{
            background: "transparent", border: "none",
            color: THEME.red, fontSize: 16, fontWeight: 400,
            cursor: "pointer", padding: "4px 0",
            display: "flex", alignItems: "center", gap: 2,
            fontFamily: FONT_TEXT,
          }}>‹ Back</button>
        </div>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "8px 16px 16px" }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: THEME.red, textTransform: "uppercase", fontFamily: FONT_MONO }}>
            {student.trainingType}{student.stage ? ` · ${stageLabel(student)}` : ""} · {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: -1, color: THEME.text, fontFamily: FONT_DISPLAY, lineHeight: 1.1 }}>
          {student.name}
        </h1>
        <p style={{ margin: "6px 0 16px", color: THEME.textSecondary, fontSize: 15 }}>Lesson history</p>

        {lessons.length === 0 ? (
          <Card style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📋</div>
            <div style={{ fontSize: 16, color: THEME.text, fontWeight: 500, marginBottom: 6, letterSpacing: -0.2 }}>No lessons yet</div>
            <div style={{ fontSize: 14, color: THEME.textSecondary, lineHeight: 1.5 }}>
              Lessons are saved automatically<br/>when you tap "Copy Notes"
            </div>
          </Card>
        ) : (
          <Card>
            {lessons.map((l, i) => (
              <div key={l.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                borderBottom: i < lessons.length - 1 ? `0.5px solid ${THEME.separator}` : "none",
              }}>
                <div onClick={() => onSelectLesson(l)} style={{ flex: 1, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: THEME.red, fontFamily: FONT_MONO, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
                      {formatDate(l.timestamp)}
                    </span>
                    {l.isDraft && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: THEME.red,
                        fontFamily: FONT_MONO, letterSpacing: 0.5,
                        background: `${THEME.red}1a`, border: `1px solid ${THEME.red}50`,
                        padding: "1px 6px", borderRadius: 4, textTransform: "uppercase",
                      }}>Draft</span>
                    )}
                  </div>
                  <div style={{ fontSize: 16, color: THEME.text, fontWeight: 500, letterSpacing: -0.2, marginBottom: 2 }}>
                    {l.studentSnapshot?.stage ? `${l.studentSnapshot.trainingType} — ${stageLabel(l.studentSnapshot)}` : "Lesson"}
                  </div>
                  <div style={{ fontSize: 13, color: THEME.textSecondary }}>
                    {lessonSummary(l)}
                  </div>
                </div>
                {confirmDelete === l.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => deleteLesson(l.id)} style={{ background: THEME.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "6px 11px", cursor: "pointer" }}>Delete</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textSecondary, fontSize: 12, padding: "6px 11px", cursor: "pointer" }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setConfirmDelete(l.id)} style={{ background: "transparent", border: "none", color: THEME.textQuaternary, fontSize: 20, cursor: "pointer", padding: "4px 6px", lineHeight: 1 }}>×</button>
                    <span style={{ color: THEME.textQuaternary, fontSize: 17, marginLeft: -4 }}>›</span>
                  </>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Past Lesson Detail (read-only view) ──────────────────────────────────────

function PastLessonDetail({ lesson, onBack, onEdit }) {
  const [copied, setCopied] = useState(false);

  // Build notes-only clipboard text from the archived lesson — matches Copy Notes format
  function buildNotesOnly() {
    const archivedNotes = lesson.notes || [];
    if (!archivedNotes.length) return "";
    const lines = [];
    archivedNotes.forEach(n => {
      const text = typeof n === "string" ? n : n.text;
      const subs = typeof n === "string" ? [] : (n.subs || []);
      const isApproach = typeof n !== "string" && n.isApproach;
      if (isApproach) {
        lines.push(`✈ ${text}`);
      } else {
        lines.push(`▸ ${text}`);
      }
      subs.forEach(s => lines.push(`   • ${s}`));
    });
    return lines.join("\n");
  }

  function copyAgain() {
    const notesOnly = buildNotesOnly();
    navigator.clipboard.writeText(notesOnly).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  };

  const hobbs = lesson.hobbs || {};
  const topics = lesson.topics || [];
  const checkedTopics = lesson.checkedTopics || {};
  const notes = lesson.notes || [];

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: FONT_TEXT, paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `0.5px solid ${THEME.separator}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "12px 16px" }}>
          <button onClick={onBack} style={{
            background: "transparent", border: "none",
            color: THEME.red, fontSize: 16, fontWeight: 400,
            cursor: "pointer", padding: "4px 0", fontFamily: FONT_TEXT,
          }}>‹ History</button>
        </div>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "8px 16px 16px" }}>
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: THEME.red, textTransform: "uppercase", fontFamily: FONT_MONO }}>
            {lesson.studentSnapshot?.trainingType || ""}{lesson.studentSnapshot?.stage ? ` · ${stageLabel(lesson.studentSnapshot)}` : ""} · {formatDate(lesson.timestamp)}
          </span>
          {lesson.isDraft && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: THEME.red,
              fontFamily: FONT_MONO, letterSpacing: 0.5,
              background: `${THEME.red}1a`, border: `1px solid ${THEME.red}50`,
              padding: "2px 7px", borderRadius: 4, textTransform: "uppercase",
            }}>Draft</span>
          )}
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.8, color: THEME.text, fontFamily: FONT_DISPLAY, lineHeight: 1.15 }}>
          {lesson.studentSnapshot?.name || "Lesson"}
        </h1>

        {(hobbs.out || hobbs.in_ || hobbs.total) && (
          <Card style={{ padding: "14px 16px", marginTop: 16, marginBottom: 14 }}>
            <SectionLabel style={{ padding: "0 0 10px" }}>HOBBS & Time</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Out", val: hobbs.out },
                { label: "In", val: hobbs.in_ },
                { label: "Total", val: hobbs.total },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.2 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: val ? THEME.text : THEME.textTertiary, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>
                    {val || "—"}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Logging Split — only if it was saved with this lesson */}
        {lesson.loggingSplit && (
          <Card style={{ padding: "14px 16px", marginBottom: 14, border: `1px solid ${THEME.red}40` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 0 10px" }}>
              <SectionLabel style={{ padding: 0 }}>Logging Split</SectionLabel>
              <span style={{ fontSize: 13, color: THEME.textTertiary, fontFamily: FONT_TEXT }}>☀️</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Total</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: THEME.text, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{lesson.loggingSplit.totalHours.toFixed(1)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Day</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: THEME.text, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{lesson.loggingSplit.dayHours.toFixed(1)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Night</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: THEME.red, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{lesson.loggingSplit.nightHours.toFixed(1)}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Landings — only if any were logged this lesson */}
        {lesson.landings && lesson.landings.length > 0 && (
          <Card style={{ padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <SectionLabel style={{ padding: 0 }}>Landings</SectionLabel>
              {lesson.landingAirport && (
                <span style={{ fontSize: 11, color: THEME.textSecondary, fontFamily: FONT_MONO, fontWeight: 600 }}>
                  @ {lesson.landingAirport[0]}
                </span>
              )}
            </div>
            {(() => {
              const tg = lesson.landings.filter(l => l.type === "touchgo").length;
              const fs = lesson.landings.filter(l => l.type === "fullstop").length;
              const night = lesson.landings.filter(l => l.isNight === true).length;
              const day = lesson.landings.filter(l => l.isNight === false).length;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>T&G</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: THEME.text, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{tg}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Full Stop</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: THEME.text, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{fs}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Day</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: THEME.text, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{day}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Night</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: THEME.red, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{night}</div>
                  </div>
                </div>
              );
            })()}
            <div style={{ background: THEME.surface2, borderRadius: 9, border: `0.5px solid ${THEME.border}`, overflow: "hidden" }}>
              {lesson.landings.map((l, idx) => (
                <div key={l.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px",
                  borderBottom: idx < lesson.landings.length - 1 ? `0.5px solid ${THEME.separator}` : "none",
                }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: THEME.textSecondary, minWidth: 42 }}>
                    {new Date(l.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                  <span style={{ fontSize: 12, color: THEME.text, fontFamily: FONT_TEXT, flex: 1 }}>
                    {l.type === "touchgo" ? "Touch & Go" : "Full Stop"}
                  </span>
                  {l.isNight === true && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: THEME.red, fontFamily: FONT_MONO,
                      background: THEME.redDim, border: `0.5px solid ${THEME.red}40`,
                      padding: "2px 6px", borderRadius: 4, letterSpacing: 0.3,
                    }}>NIGHT</span>
                  )}
                  {l.isNight === false && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: THEME.textSecondary, fontFamily: FONT_MONO,
                      background: "transparent", border: `0.5px solid ${THEME.border}`,
                      padding: "2px 6px", borderRadius: 4, letterSpacing: 0.3,
                    }}>DAY</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* IMC / Actual Instrument Time */}
        {lesson.imc && (lesson.imc.totalSeconds > 0 || lesson.imc.entryAlt || lesson.imc.exitAlt) && (
          <Card style={{ padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ marginBottom: 10 }}>
              <SectionLabel style={{ padding: 0 }}>Actual Instrument Time</SectionLabel>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: lesson.imc.entryAlt || lesson.imc.exitAlt ? 12 : 0 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Total</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: THEME.red, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{(lesson.imc.totalSeconds / 3600).toFixed(1)}</div>
                <div style={{ fontSize: 10, color: THEME.textTertiary, fontFamily: FONT_TEXT, marginTop: 2 }}>hrs</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Entry Alt</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: lesson.imc.entryAlt ? THEME.text : THEME.textTertiary, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{lesson.imc.entryAlt || "—"}</div>
                <div style={{ fontSize: 10, color: THEME.textTertiary, fontFamily: FONT_TEXT, marginTop: 2 }}>MSL</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Exit Alt</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: lesson.imc.exitAlt ? THEME.text : THEME.textTertiary, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{lesson.imc.exitAlt || "—"}</div>
                <div style={{ fontSize: 10, color: THEME.textTertiary, fontFamily: FONT_TEXT, marginTop: 2 }}>MSL</div>
              </div>
            </div>
          </Card>
        )}

        {topics.length > 0 && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${THEME.separator}` }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: THEME.text, letterSpacing: -0.3, fontFamily: FONT_DISPLAY }}>Covered</span>
            </div>
            {topics.map((t, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                borderBottom: i < topics.length - 1 ? `0.5px solid ${THEME.separator}` : "none",
                opacity: checkedTopics[t] ? 0.5 : 1,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  border: checkedTopics[t] ? "none" : `1.5px solid ${THEME.textQuaternary}`,
                  background: checkedTopics[t] ? THEME.green : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {checkedTopics[t] && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 15, color: THEME.text, textDecoration: checkedTopics[t] ? "line-through" : "none", letterSpacing: -0.2 }}>{t}</span>
              </div>
            ))}
          </Card>
        )}

        {notes.length > 0 && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${THEME.separator}` }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: THEME.text, letterSpacing: -0.3, fontFamily: FONT_DISPLAY }}>Notes</span>
            </div>
            {notes.map((note, i) => {
              const text = typeof note === "string" ? note : note.text;
              const subs = typeof note === "string" ? [] : (note.subs || []);
              const isApproach = typeof note !== "string" && note.isApproach;
              return (
                <div key={i} style={{
                  padding: "12px 16px",
                  borderBottom: i < notes.length - 1 ? `0.5px solid ${THEME.separator}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{
                      color: THEME.red,
                      fontSize: isApproach ? 18 : 14,
                      lineHeight: "20px", flexShrink: 0, marginTop: 1,
                    }}>{isApproach ? "✈" : "▸"}</span>
                    <span style={{
                      flex: 1,
                      fontSize: isApproach ? 17 : 15,
                      fontWeight: isApproach ? 700 : 400,
                      color: THEME.text, lineHeight: 1.4,
                      letterSpacing: -0.3,
                    }}>{text}</span>
                  </div>
                  {subs.length > 0 && (
                    <div style={{ marginLeft: 28, marginTop: 6 }}>
                      {subs.map((s, si) => (
                        <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
                          <span style={{ color: THEME.textTertiary, fontSize: 13, marginTop: 2 }}>•</span>
                          <span style={{ flex: 1, fontSize: 14, color: THEME.textSecondary, lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={copyAgain} style={{
            flex: 1,
            background: copied ? THEME.green : THEME.red,
            border: "none", borderRadius: 13,
            color: "#fff", fontWeight: 600, fontSize: 15,
            padding: "14px 10px", cursor: "pointer",
            fontFamily: FONT_TEXT, letterSpacing: -0.2,
            boxShadow: copied ? "0 4px 24px rgba(48,209,88,0.3)" : `0 4px 20px ${THEME.redGlow}`,
            transition: "all 0.25s",
          }}>{copied ? "✓ Copied" : "Copy Again"}</button>
          {onEdit && (
            <button onClick={() => onEdit(lesson)} style={{
              flex: 1,
              background: THEME.surface,
              border: `1px solid ${THEME.border}`,
              borderRadius: 13,
              color: THEME.text, fontSize: 15, fontWeight: 600,
              padding: "14px 10px", cursor: "pointer",
              fontFamily: FONT_TEXT, letterSpacing: -0.2,
            }}>Edit Lesson</button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Airports Database ───────────────────────────────────────────────────────
const AIRPORTS = [
["KATL","Hartsfield-Jackson Atlanta Intl",33.6407,-84.4277],
  ["KLAX","Los Angeles Intl",33.9425,-118.4081],
  ["KORD","Chicago O'Hare Intl",41.9742,-87.9073],
  ["KDFW","Dallas/Fort Worth Intl",32.8998,-97.0403],
  ["KDEN","Denver Intl",39.8561,-104.6737],
  ["KJFK","John F Kennedy Intl",40.6398,-73.7789],
  ["KSFO","San Francisco Intl",37.6213,-122.379],
  ["KSEA","Seattle-Tacoma Intl",47.4502,-122.3088],
  ["KLAS","Harry Reid Intl (Las Vegas)",36.084,-115.1537],
  ["KMCO","Orlando Intl",28.4294,-81.3089],
  ["KEWR","Newark Liberty Intl",40.6925,-74.1687],
  ["KCLT","Charlotte Douglas Intl",35.214,-80.9431],
  ["KPHX","Phoenix Sky Harbor Intl",33.4343,-112.0117],
  ["KIAH","George Bush Intercontinental",29.9844,-95.3414],
  ["KMIA","Miami Intl",25.7959,-80.287],
  ["KBOS","Boston Logan Intl",42.3656,-71.0096],
  ["KMSP","Minneapolis-Saint Paul Intl",44.8848,-93.2223],
  ["KFLL","Fort Lauderdale-Hollywood Intl",26.0742,-80.1506],
  ["KDTW","Detroit Metropolitan Wayne County",42.2124,-83.3534],
  ["KPHL","Philadelphia Intl",39.8729,-75.2437],
  ["KLGA","LaGuardia",40.7772,-73.8726],
  ["KBWI","Baltimore/Washington Intl",39.1754,-76.6683],
  ["KSLC","Salt Lake City Intl",40.7884,-111.9778],
  ["KDCA","Ronald Reagan Washington National",38.8521,-77.0377],
  ["KIAD","Washington Dulles Intl",38.9531,-77.4565],
  ["KMDW","Chicago Midway Intl",41.7868,-87.7522],
  ["KSAN","San Diego Intl",32.7338,-117.1933],
  ["KTPA","Tampa Intl",27.9755,-82.5332],
  ["KHOU","William P Hobby (Houston)",29.6454,-95.2789],
  ["KPDX","Portland Intl",45.5887,-122.5975],
  ["KSTL","St Louis Lambert Intl",38.7487,-90.37],
  ["KAUS","Austin-Bergstrom Intl",30.1945,-97.6699],
  ["KBNA","Nashville Intl",36.1245,-86.6782],
  ["KOAK","Oakland Intl",37.7213,-122.2208],
  ["KSAT","San Antonio Intl",29.5337,-98.4698],
  ["KRDU","Raleigh-Durham Intl",35.8776,-78.7875],
  ["KSJC","Norman Y Mineta San Jose Intl",37.3626,-121.929],
  ["KSMF","Sacramento Intl",38.6954,-121.5908],
  ["KMSY","Louis Armstrong New Orleans",29.9934,-90.258],
  ["KCLE","Cleveland Hopkins Intl",41.4117,-81.8498],
  ["KPIT","Pittsburgh Intl",40.4915,-80.2329],
  ["KMCI","Kansas City Intl",39.2976,-94.7139],
  ["KIND","Indianapolis Intl",39.7173,-86.2944],
  ["KCMH","John Glenn Columbus Intl",39.998,-82.8919],
  ["KMKE","General Mitchell Intl (Milwaukee)",42.9472,-87.8965],
  ["KCVG","Cincinnati/Northern Kentucky Intl",39.0488,-84.6678],
  ["KSDF","Louisville Muhammad Ali Intl",38.1744,-85.7361],
  ["KMEM","Memphis Intl",35.0424,-89.9767],
  ["KJAX","Jacksonville Intl",30.4941,-81.6878],
  ["KRSW","Southwest Florida Intl",26.5362,-81.7552],
  ["KPBI","Palm Beach Intl",26.6832,-80.0956],
  ["KCHS","Charleston Intl",32.8986,-80.0405],
  ["KORF","Norfolk Intl",36.8946,-76.2012],
  ["KRIC","Richmond Intl",37.5052,-77.3197],
  ["KGSP","Greenville-Spartanburg Intl",34.8957,-82.2189],
  ["KBHM","Birmingham-Shuttlesworth Intl",33.5629,-86.7535],
  ["KOKC","Will Rogers World (Oklahoma City)",35.3931,-97.6007],
  ["KTUL","Tulsa Intl",36.1984,-95.8881],
  ["KLIT","Bill and Hillary Clinton National",34.7294,-92.2243],
  ["KOMA","Eppley Airfield (Omaha)",41.3032,-95.8941],
  ["KDSM","Des Moines Intl",41.534,-93.6631],
  ["KBOI","Boise Air Terminal",43.5644,-116.2228],
  ["KGEG","Spokane Intl",47.6199,-117.5339],
  ["KABQ","Albuquerque Intl Sunport",35.0402,-106.6092],
  ["KTUS","Tucson Intl",32.1161,-110.941],
  ["KELP","El Paso Intl",31.8072,-106.3781],
  ["KBUR","Bob Hope (Burbank)",34.2007,-118.3585],
  ["KSNA","John Wayne (Santa Ana)",33.6757,-117.8682],
  ["KONT","Ontario Intl",34.056,-117.6012],
  ["KLGB","Long Beach",33.8177,-118.1516],
  ["KRNO","Reno-Tahoe Intl",39.4991,-119.7681],
  ["KHNL","Daniel K Inouye Intl (Honolulu)",21.3245,-157.9251],
  ["KANC","Ted Stevens Anchorage Intl",61.1744,-149.9961],
  ["KBUF","Buffalo Niagara Intl",42.9405,-78.7322],
  ["KROC","Greater Rochester Intl",43.1189,-77.6724],
  ["KSYR","Syracuse Hancock Intl",43.1112,-76.1063],
  ["KALB","Albany Intl",42.7483,-73.8017],
  ["KBDL","Bradley Intl",41.9389,-72.6832],
  ["KPVD","Theodore Francis Green State",41.724,-71.4283],
  ["KMHT","Manchester-Boston Regional",42.9326,-71.4357],
  ["KPWM","Portland Intl Jetport",43.6462,-70.3093],
  ["KBTV","Burlington Intl",44.4719,-73.1533],
  ["KBGM","Greater Binghamton",42.2087,-75.9798],
  ["KISP","Long Island MacArthur",40.7952,-73.1002],
  ["KSWF","New York Stewart Intl",41.5041,-74.1048],
  ["KHPN","Westchester County",41.067,-73.7076],
  ["KTEB","Teterboro",40.8501,-74.0608],
  ["KFRG","Republic",40.7288,-73.4134],
  ["KBED","Laurence G Hanscom Field",42.47,-71.289],
  ["KBVY","Beverly Regional",42.5841,-70.9165],
  ["KORH","Worcester Regional",42.2673,-71.8757],
  ["KADS","Addison",32.9686,-96.8364],
  ["KDAL","Dallas Love Field",32.8471,-96.8518],
  ["KAFW","Fort Worth Alliance",32.9876,-97.3188],
  ["KFTW","Fort Worth Meacham Intl",32.8198,-97.3624],
  ["KFWS","Fort Worth Spinks",32.5654,-97.3084],
  ["KGKY","Arlington Municipal",32.6638,-97.0942],
  ["KGPM","Grand Prairie Municipal",32.6987,-97.0469],
  ["KRBD","Dallas Executive",32.6809,-96.8682],
  ["KMKN","Comanche County-City",31.9159,-98.6024],
  ["KTRL","Terrell Municipal",32.7088,-96.2675],
  ["KMWL","Mineral Wells Regional",32.7816,-98.0602],
  ["KGYI","Grayson County (Sherman)",33.714,-96.6735],
  ["KCNW","TSTC Waco",31.6378,-97.0741],
  ["KACT","Waco Regional",31.6113,-97.2305],
  ["KTYR","Tyler Pounds Regional",32.354,-95.4024],
  ["KGGG","East Texas Regional",32.3839,-94.7115],
  ["KLFK","Angelina County",31.234,-94.75],
  ["KBPT","Jack Brooks Regional",29.9508,-94.0207],
  ["KCLL","Easterwood Field (College Station)",30.5886,-96.3638],
  ["KILE","Skylark Field (Killeen)",31.0859,-97.6864],
  ["KGRK","Robert Gray AAF (Killeen)",31.0672,-97.8289],
  ["KHRL","Valley Intl (Harlingen)",26.2285,-97.6544],
  ["KBRO","Brownsville/South Padre",25.9068,-97.4259],
  ["KMFE","McAllen Intl",26.1758,-98.2386],
  ["KLRD","Laredo Intl",27.5438,-99.4616],
  ["KCRP","Corpus Christi Intl",27.7704,-97.5012],
  ["KVCT","Victoria Regional",28.8526,-96.9185],
  ["KMAF","Midland Intl Air & Space Port",31.9425,-102.2019],
  ["KECU","Edwards County",29.6443,-100.0193],
  ["KSJT","San Angelo Regional",31.3577,-100.4963],
  ["KABI","Abilene Regional",32.4113,-99.6819],
  ["KLBB","Lubbock Preston Smith Intl",33.6636,-101.8228],
  ["KAMA","Rick Husband Amarillo Intl",35.2194,-101.7059],
  ["KGNV","Gainesville Municipal",33.6515,-97.1969],
  ["KDTO","Denton Enterprise",33.2007,-97.1981],
  ["KLNC","Lancaster Regional",32.5793,-96.7193],
  ["KTKI","McKinney National",33.178,-96.5905],
  ["KCXO","Conroe-North Houston Regional",30.3518,-95.4145],
  ["KEFD","Ellington Field",29.6073,-95.1588],
  ["KSGR","Sugar Land Regional",29.6223,-95.6566],
  ["KIWS","West Houston",29.8181,-95.6726],
  ["KLVJ","Pearland Regional",29.5208,-95.2418],
  ["KEDC","Austin Executive",30.1976,-97.6699],
  ["KGTU","Georgetown Municipal",30.6788,-97.6794],
  ["KSSF","Stinson Municipal",29.337,-98.4712],
  ["KFAT","Fresno Yosemite Intl",36.7762,-119.7181],
  ["KCMA","Camarillo",34.2138,-119.0941],
  ["KSBA","Santa Barbara Municipal",34.4262,-119.8404],
  ["KMRY","Monterey Regional",36.587,-121.8429],
  ["KAPC","Napa County",38.2132,-122.2807],
  ["KCCR","Buchanan Field",37.9897,-122.0567],
  ["KHAF","Half Moon Bay",37.5135,-122.5012],
  ["KPAO","Palo Alto",37.4611,-122.115],
  ["KRHV","Reid-Hillview",37.3329,-121.8197],
  ["KSQL","San Carlos",37.5119,-122.2495],
  ["KHWD","Hayward Executive",37.6593,-122.1218],
  ["KLVK","Livermore Municipal",37.6934,-121.8197],
  ["KSTS","Charles M Schulz-Sonoma County",38.509,-122.8128],
  ["KSAC","Sacramento Executive",38.5125,-121.4929],
  ["KMHR","Sacramento Mather",38.5538,-121.2978],
  ["KSCK","Stockton Metropolitan",37.8942,-121.2386],
  ["KMOD","Modesto City-County",37.6258,-120.9544],
  ["KMER","Castle",37.3805,-120.5681],
  ["KOXR","Oxnard",34.2008,-119.2071],
  ["KVNY","Van Nuys",34.2098,-118.49],
  ["KFUL","Fullerton Municipal",33.872,-117.9799],
  ["KCRQ","McClellan-Palomar (Carlsbad)",33.1283,-117.2802],
  ["KMYF","Montgomery-Gibbs Executive",32.8157,-117.1396],
  ["KSEE","Gillespie Field",32.8262,-116.9722],
  ["KRAL","Riverside Municipal",33.9519,-117.445],
  ["KCNO","Chino",33.9747,-117.6371],
  ["KPOC","Brackett Field",34.0916,-117.7817],
  ["KEMT","San Gabriel Valley",34.086,-118.0356],
  ["KWHP","Whiteman",34.2593,-118.4135],
  ["KCCB","Cable",34.1116,-117.6884],
  ["KAJO","Corona Municipal",33.8978,-117.6024],
  ["KPSP","Palm Springs Intl",33.8297,-116.5067],
  ["KBFL","Meadows Field (Bakersfield)",35.4336,-119.0567],
  ["KOPF","Opa-Locka Executive",25.907,-80.2784],
  ["KTMB","Miami Executive",25.6479,-80.4328],
  ["KFXE","Fort Lauderdale Executive",26.1973,-80.1707],
  ["KAPF","Naples Municipal",26.1525,-81.7752],
  ["KBKV","Hernando County",28.4737,-82.454],
  ["KISM","Kissimmee Gateway",28.2898,-81.4371],
  ["KORL","Orlando Executive",28.5455,-81.3328],
  ["KSFB","Orlando Sanford Intl",28.7776,-81.2375],
  ["KDAB","Daytona Beach Intl",29.1799,-81.0581],
  ["KOCF","Ocala Intl",29.1726,-82.2241],
  ["KTLH","Tallahassee Intl",30.3965,-84.3503],
  ["KPNS","Pensacola Intl",30.4734,-87.1866],
  ["KECP","Northwest Florida Beaches Intl",30.3417,-85.7975],
  ["KVPS","Destin-Fort Walton Beach",30.4832,-86.5254],
  ["KSGJ","Northeast Florida Regional",29.9592,-81.3398],
  ["KCRG","Jacksonville Executive",30.3363,-81.5142],
  ["KFMH","Joint Base Cape Cod",41.6584,-70.5217],
  ["KOWD","Norwood Memorial",42.1905,-71.1729],
  ["KPYM","Plymouth Municipal",41.9092,-70.7287],
  ["KFIT","Fitchburg Municipal",42.5541,-71.761],
  ["KGON","Groton-New London",41.3301,-72.0451],
  ["KOXC","Waterbury-Oxford",41.4787,-73.1352],
  ["KHFD","Hartford-Brainard",41.7367,-72.6494],
  ["KDXR","Danbury Municipal",41.3715,-73.4822],
  ["KBDR","Igor I Sikorsky Memorial",41.1635,-73.1262],
  ["KMMU","Morristown Municipal",40.7995,-74.415],
  ["KCDW","Essex County",40.8752,-74.2814],
  ["KLDJ","Linden",40.6174,-74.2446],
  ["KFOK","Francis S Gabreski",40.8438,-72.6318],
  ["KMTN","Martin State",39.3258,-76.4138],
  ["KAPA","Centennial (Denver)",39.5701,-104.8488],
  ["KBJC","Rocky Mountain Metropolitan",39.9088,-105.1172],
  ["KFTG","Front Range",39.7853,-104.5433],
  ["KCOS","Colorado Springs",38.8058,-104.7008],
  ["KFNL","Northern Colorado Regional",40.4519,-105.0114],
  ["KGJT","Grand Junction Regional",39.1224,-108.5267],
  ["KASE","Aspen-Pitkin County",39.2232,-106.8687],
  ["KEGE","Eagle County Regional",39.6426,-106.9177],
  ["KJAC","Jackson Hole",43.6073,-110.7378],
  ["KBZN","Bozeman Yellowstone Intl",45.7775,-111.1611],
  ["KMSO","Missoula Intl",46.9163,-114.0906],
  ["KHLN","Helena Regional",46.6068,-111.9828],
  ["KGTF","Great Falls Intl",47.482,-111.3707],
  ["KBIL","Billings Logan Intl",45.8077,-108.5429],
  ["KFCA","Glacier Park Intl",48.3105,-114.2559],
  ["KCDC","Cedar City Regional",37.701,-113.0985],
  ["KSGU","St George Regional",37.0364,-113.5102],
  ["KPVU","Provo Municipal",40.2192,-111.7234],
  ["KBFI","Boeing Field (Seattle)",47.53,-122.3019],
  ["KRNT","Renton Municipal",47.4931,-122.2157],
  ["KPAE","Snohomish County (Paine)",47.9063,-122.2815],
  ["KOLM","Olympia Regional",46.9694,-122.9027],
  ["KTIW","Tacoma Narrows",47.268,-122.5783],
  ["KHIO","Portland-Hillsboro",45.5404,-122.9498],
  ["KTTD","Portland-Troutdale",45.5494,-122.4014],
  ["KSLE","McNary Field (Salem)",44.9094,-123.0026],
  ["KEUG","Eugene-Mahlon Sweet Field",44.1246,-123.212],
  ["KMFR","Rogue Valley Intl-Medford",42.3742,-122.8735],
  ["KRDM","Roberts Field (Redmond)",44.2541,-121.15],
  ["KPSC","Tri-Cities (Pasco)",46.2647,-119.119],
  ["KYKM","Yakima Air Terminal",46.5682,-120.5439],
  ["KARR","Aurora Municipal",41.7717,-88.4757],
  ["KLOT","Lewis University",41.6072,-88.0962],
  ["KDPA","DuPage",41.9078,-88.2486],
  ["KPWK","Chicago Executive",42.1142,-87.9015],
  ["KUGN","Waukegan National",42.4222,-87.8679],
  ["KENW","Kenosha Regional",42.5957,-87.9278],
  ["KMSN","Dane County Regional (Madison)",43.1399,-89.3375],
  ["KGRB","Green Bay-Austin Straubel",44.4851,-88.1296],
  ["KAUW","Wausau Downtown",44.9261,-89.6268],
  ["KOSH","Wittman Regional (Oshkosh)",43.9844,-88.557],
  ["KFCM","Flying Cloud",44.8272,-93.4571],
  ["KSTP","St Paul Downtown",44.9345,-93.06],
  ["KMIC","Crystal",45.062,-93.354],
  ["KFAR","Hector Intl (Fargo)",46.9207,-96.8158],
  ["KGFK","Grand Forks Intl",47.9493,-97.1761],
  ["KBIS","Bismarck Municipal",46.7727,-100.746],
  ["KFSD","Joe Foss Field (Sioux Falls)",43.582,-96.7419],
  ["KRAP","Rapid City Regional",44.0453,-103.0574],
  ["KCHA","Chattanooga Metropolitan",35.0353,-85.2038],
  ["KTYS","McGhee Tyson (Knoxville)",35.811,-83.9941],
  ["KTRI","Tri-Cities Regional",36.4752,-82.4074],
  ["KAVL","Asheville Regional",35.4362,-82.5418],
  ["KGSO","Piedmont Triad Intl (Greensboro)",36.0978,-79.9373],
  ["KCAE","Columbia Metropolitan",33.9389,-81.1195],
  ["KMYR","Myrtle Beach Intl",33.6797,-78.9283],
  ["KILM","Wilmington Intl",34.2706,-77.9026],
  ["KSAV","Savannah/Hilton Head Intl",32.1276,-81.2021],
  ["KAGS","Augusta Regional",33.37,-81.9645],
  ["KMCN","Middle Georgia Regional",32.6928,-83.6492],
  ["KCSG","Columbus Metropolitan",32.5163,-84.9388],
  ["KVLD","Valdosta Regional",30.7825,-83.2767],
  ["KMOB","Mobile Regional",30.6912,-88.2428],
  ["KGPT","Gulfport-Biloxi Intl",30.4073,-89.0701],
  ["KJAN","Jackson-Medgar Wiley Evers Intl",32.3112,-90.0759],
  ["KHSV","Huntsville Intl",34.6372,-86.7751],
  ["KMGM","Montgomery Regional",32.3006,-86.394],
  ["KDHN","Dothan Regional",31.3213,-85.4496],
  ["KFDK","Frederick Municipal",39.4176,-77.3742],
  ["KGAI","Montgomery County Airpark",39.1683,-77.166],
  ["KMRB","Eastern WV Regional (Martinsburg)",39.4019,-77.9846],
  ["KCJR","Culpeper Regional",38.5267,-77.8589],
  ["KCHO","Charlottesville-Albemarle",38.1386,-78.4529],
  ["KROA","Roanoke-Blacksburg Regional",37.3255,-79.9754],
  ["KLYH","Lynchburg Regional",37.3267,-79.2004],
  ["KOSU","Ohio State University",40.0798,-83.073],
  ["KLUK","Cincinnati Municipal",39.1031,-84.4187],
  ["KBKL","Cleveland Burke Lakefront",41.5175,-81.6833],
  ["KCAK","Akron-Canton Regional",40.9161,-81.4422],
  ["KYNG","Youngstown-Warren Regional",41.2607,-80.6791],
  ["KAGC","Allegheny County",40.3543,-79.9302],
  ["KLBE","Arnold Palmer Regional",40.2759,-79.4048],
  ["KVAY","South Jersey Regional",39.9428,-74.8456],
  ["KILG","Wilmington (Delaware)",39.6787,-75.6065],
  ["KESN","Easton/Newnam Field",38.8042,-76.0688],
  ["KOXB","Ocean City Municipal",38.3104,-75.124],
  // Texas/OK/AR/LA region (250nm of KADS) — added v4.25
  ["KADM","Ardmore Municipal",34.303,-97.0193],
  ["KAEX","Alexandria Intl",31.3274,-92.5498],
  ["KAQO","Llano Municipal",30.7836,-98.6622],
  ["KARM","Wharton Regional",29.2542,-96.1542],
  ["KATA","Hall-Miller Municipal (Atlanta)",33.0958,-94.1947],
  ["KAVK","Alva Regional",36.7732,-98.67],
  ["KAXS","Altus Quartz Mountain Regional",34.6981,-99.3389],
  ["KBAD","Barksdale AFB",32.5018,-93.6628],
  ["KBAZ","New Braunfels National",29.7045,-98.0421],
  ["KBKD","Stephens County (Breckenridge)",32.7191,-98.891],
  ["KBMQ","Burnet Municipal-Kate Craddock Field",30.7389,-98.2386],
  ["KBMT","Beaumont Muni",30.0699,-94.2155],
  ["KBPC","Bonham Municipal Jones Field",33.6121,-96.1789],
  ["KBVO","Bartlesville Municipal",36.7623,-96.0107],
  ["KBWD","Brownwood Regional",31.7937,-98.9564],
  ["KBYY","Bay City Municipal",28.9733,-95.8636],
  ["KCDH","Harrell Field (Camden)",33.6228,-92.7633],
  ["KCDS","Childress Municipal",34.4338,-100.2881],
  ["KCFD","Coulter Field (Bryan)",30.7158,-96.3314],
  ["KCHK","Chickasha Municipal",35.0975,-97.9676],
  ["KCPT","Cleburne Regional",32.3539,-97.4366],
  ["KCRS","Corsicana Municipal/Campbell Field",32.0281,-96.4006],
  ["KCSM","Clinton-Sherman",35.3398,-99.2003],
  ["KCWC","Kickapoo Downtown (Wichita Falls)",33.8585,-98.4904],
  ["KDKR","Houston County (Crockett)",31.3506,-95.4153],
  ["KDTN","Shreveport Downtown",32.5402,-93.7449],
  ["KDUA","Eaker Field (Durant)",33.9425,-96.3934],
  ["KDUC","Halliburton Field (Duncan)",34.4709,-97.9598],
  ["KDWH","David Wayne Hooks Memorial",30.0618,-95.5527],
  ["KELD","South Arkansas Regional (El Dorado)",33.221,-92.8133],
  ["KEND","Vance AFB",36.3392,-97.9165],
  ["KESF","Esler Field",31.3949,-92.2958],
  ["KETN","Eastland Municipal",32.4135,-98.8095],
  ["KFDR","Frederick Municipal",34.352,-98.9839],
  ["KFSI","Henry Post AAF (Fort Sill)",34.6498,-98.4022],
  ["KFSM","Fort Smith Regional",35.3366,-94.3674],
  ["KFYV","Drake Field (Fayetteville)",36.0051,-94.17],
  ["KGAG","Gage",36.2956,-99.7763],
  ["KGLE","Gainesville Municipal",33.6515,-97.1969],
  ["KGLS","Scholes Intl (Galveston)",29.2654,-94.8604],
  ["KGOK","Guthrie-Edmond Regional",35.8497,-97.4159],
  ["KGVT","Majors Field (Greenville)",33.0678,-96.0653],
  ["KHHF","Hemphill County (Canadian)",35.8975,-100.4035],
  ["KHLR","Hood AAF",31.1386,-97.7144],
  ["KHOT","Hot Springs Memorial",34.4781,-93.0962],
  ["KHQZ","Mesquite Metro",32.747,-96.5305],
  ["KHYI","San Marcos Regional",29.8927,-97.8628],
  ["KJSO","Cherokee County (Jacksonville)",31.8694,-95.2174],
  ["KJWY","Mid-Way Regional",32.4564,-96.9125],
  ["KLAW","Lawton-Fort Sill Regional",34.5677,-98.4166],
  ["KLBR","Clarksville Red River County",33.5912,-95.0631],
  ["KLTS","Altus AFB",34.6671,-99.2667],
  ["KMEZ","Mena Intermountain Municipal",34.5453,-94.2027],
  ["KMKO","Davis Field (Muskogee)",35.6566,-95.3666],
  ["KMLC","McAlester Regional",34.8824,-95.7833],
  ["KMLU","Monroe Regional",32.5108,-92.0376],
  ["KMNE","Magnolia Municipal",33.2275,-93.2168],
  ["KMNZ","Hammonds Field (Hampton, AR)",33.5346,-92.471],
  ["KNFW","NAS Fort Worth JRB",32.7693,-97.4406],
  ["KOCH","A L Mangham Jr Regional (Nacogdoches)",31.578,-94.7095],
  ["KOJA","Thomas P Stafford (Weatherford)",35.5414,-98.6679],
  ["KOUN","University of Oklahoma Westheimer (Norman)",35.2456,-97.472],
  ["KPNC","Ponca City Regional",36.73,-97.0998],
  ["KPRX","Cox Field (Paris)",33.6364,-95.4506],
  ["KPSN","Palestine Municipal",31.7796,-95.7064],
  ["KPVJ","Pauls Valley Municipal",34.711,-97.1228],
  ["KPWA","Wiley Post (Oklahoma City)",35.5341,-97.647],
  ["KRND","Randolph AFB",29.5294,-98.2789],
  ["KRPH","Graham Municipal",33.11,-98.5547],
  ["KRSN","Ruston Regional",32.5145,-92.5907],
  ["KRVS","Richard L Jones Jr (Tulsa Riverside)",36.0395,-95.9846],
  ["KRYW","Lago Vista (Rusty Allen)",30.4986,-97.9694],
  ["KSEP","Stephenville Clark Regional",32.2153,-98.1776],
  ["KSHV","Shreveport Regional",32.4466,-93.8256],
  ["KSNL","Shawnee Regional",35.3577,-96.9425],
  ["KSPS","Sheppard AFB / Wichita Falls Muni",33.9888,-98.4919],
  ["KSWO","Stillwater Regional",36.1611,-97.0857],
  ["KSWW","Avenger Field (Sweetwater)",32.4674,-100.4666],
  ["KTPL","Draughon-Miller Central Texas Regional (Temple)",31.1525,-97.4078],
  ["KTXK","Texarkana Regional Webb Field",33.4537,-93.991],
  ["KWDG","Enid Woodring Regional",36.3792,-97.7911],
  ["KXNA","Northwest Arkansas Regional",36.2818,-94.3068]
];

// ─── Twilight Calculator ──────────────────────────────────────────────────────
// Calculates sunrise, sunset, and civil twilight times using NOAA's algorithm.
// Math runs in UTC; result Date objects can be compared directly with any other Date.

function julianDay(date) {
  // Returns Julian Day for the date at 00:00 UTC
  const Y = date.getUTCFullYear();
  const M = date.getUTCMonth() + 1;
  const D = date.getUTCDate();
  const a = Math.floor((14 - M) / 12);
  const y = Y + 4800 - a;
  const m = M + 12 * a - 3;
  return D + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// zenith: 90.833° for sunrise/sunset (refraction + sun's apparent radius)
//         96°     for civil twilight (sun 6° below horizon)
// rising: true for sunrise/morning twilight, false for sunset/evening twilight
//
// Returns a Date object in absolute UTC time. This Date can be directly
// compared with any other Date (takeoff/landing) regardless of timezone.
function calcSolarEvent(date, lat, lon, zenithDeg, rising) {
  // Calculate the day-of-year (N) for the date being asked about
  const N = julianDay(date) - julianDay(new Date(Date.UTC(date.getUTCFullYear(), 0, 1))) + 1;
  const lonHour = lon / 15;
  const t = rising
    ? N + ((6 - lonHour) / 24)
    : N + ((18 - lonHour) / 24);
  // Sun's mean anomaly
  const M = 0.9856 * t - 3.289;
  // Sun's true longitude
  let L = M + 1.916 * Math.sin(M * Math.PI / 180) +
          0.020 * Math.sin(2 * M * Math.PI / 180) + 282.634;
  L = ((L % 360) + 360) % 360;
  // Sun's right ascension
  let RA = Math.atan(0.91764 * Math.tan(L * Math.PI / 180)) * 180 / Math.PI;
  RA = ((RA % 360) + 360) % 360;
  // Bring RA into the same quadrant as L
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = RA + (Lquadrant - RAquadrant);
  RA = RA / 15;
  // Sun's declination
  const sinDec = 0.39782 * Math.sin(L * Math.PI / 180);
  const cosDec = Math.cos(Math.asin(sinDec));
  // Local hour angle
  const cosH = (Math.cos(zenithDeg * Math.PI / 180) -
                sinDec * Math.sin(lat * Math.PI / 180)) /
               (cosDec * Math.cos(lat * Math.PI / 180));
  if (cosH > 1) return null; // Sun never rises (polar night)
  if (cosH < -1) return null; // Sun never sets (midnight sun)
  let H = rising
    ? 360 - Math.acos(cosH) * 180 / Math.PI
    : Math.acos(cosH) * 180 / Math.PI;
  H = H / 15;
  // Local mean time of the event
  const T = H + RA - 0.06571 * t - 6.622;
  // Convert to UTC hours
  let UT = T - lonHour;

  // Day-rollover correction:
  // The local noon at this longitude in UTC is approximately (12 - lonHour).
  // - Rising events (sunrise/dawn) should be ~6 hours BEFORE local noon UTC.
  // - Setting events (sunset/dusk) should be ~6 hours AFTER local noon UTC.
  // Adjust UT into the correct 24-hour window centered on the expected time.
  const localNoonUT = 12 - lonHour;
  const expectedUT = rising ? localNoonUT - 6 : localNoonUT + 6;
  // Bring UT within ±12 hours of expectedUT
  while (UT < expectedUT - 12) UT += 24;
  while (UT > expectedUT + 12) UT -= 24;

  // Build the Date object — UT may now exceed 24 or be negative, which is fine
  // because Date arithmetic handles day rollover correctly.
  const baseUtcMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
  const eventMs = baseUtcMs + UT * 3600 * 1000;
  return new Date(eventMs);
}

// Returns { sunrise, sunset, civilDawn, civilDusk } as Date objects.
// Each Date represents the actual UTC moment of the event for the local
// calendar day at (lat, lon).
//
// IMPORTANT: We pass in a Date that represents LOCAL midnight at the airport,
// re-interpreted as UTC midnight for the calculation. This way, twilight events
// land on the right calendar day even when the longitude pushes UTC into the
// next or previous day.
function getTwilightTimes(localDate, lat, lon) {
  // localDate represents a calendar date in the user's local time zone.
  // We want twilight events for THAT calendar day at (lat, lon).
  // Build a UTC date with the same Y/M/D so the algorithm computes for that day.
  const utcAnchor = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    12, 0, 0  // anchor at noon UTC for stable day calculation
  ));

  return {
    sunrise: calcSolarEvent(utcAnchor, lat, lon, 90.833, true),
    sunset: calcSolarEvent(utcAnchor, lat, lon, 90.833, false),
    civilDawn: calcSolarEvent(utcAnchor, lat, lon, 96, true),
    civilDusk: calcSolarEvent(utcAnchor, lat, lon, 96, false),
  };
}

// Format a Date object as "HH:MM" in local browser time
function formatTime(d) {
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ─── Day/Night Calculator ─────────────────────────────────────────────────────

function DayNightCalc({ onBack, initialHobbs, returnLabel, onSaveSplit }) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Default airport: KADS (Addison) — Thrust Flight's home base
  const DEFAULT_AIRPORT = AIRPORTS.find(a => a[0] === "KADS") || null;

  const [date, setDate] = useState(todayStr);
  const [depQuery, setDepQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [depAirport, setDepAirport] = useState(DEFAULT_AIRPORT);
  const [destAirport, setDestAirport] = useState(DEFAULT_AIRPORT);
  const [engineStart, setEngineStart] = useState(""); // HH:MM
  const [hobbsTotal, setHobbsTotal] = useState(initialHobbs || ""); // hours, e.g. "1.8"

  // Filter airports by query
  function filterAirports(q) {
    if (!q || q.length < 2) return [];
    const upper = q.toUpperCase();
    return AIRPORTS.filter(([icao, name]) =>
      icao.startsWith(upper) || icao.includes(upper) || name.toUpperCase().includes(upper)
    ).slice(0, 8);
  }

  const depResults = !depAirport ? filterAirports(depQuery) : [];
  const destResults = !destAirport ? filterAirports(destQuery) : [];

  // Parse a date string + HH:MM into a Date object
  function combineDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return null;
    const [h, m] = timeStr.split(":").map(Number);
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day, h, m);
    return d;
  }

  const engineStartDate = combineDateTime(date, engineStart);
  const hobbsHours = parseFloat(hobbsTotal);
  const hobbsValid = !isNaN(hobbsHours) && hobbsHours > 0 && hobbsHours < 24;

  // Flight time = engine start to engine stop. Per 14 CFR Part 1 § 1.1, night logging
  // captures the entire flight time (including taxi) when it falls during night.
  let takeoffDate = null, landingDate = null, adjustedLanding = null;
  if (engineStartDate && hobbsValid) {
    takeoffDate = engineStartDate;
    landingDate = new Date(engineStartDate.getTime() + hobbsHours * 60 * 60 * 1000);
    adjustedLanding = landingDate;
  }
  const engineStopDate = adjustedLanding;

  // Parse YYYY-MM-DD as a LOCAL date (not UTC midnight) — avoids day-shift bugs
  function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  // Get twilight times for departure and destination
  const localDate = parseLocalDate(date);
  const depTwilight = depAirport && localDate ? getTwilightTimes(localDate, depAirport[2], depAirport[3]) : null;
  const destTwilight = destAirport && localDate ? getTwilightTimes(localDate, destAirport[2], destAirport[3]) : null;

  // Calculate day/night split
  // FAA 14 CFR 1.1: "Night" = period between end of evening civil twilight and beginning of
  // morning civil twilight. So night logging starts AT civil dusk and ends AT civil dawn.
  let dayHours = 0, nightHours = 0, totalHours = 0;
  let nightStart = null; // when night logging begins during the flight
  let calcReady = false;

  if (takeoffDate && adjustedLanding && depTwilight && destTwilight) {
    calcReady = true;
    totalHours = (adjustedLanding - takeoffDate) / (1000 * 60 * 60);
    const flightSecs = (adjustedLanding - takeoffDate) / 1000;

    // For each second of the flight, determine if we're in "night" per the FAA rule.
    // We interpolate the relevant twilight time linearly along the route based on
    // flight progress (0 at takeoff, 1 at landing).
    //
    // For a same-day flight:
    //   - Morning twilight cutoff is somewhere around dawn at the route position
    //   - Evening twilight cutoff is somewhere around dusk at the route position
    //
    // A given moment is NIGHT if:
    //   currentTime is BEFORE morning civil twilight at the current position, OR
    //   currentTime is AFTER OR EQUAL TO evening civil twilight at the current position
    //
    // (We also handle next-day wrap by computing tomorrow's morning twilight if needed)

    let nightSecs = 0;
    const stepSecs = 30;

    // Pre-compute the morning twilight for the *next* day at both airports, for
    // overnight flights that cross midnight. Build the next local calendar day
    // explicitly so the calculation lands on the right date.
    const tomorrowLocal = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate() + 1);
    const depTomorrowTwilight = getTwilightTimes(tomorrowLocal, depAirport[2], depAirport[3]);
    const destTomorrowTwilight = getTwilightTimes(tomorrowLocal, destAirport[2], destAirport[3]);
    const depTomorrowDawn = depTomorrowTwilight.civilDawn;
    const destTomorrowDawn = destTomorrowTwilight.civilDawn;

    for (let s = 0; s < flightSecs; s += stepSecs) {
      const currentTime = new Date(takeoffDate.getTime() + s * 1000);
      const progress = s / flightSecs;

      // Interpolate civil dusk along the route
      const civilDuskHere = (depTwilight.civilDusk && destTwilight.civilDusk)
        ? new Date(depTwilight.civilDusk.getTime() * (1 - progress) + destTwilight.civilDusk.getTime() * progress)
        : (depTwilight.civilDusk || destTwilight.civilDusk);

      // Interpolate civil dawn — use today's if currentTime is in the morning,
      // else use tomorrow's (for overnight flights past evening twilight)
      const civilDawnTodayHere = (depTwilight.civilDawn && destTwilight.civilDawn)
        ? new Date(depTwilight.civilDawn.getTime() * (1 - progress) + destTwilight.civilDawn.getTime() * progress)
        : (depTwilight.civilDawn || destTwilight.civilDawn);
      const civilDawnTomorrowHere = (depTomorrowDawn && destTomorrowDawn)
        ? new Date(depTomorrowDawn.getTime() * (1 - progress) + destTomorrowDawn.getTime() * progress)
        : (depTomorrowDawn || destTomorrowDawn);

      // Determine if current moment is "night" per FAA rule
      let isNight = false;
      if (civilDawnTodayHere && currentTime < civilDawnTodayHere) {
        // Before this morning's civil dawn — still night from the previous evening
        isNight = true;
      } else if (civilDuskHere && currentTime >= civilDuskHere) {
        // After tonight's civil dusk
        // Also check we haven't already passed tomorrow's civil dawn (sun came back up)
        if (!civilDawnTomorrowHere || currentTime < civilDawnTomorrowHere) {
          isNight = true;
        }
      }

      if (isNight) {
        nightSecs += stepSecs;
        if (nightStart === null) nightStart = currentTime;
      }
    }
    // Round to tenths — but in a way that guarantees Day + Night = Total.
    // If we round each value independently, the parts can sum to more or less than
    // the whole (e.g. Total 1.0, Day 0.9, Night 0.2 = 1.1 — visibly wrong).
    // Fix: round Total and Night normally, then derive Day so the math reconciles.
    // Night is rounded normally because it's the regulatory-critical number;
    // Day inherits whatever rounding error remains so totals always check out.
    nightHours = nightSecs / 3600;
    totalHours = Math.round(totalHours * 10) / 10;
    nightHours = Math.round(nightHours * 10) / 10;
    dayHours = Math.round((totalHours - nightHours) * 10) / 10;
    // Guard against tiny floating-point ghosts producing -0.0
    if (dayHours < 0) dayHours = 0;
  }

  function reset() {
    setDepQuery(""); setDestQuery("");
    setDepAirport(DEFAULT_AIRPORT); setDestAirport(DEFAULT_AIRPORT);
    setEngineStart(""); setHobbsTotal("");
  }

  // Component starts here
  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: FONT_TEXT, paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `0.5px solid ${THEME.separator}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "12px 16px" }}>
          <button onClick={onBack} style={{
            background: "transparent", border: "none",
            color: THEME.red, fontSize: 16, fontWeight: 500,
            cursor: "pointer", padding: "4px 0", fontFamily: FONT_TEXT,
            maxWidth: "100%", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{returnLabel || "‹ Home"}</button>
        </div>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "8px 16px 16px" }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: THEME.red, textTransform: "uppercase", fontFamily: FONT_MONO }}>
            Day / Night Calculator
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: -1, color: THEME.text, fontFamily: FONT_DISPLAY, lineHeight: 1.1 }}>
          Solar Information
        </h1>
        <p style={{ margin: "6px 0 18px", color: THEME.textSecondary, fontSize: 15 }}>
          Calculate day vs night logging time for a flight
        </p>

        {/* Date */}
        <Card style={{ padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
            Date
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              background: THEME.surface2, border: `1px solid ${THEME.border}`,
              borderRadius: 10, padding: "10px 13px",
              color: THEME.text, fontSize: 15, fontFamily: FONT_TEXT,
              outline: "none",
            }} />
        </Card>

        {/* Departure airport */}
        <Card style={{ padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
            Departure Airport
          </div>
          {depAirport ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: THEME.redDim, border: `1px solid ${THEME.red}40`, borderRadius: 10 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: THEME.red, letterSpacing: 0.3 }}>{depAirport[0]}</span>
              <span style={{ flex: 1, fontSize: 14, color: THEME.text, fontFamily: FONT_TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{depAirport[1]}</span>
              <button onClick={() => { setDepAirport(null); setDepQuery(""); }} style={{ background: "transparent", border: "none", color: THEME.red, fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
            </div>
          ) : (
            <>
              <input value={depQuery} onChange={e => setDepQuery(e.target.value)}
                placeholder="Search ICAO code or name (e.g. KADS)"
                autoCapitalize="characters"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: THEME.surface2, border: `1px solid ${THEME.border}`,
                  borderRadius: 10, padding: "10px 13px",
                  color: THEME.text, fontSize: 14, fontFamily: FONT_TEXT,
                  outline: "none",
                }} />
              {depResults.length > 0 && (
                <div style={{ marginTop: 8, background: THEME.surface2, borderRadius: 10, border: `1px solid ${THEME.border}`, overflow: "hidden" }}>
                  {depResults.map(ap => (
                    <div key={ap[0]} onClick={() => { setDepAirport(ap); setDepQuery(""); }} style={{
                      padding: "10px 13px", cursor: "pointer",
                      borderBottom: `0.5px solid ${THEME.separator}`,
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: THEME.red, minWidth: 56 }}>{ap[0]}</span>
                      <span style={{ fontSize: 13, color: THEME.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ap[1]}</span>
                    </div>
                  ))}
                </div>
              )}
              {depQuery.length >= 2 && depResults.length === 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: THEME.textTertiary, fontStyle: "italic" }}>No matching airports</div>
              )}
            </>
          )}
        </Card>

        {/* Destination airport */}
        <Card style={{ padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
            Destination Airport
          </div>
          {destAirport ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: THEME.redDim, border: `1px solid ${THEME.red}40`, borderRadius: 10 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: THEME.red, letterSpacing: 0.3 }}>{destAirport[0]}</span>
              <span style={{ flex: 1, fontSize: 14, color: THEME.text, fontFamily: FONT_TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{destAirport[1]}</span>
              <button onClick={() => { setDestAirport(null); setDestQuery(""); }} style={{ background: "transparent", border: "none", color: THEME.red, fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
            </div>
          ) : (
            <>
              <input value={destQuery} onChange={e => setDestQuery(e.target.value)}
                placeholder="Search ICAO code or name (e.g. KTRL)"
                autoCapitalize="characters"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: THEME.surface2, border: `1px solid ${THEME.border}`,
                  borderRadius: 10, padding: "10px 13px",
                  color: THEME.text, fontSize: 14, fontFamily: FONT_TEXT,
                  outline: "none",
                }} />
              {destResults.length > 0 && (
                <div style={{ marginTop: 8, background: THEME.surface2, borderRadius: 10, border: `1px solid ${THEME.border}`, overflow: "hidden" }}>
                  {destResults.map(ap => (
                    <div key={ap[0]} onClick={() => { setDestAirport(ap); setDestQuery(""); }} style={{
                      padding: "10px 13px", cursor: "pointer",
                      borderBottom: `0.5px solid ${THEME.separator}`,
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: THEME.red, minWidth: 56 }}>{ap[0]}</span>
                      <span style={{ fontSize: 13, color: THEME.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ap[1]}</span>
                    </div>
                  ))}
                </div>
              )}
              {destQuery.length >= 2 && destResults.length === 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: THEME.textTertiary, fontStyle: "italic" }}>No matching airports</div>
              )}
            </>
          )}
        </Card>

        {/* Engine Start + HOBBS */}
        <Card style={{ padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
            Flight Times
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 5, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>Engine Start</div>
              <input type="time" value={engineStart} onChange={e => setEngineStart(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box", minWidth: 0,
                  background: THEME.surface2, border: `1px solid ${THEME.border}`,
                  borderRadius: 10, padding: "10px 8px",
                  color: THEME.text, fontSize: 15, fontFamily: FONT_MONO, letterSpacing: 0.2,
                  outline: "none", textAlign: "center",
                  appearance: "none", WebkitAppearance: "none",
                }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 5, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>HOBBS Total</div>
              <input value={hobbsTotal}
                onChange={e => {
                  // numeric + decimal only
                  if (e.target.value === "" || /^\d*\.?\d*$/.test(e.target.value)) setHobbsTotal(e.target.value);
                }}
                placeholder="1.8" inputMode="decimal"
                style={{
                  width: "100%", boxSizing: "border-box", minWidth: 0,
                  background: THEME.surface2, border: `1px solid ${THEME.border}`,
                  borderRadius: 10, padding: "10px 8px",
                  color: THEME.text, fontSize: 15, fontFamily: FONT_MONO, letterSpacing: 0.2,
                  outline: "none", textAlign: "center",
                  appearance: "none", WebkitAppearance: "none",
                }} />
            </div>
          </div>

          {/* Computed flight window preview */}
          {takeoffDate && adjustedLanding && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: THEME.text, fontFamily: FONT_MONO, letterSpacing: 0.2 }}>
                Engine Start <span style={{ color: THEME.red, fontWeight: 600 }}>{formatTime(takeoffDate)}</span> · Engine Stop <span style={{ color: THEME.red, fontWeight: 600 }}>{formatTime(adjustedLanding)}</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 11, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic", lineHeight: 1.45 }}>
            Flight time = engine start to engine stop (HOBBS total).
          </div>
        </Card>

        {/* Twilight info */}
        {(depTwilight || destTwilight) && (
          <Card style={{ padding: "14px 16px", marginBottom: 14 }}>
            <SectionLabel style={{ padding: "0 0 10px" }}>Solar Information</SectionLabel>
            <div style={{ fontSize: 13, color: THEME.textSecondary, lineHeight: 1.7, fontFamily: FONT_TEXT }}>
              {depAirport && depTwilight && (
                <div style={{ marginBottom: destAirport ? 10 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: THEME.red, fontFamily: FONT_MONO, letterSpacing: 0.3, marginBottom: 4 }}>{depAirport[0]} (Departure)</div>
                  <div>Sunrise: <span style={{ color: THEME.text, fontFamily: FONT_MONO }}>{formatTime(depTwilight.sunrise)}</span> · Sunset: <span style={{ color: THEME.text, fontFamily: FONT_MONO }}>{formatTime(depTwilight.sunset)}</span></div>
                  <div>Civil dawn: <span style={{ color: THEME.text, fontFamily: FONT_MONO }}>{formatTime(depTwilight.civilDawn)}</span> · Civil dusk: <span style={{ color: THEME.text, fontFamily: FONT_MONO }}>{formatTime(depTwilight.civilDusk)}</span></div>
                </div>
              )}
              {destAirport && destTwilight && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: THEME.red, fontFamily: FONT_MONO, letterSpacing: 0.3, marginBottom: 4 }}>{destAirport[0]} (Destination)</div>
                  <div>Sunrise: <span style={{ color: THEME.text, fontFamily: FONT_MONO }}>{formatTime(destTwilight.sunrise)}</span> · Sunset: <span style={{ color: THEME.text, fontFamily: FONT_MONO }}>{formatTime(destTwilight.sunset)}</span></div>
                  <div>Civil dawn: <span style={{ color: THEME.text, fontFamily: FONT_MONO }}>{formatTime(destTwilight.civilDawn)}</span> · Civil dusk: <span style={{ color: THEME.text, fontFamily: FONT_MONO }}>{formatTime(destTwilight.civilDusk)}</span></div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Calculation result */}
        {calcReady && (
          <Card style={{ padding: "16px 16px 18px", marginBottom: 14, border: `1px solid ${THEME.red}60`, background: THEME.redDim }}>
            <SectionLabel style={{ padding: "0 0 12px", color: THEME.red }}>Logging Split</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Total</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: THEME.text, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{totalHours.toFixed(1)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Day</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: THEME.text, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{dayHours.toFixed(1)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.2 }}>Night</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: THEME.red, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{nightHours.toFixed(1)}</div>
              </div>
            </div>
            {nightStart && nightHours > 0 && (
              <div style={{ fontSize: 12, color: THEME.textSecondary, textAlign: "center", fontFamily: FONT_TEXT, fontStyle: "italic", marginBottom: 12 }}>
                Night logging begins at {formatTime(nightStart)}
              </div>
            )}
            {nightHours === 0 && (
              <div style={{ fontSize: 12, color: THEME.textSecondary, textAlign: "center", fontFamily: FONT_TEXT, fontStyle: "italic", marginBottom: 12 }}>
                Entire flight is during day — no night time
              </div>
            )}

            {/* Detailed calculation breakdown */}
            <div style={{
              marginTop: 4, padding: "12px 14px",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 9,
              border: `0.5px solid ${THEME.separator}`,
            }}>
              <div style={{ fontSize: 11, color: THEME.textSecondary, fontFamily: FONT_TEXT, lineHeight: 1.6 }}>
                Per <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: THEME.text, fontWeight: 600 }}>14 CFR Part 1 § 1.1</span>, "night" means the time between the end of evening civil twilight and the beginning of morning civil twilight.
              </div>
            </div>
          </Card>
        )}

        {(depAirport || destAirport || engineStart || hobbsTotal) && (
          <button onClick={reset} style={{
            width: "100%", padding: "12px",
            background: "transparent", border: `1px solid ${THEME.border}`,
            borderRadius: 11, color: THEME.textSecondary,
            fontSize: 14, fontWeight: 500, cursor: "pointer",
            fontFamily: FONT_TEXT, marginBottom: returnLabel && returnLabel !== "‹ Home" ? 10 : 0,
          }}>Reset</button>
        )}

        {/* Prominent return-to-lesson button (only shown when launched from a lesson) */}
        {returnLabel && returnLabel !== "‹ Home" && (
          <button onClick={() => {
            // If there's a complete calculation, save it to the lesson
            if (calcReady && onSaveSplit) {
              onSaveSplit({
                totalHours,
                dayHours,
                nightHours,
                nightStart: nightStart ? nightStart.toISOString() : null,
                engineStart: takeoffDate ? takeoffDate.toISOString() : null,
                engineStop: adjustedLanding ? adjustedLanding.toISOString() : null,
                depAirport: depAirport ? depAirport[0] : null,
                destAirport: destAirport ? destAirport[0] : null,
              });
            }
            onBack();
          }} style={{
            width: "100%", padding: "15px",
            background: THEME.red, border: "none",
            borderRadius: 13, color: "#fff",
            fontSize: 16, fontWeight: 600, cursor: "pointer",
            fontFamily: FONT_TEXT, letterSpacing: -0.2,
            boxShadow: `0 4px 20px ${THEME.redGlow}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span>↩</span>
            <span>{calcReady ? "Save & Return to Lesson" : "Return to Lesson"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  // view: { type: "selector" } | { type: "notes", student } | { type: "history", student } | { type: "lesson", student, lesson } | { type: "daynight" }
  const [view, setView] = useState({ type: "selector" });

  // Lesson state — lifted here so it survives navigation away to Solar Information
  // Each student gets their own state slot, keyed by student.id.
  // When switching to a different student, that student's state starts fresh.
  // CRITICAL: persisted to localStorage so iOS suspending the PWA (e.g. switching
  // apps mid-flight) doesn't lose work in progress. Restored on every app load.
  const LESSON_STATES_KEY = "cfi_lesson_states_v1";
  const [lessonStates, setLessonStates] = useState(() => ls.get(LESSON_STATES_KEY, {}));

  // Save lessonStates to localStorage every time it changes.
  useEffect(() => {
    ls.set(LESSON_STATES_KEY, lessonStates);
  }, [lessonStates]);

  function getLessonState(studentId) {
    return lessonStates[studentId] || {
      hobbs: { out: "", in_: "", total: "", calculatedField: null },
      topics: [],
      checkedTopics: {},
      notes: [],
      landings: [],
      landingAirport: null,
      imc: { startTs: null, entryAlt: "", exitAlt: "", totalSeconds: 0 },
      currentLessonId: null,
    };
  }
  function updateLessonState(studentId, updater) {
    setLessonStates(prev => {
      // CRITICAL: must use `prev` here, not getLessonState() which reads stale closure
      const current = prev[studentId] || {
        hobbs: { out: "", in_: "", total: "", calculatedField: null },
        topics: [],
        checkedTopics: {},
        notes: [],
        landings: [],
        landingAirport: null,
        imc: { startTs: null, entryAlt: "", exitAlt: "", totalSeconds: 0 },
        currentLessonId: null,
      };
      return {
        ...prev,
        [studentId]: { ...current, ...updater(current) },
      };
    });
  }
  function clearLessonState(studentId) {
    setLessonStates(prev => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  }

  useEffect(() => {
    document.body.style.background = THEME.bg;
    document.body.style.WebkitFontSmoothing = "antialiased";
    document.body.style.MozOsxFontSmoothing = "grayscale";
  }, []);

  // Scroll to top whenever the user navigates between views — like a normal website does.
  // Without this the browser keeps the previous page's scroll position.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view.type, view.student?.id, view.lesson?.id]);

  if (view.type === "notes") {
    const sid = view.student.id;
    const state = getLessonState(sid);
    const updateField = (field) => (valOrFn) => {
      updateLessonState(sid, s => ({
        [field]: typeof valOrFn === "function" ? valOrFn(s[field]) : valOrFn,
      }));
    };
    return <NotesApp student={view.student}
      onBack={() => setView({ type: "selector" })}
      onViewHistory={() => setView({ type: "history", student: view.student })}
      onOpenDayNight={(hobbsTotal) => setView({ type: "daynight", returnTo: "notes", student: view.student, initialHobbs: hobbsTotal, editing: view.editing })}
      onOpenSettings={() => setView({ type: "settings", student: view.student, editing: view.editing })}
      hobbs={state.hobbs} setHobbs={updateField("hobbs")}
      topics={state.topics} setTopics={updateField("topics")}
      checkedTopics={state.checkedTopics} setCheckedTopics={updateField("checkedTopics")}
      notes={state.notes} setNotes={updateField("notes")}
      loggingSplit={state.loggingSplit || null}
      clearLoggingSplit={() => updateLessonState(sid, () => ({ loggingSplit: null }))}
      landings={state.landings || []} setLandings={updateField("landings")}
      landingAirport={state.landingAirport || null} setLandingAirport={updateField("landingAirport")}
      imc={state.imc || { startTs: null, entryAlt: "", exitAlt: "", totalSeconds: 0 }}
      setImc={updateField("imc")}
      currentLessonId={state.currentLessonId || null}
      setCurrentLessonId={(id) => updateLessonState(sid, () => ({ currentLessonId: id }))}
      isEditing={!!view.editing}
      onExitEditMode={() => setView(v => ({ ...v, editing: false }))}
      onLessonCleared={() => clearLessonState(sid)} />;
  }
  if (view.type === "history") {
    return <PastLessonsList student={view.student}
      onBack={() => setView({ type: "selector" })}
      onSelectLesson={(lesson) => setView({ type: "lesson", student: view.student, lesson })} />;
  }
  if (view.type === "lesson") {
    return <PastLessonDetail lesson={view.lesson}
      onBack={() => setView({ type: "history", student: view.student })}
      onEdit={(lessonToEdit) => {
        // Load the lesson's data into the in-progress state, keeping the same id
        // so that saveLesson() upserts (replaces) instead of duplicating.
        // We do NOT delete the lesson from the archive — saveLesson handles the
        // in-place update via its upsert-by-id logic.
        setLessonStates(prev => ({
          ...prev,
          [view.student.id]: {
            hobbs: lessonToEdit.hobbs || { out: "", in_: "", total: "", calculatedField: null },
            topics: lessonToEdit.topics || [],
            checkedTopics: lessonToEdit.checkedTopics || {},
            notes: lessonToEdit.notes || [],
            landings: lessonToEdit.landings || [],
            landingAirport: lessonToEdit.landingAirport || null,
            loggingSplit: lessonToEdit.loggingSplit || null,
            imc: lessonToEdit.imc || { startTs: null, entryAlt: "", exitAlt: "", totalSeconds: 0 },
            currentLessonId: lessonToEdit.id,
          },
        }));
        // Navigate to the lesson editor in edit mode
        setView({ type: "notes", student: view.student, editing: true });
      }} />;
  }
  if (view.type === "daynight") {
    const returningToLesson = view.returnTo === "notes" && view.student;
    return <DayNightCalc
      initialHobbs={view.initialHobbs || ""}
      returnLabel={returningToLesson ? `‹ ${view.student.name.split(" ")[0]}'s Lesson` : "‹ Home"}
      onSaveSplit={returningToLesson ? (split) => {
        updateLessonState(view.student.id, () => ({ loggingSplit: split }));
      } : null}
      onBack={() => {
        if (returningToLesson) {
          setView({ type: "notes", student: view.student });
        } else {
          setView({ type: "selector" });
        }
      }} />;
  }
  if (view.type === "settings") {
    return <LessonSettings onBack={() => setView({ type: "notes", student: view.student, editing: view.editing })} />;
  }
  return <StudentSelector
    onSelect={(s) => setView({ type: "notes", student: s })}
    onViewHistory={(s) => setView({ type: "history", student: s })}
    onOpenDayNight={() => setView({ type: "daynight" })}
  />;
}
