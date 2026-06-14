/* Design QA harness (BYOK) — renders the Aurora primitives + real index.css with
   mock data, no Tauri dependency. Dev-only; not shipped (reachable only from
   qa.html, which the tauri build does not use as an entry). Load
   /qa.html?theme=light for the light theme. */
import { createRoot } from "react-dom/client";
import { ArrowRight, Check, Gauge, Wifi, HardDrive, Power, KeyRound } from "lucide-react";
import "./index.css";

const params = new URLSearchParams(location.search);
document.documentElement.classList.add(params.get("theme") === "light" ? "light" : "dark");

function S({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section data-qa={id} style={{ padding: "22px 24px", marginBottom: 16, borderRadius: 16, background: "var(--color-bg-primary)", border: "1px solid var(--color-surface-card-border)" }}>
      <h2 className="text-title font-bold text-text-primary" style={{ margin: "0 0 18px" }}>{title}</h2>
      {children}
    </section>
  );
}

function App() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>
      <S id="hero" title="Welcome hero (BYOK cold-start)">
        <div className="relative flex flex-col items-center text-center text-text-muted">
          <p className="text-display font-extrabold text-text-primary">Tell me what's wrong.</p>
          <p className="text-display font-extrabold"><span className="aurora-text">I'll handle the rest.</span></p>
        </div>
      </S>

      <S id="type" title="Type scale (weight orthogonal)">
        <div style={{ display: "grid", gap: 10 }}>
          <div className="text-display font-extrabold text-text-primary">Display 33 · 800 — Tell me what's wrong.</div>
          <div className="text-title font-bold text-text-primary">Title 24 · 700 — Keep Noah on standby?</div>
          <div className="text-heading font-bold text-text-primary">Heading 19 · 700 — 3 processes stopped</div>
          <div className="text-body-l text-text-primary">Body L 17 — Noah investigates, fixes the issue, and shows you what changed.</div>
          <div className="text-body text-text-secondary">Body 15 — the default reading size for descriptions and list rows.</div>
          <div className="text-caption text-text-muted">Caption 13 — secondary metadata, timestamps, helper text.</div>
          <div><span className="eyebrow">Micro 11 · Investigating</span></div>
        </div>
      </S>

      <S id="keycard" title="BYOK — API key card">
        <div className="rounded-card border border-surface-card-border bg-surface-card surface-card" style={{ maxWidth: 460, padding: "18px 20px" }}>
          <span className="eyebrow"><KeyRound size={12} style={{ marginRight: 4, verticalAlign: "-1px" }} />API key · not set</span>
          <div className="text-body text-text-secondary" style={{ margin: "8px 0 12px" }}>Paste your own Anthropic API key. It stays on this device.</div>
          <input className="w-full px-4 py-2.5 rounded-xl bg-bg-input border border-border-primary text-sm text-text-primary placeholder-text-muted outline-none" placeholder="sk-ant-..." />
          <button className="btn-commit mt-3 px-3.5 py-2 rounded-input text-caption font-semibold">Save key</button>
        </div>
      </S>

      <S id="buttons" title="Buttons — one launch per screen">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
          <button className="btn-launch inline-flex items-center gap-2 rounded-btn px-5 py-3 text-body font-semibold">Fix My Mac <ArrowRight size={16} /></button>
          <button className="btn-commit inline-flex items-center gap-2 rounded-btn px-5 py-3 text-body font-semibold">Save API key</button>
          <button className="btn-soft inline-flex items-center gap-2 rounded-btn px-4 py-2.5 text-body font-semibold">Run diagnostic</button>
          <span className="btn-done inline-flex items-center gap-2 rounded-btn px-4 py-2.5 text-body font-semibold"><Check size={14} strokeWidth={3} /> Sent</span>
          <button className="btn-quiet inline-flex items-center rounded-btn px-4 py-2.5 text-body font-semibold">Continue</button>
          <button className="btn-launch inline-flex items-center rounded-btn px-5 py-3 text-body font-semibold" disabled>Disabled</button>
        </div>
      </S>

      <S id="tiles" title="Selection tile + quick-start chips (one family)">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
          <div className="tile" style={{ maxWidth: 300 }}>
            <div className="chip"><Gauge size={22} /></div>
            <div><div className="text-body font-semibold text-text-primary">Mac feels slow</div><div className="text-caption text-text-muted">Beachballs, lag, fans spinning up</div></div>
          </div>
          <div className="tile sel" style={{ maxWidth: 300 }}>
            <div className="chip"><Wifi size={22} /></div>
            <div><div className="text-body font-semibold text-text-primary">Wi-Fi keeps dropping</div><div className="text-caption text-text-muted">Selected — indigo ring + aurora glow</div></div>
            <span className="check"><Check size={11} strokeWidth={3} /></span>
          </div>
        </div>
        <div className="qp-row" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button className="qp"><span className="qpi tint-blue"><Gauge size={16} /></span> My Mac feels slow</button>
          <button className="qp"><span className="qpi tint-indigo"><Wifi size={16} /></span> Wi-Fi keeps dropping</button>
          <button className="qp"><span className="qpi tint-violet"><HardDrive size={16} /></span> Storage is almost full</button>
          <button className="qp"><span className="qpi tint-amber"><Power size={16} /></span> App keeps crashing</button>
        </div>
      </S>

      <S id="agent" title="Agentic progress — never a bare spinner">
        <div className="agent-run">
          <div className="agent-head"><span style={{ display: "inline-flex", gap: 5 }}><span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" /></span> Finding what's slowing your Mac…</div>
          <div className="agent-steps">
            <div className="agent-step done"><span className="ic"><Check size={11} strokeWidth={3.5} /></span> Scanned 142 running processes</div>
            <div className="agent-step done"><span className="ic"><Check size={11} strokeWidth={3.5} /></span> Checked memory &amp; disk pressure</div>
            <div className="agent-step active"><span className="ic"><span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "block" }} /></span> Tracing 3 apps spiking the CPU…</div>
            <div className="agent-step pending"><span className="ic" /> Prepare the fix</div>
          </div>
        </div>
      </S>

      <S id="result" title="Outcome-first result card (commit strip)">
        <div className="rounded-btn border border-surface-card-border bg-surface-card surface-card overflow-hidden" style={{ maxWidth: 440 }}>
          <div style={{ padding: "16px 20px 8px" }}>
            <span className="eyebrow commit" style={{ marginBottom: 8 }}>Result</span>
            <div className="text-body-l text-text-primary" style={{ marginTop: 4 }}>Your Mac feels fast again — I shut down 3 apps quietly eating your CPU.</div>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 text-caption font-semibold text-accent-green bg-accent-green-soft border-t border-surface-card-border">
            <Check size={14} strokeWidth={3} /> <span>Nothing important was touched</span>
          </div>
        </div>
      </S>

      <S id="pills" title="Pills & tones">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <span className="pill" style={{ background: "var(--aurora-soft)", color: "var(--color-accent-indigo)", border: "1px solid var(--color-accent-border)" }}>Bring your own key</span>
          <span className="tone" style={{ background: "var(--tone-bad-bg)", color: "var(--tone-bad-fg)" }}>● Critical</span>
          <span className="tone" style={{ background: "var(--tone-warn-bg)", color: "var(--tone-warn-fg)" }}>● Warning</span>
          <span className="tone" style={{ background: "var(--tone-ok-bg)", color: "var(--tone-ok-fg)" }}>● Healthy</span>
        </div>
      </S>
    </div>
  );
}

createRoot(document.getElementById("qa-root")!).render(<App />);
