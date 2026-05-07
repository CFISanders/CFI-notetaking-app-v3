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

const MASTER_TOPICS = {
  IRA: ["ILS Approach","RNAV (GPS) Approach","VOR Approach","LOC Approach","Circling Approach","Holding Procedures","Partial Panel","Unusual Attitude Recovery","Intercepting & Tracking Courses","Missed Approach Procedure","DME Arc","NDB Approach","Departure Procedures","Arrival Procedures","En Route IFR","Instrument Takeoff","Alternate Airport Planning","Lost Comms Procedures"],
  CAX: ["Chandelles","Lazy Eights","Steep Spirals","Eights on Pylons","Power-Off 180","Short Field Takeoff & Landing","Soft Field Takeoff & Landing","Emergency Descent","Retractable Gear Systems","Constant Speed Prop","High Altitude Operations","Commercial ACS Standards","Weight & Balance","Performance Charts","Steep Turns","Stall Series"],
  CFII: ["Teaching ILS Approach","Teaching RNAV Approach","Teaching Holding Procedures","Teaching Partial Panel","Teaching Unusual Attitudes","FOI — Principles of Learning","Scenario-Based Training","CRM & Risk Management","PAVE / 5P Checklist","Endorsements & Logbook","Evaluating Checkride Readiness","Lesson Planning","Student Assessment Techniques"],
};

const DEFAULT_SNIPPETS = {
  IRA: {
    "Approaches": ["Established on final — descend to ___ ft","Activate Vectors to Final in the GTN","Brief the approach plate before top of descent","Verify ATIS and set minimums before approach","Stabilized by 500 ft AGL — otherwise go around","Cross-check raw data with GPS guidance"],
    "Holds": ["Use Triple Wind Correction in high winds","Determine hold entry (direct/teardrop/parallel)","Time inbound leg — adjust outbound for wind","Report entering hold to ATC"],
    "Avionics": ["Disconnect AP before minimums","Verify GPS is in approach mode","Cross-check HSI with raw ILS needle"],
    "Feedback": ["Good scan technique","Work on altitude control during level-offs","Excellent CRM","Verbalize your thoughts during the approach"],
  },
  CAX: {
    "Maneuvers": ["Chandelle — watch torque on rollout","Lazy Eight — coordination at top of arc","Steep spiral — constant bank and airspeed","Eights on pylons — pivotal altitude check","Power-off 180 — aim point discipline"],
    "Systems": ["Gear down — 3 green confirmed","Prop control — full forward before power","Mixture — lean for cruise","GUMPS check before landing"],
    "Landings": ["Power-off 180 — good key position","Short field — hit the numbers","Soft field — keep nose up","Watch for floating on long approaches"],
    "Feedback": ["Excellent smoothness","Work on clearing turns","Good altitude awareness","Review ACS tolerances"],
  },
  CFII: {
    "Teaching": ["Good use of tell-show-do","Let student make the error before correcting","Ask leading questions","Demonstrate once, hand controls back"],
    "Lesson Delivery": ["Lesson objective was clear","Good use of silence","Strong ground debrief","Use more 'what would you do if...' questions"],
    "Assessment": ["Ready for IPC sign-off","Needs more practice before checkride","Demonstrates good cockpit discipline","Self-corrected — sign of growth"],
    "Feedback": ["Instruction was clear and concise","Watch over-controlling during demo","Good job staying ahead of student"],
  },
};

// ─── Storage ──────────────────────────────────────────────────────────────────
const ls = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

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
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: FONT_TEXT, paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))" }}>
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
  // Storage key is per training-type + stage so each stage has its own topic list
  const masterKey = stage ? `cfi_topics_${trainingType}_${stage}` : `cfi_topics_${trainingType}`;
  const [open, setOpen] = useState(false);
  const [editMaster, setEditMaster] = useState(false);
  const [custom, setCustom] = useState("");
  // Initial value: if stage-specific list doesn't exist, fall back to legacy training-type list, then defaults
  const [masterList, setMasterList] = useState(() => {
    const stageSpecific = stage ? localStorage.getItem(`cfi_topics_${trainingType}_${stage}`) : null;
    if (stageSpecific) { try { return JSON.parse(stageSpecific); } catch {} }
    return ls.get(`cfi_topics_${trainingType}`, MASTER_TOPICS[trainingType]);
  });

  function toggle(t) {
    setTopics(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);
  }
  function addCustom() {
    if (!custom.trim()) return;
    const v = custom.trim();
    // Add to master list AND select it for this flight
    if (!masterList.includes(v)) {
      const next = [...masterList, v];
      setMasterList(next); ls.set(masterKey, next);
    }
    if (!topics.includes(v)) setTopics(ts => [...ts, v]);
    setCustom("");
  }
  function removeFromMaster(t) {
    const next = masterList.filter(x => x !== t);
    setMasterList(next); ls.set(masterKey, next);
    // Also deselect from current flight if it was there
    setTopics(ts => ts.filter(x => x !== t));
  }
  function toggleCheck(t) { setChecked(c => ({ ...c, [t]: !c[t] })); }

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
            }}>{editMaster ? "Done" : "Edit List"}</button>
          )}
          <button onClick={() => { setOpen(o => !o); if (open) setEditMaster(false); }} style={{
            background: "transparent", border: "none",
            color: THEME.red, fontSize: 15, fontWeight: 500,
            cursor: "pointer", fontFamily: FONT_TEXT, padding: "4px 0",
          }}>{open ? "Close" : (topics.length ? "Edit" : "Add")}</button>
        </div>
      </div>

      {open && (
        <div style={{ padding: "12px 16px", borderBottom: topics.length ? `0.5px solid ${THEME.separator}` : "none", background: "rgba(255,255,255,0.015)" }}>
          {stage && (
            <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textTertiary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8, fontFamily: FONT_TEXT }}>
              Topics for {trainingType} · {stage}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {masterList.map((t, i) => {
              const on = topics.includes(t);
              if (editMaster) {
                // Edit mode: chips become removable
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
                    <button onClick={() => removeFromMaster(t)} title="Remove from list" style={{
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
            {masterList.length === 0 && (
              <div style={{ color: THEME.textTertiary, fontSize: 13, fontStyle: "italic", padding: "4px 2px", fontFamily: FONT_TEXT }}>
                No topics yet — add one below
              </div>
            )}
          </div>
          {!editMaster && (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={custom} onChange={e => setCustom(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCustom()}
                placeholder="Add new topic to list"
                style={{
                  flex: 1, background: THEME.surface2, border: `1px solid ${THEME.border}`,
                  borderRadius: 10, padding: "10px 13px",
                  color: THEME.text, fontSize: 14, fontFamily: FONT_TEXT, outline: "none",
                }} />
              <button onClick={addCustom} style={{
                background: THEME.red, border: "none", borderRadius: 10,
                color: "#fff", fontWeight: 600, fontSize: 18,
                width: 42, cursor: "pointer",
              }}>+</button>
            </div>
          )}
          {editMaster && (
            <div style={{ marginTop: 4, fontSize: 12, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic" }}>
              Tap × to permanently remove a topic from your list
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
              <button onClick={() => toggle(t)} style={{
                background: "transparent", border: "none", color: THEME.textQuaternary,
                cursor: "pointer", fontSize: 19, padding: "0 4px", lineHeight: 1,
              }}>×</button>
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

function ApproachBuilder({ onInsert }) {
  const airportKey = "cfi_airports_used";
  const [airports, setAirports] = useState(() => ls.get(airportKey, []));
  const [airport, setAirport] = useState("");
  const [runway, setRunway] = useState("");
  const [approachType, setApproachType] = useState("");
  const [minimums, setMinimums] = useState("");
  const [isCircling, setIsCircling] = useState(false);
  const [circleRunway, setCircleRunway] = useState("");

  function selectAirport(code) {
    setAirport(code);
  }

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
  const supportsCircling = approachType === "RNAV";
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
    // Build the formatted note
    let formatted;
    if (isCircling && supportsCircling) {
      // RNAV circling: "RNAV 36 circle 18 @ KTRL"
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

  const canInsert = airport.trim() && runway.trim() && approachType && minsReady && circlingReady;

  return (
    <div style={{ padding: "4px 16px 14px" }}>
      {/* Airport */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7, fontFamily: FONT_TEXT }}>
          Airport
        </div>
        {/* Recent airports */}
        {airports.length > 0 && (
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
                  padding: "5px 10px 5px 12px",
                  cursor: "pointer", fontFamily: FONT_MONO,
                  letterSpacing: 0.3,
                }}>{code}</button>
                <button onClick={(e) => removeAirport(code, e)} title="Remove from history" style={{
                  background: "transparent", border: "none",
                  color: airport === code ? "rgba(255,255,255,0.7)" : THEME.textTertiary,
                  fontSize: 14, lineHeight: 1, padding: "5px 9px 5px 4px",
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
  const favKey = `cfi_favs_${trainingType}`;

  const [snippets, setSnippets] = useState(() => ls.get(snippetKey, DEFAULT_SNIPPETS[trainingType]));
  const [favorites, setFavorites] = useState(() => ls.get(favKey, []));
  const [activeGroup, setActiveGroup] = useState("Favorites");
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
  // Long-press drag state for reordering notes
  const [draggingIdx, setDraggingIdx] = useState(null); // index of the note being dragged
  const [dropTargetIdx, setDropTargetIdx] = useState(null); // where it would be dropped
  const [dragY, setDragY] = useState(0); // visual Y offset of the dragged item
  const longPressTimerRef = useRef(null);
  const dragStartRef = useRef({ y: 0, scrollY: 0 });
  const noteRefsRef = useRef({}); // map of index → DOM node

  const groups = ["Favorites", "Approach", ...Object.keys(snippets)];
  const isApproachTab = activeGroup === "Approach";
  const activeList = activeGroup === "Favorites" ? favorites : (snippets[activeGroup] || []);

  // Normalize: notes can be strings (legacy) or {text, subs} objects
  function noteText(n) { return typeof n === "string" ? n : n.text; }
  function noteSubs(n) { return typeof n === "string" ? [] : (n.subs || []); }

  function toggleFav(text) {
    const next = favorites.includes(text) ? favorites.filter(f => f !== text) : [...favorites, text];
    setFavorites(next); ls.set(favKey, next);
  }
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
    // Find the note that the cursor is closest to (by center point)
    // This handles both dragging up and down, including whitespace between items
    let closestIdx = null;
    let closestDistance = Infinity;

    Object.entries(noteRefsRef.current).forEach(([idxStr, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerY = (rect.top + rect.bottom) / 2;
      const distance = Math.abs(clientY - centerY);

      // Only consider items that are close enough (within 2x the item height)
      const itemHeight = rect.bottom - rect.top;
      if (distance < itemHeight * 1.5 && distance < closestDistance) {
        closestDistance = distance;
        closestIdx = parseInt(idxStr, 10);
      }
    });

    return closestIdx;
  }

  function startLongPress(idx, clientY, e) {
    // Cancel any pending timer
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    dragStartRef.current = { y: clientY, scrollY: window.scrollY };
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

  // Global pointer/touch listeners while dragging or pre-drag
  useEffect(() => {
    if (draggingIdx === null && longPressTimerRef.current === null) return;

    function onMove(e) {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      // If we haven't entered drag mode yet, cancel long-press if user moves significantly (scrolling)
      if (draggingIdx === null) {
        const dy = Math.abs(clientY - dragStartRef.current.y);
        if (dy > 12) cancelLongPress();
        return;
      }
      // Prevent scrolling while dragging
      if (e.cancelable) e.preventDefault();
      handleDragMove(clientY);
    }
    function onEnd() {
      if (draggingIdx !== null) endDrag();
      else cancelLongPress();
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
  }, [draggingIdx, dropTargetIdx]);

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
    const old = snippets[group][idx];
    const updated = { ...snippets, [group]: snippets[group].map((s, i) => i === idx ? val : s) };
    setSnippets(updated); ls.set(snippetKey, updated);
    if (favorites.includes(old)) {
      const nf = favorites.map(f => f === old ? val : f);
      setFavorites(nf); ls.set(favKey, nf);
    }
    setEditingIdx(null);
  }
  function deleteSnippet(group, idx) {
    const text = snippets[group][idx];
    const updated = { ...snippets, [group]: snippets[group].filter((_, i) => i !== idx) };
    setSnippets(updated); ls.set(snippetKey, updated);
    if (favorites.includes(text)) {
      const nf = favorites.filter(f => f !== text);
      setFavorites(nf); ls.set(favKey, nf);
    }
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
    if (activeGroup === name) setActiveGroup("Favorites");
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
          {open && (
            <button onClick={() => setEditMode(m => !m)} style={{
              background: "transparent", border: "none",
              color: editMode ? THEME.red : THEME.textSecondary,
              fontSize: 15, fontWeight: 500, cursor: "pointer", padding: "4px 0",
              fontFamily: FONT_TEXT,
            }}>{editMode ? "Done" : "Edit"}</button>
          )}
          <button onClick={() => { setOpen(o => !o); if (open) setEditMode(false); }} style={{
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
              const isProtected = g === "Favorites" || g === "Approach";
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
                    {g === "Favorites" ? "⭐ Favorites" : g === "Approach" ? "✈ Approach" : g}
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
            <ApproachBuilder onInsert={(text) => addNote(text, true)} />
          ) : (
          <div style={{ padding: "0 16px 14px" }}>
            {activeList.length === 0 && (
              <div style={{ color: THEME.textTertiary, fontSize: 14, fontStyle: "italic", padding: "12px 4px", fontFamily: FONT_TEXT }}>
                {activeGroup === "Favorites" ? "Tap ⭐ on any snippet to favorite it" : "No snippets yet"}
              </div>
            )}
            {activeList.map((s, i) => {
              const group = activeGroup === "Favorites" ? null : activeGroup;
              const realIdx = group ? snippets[group].indexOf(s) : -1;
              const isFav = favorites.includes(s);
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
                      <button onClick={() => toggleFav(s)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 17, padding: "4px", flexShrink: 0,
                        opacity: isFav ? 1 : 0.28, transition: "opacity 0.15s", lineHeight: 1,
                      }}>⭐</button>
                      <button onClick={() => editMode && group ? (() => { setEditingIdx(i); setEditVal(s); })() : addNote(s)} style={{
                        flex: 1,
                        background: THEME.surface2, border: `1px solid ${THEME.border}`,
                        borderRadius: 10, color: THEME.text,
                        fontSize: 14, padding: "10px 13px",
                        cursor: "pointer", textAlign: "left",
                        fontFamily: FONT_TEXT, lineHeight: 1.4,
                        transition: "all 0.12s",
                      }}
                        onMouseEnter={e => !editMode && (e.currentTarget.style.borderColor = THEME.red, e.currentTarget.style.background = THEME.redDim)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = THEME.border, e.currentTarget.style.background = THEME.surface2)}>
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

            {editMode && activeGroup !== "Favorites" && activeGroup !== "Approach" && (
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

      {/* Note list with long-press drag-and-drop reordering */}
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
              // Don't start drag if user touched a button or input
              if (e.target.closest("button, input, textarea")) return;
              startLongPress(i, e.touches[0].clientY, e);
            }}
            onMouseDown={(e) => {
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
              touchAction: isAnyDragging ? "none" : "auto",
              userSelect: isAnyDragging ? "none" : "auto",
              WebkitUserSelect: isAnyDragging ? "none" : "auto",
              cursor: isDragging ? "grabbing" : "default",
            }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
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
              <button onClick={() => toggleFav(text)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 15, padding: "2px 2px", flexShrink: 0,
                opacity: favorites.includes(text) ? 1 : 0.25, transition: "opacity 0.15s", lineHeight: 1,
              }}>⭐</button>
              <button onClick={() => removeNote(i)} style={{
                background: "transparent", border: "none", color: THEME.textQuaternary,
                cursor: "pointer", fontSize: 20, padding: "0 2px", flexShrink: 0, lineHeight: 1,
              }}>×</button>
            </div>

            {/* Sub-bullets */}
            {(hasSubs || isAddingSub) && !isDragging && (
              <div style={{ marginLeft: 28, marginTop: 6 }}>
                {subs.map((sub, si) => (
                  <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0" }}>
                    <span style={{ color: THEME.textTertiary, fontSize: 13, marginTop: 2, flexShrink: 0 }}>•</span>
                    <span style={{ flex: 1, fontSize: 14, color: THEME.textSecondary, fontFamily: FONT_TEXT, lineHeight: 1.5 }}>{sub}</span>
                    <button onClick={() => removeSubBullet(i, si)} style={{
                      background: "transparent", border: "none", color: THEME.textQuaternary,
                      cursor: "pointer", fontSize: 17, padding: "0 3px", flexShrink: 0, lineHeight: 1,
                    }}>×</button>
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
    </Card>
  );
}

// ─── Main Notes App ───────────────────────────────────────────────────────────

function NotesApp({ student, onBack, onViewHistory, onOpenDayNight }) {
  const [hobbs, setHobbs] = useState({ out: "", in_: "", total: "", calculatedField: null });
  const [topics, setTopics] = useState([]);
  const [checkedTopics, setCheckedTopics] = useState({});
  const [notes, setNotes] = useState([]);
  const [copied, setCopied] = useState(false);
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

  function copyAll() {
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

    // Archive captures the FULL lesson — student info, HOBBS, topics, and notes
    const hasContent = hobbs.out || hobbs.in_ || hobbs.total || topics.length || notes.length;
    if (!hasContent) return;

    const archiveKey = `cfi_lessons_${student.id}`;
    const existing = ls.get(archiveKey, []);
    const lesson = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dateLabel: today,
      hobbs,
      topics,
      checkedTopics,
      notes,
      formattedText: buildArchiveText(),
      studentSnapshot: { name: student.name, trainingType: student.trainingType, stage: student.stage, retrain: student.retrain },
    };
    ls.set(archiveKey, [lesson, ...existing]);
  }

  function clearAll() {
    if (!window.confirm("Start fresh? This clears the current session.")) return;
    setHobbs({ out: "", in_: "", total: "", calculatedField: null });
    setTopics([]); setCheckedTopics({}); setNotes([]);
  }

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: FONT_TEXT, paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))" }}>
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
            {!student.oneTime && (
              <button onClick={onViewHistory} style={{
                background: "transparent", border: "none",
                color: THEME.red, fontSize: 16, fontWeight: 400,
                cursor: "pointer", padding: "4px 0", fontFamily: FONT_TEXT,
              }}>History</button>
            )}
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
        <HobbsSection data={hobbs} setData={setHobbs} />
        <TopicPicker trainingType={student.trainingType} stage={student.stage} topics={topics} setTopics={setTopics} checked={checkedTopics} setChecked={setCheckedTopics} />
        <NotesSection trainingType={student.trainingType} notes={notes} setNotes={setNotes} />

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <button onClick={copyAll} style={{
            flex: 1,
            background: copied ? THEME.green : THEME.red,
            border: "none", borderRadius: 13,
            color: "#fff", fontWeight: 600, fontSize: 16,
            padding: "15px", cursor: "pointer",
            fontFamily: FONT_TEXT, letterSpacing: -0.2,
            transition: "all 0.25s",
            boxShadow: copied ? "0 4px 24px rgba(48,209,88,0.3)" : `0 4px 20px ${THEME.redGlow}`,
          }}>{copied ? "✓ Copied" : "Copy Notes"}</button>
          <button onClick={clearAll} style={{
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            borderRadius: 13, color: THEME.textSecondary,
            fontSize: 15, padding: "15px 18px", cursor: "pointer",
            fontFamily: FONT_TEXT, fontWeight: 500,
          }}>Clear</button>
        </div>

        {/* Solar Information shortcut */}
        <button onClick={() => onOpenDayNight(hobbs.total || "")} style={{
          width: "100%", padding: "11px",
          background: "transparent", border: `1px solid ${THEME.border}`,
          borderRadius: 11, color: THEME.textSecondary,
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          fontFamily: FONT_TEXT, marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>🌅</span>
          <span>Solar Information</span>
        </button>

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
    </div>
  );
}

// ─── Past Lessons List ────────────────────────────────────────────────────────

function PastLessonsList({ student, onBack, onSelectLesson }) {
  const archiveKey = `cfi_lessons_${student.id}`;
  const [lessons, setLessons] = useState(() => ls.get(archiveKey, []));
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
                  <div style={{ fontSize: 11, color: THEME.red, fontFamily: FONT_MONO, fontWeight: 600, letterSpacing: 0.4, marginBottom: 3, textTransform: "uppercase" }}>
                    {formatDate(l.timestamp)}
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

function PastLessonDetail({ lesson, onBack }) {
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
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: THEME.red, textTransform: "uppercase", fontFamily: FONT_MONO }}>
            {lesson.studentSnapshot?.trainingType || ""}{lesson.studentSnapshot?.stage ? ` · ${stageLabel(lesson.studentSnapshot)}` : ""} · {formatDate(lesson.timestamp)}
          </span>
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

        <button onClick={copyAgain} style={{
          width: "100%",
          background: copied ? THEME.green : THEME.red,
          border: "none", borderRadius: 13,
          color: "#fff", fontWeight: 600, fontSize: 16,
          padding: "15px", cursor: "pointer",
          fontFamily: FONT_TEXT, letterSpacing: -0.2,
          boxShadow: copied ? "0 4px 24px rgba(48,209,88,0.3)" : `0 4px 20px ${THEME.redGlow}`,
          transition: "all 0.25s",
        }}>{copied ? "✓ Copied" : "Copy Again"}</button>
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
  ["KOXB","Ocean City Municipal",38.3104,-75.124]
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

function DayNightCalc({ onBack, initialHobbs }) {
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

  // Taxi defaults — adjustable in settings, persisted to localStorage
  const [taxiOutMin, setTaxiOutMin] = useState(() => ls.get("cfi_taxi_out_min", 8));
  const [taxiInMin, setTaxiInMin] = useState(() => ls.get("cfi_taxi_in_min", 5));
  const [showSettings, setShowSettings] = useState(false);

  function saveTaxiOut(v) {
    const n = Math.max(0, Math.min(60, parseInt(v, 10) || 0));
    setTaxiOutMin(n); ls.set("cfi_taxi_out_min", n);
  }
  function saveTaxiIn(v) {
    const n = Math.max(0, Math.min(60, parseInt(v, 10) || 0));
    setTaxiInMin(n); ls.set("cfi_taxi_in_min", n);
  }

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

  // Compute takeoff/landing from engine start + HOBBS + taxi times
  // Engine start --[taxi out]--> Takeoff --[HOBBS]--> Landing --[taxi in]--> Engine stop
  const engineStartDate = combineDateTime(date, engineStart);
  const hobbsHours = parseFloat(hobbsTotal);
  const hobbsValid = !isNaN(hobbsHours) && hobbsHours > 0 && hobbsHours < 24;

  let takeoffDate = null, landingDate = null, adjustedLanding = null;
  if (engineStartDate && hobbsValid) {
    takeoffDate = new Date(engineStartDate.getTime() + taxiOutMin * 60 * 1000);
    landingDate = new Date(takeoffDate.getTime() + hobbsHours * 60 * 60 * 1000);
    adjustedLanding = landingDate;
  }
  // engine stop = landing + taxi in
  const engineStopDate = adjustedLanding
    ? new Date(adjustedLanding.getTime() + taxiInMin * 60 * 1000)
    : null;

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
    nightHours = nightSecs / 3600;
    dayHours = totalHours - nightHours;
    // Round to tenths
    dayHours = Math.round(dayHours * 10) / 10;
    nightHours = Math.round(nightHours * 10) / 10;
    totalHours = Math.round(totalHours * 10) / 10;
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <button onClick={onBack} style={{
              background: "transparent", border: "none",
              color: THEME.red, fontSize: 16, fontWeight: 400,
              cursor: "pointer", padding: "4px 0", fontFamily: FONT_TEXT,
            }}>‹ Home</button>
            <button onClick={() => setShowSettings(s => !s)} style={{
              background: "transparent", border: "none",
              color: showSettings ? THEME.red : THEME.textSecondary,
              fontSize: 16, fontWeight: 400,
              cursor: "pointer", padding: "4px 0", fontFamily: FONT_TEXT,
            }}>{showSettings ? "Done" : "Settings"}</button>
          </div>
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

        {/* Settings panel — appears when Settings is toggled */}
        {showSettings && (
          <Card style={{ padding: "14px 16px", marginBottom: 14, border: `1px solid ${THEME.red}40` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: THEME.red, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10, fontFamily: FONT_TEXT }}>
              Taxi Defaults
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 5, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>Taxi Out (min)</div>
                <input value={taxiOutMin}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                    saveTaxiOut(v);
                  }}
                  inputMode="numeric" pattern="[0-9]*"
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
                <div style={{ fontSize: 11, color: THEME.textSecondary, fontWeight: 600, marginBottom: 5, fontFamily: FONT_TEXT, textTransform: "uppercase", letterSpacing: 0.2 }}>Taxi In (min)</div>
                <input value={taxiInMin}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                    saveTaxiIn(v);
                  }}
                  inputMode="numeric" pattern="[0-9]*"
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
            <div style={{ fontSize: 11, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic", lineHeight: 1.45 }}>
              Used to calculate takeoff and landing time from engine start + HOBBS. Saved automatically.
            </div>
          </Card>
        )}

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

          {/* Computed takeoff/landing preview + fine-print explanation */}
          {takeoffDate && adjustedLanding && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: THEME.text, fontFamily: FONT_MONO, letterSpacing: 0.2 }}>
                Takeoff <span style={{ color: THEME.red, fontWeight: 600 }}>{formatTime(takeoffDate)}</span> · Landing <span style={{ color: THEME.red, fontWeight: 600 }}>{formatTime(adjustedLanding)}</span>
                {engineStopDate && <> · Engine Stop <span style={{ color: THEME.textSecondary }}>{formatTime(engineStopDate)}</span></>}
              </div>
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 11, color: THEME.textTertiary, fontFamily: FONT_TEXT, fontStyle: "italic", lineHeight: 1.45 }}>
            Estimates takeoff as engine start + {taxiOutMin} min taxi out, and landing as takeoff + HOBBS. Adjust taxi defaults in Settings.
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
              <div style={{ fontSize: 12, color: THEME.textSecondary, textAlign: "center", fontFamily: FONT_TEXT, fontStyle: "italic" }}>
                Night logging begins at {formatTime(nightStart)}
              </div>
            )}
            {nightHours === 0 && (
              <div style={{ fontSize: 12, color: THEME.textSecondary, textAlign: "center", fontFamily: FONT_TEXT, fontStyle: "italic" }}>
                Entire flight is during day — no night time
              </div>
            )}
          </Card>
        )}

        {(depAirport || destAirport || engineStart || hobbsTotal) && (
          <button onClick={reset} style={{
            width: "100%", padding: "12px",
            background: "transparent", border: `1px solid ${THEME.border}`,
            borderRadius: 11, color: THEME.textSecondary,
            fontSize: 14, fontWeight: 500, cursor: "pointer",
            fontFamily: FONT_TEXT,
          }}>Reset</button>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  // view: { type: "selector" } | { type: "notes", student } | { type: "history", student } | { type: "lesson", student, lesson } | { type: "daynight" }
  const [view, setView] = useState({ type: "selector" });

  useEffect(() => {
    document.body.style.background = THEME.bg;
    document.body.style.WebkitFontSmoothing = "antialiased";
    document.body.style.MozOsxFontSmoothing = "grayscale";
  }, []);

  if (view.type === "notes") {
    return <NotesApp student={view.student}
      onBack={() => setView({ type: "selector" })}
      onViewHistory={() => setView({ type: "history", student: view.student })}
      onOpenDayNight={(hobbsTotal) => setView({ type: "daynight", returnTo: "notes", student: view.student, initialHobbs: hobbsTotal })} />;
  }
  if (view.type === "history") {
    return <PastLessonsList student={view.student}
      onBack={() => setView({ type: "selector" })}
      onSelectLesson={(lesson) => setView({ type: "lesson", student: view.student, lesson })} />;
  }
  if (view.type === "lesson") {
    return <PastLessonDetail lesson={view.lesson}
      onBack={() => setView({ type: "history", student: view.student })} />;
  }
  if (view.type === "daynight") {
    return <DayNightCalc
      initialHobbs={view.initialHobbs || ""}
      onBack={() => {
        if (view.returnTo === "notes" && view.student) {
          setView({ type: "notes", student: view.student });
        } else {
          setView({ type: "selector" });
        }
      }} />;
  }
  return <StudentSelector
    onSelect={(s) => setView({ type: "notes", student: s })}
    onViewHistory={(s) => setView({ type: "history", student: s })}
    onOpenDayNight={() => setView({ type: "daynight" })}
  />;
}
