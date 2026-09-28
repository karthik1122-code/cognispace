import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Star, Check,
  Users, Send, Table, FileText,
  Bot, ListTodo, Heading, ChevronDown,
  Play, Search, Copy, Plus, Kanban, BookOpen,
  ArrowRight, ShieldCheck, MessageSquare
} from "lucide-react";

// ── Cosmic Obsidian & Electric Cyan-Indigo Design System ──
const C = {
  bg:         "#060813",
  card:       "#0b0f24",
  cardElev:   "#101633",
  border:     "rgba(255,255,255,0.08)",
  borderCyan: "rgba(6,182,212,0.45)",
  cyan:       "#06b6d4",
  cyanGlow:   "#38bdf8",
  indigo:     "#4f46e5",
  indigoLight:"#818cf8",
  magenta:    "#ec4899",
  purple:     "#a855f7",
  amber:      "#f59e0b",
  green:      "#10b981",
  text:       "#f8fafc",
  text2:      "#94a3b8",
  text3:      "#64748b",
  muted:      "#141a38",
};

const sp = { type: "spring" as const, stiffness: 260, damping: 24 };

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  // Main Hero Canvas Tab: "doc" | "table" | "ai" | "wiki"
  const [activeCanvasTab, setActiveCanvasTab] = useState<"doc" | "table" | "ai" | "wiki">("doc");

  // Database Sub-View Toggle (Table vs Kanban Board)
  const [databaseView, setDatabaseView] = useState<"table" | "board">("table");

  // Interactive Checklist in Doc View
  const [checkedTasks, setCheckedTasks] = useState<{ [key: string]: boolean }>({
    t1: true,
    t2: true,
    t3: false,
    t4: false,
  });

  const toggleTask = (id: string) => {
    setCheckedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle List Block Expansion State in Doc View
  const [isToggleOpen, setIsToggleOpen] = useState(false);

  // Slash Command Menu Simulator
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedSlashBlock, setSelectedSlashBlock] = useState<string>("to-do");

  // Notion-style "See what CogniSpace can do" Workflow Switcher
  const [activeWorkflow, setActiveWorkflow] = useState<"triage" | "support" | "security" | "reporting" | "devtools">("triage");

  // Notion-style Team Use Case Switcher
  const [activeTeamTab, setActiveTeamTab] = useState<"eng" | "prod" | "design" | "wiki">("eng");

  // Building Blocks Playground Active Block Tab
  const [activeBlockType, setActiveBlockType] = useState<"callout" | "todo" | "code" | "db">("callout");

  // Pricing Annual vs Monthly Switcher
  const [isAnnual, setIsAnnual] = useState(true);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // AI Streaming Simulation State
  const [isAiSynthesizing, setIsAiSynthesizing] = useState(false);
  const [aiOutputText, setAiOutputText] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSynthesizeClick = (prompt = "Synthesise sprint priorities & generate action items") => {
    if (isAiSynthesizing) return;
    setIsAiSynthesizing(true);
    setAiOutputText("");

    const fullResponse =
      `✨ AI Agent Response to: "${prompt}"\n\n` +
      "1. Debounce sync loop verified at 800ms with OCC increment checks (PR #142 approved).\n" +
      "2. SSE AI streaming latency stabilized at 16.4ms across US-East edge nodes.\n" +
      "3. All 4 milestone database items linked to customer launch checklist.";

    let idx = 0;
    const interval = setInterval(() => {
      idx += 4;
      if (idx <= fullResponse.length) {
        setAiOutputText(fullResponse.slice(0, idx));
      } else {
        setAiOutputText(fullResponse);
        clearInterval(interval);
        setIsAiSynthesizing(false);
      }
    }, 20);
  };

  const copySnippet = () => {
    navigator.clipboard?.writeText(`const sync = new DeltaSyncEngine({ debounceDelayMs: 800, optimisticLocking: true });`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflowX: "hidden" }}>

      {/* ── Ambient Radial Glows & Subtle Grid ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-25%", left: "50%", transform: "translateX(-50%)", width: "100%", height: "85vh", background: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.18) 0%, rgba(79,70,229,0.12) 40%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "35%", right: "-10%", width: 650, height: 650, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-10%", width: 650, height: 650, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px", opacity: 0.025 }} />
      </div>

      {/* ═══ 1. FLOATING FROSTED NAVBAR ═══ */}
      <div style={{ position: "sticky", top: 16, zIndex: 100, display: "flex", justifyContent: "center", padding: "0 1.5rem" }}>
        <header style={{
          width: "100%", maxWidth: 1060, height: 58,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", borderRadius: 99,
          background: "rgba(6,8,19,0.85)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${C.border}`,
          boxShadow: "0 16px 36px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)"
        }}>
          {/* Brand Logo with Glow */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.cyan}, ${C.indigo})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, color: "white", fontSize: 13,
              boxShadow: `0 0 18px ${C.cyan}80`
            }}>
              CS
            </div>
            <span style={{ fontWeight: 800, fontSize: 16.5, letterSpacing: "-0.03em", color: C.text }}>CogniSpace</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(6,182,212,0.15)", color: C.cyanGlow, border: `1px solid ${C.cyan}40` }}>
              v3.0
            </span>
          </div>

          {/* Navigation Links with Notion Dropdown indicator */}
          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {[
              { label: "Product ▾", href: "#preview" },
              { label: "Capabilities ▾", href: "#capabilities" },
              { label: "Building Blocks", href: "#blocks" },
              { label: "Teams", href: "#teams" },
              { label: "Pricing", href: "#pricing" }
            ].map(link => (
              <a key={link.label} href={link.href}
                style={{ fontSize: 13.5, fontWeight: 500, color: C.text2, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.text2)}>
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onLogin}
              style={{ background: "none", border: "none", fontSize: 13, fontWeight: 600, color: C.text2, cursor: "pointer", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.text2)}>
              Log in
            </button>
            <button onClick={onGetStarted}
              style={{
                padding: "8px 20px", fontSize: 13, fontWeight: 700,
                color: "#060813", background: C.cyan,
                border: "none", borderRadius: 99,
                cursor: "pointer",
                boxShadow: `0 0 24px ${C.cyan}90`,
                transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cyanGlow; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.cyan; e.currentTarget.style.transform = "translateY(0)"; }}>
              Get CogniSpace free
            </button>
          </div>
        </header>
      </div>

      <main style={{ position: "relative", zIndex: 1 }}>

        {/* ═══ 2. HERO SECTION (NOTION-INSPIRED) ═══ */}
        <section style={{ maxWidth: 1240, margin: "0 auto", padding: "68px 2rem 0", textAlign: "center" }}>

          {/* Status Badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={sp}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 16px", borderRadius: 99,
              border: `1px solid ${C.cyan}50`,
              background: "rgba(6,182,212,0.12)",
              marginBottom: 26, cursor: "default"
            }}>
            <span style={{ fontSize: 13, color: C.cyanGlow }}>✨</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.cyanGlow, letterSpacing: "-0.01em" }}>
              CogniSpace 3.0 · Where teams and agents think together
            </span>
          </motion.div>

          {/* Headline matching Notion's iconic vision */}
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.05 }}
            style={{
              fontSize: "clamp(38px, 5.6vw, 80px)",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              color: "#ffffff",
              maxWidth: 1020,
              margin: "0 auto 22px"
            }}>
            Where teams and agents<br />
            <span style={{
              background: `linear-gradient(90deg, ${C.cyanGlow} 0%, ${C.indigoLight} 50%, #c084fc 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>think together.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.1 }}
            style={{
              fontSize: "clamp(16px, 1.8vw, 19.5px)",
              lineHeight: 1.6,
              color: C.text2,
              maxWidth: 700,
              margin: "0 auto 36px",
              letterSpacing: "-0.01em"
            }}>
            Capture context, find answers instantly, and automate busywork with AI built for your team. The connected workspace where high-velocity companies get more done, faster.
          </motion.p>

          {/* Action Buttons & Social Proof Card Row */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.15 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 36 }}>

            <button onClick={onGetStarted}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 32px", fontSize: 14.5, fontWeight: 800,
                color: "#060813", background: C.cyan,
                border: "none", borderRadius: 99,
                cursor: "pointer",
                boxShadow: `0 0 36px ${C.cyan}85`,
                transition: "all 0.18s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cyanGlow; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.cyan; e.currentTarget.style.transform = "translateY(0)"; }}>
              Get CogniSpace free →
            </button>

            <a href="#capabilities"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 26px", fontSize: 14, fontWeight: 600,
                color: C.text, background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.border}`, borderRadius: 99,
                textDecoration: "none", cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; }}>
              <Play size={13} style={{ fill: "currentColor" }} /> See interactive workflows
            </a>

            {/* Trust Avatar Stack Card */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "8px 16px", borderRadius: 99,
              background: "rgba(11,15,36,0.65)",
              border: `1px solid ${C.border}`,
              backdropFilter: "blur(12px)"
            }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {[
                  { initials: "MT", bg: "from-cyan-400 to-blue-500" },
                  { initials: "RS", bg: "from-indigo-500 to-purple-600" },
                  { initials: "BL", bg: "from-pink-500 to-rose-500" },
                  { initials: "MK", bg: "from-emerald-400 to-teal-500" }
                ].map((av, idx) => (
                  <div key={idx} className={`w-6 h-6 rounded-full bg-gradient-to-br ${av.bg} flex items-center justify-center text-[9px] font-bold text-white border-2`}
                    style={{ borderColor: C.bg, marginLeft: idx > 0 ? -6 : 0 }}>
                    {av.initials}
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-300 border-2"
                  style={{ borderColor: C.bg, marginLeft: -6 }}>
                  +5k
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text, marginLeft: 2 }}>4.9/5</span>
              </div>
            </div>
          </motion.div>

          {/* ═══ NOTION-STYLE FEATURE PILL STACK ═══ */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
            {[
              { label: "✨ Notion-Grade Docs", color: C.cyanGlow },
              { label: "🤖 AI Custom Agents", color: C.indigoLight },
              { label: "📊 Sprint Databases", color: C.magenta },
              { label: "⚡ Sub-18ms Edge Sync", color: C.green },
              { label: "🧠 Vector Knowledge Graph", color: C.purple },
              { label: "👥 Multiplayer Cursors", color: C.amber }
            ].map((chip) => (
              <motion.div
                key={chip.label}
                whileHover={{ scale: 1.05, y: -2 }}
                style={{
                  padding: "6px 14px", borderRadius: 99,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                  fontSize: 12, fontWeight: 600, color: chip.color,
                  cursor: "default",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.4)"
                }}
              >
                {chip.label}
              </motion.div>
            ))}
          </div>

          {/* ═══ 3. THE $100M NOTION-LEVEL WORKSPACE PREVIEW CANVAS ═══ */}
          <div id="preview" style={{ position: "relative", maxWidth: 1140, margin: "0 auto", perspective: 1200 }}>
            {/* Ambient Cyan Halo under Mockup */}
            <div style={{
              position: "absolute", inset: "15% 10%", bottom: -20,
              background: `radial-gradient(ellipse, ${C.cyan}35 0%, ${C.indigo}25 40%, transparent 70%)`,
              filter: "blur(60px)", pointerEvents: "none"
            }} />

            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: 14, rotateY: -4 }}
              animate={{ opacity: 1, y: 0, rotateX: 6, rotateY: -1 }}
              transition={{ ...sp, delay: 0.2 }}
              style={{
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#080b18",
                boxShadow: "0 48px 100px -20px rgba(0,0,0,0.95), 0 0 60px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                transformStyle: "preserve-3d"
              }}
            >
              {/* Chrome Top Header & Notion View Switcher Tabs */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 20px", borderBottom: `1px solid ${C.border}`,
                background: "rgba(255,255,255,0.02)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Window Dot Controls */}
                  <div style={{ display: "flex", gap: 7 }}>
                    <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
                    <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e" }} />
                    <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
                  </div>

                  {/* Notion-style View Tabs */}
                  <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
                    {[
                      { id: "doc", label: "Document", icon: <FileText size={12} /> },
                      { id: "table", label: "Database Table & Board", icon: <Table size={12} /> },
                      { id: "ai", label: "AI Copilot & Agents", icon: <Bot size={12} /> },
                      { id: "wiki", label: "Knowledge Wiki", icon: <BookOpen size={12} /> }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveCanvasTab(t.id as any)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "5px 12px", borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                          border: "none", cursor: "pointer", transition: "all 0.15s",
                          background: activeCanvasTab === t.id ? C.cyan : "transparent",
                          color: activeCanvasTab === t.id ? "#060813" : C.text2
                        }}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: C.text3, fontFamily: "monospace" }}>
                  <span>Acme Workspace /</span>
                  <span style={{ color: C.cyanGlow, fontWeight: 600 }}>🚀 Product Launch 3.0</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.green, background: `${C.green}15`, padding: "3px 9px", borderRadius: 99, border: `1px solid ${C.green}30` }}>
                    ● 18ms Live Sync
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.text3 }}>
                    <Users size={12} />
                    <span>3 online</span>
                  </div>
                </div>
              </div>

              {/* Main Body Split: Notion-style Sidebar + Dynamic Content Canvas */}
              <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", minHeight: 520, textAlign: "left" }}>

                {/* Left Frosted Sidebar (Notion-style Workspace Pages) */}
                <div style={{
                  borderRight: `1px solid ${C.border}`,
                  background: "rgba(5,7,17,0.7)",
                  padding: "18px 14px",
                  display: "flex", flexDirection: "column", gap: 14
                }}>
                  {/* Workspace switcher header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${C.cyan}, ${C.indigo})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "white" }}>CS</div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Acme HQ Workspace</span>
                  </div>

                  <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3, padding: "0 4px", fontWeight: 700 }}>
                    Teamspaces & Pages
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {[
                      { icon: "🧠", label: "Product Launch 3.0", active: activeCanvasTab === "doc" },
                      { icon: "📊", label: "Sprint Roadmap", active: activeCanvasTab === "table" },
                      { icon: "🤖", label: "AI Agent Workflows", active: activeCanvasTab === "ai" },
                      { icon: "📚", label: "Engineering Wiki", active: activeCanvasTab === "wiki" },
                      { icon: "🎨", label: "Brand Design System", active: false },
                      { icon: "🔗", label: "API Surface & REST", active: false }
                    ].map(item => (
                      <div key={item.label} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px", borderRadius: 8, fontSize: 11.5,
                        color: item.active ? C.cyanGlow : C.text3,
                        background: item.active ? "rgba(6,182,212,0.12)" : "transparent",
                        fontWeight: item.active ? 600 : 400,
                        cursor: "pointer", transition: "all 0.15s"
                      }}>
                        <span>{item.icon}</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                        {item.active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }} />}
                      </div>
                    ))}
                  </div>

                  {/* Notion-style Quick Action in Sidebar */}
                  <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.text3, fontSize: 11.5, cursor: "pointer", padding: "6px 8px", borderRadius: 6 }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.cyanGlow)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.text3)}>
                      <Plus size={13} />
                      <span>New Page or Database</span>
                    </div>
                  </div>
                </div>

                {/* Right Interactive Canvas */}
                <div style={{
                  position: "relative",
                  background: "linear-gradient(180deg, #090c1f 0%, #060814 100%)",
                  display: "flex", flexDirection: "column"
                }}>

                  {/* Document Cover Banner */}
                  <div style={{
                    height: 85, width: "100%",
                    background: "linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(79,70,229,0.35) 50%, rgba(168,85,247,0.25) 100%)",
                    borderBottom: `1px solid ${C.border}`, position: "relative"
                  }}>
                    {/* Emoji badge */}
                    <div style={{
                      position: "absolute", bottom: -18, left: 32,
                      width: 40, height: 40, borderRadius: 12,
                      background: "#080b18", border: `1px solid ${C.borderCyan}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.6)"
                    }}>
                      🚀
                    </div>
                  </div>

                  <div style={{ padding: "28px 36px 28px", flex: 1, display: "flex", flexDirection: "column" }}>

                    {/* ═══ CANVAS TAB 1: NOTION-GRADE DOCUMENT ═══ */}
                    {activeCanvasTab === "doc" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                        {/* Multiplayer Cursor: Mia K. (Magenta) */}
                        <motion.div
                          animate={{ x: [0, 20, -10, 0], y: [0, -10, 8, 0] }}
                          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                          style={{ position: "absolute", top: 120, right: 180, zIndex: 20, pointerEvents: "none" }}
                        >
                          <svg width="18" height="18" viewBox="0 0 16 16" fill={C.magenta} style={{ filter: "drop-shadow(0 2px 6px rgba(236,72,153,0.5))" }}>
                            <path d="M0 0l5.5 14 2.5-5.5L14 6 0 0z" />
                          </svg>
                          <div style={{
                            marginTop: 2, marginLeft: 10, padding: "2px 8px", borderRadius: 99,
                            background: C.magenta, color: "white", fontSize: 10, fontWeight: 700,
                            boxShadow: "0 2px 10px rgba(236,72,153,0.4)"
                          }}>
                            Mia K. (Editing)
                          </div>
                        </motion.div>

                        {/* Multiplayer Cursor: Kenji T. (Indigo) */}
                        <motion.div
                          animate={{ x: [0, -15, 12, 0], y: [0, 12, -6, 0] }}
                          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                          style={{ position: "absolute", top: 220, right: 280, zIndex: 20, pointerEvents: "none" }}
                        >
                          <svg width="18" height="18" viewBox="0 0 16 16" fill={C.indigoLight} style={{ filter: "drop-shadow(0 2px 6px rgba(129,140,248,0.5))" }}>
                            <path d="M0 0l5.5 14 2.5-5.5L14 6 0 0z" />
                          </svg>
                          <div style={{
                            marginTop: 2, marginLeft: 10, padding: "2px 8px", borderRadius: 99,
                            background: C.indigo, color: "white", fontSize: 10, fontWeight: 700,
                            boxShadow: "0 2px 10px rgba(79,70,229,0.4)"
                          }}>
                            Kenji T.
                          </div>
                        </motion.div>

                        {/* Page Title */}
                        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em", marginBottom: 8 }}>
                          Product Launch 3.0 & Architecture Spec
                        </h2>

                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: C.text3, marginBottom: 18 }}>
                          <span>Updated 2m ago by Mia K.</span>
                          <span>•</span>
                          <span style={{ color: C.cyanGlow }}>Verified Spec</span>
                          <span>•</span>
                          <span>3 Linked sprint items</span>
                        </div>

                        {/* Notion Callout Box with Emoji */}
                        <div style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "12px 16px", borderRadius: 10,
                          background: "rgba(6,182,212,0.08)", border: `1px solid ${C.cyan}40`,
                          marginBottom: 18
                        }}>
                          <span style={{ fontSize: 18 }}>💡</span>
                          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.text }}>
                            <strong style={{ color: C.cyanGlow }}>Pro Tip:</strong> CogniSpace uses dual SSE token streaming and 800ms debounce loop with optimistic concurrency control for zero write collisions during collaborative editing.
                          </div>
                        </div>

                        {/* Interactive Notion Checklist Blocks */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, fontSize: 13, color: "#cbd5e1" }}>
                          {[
                            { id: "t1", text: "Finalize 800ms debounce loop with atomic OCC increment checks" },
                            { id: "t2", text: "Integrate collaborative multiplayer cursors with presence avatars" },
                            { id: "t3", text: "Deploy Gemini 2.5 Flash token streamer with sub-18ms latency" },
                            { id: "t4", text: "Synchronize Kanban sprint board with release milestone table" }
                          ].map(t => (
                            <div
                              key={t.id}
                              onClick={() => toggleTask(t.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 10,
                                cursor: "pointer", userSelect: "none"
                              }}
                            >
                              <div style={{
                                width: 16, height: 16, borderRadius: 4,
                                background: checkedTasks[t.id] ? C.cyan : "rgba(255,255,255,0.05)",
                                border: `1px solid ${checkedTasks[t.id] ? C.cyan : C.border}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.15s"
                              }}>
                                {checkedTasks[t.id] && <Check size={11} style={{ color: "#060813", strokeWidth: 3 }} />}
                              </div>
                              <span style={{
                                textDecoration: checkedTasks[t.id] ? "line-through" : "none",
                                color: checkedTasks[t.id] ? C.text3 : C.text,
                                transition: "all 0.15s"
                              }}>
                                {t.text}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Notion-Style Toggle Block */}
                        <div style={{ marginBottom: 18, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", background: "rgba(255,255,255,0.02)" }}>
                          <div
                            onClick={() => setIsToggleOpen(!isToggleOpen)}
                            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: C.cyanGlow }}
                          >
                            <span style={{ transform: isToggleOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▶</span>
                            <span>System Architecture & Sub-18ms Edge Sync</span>
                          </div>
                          {isToggleOpen && (
                            <div style={{ marginTop: 8, paddingLeft: 20, fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                              State patches are dispatched with optimistic timestamp validation. Conflict resolution uses Last-Write-Wins (LWW) with automated vector graph reconciliation.
                            </div>
                          )}
                        </div>

                        {/* Interactive Slash Command Trigger Button */}
                        <div style={{ position: "relative", marginBottom: 16 }}>
                          <div
                            onClick={() => setShowSlashMenu(!showSlashMenu)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 8,
                              padding: "6px 14px", borderRadius: 8,
                              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderCyan}`,
                              fontSize: 12, color: C.cyanGlow, cursor: "pointer", transition: "all 0.15s"
                            }}
                          >
                            <span>Type <kbd style={{ padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.1)", color: "white", fontFamily: "monospace" }}>/</kbd> for commands or click here</span>
                          </div>

                          {/* Notion-style Slash Command Popup Menu */}
                          <AnimatePresence>
                            {showSlashMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                style={{
                                  position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 40,
                                  width: 270, padding: 6, borderRadius: 12,
                                  background: "#0c1024", border: `1px solid ${C.borderCyan}`,
                                  boxShadow: "0 16px 40px rgba(0,0,0,0.8), 0 0 20px rgba(6,182,212,0.25)"
                                }}
                              >
                                <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, padding: "4px 8px", textTransform: "uppercase" }}>Basic Notion Blocks</div>
                                {[
                                  { id: "text", label: "Text", desc: "Start writing plain text", icon: <FileText size={13} /> },
                                  { id: "heading", label: "Heading 1", desc: "Large section header", icon: <Heading size={13} /> },
                                  { id: "to-do", label: "To-do list", desc: "Track tasks with checkboxes", icon: <ListTodo size={13} /> },
                                  { id: "table", label: "Table view", desc: "Interactive database table", icon: <Table size={13} /> },
                                  { id: "kanban", label: "Board view", desc: "Kanban sprint cards", icon: <Kanban size={13} /> },
                                  { id: "ai", label: "Ask AI Agent", desc: "Summarize or generate", icon: <Bot size={13} /> }
                                ].map(item => (
                                  <div
                                    key={item.id}
                                    onClick={() => { setSelectedSlashBlock(item.id); setShowSlashMenu(false); }}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 10, padding: "6px 8px",
                                      borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
                                      background: selectedSlashBlock === item.id ? "rgba(6,182,212,0.12)" : "transparent"
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = selectedSlashBlock === item.id ? "rgba(6,182,212,0.12)" : "transparent")}
                                  >
                                    <div style={{ color: C.cyanGlow }}>{item.icon}</div>
                                    <div>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.label}</div>
                                      <div style={{ fontSize: 10, color: C.text3 }}>{item.desc}</div>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                      </motion.div>
                    )}

                    {/* ═══ CANVAS TAB 2: NOTION DATABASE (TABLE & KANBAN VIEWS) ═══ */}
                    {activeCanvasTab === "table" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Table size={14} style={{ color: C.cyanGlow }} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Sprint Release Roadmap</span>

                            {/* View Switcher: Table vs Board */}
                            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: 2, marginLeft: 12, border: `1px solid ${C.border}` }}>
                              <button
                                onClick={() => setDatabaseView("table")}
                                style={{
                                  padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                                  background: databaseView === "table" ? C.cyan : "transparent",
                                  color: databaseView === "table" ? "#060813" : C.text2
                                }}
                              >
                                ☰ Table
                              </button>
                              <button
                                onClick={() => setDatabaseView("board")}
                                style={{
                                  padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                                  background: databaseView === "board" ? C.cyan : "transparent",
                                  color: databaseView === "board" ? "#060813" : C.text2
                                }}
                              >
                                ⊞ Board
                              </button>
                            </div>
                          </div>
                          <span style={{ fontSize: 10.5, color: C.text3, fontFamily: "monospace" }}>4 items · sorted by due date</span>
                        </div>

                        {databaseView === "table" ? (
                          /* Notion Table View */
                          <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", background: "rgba(6,8,19,0.6)" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                              <thead>
                                <tr style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", color: C.text3, fontSize: 11 }}>
                                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Task Name</th>
                                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Status</th>
                                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Priority</th>
                                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Assignee</th>
                                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Due Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { task: "🚀 Product Launch Spec", status: "In Progress", sc: C.green, sbg: `${C.green}20`, prio: "Urgent", prc: C.amber, owner: "Mia K.", due: "Today" },
                                  { task: "⚡ OCC Version Concurrency", status: "Done", sc: C.cyanGlow, sbg: `${C.cyan}20`, prio: "High", prc: C.indigoLight, owner: "Kenji T.", due: "Yesterday" },
                                  { task: "📡 SSE AI Token Tunnel", status: "In Review", sc: C.amber, sbg: `${C.amber}20`, prio: "High", prc: C.indigoLight, owner: "Alex R.", due: "Oct 2" },
                                  { task: "🧠 Smart Vector Memory Graph", status: "Backlog", sc: C.purple, sbg: `${C.purple}20`, prio: "Medium", prc: C.text3, owner: "Sarah L.", due: "Oct 15" }
                                ].map((row, idx) => (
                                  <tr key={idx} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    <td style={{ padding: "9px 12px", color: C.text, fontWeight: 500 }}>{row.task}</td>
                                    <td style={{ padding: "9px 12px" }}>
                                      <span style={{
                                        padding: "3px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 600,
                                        color: row.sc, background: row.sbg, border: `1px solid ${row.sc}40`
                                      }}>
                                        {row.status}
                                      </span>
                                    </td>
                                    <td style={{ padding: "9px 12px" }}>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: row.prc }}>{row.prio}</span>
                                    </td>
                                    <td style={{ padding: "9px 12px", color: C.text2 }}>{row.owner}</td>
                                    <td style={{ padding: "9px 12px", color: C.text3, fontFamily: "monospace", fontSize: 11 }}>{row.due}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          /* Notion Kanban Board View */
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                            {[
                              {
                                col: "To Do",
                                count: 1,
                                color: C.text3,
                                cards: [
                                  { title: "🧠 Smart Vector Memory Graph", tag: "AI Search", prio: "Medium", owner: "Sarah L." }
                                ]
                              },
                              {
                                col: "In Progress",
                                count: 2,
                                color: C.amber,
                                cards: [
                                  { title: "🚀 Product Launch Spec", tag: "Tier-1", prio: "Urgent", owner: "Mia K." },
                                  { title: "📡 SSE AI Token Tunnel", tag: "Backend", prio: "High", owner: "Alex R." }
                                ]
                              },
                              {
                                col: "Done",
                                count: 1,
                                color: C.green,
                                cards: [
                                  { title: "⚡ OCC Version Concurrency", tag: "Infra", prio: "High", owner: "Kenji T." }
                                ]
                              }
                            ].map(col => (
                              <div key={col.col} style={{ borderRadius: 10, background: "rgba(6,8,19,0.5)", border: `1px solid ${C.border}`, padding: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: col.color }}>{col.col}</span>
                                    <span style={{ fontSize: 10, background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 99, color: C.text3 }}>{col.count}</span>
                                  </div>
                                  <Plus size={12} style={{ color: C.text3, cursor: "pointer" }} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {col.cards.map((c, ci) => (
                                    <div key={ci} style={{
                                      padding: 10, borderRadius: 8, background: "#0c1024",
                                      border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
                                    }}>
                                      <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text, marginBottom: 6 }}>{c.title}</div>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10 }}>
                                        <span style={{ background: "rgba(6,182,212,0.12)", color: C.cyanGlow, padding: "2px 6px", borderRadius: 4 }}>{c.tag}</span>
                                        <span style={{ color: C.text3 }}>{c.owner}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ═══ CANVAS TAB 3: NOTION AI COPILOT & CUSTOM AGENTS ═══ */}
                    {activeCanvasTab === "ai" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: C.cyanGlow, display: "flex", alignItems: "center", gap: 8 }}>
                            <Bot size={15} /> CogniSpace AI Agent · Gemini 2.5 Flash
                          </span>
                          <span style={{ fontSize: 10, fontFamily: "monospace", color: C.green, background: `${C.green}15`, padding: "3px 9px", borderRadius: 99, border: `1px solid ${C.green}30` }}>
                            sub-18ms response · 0 hallucination
                          </span>
                        </div>

                        {/* Interactive Suggestion Chips */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {[
                            "⚡ Summarize Sprint",
                            "📋 Extract Action Items",
                            "🔍 Search Cross-Workspace",
                            "✨ Draft Release Announcement"
                          ].map(prompt => (
                            <button
                              key={prompt}
                              onClick={() => handleSynthesizeClick(prompt)}
                              style={{
                                padding: "5px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                                background: "rgba(6,182,212,0.1)", border: `1px solid ${C.cyan}40`,
                                color: C.cyanGlow, cursor: "pointer", transition: "all 0.15s"
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(6,182,212,0.2)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(6,182,212,0.1)")}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>

                        {/* AI Streaming Response Card */}
                        <div style={{
                          padding: 16, borderRadius: 12,
                          background: "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(79,70,229,0.06) 100%)",
                          border: `1px solid ${C.cyan}40`, fontSize: 12.5, lineHeight: 1.6, color: C.text
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: C.cyanGlow, marginBottom: 8 }}>
                            <Sparkles size={14} />
                            <span>Workspace Intelligence Synthesis:</span>
                          </div>
                          <pre style={{ margin: 0, fontFamily: "Inter, sans-serif", whiteSpace: "pre-wrap", color: C.text2 }}>
                            {aiOutputText || "Click any prompt chip above or use the omnibar below to watch real-time token streaming..."}
                          </pre>
                        </div>
                      </motion.div>
                    )}

                    {/* ═══ CANVAS TAB 4: KNOWLEDGE WIKI ═══ */}
                    {activeCanvasTab === "wiki" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                            <BookOpen size={15} style={{ color: C.cyanGlow }} /> Acme Engineering Central Wiki
                          </span>
                          <span style={{ fontSize: 11, color: C.text3 }}>Verified single source of truth</span>
                        </div>

                        {/* Semantic Search Bar */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                          borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`
                        }}>
                          <Search size={14} style={{ color: C.cyanGlow }} />
                          <span style={{ fontSize: 12, color: C.text3 }}>Search policies, RFCs, onboarding guides (⌘K)...</span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {[
                            { title: "📐 Architecture Decision Records (ADRs)", docs: "14 docs", update: "Yesterday" },
                            { title: "🔒 Security & SOC-2 Compliance", docs: "8 docs", update: "3 days ago" },
                            { title: "🚀 CI/CD & Production Deployment", docs: "22 docs", update: "4 hours ago" },
                            { title: "👥 New Hire Engineering Onboarding", docs: "11 docs", update: "1 week ago" }
                          ].map(item => (
                            <div key={item.title} style={{
                              padding: 12, borderRadius: 8, background: "rgba(6,8,19,0.5)",
                              border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = C.cyan)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.title}</div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.text3 }}>
                                <span>{item.docs}</span>
                                <span>Updated {item.update}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ═══ NOTION-STYLE FLOATING AI COMMAND OMNIBAR PILL ═══ */}
                    <div style={{ marginTop: "auto", paddingTop: 16 }}>
                      <div
                        onClick={() => handleSynthesizeClick()}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 18px", borderRadius: 99,
                          background: "rgba(11,15,36,0.9)",
                          border: `1px solid ${C.cyan}80`,
                          boxShadow: `0 0 28px ${C.cyan}40, 0 8px 32px rgba(0,0,0,0.7)`,
                          cursor: "pointer",
                          backdropFilter: "blur(16px)",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Sparkles size={15} style={{ color: C.cyanGlow, animation: isAiSynthesizing ? "spin 1.5s linear infinite" : "none" }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                            {isAiSynthesizing ? "Generating live vector synthesis…" : "⌘J Ask CogniSpace AI or type / to generate…"}
                          </span>
                        </div>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%",
                          background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#060813", boxShadow: `0 0 10px ${C.cyan}`
                        }}>
                          <Send size={11} />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ═══ CONTINUOUS INFINITE MARQUEE LOGO STRIP ═══ */}
          <div style={{ maxWidth: 1060, margin: "68px auto 0", overflow: "hidden", position: "relative" }}>
            <p style={{ fontSize: 12, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.14em", color: C.text3, marginBottom: 22 }}>
              Trusted by 98% of the Forbes Cloud 100 & world-class teams at
            </p>
            <div style={{
              display: "flex", width: "100%", overflow: "hidden",
              maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)"
            }}>
              <div className="animate-marquee" style={{ gap: 54, alignItems: "center" }}>
                {["OpenAI", "Figma", "Ramp", "Linear", "Vercel", "Stripe", "Cursor", "Discord", "Toyota", "Snowflake", "OpenAI", "Figma", "Ramp", "Linear", "Vercel", "Stripe", "Cursor", "Discord", "Toyota", "Snowflake"].map((logo, i) => (
                  <span key={i} style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.02em", color: "#94a3b8", cursor: "pointer", transition: "color 0.15s" }}>
                    {logo}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 4. NOTION 3 CORE PILLARS ("AI WHERE YOUR TEAM WORKS") ═══ */}
        <section id="capabilities" style={{ maxWidth: 1140, margin: "104px auto 0", padding: "0 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              AI where your team works
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 12 }}>
              Three superpowers. One single workspace.
            </h2>
            <p style={{ fontSize: 15.5, color: C.text2, maxWidth: 640, margin: "0 auto" }}>
              Replace fragmented wikis, task boards, and disconnected chatbots with a single system of record that thinks alongside you.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>

            {/* Pillar 1: Capture Knowledge */}
            <div style={{
              borderRadius: 20, padding: 32,
              background: "linear-gradient(180deg, #0e142e 0%, #080b18 100%)",
              border: `1px solid ${C.borderCyan}`,
              boxShadow: `0 16px 40px -10px rgba(0,0,0,0.8), 0 0 24px ${C.cyan}15`,
              display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(6,182,212,0.15)", border: `1px solid ${C.cyan}50`, display: "flex", alignItems: "center", justifyContent: "center", color: C.cyanGlow, marginBottom: 20 }}>
                  <FileText size={22} />
                </div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", marginBottom: 6 }}>Pillar 1</div>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>Capture knowledge</h3>
                <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                  Bring everything into one system of record. Documents, RFCs, meeting transcripts, and project roadmaps stay forever synchronized.
                </p>
              </div>
              <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: C.cyanGlow }}>
                <span>Sub-18ms edge sync</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Pillar 2: Find Answers */}
            <div style={{
              borderRadius: 20, padding: 32,
              background: "linear-gradient(180deg, #0e142e 0%, #080b18 100%)",
              border: `1px solid rgba(168,85,247,0.45)`,
              boxShadow: `0 16px 40px -10px rgba(0,0,0,0.8), 0 0 24px rgba(168,85,247,0.15)`,
              display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(168,85,247,0.15)", border: `1px solid ${C.purple}50`, display: "flex", alignItems: "center", justifyContent: "center", color: "#c084fc", marginBottom: 20 }}>
                  <Search size={22} />
                </div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#c084fc", textTransform: "uppercase", marginBottom: 6 }}>Pillar 2</div>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>Find answers</h3>
                <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                  Get answers, instantly — with citations. Query your entire workspace using natural language and receive verified references in milliseconds.
                </p>
              </div>
              <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#c084fc" }}>
                <span>99.4% semantic precision</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Pillar 3: Automate Busywork */}
            <div style={{
              borderRadius: 20, padding: 32,
              background: "linear-gradient(180deg, #0e142e 0%, #080b18 100%)",
              border: `1px solid rgba(79,70,229,0.45)`,
              boxShadow: `0 16px 40px -10px rgba(0,0,0,0.8), 0 0 24px rgba(79,70,229,0.15)`,
              display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(79,70,229,0.15)", border: `1px solid ${C.indigo}50`, display: "flex", alignItems: "center", justifyContent: "center", color: C.indigoLight, marginBottom: 20 }}>
                  <Bot size={22} />
                </div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: C.indigoLight, textTransform: "uppercase", marginBottom: 6 }}>Pillar 3</div>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>Automate busywork</h3>
                <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                  Keep work moving 24/7 with agents. Deploy autonomous assistants that triage customer feedback, update sprint statuses, and generate release summaries.
                </p>
              </div>
              <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: C.indigoLight }}>
                <span>Autonomous execution</span>
                <ArrowRight size={13} />
              </div>
            </div>

          </div>
        </section>

        {/* ═══ 5. NOTION-STYLE "SEE WHAT COGNISPACE CAN DO" WORKFLOW SWITCHER ═══ */}
        <section style={{ maxWidth: 1140, margin: "104px auto 0", padding: "0 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              Automated Workflows
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 12 }}>
              See what CogniSpace can do
            </h2>
            <p style={{ fontSize: 15.5, color: C.text2, marginBottom: 24 }}>
              Click any workflow to see how autonomous agents eliminate manual work across your stack.
            </p>

            {/* Interactive Workflow Pills */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {[
                { id: "triage", label: "🎯 Triage product feedback" },
                { id: "support", label: "💬 Resolve support tickets in Slack" },
                { id: "security", label: "🛡️ Respond to security alerts" },
                { id: "reporting", label: "📊 Automate weekly reporting" },
                { id: "devtools", label: "⚙️ Custom developer tools" }
              ].map(wf => (
                <button
                  key={wf.id}
                  onClick={() => setActiveWorkflow(wf.id as any)}
                  style={{
                    padding: "8px 18px", borderRadius: 99, fontSize: 12.5, fontWeight: 600,
                    border: `1px solid ${activeWorkflow === wf.id ? C.cyan : C.border}`,
                    background: activeWorkflow === wf.id ? "rgba(6,182,212,0.15)" : C.card,
                    color: activeWorkflow === wf.id ? C.cyanGlow : C.text2,
                    cursor: "pointer", transition: "all 0.15s",
                    boxShadow: activeWorkflow === wf.id ? `0 0 16px ${C.cyan}40` : "none"
                  }}
                >
                  {wf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Workflow Interactive Preview Box */}
          <div style={{
            borderRadius: 20, padding: 36,
            background: "linear-gradient(180deg, #0e142e 0%, #080b18 100%)",
            border: `1px solid ${C.borderCyan}`,
            boxShadow: `0 24px 64px -12px rgba(0,0,0,0.8), 0 0 32px ${C.cyan}20`
          }}>
            {activeWorkflow === "triage" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 11, background: "rgba(6,182,212,0.15)", color: C.cyanGlow, padding: "3px 9px", borderRadius: 99, fontWeight: 700 }}>AI Workflow</span>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", margin: "10px 0 12px" }}>Auto-Categorize & Link Product Feedback</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                    Incoming user tickets and Discord suggestions are automatically summarized, tagged with sentiment and severity, and linked directly to your Q4 backlog database table.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.green }}>✓ 98% Categorization Accuracy</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ 2-Way Linear Sync</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.85)", border: `1px solid ${C.border}`, padding: 20, fontSize: 12 }}>
                  <div style={{ color: C.cyanGlow, fontWeight: 700, marginBottom: 8 }}>🤖 Agent Log: Feedback Triaged</div>
                  <div style={{ color: C.text, marginBottom: 4 }}>• Source: Intercom #4912 ("Need CSV export in tables")</div>
                  <div style={{ color: C.green, marginBottom: 4 }}>• Action: Created issue "CSV Export Support" in Sprint Roadmap</div>
                  <div style={{ color: C.text3 }}>• Assignee: Auto-routed to @Kenji T. (Tables Lead)</div>
                </div>
              </div>
            )}

            {activeWorkflow === "support" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 11, background: "rgba(168,85,247,0.15)", color: "#c084fc", padding: "3px 9px", borderRadius: 99, fontWeight: 700 }}>Slack Integration</span>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", margin: "10px 0 12px" }}>Resolve Support Tickets Inside Slack</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                    The CogniSpace Slack bot answers common customer questions using verified handbook citations, creating PR drafts or alerting on-call engineers when escalation is required.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.purple }}>✓ Sub-3s Response Time</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ Zero Hallucinations</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.85)", border: `1px solid ${C.border}`, padding: 20, fontSize: 12 }}>
                  <div style={{ color: "#c084fc", fontWeight: 700, marginBottom: 8 }}><MessageSquare size={13} style={{ display: "inline", marginRight: 4 }} /> #support-triage: CogniSpace Bot</div>
                  <div style={{ color: C.text, marginBottom: 4 }}>"To configure SAML SSO, navigate to Workspace Settings → Security → SAML 2.0."</div>
                  <div style={{ color: C.text3 }}>Citation: Engineering Wiki / SAML Configuration Guide (p. 2)</div>
                </div>
              </div>
            )}

            {activeWorkflow === "security" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 11, background: "rgba(245,158,11,0.15)", color: C.amber, padding: "3px 9px", borderRadius: 99, fontWeight: 700 }}>Security Automation</span>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", margin: "10px 0 12px" }}>Respond to Security Alerts Faster</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                    When AWS CloudTrail or Datadog fires an anomaly alert, CogniSpace correlates the incident with recent git deployments and generates a live post-mortem document.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.amber }}>✓ SOC-2 Type II Compliant</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.green }}>✓ Audit Trail Logged</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.85)", border: `1px solid ${C.border}`, padding: 20, fontSize: 12 }}>
                  <div style={{ color: C.amber, fontWeight: 700, marginBottom: 8 }}><ShieldCheck size={13} style={{ display: "inline", marginRight: 4 }} /> Security Incident Doc Generated</div>
                  <div style={{ color: C.text, marginBottom: 4 }}>• Incident: Spiked token refresh rate on cluster us-east-2</div>
                  <div style={{ color: C.cyanGlow, marginBottom: 4 }}>• Root cause: Commit 8a1f2b (OCC lock retry loop)</div>
                  <div style={{ color: C.green }}>• Status: Hotfix patch dispatched to canary</div>
                </div>
              </div>
            )}

            {activeWorkflow === "reporting" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 11, background: "rgba(16,185,129,0.15)", color: C.green, padding: "3px 9px", borderRadius: 99, fontWeight: 700 }}>Executive Briefs</span>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", margin: "10px 0 12px" }}>Automate Weekly Sprint Reporting</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                    Every Friday at 5 PM, CogniSpace synthesizes completed pull requests, customer launches, and roadmap blockers into a polished executive brief ready for leadership.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.green }}>✓ Saves 4 hrs/engineer</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ Notion Markdown Ready</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.85)", border: `1px solid ${C.border}`, padding: 20, fontSize: 12 }}>
                  <div style={{ color: C.green, fontWeight: 700, marginBottom: 8 }}>📈 Sprint 42 Executive Digest</div>
                  <div style={{ color: C.text, marginBottom: 4 }}>• 28 Pull Requests merged across core backend</div>
                  <div style={{ color: C.text, marginBottom: 4 }}>• 0 P0/P1 incidents recorded during deployment</div>
                  <div style={{ color: C.cyanGlow }}>• Shipped: Collaborative multiplayer cursors v3.0</div>
                </div>
              </div>
            )}

            {activeWorkflow === "devtools" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 11, background: "rgba(79,70,229,0.15)", color: C.indigoLight, padding: "3px 9px", borderRadius: 99, fontWeight: 700 }}>Custom Tooling</span>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", margin: "10px 0 12px" }}>Build Custom Developer Tools</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                    Use the CogniSpace Agent SDK to connect external webhooks, execute code sandboxes, and orchestrate custom AI pipelines tailored to your architecture.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ TypeScript & Python SDK</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.indigoLight }}>✓ Webhook Dispatcher</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "#050714", border: `1px solid ${C.border}`, padding: 18, fontFamily: "monospace", fontSize: 12, color: C.cyanGlow }}>
                  <pre style={{ margin: 0 }}>{`// Custom CogniSpace Tool Agent
import { defineAgent } from "@cognispace/sdk";

export default defineAgent({
  trigger: "github.pr_merged",
  run: async ({ pr, workspace }) => {
    await workspace.updateDoc("Changelog", pr.summary);
  }
});`}</pre>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ═══ 6. "THINK IT. BUILD IT." — NOTION BUILDING BLOCKS SECTION ═══ */}
        <section id="blocks" style={{ maxWidth: 1140, margin: "104px auto 0", padding: "0 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              Modular Building Blocks
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 12 }}>
              Think it. Build it.
            </h2>
            <p style={{ fontSize: 15.5, color: C.text2, maxWidth: 620, margin: "0 auto 28px" }}>
              Every page in CogniSpace is assembled from flexible, dynamic blocks. Drag, transform, or ask AI to re-architect anything instantly.
            </p>

            {/* Block Type Switcher */}
            <div style={{ display: "inline-flex", gap: 8, padding: 4, borderRadius: 99, background: C.card, border: `1px solid ${C.border}` }}>
              {[
                { id: "callout", label: "💡 Callout Boxes", icon: "💡" },
                { id: "todo", label: "☑️ Dynamic To-Dos", icon: "☑️" },
                { id: "code", label: "💻 Code Blocks", icon: "💻" },
                { id: "db", label: "📊 Linked Databases", icon: "📊" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveBlockType(tab.id as any)}
                  style={{
                    padding: "7px 18px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer",
                    background: activeBlockType === tab.id ? C.cyan : "transparent",
                    color: activeBlockType === tab.id ? "#060813" : C.text2,
                    boxShadow: activeBlockType === tab.id ? `0 0 16px ${C.cyan}70` : "none",
                    transition: "all 0.15s"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Block Playground Card */}
          <div style={{
            borderRadius: 20, padding: 36,
            background: "linear-gradient(180deg, #0e142e 0%, #080b18 100%)",
            border: `1px solid ${C.borderCyan}`,
            boxShadow: `0 24px 64px -12px rgba(0,0,0,0.8), 0 0 32px ${C.cyan}20`
          }}>
            {activeBlockType === "callout" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>Callout & Highlight Blocks</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
                    Make critical decisions, API warnings, or sprint goals stand out with customizable emoji icons and tinted accent backdrops.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ 1000+ Emoji selector</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.green }}>✓ Markdown export</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(6,182,212,0.1)", border: `1px solid ${C.cyan}50`, display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>💡</span>
                    <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
                      <strong>Key Insight:</strong> Knowledge indexing runs continuously in the background, updating AI vector memory as soon as you stop typing.
                    </div>
                  </div>
                  <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(245,158,11,0.1)", border: `1px solid ${C.amber}50`, display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
                      <strong>Production Gate:</strong> All branch merges require passing both Playwright end-to-end tests and optimistic concurrency checks.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeBlockType === "todo" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>Interactive To-Do & Task Blocks</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
                    Turn any document into an actionable sprint plan. Check off items with instant multiplayer sound feedback and auto-archival.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ Keyboard shortcuts</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.purple }}>✓ Bi-directional sync</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.8)", border: `1px solid ${C.border}`, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    "Deploy Gemini 2.5 Flash token tunnel",
                    "Conduct team load test at 10,000 req/sec",
                    "Connect Slack webhook for release alerts"
                  ].map((text, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.text }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={11} style={{ color: "#060813", strokeWidth: 3 }} />
                      </div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeBlockType === "code" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>Syntax-Highlighted Code Blocks</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
                    Share snippets across 60+ programming languages with 1-click clipboard copy, line numbers, and AI explain/refactor commands.
                  </p>
                  <button onClick={copySnippet}
                    style={{
                      padding: "8px 16px", borderRadius: 8, background: "rgba(6,182,212,0.15)", border: `1px solid ${C.cyan}60`,
                      color: C.cyanGlow, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                    }}>
                    <Copy size={13} />
                    <span>{copiedCode ? "Copied to Clipboard!" : "Copy Code Snippet"}</span>
                  </button>
                </div>
                <div style={{ borderRadius: 12, background: "#050714", border: `1px solid ${C.border}`, padding: 18, fontFamily: "monospace", fontSize: 12, color: C.cyanGlow, overflowX: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: C.text3, fontSize: 10.5, marginBottom: 8 }}>
                    <span>TypeScript</span>
                    <span>syncEngine.ts</span>
                  </div>
                  <pre style={{ margin: 0 }}>{`// Sub-18ms Edge Concurrency
const sync = new DeltaSyncEngine({
  debounceDelayMs: 800,
  optimisticLocking: true,
  aiStreaming: "gemini-2.5-flash"
});
await sync.dispatchPatch(activeDoc.id);`}</pre>
                </div>
              </div>
            )}

            {activeBlockType === "db" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>Linked Notion Databases</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
                    Filter, sort, and group the same dataset as a Table, Kanban Board, Calendar, or Timeline view anywhere inside your documents.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ Multi-select properties</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.green }}>✓ Formula rollups</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.8)", border: `1px solid ${C.border}`, padding: 18 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, background: "rgba(6,182,212,0.15)", color: C.cyanGlow, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>Status: In Progress</span>
                    <span style={{ fontSize: 11, background: "rgba(168,85,247,0.15)", color: "#c084fc", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>Sprint: Q4 Milestone</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, marginBottom: 6 }}>Database Rollup: 87% Complete</div>
                  <div style={{ width: "100%", height: 6, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{ width: "87%", height: "100%", background: `linear-gradient(90deg, ${C.cyan}, ${C.indigo})` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ 7. NOTION-STYLE TEAM USE CASE SWITCHER ("Every team, side-by-side") ═══ */}
        <section id="teams" style={{ maxWidth: 1140, margin: "104px auto 0", padding: "0 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              Unified Team Spaces
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 10 }}>
              Every team, side by side.
            </h2>
            <p style={{ fontSize: 15.5, color: C.text2, marginBottom: 26 }}>
              Connect engineering, product, design, and operations in one shared brain.
            </p>

            {/* Team Pills */}
            <div style={{ display: "inline-flex", gap: 8, padding: 4, borderRadius: 99, background: C.card, border: `1px solid ${C.border}` }}>
              {[
                { id: "eng", label: "🛠️ Engineering" },
                { id: "prod", label: "🚀 Product" },
                { id: "design", label: "🎨 Design" },
                { id: "wiki", label: "📚 Operations & Wiki" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTeamTab(tab.id as any)}
                  style={{
                    padding: "7px 18px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer",
                    background: activeTeamTab === tab.id ? C.cyan : "transparent",
                    color: activeTeamTab === tab.id ? "#060813" : C.text2,
                    boxShadow: activeTeamTab === tab.id ? `0 0 16px ${C.cyan}70` : "none",
                    transition: "all 0.15s"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Team Showcase Card */}
          <div style={{
            borderRadius: 20, padding: 36,
            background: "linear-gradient(180deg, #0e142e 0%, #080b18 100%)",
            border: `1px solid ${C.borderCyan}`,
            boxShadow: `0 24px 64px -12px rgba(0,0,0,0.8), 0 0 32px ${C.cyan}15`
          }}>
            {activeTeamTab === "eng" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", marginBottom: 6 }}>Engineering Hub</div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>Ship faster with live sprint sync</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                    Track issues, link PRDs, and stream code transformations directly inside documentation. Built-in git commit linking and zero merge write collisions.
                  </p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.green }}>✓ Sub-millisecond OCC checks</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ REST & SSE endpoints</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.85)", border: `1px solid ${C.border}`, padding: 20, fontFamily: "monospace", fontSize: 12, color: C.cyanGlow }}>
                  <pre style={{ margin: 0 }}>{`// Real-time delta sync engine
const sync = new DeltaSyncEngine({
  debounceDelayMs: 800,
  optimisticLocking: true,
  aiStreaming: "gemini-2.5-flash"
});
await sync.dispatchPatch(activeDoc.id);`}</pre>
                </div>
              </div>
            )}

            {activeTeamTab === "prod" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", marginBottom: 6 }}>Product Management</div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>PRDs that write and organize themselves</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                    Auto-synthesize user feedback into structured roadmaps. Connect tasks, timelines, and milestones with interactive database filters.
                  </p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.amber }}>▲ Gantt & Kanban views</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ AI User Stories</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.85)", border: `1px solid ${C.border}`, padding: 20, fontSize: 12, color: C.text }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: C.cyanGlow }}>📋 Roadmap: Q4 Release</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, color: C.text2 }}>
                    <div>• User Session Auth: <span style={{ color: C.green }}>Done</span></div>
                    <div>• Inline AI Generation: <span style={{ color: C.cyanGlow }}>Testing</span></div>
                    <div>• Enterprise SAML: <span style={{ color: C.purple }}>Planned</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTeamTab === "design" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", marginBottom: 6 }}>Design Systems</div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>Visual specs and design tokens in sync</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                    Embed Figma prototypes directly inside documentation. Discuss design iterations with multiplayer presence and live comment threads.
                  </p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.magenta }}>✓ Figma Live Embeds</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ Design Tokens</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.85)", border: `1px solid ${C.border}`, padding: 24, textAlign: "center" }}>
                  <div style={{ display: "inline-flex", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", color: "#060813", fontWeight: 800 }}>#06</div>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: C.indigo, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800 }}>#4F</div>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: C.magenta, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800 }}>#EC</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 12 }}>Token spectrum: Electric Cyan, Indigo & Magenta</div>
                </div>
              </div>
            )}

            {activeTeamTab === "wiki" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", marginBottom: 6 }}>Knowledge Operations</div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>A collective second brain that never forgets</h3>
                  <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                    Instant semantic search across every document and decision ever made. Stop repeating questions in Slack when the answer is indexed.
                  </p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.cyanGlow }}>✓ Sub-5ms Vector Lookup</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.green }}>✓ 100% Encrypted</span>
                  </div>
                </div>
                <div style={{ borderRadius: 12, background: "rgba(6,8,19,0.85)", border: `1px solid ${C.border}`, padding: 20, fontSize: 12 }}>
                  <div style={{ color: C.cyanGlow, fontWeight: 600, marginBottom: 6 }}>🔍 ⌘K Query: "Deployment policy"</div>
                  <div style={{ color: C.text2 }}>Found in <i>Engineering / Deployment Protocols</i> (match: 99.4%)</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ 8. FAMOUS QUOTE BANNER (NOTION-STYLE INSPIRATION) ═══ */}
        <section style={{ maxWidth: 880, margin: "96px auto 0", padding: "0 2rem", textAlign: "center" }}>
          <div style={{
            padding: "48px 36px", borderRadius: 24,
            background: "rgba(11,15,36,0.5)", border: `1px solid ${C.border}`,
            position: "relative", overflow: "hidden"
          }}>
            <div style={{ fontSize: 32, color: C.cyanGlow, opacity: 0.3, position: "absolute", top: 16, left: 24, fontFamily: "serif" }}>“</div>
            <p style={{ fontSize: "clamp(18px, 2.2vw, 24px)", fontWeight: 700, fontStyle: "italic", color: "#ffffff", lineHeight: 1.5, margin: "0 0 16px" }}>
              "We shape our tools, and thereafter our tools shape us."
            </p>
            <div style={{ fontSize: 13, color: C.cyanGlow, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              — Marshall McLuhan
            </div>
          </div>
        </section>

        {/* ═══ 9. NOTION-STYLE INTEGRATIONS SECTION ═══ */}
        <section style={{ maxWidth: 1140, margin: "104px auto 0", padding: "0 2rem", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
            Connected Ecosystem
          </div>
          <h2 style={{ fontSize: "clamp(26px, 3.6vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 12 }}>
            Connects seamlessly with your stack
          </h2>
          <p style={{ fontSize: 15.5, color: C.text2, maxWidth: 600, margin: "0 auto 36px" }}>
            Embed live Figma prototypes, sync GitHub pull requests, trigger Slack alerts, and import from Notion in 1 click.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { name: "Notion Import", desc: "1-Click workspace import with zero data loss", badge: "Native" },
              { name: "GitHub", desc: "Link commits, PRs & issues to docs", badge: "Verified" },
              { name: "Figma", desc: "Live prototype embeds with interactive frames", badge: "Official" },
              { name: "Slack", desc: "Automated daily digests & AI summary pings", badge: "Webhook" },
              { name: "Linear", desc: "Two-way issue & sprint synchronization", badge: "Sync" },
              { name: "Google Drive", desc: "Semantic search across Google Docs & Sheets", badge: "Search" },
              { name: "Jira Software", desc: "Epic tracking & backlink references", badge: "Enterprise" },
              { name: "VS Code", desc: "In-editor documentation lookup & copilot", badge: "Extension" }
            ].map((app, i) => (
              <div key={i} style={{
                borderRadius: 14, padding: 20, background: C.card, border: `1px solid ${C.border}`,
                textAlign: "left", transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{app.name}</span>
                  <span style={{ fontSize: 10, background: "rgba(6,182,212,0.12)", color: C.cyanGlow, padding: "2px 7px", borderRadius: 99 }}>{app.badge}</span>
                </div>
                <p style={{ fontSize: 12, color: C.text3, margin: 0, lineHeight: 1.5 }}>{app.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 10. REAL CUSTOMER TESTIMONIALS (NOTION QUOTES) ═══ */}
        <section style={{ maxWidth: 1140, margin: "104px auto 0", padding: "0 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              Wall of Love
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 8 }}>
              Trusted by teams that ship
            </h2>
            <p style={{ fontSize: 15, color: C.text2 }}>Hear how modern engineering leaders scale with CogniSpace.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              {
                stars: 5,
                quote: "Using the most AI-native tools like CogniSpace is an important competitive advantage for us to stay small while doing a lot.",
                name: "Michael Truell",
                role: "Co-Founder & CEO @ Cursor",
                avatar: "from-pink-500 to-rose-500"
              },
              {
                stars: 5,
                quote: "CogniSpace's thoughtful design speeds up collaboration and decisions so we can deliver impact to our customers faster.",
                name: "Renee Solorzano",
                role: "Sr. Director of Product Design",
                avatar: "from-cyan-400 to-blue-500"
              },
              {
                stars: 5,
                quote: "Custom Agents help our team go beyond doing work with AI to building AI tools that do the work for them.",
                name: "Ben Levick",
                role: "Head of Operations & Internal AI",
                avatar: "from-indigo-500 to-purple-600"
              }
            ].map((t, i) => (
              <div key={i} style={{
                borderRadius: 18, padding: 24,
                background: C.card, border: `1px solid ${C.border}`,
                display: "flex", flexDirection: "column", gap: 14,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.cyan)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                <div style={{ display: "flex", gap: 2 }}>
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.text2, flex: 1, margin: 0 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.avatar} flex items-center justify-center text-[11px] font-bold text-white`}>
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: C.text3 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 11. PRICING MATRIX WITH ANNUAL/MONTHLY TOGGLE ═══ */}
        <section id="pricing" style={{ maxWidth: 1060, margin: "104px auto 0", padding: "0 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              Simple, Transparent Pricing
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 8 }}>
              Choose your plan
            </h2>
            <p style={{ fontSize: 15, color: C.text2, marginBottom: 22 }}>Transparent tiers for individuals and fast-growing companies.</p>

            {/* Billing Switcher Toggle */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: 4, borderRadius: 99, background: C.card, border: `1px solid ${C.border}` }}>
              <button
                onClick={() => setIsAnnual(false)}
                style={{
                  padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                  background: !isAnnual ? "rgba(255,255,255,0.08)" : "transparent",
                  color: !isAnnual ? C.text : C.text3, transition: "all 0.15s"
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                style={{
                  padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                  background: isAnnual ? C.cyan : "transparent",
                  color: isAnnual ? "#060813" : C.text3, transition: "all 0.15s"
                }}
              >
                Annually (Save 20%)
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "stretch" }}>

            {/* Free Tier */}
            <div style={{
              borderRadius: 20, padding: "32px 28px",
              background: C.card, border: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Free</h3>
                <p style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>For individual creators</p>
                <div style={{ fontSize: 44, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.04em", marginBottom: 24 }}>
                  $0
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: C.text2, marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Unlimited personal notes</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Basic AI suggestions</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Single-device sync</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Notion document import</div>
                </div>
              </div>
              <button onClick={onGetStarted}
                style={{
                  width: "100%", padding: "12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
                  fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer"
                }}>
                Get Started Free
              </button>
            </div>

            {/* Pro Workspace Tier (Featured - glowing cyan border & badge) */}
            <div style={{
              borderRadius: 20, padding: "32px 28px", position: "relative",
              background: "linear-gradient(180deg, #0e1536 0%, #090e24 100%)",
              border: `2px solid ${C.cyan}`,
              boxShadow: `0 0 36px ${C.cyan}40, 0 16px 40px rgba(0,0,0,0.7)`,
              display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
              <div style={{
                position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                background: C.cyan, color: "#060813", fontSize: 10.5, fontWeight: 800,
                padding: "3px 14px", borderRadius: 99, letterSpacing: "0.04em", textTransform: "uppercase"
              }}>
                Most Popular
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.cyanGlow, marginBottom: 4 }}>Pro Workspace</h3>
                <p style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>For power creators & growing teams</p>
                <div style={{ fontSize: 44, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.04em", marginBottom: 24 }}>
                  {isAnnual ? "$15" : "$19"} <span style={{ fontSize: 13, fontWeight: 500, color: C.text3 }}>/month</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: C.text, marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Unlimited documents & trees</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Real-time streaming AI Copilot</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Multi-device instantaneous sync</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Collaborative live cursors</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Version history with OCC rollback</div>
                </div>
              </div>

              <button onClick={onGetStarted}
                style={{
                  width: "100%", padding: "12px", borderRadius: 10,
                  background: C.cyan, border: "none",
                  fontSize: 13, fontWeight: 800, color: "#060813",
                  cursor: "pointer", boxShadow: `0 0 20px ${C.cyan}80`
                }}>
                Try For Free
              </button>
            </div>

            {/* Enterprise Tier */}
            <div style={{
              borderRadius: 20, padding: "32px 28px",
              background: C.card, border: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Enterprise</h3>
                <p style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>Custom security & dedicated SLA</p>
                <div style={{ fontSize: 44, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.04em", marginBottom: 24 }}>
                  Custom
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: C.text2, marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Dedicated private AI instances</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> SAML, SSO & SCIM directory sync</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> 99.99% enterprise SLA guarantee</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} style={{ color: C.cyanGlow }} /> Audit logs & data residency controls</div>
                </div>
              </div>
              <button onClick={onGetStarted}
                style={{
                  width: "100%", padding: "12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
                  fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer"
                }}>
                Request Enterprise Demo
              </button>
            </div>

          </div>
        </section>

        {/* ═══ 12. INTERACTIVE FAQ ACCORDION ═══ */}
        <section style={{ maxWidth: 840, margin: "104px auto 0", padding: "0 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: C.cyanGlow, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              Common Questions
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 8 }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: 15, color: C.text2 }}>Everything you need to know about CogniSpace.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                q: "How does CogniSpace compare to Notion and Linear?",
                a: "CogniSpace blends the modular document flexibility of Notion with the sub-millisecond velocity of Linear. It includes a native AI Copilot powered by Gemini 2.5 Flash, an 800ms debounce loop with optimistic concurrency control, and collaborative multiplayer cursors out of the box."
              },
              {
                q: "How does the AI assistant access my workspace knowledge?",
                a: "CogniSpace creates real-time vector embeddings of your team's pages and databases. When you query with ⌘J, the AI retrieves relevant citations across documents with sub-18ms latency while respecting role-based access permissions."
              },
              {
                q: "Can I import existing Notion databases and Markdown files?",
                a: "Yes! CogniSpace supports 1-click imports from Notion (.zip exports) and standard Markdown repositories with zero formatting loss."
              },
              {
                q: "Is our team's data encrypted and private?",
                a: "All data is encrypted in transit via TLS 1.3 and at rest with AES-256. Your documents are never used to train foundational AI models."
              }
            ].map((faq, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 14, overflow: "hidden",
                  background: C.card, border: `1px solid ${openFaqIndex === i ? C.borderCyan : C.border}`,
                  transition: "all 0.2s"
                }}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  style={{
                    width: "100%", padding: "18px 22px", background: "none", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", textAlign: "left", fontSize: 15, fontWeight: 700, color: C.text
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: C.cyanGlow,
                      transform: openFaqIndex === i ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s"
                    }}
                  />
                </button>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 22px 20px", fontSize: 13.5, lineHeight: 1.65, color: C.text2 }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 13. BOTTOM CONVERSION CTA BANNER ═══ */}
        <section style={{ maxWidth: 1060, margin: "104px auto 0", padding: "0 2rem" }}>
          <div style={{
            borderRadius: 24, padding: "52px 44px",
            background: "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(16,22,51,0.96) 100%)",
            border: `1px solid ${C.cyan}60`,
            boxShadow: `0 0 50px ${C.cyan}30, 0 24px 60px rgba(0,0,0,0.8)`,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24
          }}>
            <div>
              <h2 style={{ fontSize: "clamp(24px, 3.2vw, 38px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", marginBottom: 8 }}>
                Where teams and agents think together.
              </h2>
              <p style={{ fontSize: 14.5, color: C.text2, margin: 0 }}>
                Join over 25,000+ product teams leveraging CogniSpace's AI-native workspace.
              </p>
            </div>
            <button onClick={onGetStarted}
              style={{
                padding: "14px 34px", borderRadius: 99,
                background: C.cyan, color: "#060813",
                fontSize: 14.5, fontWeight: 800, border: "none",
                cursor: "pointer", boxShadow: `0 0 26px ${C.cyan}90`,
                transition: "all 0.15s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.cyanGlow)}
              onMouseLeave={e => (e.currentTarget.style.background = C.cyan)}>
              Get CogniSpace free →
            </button>
          </div>
        </section>

      </main>

      {/* ═══ 14. MODERN MULTI-COLUMN FOOTER ═══ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, marginTop: 104, padding: "60px 2rem 40px", background: "#050713" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg, ${C.cyan}, ${C.indigo})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 900, color: "white" }}>CS</div>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>CogniSpace</span>
              </div>
              <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.6, maxWidth: 280 }}>
                AI-native workspace, docs, and knowledge hub built for hyper-productive individuals and teams.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: ["Docs & Wikis", "Sprint Databases", "AI Custom Agents", "Integrations", "Pricing"]
              },
              {
                title: "Solutions",
                links: ["Engineering", "Product Management", "Design Systems", "Enterprise Knowledge"]
              },
              {
                title: "Resources & Legal",
                links: ["API Documentation", "Security & SOC-2", "Status", "Privacy Policy", "Terms of Service"]
              }
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize: 12.5, color: C.text3, textDecoration: "none" }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.cyanGlow)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.text3)}>
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: 24, borderTop: `1px solid ${C.border}`,
            fontSize: 12, color: C.text3, flexWrap: "wrap", gap: 12
          }}>
            <span>© 2026 CogniSpace, Inc. All rights reserved.</span>
            <div style={{ display: "flex", gap: 20 }}>
              <span style={{ color: C.cyanGlow }}>⚡ Powered by Gemini 2.5 Flash</span>
              <span>Sub-18ms Edge Concurrency</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
