/* ════════════════════════════════════════════════════════════════════════════
   ITERATION 5 — the Three.js engine for landing.html
   ─ A procedural PIXEL 8 PRO: polished metal frame · glossy glass back ·
     full-width camera visor · OLED screen (Canvas2D-painted v2 app screens).
   ─ ONE pure state(T): every property of the scene + DOM copy derives from the
     scrubbed beat clock. Slow, Apple-smooth travel; copy never overlaps the phone.
   ░ TUNING ░  CLOCK (beat times) · STAGE (per-beat phone transforms) ·
               #scrolly height in landing.html (speed) · SCRUB (lag)
   ════════════════════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHeroInk } from './heroink.js';

(async function boot() {
  if (window.__REDUCE) return;                                       // static stays (reduce-motion; splash cleared by the gate)
  if (!window.gsap || !window.ScrollTrigger) { window.__hideSplash?.(); return; }   // CDN failed → reveal static
  const MOB = !!window.__NARROW;                                     // <880px → mobile staging (same story, stacked)
  const canvas = document.getElementById('gl');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { window.__hideSplash?.(); return; }                   // no WebGL → reveal static

  /* fonts must be live before the screens are painted */
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('700 43px "Space Grotesk"'), document.fonts.load('600 15px "Space Grotesk"'),
        document.fonts.load('600 14px Inter'), document.fonts.load('500 12px Inter'),
        document.fonts.load('400 80px "Permanent Marker"'), document.fonts.ready,
      ]),
      new Promise(r => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* paint with fallbacks */ }

  document.documentElement.classList.remove('static');

  /* ── the hero cursor fireball (#ink, WebGL — optional). The wordmark is
        always DOM; losing the canvas just loses that garnish. ────────────── */
  const inkCanvas = document.getElementById('ink');
  const ink = inkCanvas ? createHeroInk(inkCanvas, {
    heroEnd: 1.05,
    onContextLost: () => { inkCanvas.style.display = 'none'; },
  }) : null;
  if (!ink && inkCanvas) inkCanvas.style.display = 'none';
  const heroword = document.getElementById('heroword');

  /* ── helpers (the same pure-state toolkit as iteration 4) ─────────────── */
  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const lin  = (T, t0, d) => clamp01((T - t0) / d);
  const out3 = (T, t0, d) => { const x = lin(T, t0, d); return 1 - Math.pow(1 - x, 3); };
  const in2  = (T, t0, d) => { const x = lin(T, t0, d); return x * x; };
  const io   = (T, t0, d) => { const x = lin(T, t0, d); return x * x * (3 - 2 * x); };
  const oback = (T, t0, d) => { const x = lin(T, t0, d), c = 1.70158;               /* back-out: lands with a tiny overshoot */
    return x <= 0 ? 0 : x >= 1 ? 1 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, e) => a + (b - a) * e;
  const chain = (T, base, segs) => { let v = base; for (const s of segs) v = lerp(v, s.v, s.e(T, s.t, s.d)); return v; };
  const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtK = n => n >= 1000 ? '₹' + (n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '') + 'k' : '₹' + n;

  /* ── THE BEAT CLOCK (units) — slow and roomy ──────────────────────────── */
  const CAPM = 1.0,  CAPD = 2.8;                       // move right + 360° flip
  const CHIP0 = 4.0, CHIPD = 0.78;                     // 5 payment chips
  const CHARTM = 8.9,  CHMD = 2.6;                     // travel to the left close-up
  const DRAW = 11.3, RIB = 12.1, TIP = 12.9;
  const DONUTM = 14.6, DOMD = 2.6;                     // travel to the right close-up
  const SWEEP = 17.0, STAND = 18.7, STD = 1.9;
  const MAPM = 21.8, MAMD = 2.6;                       // centre lie-back
  const TWR = 24.3;
  const MODEM = 27.5, MOMD = 2.4;                      // rise + travel right
  const LIFT = 30.2, FLIP = 31.0, LAND = 32.2, PEEK = 33.3, PEEKO = 34.6;
  const GLANM = 35.2, GLMD = 2.4;                      // spin to the launcher
  const DIVE = 40.4, DIVD = 2.8;                        // +2.0 units of read time before the dive
  const HOLD = 43.2, HOLDD = 3.2;                       // full-zoom hold on the widget (money legible)
  const REVEAL = 43.6;                                  // tap-reveal fires DURING the hold
  const ZOUT = 46.4, ZOUTD = 2.0;                       // zoom back out toward the launcher
  /* the dive frames the widget slightly ABOVE centre so the aurora callout ring clears the
     "04 · Glance" copy below it (world units; ~65 screen px at a 900px-tall viewport) */
  const DIVE_LIFT = .05;
  const RECEDE = 48.4, RECD = 1.5;
  const DUR = 50.0;

  /* ── colors / data (the locked v2 set) ────────────────────────────────── */
  const C = { bg:'#1B1147', text:'#FFFFFF', t2:'#B4ACEC', t3:'#9C91AC', credit:'#3DDC97',
    amber:'#F6A037', coral:'#ED6266', mag:'#E8249D', vio:'#6D59DB', sky:'#38BDF8', unc:'#6B6486',
    hair:'rgba(255,255,255,.12)', hairS:'rgba(255,255,255,.07)', glyph:'rgba(255,255,255,.86)' };
  const DONUT_DATA = [                                  // sums to ₹18,640
    { n:'PhonePe QR',        v:6660, p:36, c:C.vio,   h:.160 },
    { n:'Google Pay',        v:4480, p:24, c:C.sky,   h:.108 },
    { n:'Paytm QR',          v:3360, p:18, c:C.mag,   h:.081 },
    { n:'Bank SMS Direct',   v:2430, p:13, c:C.credit,h:.058 },
    { n:'BHIM UPI',          v:1710, p:9,  c:C.amber, h:.041 },
  ];
  const ROWS = [
    { person:true,  nm:'Rohan Mehta',       cat:'PhonePe · 🔊 Spoken',    val:'+₹2,000', tm:'2:14 PM', credit:true },
    { person:true,  nm:'Priya Sharma',      cat:'Google Pay · 🔊 Spoken', val:'+₹1,200', tm:'1:45 PM', credit:true },
    { person:false, nm:'Vijay Kumar',       cat:'Paytm QR · 🔊 Spoken',   val:'+₹385',   tm:'1:02 PM', credit:true, dot:true },
    { person:true,  nm:'Kavita Patel',      cat:'BHIM UPI · 🔊 Spoken',   val:'+₹680',   tm:'12:40 PM', credit:true },
    { person:false, nm:'Arvind Store',      cat:'HDFC Bank · 🔊 Spoken',  val:'+₹4,500', tm:'11:20 AM', credit:true },
  ];
  const CHIP = [
    { lane: .30, spin: -6, dv: 2000 },
    { lane: .40, spin:  4, dv: 1200 },
    { lane: .26, spin: -3, dv: 385  },
    { lane: .45, spin:  5, dv: 680  },
    { lane: .34, spin: -5, dv: 4500 },
  ];
  /* chart spline anchors (chart-panel px) — peak at index 5 */
  const CPTS = [[32,512],[72,492],[112,470],[150,440],[188,380],[218,330],[244,372],[282,420],[316,452],[348,440]];
  const PEAK = [218,330];
  /* map pin anchors (map-viewBox px, like v4) + bar heights */
  /* one-stop pillar look tuning — feeds the glass shader uniforms + the sprite glow params.
     Colors are 0-1 RGB triples (base→mid→coral→tip bottom-up the shaft). */
  const PILLAR_TUNE = {
    base:  [0.42, 0.30, 0.96],   /* deep violet at the map surface */
    mid:   [0.94, 0.20, 0.66],   /* hot magenta body */
    coral: [1.00, 0.52, 0.50],   /* coral transition */
    tip:   [1.00, 0.93, 0.80],   /* warm cream crown */
    fresnel:   0.72,             /* 0-1 · how hard the silhouette edges melt to glass (higher = more translucent edge) */
    core:      0.42,             /* internal light-core intensity down the middle of the shaft */
    rim:       0.18,             /* faint bright edge-light right at the silhouette (frosted-acrylic catch) */
    alphaBase: 0.38,             /* body opacity at the base (map reads through) ... */
    alphaTip:  0.92,             /* ... solid light at the tip */
    glow:      0.30,             /* vertical bloom-bar opacity (additive sprite hugging the shaft) */
    halo:      1.0,              /* master top-halo intensity multiplier */
  };
  const PINS = [                                        // glowing spend pillars (map-viewBox px) — h ∝ √value, floor .045
    /* chipZ = extra local-z (≈ world-up on the flat phone) above the tip for the label chip; same-my
       pillars share a screen column after the 90° roll, so their chipZ MUST stagger or the chips pile up.
       Red-pen 2026-07-08 (round 2): trimmed the 9-bar field to FIVE — the four tallest + one foreground
       candle, balanced left/center/right. my = screen-x after the roll (small=left) · mx = depth (large=far).
       Column-sharers (|Δmy|<~45) keep distinct heights with the farther one taller so no bar fully hides. */
    { mx:250, my:290, h:.230, count:14, value:37600, well:true, chipZ:.04 },  /* the hero — center-back; shares no column, so a small lift just to clear its fat halo */
    { mx:220, my:165, h:.115, count:3,  value:9200,  chipZ:.03 },             /* left-back medium */
    { mx:235, my:420, h:.105, count:1,  value:8200,  chipZ:.03 },             /* right-back medium */
    { mx:155, my:470, h:.080, count:3,  value:4300,  chipZ:0   },             /* right-mid */
    { mx:95,  my:130, h:.060, count:3,  value:1600,  chipZ:0   },             /* front-left candle (shares ₹9.2k's column — it's shorter + nearer, so it peeks below) */
  ];

  /* ════════════════ CANVAS PAINTERS (412×892 logical · 2x backing) ═══════ */
  const SW = 412, SH = 892, DPR2 = 2;
  function mkCanvas(w = SW, h = SH) {
    const c = document.createElement('canvas');
    c.width = w * DPR2; c.height = h * DPR2;
    const x = c.getContext('2d'); x.scale(DPR2, DPR2);
    return [c, x];
  }
  const F = (x, w, s, fam = 'Inter') => { x.font = `${w} ${s}px "${fam}"`; };
  const SG = 'Space Grotesk';
  function rr(x, a, b, w, h, r) { x.beginPath(); x.roundRect(a, b, w, h, r); }
  function auroraGrad(x, a, b, w, h) {
    const g = x.createLinearGradient(a, b, a + w, b + h);
    g.addColorStop(0, C.amber); g.addColorStop(.32, C.coral); g.addColorStop(.62, C.mag); g.addColorStop(1, C.vio);
    return g;
  }
  /* engraved foil for a 13px caption at baseline yB (V2 budget mockup: #FFF→#FFF@52%→#B4ACEC) */
  function foilGrad(x, yB, tint) {
    const g = x.createLinearGradient(0, yB - 10, 0, yB + 3);
    if (tint === 'over')      { g.addColorStop(0, '#F6A7AB'); g.addColorStop(.6, '#ED6266'); g.addColorStop(1, '#D33F52'); }
    else if (tint === 'warn') { g.addColorStop(0, '#FFD79A'); g.addColorStop(.6, '#F6A037'); g.addColorStop(1, '#E6892B'); }
    else { g.addColorStop(0, '#FFFFFF'); g.addColorStop(.52, '#FFFFFF'); g.addColorStop(1, '#B4ACEC'); }
    return g;
  }
  /* the app's budget-on-card line: engraved caption + the V2 recessed ridge the aurora fills.
     y = caption baseline; the ridge lands at y+12..y+28. calm <80% → amber → coral over. */
  function paintBudgetLine(x, a, y, w, spent, cap) {
    const pct = spent / cap, over = spent > cap, warn = !over && pct >= .8;
    x.save();
    x.shadowColor = 'rgba(12,7,38,.6)'; x.shadowOffsetY = 1.5; x.shadowBlur = 3;
    F(x, 600, 13, SG);
    x.fillStyle = foilGrad(x, y); x.fillText('of ' + fmt(cap), a, y);
    x.fillStyle = foilGrad(x, y, over ? 'over' : warn ? 'warn' : 0); x.textAlign = 'right';
    x.fillText(over ? 'Over by ' + fmt(spent - cap) : fmt(cap - spent) + ' left · ' + Math.round(pct * 100) + '%', a + w, y);
    x.restore(); x.textAlign = 'left';
    /* the recessed groove */
    const ry = y + 12, rh = 16;
    rr(x, a, ry, w, rh, 8);
    const gg = x.createLinearGradient(0, ry, 0, ry + rh);
    gg.addColorStop(0, '#140d33'); gg.addColorStop(1, '#1a1350');
    x.fillStyle = gg; x.fill();
    x.save(); rr(x, a, ry, w, rh, 8); x.clip();
    const ig = x.createLinearGradient(0, ry, 0, ry + 6);
    ig.addColorStop(0, 'rgba(0,0,0,.55)'); ig.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = ig; x.fillRect(a, ry, w, 6);
    x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(a, ry + rh - 1, w, 1);
    /* the raised fill — inset 2px, width ∝ pct, aurora spans the fill; glow stays clipped in the groove */
    const fw = over ? w - 4 : Math.max(rh - 4, (w - 4) * Math.min(1, pct));
    rr(x, a + 2, ry + 2, fw, rh - 4, 6);
    if (over) x.fillStyle = C.coral;
    else if (warn) x.fillStyle = C.amber;
    else { const fg = x.createLinearGradient(a + 2, 0, a + 2 + fw, 0);
      fg.addColorStop(0, C.amber); fg.addColorStop(.32, C.coral); fg.addColorStop(.62, C.mag); fg.addColorStop(1, C.vio);
      x.fillStyle = fg; }
    x.shadowColor = 'rgba(232,36,157,.42)'; x.shadowBlur = 11;
    x.fill(); x.shadowBlur = 0;
    x.fillStyle = 'rgba(255,255,255,.42)'; x.fillRect(a + 2, ry + 2, fw, 1.5);
    x.restore();
  }
  function blob(x, cx, cy, r, color, a) {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color + Math.round(a * 255).toString(16).padStart(2, '0'));
    g.addColorStop(1, color + '00');
    x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  function paintBG(x) {
    x.fillStyle = C.bg; x.fillRect(0, 0, SW, SH);
    blob(x, 360, 60, 230, C.mag, .40); blob(x, 30, 420, 210, C.vio, .36);
    blob(x, 380, 690, 190, C.amber, .22); blob(x, 120, 850, 170, C.coral, .20);
  }
  function paintStatus(x, light = false) {
    x.fillStyle = light ? '#fff' : '#fff';
    F(x, 600, 14); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillText('9:41', 28, 42);
    /* signal bars + battery, minimal */
    x.globalAlpha = .92;
    [[336,38,3,5],[341,36,3,7],[346,33,3,10],[351,30,3,13]].forEach(([a,b,w,h]) => { rr(x,a,b,w,h,1); x.fill(); });
    rr(x, 362, 32, 19, 10, 3); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1; x.stroke();
    rr(x, 364, 34, 12, 6, 1.5); x.fill(); rr(x, 382, 35, 2, 4, 1); x.fill();
    x.globalAlpha = 1;
  }
  function strokeIcon(x, path, px, py, size, color, lw = 1.8) {
    x.save(); x.translate(px, py); x.scale(size / 24, size / 24);
    x.strokeStyle = color; x.lineWidth = lw * 24 / size; x.lineCap = 'round'; x.lineJoin = 'round';
    x.stroke(new Path2D(path)); x.restore();
  }
  const ICO = {
    home: 'M3 10.5 12 3l9 7.5 M5 9.5V21h14V9.5',
    bars: 'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3',
    review: 'M9 11l3 3 8-8 M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
    set: 'M4 8h8M16 8h4M4 16h4M12 16h8',
    person: 'M5.5 19.5a6.5 6.5 0 0 1 13 0',
    brief: 'M9.5 8V6.3a1.8 1.8 0 0 1 1.8-1.8h1.4a1.8 1.8 0 0 1 1.8 1.8V8 M4.5 13h15',
    eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z',
    eyeS: 'M2 12s3.6-7 10-7c2 0 3.7.6 5.2 1.5M22 12s-3.6 7-10 7c-2 0-3.7-.6-5.2-1.5 M4 4l16 16 M9.5 9.6a3 3 0 0 0 4.2 4.2',
    refresh: 'M21 12a9 9 0 1 1-3-6.7M21 4v4h-4',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    upArr: 'M7 17L17 7M9 7h8v8',
  };
  function paintNav(x, active) {
    const top = SH - 92;
    const g = x.createLinearGradient(0, SH, 0, top);
    g.addColorStop(0, 'rgba(20,12,56,.94)'); g.addColorStop(.7, 'rgba(20,12,56,.42)'); g.addColorStop(1, 'rgba(20,12,56,0)');
    x.fillStyle = g; x.fillRect(0, top, SW, 92);
    x.fillStyle = C.hairS; x.fillRect(0, top, SW, 1);
    const slots = [['home','Home',58],['bars','Insights',134],['review','Review',278],['set','Settings',354]];
    slots.forEach(([ic, lb, cx]) => {
      const on = lb === active;
      const col = on ? '#fff' : C.t3;
      strokeIcon(x, ICO[ic], cx - 11, top + 18, 22, col);
      if (ic === 'set') { x.fillStyle = col; x.beginPath(); x.arc(cx - 11 + 12.8, top + 18 + 7.3, 2.1, 0, 7); x.fill();
        x.beginPath(); x.arc(cx - 11 + 7.3, top + 18 + 14.7, 2.1, 0, 7); x.fill(); }
      if (ic === 'review') { x.fillStyle = '#FF7A8A'; x.beginPath(); x.arc(cx + 9, top + 18, 4, 0, 7); x.fill(); }
      F(x, on ? 600 : 500, 10); x.fillStyle = col; x.textAlign = 'center';
      x.fillText(lb, cx, top + 56);
    });
    rr(x, 176, top - 4, 60, 60, 20); x.fillStyle = auroraGrad(x, 176, top - 4, 60, 60); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 2.4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(206, top + 12); x.lineTo(206, top + 40); x.moveTo(192, top + 26); x.lineTo(220, top + 26); x.stroke();
    x.textAlign = 'left';
  }
  function paintTopbar(x) {
    rr(x, 20, 64, 42, 42, 14); x.fillStyle = auroraGrad(x, 20, 64, 42, 42); x.fill();
    F(x, 700, 18, SG); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('A', 41, 91);
    x.textAlign = 'left';
    F(x, 500, 12.5); x.fillStyle = C.t2; x.fillText('Shop Soundbox · 100% Offline', 74, 82);
    F(x, 600, 16); x.fillStyle = '#fff'; x.fillText('Arvind Ji', 74, 101);
    rr(x, 268, 68, 124, 32, 16); x.fillStyle = 'rgba(61,220,151,.15)'; x.fill();
    x.strokeStyle = 'rgba(61,220,151,.4)'; x.lineWidth = 1; x.stroke();
    x.fillStyle = C.credit; x.beginPath(); x.arc(282, 84, 3.5, 0, 7); x.fill();
    F(x, 600, 11, SG); x.fillStyle = '#fff'; x.fillText('🔊 Soundbox ON', 292, 88);
  }
  function paintSpendCard(x, p = {}) {                 /* the app's current collections face + target meter */
    const a = 20, b = 122, w = 372, h = 200;
    x.save(); rr(x, a, b, w, h, 26); x.clip();
    const g = x.createLinearGradient(a, b, a + w * .4, b + h);
    g.addColorStop(0, 'rgba(42,31,110,.92)'); g.addColorStop(1, 'rgba(28,20,80,.95)');
    x.fillStyle = g; x.fillRect(a, b, w, h);
    const cg = x.createRadialGradient(a + w, b - 20, 0, a + w, b - 20, w * .9);
    cg.addColorStop(0, 'rgba(61,220,151,.35)'); cg.addColorStop(.32, 'rgba(246,160,55,.16)'); cg.addColorStop(.6, 'rgba(0,0,0,0)');
    x.fillStyle = cg; x.fillRect(a, b, w, h);
    x.restore();
    rr(x, a + .5, b + .5, w - 1, h - 1, 26); x.strokeStyle = C.hair; x.lineWidth = 1; x.stroke();
    x.fillStyle = C.credit; x.beginPath(); x.arc(a + 26, b + 30, 3.5, 0, 7); x.fill();
    F(x, 500, 12.5); x.fillStyle = C.credit; x.fillText('Today\'s Collections', a + 36, b + 34.5);
    F(x, 700, 46, SG); x.fillStyle = '#fff'; x.fillText(p.monthV ?? '₹18,640', a + 22, b + 92);
    const mc = p.monthC ?? 47;
    F(x, 500, 12.5); x.fillStyle = C.t3; x.fillText(mc + (mc === 1 ? ' payment announced' : ' payments announced today'), a + 22, b + 116);
    x.fillStyle = C.hairS; x.fillRect(a + 22, b + 132, w - 44, 1);
    paintBudgetLine(x, a + 22, b + 152, w - 44, p.spent ?? 18640, p.cap ?? 24000);
  }
  function paintStats(x, lLbl, wV, wC, mLbl, mV, mC) {
    const b = 332;                                     /* below the 200-tall spend card */
    F(x, 600, 10.5); x.fillStyle = C.t3;
    x.save(); /* tracking via spaced text */ x.fillText(lLbl, 32, b + 18); x.fillText(mLbl, 226, b + 18); x.restore();
    F(x, 600, 23, SG); x.fillStyle = '#fff';
    x.fillText(wV, 32, b + 48); x.fillText(mV, 226, b + 48);
    F(x, 500, 11); x.fillStyle = C.t3;
    x.fillText(wC + (wC === 1 ? ' payment' : ' payments announced'), 32, b + 66);
    x.fillText(mC + (mC === 1 ? ' payment' : ' payments announced'), 226, b + 66);
    x.fillStyle = C.hairS; x.fillRect(206, b + 6, 1, 64);
  }
  function paintSec(x, y = 404) {
    F(x, 600, 15); x.fillStyle = '#fff'; x.fillText('Recent', 24, y + 16);
    F(x, 500, 12.5); x.fillStyle = C.t2; x.globalAlpha = .85; x.textAlign = 'right';
    x.fillText('View all', 376, y + 15); x.globalAlpha = 1; x.textAlign = 'left';
    strokeIcon(x, ICO.arrow, 379, y + 5, 11, C.t2, 2.4);
  }
  function paintRow(x, y, r, e = 1) {                   /* e = stack-in progress */
    if (e <= 0.01) return 0;
    const rh = 68 * e;
    x.save(); x.globalAlpha = Math.min(1, e * 1.6); x.translate(0, (1 - e) * 14);
    /* mark */
    const mc = C.glyph;
    if (r.person) { x.strokeStyle = mc; x.lineWidth = 1.8; x.lineCap = 'round';
      x.beginPath(); x.arc(44, y + 24, 8.2, 0, 7); x.stroke();
      strokeIcon(x, ICO.person, 32, y + 12, 24, mc); }
    else { strokeIcon(x, 'M4.5 8h15v11h-15z', 32, y + 12, 24, mc); strokeIcon(x, ICO.brief, 32, y + 12, 24, mc); }
    F(x, 600, 14.5); x.fillStyle = '#fff'; x.fillText(r.nm, 78, y + 28);
    if (r.dot) { const nw = x.measureText(r.nm).width; x.fillStyle = C.amber;
      x.shadowColor = 'rgba(246,160,55,.85)'; x.shadowBlur = 7;
      x.beginPath(); x.arc(78 + nw + 12, y + 23, 3, 0, 7); x.fill(); x.shadowBlur = 0; }
    F(x, 500, 12); x.fillStyle = C.t3; x.fillText(r.cat, 78, y + 48);
    F(x, 600, 15, SG); x.fillStyle = r.credit ? C.credit : '#fff'; x.textAlign = 'right';
    x.fillText(r.val, 388, y + 28);
    F(x, 500, 11); x.fillStyle = C.t3; x.fillText(r.tm, 388, y + 48);
    x.textAlign = 'left'; x.restore();
    return rh;
  }
  function paintRows(x, es, startY = 424, hairline = true) {
    let y = startY;
    es.forEach((e, i) => {
      if (i > 0 && hairline && e > .5) { x.fillStyle = C.hairS; x.fillRect(24, y, 364, 1); }
      y += paintRow(x, y + 2, ROWS[i], e);
    });
  }
  /* —— HOME —— */
  function drawHome(x, p) {
    paintBG(x); paintStatus(x); paintTopbar(x);
    paintSpendCard(x, { monthV: fmt(p.monthV), monthC: Math.round(p.monthC), spent: p.monthV, cap: 24000 });
    /* spend-only: the card owns "this month", so the tiles are Today + This week (matches the app) */
    paintStats(x, 'T O D A Y', fmt(p.todayV), Math.round(p.todayC), 'T H I S   W E E K', fmt(p.weekV), Math.round(p.weekC));
    paintSec(x, 424); paintRows(x, p.rowE, 444);
    if (p.listen > 0.01) { x.globalAlpha = p.listen;
      x.fillStyle = C.credit; x.beginPath(); x.arc(30, 456, 3.5, 0, 7); x.fill();
      F(x, 500, 12.5); x.fillStyle = C.t3; x.fillText('Listening for payments…', 42, 460); x.globalAlpha = 1; }
    paintNav(x, 'Home');
    if (p.flash > 0.01) { x.globalAlpha = p.flash;
      const g = x.createRadialGradient(206, 520, 0, 206, 520, 300);
      g.addColorStop(0, 'rgba(61,220,151,.18)'); g.addColorStop(1, 'rgba(61,220,151,0)');
      x.fillStyle = g; x.fillRect(0, 0, SW, SH); x.globalAlpha = 1; }
  }
  /* —— shared insights chrome —— */
  function paintInsHead(x, seg) {
    F(x, 700, 24, SG); x.fillStyle = '#fff'; x.fillText('Insights', 24, 84);
    rr(x, 20, 100, 372, 40, 20); x.fillStyle = 'rgba(255,255,255,.06)'; x.fill();
    x.strokeStyle = C.hair; x.stroke();
    ['Chart', 'Categories', 'Map'].forEach((s, i) => {
      const cx2 = 20 + 62 + i * 124;
      if (i === seg) { rr(x, 24 + i * 124, 103, 116, 34, 17); x.fillStyle = 'rgba(255,255,255,.14)'; x.fill(); }
      F(x, 600, 12.5); x.fillStyle = i === seg ? '#fff' : C.t2; x.textAlign = 'center'; x.fillText(s, cx2, 125);
    });
    x.textAlign = 'left';
    let px = 20;
    ['Day', 'Week', 'Month', 'Year'].forEach((s, i) => {
      F(x, 600, 12); const w = x.measureText(s).width + 28;
      rr(x, px, 152, w, 32, 16);
      x.fillStyle = i === 2 ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)'; x.fill();
      x.strokeStyle = i === 2 ? 'rgba(255,255,255,.28)' : C.hairS; x.stroke();
      x.fillStyle = i === 2 ? '#fff' : C.t2; x.textAlign = 'center'; x.fillText(s, px + w / 2, 172);
      x.textAlign = 'left'; px += w + 8;
    });
  }
  /* chart curve sampling (shared with the 3D ribbon) */
  function curvePoint(t) {                              /* catmull-ish via midpoint smoothing */
    const pts = CPTS, n = pts.length - 1, ft = t * n, i = Math.min(n - 1, Math.floor(ft)), u = ft - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const cr = (a, b, c2, d, u2) => 0.5 * ((2 * b) + (-a + c2) * u2 + (2 * a - 5 * b + 4 * c2 - d) * u2 * u2 + (-a + 3 * b - 3 * c2 + d) * u2 * u2 * u2);
    return [cr(p0[0], p1[0], p2[0], p3[0], u), cr(p0[1], p1[1], p2[1], p3[1], u)];
  }
  function drawChart(x, p) {
    paintBG(x); paintStatus(x); paintInsHead(x, 0);
    F(x, 700, 28, SG); x.fillStyle = '#fff'; x.fillText('₹18,640', 24, 234);
    F(x, 500, 12); x.fillStyle = C.t3; x.fillText('collected this month · 47 payments announced', 24, 254);
    /* panel */
    rr(x, 20, 272, 372, 330, 18);
    const pg = x.createLinearGradient(0, 272, 0, 602);
    pg.addColorStop(0, 'rgba(20,12,56,.45)'); pg.addColorStop(1, 'rgba(10,6,32,.6)');
    x.fillStyle = pg; x.fill(); x.strokeStyle = C.hair; x.stroke();
    x.save(); rr(x, 20, 272, 372, 330, 18); x.clip();
    x.strokeStyle = 'rgba(180,172,236,.10)'; x.lineWidth = 1;
    [330, 435, 540].forEach(gy => { x.beginPath(); x.moveTo(32, gy); x.lineTo(380, gy); x.stroke(); });
    F(x, 500, 9.5); x.fillStyle = 'rgba(180,172,236,.55)'; x.textAlign = 'right';
    x.fillText('₹2.5k', 384, 326); x.fillText('₹1.25k', 384, 431); x.fillText('₹0', 384, 536);
    x.textAlign = 'left';
    F(x, 500, 10); x.fillStyle = 'rgba(180,172,236,.6)';
    [['1', 32], ['8', 112], ['15', 192], ['22', 272], ['29', 344]].forEach(([s, lx]) => x.fillText(s, lx, 568));
    /* curve + area, clipped by draw progress */
    if (p.drawP > 0.005) {
      x.save();
      x.beginPath(); x.rect(20, 272, (32 + (348 - 32) * p.drawP) - 20 + 6, 330); x.clip();
      const N = 64;
      x.beginPath();
      for (let i = 0; i <= N; i++) { const [cx2, cy] = curvePoint(i / N); i ? x.lineTo(cx2, cy) : x.moveTo(cx2, cy); }
      const lg = x.createLinearGradient(32, 0, 348, 0);
      lg.addColorStop(0, C.amber); lg.addColorStop(.4, C.coral); lg.addColorStop(.7, C.mag); lg.addColorStop(1, C.vio);
      x.globalAlpha = p.lineA ?? 1;                     /* 2D stroke recedes as the 3D tube draws over it */
      x.strokeStyle = lg; x.lineWidth = 3; x.lineCap = 'round'; x.stroke();
      x.globalAlpha = 1;
      x.lineTo(348, 540); x.lineTo(32, 540); x.closePath();
      const ag = x.createLinearGradient(0, 300, 0, 540);
      ag.addColorStop(0, 'rgba(232,36,157,.30)'); ag.addColorStop(.55, 'rgba(109,89,219,.12)'); ag.addColorStop(1, 'rgba(109,89,219,0)');
      x.globalAlpha = p.areaA; x.fillStyle = ag; x.fill(); x.globalAlpha = 1;
      x.restore();
      if (p.dotA > 0.01) { const [dx, dy] = curvePoint(Math.min(1, p.drawP));
        x.globalAlpha = p.dotA; x.fillStyle = '#fff';
        x.shadowColor = 'rgba(232,36,157,.95)'; x.shadowBlur = 9;
        x.beginPath(); x.arc(dx, dy, 5, 0, 7); x.fill(); x.shadowBlur = 0; x.globalAlpha = 1; }
    }
    x.restore();
    /* cstats */
    F(x, 600, 10.5); x.fillStyle = C.t3;
    x.fillText('T O D A Y', 28, 642); x.fillText('D A I L Y   A V G', 152, 642); x.fillText('B U S I E S T', 286, 642);
    F(x, 600, 19, SG); x.fillStyle = '#fff';
    x.fillText('₹1,833', 28, 668); x.fillText('₹621', 152, 668); x.fillText('Jun 6', 286, 668);
    x.fillStyle = C.hairS; x.fillRect(140, 630, 1, 44); x.fillRect(274, 630, 1, 44);
    paintNav(x, 'Insights');
  }
  /* —— DONUT —— */
  const DTOT = 502.65;                                  /* shared sweep basis (fractions) */
  function drawDonut(x, p) {
    paintBG(x); paintStatus(x); paintInsHead(x, 1);
    const cx2 = 206, cy = 330, R = 92, LW = 26;
    /* 2D / 3D pill */
    rr(x, 304, 200, 84, 26, 13); x.fillStyle = 'rgba(13,9,32,.45)'; x.fill(); x.strokeStyle = C.hair; x.stroke();
    rr(x, 307 + (p.is3d ? 40 : 0), 203, 38, 20, 10); x.fillStyle = 'rgba(255,255,255,.16)'; x.fill();
    F(x, 700, 10.5); x.textAlign = 'center';
    x.fillStyle = p.is3d ? C.t3 : '#fff'; x.fillText('2D', 326, 217);
    x.fillStyle = p.is3d ? '#fff' : C.t3; x.fillText('3D', 366, 217);
    x.textAlign = 'left';
    /* ring (sweep) */
    if (p.ringA > 0.01) {
      x.save(); x.globalAlpha = p.ringA;
      x.shadowColor = 'rgba(8,4,26,.55)'; x.shadowBlur = 18; x.shadowOffsetY = 10;
      let acc = 0;
      DONUT_DATA.forEach(d => {
        const fr = d.v / 18640, a0 = -Math.PI / 2 + acc * Math.PI * 2;
        const sw2 = Math.PI * 2 * fr * clamp01((p.sweep - acc) / fr);
        if (sw2 > 0.001) { x.strokeStyle = d.c; x.lineWidth = LW; x.lineCap = 'butt';
          x.beginPath(); x.arc(cx2, cy, R, a0, a0 + sw2); x.stroke(); }
        acc += fr;
      });
      x.shadowBlur = 0; x.shadowOffsetY = 0;
      /* gloss: bevel rings + sheen */
      if (p.sweep > .25) {
        x.globalAlpha = p.ringA * Math.min(1, (p.sweep - .25) * 2);
        x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = 1.5;
        x.beginPath(); x.arc(cx2, cy, R - LW / 2 + .7, 0, 7); x.stroke();
        x.strokeStyle = 'rgba(0,0,0,.22)';
        x.beginPath(); x.arc(cx2, cy, R + LW / 2 - .7, 0, 7); x.stroke();
        const sg2 = x.createLinearGradient(cx2 - 60, cy - 110, cx2 + 30, cy + 80);
        sg2.addColorStop(0, 'rgba(255,255,255,.55)'); sg2.addColorStop(.42, 'rgba(255,255,255,.07)'); sg2.addColorStop(1, 'rgba(255,255,255,0)');
        x.strokeStyle = sg2; x.lineWidth = LW;
        x.beginPath(); x.arc(cx2, cy, R, 0, 7); x.stroke();
      }
      x.restore();
    }
    /* centre total — once */
    if (p.centerA > 0.01) { x.globalAlpha = p.centerA; x.textAlign = 'center';
      F(x, 700, 29, SG); x.fillStyle = '#fff'; x.fillText('₹18,640', cx2, cy - 2);
      F(x, 600, 10); x.fillStyle = C.t3; x.fillText('T H I S   M O N T H', cx2, cy + 18);
      F(x, 500, 11); x.fillText('47 payments announced', cx2, cy + 36);
      x.textAlign = 'left'; x.globalAlpha = 1; }
    /* legend */
    let y = 478;
    DONUT_DATA.forEach((d, i) => {
      const e = p.legE[i]; if (e <= .01) { y += 33; return; }
      x.save(); x.globalAlpha = e * p.legDim; x.translate(0, (1 - e) * 10);
      if (i > 0) { x.fillStyle = C.hairS; x.fillRect(24, y - 8, 364, 1); }
      rr(x, 28, y + 2, 10, 10, 3); x.fillStyle = d.c; x.fill();
      F(x, 600, 13.5); x.fillStyle = '#fff'; x.fillText(d.n, 52, y + 12);
      if (i === 3) { const w = x.measureText(d.n).width; F(x, 600, 11); x.fillStyle = C.credit;
        x.fillText('⚡ Raw SMS Parser', 52 + w + 8, y + 12); }
      F(x, 600, 13.5, SG); x.fillStyle = '#fff'; x.textAlign = 'right'; x.fillText(fmt(d.v), 338, y + 12);
      F(x, 500, 11); x.fillStyle = C.t3; x.fillText(d.p + '%', 388, y + 12);
      x.textAlign = 'left'; x.restore(); y += 33;
    });
    paintNav(x, 'Insights');
  }
  /* —— MAP (Ghost City) —— */
  function drawMap(x, p = {}) {
    paintBG(x); paintStatus(x);
    F(x, 700, 28, SG); x.fillStyle = '#fff'; x.fillText('₹12,430', 24, 96);
    F(x, 500, 12); x.fillStyle = C.t3; x.fillText('Madurai · 42 payments · June 2026', 24, 116);
    /* seg mini */
    rr(x, 252, 72, 138, 30, 15); x.fillStyle = 'rgba(255,255,255,.07)'; x.fill(); x.strokeStyle = C.hair; x.stroke();
    F(x, 600, 10.5); x.textAlign = 'center';
    x.fillStyle = C.t2; x.fillText('Chart', 276, 91); x.fillText('Categories', 321, 91);
    rr(x, 352, 75, 34, 24, 12); x.fillStyle = 'rgba(109,89,219,.25)'; x.fill(); x.strokeStyle = C.vio; x.stroke();
    x.fillStyle = '#fff'; x.fillText('Map', 369, 91); x.textAlign = 'left';
    /* map panel */
    rr(x, 18, 130, 376, 520, 18);
    const mg = x.createLinearGradient(0, 130, 0, 650);
    mg.addColorStop(0, 'rgba(20,12,56,.45)'); mg.addColorStop(1, 'rgba(10,6,32,.6)');
    x.fillStyle = mg; x.fill(); x.strokeStyle = C.hair; x.stroke();
    x.save(); rr(x, 18, 130, 376, 520, 18); x.clip();
    x.translate(18, 130); x.scale(1, 520 / 560);
    x.fillStyle = 'rgba(109,89,219,.16)';
    x.fill(new Path2D('M60 -8 C150 90 260 110 376 200 L376 138 C260 60 165 40 110 -8 Z'));
    x.strokeStyle = 'rgba(180,172,236,.22)'; x.lineWidth = 1;
    x.stroke(new Path2D('M60 -8 C150 90 260 110 376 200'));
    [[96,186,70,56],[222,318,84,66],[112,442,68,54],[288,210,62,50]].forEach(([ex,ey,rx2,ry2]) => {
      const g = x.createRadialGradient(ex, ey, 0, ex, ey, rx2);
      g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.save(); x.translate(ex, ey); x.scale(1, ry2 / rx2);
      x.beginPath(); x.arc(0, 0, rx2, 0, 7); x.fill(); x.restore();
    });
    x.strokeStyle = 'rgba(180,172,236,.14)'; x.lineWidth = 2; x.lineCap = 'round';
    x.stroke(new Path2D('M78 318 A110 110 0 0 1 298 318'));
    x.stroke(new Path2D('M118 446 A148 148 0 0 1 330 230'));
    x.strokeStyle = 'rgba(180,172,236,.08)'; x.lineWidth = 1.5;
    [[96,186],[288,210],[112,442],[336,376],[160,560],[60,300]].forEach(([tx,ty]) => {
      x.beginPath(); x.moveTo(188, 318); x.lineTo(tx, ty); x.stroke(); });
    x.fillStyle = 'rgba(180,172,236,.10)'; x.beginPath(); x.arc(188, 318, 9, 0, 7); x.fill();
    F(x, 500, 10.5); x.fillStyle = 'rgba(180,172,236,.5)'; x.textAlign = 'center';
    x.fillText('Anna Nagar', 96, 172); x.fillText('Goripalayam', 222, 276);
    x.fillText('K.K. Nagar', 112, 404); x.fillText('Tallakulam', 288, 196);
    x.textAlign = 'left';
    [[258,252,C.amber],[152,222,C.vio],[318,300,C.coral],[64,252,C.vio],[206,486,C.amber]].forEach(([px2,py2,c2]) => {
      x.fillStyle = c2; x.beginPath(); x.arc(px2, py2, 3.4, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(px2, py2, 1.4, 0, 7); x.fill();
    });
    const wg = x.createRadialGradient(222, 318, 0, 222, 318, 46);
    wg.addColorStop(0, 'rgba(216,210,255,.4)'); wg.addColorStop(.55, 'rgba(156,145,236,.16)'); wg.addColorStop(1, 'rgba(156,145,236,0)');
    x.fillStyle = wg; x.beginPath(); x.arc(222, 318, 46, 0, 7); x.fill();
    if (p.dim > .01) {                                  /* basemap recedes while the 3D skyline owns the pins */
      x.fillStyle = `rgba(16,10,42,${.38 * p.dim})`; x.fillRect(0, 0, 376, 560);
    }
    x.restore();
    /* city chip + chrome */
    rr(x, 156, 142, 100, 26, 13); x.fillStyle = 'rgba(20,12,56,.85)'; x.fill(); x.strokeStyle = C.hair; x.stroke();
    F(x, 600, 11.5); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('📍 Madurai ▾', 206, 159); x.textAlign = 'left';
    F(x, 600, 10); x.fillStyle = C.t2; x.fillText('N ↑', 30, 152); x.fillStyle = 'rgba(180,172,236,.45)'; x.fillRect(30, 158, 42, 2);
    F(x, 600, 10); x.fillStyle = C.t2; x.fillText('~800 m', 30, 174);
    F(x, 500, 9); x.fillStyle = 'rgba(180,172,236,.55)'; x.fillText('© OpenStreetMap', 28, 642);
    rr(x, 318, 612, 64, 28, 14); x.fillStyle = 'rgba(109,89,219,.30)'; x.fill(); x.strokeStyle = C.vio; x.stroke();
    F(x, 600, 11.5); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(p.threeD ? '◳ 2D' : '◳ 3D', 350, 630); x.textAlign = 'left';
    /* pairlist — fades away as the 3D pillars take over (the flat-lie face reads as pure map) */
    x.globalAlpha = 1 - clamp01((p.dim || 0) * 2.2);
    rr(x, 18, 662, 376, 92, 16); x.fillStyle = 'rgba(255,255,255,.06)'; x.fill(); x.strokeStyle = C.hair; x.stroke();
    [[C.mag, 'Main Counter · 28 payments', 'Busiest billing terminal today', '+₹8,450', 686],
     [C.amber, 'Counter 2 QR · 14 payments', 'Market Counter · 🔊 Spoken', '+₹3,980', 732]].forEach(([c2, nm, loc, val, yy]) => {
      x.fillStyle = c2; x.shadowColor = c2; x.shadowBlur = 7;
      x.beginPath(); x.arc(36, yy, 4.5, 0, 7); x.fill(); x.shadowBlur = 0;
      F(x, 600, 13.5); x.fillStyle = '#fff'; x.fillText(nm, 52, yy - 2);
      F(x, 500, 11); x.fillStyle = C.t3; x.fillText(loc, 52, yy + 15);
      F(x, 600, 13.5, SG); x.fillStyle = '#fff'; x.textAlign = 'right'; x.fillText(val, 380, yy + 3); x.textAlign = 'left';
    });
    x.fillStyle = C.hairS; x.fillRect(30, 708, 352, 1);
    F(x, 500, 10.5); x.fillStyle = C.t3; x.textAlign = 'center';
    x.fillText('47 payments logged to encrypted local ledger · ⓘ 100% on-device SQLite database', 206, 776);
    x.textAlign = 'left'; x.globalAlpha = 1;
    paintNav(x, 'Insights');
  }
  /* —— MODE (card slot is EMPTY — the real 3D card floats over it) —— */
  function drawMode(x, p) {
    paintBG(x); paintStatus(x); paintTopbar(x);
    rr(x, 20, 122, 372, 180, 26); x.fillStyle = 'rgba(10,6,32,.45)'; x.fill();
    x.strokeStyle = C.hairS; x.stroke();
    const sw2 = p.swap;                                 /* 0 = This month, 1 = Today */
    /* stats: week + swap column */
    F(x, 600, 10.5); x.fillStyle = C.t3; x.fillText('T H I S   W E E K', 32, 330);
    x.globalAlpha = 1 - sw2; x.fillText('T H I S   M O N T H', 226, 330); x.globalAlpha = sw2; x.fillText('T O D A Y', 226, 330); x.globalAlpha = 1;
    F(x, 600, 23, SG); x.fillStyle = '#fff'; x.fillText('₹4,215', 32, 360);
    x.globalAlpha = 1 - sw2; x.fillText('₹18,640', 226, 360); x.globalAlpha = sw2; x.fillText('₹1,833', 226, 360); x.globalAlpha = 1;
    F(x, 500, 11); x.fillStyle = C.t3; x.fillText('11 payments', 32, 378);
    x.globalAlpha = 1 - sw2; x.fillText('47 payments', 226, 378); x.globalAlpha = sw2; x.fillText('4 payments', 226, 378); x.globalAlpha = 1;
    x.fillStyle = C.hairS; x.fillRect(206, 318, 1, 64);
    paintSec(x, 404);
    paintRows(x, [1, 1, 1], 424);
    paintNav(x, 'Home');
  }
  /* —— HERO spend face (shown at T≈0; the capture flip hides the swap to Home).
        p.funRows/p.ripples: the poke toy — cursor-on-phone adds a payment + ripple —— */
  function drawHeroFace(x, p = {}) {
    paintBG(x); paintStatus(x); paintTopbar(x);
    paintSpendCard(x);                                 /* the current app card: spend face + budget ridge */
    paintSec(x, 344);
    /* fun poke-payments stack in on top of Recent, newest first */
    let y = 364;
    const fun = p.funRows || [];
    fun.forEach((fr, i) => {
      const k = clamp01((p.now - fr.t0) / .4);
      const e = 1 - Math.pow(1 - k, 3);
      if (i > 0 && e > .5) { x.fillStyle = C.hairS; x.fillRect(24, y, 364, 1); }
      y += paintRow(x, y + 2, fr.row, e);
    });
    ROWS.forEach((r, i) => {
      if ((i > 0 || fun.length) ) { x.fillStyle = C.hairS; x.fillRect(24, y, 364, 1); }
      y += paintRow(x, y + 2, r, 1);
    });
    paintNav(x, 'Home');
    /* touch ripples — expanding rings from the poke point (red-pen: punchier) */
    if (p.ripples) for (const rp of p.ripples) {
      const age = p.now - rp.t0;
      if (age < 0 || age > 1.0) continue;
      const k = age / 1.0, ke = 1 - Math.pow(1 - k, 3);
      x.save();
      const g2 = x.createRadialGradient(rp.sx, rp.sy, 0, rp.sx, rp.sy, 160);
      g2.addColorStop(0, 'rgba(232,36,157,.30)'); g2.addColorStop(1, 'rgba(232,36,157,0)');
      x.globalAlpha = .85 * (1 - k); x.fillStyle = g2;
      x.fillRect(rp.sx - 160, rp.sy - 160, 320, 320);
      x.globalAlpha = .85 * (1 - k); x.strokeStyle = C.mag; x.lineWidth = 3.5;
      x.beginPath(); x.arc(rp.sx, rp.sy, 20 + 300 * ke, 0, 7); x.stroke();
      x.globalAlpha = .5 * (1 - k); x.strokeStyle = C.amber; x.lineWidth = 2;
      x.beginPath(); x.arc(rp.sx, rp.sy, 14 + 220 * ke, 0, 7); x.stroke();
      x.globalAlpha = .55 * (1 - k); x.strokeStyle = '#fff'; x.lineWidth = 2;
      x.beginPath(); x.arc(rp.sx, rp.sy, 8 + 150 * ke, 0, 7); x.stroke();
      x.restore();
    }
  }
  /* —— LAUNCHER + widget —— */
  function drawLauncher(x, p) {
    /* dusk wallpaper */
    const g = x.createLinearGradient(0, 0, SW * .4, SH);
    g.addColorStop(0, '#f3ad5b'); g.addColorStop(.33, '#c95f6e'); g.addColorStop(.64, '#5a4a8e'); g.addColorStop(1, '#241f52');
    x.fillStyle = g; x.fillRect(0, 0, SW, SH);
    const s1 = x.createRadialGradient(330, 140, 0, 330, 140, 260);
    s1.addColorStop(0, 'rgba(255,238,190,.85)'); s1.addColorStop(.5, 'rgba(255,206,122,.35)'); s1.addColorStop(1, 'rgba(255,206,122,0)');
    x.fillStyle = s1; x.fillRect(0, 0, SW, SH);
    x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 8;
    paintStatus(x); x.restore();
    /* clock — nudged up: the widget STACK below needs the room (red-pen 2026-07-07) */
    x.save(); x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 14; x.textAlign = 'center';
    F(x, 600, 50, SG); x.fillStyle = '#fff'; x.fillText('9:41', 206, 172);
    F(x, 500, 13); x.fillStyle = 'rgba(255,255,255,.92)'; x.fillText('Tuesday, June 30', 206, 198);
    x.restore(); x.textAlign = 'left';
    const ts = (blur = 6) => { x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = blur; x.shadowOffsetY = 1; };
    const te = () => { x.shadowBlur = 0; x.shadowOffsetY = 0; };
    /* shared widget glass (honest alpha, no blur — the shipped widget_glass recipe) */
    const wglass = (a, b, w, h) => {
      x.save(); rr(x, a, b, w, h, 26); x.clip();
      const g2 = x.createRadialGradient(a + w / 2, b + h * .38, 20, a + w / 2, b + h * .38, w * .8);
      g2.addColorStop(0, 'rgba(13,9,32,.88)'); g2.addColorStop(.5, 'rgba(13,9,32,.88)'); g2.addColorStop(1, 'rgba(13,9,32,.60)');
      x.fillStyle = g2; x.fillRect(a, b, w, h);
      const sh = x.createLinearGradient(0, b, 0, b + 60);
      sh.addColorStop(0, 'rgba(255,255,255,.06)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sh; x.fillRect(a, b, w, 60);
      x.restore();
      rr(x, a + .5, b + .5, w - 1, h - 1, 26); x.strokeStyle = 'rgba(255,255,255,.16)'; x.stroke();
    };
    /* ── widget 1 — the small money-stack BUDGET meter (the app's 2×1 METER):
          6 note-tiers emptying top-down + one big "% left" (₹18,640 of ₹24,000 → 22%) ── */
    wglass(36, 224, 170, 80);
    for (let i = 0; i < 6; i++) {
      const ty = 285 - i * 11;                          /* bottom-up: 7px note + 4 gap */
      rr(x, 54, ty, 30, 7, 2.5);
      if (i < 2) {                                      /* 22% left → 2 of 6 lit, calm band */
        const g2 = x.createLinearGradient(54, 0, 84, 0);
        g2.addColorStop(0, '#6D59DB'); g2.addColorStop(.55, '#8E63D9'); g2.addColorStop(1, C.mag);
        x.fillStyle = g2; x.shadowColor = 'rgba(141,99,217,.55)'; x.shadowBlur = 5; x.fill(); x.shadowBlur = 0;
        x.fillStyle = 'rgba(255,255,255,.28)'; x.fillRect(54, ty, 30, 1);
      } else {
        x.fillStyle = 'rgba(255,255,255,.05)'; x.fill();
        x.strokeStyle = 'rgba(255,255,255,.10)'; x.lineWidth = 1; x.stroke();
      }
    }
    F(x, 700, 32, SG); ts(7); x.fillStyle = '#fff'; x.fillText('22%', 104, 266); te();
    F(x, 600, 9); ts(4); x.fillStyle = '#E6E1F9'; x.fillText('LEFT THIS MONTH', 104, 284); te();
    /* ── widget 2 — the soundbox-stats bar (the app's Big): brand header + Today · Week · Month ── */
    wglass(36, 320, 340, 100);
    rr(x, 52, 334, 20, 20, 6); x.fillStyle = auroraGrad(x, 52, 334, 20, 20); x.fill();
    F(x, 700, 11, SG); ts(4); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('🔊', 62, 349); te(); x.textAlign = 'left';
    F(x, 600, 12); ts(); x.fillStyle = '#fff'; x.fillText('UPI Soundbox Alert', 80, 349); te();
    F(x, 600, 9.5); ts(4); x.fillStyle = '#E6E1F9';
    x.fillText('T O D A Y', 52, 374); x.fillText('T H I S   W E E K', 162, 374); x.fillText('T H I S   M O N T H', 262, 374); te();
    F(x, 600, 18, SG); ts(7); x.fillStyle = '#fff';
    x.fillText('₹1,833', 52, 398); x.fillText('₹4,215', 162, 398); x.fillText('₹18,640', 262, 398); te();
    x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(150, 366, 1, 40); x.fillRect(250, 366, 1, 40);
    /* ── widget 3 — THE main glass (collections + masked balance) — at the BOTTOM of the stack ── */
    const wa = 36, wb = 440, ww = 340, wh = 236;
    wglass(wa, wb, ww, wh);
    /* header */
    rr(x, wa + 18, wb + 16, 22, 22, 7); x.fillStyle = 'rgba(255,255,255,.16)'; x.fill();
    x.strokeStyle = 'rgba(255,255,255,.22)'; x.stroke();
    F(x, 700, 12, SG); ts(4); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('🔊', wa + 29, wb + 32); te(); x.textAlign = 'left';
    F(x, 600, 13); ts(); x.fillStyle = '#fff'; x.fillText('UPI Payment Alert', wa + 48, wb + 31); te();
    F(x, 500, 10.5); ts(5); x.fillStyle = '#d6cff0'; x.textAlign = 'right'; x.fillText('soundbox active ↗', wa + ww - 18, wb + 30); te(); x.textAlign = 'left';
    /* collections headline */
    F(x, 600, 11); ts(); x.fillStyle = '#e6e1f9'; x.fillText('COLLECTED TODAY', wa + 18, wb + 64); te();
    F(x, 700, 38, SG); ts(8); x.fillStyle = '#fff'; x.fillText('₹18,640', wa + 18, wb + 102); te();
    F(x, 500, 11.5); ts(5); x.fillStyle = '#d6cff0'; x.fillText('47 payments announced · Today', wa + 18, wb + 121); te();
    F(x, 600, 11); ts(); x.fillStyle = '#e6e1f9'; x.textAlign = 'right'; x.fillText('WEEK', wa + ww - 18, wb + 64); te();
    F(x, 600, 21, SG); ts(8); x.fillStyle = '#fff'; x.fillText('₹4,215', wa + ww - 18, wb + 92); te(); x.textAlign = 'left';
    x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(wa + 18, wb + 136, ww - 36, 1);
    /* balance row */
    x.fillStyle = C.credit; x.shadowColor = C.credit; x.shadowBlur = 7;
    x.beginPath(); x.arc(wa + 23, wb + 158, 3.5, 0, 7); x.fill(); x.shadowBlur = 0;
    F(x, 500, 12); ts(); x.fillStyle = '#e6e1f9'; x.fillText('Available', wa + 34, wb + 162); te();
    const rev = p.reveal;
    F(x, 700, 23, SG); ts(8);
    if (rev < .5) { x.fillStyle = '#d7d0f4'; x.fillText('₹●●,●●●', wa + 116, wb + 165); }
    else { x.fillStyle = '#fff'; x.fillText('₹48,250', wa + 116, wb + 165); }
    te();
    /* eye pill */
    rr(x, wa + ww - 78, wb + 146, 60, 28, 14);
    x.fillStyle = rev > .5 ? 'rgba(61,220,151,.16)' : 'rgba(255,255,255,.10)'; x.fill();
    x.strokeStyle = rev > .5 ? 'rgba(61,220,151,.34)' : 'rgba(255,255,255,.20)'; x.stroke();
    strokeIcon(x, rev > .5 ? ICO.eye : ICO.eyeS, wa + ww - 70, wb + 153, 14, rev > .5 ? C.credit : '#fff');
    if (rev > .5) { x.fillStyle = C.credit; x.beginPath(); x.arc(wa + ww - 63, wb + 160, 1.8, 0, 7); x.fill(); }
    F(x, 600, 10.5); x.fillStyle = rev > .5 ? C.credit : '#fff'; x.fillText(rev > .5 ? 'Hide' : 'Reveal', wa + ww - 50, wb + 164);
    /* account chips */
    [[wa + 18, 'HDFC ••1234', '₹32,400'], [wa + ww / 2 + 4, 'SBI ••0398', '₹15,850']].forEach(([cx2, lbl, val]) => {
      rr(x, cx2, wb + 184, ww / 2 - 22, 38, 12); x.fillStyle = 'rgba(255,255,255,.10)'; x.fill();
      x.strokeStyle = 'rgba(255,255,255,.18)'; x.stroke();
      F(x, 500, 10.5); ts(4); x.fillStyle = '#efeafc'; x.fillText(lbl, cx2 + 11, wb + 199); te();
      F(x, 600, 13, SG); ts(5);
      if (rev < .5) { x.fillStyle = '#d7d0f4'; x.fillText('₹●●,●●●', cx2 + 11, wb + 216); }
      else { x.fillStyle = '#fff'; x.fillText(val, cx2 + 11, wb + 216); }
      te();
    });
    /* dock (the app-icon grid rows are gone — the widget stack owns the screen) */
    rr(x, 32, 762, 348, 84, 30); x.fillStyle = 'rgba(16,10,40,.4)'; x.fill();
    for (let c2 = 0; c2 < 4; c2++) {
      const ix = 56 + c2 * 84;
      rr(x, ix, 776, 56, 56, 17);
      if (c2 === 2) { x.fillStyle = auroraGrad(x, ix, 776, 56, 56); x.fill();
        F(x, 700, 24, SG); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('₹', ix + 28, 812); x.textAlign = 'left'; }
      else { x.fillStyle = 'rgba(255,255,255,.24)'; x.fill(); }
    }
    /* ── "home-screen widget" callout — an aurora ring that isolates the glass card
          from the rest of the launcher (scrub-eased via p.callout; pure in T). The
          "a home-screen widget" wording rides the DOM eyebrow, so no on-screen text. ── */
    if (p.callout > 0.01) {
      x.save(); x.globalAlpha = Math.min(1, p.callout);
      x.shadowColor = 'rgba(232,36,157,.5)'; x.shadowBlur = 14;   /* trimmed: the bloom used to wash into the copy below */
      rr(x, wa - 6, wb - 6, ww + 12, wh + 12, 30);
      x.strokeStyle = auroraGrad(x, wa, wb, ww, wh); x.lineWidth = 3; x.stroke();
      x.restore();
    }
  }

  /* ── screen canvases: static layers + live composite ──────────────────── */
  const [liveC, liveX] = mkCanvas();
  const offs = {};                                       /* prerendered static screens */
  function pre(name, fn) { const [c, x] = mkCanvas(); fn(x); offs[name] = c; }
  const [mapC, mapX] = mkCanvas();                     /* map is param-driven now (basemap dim) */
  /* the rest are param-driven; drawn on demand into scratch canvases
     (heroFace joined them — the poke toy paints live rows + ripples) */
  const [heroFC, heroFX] = mkCanvas();
  const [homeC, homeX] = mkCanvas();
  const [chartC, chartX] = mkCanvas();
  const [donutC, donutX] = mkCanvas();
  const [modeC, modeX] = mkCanvas();
  const [launchC, launchX] = mkCanvas();

  const screenTex = new THREE.CanvasTexture(liveC);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 8;

  /* ════════════════ THREE SCENE ══════════════════════════════════════════ */
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, innerWidth / innerHeight, .1, 50);
  camera.position.set(0, 0, 4.3);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.add(new THREE.AmbientLight(0x8a7fd0, .35));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xe8249d, .5); rim.position.set(-3, -1, -2); scene.add(rim);
  /* crisp specular streak so the polished black Pixel reads as glossy glass (a highlight to reflect) */
  const spec = new THREE.DirectionalLight(0xffffff, 1.7); spec.position.set(-1.6, 2.4, 3.2); scene.add(spec);

  /* ── THE PIXEL 8 PRO (procedural) ─────────────────────────────────────── */
  const W = 0.765, H = 1.626, D = 0.088, SCW = 0.7205, SCH = 1.56;
  const k = SCW / SW;                                    /* screen px → world units */
  const px2l = (x, y) => [(x - SW / 2) * k, (SH / 2 - y) * k];

  /* viewport maths — hoisted above the pop-outs (the map pins size themselves against the map
     beat's phone scale); STAGE below uses the same helpers */
  const visH = z => 2 * (camera.position.z - z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const visW = z => visH(z) * camera.aspect;
  const xAt = (f, z) => (f - .5) * visW(z);              /* viewport fraction → world x at depth z */
  const zForW = w => camera.position.z - w / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);  /* depth where a world width fills the viewport */
  const mapS = () => MOB ? Math.min(1.38, visW(.85) * .94 / H) : 1.38;   /* the map beat's phone scale */
  const phonePos = new THREE.Group();                    /* state-owned */
  const phoneIdle = new THREE.Group();                   /* time-bob (envelope-scrubbed) */
  const phone = new THREE.Group();                       /* the device */
  phonePos.add(phoneIdle); phoneIdle.add(phone); scene.add(phonePos);

  /* frame — polished metal slab: rounded-rect extrude, flat rails + beveled edges */
  function rrShape(w2, h2, r) {
    const s = new THREE.Shape();
    s.moveTo(-w2 / 2 + r, -h2 / 2);
    s.lineTo(w2 / 2 - r, -h2 / 2); s.absarc(w2 / 2 - r, -h2 / 2 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(w2 / 2, h2 / 2 - r); s.absarc(w2 / 2 - r, h2 / 2 - r, r, 0, Math.PI / 2, false);
    s.lineTo(-w2 / 2 + r, h2 / 2); s.absarc(-w2 / 2 + r, h2 / 2 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-w2 / 2, -h2 / 2 + r); s.absarc(-w2 / 2 + r, -h2 / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }
  const BEV = .013;
  const bodyGeo = new THREE.ExtrudeGeometry(rrShape(W - BEV * 2, H - BEV * 2, .095 - BEV), {
    depth: D - BEV * 2, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 5, curveSegments: 36,
  });
  bodyGeo.translate(0, 0, -(D - BEV * 2) / 2);
  const frame = new THREE.Mesh(bodyGeo,
    new THREE.MeshPhysicalMaterial({ color: 0xc9cad4, metalness: 1, roughness: .28, envMapIntensity: 1.5 })
  );
  phone.add(frame);
  /* back glass — glossy deep indigo with the aurora bloom + brand mark */
  function backTexture() {
    const c = document.createElement('canvas');
    const w2 = 412, h2 = Math.round(412 * (H / W));
    c.width = w2 * 2; c.height = h2 * 2; const y = c.getContext('2d'); y.scale(2, 2);
    const g = y.createLinearGradient(0, 0, w2 * .7, h2);
    g.addColorStop(0, '#231a58'); g.addColorStop(.52, '#171040'); g.addColorStop(1, '#100b30');
    y.fillStyle = g; y.fillRect(0, 0, w2, h2);
    const bl2 = y.createRadialGradient(w2 * .86, -h2 * .04, 0, w2 * .86, -h2 * .04, w2 * .9);
    bl2.addColorStop(0, 'rgba(232,36,157,.34)'); bl2.addColorStop(.34, 'rgba(246,160,55,.12)'); bl2.addColorStop(.62, 'rgba(0,0,0,0)');
    y.fillStyle = bl2; y.fillRect(0, 0, w2, h2);
    /* brand mark */
    y.save(); y.translate(w2 / 2, h2 * .56);
    y.beginPath(); y.roundRect(-26, -26, 52, 52, 16);
    const ag = y.createLinearGradient(-26, -26, 26, 26);
    ag.addColorStop(0, C.amber); ag.addColorStop(.32, C.coral); ag.addColorStop(.62, C.mag); ag.addColorStop(1, C.vio);
    y.fillStyle = ag; y.fill();
    y.font = '700 26px "Space Grotesk"'; y.fillStyle = '#fff'; y.textAlign = 'center'; y.textBaseline = 'middle';
    y.fillText('₹', 0, 2);
    y.font = '600 9px Inter'; y.fillStyle = 'rgba(180,172,236,.85)'; y.textBaseline = 'alphabetic';
    y.save(); y.translate(0, 46); y.fillText('U P I   S O U N D B O X', 0, 0); y.restore();
    y.restore();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function roundedPlane(w2, h2, r) {
    const s = new THREE.Shape();
    s.moveTo(-w2 / 2 + r, -h2 / 2);
    s.lineTo(w2 / 2 - r, -h2 / 2); s.absarc(w2 / 2 - r, -h2 / 2 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(w2 / 2, h2 / 2 - r); s.absarc(w2 / 2 - r, h2 / 2 - r, r, 0, Math.PI / 2, false);
    s.lineTo(-w2 / 2 + r, h2 / 2); s.absarc(-w2 / 2 + r, h2 / 2 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-w2 / 2, -h2 / 2 + r); s.absarc(-w2 / 2 + r, -h2 / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ShapeGeometry(s, 24);
    /* uv normalize */
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w2 + .5, uv.getY(i) / h2 + .5);
    return g;
  }
  const back = new THREE.Mesh(
    roundedPlane(W - .046, H - .046, .075),
    new THREE.MeshPhysicalMaterial({ map: backTexture(), clearcoat: 1, clearcoatRoughness: .12,
      roughness: .4, metalness: 0, envMapIntensity: 1.0 })
  );
  back.rotation.y = Math.PI; back.position.z = -D / 2 - .0012;
  phone.add(back);
  /* black bezel under the glass */
  const bezel = new THREE.Mesh(roundedPlane(W - .034, H - .034, .082),
    new THREE.MeshPhysicalMaterial({ color: 0x07060f, roughness: .35, metalness: 0 }));
  bezel.position.z = D / 2 + .0006; phone.add(bezel);
  /* camera visor — the Pixel's full-width bar */
  const visor = new THREE.Mesh(
    new RoundedBoxGeometry(W - .07, .155, .045, 4, .07),
    new THREE.MeshPhysicalMaterial({ color: 0xb9bac6, metalness: 1, roughness: .25, envMapIntensity: 1.6 })
  );
  visor.position.set(0, H / 2 - .225, -D / 2 - .012); phone.add(visor);
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0a14, metalness: 0, roughness: .12,
    clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.4 });
  [-.21, -.02, .17].forEach(lx => {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(.042, .042, .02, 32), lensMat.clone());
    lens.rotation.x = Math.PI / 2; lens.position.set(lx, H / 2 - .225, -D / 2 - .032); phone.add(lens);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(.044, .006, 8, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x2c2c38, metalness: 1, roughness: .3 }));
    ring2.position.copy(lens.position); phone.add(ring2);
  });
  const flash = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .012, 24),
    new THREE.MeshPhysicalMaterial({ color: 0xfff4d8, roughness: .4 }));
  flash.rotation.x = Math.PI / 2; flash.position.set(.305, H / 2 - .225, -D / 2 - .026); phone.add(flash);
  /* the OLED screen */
  const screen = new THREE.Mesh(
    roundedPlane(SCW, SCH, .058),
    new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
  );
  screen.position.z = D / 2 + .0016; phone.add(screen);
  /* screen cover glass — catches the room reflections */
  const cover = new THREE.Mesh(
    roundedPlane(SCW + .02, SCH + .04, .064),
    new THREE.MeshPhysicalMaterial({ color: 0x000000, transparent: true, opacity: .08, metalness: 0,
      roughness: .05, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.2 })
  );
  cover.position.z = D / 2 + .003; phone.add(cover);

  /* ── real Pixel 10 Pro shell (GLB) — swaps in over the procedural body ──
     Keeps our live-canvas screen + every pop-out (they anchor to the `phone` group,
     not the shell). The procedural body shows until the GLB lands, then hides; on
     load failure the procedural phone stays. The GLB's own screen mesh shows the
     live UI (screenTex); its front face is aligned to our screen z so pop-outs sit right. */
  const procShellMeshes = [...phone.children];          // frame..cover — hidden when the GLB lands
  let glbReady = false;
  new GLTFLoader().load('./vendor/pixel10pro.glb', gltf => {
    const glb = gltf.scene;
    let box = new THREE.Box3().setFromObject(glb);
    const size = new THREE.Vector3(); box.getSize(size);
    glb.scale.setScalar(H / size.y);                    // match our phone height
    box = new THREE.Box3().setFromObject(glb);
    const ctr = new THREE.Vector3(); box.getCenter(ctr);
    glb.position.x -= ctr.x; glb.position.y -= ctr.y;
    glb.position.z += (D / 2 + .0016) - box.max.z;       // front (screen) face → our screen z
    /* Obsidian = polished black glass — low roughness + clearcoat + strong env reflections */
    const obsidian = new THREE.MeshPhysicalMaterial({ color: 0x0b0b12, metalness: .5,
      roughness: .16, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 2.0 });
    glb.traverse(o => {
      if (!o.isMesh) return;
      const id = (o.name + ' ' + (o.material && o.material.name || '')).toLowerCase();
      if (id.includes('screen')) {
        const uv = o.geometry.attributes.uv;                // glTF flips V on export → flip back so the UI is upright
        for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
        uv.needsUpdate = true;
        o.material = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
        o.renderOrder = 0;
      } else { o.material = obsidian; }
    });
    phone.add(glb);
    /* subtle etched Google "G" on the lower back (not in the geometry) — a shiny mask that
       reflects the room more than the matte back, like the real logo */
    const gbox = new THREE.Box3().setFromObject(glb);
    const gLogo = new THREE.Mesh(new THREE.PlaneGeometry(.115, .115),
      new THREE.MeshPhysicalMaterial({ color: 0x1a1a22, metalness: .4, roughness: .05, clearcoat: 1,
        clearcoatRoughness: .04, envMapIntensity: 2.6, transparent: true, alphaMap: gLogoTex(), alphaTest: .12 }));
    gLogo.position.set(0, -.16, gbox.min.z - .0015); gLogo.rotation.y = Math.PI;   // sits proud of the back, faces −Z
    phone.add(gLogo);
    procShellMeshes.forEach(m => m.visible = false);     // retire the procedural body + screen
    glbReady = true; renderer.render(scene, camera);     // paint immediately (covers the frozen __render case)
  }, undefined, err => console.warn('[pixel10pro.glb] load failed — keeping procedural phone', err));

  /* ── pop-outs (phone-local, ride every phone move) ────────────────────── */
  function chipSprite(lines, w2 = 240, h2 = 96) {
    const c = document.createElement('canvas'); c.width = w2 * 2; c.height = h2 * 2;
    const y = c.getContext('2d'); y.scale(2, 2);
    y.beginPath(); y.roundRect(4, 4, w2 - 8, h2 - 8, 18);
    y.fillStyle = 'rgba(27,17,71,.94)'; y.fill();
    y.strokeStyle = 'rgba(255,255,255,.38)'; y.lineWidth = 1.5; y.stroke();
    y.textAlign = 'center'; y.fillStyle = '#fff';
    y.font = '700 30px "Space Grotesk"'; y.fillText(lines[0], w2 / 2, h2 / 2 - 2);
    y.font = '600 13px Inter'; y.fillStyle = 'rgba(255,255,255,.75)';
    y.fillText(lines[1].toUpperCase(), w2 / 2, h2 / 2 + 22);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
    sp.scale.set(w2 * .0011, h2 * .0011, 1);
    return sp;
  }
  /* MAP PIN — a measured glass pill ("14 · ₹38k") above each spend pillar.
     The width is MEASURED off the label, so the pill hugs its text instead of floating in a
     fixed-width box. Glass is the shipped widget recipe (honest alpha, no blur — a WebGL sprite
     can't take a backdrop-filter): drop shadow → radial body → top sheen → hairline rim. */
  const PIN = { fs: 16, padX: 12, h: 30, i: 6 };          /* canvas px; i = room for the drop shadow */
  const pinMeasure = document.createElement('canvas').getContext('2d');
  function pinSprite(text, f) {
    F(pinMeasure, 600, PIN.fs);
    const bw = Math.ceil(pinMeasure.measureText(text).width) + PIN.padX * 2, bh = PIN.h, r = bh / 2;
    const w2 = bw + PIN.i * 2, h2 = bh + PIN.i * 2;
    const c = document.createElement('canvas'); c.width = w2 * 2; c.height = h2 * 2;
    const y = c.getContext('2d'); y.scale(2, 2);
    y.save();                                             /* lift it off the dimmed map */
    y.shadowColor = 'rgba(6,3,24,.55)'; y.shadowBlur = 6; y.shadowOffsetY = 2;
    rr(y, PIN.i, PIN.i, bw, bh, r); y.fillStyle = 'rgba(13,9,32,.55)'; y.fill();
    y.restore();
    y.save(); rr(y, PIN.i, PIN.i, bw, bh, r); y.clip();   /* glass body + top sheen */
    const g = y.createRadialGradient(PIN.i + bw / 2, PIN.i + bh * .3, 4, PIN.i + bw / 2, PIN.i + bh * .3, bw * .85);
    g.addColorStop(0, 'rgba(20,13,51,.74)'); g.addColorStop(.5, 'rgba(20,13,51,.68)'); g.addColorStop(1, 'rgba(13,9,32,.52)');
    y.fillStyle = g; y.fillRect(PIN.i, PIN.i, bw, bh);
    const sh = y.createLinearGradient(0, PIN.i, 0, PIN.i + bh * .55);
    sh.addColorStop(0, 'rgba(255,255,255,.14)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    y.fillStyle = sh; y.fillRect(PIN.i, PIN.i, bw, bh * .55);
    y.restore();
    rr(y, PIN.i + .75, PIN.i + .75, bw - 1.5, bh - 1.5, r - .75);   /* hairline rim */
    y.strokeStyle = 'rgba(255,255,255,.28)'; y.lineWidth = 1.5; y.stroke();
    y.textAlign = 'center'; y.textBaseline = 'middle'; y.fillStyle = '#fff';
    F(y, 600, PIN.fs); y.fillText(text, w2 / 2, PIN.i + bh / 2 + .5);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
    sp.scale.set(w2 * f, h2 * f, 1);
    return sp;
  }
  /* 64px radial glow: white core → color → transparent (comet head, tower halos) */
  function glowTex(color) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const y = c.getContext('2d');
    const g = y.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.28, color + 'cc'); g.addColorStop(1, color + '00');
    y.fillStyle = g; y.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  /* vertical bloom bar for a glass pillar — the pillar's own colour ramp (warm cream tip →
     magenta → violet base; canvas y=0 = sprite TOP) masked to a bright core → transparent sides,
     with a soft top/bottom vertical fade; stretched over the shaft, additive */
  function pillarGlowTex() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256;
    const y = c.getContext('2d');
    const cg = y.createLinearGradient(0, 0, 0, 256);                 // colour rides the shaft ramp
    cg.addColorStop(0, 'rgba(255,222,178,.55)'); cg.addColorStop(.14, 'rgba(250,110,150,.55)');
    cg.addColorStop(.5, 'rgba(240,45,165,.52)'); cg.addColorStop(1, 'rgba(125,95,255,.40)');
    y.fillStyle = cg; y.fillRect(0, 0, 64, 256);
    const hg = y.createLinearGradient(0, 0, 64, 0);                  // bright core → transparent sides
    hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(.5, 'rgba(255,255,255,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
    y.globalCompositeOperation = 'destination-in'; y.fillStyle = hg; y.fillRect(0, 0, 64, 256);
    const vg = y.createLinearGradient(0, 0, 0, 256);                 // fade the ends so it doesn't read as a hard bar
    vg.addColorStop(0, 'rgba(0,0,0,1)'); vg.addColorStop(.12, 'rgba(0,0,0,0)');
    vg.addColorStop(.85, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,1)');
    y.globalCompositeOperation = 'destination-out'; y.fillStyle = vg; y.fillRect(0, 0, 64, 256);
    return new THREE.CanvasTexture(c);
  }
  /* reflection pool under a pillar — pink core + a brighter RING where the glass meets the map
     (the local bright stop reads as a soft base ring), melting into a violet rim; additive */
  function poolTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const y = c.getContext('2d'); const g = y.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,160,225,.55)'); g.addColorStop(.20, 'rgba(230,100,205,.34)');
    g.addColorStop(.34, 'rgba(255,150,225,.52)');                    // ← the base ring highlight
    g.addColorStop(.5, 'rgba(170,90,255,.28)'); g.addColorStop(1, 'rgba(120,80,255,0)');
    y.fillStyle = g; y.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  }
  /* frosted-glass pillar shader — per-fragment vertical ramp (deep violet base → magenta →
     coral → warm cream tip, smooth, no vertex-ring banding) + a view-facing fresnel that keeps
     the silhouette soft/translucent (the map reads through the edges), a narrow internal light
     core over a softer body wash (light living INSIDE the tube, not painted on it), a faint
     frosted rim-light at the very edge, and a faint back wall (DoubleSide) so the tube reads
     as a volume, not a billboard. All knobs live in PILLAR_TUNE. */
  function pillarGlassMat() {
    const T2 = PILLAR_TUNE;
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {
        uBase:  { value: new THREE.Vector3(...T2.base) },
        uMid:   { value: new THREE.Vector3(...T2.mid) },
        uCoral: { value: new THREE.Vector3(...T2.coral) },
        uTip:   { value: new THREE.Vector3(...T2.tip) },
        uFres:  { value: T2.fresnel }, uCore: { value: T2.core }, uRim: { value: T2.rim },
        uA0:    { value: T2.alphaBase }, uA1: { value: T2.alphaTip },
      },
      vertexShader: `
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);   /* view-space — safe under the animated z-scale */
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uBase, uMid, uCoral, uTip;
        uniform float uFres, uCore, uRim, uA0, uA1;
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          float u = vUv.y;                                   /* 0 = base, 1 = tip */
          vec3 col = mix(uBase, uMid, smoothstep(0.02, 0.52, u));
          col = mix(col, uCoral, smoothstep(0.48, 0.80, u));
          col = mix(col, uTip,  smoothstep(0.74, 1.00, u));
          float facing = abs(dot(normalize(vN), normalize(vV)));   /* 1 = core, 0 = silhouette */
          /* frosted shell: alpha melts wide + soft at the edge (no hard cut) */
          float alpha = mix(uA0, uA1, u);
          alpha *= mix(1.0, 0.22 + 0.78 * smoothstep(0.02, 0.72, facing), uFres);
          /* inner light: a soft broad body wash + a narrower hot core down the middle */
          col += col * (0.20 * facing + uCore * pow(facing, 3.0));
          /* frosted rim catch-light right at the silhouette, just before it melts away */
          col += uTip * uRim * pow(1.0 - facing, 3.0);
          col += uTip * 0.30 * smoothstep(0.84, 1.0, u);     /* tip blooms into the cap */
          if (!gl_FrontFacing) alpha *= 0.28;                /* faint far wall through the glass */
          gl_FragColor = vec4(col, alpha);
        }`
    });
  }
  /* Google "G" silhouette (white on transparent) — used as an alphaMap for the etched back logo */
  function gLogoTex() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'); const cx = 128, cy = 128, r = 82, lw = 34;
    x.strokeStyle = '#fff'; x.lineWidth = lw; x.lineCap = 'butt';
    x.beginPath(); x.arc(cx, cy, r, -Math.PI * 0.30, Math.PI * 1.42, false); x.stroke();  // C-ring, gap lower-right
    x.lineWidth = lw; x.beginPath();                                                        // the G crossbar
    x.moveTo(cx + r - lw / 2, cy); x.lineTo(cx + 4, cy); x.stroke();
    x.lineCap = 'round'; x.lineWidth = 0.1;
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  /* chart ribbon (chart-panel px → local: panel origin (20,272)) */
  const ribbonPts = [];
  for (let i = 0; i <= 60; i++) {
    const [cx2, cy] = curvePoint(i / 60);
    const [lx, ly] = px2l(20 + (cx2 - 20), 272 + (cy - 272));
    const liftP = Math.sin((i / 60) * Math.PI);
    ribbonPts.push(new THREE.Vector3(lx, ly, D / 2 + .012 + .020 * liftP));  /* whisper of lift — hugs the 2D line */
  }
  const ribbonCurve = new THREE.CatmullRomCurve3(ribbonPts);
  const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 120, .0072, 10);
  {
    const pos = ribbonGeo.attributes.position, cnt = pos.count, col = new Float32Array(cnt * 3);
    const stops = [[246,160,55],[237,98,102],[232,36,157],[109,89,219]];
    for (let i = 0; i < cnt; i++) {
      const u = Math.floor(i / (cnt / 121)) / 120;
      const s = Math.min(2.999, u * 3), si = Math.floor(s), f2 = s - si;
      col[i * 3] = lerp(stops[si][0], stops[si + 1][0], f2) / 255;
      col[i * 3 + 1] = lerp(stops[si][1], stops[si + 1][1], f2) / 255;
      col[i * 3 + 2] = lerp(stops[si][2], stops[si + 1][2], f2) / 255;
    }
    ribbonGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const ribbon = new THREE.Mesh(ribbonGeo, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  ribbon.visible = false; ribbon.renderOrder = 2; phone.add(ribbon);
  const RIBIDX = ribbonGeo.index.count;
  /* area-fill curtain — the app's under-curve gradient (magenta .50 → violet .20 → transparent),
     a vertical strip from the tube down to the px-540 baseline, draw-synced with the ribbon */
  const CURT_COLS = 121;
  const curtGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(CURT_COLS * 2 * 3);
    const col = new Float32Array(CURT_COLS * 2 * 4);   /* RGBA — vertex alpha */
    const yBaseL = px2l(0, 540)[1], yPeakL = px2l(0, PEAK[1])[1];
    const MAG = [232 / 255, 36 / 255, 157 / 255], VIO = [109 / 255, 89 / 255, 219 / 255];
    const aGrad = u => u < .45
      ? [...MAG.map((c2, j) => lerp(c2, VIO[j], u / .45)), lerp(.50, .20, u / .45)]
      : [...VIO, lerp(.20, 0, (u - .45) / .55)];
    for (let i = 0; i < CURT_COLS; i++) {
      const p = ribbonCurve.getPointAt(i / (CURT_COLS - 1));   /* arc-length — matches the tube's drawRange front */
      const u = clamp01((yPeakL - p.y) / (yPeakL - yBaseL));
      pos.set([p.x, p.y, p.z - .004, p.x, yBaseL, D / 2 + .006], i * 6);
      const [r2, g2, b2, aT] = aGrad(u);
      col.set([r2, g2, b2, aT, ...VIO, 0], i * 8);             /* bottom row fully transparent */
    }
    const idx = [];
    for (let i = 0; i < CURT_COLS - 1; i++) {
      const a = i * 2, b2 = i * 2 + 1, c2 = i * 2 + 2, d2 = i * 2 + 3;
      idx.push(a, b2, c2, c2, b2, d2);
    }
    curtGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    curtGeo.setAttribute('color', new THREE.BufferAttribute(col, 4));
    curtGeo.setIndex(idx);
  }
  const curtain = new THREE.Mesh(curtGeo, new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false }));
  curtain.visible = false; curtain.renderOrder = 1; phone.add(curtain);
  const CURTIDX = (CURT_COLS - 1) * 6;
  /* comet head — the bright draw-front riding the curve tip */
  const comet = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('#E8249D'),
    blending: THREE.AdditiveBlending, transparent: true, depthTest: false, opacity: 0 }));
  comet.scale.setScalar(.10); phone.add(comet);
  /* app-style marker at the peak: aurora ring + white core (under the ₹2,486 chip) */
  const peakGrp = new THREE.Group();
  { const [lx, ly] = px2l(PEAK[0], PEAK[1]); peakGrp.position.set(lx, ly, D / 2 + .036); }
  peakGrp.add(new THREE.Mesh(new THREE.TorusGeometry(.016, .0035, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xE8249D, toneMapped: false, transparent: true, opacity: 0 })));
  peakGrp.add(new THREE.Mesh(new THREE.SphereGeometry(.007, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0 })));
  peakGrp.visible = false; phone.add(peakGrp);
  const tipSp = chipSprite(['+₹2,486', 'Peak Sales · 🔊 Spoken'], 200, 84);
  { const [lx, ly] = px2l(20 + PEAK[0] - 20, 272 + PEAK[1] - 272);
    tipSp.position.set(lx, ly + .07, D / 2 + .15); }
  tipSp.material.opacity = 0; phone.add(tipSp);

  /* donut staircase */
  const donutGrp = new THREE.Group();
  let donutBaseY = 0;
  { const [lx, ly] = px2l(206, 330); donutGrp.position.set(lx, ly, D / 2 + .006); donutBaseY = ly; }
  donutGrp.visible = false; phone.add(donutGrp);
  const R_IN = 79 * k, R_OUT = 105 * k;
  const stepMeshes = [];
  /* the app's GLASS staircase: translucent tread (α.34, +12% white) + the BORDER carries the
     full-strength category colour + an additive neon spine along the top-outer arc */
  const lighten = (hex, f) => '#' + [1, 3, 5].map(i => {
    const c2 = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(c2 + (255 - c2) * f).toString(16).padStart(2, '0'); }).join('');
  { let acc = 0;
    DONUT_DATA.forEach(d => {
      const fr = d.v / 18640;
      const a0 = Math.PI / 2 - acc * Math.PI * 2, a1 = a0 - fr * Math.PI * 2 + 0.015;
      const sh = new THREE.Shape();
      sh.absarc(0, 0, R_OUT, a0, a1, true);
      sh.absarc(0, 0, R_IN, a1, a0, false);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, curveSegments: 40 });
      const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({
        color: lighten(d.c, .12), transparent: true, opacity: .34,
        roughness: .22, metalness: 0, clearcoat: .6, clearcoatRoughness: .25,
        envMapIntensity: .9, side: THREE.DoubleSide, depthWrite: false }));
      m.renderOrder = 2;
      const rim2 = new THREE.LineSegments(new THREE.EdgesGeometry(g, 25),
        new THREE.LineBasicMaterial({ color: d.c, transparent: true, opacity: .9, toneMapped: false }));
      rim2.renderOrder = 3; m.add(rim2);               /* child → inherits the stand-up scale.z */
      /* neon spine along the top-outer arc (fakes the app's blurred glow tube) */
      const arcPts = []; const NA = 24;
      for (let i2 = 0; i2 <= NA; i2++) { const a = a0 + (a1 - a0) * i2 / NA;
        arcPts.push(new THREE.Vector3(Math.cos(a) * (R_OUT - .002), Math.sin(a) * (R_OUT - .002), 0)); }
      const spine = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), NA, .005, 6),
        new THREE.MeshBasicMaterial({ color: d.c, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      spine.renderOrder = 4; donutGrp.add(spine);      /* sibling — z follows the step height in state */
      m.scale.z = .001; donutGrp.add(m); stepMeshes.push({ m, spine, h: d.h });
      acc += fr;
    });
  }
  /* soft ground shadow under the glass ring */
  const dShadowTex = (() => { const c2 = document.createElement('canvas'); c2.width = c2.height = 128;
    const y = c2.getContext('2d'); const g = y.createRadialGradient(64, 64, 10, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,.20)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    y.fillStyle = g; y.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c2); })();
  const dShadow = new THREE.Mesh(new THREE.CircleGeometry(R_OUT * 1.3, 48),
    new THREE.MeshBasicMaterial({ map: dShadowTex, transparent: true, depthWrite: false, opacity: 0 }));
  dShadow.position.z = .0004; dShadow.renderOrder = 1; donutGrp.add(dShadow);
  const dcap = chipSprite(['₹18,640', 'collected'], 210, 90);
  dcap.position.set(0, 0, .26); dcap.material.opacity = 0;
  dcap.renderOrder = 6;                                  /* above the steps (2/3) + spines (4) — they'd paint over the chip */
  donutGrp.add(dcap);

  /* map towers (map px (mx,my) → screen px (18+mx, 130+my*520/560)) */
  const towerGrp = new THREE.Group(); towerGrp.visible = false; phone.add(towerGrp);
  const towers = [];
  /* GLASS PILLARS rising out of the map: frosted translucent cylinder with an internal light
     (per-fragment violet→magenta→coral→cream ramp — see pillarGlassMat) + an additive vertical
     bloom bar + a warm cream light-cap + a ringed reflection pool + a floating "N · ₹X.Xk" pill */
  const pillarGlow = pillarGlowTex(), pillarPool = poolTex();
  /* pin scale: cancel the map beat's phone scale so the pins read the SAME size at every viewport
     (on mobile the phone shrinks to ~.55, which is what made the amounts illegible there) */
  const PIN_F = .0011 * 1.38 / mapS();
  PINS.forEach((p2) => {
    const [lx, ly] = px2l(18 + p2.mx, 130 + p2.my * (520 / 560));
    /* radius tiers by height (reference look): fat hero · medium flanks · thin candles */
    const rB = p2.well ? .038 : p2.h >= .10 ? .030 : .024,
          rT = p2.well ? .027 : p2.h >= .10 ? .021 : .017;
    const g = new THREE.CylinderGeometry(rT, rB, 1, 28, 1, true);   /* gradient is per-fragment now — no height rings needed; 28 radial segs for a round silhouette */
    g.rotateX(Math.PI / 2); g.translate(0, 0, .5);        // axis → local +z, base z=0 → tip z=1
    const shaft = new THREE.Mesh(g, pillarGlassMat());
    shaft.position.set(lx, ly, D / 2 + .004); shaft.scale.z = .001; shaft.renderOrder = 4; towerGrp.add(shaft);
    /* additive vertical bloom bar around the shaft */
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: pillarGlow,
      blending: THREE.AdditiveBlending, transparent: true, depthTest: false, opacity: 0, toneMapped: false }));
    glow.center.set(.5, .5); glow.renderOrder = 3; towerGrp.add(glow);
    /* hot footprint pool on the map — tracks the shaft radius so bars sit anchored */
    const foot = new THREE.Mesh(new THREE.CircleGeometry(rB * 2, 32),
      new THREE.MeshBasicMaterial({ map: pillarPool, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }));
    foot.position.set(lx, ly, D / 2 + .0035); foot.renderOrder = 2; towerGrp.add(foot);
    /* warm cream light-cap (flattened dome — a circular light source, not a ball) + additive halo */
    const tip2 = new THREE.Mesh(new THREE.SphereGeometry(rT * 1.05, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0xfff2dc, toneMapped: false, transparent: true }));
    tip2.scale.z = .72;                                    /* dome, not sphere — reads as a glowing cap */
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('#ffd9a0'),
      blending: THREE.AdditiveBlending, transparent: true, depthTest: false, opacity: 0, toneMapped: false }));
    halo.scale.setScalar(.04 + .20 * p2.h);                /* halo grows with the bar — the hero crowns hottest, candles stay modest */
    tip2.position.set(lx, ly, D / 2 + .004); halo.position.copy(tip2.position);
    towerGrp.add(tip2); towerGrp.add(halo);
    /* floating pill label — "N · ₹X.Xk" (or just ₹X for single payments) */
    const label = p2.count > 1 ? p2.count + ' · ' + fmtK(p2.value) : fmtK(p2.value);
    const pill = pinSprite(label, PIN_F);
    pill.material.opacity = 0; pill.renderOrder = 5; towerGrp.add(pill);
    towers.push({ shaft, glow, tip: tip2, halo, foot, pill, h: p2.h, well: !!p2.well,
      lx, ly, chipZ: p2.chipZ || 0, rB });
  });

  /* mode card — a real card that lifts off and flips */
  const CARD_W = 372 * k, CARD_H = 180 * k;
  const cardGrp = new THREE.Group();
  { const [lx, ly] = px2l(206, 212); cardGrp.position.set(lx, ly, D / 2 + .012); }
  cardGrp.visible = false; phone.add(cardGrp);
  function cardFace(face, peek = 0) {
    const w2 = 372, h2 = 180;
    const c = document.createElement('canvas'); c.width = w2 * 2; c.height = h2 * 2;
    const y = c.getContext('2d'); y.scale(2, 2);
    y.beginPath(); y.roundRect(0, 0, w2, h2, 26);
    const g = y.createLinearGradient(0, 0, w2 * .4, h2);
    g.addColorStop(0, 'rgba(42,31,110,1)'); g.addColorStop(1, 'rgba(28,20,80,1)');
    y.fillStyle = g; y.fill();
    y.save(); y.clip();
    const cg = y.createRadialGradient(w2, -20, 0, w2, -20, w2 * .9);
    cg.addColorStop(0, 'rgba(232,36,157,.40)'); cg.addColorStop(.32, 'rgba(246,160,55,.16)'); cg.addColorStop(.6, 'rgba(0,0,0,0)');
    y.fillStyle = cg; y.fillRect(0, 0, w2, h2);
    y.restore();
    y.beginPath(); y.roundRect(.5, .5, w2 - 1, h2 - 1, 26); y.strokeStyle = 'rgba(255,255,255,.14)'; y.stroke();
    const F2 = (wt, sz, fam = 'Inter') => { y.font = `${wt} ${sz}px "${fam}"`; };
    if (face === 'bal') {
      y.fillStyle = C.credit; y.beginPath(); y.arc(26, 30, 3.5, 0, 7); y.fill();
      F2(500, 12.5); y.fillStyle = C.t2; y.fillText('Daily Settlement', 36, 34.5);
      y.beginPath(); y.roundRect(252, 17, 100, 27, 14); y.fillStyle = 'rgba(255,255,255,.10)'; y.fill();
      y.strokeStyle = 'rgba(255,255,255,.20)'; y.stroke();
      F2(600, 11); y.fillStyle = '#fff'; y.fillText('🔊 Soundbox ON', 262, 35);
      F2(700, 43, SG); y.fillStyle = '#fff'; y.fillText('₹48,250', 22, 92);
      const aw = y.measureText('₹48,250').width;
      F2(600, 26, SG); y.globalAlpha = .7; y.fillText('.00', 22 + aw + 6, 92); y.globalAlpha = 1;
      [[22, 'HDFC ••1234', '₹32,400'], [196, 'SBI ••0398', '₹15,850']].forEach(([cx2, lbl, val]) => {
        y.beginPath(); y.roundRect(cx2, 112, 154, 50, 14); y.fillStyle = 'rgba(255,255,255,.07)'; y.fill();
        y.strokeStyle = 'rgba(255,255,255,.14)'; y.stroke();
        F2(500, 11); y.fillStyle = 'rgba(255,255,255,.8)'; y.fillText(lbl, cx2 + 12, 131);
        F2(600, 15, SG); y.fillStyle = '#fff'; y.fillText(val, cx2 + 12, 152);
      });
    } else {
      F2(500, 12.5); y.fillStyle = C.t2; y.fillText('Today\'s Collections', 22, 34.5);
      const lit = peek > .5;
      y.beginPath(); y.roundRect(248, 16, 104, 28, 14);
      y.fillStyle = lit ? 'rgba(61,220,151,.16)' : 'rgba(255,255,255,.10)'; y.fill();
      y.strokeStyle = lit ? 'rgba(61,220,151,.34)' : 'rgba(255,255,255,.20)'; y.stroke();
      y.save(); y.translate(258, 23); y.scale(14 / 24, 14 / 24);
      y.strokeStyle = lit ? C.credit : '#fff'; y.lineWidth = 1.8 * 24 / 14; y.lineCap = 'round'; y.lineJoin = 'round';
      y.stroke(new Path2D(lit ? ICO.eye : ICO.eyeS)); y.restore();
      if (lit) { y.fillStyle = C.credit; y.beginPath(); y.arc(265, 30, 2.1, 0, 7); y.fill(); }
      F2(600, 11); y.fillStyle = lit ? C.credit : '#fff'; y.fillText('🔊 Soundbox Live', 278, 35);
      F2(700, 43, SG); y.fillStyle = '#fff'; y.fillText('₹18,640', 22, 92);
      F2(500, 12.5); y.fillStyle = C.t2; y.fillText('47 payments announced · Today', 22, 116);
      if (peek > 0.01) {
        y.globalAlpha = peek;
        y.fillStyle = C.credit; y.beginPath(); y.arc(28, 146, 3.5, 0, 7); y.fill();
        F2(500, 12); y.fillStyle = C.t2; y.fillText('Settlement', 38, 150);
        F2(500, 10.5); y.fillStyle = C.t3; y.fillText('encrypted offline storage', 104, 150);
        F2(700, 18, SG); y.fillStyle = '#fff'; y.textAlign = 'right'; y.fillText('₹48,250', 350, 151);
        y.textAlign = 'left'; y.globalAlpha = 1;
      }
    }
    return c;
  }
  const cardTexA = new THREE.CanvasTexture(cardFace('bal'));  cardTexA.colorSpace = THREE.SRGBColorSpace;
  const cardTexB = new THREE.CanvasTexture(cardFace('spend')); cardTexB.colorSpace = THREE.SRGBColorSpace;
  /* the card slab — TRUE rounded corners (the app card's 26px radius). A RoundedBox's
     3D corner radius is capped by the thin depth, which left square-ish corners poking
     past the rounded faces — they caught the specular as white nubs (red-pen 2026-07-07). */
  const cardBodyGeo = new THREE.ExtrudeGeometry(rrShape(CARD_W - .004, CARD_H - .004, 26 * k), {
    depth: .012, bevelEnabled: true, bevelThickness: .002, bevelSize: .002, bevelSegments: 2, curveSegments: 24 });
  cardBodyGeo.translate(0, 0, -.006);
  const cardBody = new THREE.Mesh(cardBodyGeo,
    new THREE.MeshPhysicalMaterial({ color: 0x231a58, metalness: .2, roughness: .35, clearcoat: .8 }));
  cardGrp.add(cardBody);
  const faceA = new THREE.Mesh(roundedPlane(CARD_W - .004, CARD_H - .004, .044),
    new THREE.MeshBasicMaterial({ map: cardTexA, toneMapped: false }));
  faceA.position.z = .0085; cardGrp.add(faceA);
  const faceB = new THREE.Mesh(roundedPlane(CARD_W - .004, CARD_H - .004, .044),
    new THREE.MeshBasicMaterial({ map: cardTexB, toneMapped: false }));
  faceB.position.z = -.0085; faceB.rotation.x = Math.PI; cardGrp.add(faceB);

  /* ════════════════ STAGING (per-beat phone transforms) ══════════════════ */
  /* visH / visW / xAt / zForW / mapS are defined up with the phone dims (the map pins need them) */
  const TAU = Math.PI * 2;
  const STAGE = MOB ? {                                  /* ░ MOBILE staging — no side columns: the copy is a
                                                              top band, the phone owns the lower two-thirds ░ */
    hero:  () => ({ x: 0, y: 0.02, z: 0, rx: 0, ry: 0, rz: 0, s: .74 }),
    cap:   () => ({ x: 0, y: -0.30, z: .3, rx: 0, ry: TAU, rz: -.03, s: .80 }),
    chart: () => ({ x: 0, y: -0.26, z: .9, rx: 0, ry: TAU + .30, rz: .02, s: .78 }),
    donut: () => ({ x: 0, y: -0.26, z: .9, rx: 0, ry: TAU - .30, rz: -.02, s: .78 }),
    map:   () => ({ x: 0, y: -0.26, z: .85, rx: -1.12, ry: TAU, rz: Math.PI / 2, s: mapS() }),  /* landscape lie sized to the narrow viewport; ry MUST be exactly TAU */
    mode:  () => ({ x: 0, y: -0.28, z: .35, rx: 0, ry: TAU - .12, rz: 0, s: .80 }),
    glan:  () => ({ x: 0, y: -0.15, z: .2, rx: 0, ry: 0, rz: 0, s: .82 }),
    dive:  () => { const [lx, ly] = px2l(206, 558);      /* zoom until the WIDGET spans ~92% of the narrow width (main widget centre — it lives at the bottom of the stack now) */
      return { x: -lx, y: -ly, z: Math.min(3.08, zForW(340 * k / .92)), rx: 0, ry: 0, rz: 0, s: 1 }; },
    zout:  () => ({ x: 0, y: -0.18, z: .2, rx: 0, ry: 0, rz: 0, s: .78 }),
  } : {                                                  /* ░ the staging table ░ */
    hero:  () => ({ x: 0, y: 0.02, z: 0, rx: 0, ry: 0, rz: 0, s: .74 }),  /* buttermax pose: upright, dead-centre in front of the wordmark */
    cap:   () => ({ x: xAt(.71, 0), y: -0.06, z: 0, rx: 0, ry: TAU, rz: -.045, s: .92 }),
    chart: () => ({ x: xAt(.225, 1.7), y: -0.04, z: 1.7, rx: 0, ry: TAU + .50, rz: .02, s: 1 }),
    donut: () => ({ x: xAt(.765, 1.55), y: -0.02, z: 1.55, rx: 0, ry: TAU - .48, rz: -.02, s: 1 }),
    map:   () => ({ x: 0, y: -0.56, z: .85, rx: -1.12, ry: TAU, rz: Math.PI / 2, s: mapS() }),  /* LANDSCAPE flat lie (roll 90° + near-flat pitch) — pillars rise world-up; ry MUST be exactly TAU or the pillar field yaws */
    mode:  () => ({ x: xAt(.72, .35), y: -0.10, z: .35, rx: 0, ry: TAU - .12, rz: 0, s: .95 }),
    glan:  () => ({ x: 0, y: -0.15, z: .2, rx: 0, ry: 0, rz: 0, s: .9 }),  /* one reverse spin */
    dive:  () => { const [lx, ly] = px2l(206, 558); return { x: -lx, y: -ly + DIVE_LIFT, z: 3.08, rx: 0, ry: 0, rz: 0, s: 1 }; },  /* main widget centre — bottom of the stack, lifted clear of the copy */
    zout:  () => ({ x: 0, y: -0.18, z: .2, rx: 0, ry: 0, rz: 0, s: .86 }),  /* pull back out of the widget */
  };
  const seg = (key, t, d) => ['x','y','z','rx','ry','rz','s'].map(p2 => ({ p: p2, v: () => STAGE[key]()[p2], t, d }));
  const TRACK = [                                        /* ordered chain segments per property */
    ...seg('cap', CAPM, CAPD),
    ...seg('chart', CHARTM, CHMD),
    ...seg('donut', DONUTM, DOMD),
    ...seg('map', MAPM, MAMD),
    ...seg('mode', MODEM, MOMD),
    ...seg('glan', GLANM, GLMD),
    ...seg('dive', DIVE, DIVD),
    ...seg('zout', ZOUT, ZOUTD),
  ];
  function phoneState(T) {
    const out = {};
    ['x','y','z','rx','ry','rz','s'].forEach(p2 => {
      let v = STAGE.hero()[p2];
      for (const sg2 of TRACK) if (sg2.p === p2) v = lerp(v, sg2.v(), io(T, sg2.t, sg2.d));
      out[p2] = v;
    });
    /* the recede: shrink + settle away under the rising outro (seamless, no cut) */
    const rec = io(T, RECEDE, RECD);
    out.y -= rec * .85; out.z -= rec * 2.1;
    return out;
  }

  /* ════════════════ DOM hooks ════════════════════════════════════════════ */
  const $ = s => document.querySelector(s);
  const els = {
    heroCopy: $('.b-hero .binner'), heroBeat: $('.beat.b-hero'), heroBottom: $('.hero-bottom'),
    capBeat: $('.beat.b-capture'), capCopy: $('.b-capture .binner'),
    chBeat: $('.beat.b-chart'), chCopy: $('.b-chart .binner'),
    doBeat: $('.beat.b-donut'), doCopy: $('.b-donut .binner'),
    whBeat: $('.beat.b-where'), whCopy: $('.b-where .binner'),
    moBeat: $('.beat.b-mode'), moCopy: $('.b-mode .binner'),
    wgBeat: $('.beat.b-widget'), wgCopy: $('.b-widget .binner'),
    lgBeat: $('.beat.b-legible'), lgCopy: $('.b-legible .binner'),
    nav: $('.sitenav'), rail: $('#rail'),
    blG: $('.bl-g'), blS: $('.bl-s'), blM: $('.bl-m'), blV: $('.bl-v'), blA: $('.bl-a'), blC: $('.bl-c'),
  };
  const chips = [1, 2, 3, 4, 5].map(n => $(`[data-p="${n}"]`));
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger, Lenis = window.Lenis;
  gsap.registerPlugin(ScrollTrigger);
  /* desktop: side-column copy is vertically centred; mobile: it's a top band (no shift) */
  if (!MOB) gsap.set('.b-capture .binner, .b-chart .binner, .b-donut .binner, .b-mode .binner', { yPercent: -50 });

  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.35, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    window.__lenis = lenis;
  }
  /* the story must always boot at T=0 — force the top on load (belt to the head-script's
     scrollRestoration='manual'), and reset Lenis's own position so the scrub can't ease back */
  window.scrollTo(0, 0);
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });

  /* magnetic CTAs */
  document.querySelectorAll('.hero-bottom .btn, .outro .btn').forEach(b => {
    const qx = gsap.quickTo(b, 'x', { duration: .4, ease: 'power3.out' });
    const qy = gsap.quickTo(b, 'y', { duration: .4, ease: 'power3.out' });
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect();
      qx((e.clientX - r.left - r.width / 2) * .22); qy((e.clientY - r.top - r.height / 2) * .3); });
    b.addEventListener('mouseleave', () => { qx(0); qy(0); });
  });
  /* ── pink-over-text: rasterize the DOM wordmark into a canvas the ink shader
        uses as a glyph mask (glyph ∧ blob → solid pink). Re-done on resize. ── */
  function rasterizeWordmark() {
    const main = document.querySelector('.wm-main');
    if (!main) return null;
    /* measure at rest — the cursor-board transform is re-applied per-frame as the
       ink's uGlyphShift, so the mask itself must be in untransformed space */
    const bx = gsap.getProperty(heroword, 'x'), by = gsap.getProperty(heroword, 'y');
    gsap.set(heroword, { x: 0, y: 0 });
    try { return rasterizeAtRest(main); } finally { gsap.set(heroword, { x: bx, y: by }); }
  }
  function rasterizeAtRest(main) {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);     // match heroink's dprCap
    const c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(innerWidth * dpr));
    c.height = Math.max(2, Math.round(innerHeight * dpr));
    const x = c.getContext('2d');
    if (!x) return null;
    x.scale(dpr, dpr); x.fillStyle = '#fff';
    const mainCS = getComputedStyle(main);
    x.font = `${mainCS.fontWeight} ${mainCS.fontSize} "Space Grotesk"`;
    if (mainCS.letterSpacing !== 'normal' && 'letterSpacing' in x) x.letterSpacing = mainCS.letterSpacing;
    x.textBaseline = 'alphabetic';
    for (const sel of ['.w1', '.w2']) {
      const el = main.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const txt = el.textContent.toUpperCase();
      const m = x.measureText(txt);
      const asc = m.fontBoundingBoxAscent ?? parseFloat(mainCS.fontSize) * .8;
      const desc = m.fontBoundingBoxDescent ?? parseFloat(mainCS.fontSize) * .2;
      /* line-height < 1 → negative half-leading; baseline from the line-box top */
      x.fillText(txt, r.left, r.top + (r.height - (asc + desc)) / 2 + asc);
    }
    const script = document.querySelector('.wm-script');
    if (script) {
      const sCS = getComputedStyle(script);
      x.font = `${sCS.fontWeight} ${sCS.fontSize} "Permanent Marker"`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      const rot = -6 * Math.PI / 180;                     // the AABB centre is rotation-invariant
      for (const li of script.querySelectorAll('i')) {
        const r = li.getBoundingClientRect();
        x.save(); x.translate(r.left + r.width / 2, r.top + r.height / 2); x.rotate(rot);
        x.fillText(li.textContent, 0, 0); x.restore();
      }
    }
    return c;
  }
  const rasterMask = () => ink?.setGlyphMask(rasterizeWordmark());

  /* load intro — block rises, then "tracker" hand-writes itself
     (one-shot set-pieces; only their exit envelope is T-pure) */
  gsap.from('.heroword .hline > span', { yPercent: 115, duration: 1.15, ease: 'power4.out', stagger: .12, delay: .15 });
  gsap.delayedCall(.75, () => heroword?.classList.add('draw'));
  /* mask only after the rise (ends ~1.42s) + the tracker draw (ends ~1.27s) settle */
  gsap.delayedCall(1.45, rasterMask);
  gsap.from('.b-hero .hero-tag', { autoAlpha: 0, y: 14, duration: .9, ease: 'power3.out', delay: .1 });
  gsap.from('.b-hero .sub', { autoAlpha: 0, y: 22, duration: 1.0, ease: 'power3.out', delay: .55 });
  gsap.from('.hero-bottom .hbin', { autoAlpha: 0, y: 22, duration: 1.0, ease: 'power3.out', delay: .5 });

  /* rail */
  const RAILT = { hero: 0, capture: 4.4, insights: 11.8, mode: 30.2, glance: 38.2 };
  const railNodes = [...document.querySelectorAll('#rail .rnd')];
  const railFills = [...document.querySelectorAll('#rail .rln i')];
  const railAnch = railNodes.map(n => RAILT[n.dataset.t]);
  railNodes.forEach(n => n.addEventListener('click', () => {
    const y = (RAILT[n.dataset.t] / DUR) * ($('#scrolly').offsetHeight - innerHeight);
    if (lenis) lenis.scrollTo(y, { duration: 2.4 }); else scrollTo({ top: y, behavior: 'smooth' });
  }));

  /* hero mouse parallax — envelope-scrubbed (pure in T past the hero) */
  let mx = 0, my = 0, mouseSeen = false;                 /* no poke until a REAL pointer shows up */
  addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1;
    mouseSeen = true;
  });
  const heroEnv = T => 1 - out3(T, .55, .45);

  /* ════════════════ THE PURE STATE ═══════════════════════════════════════ */
  let smx = 0, smy = 0;                                  /* smoothed mouse */
  let lastKey = '', lastPeek = '0.00';
  const v3 = new THREE.Vector3();

  /* ── the poke toy (hero-only) — real-time one-shots, same purity exception
        as the load intro: cursor crossing ONTO the phone fires a ripple + a fun
        payment row on the screen; every 5th poke → the "ravenous spender" toast */
  const pokeRay = new THREE.Raycaster(), pokeNDC = new THREE.Vector2();
  const ripples = [], funRows = [];
  let pokeWasOn = false, pokeCount = 0, pokePulse = -1e3, toastIdx = 0, toastTimer = 0, funSeq = 0;
  const FUN_PAYEES = [
    { person: false, nm: 'PhonePe · Rohan',        cat: '🔊 "PhonePe par ₹500 prapt hue"', val: '+₹500', credit: true },
    { person: false, nm: 'Google Pay · Priya',     cat: '🔊 "Received ₹1,200 on GPay"',    val: '+₹1,200', credit: true },
    { person: true,  nm: 'Paytm QR · Vijay',       cat: '🔊 "Paytm par ₹385 prapt hue"',   val: '+₹385', credit: true },
    { person: false, nm: 'BHIM UPI · Rajesh',      cat: '🔊 "Received ₹150 via BHIM"',     val: '+₹150', credit: true },
    { person: false, nm: 'HDFC Bank SMS',          cat: '🔊 "Account credited ₹4,500"',    val: '+₹4,500', credit: true },
    { person: true,  nm: 'Chai Counter · Cash',    cat: 'Recorded in Ledger',              val: '+₹20', credit: true },
  ];
  const TOAST_LINES = [
    '🔊 "PhonePe par 500 rupaye prapt hue!" Instant spoken alert — zero hardware rent.',
    'Another payment announced! Crystal-clear Hindi & English through your Bluetooth speaker.',
    '100% Offline & Private: Never leaked to third-party cloud servers. Local SQLite only.',
    'PhonePe, GPay, Paytm, BHIM, Bank SMS — announced in real-time. Download the app now 👇',
  ];
  const toastEl = document.getElementById('poketoast');

  function screenMix(T) {                                /* which screens, what alphas */
    const heroFA = 1 - io(T, 2.1, .6);                   /* spend face → home, hidden by the flip (screen away ~T2.4) */
    const homeA = io(T, 2.1, .6) * (1 - io(T, 10.0, .8));
    const chartA = io(T, 10.0, .8) * (1 - io(T, 15.7, .8));
    const donutA = io(T, 15.7, .8) * (1 - io(T, 22.9, .8));
    const mapA = io(T, 22.9, .8) * (1 - io(T, 28.5, .8));
    const modeA = io(T, 28.5, .8) * (1 - io(T, 36.3, .45));
    const launchA = io(T, 36.35, .45);
    return { heroFA, homeA, chartA, donutA, mapA, modeA, launchA };
  }

  function state(T, t) {
    /* ── phone transform ── */
    const ps = phoneState(T);
    phonePos.position.set(ps.x, ps.y, ps.z);
    phonePos.rotation.set(ps.rx, 0, ps.rz);
    phone.rotation.y = ps.ry;
    phonePos.scale.setScalar(ps.s);
    /* hero idle: buttermax device — hangs still, only DRIFTS toward the cursor
       (no autonomous tumble); envelope-scrubbed so T≥1 is untouched */
    const env = heroEnv(T);
    smx = lerp(smx, mx, .09); smy = lerp(smy, my, .09);
    phoneIdle.position.x =  smx * .07 * env;
    phoneIdle.position.y = -smy * .05 * env;
    phoneIdle.position.z = 0;
    phoneIdle.rotation.y =  smx * .26 * env;             /* gentle yaw toward the cursor */
    phoneIdle.rotation.x = -smy * .14 * env;
    phoneIdle.rotation.z = 0;

    /* ── poke toy: hover-ENTER on the screen mesh → ripple + payment + wobble ── */
    if (T < 0.9 && env > .5 && mouseSeen) {
      pokeNDC.set(mx, -my); pokeRay.setFromCamera(pokeNDC, camera);
      const hit = pokeRay.intersectObject(screen, false)[0];
      if (hit && !pokeWasOn) {
        ripples.push({ sx: hit.uv.x * SW, sy: (1 - hit.uv.y) * SH, t0: t });
        if (ripples.length > 4) ripples.shift();
        funRows.unshift({ row: { ...FUN_PAYEES[funSeq++ % FUN_PAYEES.length], tm: 'now' }, t0: t });
        if (funRows.length > 3) funRows.pop();
        pokePulse = t; pokeCount++;
        if (toastEl && pokeCount % 5 === 0) {
          const side = toastIdx % 2 ? 'tr' : 'tl';       /* once left, once right */
          toastEl.textContent = TOAST_LINES[toastIdx++ % TOAST_LINES.length];
          toastEl.classList.remove('tl', 'tr'); toastEl.classList.add(side, 'on');
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => toastEl.classList.remove('on'), 4000);
        }
      }
      pokeWasOn = !!hit;
    } else pokeWasOn = false;
    while (ripples.length && t - ripples[0].t0 > 1.0) ripples.shift();  /* dead rings out */
    const pw = Math.max(0, t - pokePulse);               /* poke wobble — decays in ~0.6s */
    phoneIdle.scale.setScalar(1 + .035 * Math.sin(pw * 20) * Math.exp(-pw * 5) * env);

    /* ── copy windows (copy fades during travel; lives in reserved zones) ── */
    const heroOut = out3(T, .62, .42);
    /* the whole hero "board" rides the cursor WITH the phone — wordmark, tagline
       AND CTAs get the SAME shift (one layer, no parallax split — red-pen round 6);
       the ink's glyph mask is screen-space, so it gets the same shift as a uniform */
    const wx = smx * 22 * env, wy = smy * 13 * env;
    gsap.set(els.heroCopy, { autoAlpha: 1 - heroOut, x: wx, y: wy - 50 * heroOut });
    gsap.set(els.heroBottom, { autoAlpha: 1 - heroOut, x: wx, y: wy + 36 * heroOut });
    gsap.set(els.heroBeat, { autoAlpha: 1 - heroOut > 0 ? 1 : 0 });
    if (heroword) gsap.set(heroword, { autoAlpha: 1 - heroOut, x: wx, y: wy });
    ink?.setGlyphShift(wx / innerWidth, wy / innerHeight);
    const win = (el, beat, a, b) => {
      const i2 = out3(T, a, .7), o2 = out3(T, b, .55);
      gsap.set(el, { autoAlpha: i2 * (1 - o2), y: 44 * (1 - i2) - 44 * o2 });
      gsap.set(beat, { autoAlpha: i2 * (1 - o2) > 0 ? 1 : 0 });
    };
    win(els.capCopy, els.capBeat, 3.55, CHARTM);
    win(els.chCopy, els.chBeat, CHARTM + CHMD - .25, DONUTM);
    win(els.doCopy, els.doBeat, DONUTM + DOMD - .25, MAPM);
    win(els.whCopy, els.whBeat, MAPM + MAMD - .2, MODEM);
    win(els.moCopy, els.moBeat, MODEM + MOMD - .2, GLANM);
    win(els.wgCopy, els.wgBeat, GLANM + GLMD - .2, DIVE + .2);       /* readable well before the dive */
    win(els.lgCopy, els.lgBeat, DIVE + DIVD - .3, ZOUT - .2);        /* "finally legible" during the hold */

    /* ── capture: chips fly + rows stack + tiles tick ── */
    const fresh = T > CAPM + CAPD * .5;
    let weekV = 4215, weekC = 11, monthV = 18640, monthC = 47, todayV = 1833, todayC = 4, flashA = 0;
    if (fresh) { weekV = 2382; weekC = 7; monthV = 16807; monthC = 43; todayV = 0; todayC = 0; }
    const rowE = [1, 1, 1, 1, 1];
    /* chip target: project the screen rows area (fresh matrix — jump/refresh-safe) */
    phonePos.updateMatrixWorld(true);
    v3.set(0, -0.12, D / 2).applyMatrix4(phone.matrixWorld);
    const pr = v3.project(camera);
    const tx = (pr.x * .5 + .5) * innerWidth, ty = (-pr.y * .5 + .5) * innerHeight;
    chips.forEach((el, i) => {
      const s = CHIP0 + i * CHIPD, c2 = CHIP[i];
      const a = lin(T, s, 1.0), b = in2(T, s + 1.0, .6);
      if (a <= 0 || b >= 1) gsap.set(el, { autoAlpha: 0 });
      else gsap.set(el, {
        x: lerp(innerWidth * c2.lane, tx, b),
        y: lerp(innerHeight * lerp(1.12, MOB ? .34 : -.06, a), ty, b),   /* mobile: chips stay clear of the top copy band */
        rotation: c2.spin * (1 - b), scale: lerp(.96, 1, a) * (1 - .62 * b),
        autoAlpha: Math.min(a * 4, 1) * (1 - b * b),
      });
      const f2 = s + 1.5;
      flashA = Math.max(flashA, out3(T, f2, .15) * (1 - out3(T, f2 + .15, .35)));
      const e = out3(T, s + 1.52, .5);
      rowE[i] = fresh ? e : 1;
      if (fresh && c2.dv) { const k2 = out3(T, s + 1.52, .45);
        weekV += c2.dv * k2; weekC += k2; monthV += c2.dv * k2; monthC += k2;
        todayV += c2.dv * k2; todayC += k2; }          /* the card's amount + budget ridge tick together */
    });
    const listen = fresh ? out3(T, CAPM + CAPD * .55, .4) * (1 - out3(T, CHIP0 + 1.4, .4)) : 0;

    /* ── chart ── */
    const drawP = out3(T, DRAW, 1.5);
    const areaA = .95 * out3(T, DRAW + .8, .8);
    const dotA = Math.min(drawP * 6, 1) * (1 - out3(T, TIP, .5));
    const ribP = out3(T, RIB, 1.3) * (1 - io(T, DONUTM + .4, .8));
    const lineA = 1 - .85 * out3(T, RIB + .25, .7);    /* 2D stroke recedes as the tube covers it (15% floor) */
    ribbon.visible = ribP > .002 && T < DONUTM + 2;
    if (ribbon.visible) ribbonGeo.setDrawRange(0, Math.floor(RIBIDX * clamp01(ribP)));
    curtain.visible = ribbon.visible;
    if (curtain.visible) curtGeo.setDrawRange(0, Math.floor((CURT_COLS - 1) * clamp01(ribP)) * 6);
    const cometA = clamp01(ribP * 9) * (1 - clamp01((ribP - .93) * 14)) * (ribbon.visible ? 1 : 0);
    comet.material.opacity = cometA;
    if (cometA > .01) {
      comet.position.copy(ribbonCurve.getPointAt(Math.min(.999, clamp01(ribP))));
      comet.position.z += .006;
      comet.scale.setScalar(.085 + .02 * Math.sin(T * 26));   /* T-pure shimmer (scrub-safe) */
    }
    const tipA = out3(T, TIP, .7) * (1 - io(T, DONUTM + .3, .6));
    tipSp.material.opacity = tipA;
    tipSp.position.z = D / 2 + .06 + .1 * out3(T, TIP, .9);
    peakGrp.visible = tipA > .01;
    if (peakGrp.visible) peakGrp.children.forEach(m2 => { m2.material.opacity = tipA; });

    /* ── donut ── */
    const sweep = out3(T, SWEEP, 1.4);
    const stand = io(T, STAND, STD) * (1 - io(T, MAPM + .3, .8));
    const ringA = 1 - clamp01(stand * 2.6);
    const centerA = out3(T, SWEEP + .5, .5) * (1 - clamp01(stand * 3.4));
    const legE = DONUT_DATA.map((d, i) => out3(T, SWEEP + .15 + i * .09, .5));
    donutGrp.visible = stand > .002;
    if (donutGrp.visible) {
      donutGrp.rotation.order = 'XYZ';
      donutGrp.rotation.x = -0.96 * stand;
      donutGrp.rotation.z = .28 * stand + .5 * lin(T, STAND + STD, 1.6);
      donutGrp.position.y = donutBaseY - .075 * stand;   /* settle a touch so the cap has air */
      /* float the hologram clear of the glass while tilted — the tilted ring's far side
         dips sin(.96)·R_OUT ≈ .15 BELOW the screen plane and the opaque screen mesh
         swallows it (the red-penned "top part is cut"); the lift keeps every point proud */
      donutGrp.position.z = D / 2 + .006 + .165 * stand;
      stepMeshes.forEach((s2, i) => {
        const e = io(T, STAND + .12 + i * .09, 1.0) * (1 - io(T, MAPM + .25, .7));
        s2.m.scale.z = Math.max(.001, s2.h * e);
        s2.spine.position.z = Math.max(.001, s2.h * e) + .002;
        s2.spine.material.opacity = .85 * clamp01(e * 2) * clamp01(stand * 3);
      });
      dShadow.material.opacity = .20 * stand;
      dcap.material.opacity = clamp01((stand - .4) * 2.6);
      dcap.position.z = .12 + .05 * stand;               /* hover just over the crown */
    }

    /* ── map neon pillars ── */
    const twrOn = io(T, TWR, .4) * (1 - io(T, MODEM + .25, .6));
    const mapDim = .62 * io(T, TWR, 1.2);               /* darken the map so the pillars pop */
    towerGrp.visible = twrOn > .002;
    if (towerGrp.visible) {
      const baseZ = D / 2 + .004;
      towers.forEach((tw, i) => {
        const e = oback(T, TWR + i * .07, .85) * (1 - io(T, MODEM + .2, .55));  /* back-out pop, staggered (9 bars share the beat window) */
        const ec = clamp01(e);
        const hz = tw.h * e;                              /* current pillar height */
        tw.shaft.scale.z = Math.max(.001, hz);
        /* bloom bar rides the shaft: centred at mid-height, scaled to width×height */
        tw.glow.position.set(tw.lx, tw.ly, baseZ + hz * .5);
        tw.glow.scale.set(tw.rB * 3.8, Math.max(.001, hz * 1.02), 1);   /* hugs the shaft — ×8 fogged into a blob on the fat well pillar */
        tw.glow.material.opacity = PILLAR_TUNE.glow * (tw.h < .07 ? .72 : 1) * ec;   /* candles bloom softer — 9 additive sprites must not haze the map */
        tw.tip.position.z = baseZ + hz; tw.halo.position.z = baseZ + hz;
        tw.tip.material.opacity = ec;
        tw.halo.material.opacity = (.42 + 1.1 * tw.h) * PILLAR_TUNE.halo * ec * (1 + .5 * clamp01((e - 1) * 8));   /* flare on overshoot; intensity rides height */
        tw.foot.material.opacity = .46 * ec;
        tw.pill.position.set(tw.lx, tw.ly, baseZ + hz + .075 + tw.chipZ);
        tw.pill.material.opacity = clamp01((ec - .55) * 3) * twrOn;
      });
    }

    /* ── mode card ── */
    const cardOn = io(T, MODEM + MOMD - .6, .4) * (1 - io(T, GLANM + .7, .6));
    cardGrp.visible = cardOn > .002;
    const liftE = io(T, LIFT, .9) * (1 - io(T, LAND, .8));
    const flipE = io(T, FLIP, 1.2);
    const peekE = out3(T, PEEK, .6) * (1 - out3(T, PEEKO, .5));
    if (cardGrp.visible) {
      cardGrp.position.z = D / 2 + .012 + .14 * liftE;
      cardGrp.rotation.x = -Math.PI * flipE;
      cardGrp.scale.setScalar(1 + .06 * liftE);
    }
    const swap = clamp01((flipE - .5) * 6);

    /* ── glance / dive / reveal / recede ── */
    const reveal = out3(T, REVEAL, .6);
    const callout = io(T, HOLD + .2, .8) * (1 - io(T, ZOUT, .8));   /* "home-screen widget" ring, hold-only */
    const recede = io(T, RECEDE, RECD);
    canvas.style.opacity = 1 - recede;

    /* ── compose the live screen ── */
    const mix = screenMix(T);
    /* the poke overlay animates at ~30fps while live, then the key settles */
    const heroLive = (ripples.length || funRows.some(r => t - r.t0 < .5)) ? 'ov' + ((t * 30) | 0) : 'ov' + funRows.length;
    const dirty = [
      'h', mix.heroFA.toFixed(2), mix.homeA.toFixed(2), mix.chartA.toFixed(2), mix.donutA.toFixed(2), mix.mapA.toFixed(2),
      mix.modeA.toFixed(2), mix.launchA.toFixed(2), heroLive,
      rowE.map(e => e.toFixed(2)).join(','), Math.round(weekV), Math.round(todayV), flashA.toFixed(2), listen.toFixed(2),
      drawP.toFixed(2), areaA.toFixed(2), dotA.toFixed(2), lineA.toFixed(2), mapDim.toFixed(2), (twrOn > .2 ? 1 : 0),
      sweep.toFixed(2), ringA.toFixed(2), centerA.toFixed(2), legE.map(e => e.toFixed(2)).join(','),
      stand.toFixed(2), swap.toFixed(2), peekE.toFixed(2), reveal.toFixed(2), callout.toFixed(2),
    ].join('|');
    if (dirty !== lastKey) {
      lastKey = dirty;
      liveX.clearRect(0, 0, SW, SH);
      if (mix.heroFA > .003) { drawHeroFace(heroFX, { funRows, ripples, now: t });
        liveX.globalAlpha = mix.heroFA; liveX.drawImage(heroFC, 0, 0, SW, SH); }
      if (mix.homeA > .003) { drawHome(homeX, { rowE, weekV, weekC, monthV, monthC, todayV, todayC, flash: flashA, listen });
        liveX.globalAlpha = mix.homeA; liveX.drawImage(homeC, 0, 0, SW, SH); }
      if (mix.chartA > .003) { drawChart(chartX, { drawP, areaA, dotA: dotA * lineA, lineA });
        liveX.globalAlpha = mix.chartA; liveX.drawImage(chartC, 0, 0, SW, SH); }
      if (mix.donutA > .003) { drawDonut(donutX, { sweep, ringA, centerA, legE, legDim: 1 - .45 * stand, is3d: stand > .25 });
        liveX.globalAlpha = mix.donutA; liveX.drawImage(donutC, 0, 0, SW, SH); }
      if (mix.mapA > .003) { drawMap(mapX, { dim: mapDim, threeD: twrOn > .2 });
        liveX.globalAlpha = mix.mapA; liveX.drawImage(mapC, 0, 0, SW, SH); }
      if (mix.modeA > .003) { drawMode(modeX, { swap });
        liveX.globalAlpha = mix.modeA; liveX.drawImage(modeC, 0, 0, SW, SH); }
      if (mix.launchA > .003) { drawLauncher(launchX, { reveal, callout });
        liveX.globalAlpha = mix.launchA; liveX.drawImage(launchC, 0, 0, SW, SH); }
      liveX.globalAlpha = 1;
      screenTex.needsUpdate = true;
    }
    /* card face peek repaint — only when the peek value actually changes */
    const pk = peekE.toFixed(2);
    if (cardGrp.visible && pk !== lastPeek) {
      cardTexB.image = cardFace('spend', peekE); cardTexB.needsUpdate = true; lastPeek = pk;
    }

    /* ── aurora + nav + rail ── */
    gsap.set(els.blG, { opacity: chain(T, 0, [{ v: .16, t: CAPM + 1.5, d: 2, e: io }, { v: 0, t: CHARTM, d: 1.6, e: io }]) });
    gsap.set(els.blS, { opacity: chain(T, 0, [{ v: .16, t: CHARTM, d: 1.8, e: io }, { v: .2, t: DONUTM, d: 1.6, e: io }, { v: 0, t: MAPM, d: 1.8, e: io }]) });
    gsap.set(els.blM, { opacity: chain(T, .22, [{ v: .12, t: CAPM + 1.5, d: 2, e: io }, { v: .24, t: DONUTM, d: 1.6, e: io },
      { v: .30, t: MAPM, d: 1.8, e: io }, { v: .18, t: MODEM, d: 1.6, e: io }, { v: .16, t: GLANM, d: 1.8, e: io }]) });
    gsap.set(els.blV, { opacity: chain(T, .20, [{ v: .26, t: CHARTM, d: 1.8, e: io }, { v: .30, t: MAPM, d: 1.8, e: io }, { v: .14, t: GLANM, d: 1.8, e: io }]) });
    gsap.set(els.blA, { opacity: chain(T, .10, [{ v: .22, t: GLANM, d: 1.8, e: io }]) });
    gsap.set(els.blC, { opacity: chain(T, .13, [{ v: .20, t: GLANM, d: 1.8, e: io }]) });
    const chromeFade = 1 - out3(T, RECEDE + .3, .7);
    /* the close-up beats own the full frame — chrome steps aside */
    const navDim = io(T, CHARTM + .6, .9) * (1 - io(T, MAPM + .1, .9));
    gsap.set(els.nav, { autoAlpha: chromeFade * (1 - .92 * navDim) });
    gsap.set(els.rail, { autoAlpha: chromeFade });
    railNodes.forEach((n, i) => {
      const on = T >= railAnch[i] - .2 && (i === railAnch.length - 1 || T < railAnch[i + 1] - .2);
      if (n.classList.contains('on') !== on) n.classList.toggle('on', on);
    });
    railFills.forEach((f2, i) => gsap.set(f2, { scaleY: lin(T, railAnch[i], railAnch[i + 1] - railAnch[i]) }));
  }

  /* ── scrub + render loop ──────────────────────────────────────────────── */
  const SCRUB = 1.3;
  const proxy = { t: 0 };
  gsap.to(proxy, {
    t: 1, ease: 'none',
    scrollTrigger: { trigger: '#scrolly', start: 'top top', end: 'bottom bottom', scrub: SCRUB },
  });
  window.__T = () => proxy.t * DUR;
  window.__DUR = DUR;
  /* dev/verification hooks: drive a frame synchronously (the preview panel pauses rAF);
     calling __render(T) freezes the live loop so the injected frame sticks */
  window.__render = tt => { if (tt !== undefined) { proxy.t = tt / DUR; window.__noloop = true; }
    state(proxy.t * DUR, 0); ink?.frame(proxy.t * DUR, 0);
    renderer.render(scene, camera); return proxy.t * DUR; };
  /* dev hook: complete the load-time one-shots synchronously (occluded windows
     throttle rAF, freezing the intro tweens — this jumps them to done) */
  window.__introNow = () => {
    heroword?.classList.add('draw');
    gsap.getTweensOf(['.heroword .hline > span', '.b-hero .hero-tag', '.b-hero .sub', '.hero-bottom .hbin'])
      .forEach(tw => tw.progress(1));
    rasterMask();
  };

  /* ── the dive's copy sits INSIDE the phone, centred in the band between the widget's aurora ring
        and the dock. Both are canvas-space landmarks, and the dive pose differs desktop vs mobile,
        so derive the screen midpoint from the pose rather than hardcoding a vh fraction. ── */
  const RING_BOT_C = 683.5, DOCK_TOP_C = 762;            /* canvas px: ring's outer stroke · dock's top edge */
  function placeDiveCopy() {
    if (!els.lgCopy) return;
    const [, ly] = px2l(206, 558), st = STAGE.dive();
    const lift = st.y + ly;                              /* DIVE_LIFT on desktop, 0 on mobile */
    const ppw = innerHeight / visH(st.z + D / 2);        /* screen px per world unit at the phone's face */
    const mid = (RING_BOT_C + DOCK_TOP_C) / 2 - 558;     /* canvas px below the dive's centre */
    els.lgCopy.style.top = (innerHeight / 2 - lift * ppw + mid * k * ppw) + 'px';
  }
  placeDiveCopy();

  let maskRs;
  function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    ink?.onResize();
    placeDiveCopy();
    clearTimeout(maskRs); maskRs = setTimeout(rasterMask, 150);   // glyphs moved → re-register the mask
  }
  addEventListener('resize', onResize);

  let lastTime = 0, splashCleared = false;
  renderer.setAnimationLoop(time => {
    if (window.__noloop) return;                         /* dev freeze (verification only) */
    const t = time / 1000;
    const dt = lastTime ? t - lastTime : .016; lastTime = t;
    if (lenis) lenis.raf(time);
    state(proxy.t * DUR, t);
    ink?.frame(proxy.t * DUR, dt);
    renderer.render(scene, camera);
    /* first real 3D frame is on screen → clear the loading splash (procedural phone shows
       now; the GLB swaps in a beat later — we don't wait for the 3.2MB model) */
    if (!splashCleared) { splashCleared = true; window.__hideSplash?.(); }
  });
})();
