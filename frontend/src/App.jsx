import React, { useState, useEffect, useRef } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

/* ─── PALETTE ────────────────────────────────────────────────────────────────
   Void       #060A14   deepest navy-black
   Abyss      #0C1220   page background
   Surface    #111827   card/panel surface
   Panel      #1A2234   elevated surface
   Rim        #243047   borders, dividers
   Mist       #4A5E7A   subdued text
   Silver     #8BA3C2   secondary text
   Platinum   #E2EAF5   primary text
   Cyan       #00D4FF   signature accent
   CyanDim    #00D4FF18 accent wash
   Emerald    #10D98A   safe/success
   Amber      #F59E0B   warning
   Crimson    #F04060   danger
────────────────────────────────────────────────────────────────────────────── */

const C = {
  void: "#060A14",
  abyss: "#0C1220",
  surface: "#111827",
  panel: "#1A2234",
  rim: "#243047",
  mist: "#4A5E7A",
  silver: "#8BA3C2",
  platinum: "#E2EAF5",
  cyan: "#00D4FF",
  cyanDim: "#00D4FF14",
  emerald: "#10D98A",
  amber: "#F59E0B",
  crimson: "#F04060",
};

const questions = [
  {
    id: "https",
    num: "01",
    label: "Connection Security",
    hint: "Check for the padlock icon at the left of your browser's address bar.",
    options: [
      { value: "-1", label: "Padlock visible", note: "Encrypted connection", tier: "safe" },
      { value: "0",  label: "No padlock", note: '"Not Secure" label shown', tier: "warn" },
      { value: "1",  label: "Browser warning", note: "Certificate error page", tier: "danger" },
    ],
  },
  {
    id: "prefix",
    num: "02",
    label: "Domain Hyphens",
    hint: "Read the actual URL — does it contain hyphens between words?",
    options: [
      { value: "-1", label: "No hyphens", note: "e.g. paypal.com", tier: "safe" },
      { value: "1",  label: "Hyphens present", note: "e.g. secure-login-paypal.com", tier: "danger" },
    ],
  },
  {
    id: "anchor",
    num: "03",
    label: "Link Destinations",
    hint: "Hover over buttons and nav links — check where they actually point.",
    options: [
      { value: "-1", label: "Stay on site", note: "Consistent domain throughout", tier: "safe" },
      { value: "0",  label: "Some leave", note: "A few links exit the domain", tier: "warn" },
      { value: "1",  label: "Mostly external", note: "Links lead to random domains", tier: "danger" },
    ],
  },
  {
    id: "subdomain",
    num: "04",
    label: "Domain Complexity",
    hint: "Count dot-separated segments in the address before .com / .net etc.",
    options: [
      { value: "-1", label: "Simple", note: "e.g. google.com", tier: "safe" },
      { value: "0",  label: "Moderate", note: "e.g. accounts.google.com", tier: "warn" },
      { value: "1",  label: "Complex", note: "e.g. secure.login.verify.site", tier: "danger" },
    ],
  },
];

const tierColor = { safe: C.emerald, warn: C.amber, danger: C.crimson };
const tierIcon  = { safe: "✓", warn: "!", danger: "✕" };

const stats = [
  { value: "1.8M+", label: "Phishing sites detected in 2024", icon: "⚠" },
  { value: "97.3%", label: "Model accuracy on test set", icon: "◎" },
  { value: "<1s",   label: "Time to get your verdict", icon: "◷" },
  { value: "4",     label: "Signals analyzed per scan", icon: "◈" },
];

/* ── OPTION CARD ─────────────────────────────────────────────────────────── */
function OptionCard({ opt, selected, onClick }) {
  const col = tierColor[opt.tier];
  const active = selected === opt.value;
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onClick(opt.value)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: "1 1 130px",
        minWidth: 0,
        background: active ? `${col}12` : hover ? "#1E2D45" : C.panel,
        border: `1px solid ${active ? col : hover ? C.rim : "#1E2A3D"}`,
        borderRadius: "10px",
        padding: "16px 14px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s ease",
        outline: "none",
        position: "relative",
      }}
    >
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        background: active ? `${col}22` : "#0F1B2B",
        marginBottom: "10px",
        fontSize: "12px",
        fontWeight: 700,
        color: active ? col : C.mist,
        fontFamily: "monospace",
        transition: "all 0.18s ease",
      }}>
        {tierIcon[opt.tier]}
      </div>
      <div style={{
        fontSize: "13px",
        fontWeight: 600,
        color: active ? col : C.platinum,
        marginBottom: "4px",
        lineHeight: 1.3,
      }}>
        {opt.label}
      </div>
      <div style={{ fontSize: "11px", color: C.mist, lineHeight: 1.5 }}>{opt.note}</div>
      {active && (
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          width: "6px", height: "6px", borderRadius: "50%", background: col,
        }} />
      )}
    </button>
  );
}

/* ── RESULT PANEL ─────────────────────────────────────────────────────────── */
function ResultPanel({ result }) {
  const [bar, setBar] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBar(result.risk_score), 80);
    return () => clearTimeout(t);
  }, [result]);

  const s = result.risk_score;
  const col = s > 60 ? C.crimson : s > 35 ? C.amber : C.emerald;
  const label = s > 60 ? "HIGH RISK" : s > 35 ? "SUSPICIOUS" : "LOW RISK";
  const advice = s > 60
    ? "Close this tab immediately. Do not enter any credentials, personal data, or payment details on this site."
    : s > 35
    ? "Proceed with caution. Verify the site through official channels before entering sensitive information."
    : "This site shows low phishing indicators. Standard safe browsing practices still apply.";

  return (
    <div style={{ marginTop: "24px", animation: "revealUp 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{
        border: `1px solid ${col}40`,
        borderRadius: "14px",
        overflow: "hidden",
        background: C.surface,
      }}>
        {/* Header */}
        <div style={{
          background: `${col}0D`,
          borderBottom: `1px solid ${col}25`,
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.16em", color: C.mist, marginBottom: "6px", fontFamily: "monospace" }}>ANALYSIS COMPLETE</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: col, boxShadow: `0 0 8px ${col}88`,
              }} />
              <span style={{ fontSize: "28px", fontWeight: 800, color: col, letterSpacing: "-0.02em" }}>{label}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.16em", color: C.mist, marginBottom: "6px", fontFamily: "monospace" }}>RISK SCORE</div>
            <div style={{ fontSize: "38px", fontWeight: 900, color: C.platinum, letterSpacing: "-0.04em", fontFamily: "monospace", lineHeight: 1 }}>
              {s}<span style={{ fontSize: "18px", color: C.silver, fontWeight: 400 }}>%</span>
            </div>
          </div>
        </div>

        {/* Bar */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ height: "4px", background: "#0C1525", borderRadius: "99px", overflow: "hidden", marginBottom: "8px" }}>
            <div style={{
              height: "100%",
              width: `${bar}%`,
              background: col,
              borderRadius: "99px",
              transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: C.mist, fontFamily: "monospace", letterSpacing: "0.1em" }}>
            <span>SAFE</span><span>SUSPICIOUS</span><span>PHISHING</span>
          </div>
        </div>

        {/* Advice */}
        <div style={{ padding: "16px 24px 20px" }}>
          <p style={{ fontSize: "13px", color: C.silver, lineHeight: 1.7, margin: 0 }}>
            <span style={{ color: col, fontWeight: 700 }}>Recommendation: </span>{advice}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── SCANNING ANIMATION ──────────────────────────────────────────────────── */
function Scanning() {
  const [step, setStep] = useState(0);
  const steps = ["Parsing URL structure", "Checking domain signals", "Running classifier", "Computing risk score"];
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: "center", padding: "28px 0 8px" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginBottom: "16px" }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width: "4px", height: "4px", borderRadius: "50%",
            background: C.cyan,
            opacity: i === step % 5 || i === (step+1) % 5 ? 1 : 0.15,
            transition: "opacity 0.25s",
          }} />
        ))}
      </div>
      <p style={{ fontSize: "11px", color: C.silver, fontFamily: "monospace", letterSpacing: "0.1em" }}>{steps[step]}…</p>
    </div>
  );
}

/* ── AUTH VIEW ────────────────────────────────────────────────────────────── */
function AuthView({ onAuthSuccess }) {
  const [authType, setAuthType] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        await response.json();
        onAuthSuccess();
      } catch {
        alert("Google authentication failed. Please try again.");
      }
    },
    onError: () => alert("Google sign-in was cancelled or failed."),
  });

  const handleFacebookMock = () => {
    const width = 500, height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open("https://www.facebook.com/login.php", "Facebook Login", `width=${width},height=${height},top=${top},left=${left}`);
    const t = setInterval(() => {
      if (!popup || popup.closed) { clearInterval(t); onAuthSuccess(); }
    }, 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Please complete all fields.");
    onAuthSuccess();
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      background: C.abyss,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid lines */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(${C.rim}18 1px, transparent 1px), linear-gradient(90deg, ${C.rim}18 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />
      {/* Cyan glow orb */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "300px", borderRadius: "50%",
        background: `radial-gradient(ellipse, ${C.cyan}08 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: C.surface, border: `1px solid ${C.rim}`,
            borderRadius: "12px", padding: "10px 18px",
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "7px",
              background: C.cyan, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "14px",
            }}>🛡</div>
            <span style={{ fontSize: "17px", fontWeight: 800, color: C.platinum, letterSpacing: "-0.02em" }}>
              PhishGuard<span style={{ color: C.cyan }}>AI</span>
            </span>
          </div>
        </div>

        <div style={{
          background: C.surface,
          border: `1px solid ${C.rim}`,
          borderRadius: "20px",
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: C.platinum, letterSpacing: "-0.02em", textAlign: "center", marginBottom: "4px" }}>
            {authType === "login" ? "Sign in to your account" : "Create an account"}
          </h2>
          <p style={{ fontSize: "13px", color: C.silver, textAlign: "center", marginBottom: "28px" }}>
            Protect yourself from phishing attacks
          </p>

          {/* Social buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            <button
              type="button"
              onClick={() => loginWithGoogle()}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "10px",
                background: "transparent", border: `1px solid ${C.rim}`,
                color: C.platinum, fontSize: "13px", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "10px",
                transition: "all 0.18s", fontFamily: "inherit",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.panel; e.currentTarget.style.borderColor = C.silver; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.rim; }}
            >
              <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.2 10.2v3.6h6.8c-.3 1.6-1.8 4.7-6.8 4.7-4.3 0-7.8-3.6-7.8-8s3.5-8 7.8-8c2.5 0 4.1 1 5 1.9l2.8-2.8C18.2 2 15.5 1 12.2 1 6 1 1 6 1 12.2s5 11.2 11.2 11.2c5.8 0 11.2-4.1 11.2-11.2 0-.8-.1-1.4-.2-2H12.2z"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={handleFacebookMock}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "10px",
                background: "transparent", border: `1px solid ${C.rim}`,
                color: C.platinum, fontSize: "13px", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "10px",
                transition: "all 0.18s", fontFamily: "inherit",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.panel; e.currentTarget.style.borderColor = C.silver; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.rim; }}
            >
              <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", background: C.rim }} />
            <span style={{ fontSize: "11px", color: C.mist, fontFamily: "monospace", letterSpacing: "0.1em" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: C.rim }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label htmlFor="auth-email" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.silver, marginBottom: "7px" }}>
                Email address
              </label>
              <input
                id="auth-email" name="email" type="email"
                autoComplete="username" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%", background: C.abyss,
                  border: `1px solid ${C.rim}`, borderRadius: "9px",
                  padding: "11px 14px", fontSize: "13px",
                  color: C.platinum, outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.18s", fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = C.cyan}
                onBlur={e => e.target.style.borderColor = C.rim}
              />
            </div>
            <div>
              <label htmlFor="auth-password" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.silver, marginBottom: "7px" }}>
                Password
              </label>
              <input
                id="auth-password" name="password" type="password"
                autoComplete={authType === "login" ? "current-password" : "new-password"} required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: "100%", background: C.abyss,
                  border: `1px solid ${C.rim}`, borderRadius: "9px",
                  padding: "11px 14px", fontSize: "13px",
                  color: C.platinum, outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.18s", fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = C.cyan}
                onBlur={e => e.target.style.borderColor = C.rim}
              />
            </div>
            <button
              type="submit"
              style={{
                width: "100%", padding: "13px", borderRadius: "10px",
                background: C.cyan, color: C.void, border: "none",
                fontSize: "14px", fontWeight: 700, cursor: "pointer",
                marginTop: "6px", letterSpacing: "-0.01em", fontFamily: "inherit",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {authType === "login" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <p style={{ marginTop: "22px", fontSize: "13px", color: C.mist, textAlign: "center" }}>
            {authType === "login" ? (
              <>Don't have an account? <span onClick={() => setAuthType("signup")} style={{ color: C.cyan, cursor: "pointer", fontWeight: 600 }}>Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => setAuthType("login")} style={{ color: C.cyan, cursor: "pointer", fontWeight: 600 }}>Sign in</span></>
            )}
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: C.mist }}>
          Protected by industry-standard encryption. No data stored.
        </p>
      </div>
    </div>
  );
}

/* ── MAIN APP ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scanMode, setScanMode] = useState("url");
  const [urlText, setUrlText] = useState("");
  const [formData, setFormData] = useState({ https: "-1", prefix: "-1", anchor: "-1", subdomain: "-1" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const scanRef = useRef(null);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const handleChange = (id, val) => { setFormData(p => ({ ...p, [id]: val })); setResult(null); setError(null); };
  const handleModeSwitch = (mode) => { setScanMode(mode); setResult(null); setError(null); };

  const analyzeRisk = async () => {
    setLoading(true); setError(null); setResult(null);
    let payload = { mode: scanMode };
    if (scanMode === "url") {
      if (!urlText.trim()) { setLoading(false); return alert("Please enter a URL first."); }
      payload.url = urlText.trim();
    } else {
      payload = { mode: "manual", ...formData };
    }
    try {
      const res = await fetch("https://phishguard-o397.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("server error");
      const data = await res.json();
      if (data.status === "success") { setResult(data); }
      else throw new Error(data.error);
    } catch {
      setError("Cannot reach the backend. Ensure the server is online.");
    }
    setLoading(false);
  };

  const scrollToScan = () => scanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId="982892849647-aht8e965odd60j5l5dd4udrncgl22gkj.apps.googleusercontent.com">
        <AuthView onAuthSuccess={() => setIsAuthenticated(true)} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${C.abyss}; font-family: 'Inter', -apple-system, sans-serif; color: ${C.platinum}; }
        ::selection { background: ${C.cyan}30; color: ${C.cyan}; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes revealUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes scanline { 0%,100% { transform: scaleX(0.3) translateX(-200%); } 50% { transform: scaleX(1) translateX(0); } }
        .ticker-wrap { overflow: hidden; width: 100%; }
        .ticker-inner { display: flex; white-space: nowrap; animation: ticker 32s linear infinite; }
        .mode-tab {
          flex: 1; text-align: center; padding: 11px 8px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; border: none; cursor: pointer;
          transition: all 0.25s; font-family: 'JetBrains Mono', monospace;
          background: transparent;
        }
        input:focus { border-color: ${C.cyan} !important; outline: none; }
        .cta-btn {
          background: ${C.cyan}; color: ${C.void}; border: none;
          cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 800;
          transition: all 0.18s; letter-spacing: -0.01em;
        }
        .cta-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .cta-btn:active { transform: translateY(0); opacity: 0.94; }
        .ghost-btn {
          background: transparent; color: ${C.silver};
          border: 1px solid ${C.rim}; cursor: pointer;
          font-family: 'Inter', sans-serif; font-weight: 600;
          transition: all 0.18s;
        }
        .ghost-btn:hover { border-color: ${C.silver}; color: ${C.platinum}; background: ${C.panel}; }
        .mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: `${C.abyss}F0`,
        borderBottom: `1px solid ${C.rim}`,
        backdropFilter: "blur(20px)",
        padding: "0 clamp(20px, 5vw, 80px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", height: "60px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "7px",
            background: C.cyan, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "14px",
          }}>🛡</div>
          <span style={{ fontSize: "15px", fontWeight: 800, color: C.platinum, letterSpacing: "-0.02em" }}>
            PhishGuard<span style={{ color: C.cyan }}>AI</span>
          </span>
          <span style={{
            marginLeft: "6px", fontSize: "9px", fontFamily: "monospace",
            color: C.cyan, background: `${C.cyan}18`,
            border: `1px solid ${C.cyan}30`,
            padding: "2px 8px", borderRadius: "99px", letterSpacing: "0.1em",
          }}>v2.5</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="ghost-btn"
            onClick={() => setIsAuthenticated(false)}
            style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px" }}
          >Sign out</button>
          <button
            className="cta-btn"
            onClick={scrollToScan}
            style={{ padding: "8px 18px", borderRadius: "8px", fontSize: "13px" }}
          >Run a scan →</button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{
        padding: "clamp(72px, 11vw, 130px) clamp(20px, 5vw, 80px) clamp(60px, 8vw, 100px)",
        maxWidth: "1100px", margin: "0 auto",
        opacity: mounted ? 1 : 0,
        animation: mounted ? "fadeUp 0.65s ease both" : "none",
        position: "relative",
      }}>
        {/* Subtle background grid */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(${C.rim}10 1px, transparent 1px), linear-gradient(90deg, ${C.rim}10 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: `${C.cyan}0F`,
            border: `1px solid ${C.cyan}30`,
            borderRadius: "99px", padding: "6px 16px", marginBottom: "32px",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: C.cyan, display: "inline-block",
              animation: "pulse 2s ease infinite",
            }} />
            <span style={{ fontSize: "11px", letterSpacing: "0.14em", color: C.cyan, fontWeight: 700, fontFamily: "monospace" }}>
              ACTIVE PROTECTION · ML POWERED
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(40px, 7vw, 74px)",
            fontWeight: 900,
            color: C.platinum,
            letterSpacing: "-0.04em",
            lineHeight: 1.04,
            maxWidth: "780px",
            marginBottom: "24px",
          }}>
            Detect phishing{" "}
            <span style={{
              color: C.cyan,
              display: "inline-block",
              position: "relative",
            }}>
              before it gets you
              <svg style={{ position: "absolute", bottom: "-4px", left: 0, width: "100%", height: "3px" }} viewBox="0 0 300 3" preserveAspectRatio="none">
                <line x1="0" y1="1.5" x2="300" y2="1.5" stroke={C.cyan} strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: C.silver,
            lineHeight: 1.7,
            maxWidth: "500px",
            marginBottom: "44px",
          }}>
            Our ML scanner analyzes 4 real-world signals and returns a risk verdict in under one second — no technical knowledge required.
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <button className="cta-btn" onClick={scrollToScan} style={{ padding: "15px 30px", borderRadius: "10px", fontSize: "15px" }}>
              Check a website now →
            </button>
            <a href="#how" style={{ textDecoration: "none" }}>
              <button className="ghost-btn" style={{ padding: "14px 28px", borderRadius: "10px", fontSize: "15px" }}>
                How it works
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── TICKER ─────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${C.rim}`, borderBottom: `1px solid ${C.rim}`, background: C.surface, padding: "13px 0", overflow: "hidden" }}>
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {[...Array(2)].map((_, ri) => (
              <React.Fragment key={ri}>
                {[
                  { text: "Phishing attacks rose 58% in 2024", warn: true },
                  { text: "Model trained on 11,000+ verified URLs", warn: false },
                  { text: "1 in 99 emails is a phishing attempt", warn: true },
                  { text: "4 signals · instant verdict · free to use", warn: false },
                  { text: "Mobile users are 3× more susceptible", warn: true },
                  { text: "No data stored — fully private", warn: false },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: "12px", color: C.silver, padding: "0 44px", letterSpacing: "0.04em", fontFamily: "monospace" }}>
                    <span style={{ color: item.warn ? C.crimson : C.emerald, marginRight: "8px" }}>{item.warn ? "⚠" : "✓"}</span>
                    {item.text}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(48px, 7vw, 80px) clamp(20px, 5vw, 80px)", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1px",
          background: C.rim,
          border: `1px solid ${C.rim}`,
          borderRadius: "16px",
          overflow: "hidden",
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: C.surface, padding: "28px 24px" }}>
              <div style={{ fontSize: "10px", color: C.mist, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "14px" }}>
                {s.icon}  {s.label.toUpperCase()}
              </div>
              <div style={{ fontSize: "clamp(30px, 4vw, 40px)", fontWeight: 900, color: C.platinum, letterSpacing: "-0.04em", fontFamily: "monospace" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCANNER ────────────────────────────────────────────────────────── */}
      <section ref={scanRef} id="scan" style={{ padding: "0 clamp(20px, 5vw, 80px) clamp(80px, 10vw, 120px)", maxWidth: "1100px", margin: "0 auto" }}>

        {/* Section label */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ width: "28px", height: "2px", background: C.cyan }} />
            <span className="mono" style={{ fontSize: "10px", letterSpacing: "0.2em", color: C.cyan, fontWeight: 700 }}>SCANNER TOOL</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: C.platinum, letterSpacing: "-0.03em" }}>
            Check any site in 30 seconds
          </h2>
          <p style={{ fontSize: "14px", color: C.silver, marginTop: "8px", maxWidth: "460px", lineHeight: 1.7 }}>
            Paste a URL for instant analysis, or answer 4 quick questions about what you observe on the page.
          </p>
        </div>

        {/* Scanner card */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.rim}`,
          borderRadius: "18px",
          overflow: "hidden",
        }}>
          {/* Terminal header */}
          <div style={{
            padding: "14px 22px",
            borderBottom: `1px solid ${C.rim}`,
            display: "flex", alignItems: "center", gap: "8px",
            background: C.void,
          }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {[C.crimson, C.amber, C.emerald].map((c, i) => (
                <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c, opacity: 0.8 }} />
              ))}
            </div>
            <span className="mono" style={{ marginLeft: "10px", fontSize: "11px", color: C.mist, letterSpacing: "0.08em" }}>
              phishguard-scanner — bash
            </span>
            <div style={{
              marginLeft: "auto", background: `${C.emerald}18`,
              border: `1px solid ${C.emerald}30`,
              borderRadius: "99px", padding: "2px 10px",
            }}>
              <span className="mono" style={{ fontSize: "9px", color: C.emerald, letterSpacing: "0.1em" }}>● ONLINE</span>
            </div>
          </div>

          {/* Mode tabs */}
          <div style={{ display: "flex", background: C.void, borderBottom: `1px solid ${C.rim}`, padding: "0 4px" }}>
            {[
              { mode: "url", label: "URL Input", icon: "🌐" },
              { mode: "manual", label: "Manual Signals", icon: "🎛" },
            ].map(tab => (
              <button
                key={tab.mode}
                className="mode-tab"
                onClick={() => handleModeSwitch(tab.mode)}
                style={{
                  color: scanMode === tab.mode ? C.cyan : C.mist,
                  borderBottom: `2px solid ${scanMode === tab.mode ? C.cyan : "transparent"}`,
                  paddingBottom: "12px",
                  paddingTop: "12px",
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: "clamp(24px, 4vw, 40px)" }}>
            {scanMode === "url" ? (
              <div style={{ animation: "revealUp 0.3s ease both", padding: "12px 0" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.silver, marginBottom: "10px", letterSpacing: "0.04em" }}>
                  Paste the suspicious URL below
                </label>
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  background: C.abyss, border: `1px solid ${C.rim}`,
                  borderRadius: "12px", padding: "8px 14px",
                  transition: "border-color 0.18s",
                }}>
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>🌐</span>
                  <input
                    type="text"
                    value={urlText}
                    onChange={e => setUrlText(e.target.value)}
                    placeholder="https://secure-login-update-paypal.net/verify"
                    style={{
                      flex: 1, background: "transparent", border: "none",
                      outline: "none", color: C.platinum, fontSize: "14px",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  />
                </div>
                <p style={{ marginTop: "8px", fontSize: "11px", color: C.mist }}>
                  Try: suspicious links from emails, SMS messages, or social media posts.
                </p>
              </div>
            ) : (
              <div style={{ animation: "revealUp 0.3s ease both" }}>
                {questions.map((q, qi) => (
                  <div
                    key={q.id}
                    style={{
                      marginBottom: qi < questions.length - 1 ? "32px" : 0,
                      paddingBottom: qi < questions.length - 1 ? "32px" : 0,
                      borderBottom: qi < questions.length - 1 ? `1px solid ${C.rim}` : "none",
                    }}
                  >
                    <div style={{ display: "flex", gap: "16px", marginBottom: "14px", alignItems: "flex-start" }}>
                      <span className="mono" style={{ fontSize: "11px", color: C.cyan, fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0, marginTop: "3px" }}>
                        {q.num}
                      </span>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: C.platinum, marginBottom: "4px" }}>{q.label}</div>
                        <div style={{ fontSize: "12px", color: C.silver, lineHeight: 1.55 }}>{q.hint}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginLeft: "30px" }}>
                      {q.options.map(opt => (
                        <OptionCard key={opt.value} opt={opt} selected={formData[q.id]} onClick={val => handleChange(q.id, val)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{ marginTop: "36px", paddingTop: "28px", borderTop: `1px solid ${C.rim}` }}>
              <button
                className="cta-btn"
                onClick={analyzeRisk}
                disabled={loading}
                style={{
                  width: "100%", padding: "16px", borderRadius: "12px",
                  fontSize: "15px", opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Analyzing…" : "Get my risk verdict →"}
              </button>

              {error && (
                <div style={{
                  marginTop: "14px", padding: "14px 18px",
                  background: `${C.crimson}0F`, border: `1px solid ${C.crimson}35`,
                  borderRadius: "10px", fontSize: "13px",
                  color: "#FF8098", lineHeight: 1.6,
                }}>
                  <strong>Connection error:</strong> {error}
                </div>
              )}
              {loading && <Scanning />}
              {result && <ResultPanel result={result} />}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${C.rim}`,
        padding: "24px clamp(20px, 5vw, 80px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: "12px",
        maxWidth: "1100px", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "5px", background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>🛡</div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: C.silver }}>PhishGuard<span style={{ color: C.cyan }}>AI</span></span>
        </div>
        <p style={{ fontSize: "12px", color: C.mist, maxWidth: "400px", textAlign: "right" }}>
          Predictions are probabilistic — always verify through official channels. · Built with ML + React
        </p>
      </footer>
    </>
  );
}
