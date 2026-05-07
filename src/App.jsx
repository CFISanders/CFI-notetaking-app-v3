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

function StudentSelector({ onSelect, onViewHistory }) {
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
            borderRadius: 14, marginBottom: 20,
            background: THEME.red, border: "none",
            color: "#fff", fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: FONT_TEXT,
            letterSpacing: -0.2,
            boxShadow: `0 4px 20px ${THEME.redGlow}`,
          }}>+ New Student</button>
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
    let bestIdx = null;
    Object.entries(noteRefsRef.current).forEach(([idxStr, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        bestIdx = parseInt(idxStr, 10);
      }
    });
    return bestIdx;
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
                fontSize: isApproach ? 20 : 18,
                lineHeight: "20px",
                flexShrink: 0, marginTop: 1,
              }}>{isApproach ? "■" : "•"}</span>
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
                    <span style={{ color: THEME.textTertiary, fontSize: 13, marginTop: 2, flexShrink: 0 }}>○</span>
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

function NotesApp({ student, onBack, onViewHistory }) {
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
        // Larger/bolder visual style for approach headings
        lines.push(`■ ${text.toUpperCase()}`);
      } else {
        lines.push(`• ${text}`);
      }
      subs.forEach(s => lines.push(`   ○ ${s}`));
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
          lines.push(`■ ${text.toUpperCase()}`);
        } else {
          lines.push(`• ${text}`);
        }
        subs.forEach(s => lines.push(`   ○ ${s}`));
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
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
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

  function copyAgain() {
    navigator.clipboard.writeText(lesson.formattedText).then(() => {
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
                      fontSize: isApproach ? 20 : 18,
                      lineHeight: "20px", flexShrink: 0, marginTop: 1,
                    }}>{isApproach ? "■" : "•"}</span>
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
                          <span style={{ color: THEME.textTertiary, fontSize: 13, marginTop: 2 }}>○</span>
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  // view: { type: "selector" } | { type: "notes", student } | { type: "history", student } | { type: "lesson", student, lesson }
  const [view, setView] = useState({ type: "selector" });

  useEffect(() => {
    document.body.style.background = THEME.bg;
    document.body.style.WebkitFontSmoothing = "antialiased";
    document.body.style.MozOsxFontSmoothing = "grayscale";
  }, []);

  if (view.type === "notes") {
    return <NotesApp student={view.student}
      onBack={() => setView({ type: "selector" })}
      onViewHistory={() => setView({ type: "history", student: view.student })} />;
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
  return <StudentSelector
    onSelect={(s) => setView({ type: "notes", student: s })}
    onViewHistory={(s) => setView({ type: "history", student: s })}
  />;
}
