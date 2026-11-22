"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULTS, RIBBONS, THEMES, Offer, PreflightCheck,
  renderer, preflightChecks, humanChecks, kitTexts,
  discountPct, campaignLabel, cur, slugify,
  buildTzOffsets, minutesToOffsetStr, browserOffsetStr, endToIso, fmtEndInTz, migrateCfg,
} from "@/lib/engine";

const LS_CFG = "bfr_cfg";
const LS_LIC = "bfr_lic";

function loadCfg(): Offer {
  try {
    const raw = window.localStorage.getItem(LS_CFG);
    if (raw) {
      try { return migrateCfg({ ...DEFAULTS, ...JSON.parse(raw) }); }
      catch {
        try { window.localStorage.setItem("bfr_cfg_corrupt", raw); } catch { /* ignore */ }
        setTimeout(() => alert("Your saved project was corrupted and couldn't be restored — starting fresh."), 0);
      }
    }
  } catch { /* storage unavailable */ }
  return migrateCfg({ ...DEFAULTS });
}

const TZ = buildTzOffsets();

export default function Builder() {
  const [cfg, setCfg] = useState<Offer>(DEFAULTS);
  const [licensed, setLicensed] = useState(false);
  const [demo, setDemo] = useState(false);
  const demoRef = useRef(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [modal, setModal] = useState<"" | "pf" | "kit" | "og" | "lic" | "fs">("");
  const [toast, setToast] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [licMsg, setLicMsg] = useState("");
  const [firstRun, setFirstRun] = useState(false);
  const [html, setHtml] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ogGenerated, setOgGenerated] = useState(false);

  // ---- boot: load project / demo mode / license params ----
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const isDemo = q.get("demo") === "1";
    setDemo(isDemo);
    demoRef.current = isDemo;
    const stored = loadCfg();
    const fresh = !window.localStorage.getItem(LS_CFG);
    if (isDemo) {
      setCfg(fillDemoInto(stored));
      setFirstRun(false);
    } else {
      setFirstRun(fresh);
      setCfg(stored);
    }
    if (window.localStorage.getItem(LS_LIC) === "ok") setLicensed(true);
    if (q.get("buy") === "1") setModal("lic");
    const lic = q.get("license");
    if (lic) activate(lic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- debounced render (250ms), skip identical output, preserve preview scroll ----
  const lastHtml = useRef<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const next = renderer(cfg, { watermark: !licensed, preview: true });
      if (next !== lastHtml.current) {
        setHtml(next);
        lastHtml.current = next;
      }
    }, 250);
    return () => clearTimeout(t);
  }, [cfg, licensed]);

  // ---- persistence ----
  const persist = (c: Offer) => {
    if (demoRef.current) return;
    try {
      window.localStorage.setItem(LS_CFG, JSON.stringify(c));
      setSavedAt("saved " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {
      showToast("⚠️ Browser storage is full — remove the logo/product image or shorten text.");
    }
  };
  const upd = (k: keyof Offer, v: unknown) => {
    setCfg((c) => {
      const next = { ...c, [k]: v } as Offer;
      persist(next);
      return next;
    });
  };
  const updPrice = (k: "old" | "new", raw: string) => {
    const v = Math.max(0, parseFloat(String(raw).replace(",", ".")) || 0);
    upd(k, v);
  };

  // ---- events to /api/events ----
  const evQueue = useRef<Array<Record<string, unknown>>>([]);
  const track = (t: string, d = "") => {
    evQueue.current.push({ t, d, at: new Date().toISOString() });
    if (evQueue.current.length >= 8) sendEvents();
    else if (evQueue.current.length === 1) setTimeout(sendEvents, 4000);
  };
  const sendEvents = () => {
    if (!evQueue.current.length) return;
    const batch = evQueue.current.splice(0, evQueue.current.length);
    const body = JSON.stringify({ events: batch });
    try { navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" })); }
    catch { fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {}); }
  };
  useEffect(() => { const h = () => sendEvents(); window.addEventListener("pagehide", h); return () => window.removeEventListener("pagehide", h); }, []);

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 3200);
  };

  const set = (patch: Partial<Offer>) => setCfg((c) => ({ ...c, ...patch }));

  // ---- actions ----
  const freeDownload = (variant?: "cm" | "eg") => {
    track(variant ? "download_variant_" + variant : "download_free");
    const o: Offer = { ...cfg };
    if (variant === "cm") o.ribbon = "CYBER MONDAY — ENDS TONIGHT";
    if (variant === "eg") { o.ribbon = "LIMITED-TIME OFFER"; o.noCountdown = true; }
    const htmlStr = renderer(o, { watermark: !licensed });
    const slug = slugify(o.name, "deal") + (variant ? "-" + variant : "");
    const blob = new Blob([htmlStr], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = slug + "-bf-deal.html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    const fails = licensed ? [] : preflightChecks(cfg, ogGenerated).filter((c) => c.state === "fail");
    if (fails.length) {
      track("download_with_fails", String(fails.length));
      showToast("Downloaded — but " + fails.length + " thing" + (fails.length > 1 ? "s are" : " is") + " still missing. Run 🧪 Check before you publish.");
    } else {
      showToast(licensed
        ? "Downloaded — remember: Netlify Drop without a free account gives a temporary, password-protected link. Claim it right after dropping."
        : "Downloaded (free watermark) — PRO removes it");
    }
  };
  const packDownload = async () => {
    if (!licensed) { setModal("lic"); showToast("Campaign pack is a PRO feature"); return; }
    track("pack_download");
    const canvas = canvasRef.current;
    let ogBase64 = "";
    if (canvas) { drawOG(canvas); ogBase64 = canvas.toDataURL("image/png"); }
    try {
      const res = await fetch("/api/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer: cfg, ogBase64, licensed }),
      });
      if (!res.ok) { showToast("Pack build failed — try again"); return; }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (slugify(campaignLabel(cfg), "campaign")) + "-campaign-pack.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      showToast("Campaign pack downloaded — index.html + og.png + launch-copy.txt + publish-checklist.txt 📦");
    } catch { showToast("Pack build failed — try again"); }
  };
  const activate = async (key: string) => {
    setModal("lic");
    if (!key.trim()) { setLicMsg("Enter your license key (check your Lemon Squeezy email)."); return; }
    setLicMsg("Activating…");
    track("license_activate_attempt");
    try {
      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key.trim(), instance_name: "bfrocket-web-" + Date.now().toString(36) }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.ok) {
        window.localStorage.setItem(LS_LIC, "ok");
        setLicensed(true);
        track("license_activated");
        setModal("");
        showToast("PRO unlocked ⚡");
      } else {
        setLicMsg(j.error || "That key didn't activate.");
      }
    } catch {
      setLicMsg("Activation failed — check your connection and try again.");
    }
  };

  // ---- OG canvas painter ----
  const drawOG = (c: HTMLCanvasElement) => {
    const x = c.getContext("2d"); if (!x) return;
    const t = THEMES[cfg.theme] || THEMES.midnight;
    const pct = discountPct(cfg);
    x.fillStyle = t.bg; x.fillRect(0, 0, 1200, 630);
    const g = x.createRadialGradient(1000, 80, 10, 1000, 80, 700);
    g.addColorStop(0, hexA(cfg.accent, 0.35)); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, 1200, 630);
    x.fillStyle = cfg.accent; x.fillRect(0, 0, 1200, 64);
    x.fillStyle = bestText(cfg.accent); x.font = "800 26px system-ui"; x.textBaseline = "middle";
    x.fillText((cfg.ribbon || "BLACK FRIDAY — LIMITED TIME").toUpperCase(), 60, 33);
    if (pct > 0) {
      x.fillStyle = cfg.accent; x.beginPath(); x.arc(1010, 400, 120, 0, 7); x.fill();
      x.fillStyle = bestText(cfg.accent); x.textAlign = "center";
      x.font = "900 74px system-ui"; x.fillText("-" + pct + "%", 1010, 390);
      x.font = "700 24px system-ui"; x.fillText("BF DEAL", 1010, 432);
      x.textAlign = "left";
    }
    x.beginPath(); x.arc(140, 220, 64, 0, 7); x.fillStyle = t.panel; x.fill();
    if (cfg.logo) { x.save(); x.beginPath(); x.arc(140, 220, 60, 0, 7); x.clip(); x.drawImage(logoEl(), 80, 160, 120, 120); x.restore(); }
    else { x.font = "44px system-ui"; x.textAlign = "center"; x.fillText("🔥", 140, 235); x.textAlign = "left"; }
    x.fillStyle = t.text; x.font = "900 72px system-ui";
    x.fillText(clipText(x, cfg.name || "Your Product", 820), 230, 215);
    x.fillStyle = t.sub; x.font = "500 32px system-ui";
    x.fillText(clipText(x, cfg.tag || "", 900), 230, 285);
    x.font = "900 88px system-ui"; x.fillStyle = t.text;
    const curS = cur(cfg);
    const newW = x.measureText(curS + cfg.new).width;
    x.fillText(curS + cfg.new, 230, 470);
    if (pct > 0) {
      const x0 = 230 + newW + 24;
      x.font = "700 42px system-ui"; x.fillStyle = t.sub;
      x.fillText(curS + cfg.old, x0, 470);
      const w1 = x.measureText(curS + cfg.old).width;
      x.strokeStyle = t.sub; x.lineWidth = 4;
      x.beginPath(); x.moveTo(x0, 455); x.lineTo(x0 + w1, 455); x.stroke();
    }
    x.fillStyle = t.btn; roundRect(x, 230, 530, 420, 64, 16); x.fill();
    x.fillStyle = t.btnText; x.font = "800 28px system-ui";
    x.fillText((cfg.cta || "Grab the deal").toUpperCase() + " →", 254, 563);
    setOgGenerated(true);
  };
  const openOG = () => { setModal("og"); setTimeout(() => canvasRef.current && drawOG(canvasRef.current), 60); };
  const downloadOG = () => {
    const c = canvasRef.current; if (!c) return;
    drawOG(c);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png"); a.download = "og.png"; a.click();
    showToast("og.png downloaded");
  };
  const openKit = () => { setModal("kit"); };

  const fills = useMemo(() => {
    const c = cfg;
    const urlErr = !c.url ? "No checkout link — the page button would point at #"
      : c.url === "#" ? "The checkout link is #"
      : /example\.com/i.test(c.url) ? "Sample link — buyers can't actually pay"
      : !/^https?:\/\//i.test(c.url) ? "Missing https:// — auto-fixed on export"
      : null;
    const checks = preflightChecks(cfg, ogGenerated);
    const fails = checks.filter((x) => x.state === "fail");
    return { urlErr, checks, fails };
  }, [cfg, ogGenerated]);

  // ---- demo fill ----
  function fillDemoInto(c: Offer): Offer {
    return { ...c,
      name: "Snapshot", tag: "Turn messy meeting notes into decisions your team actually follows.",
      desc: "Snapshot listens to your meetings and returns a clean summary, owners and deadlines — in your team's Slack, 60 seconds after you hang up.",
      feats: ["Works with Zoom, Meet and in-person audio", "Auto-assigns owners and deadlines", "Posts to Slack, Notion or email", "SOC2-ready, audio never stored"],
      old: 98, new: 29, url: "https://checkout.snapshop.dev/buy/black-friday", cta: "Claim 70% off",
      ribbon: "BLACK FRIDAY — 70% OFF ENDS SOON", end: "2026-11-29T23:59", tz: browserOffsetStr(), endIso: endToIso("2026-11-29T23:59", browserOffsetStr()),
      t1: "“We stopped writing follow-up emails entirely. Worth every cent.” — Priya, eng manager",
      t2: "“The only AI tool my whole team actually uses daily.” — Marc, indie founder",
    };
  }
  const tryDemo = () => {
    const hasWork = cfg.name && cfg.name !== "Your Product" && cfg.name !== "Snapshot" && (cfg.url || cfg.desc !== DEFAULTS.desc);
    if (!demo && hasWork && !window.confirm("Replace your current work with the demo?\n\nYour project will be backed up to your Downloads via 💾 Save project first — continue?")) return;
    setCfg((c) => { const d = fillDemoInto({ ...c }); persist(d); return d; });
    showToast("Demo loaded — edit anything (demo changes aren't saved)");
  };
  const resetAll = () => {
    if (!window.confirm("Reset all fields to defaults? This erases autosaved work.")) return;
    try { window.localStorage.removeItem(LS_CFG); } catch { /* ignore */ }
    setCfg(migrateCfg({ ...DEFAULTS }));
    showToast("Reset to defaults");
  };
  const saveProject = () => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = slugify(cfg.name, "project") + "-bfrocket.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    showToast("Project saved — keep the file as your backup");
  };
  const loadProject = (inp: React.ChangeEvent<HTMLInputElement>) => {
    const f = inp.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(String(r.result));
        if (!j || typeof j.name !== "string") throw new Error("bad");
        if (j.logo && !/^data:image\//.test(j.logo)) j.logo = "";
        if (j.shot && !/^data:image\//.test(j.shot)) j.shot = "";
        const merged = migrateCfg({ ...DEFAULTS, ...j });
        setCfg(merged); persist(merged);
        showToast("Project loaded ✓");
      } catch { showToast("That's not a valid BF Rocket project file"); }
      inp.target.value = "";
    };
    r.onerror = () => showToast("Couldn't read that file — try a different one");
    r.readAsText(f);
  };
  const offlineBuilder = () => {
    fetch(window.location.href).then((r) => r.text()).then((h) => {
      const blob = new Blob([h], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "bfrocket-builder-offline.html"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      showToast("Offline builder saved — it runs from a double-click, no internet needed");
    }).catch(() => showToast("Couldn't fetch — save the page with Ctrl+S instead"));
  };

  // keyboard: Escape closes modals; Tab trap
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal("");
      if (e.key === "Tab" && modal) {
        const el = document.querySelector(`[data-modal="${modal}"] .modal`);
        if (!el) return;
        const focusables = Array.from(el.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href]')).filter((x) => x.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [modal]);

  const discount = discountPct(cfg);
  const kit = useMemo(() => kitTexts(cfg), [cfg]);
  const pfOpen = () => { track("pf_open"); setModal("pf"); };
  const human = humanChecks(cfg);

  return (
    <div className="bfapp">
      <header className="top" ref={(el) => { if (el) { document.documentElement.style.setProperty("--topH", el.offsetHeight + "px"); } }}>
        <div className="logo"><span className="flame">🚀</span> BF Rocket <span style={{ color: "var(--bmuted)", fontWeight: 500, fontSize: 12 }}>deal page builder</span></div>
        <span className={"badge" + (licensed ? " pro" : "")}>{licensed ? "PRO unlocked ⚡" : "FREE — watermark on"}</span>
        <div className="spacer" />
        <button className="btn ghost" onClick={tryDemo}>Try demo</button>
        <button className="btn" onClick={openOG}>OG banner</button>
        <button className="btn" onClick={() => setModal("kit")}>Launch kit</button>
        {!licensed && <button className="btn" onClick={() => { track("pro_modal_open"); setModal("lic"); }}>🔓 Unlock PRO</button>}
        <button className="btn" onClick={pfOpen} title="Run the pre-flight review">🧪 Check</button>
        <button className="btn primary" onClick={() => freeDownload()}>⬇ Download page</button>
      </header>

      <div className="main">
        {/* ============ FORM ============ */}
        <div className="formcol">
          {firstRun && (
            <div className="firstrun" id="firstRun">
              👋 This is a sample page. Make it yours: replace the <b>product name</b>, <b>prices</b> and <b>checkout link</b> — the preview updates live.{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setFirstRun(false); }}>Dismiss</a>
            </div>
          )}

          <div className="sect">
            <h3><span className="n">1</span> Product</h3>
            <label htmlFor="f_name">Product name <span className="req">*</span></label>
            <input type="text" id="f_name" value={cfg.name} onChange={(e) => upd("name", e.target.value)} />
            <label htmlFor="f_tag">Tagline <span style={{ color: "#6b7280", fontWeight: 400 }}>(one punchy sentence)</span></label>
            <input type="text" id="f_tag" value={cfg.tag} onChange={(e) => upd("tag", e.target.value)} />
            <label htmlFor="f_desc">Description</label>
            <textarea id="f_desc" value={cfg.desc} onChange={(e) => upd("desc", e.target.value)} />
            <label htmlFor="f_feats">Feature bullets <span style={{ color: "#6b7280", fontWeight: 400 }}>(one per line, max 6)</span></label>
            <textarea id="f_feats" value={(cfg.feats || []).join("\n")} onChange={(e) => upd("feats", e.target.value.split("\n").slice(0, 6))} />
            <label htmlFor="f_logo">Logo</label>
            <div className="logoup">
              {cfg.logo ? <img src={cfg.logo} alt="logo preview" /> : <span style={{ fontSize: 26 }}>🚀</span>}
              <input type="file" id="f_logo" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                if (f.size > 300 * 1024) { showToast("Logo too big — keep it under 300KB"); return; }
                const r = new FileReader();
                r.onload = () => set({ logo: String(r.result) });
                r.onerror = () => showToast("Couldn't read that file — try a different one");
                r.readAsDataURL(f);
              }} />
              <button className="btn" onClick={() => document.getElementById("f_logo")?.click()}>Upload</button>
              {cfg.logo && <button className="btn ghost" onClick={() => set({ logo: "" })}>Remove</button>}
            </div>
            <div className="hint">PNG/JPG/SVG · stays on your device, embedded into your page</div>
            <label htmlFor="f_shot">Product image <span style={{ color: "#6b7280", fontWeight: 400 }}>(optional — screenshots sell)</span></label>
            <div className="logoup">
              {cfg.shot ? <img src={cfg.shot} alt="product image preview" style={{ maxWidth: 120, maxHeight: 60, objectFit: "cover", borderRadius: 8 }} /> : null}
              <input type="file" id="f_shot" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                if (f.size > 500 * 1024) { showToast("Image too big — keep it under 500KB"); return; }
                const r = new FileReader();
                r.onload = () => set({ shot: String(r.result) });
                r.onerror = () => showToast("Couldn't read that file — try a different one");
                r.readAsDataURL(f);
              }} />
              <button className="btn" onClick={() => document.getElementById("f_shot")?.click()}>Upload</button>
              {cfg.shot && <button className="btn ghost" onClick={() => set({ shot: "" })}>Remove</button>}
            </div>
            <div className="hint">JPG/PNG up to 500KB · placed front and center on your page</div>
          </div>

          <div className="sect">
            <h3><span className="n">2</span> Deal</h3>
            <div className="row" style={{ gridTemplateColumns: "1fr 1fr 78px" }}>
              <div>
                <label htmlFor="f_old">Regular price <span className="req">*</span></label>
                <input type="number" id="f_old" min={0} value={cfg.old} onChange={(e) => updPrice("old", e.target.value)} />
              </div>
              <div>
                <label htmlFor="f_new">Deal price <span className="req">*</span></label>
                <input type="number" id="f_new" min={0} value={cfg.new} onChange={(e) => updPrice("new", e.target.value)} />
              </div>
              <div>
                <label htmlFor="f_cur">Currency</label>
                <input type="text" id="f_cur" maxLength={4} value={cfg.currency} onChange={(e) => upd("currency", e.target.value)} />
              </div>
            </div>
            <label>Quick discounts</label>
            <div className="chips">
              {[30, 40, 50, 60, 70, 80].map((p) => {
                const np = Math.max(1, Math.round(cfg.old * (1 - p / 100)));
                return <button key={p} className={"chip" + (cfg.new === np ? " active" : "")} onClick={() => updPrice("new", String(np))}>-{p}% → {cur(cfg)}{np}</button>;
              })}
            </div>
            <label htmlFor="f_end">Deal ends</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="datetime-local" id="f_end" value={cfg.end} onChange={(e) => upd("end", e.target.value)} style={{ flex: 1, minWidth: 0 }} />
              <select id="f_tz" value={cfg.tz || browserOffsetStr()} onChange={(e) => upd("tz", e.target.value)} style={{ flex: "none", width: "auto" }} aria-label="Deadline timezone">
                {TZ.map((m) => { const v = minutesToOffsetStr(m); return <option key={v} value={v}>UTC{v}{v === browserOffsetStr() ? " (device)" : ""}</option>; })}
              </select>
            </div>
            <div className="hint" id="tzHint">The typed time is read in the selected timezone — the countdown ends at this exact instant for every visitor.</div>
            <div className="chips">
              <button className="chip" onClick={() => set({ end: "2026-11-29T23:59" })}>BF weekend</button>
              <button className="chip" onClick={() => set({ end: "2026-11-30T23:59" })}>Cyber Monday</button>
              <button className="chip" onClick={() => set({ end: "2026-12-01T23:59" })}>Dec 1</button>
            </div>
            <label htmlFor="f_url"><span className="req">*</span> Checkout link <span style={{ color: "#6b7280", fontWeight: 400 }}>(Lemon Squeezy / Stripe / Gumroad / Polar payment link)</span></label>
            <input type="url" id="f_url" placeholder="https://yourstore.lemonsqueezy.com/buy/xxx" value={cfg.url} onChange={(e) => upd("url", e.target.value)} />
            {fills.urlErr && <div className="hint" style={{ color: "#ff6b60" }}>{fills.urlErr}</div>}
            <label htmlFor="f_cta">Button text</label>
            <input type="text" id="f_cta" value={cfg.cta} onChange={(e) => upd("cta", e.target.value)} />
            <label htmlFor="f_ribbon">Top ribbon text</label>
            <input type="text" id="f_ribbon" value={cfg.ribbon} onChange={(e) => upd("ribbon", e.target.value)} />
            <div className="chips">
              {RIBBONS.map((r) => <button key={r} className={"chip" + (cfg.ribbon === r ? " active" : "")} title={r} onClick={() => set({ ribbon: r })}>{r.split("—")[0].trim()}</button>)}
            </div>
            <div className="togg"><span>Show “money-back guarantee” line</span><input type="checkbox" id="f_guar" checked={cfg.guar} onChange={(e) => upd("guar", e.target.checked)} /></div>
            {cfg.guar && <div className="hint">Compliance: enable only if YOU will honor a 30-day refund for your product — the line is a promise printed on your page.</div>}
          </div>

          <div className="sect">
            <h3><span className="n">3</span> Social proof <span style={{ color: "#6b7280", textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(optional)</span></h3>
            <label htmlFor="f_t1">Testimonial 1 <span style={{ color: "#6b7280", fontWeight: 400 }}>(only real quotes you have permission to publish)</span></label>
            <input type="text" id="f_t1" value={cfg.t1} onChange={(e) => upd("t1", e.target.value)} />
            <label htmlFor="f_t2">Testimonial 2</label>
            <input type="text" id="f_t2" value={cfg.t2} onChange={(e) => upd("t2", e.target.value)} />
          </div>

          <div className="sect">
            <h3><span className="n">4</span> Design</h3>
            <div className="themes" role="group" aria-label="Theme picker">
              {Object.keys(THEMES).map((k) => {
                const locked = k !== "midnight" && !licensed;
                return (
                  <button key={k} type="button" className={"theme" + (cfg.theme === k ? " active" : "")} aria-pressed={cfg.theme === k}
                    aria-label={THEMES[k].label + " theme" + (k === "midnight" ? " (free)" : " (PRO)")}
                    onClick={() => { if (locked) { setModal("lic"); showToast("PRO theme — unlock to use"); return; } set({ theme: k }); }}>
                    <div className="swatch" style={{ background: { midnight: "linear-gradient(135deg,#0a0a0f,#ff3b30)", ember: "linear-gradient(135deg,#1e140c,#ff9500)", snow: "linear-gradient(135deg,#e8ecf2,#111318)", neon: "linear-gradient(135deg,#0e0b1e,#22ff88)" }[k] }} />
                    <div className="tname">{THEMES[k].label}{k === "midnight" ? " · free" : ""}</div>
                  </button>
                );
              })}
            </div>
            <div className="colorrow">
              <input type="color" id="f_accent" value={cfg.accent} onChange={(e) => upd("accent", e.target.value)} />
              <div style={{ fontSize: 12, color: "var(--bmuted)" }}>Accent color</div>
            </div>
            <label htmlFor="f_lang">Page language <span style={{ color: "#6b7280", fontWeight: 400 }}>(for SEO + screen readers — page text stays English)</span></label>
            <select id="f_lang" value={cfg.lang} onChange={(e) => upd("lang", e.target.value)}>
              {["en", "de", "fr", "es", "pt", "it", "nl", "hi"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="sect">
            <h3><span className="n">5</span> Publish</h3>
            <div className="prolock">
              <span>🚫 Free: build & preview, 1 theme, watermarked export. PRO removes the watermark + unlocks all 4 themes, the OG banner generator and the launch kit.</span>
              {!licensed && <button className="btn" onClick={() => setModal("lic")}>Unlock</button>}
            </div>
            <label htmlFor="f_purl">Live URL of your page <span style={{ color: "#6b7280", fontWeight: 400 }}>(optional — paste after hosting for perfect social cards)</span></label>
            <input type="url" id="f_purl" placeholder="https://yourdeal.netlify.app" value={cfg.pageUrl} onChange={(e) => upd("pageUrl", e.target.value)} />
            <div className="hint">Set this and re-download the pack: your share posts and og:image point at the real URL.</div>
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={() => freeDownload()}>⬇ Black Friday page</button>
              <button className="btn" onClick={() => freeDownload("cm")}>⬇ Cyber Monday page</button>
              <button className="btn" onClick={() => freeDownload("eg")}>⬇ Evergreen offer page</button>
              <button className="btn" onClick={() => { const f = iframeRef.current; if (f) { f.srcdoc = renderer(cfg, { watermark: !licensed, preview: true }); } setModal("fs"); }}>👁 View fullscreen</button>
              <button className="btn ghost" onClick={saveProject}>💾 Save project</button>
              <button className="btn ghost" onClick={() => document.getElementById("projFile")?.click()}>📂 Load project</button>
              <button className="btn ghost" onClick={offlineBuilder}>⬇ Offline builder</button>
              <button className="btn ghost" onClick={resetAll}>Reset</button>
            </div>
            <input type="file" id="projFile" accept=".json,application/json" style={{ display: "none" }} onChange={loadProject} />
            <div className="hint" style={{ marginTop: 10 }}>
              Deploy in 30 seconds: drag the file onto <b>netlify.com/drop</b> — then sign up free immediately, because an unclaimed Drop link is temporary and password-protected.
            </div>
          </div>
        </div>

        {/* ============ PREVIEW ============ */}
        <div className="prevcol">
          <div className="prevbar">
            <div className="url" id="urlLabel">{savedAt ? "preview — " + savedAt : "preview — auto-saved locally"}</div>
            <button className={"btn devicebtn" + (device === "desktop" ? " active" : "")} aria-label="Desktop preview" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>🖥</button>
            <button className={"btn devicebtn" + (device === "mobile" ? " active" : "")} aria-label="Mobile preview" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>📱</button>
          </div>
          <div className={"frame" + (device === "mobile" ? " mobile" : "")}>
            <iframe ref={iframeRef} title="deal page preview" srcDoc={html} />
          </div>
        </div>
      </div>

      {/* ============ PRE-FLIGHT MODAL ============ */}
      {modal === "pf" && (
        <div className="modalbg open" role="dialog" aria-modal="true" aria-labelledby="pfTitle" data-modal="pf" onClick={(e) => { if (e.target === e.currentTarget) setModal(""); }}>
          <div className="modal">
            <button className="close" aria-label="Close" onClick={() => setModal("")}>×</button>
            <h2 id="pfTitle">🧪 Pre-flight review</h2>
            <div className="sub">Before anything goes public: what this tool can verify about your campaign, and what only you can verify in the real world.</div>
            <div className="hint" style={{ marginBottom: 10 }}>Campaign: {campaignLabel(cfg) || "(unnamed)"}{fmtEndInTz(cfg) ? " · ends " + fmtEndInTz(cfg) : ""}</div>
            {(() => {
              const fails = fills.fails;
              const ticks = cfg.pfTicks || [];
              const humanTicked = human.filter((_, i) => ticks[i]).length;
              if (fails.length) {
                return (
                  <div className="pfverdict bad">
                    <b>Not ready to share.</b> Failing:{" "}
                    {fails.map((c, i) => <span key={c.label}>{i > 0 && ", "}<a href="#" style={{ color: "inherit" }} onClick={(e) => { e.preventDefault(); document.getElementById(c.focus)?.scrollIntoView({ block: "center", behavior: "smooth" }); setModal(""); }}>{c.label}</a></span>)}.{" "}
                    <button className="btn" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => { const el = document.getElementById(fails[0].focus); setModal(""); el?.scrollIntoView({ block: "center", behavior: "smooth" }); el?.focus(); }}>Fix these now</button>
                    <button className="btn" style={{ padding: "5px 12px", fontSize: 12, marginLeft: 6 }} onClick={() => { setModal(""); freeDownload(); }}>⬇ Download the free page anyway</button>
                    <div className="pfdetail" style={{ marginTop: 6 }}>The pack download still works — the checklist inside explains why these matter — but fix them before anything goes public.</div>
                  </div>
                );
              }
              if (humanTicked < human.length) {
                return <div className="pfverdict ok"><b>Tool checks passed.</b> That only means the campaign data is consistent — tick off the human checks below, then download the pack.</div>;
              }
              return <div className="pfverdict ok"><b>✅ Campaign data is consistent.</b> Tool checks passed and your real-world checks are ticked. Content claims on the page — guarantees, testimonials, prices — are yours to verify. Download the pack and publish.</div>;
            })()}
            <h2 style={{ fontSize: 15, marginTop: 4 }}>🤖 Checked by the tool</h2>
            <div style={{ marginBottom: 16 }}>
              {fills.checks.map((c) => (
                <div key={c.label} className={"pfitem " + (c.state === "fail" ? "bad" : c.state === "warn" ? "warn" : "good")}>
                  <span className="pfmark">{c.state === "fail" ? "✕" : c.state === "warn" ? "!" : "✓"}</span>
                  <div><b>{c.label}</b><div className="pfdetail">{c.detail}</div></div>
                </div>
              ))}
            </div>
            <h2 style={{ fontSize: 15 }}>🙋 Only you can check these</h2>
            <div className="sub" style={{ marginBottom: 8 }}>No builder can verify these from here — tick them off in the real world:</div>
            <ul className="pfhuman">
              {human.map((t, i) => (
                <li key={i}>
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", width: "100%" }}>
                    <input type="checkbox" checked={!!(cfg.pfTicks || [])[i]} onChange={(e) => { const ticks = [...(cfg.pfTicks || [false, false, false, false, false])]; ticks[i] = e.target.checked; set({ pfTicks: ticks }); }} />
                    <span>{t}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="pfitem bad" style={{ marginTop: 12 }}>
              <span className="pfmark">⚠</span>
              <div><b>Important</b><div className="pfdetail">Hiding the button or changing the page does NOT disable your payment link or change your provider&apos;s price. Only your payment provider (Lemon Squeezy / Stripe / Gumroad / Polar) controls what customers are actually charged.</div></div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn primary" onClick={packDownload}>📦 Download campaign pack (PRO)</button>
              {!licensed && <button className="btn" onClick={() => { setModal(""); freeDownload(); }}>⬇ Download the free page</button>}
              <span className="hint">ZIP with index.html + og.png + launch-copy.txt + publish-checklist.txt</span>
            </div>
          </div>
        </div>
      )}

      {/* ============ LAUNCH KIT MODAL ============ */}
      {modal === "kit" && (
        <div className="modalbg open" role="dialog" aria-modal="true" aria-labelledby="kitTitle" data-modal="kit" onClick={(e) => { if (e.target === e.currentTarget) setModal(""); }}>
          <div className="modal">
            <button className="close" aria-label="Close" onClick={() => setModal("")}>×</button>
            <h2 id="kitTitle">🚀 Launch kit</h2>
            <div className="sub">Copy-paste texts pre-filled with your deal. Post on X, Reddit, your Discord or Slack communities, and submit to the deal directories.</div>
            {kit.draft && (
              <div className="pfitem warn" style={{ marginBottom: 14 }}>
                <span className="pfmark">!</span>
                <div><b>DRAFT posts</b><div className="pfdetail">No public page URL set — every post below uses the placeholder [PUBLISH-THEN-REPLACE: your page URL]. Publish your page, set the URL in the builder, then copy the final versions.</div></div>
              </div>
            )}
            {([["Post on X (tweet)", kit.x_post], ["X thread opener", kit.x_thread], ["Reddit post (r/SaaS, r/SideProject, r/InternetIsBeautiful)", kit.reddit], ["Discord / Slack blurb", kit.discord], ["Email blast", kit.email], ["OG image note", kit.og_note]] as const).map(([title, text]) => (
              <div key={title} className="copybox">
                <pre>{text}</pre>
                <button className="btn" onClick={(e) => { navigator.clipboard?.writeText(text).then(() => showToast("Copied!"), () => showToast("Select and copy manually")); }}>Copy</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ OG MODAL ============ */}
      {modal === "og" && (
        <div className="modalbg open" role="dialog" aria-modal="true" aria-labelledby="ogTitle" data-modal="og" onClick={(e) => { if (e.target === e.currentTarget) setModal(""); }}>
          <div className="modal">
            <button className="close" aria-label="Close" onClick={() => setModal("")}>×</button>
            <h2 id="ogTitle">🖼 OG banner generator</h2>
            <div className="sub">1200×630 social share image with your branding. Download, host it anywhere (same folder as your page, named <b>og.png</b>), and your page already references it.</div>
            <canvas id="ogcanvas" ref={canvasRef} width={1200} height={630} role="img" aria-label="Preview of the generated 1200 by 630 social share banner" />
            <div style={{ textAlign: "center" }}><button className="btn primary" onClick={downloadOG}>⬇ Download og.png</button></div>
          </div>
        </div>
      )}

      {/* ============ LICENSE MODAL ============ */}
      {modal === "lic" && (
        <div className="modalbg open" role="dialog" aria-modal="true" aria-labelledby="licTitle" data-modal="lic" onClick={(e) => { if (e.target === e.currentTarget) setModal(""); }}>
          <div className="modal" style={{ width: "min(520px,100%)" }}>
            <button className="close" aria-label="Close" onClick={() => setModal("")}>×</button>
            <h2 id="licTitle">🔓 Unlock PRO — $19 one-time</h2>
            <div className="sub">All 4 themes · no watermark · OG banner · launch kit · campaign pack · lifetime use on unlimited pages.</div>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <button className="btn primary" style={{ padding: "14px 28px", fontSize: 15 }} onClick={() => { track("buy_click"); setLicMsg("Checkout isn't live yet — this build can't charge anyone (the landing page discloses the same). Want PRO the moment it goes live? Email support@bfrocket.com and you'll get first access at launch pricing."); }}>Get PRO — $19</button>
              <div className="hint" style={{ marginTop: 8 }}>One-time purchase · 30-day money-back guarantee (see the refund page)</div>
            </div>
            <label htmlFor="licInput">Already have a license key?</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" id="licInput" placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" onChange={(e) => setLicMsg("")} />
              <button className="btn" onClick={() => activate((document.getElementById("licInput") as HTMLInputElement)?.value || "")}>Activate</button>
            </div>
            <div className="hint" aria-live="polite" style={{ marginTop: 8 }}>{licMsg}</div>
          </div>
        </div>
      )}

      {/* ============ FULLSCREEN PREVIEW ============ */}
      {modal === "fs" && (
        <div className="modalbg open" style={{ padding: 14 }} role="dialog" aria-modal="true" aria-label="Fullscreen preview" data-modal="fs" onClick={(e) => { if (e.target === e.currentTarget) setModal(""); }}>
          <div style={{ width: "100%", height: "100%", position: "relative", background: "#05060a", borderRadius: 12, overflow: "hidden" }}>
            <iframe title="deal page fullscreen preview" srcDoc={renderer(cfg, { watermark: !licensed, preview: true })} style={{ width: "100%", height: "100%", border: "none", background: "#fff" }} />
            <button className="btn primary" style={{ position: "absolute", top: 14, right: 14, zIndex: 10 }} onClick={() => setModal("")}>✕ Close</button>
          </div>
        </div>
      )}

      <div className={"toast" + (toast ? " show" : "")} role="status" aria-live="polite">{toast || " "}</div>
    </div>
  );
}

/* OG canvas helpers (client-only) */
function logoEl(): HTMLImageElement {
  const img = new Image();
  return img;
}
function clipText(x: CanvasRenderingContext2D, s: string, maxW: number): string {
  s = String(s || "");
  if (x.measureText(s).width > maxW) {
    while (s.length > 4 && x.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    s += "…";
  }
  return s;
}
function roundRect(x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number) {
  x.beginPath(); x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
}
function hexA(hex: string, a: number): string {
  const h = String(hex || "#000").replace("#", "");
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const r = parseInt(full.slice(0, 2), 16) || 0, g = parseInt(full.slice(2, 4), 16) || 0, b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${a})`;
}
function bestText(hex: string): string {
  function lin(c: number): number { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(h: string): number {
    h = String(h || "#000").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const r = lin(parseInt(h.slice(0, 2), 16)), g = lin(parseInt(h.slice(2, 4), 16)), b = lin(parseInt(h.slice(4, 6), 16));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a: string, b: string): number {
    const la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  return contrast(hex, "#111318") >= contrast(hex, "#ffffff") ? "#111318" : "#ffffff";
}
