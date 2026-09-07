/* usectl commercial — scene components for animations-v2 SceneStage.
   All motion derives from useScene() localTime (deterministic, export-safe). */
const { SceneStage, useScene } = window;

const C = {
  bg: '#1e1d1d', bg2: '#141414', card: '#1a1a1a', cardHover: '#1f1f1f',
  border: '#2a2a2a', borderHover: '#3a3a3a',
  text: '#b7b6b6', text2: '#b4b4b4', muted: 'rgba(255,255,255,0.52)',
  accent: '#11a32a', accentHover: '#0ec435', glow: 'rgba(17,163,42,0.25)',
  danger: '#e74c3c', blue: '#74b9ff',
};
const F = { sans: "'Space Grotesk', system-ui, sans-serif", mono: "'JetBrains Mono', monospace" };

const GLITCH_PATHS = [
  "M400,21.66V10.49h-116.29V0H39.36V54.56H0v36.09H101.25v9.77H.23v5.52H101.25v14.44H22.77v15.29H13.82v39.06H.23v6.79H13.82v15.29h60.63v20.81H10.25v51.17H.23v26.75H61.69v30.57h-29.35v12.1H0v30.57H22.77v31.36H400v-25.41h-31.43v-5.95h31.43v-8.28h-31.43v-15.92h-9.57v-14.65h32.56v-13.38h8.44v-10.83h-8.44v-52.23h-79.37v-21.02h69.78v-7.64h18.03v-24.7h-8.44v-52.58h-22.99v-11.89h31.43v-15.29h-31.43v-36.3h31.43V35.03h-116.29v-13.38h116.29ZM138.57,120.38h15.14v15.29h-15.14v-15.29ZM74.45,386.85v-18.08h39.56v14.01h144.19v4.06H74.45Zm89.32-42.28v-6.37h-34.45v-12.1h48.49v18.47h-14.04Zm56.73-25.48h-5.05v-2.55h5.05v2.55Zm-5.05-13.38v-10.19h5.05v10.19h-5.05Z",
  "M398.2,238.77v-14.06h2.28v-24.74h-2.28v-37.76h-8.45v-4.24H215.93v-3.23h178.76v-61.25H254.7v-3.19h33.11v-11.59h102.55V29.58h-52.25V0H93.75V13.18H0v11.19H39.84v29.77H.48v36.15H39.84v28.22H18.22v6.81h5.04v10.06H14.3v61.25h60.63v2.12H1.05v56.57H29.76v21.71H96.62v3.81h4.79v7.66h-3.83v-6.14H.6v14.67H62.17v13.8H.48v30.62H82.37v3.83h35.94v8.77H15.17v13.3H118.31v8.77H.48v23.84H244.84v-12.97h134.3v-18.11h21.34v-8.29h-21.34v-26.19h19.02v-25.45h-42.19v-26.19h18.5v-1.93h26.01v-10.85h-26.01v-25.51h-71.49v-5.73h95.22Zm-171.06-75.27v14.95h-11.21v-14.95h11.21Zm-88.09-38.17h38.45v-5.25h15.55v15.31h-54.01v-10.06Zm76.88,189.34v-3.83h40.42v14.92h-10.22v-11.09h-30.21Zm-45.94,30.62h7.52v8.77h-7.52v-8.77Zm0,22.07h7.52v8.77h-7.52v-8.77Z",
  "M400.21,112.61v-15.31H234.82v-9.04h52.51v-6.59h112.67V32.54h-33.6V6.06h-95.3V0H69.47V2.36H29.34V13.55h40.13v7.51H32.34v20.87h-12.38v10.18H0v36.15H19.96v49.37h18.2v23.05H13.82v11.8H.23v6.81H13.82v37.96h18.52v22.74H13.14v13.3h19.2v8.96h106.23v4.44H.23v26.8H61.69v30.62h-29.35v14.67H114.47v11.23H17.55v30.62h18.3v17.63h51.68v-17.63h26.94v11.98h143.72v5.65h141.81v-25.45h-114.47v-5.21h101.25v-.75h13.22v-8.29h-13.22v-29.24h-17.58v-10.32h30.72v-10.85h-30.72v-5.11h30.72v-31.26h-16.99v-29.1h17.08v-24.74h-60.14v-6.74h-24.11v-8.11h70.6v-61.25h-20.92v-29.24h34.78Zm-164.97,180.87v-8.94h88.66v12.37h-108.46v-3.43h19.79Zm-50.53-151.63v18.82h-30.76v-23.05h71.6v4.23h-40.84Z",
];

/* ── deterministic helpers ── */
const c01 = (x) => Math.max(0, Math.min(1, x));
const seg = (t, a, b) => c01((t - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - x, 3);
const eio = (x) => (x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2);
const prand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function glitchState(t, bursts, seed) {
  for (const [s, e] of bursts) {
    if (t >= s && t < e) {
      const f = Math.floor((t - s) / 0.08);
      const r = (k) => prand(seed * 97.3 + f * 13.7 + k);
      return { on: true, d: GLITCH_PATHS[Math.floor(r(1) * 3) % 3], dx: r(2) * 6 - 3, dy: r(3) * 4 - 2 };
    }
  }
  return { on: false, d: GLITCH_PATHS[0], dx: 0, dy: 0 };
}

/* clip-path glitch wrapper (same technique as GlitchLogo / login box / EmptyMachineHint) */
function Glitch({ id, g, style, children }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs><clipPath id={id} clipPathUnits="objectBoundingBox"><path d={g.d} transform="scale(0.0025, 0.0025)" /></clipPath></defs>
      </svg>
      <div style={{ clipPath: g.on ? `url(#${id})` : 'none', transform: `translate(${g.on ? g.dx : 0}px, ${g.on ? g.dy : 0}px)` }}>
        {children}
      </div>
    </div>
  );
}

/* loginBoxIn steps(1,end) flicker */
function flickerIn(t, s, d = 0.35) {
  const p = (t - s) / d;
  if (p < 0) return 0;
  if (p < 0.08) return 0; if (p < 0.22) return 1; if (p < 0.34) return 0.35;
  if (p < 0.52) return 1; if (p < 0.64) return 0.6; return 1;
}
function flickerOut(t, s, d = 0.5) {
  const p = (t - s) / d;
  if (p < 0) return 1;
  if (p < 0.15) return 1; if (p < 0.3) return 0.3; if (p < 0.45) return 1;
  if (p < 0.6) return 0.45; if (p < 0.75) return 0.9; return 0;
}

/* 1280×720 design surface scaled to the 1920×1080 stage, with a virtual camera.
   cam = {x, y, z}: focus point in 1280×720 space + zoom; focus is clamped so the
   view never leaves the page. */
function camAt(keys, t) {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) { const p = eio(seg(t, a.t, b.t)); return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, z: a.z + (b.z - a.z) * p }; }
  }
  return keys[keys.length - 1];
}
function Screen({ bg, cam, children }) {
  const z = cam ? 1 + (cam.z - 1) * 0.5 : 1;   // all camera zooms softened 50%
  const S = 1.5 * z;
  const hx = 640 / z, hy = 360 / z;
  const fx = cam ? Math.max(hx, Math.min(1280 - hx, cam.x)) : 640;
  const fy = cam ? Math.max(hy, Math.min(720 - hy, cam.y)) : 360;
  const tx = 960 / S - fx, ty = 540 / S - fy;
  return (
    <div style={{ position: 'absolute', inset: 0, background: bg || C.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1280, height: 720, transform: `scale(${S}) translate(${tx}px, ${ty}px)`, transformOrigin: 'top left', fontFamily: F.sans, color: C.text }}>
        {children}
      </div>
    </div>
  );
}

/* ── cursor ── */
function cursorPos(wp, t) {
  if (t <= wp[0].t) return wp[0];
  for (let i = 0; i < wp.length - 1; i++) {
    const a = wp[i], b = wp[i + 1];
    if (t <= b.t) { const p = eio(seg(t, a.t, b.t)); return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p }; }
  }
  return wp[wp.length - 1];
}
function Cursor({ wp, t, clicks = [], fade = 1 }) {
  if (t < wp[0].t || fade <= 0) return null;
  const { x, y } = cursorPos(wp, t);
  let press = 0;
  for (const c of clicks) press = Math.max(press, Math.sin(Math.PI * seg(t, c - 0.06, c + 0.14)));
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 5000, pointerEvents: 'none', opacity: fade }}>
      {clicks.map((c, i) => {
        const p = seg(t, c, c + 0.45);
        if (p <= 0 || p >= 1) return null;
        const r = 5 + 24 * eo(p);
        return <div key={i} style={{ position: 'absolute', left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.75)', opacity: 1 - p }} />;
      })}
      <svg width="27" height="31" viewBox="0 0 14 17" style={{ display: 'block', transform: `scale(${1 - 0.14 * press})`, transformOrigin: '2px 2px', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.55))' }}>
        <path d="M1.5 1 L1.5 13.6 L4.7 10.7 L6.8 15.6 L9.2 14.5 L7.1 9.8 L11.4 9.6 Z" fill="#101010" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ── small icons (simple primitives only) ── */
const CheckIco = ({ s = 16, c = 'currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 18 18"><path d="M3.5 9.5l4 4 7.5-8.5" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const ArrowIco = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18"><path d="M2.5 9h12M9.5 3.5L15 9l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const PlusIco = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18"><path d="M9 3v12M3 9h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
const MinusIco = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18"><path d="M3 9h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
const CloseIco = ({ s = 15 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18"><path d="M4 4l10 10M14 4L4 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
const CaretIco = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18"><path d="M4.5 7l4.5 4.5L13.5 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const CheckboxIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18"><rect x="1" y="1" width="16" height="16" rx="3" fill={C.accent} /><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const GithubIco = () => (
  <svg viewBox="0 0 16 16" width="19" height="19" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
);
const GoogleIco = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" /></svg>
);
const BellIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2.5c-2.6 0-4.2 1.9-4.2 4.6v3.2L3.4 13h11.2l-1.4-2.7V7.1c0-2.7-1.6-4.6-4.2-4.6z" /><path d="M7.6 15.2a1.5 1.5 0 002.8 0" /></svg>
);
const NavIcoMachines = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2.5" y="3.5" width="13" height="9" rx="1.5" /><path d="M6.5 15.5h5" /></svg>
);
const NavIcoDomains = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="6.5" /><ellipse cx="9" cy="9" rx="3" ry="6.5" /><path d="M2.5 9h13" /></svg>
);
const NavIcoOrgs = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="2.4" /><circle cx="12.5" cy="7" r="2" /><path d="M2 14.5c0-2.2 1.8-3.6 4-3.6s4 1.4 4 3.6M11 12.4c1.9.1 3.5 1 3.5 2.6" /></svg>
);

const FilterIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4zM3 6v2h18V6zm3 7h12v-2H6z" /></svg>
);
/* real app icons — MUI (filled, 24 viewBox) + simple-icons via react-icons, as in AddPodCategoryList.tsx */
const MI = ({ d, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">{(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}</svg>
);
const MUI_D = {
  code: "M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6z",
  build: "m22.7 19-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4",
  rocket: "M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55zM11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.3-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83zm6.48-2.19c-2.29 2.04-5.58 3.44-5.89 3.57L13.31 22l4.05-4.05c.47-.47.68-1.15.55-1.81zM9 18c0 .83-.34 1.58-.88 2.12C6.94 21.3 2 22 2 22s.7-4.94 1.88-6.12C4.42 15.34 5.17 15 6 15c1.66 0 3 1.34 3 3m4-9c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2",
  storage: "M2 20h20v-4H2zm2-3h2v2H4zM2 4v4h20V4zm4 3H4V5h2zm-4 7h20v-4H2zm2-3h2v2H4z",
  extension: "M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11",
  lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1z",
  schedule: ["M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8", "M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"],
  insights: ["M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2", "m15 9 .94-2.07L18 6l-2.06-.93L15 3l-.92 2.07L12 6l2.08.93zM3.5 11 4 9l2-.5L4 8l-.5-2L3 8l-2 .5L3 9z"],
  bug: "M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20zm-6 8h-4v-2h4zm0-4h-4v-2h4z",
  robot: "M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3M7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5M16 17H8v-2h8zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13",
  settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
};
const SI_D = {
  postgres: "M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698zM2.371 11.8765c-.7435-2.4358-1.1779-4.8851-1.2123-5.5719-.1086-2.1714.4171-3.6829 1.5623-4.4927 1.8367-1.2986 4.8398-.5408 6.108-.13-.0032.0032-.0066.0061-.0098.0094-2.0238 2.044-1.9758 5.536-1.9708 5.7495-.0002.0823.0066.1989.0162.3593.0348.5873.0996 1.6804-.0735 2.9184-.1609 1.1504.1937 2.2764.9728 3.0892.0806.0841.1648.1631.2518.2374-.3468.3714-1.1004 1.1926-1.9025 2.1576-.5677.6825-.9597.5517-1.0886.5087-.3919-.1307-.813-.5871-1.2381-1.3223-.4796-.839-.9635-2.0317-1.4155-3.5126zm6.0072 5.0871c-.1711-.0428-.3271-.1132-.4322-.1772.0889-.0394.2374-.0902.4833-.1409 1.2833-.2641 1.4815-.4506 1.9143-1.0002.0992-.126.2116-.2687.3673-.4426a.3549.3549 0 0 0 .0737-.1298c.1708-.1513.2724-.1099.4369-.0417.156.0646.3078.26.3695.4752.0291.1016.0619.2945-.0452.4444-.9043 1.2658-2.2216 1.2494-3.1676 1.0128zm2.094-3.988-.0525.141c-.133.3566-.2567.6881-.3334 1.003-.6674-.0021-1.3168-.2872-1.8105-.8024-.6279-.6551-.9131-1.5664-.7825-2.5004.1828-1.3079.1153-2.4468.079-3.0586-.005-.0857-.0095-.1607-.0122-.2199.2957-.2621 1.6659-.9962 2.6429-.7724.4459.1022.7176.4057.8305.928.5846 2.7038.0774 3.8307-.3302 4.7363-.084.1866-.1633.3629-.2311.5454zm7.3637 4.5725c-.0169.1768-.0358.376-.0618.5959l-.146.4383a.3547.3547 0 0 0-.0182.1077c-.0059.4747-.054.6489-.115.8693-.0634.2292-.1353.4891-.1794 1.0575-.11 1.4143-.8782 2.2267-2.4172 2.5565-1.5155.3251-1.7843-.4968-2.0212-1.2217a6.5824 6.5824 0 0 0-.0769-.2266c-.2154-.5858-.1911-1.4119-.1574-2.5551.0165-.5612-.0249-1.9013-.3302-2.6462.0044-.2932.0106-.5909.019-.8918a.3529.3529 0 0 0-.0153-.1126 1.4927 1.4927 0 0 0-.0439-.208c-.1226-.4283-.4213-.7866-.7797-.9351-.1424-.059-.4038-.1672-.7178-.0869.067-.276.1831-.5875.309-.9249l.0529-.142c.0595-.16.134-.3257.213-.5012.4265-.9476 1.0106-2.2453.3766-5.1772-.2374-1.0981-1.0304-1.6343-2.2324-1.5098-.7207.0746-1.3799.3654-1.7088.5321a5.6716 5.6716 0 0 0-.1958.1041c.0918-1.1064.4386-3.1741 1.7357-4.4823a4.0306 4.0306 0 0 1 .3033-.276.3532.3532 0 0 0 .1447-.0644c.7524-.5706 1.6945-.8506 2.802-.8325.4091.0067.8017.0339 1.1742.081 1.939.3544 3.2439 1.4468 4.0359 2.3827.8143.9623 1.2552 1.9315 1.4312 2.4543-1.3232-.1346-2.2234.1268-2.6797.779-.9926 1.4189.543 4.1729 1.2811 5.4964.1353.2426.2522.4522.2889.5413.2403.5825.5515.9713.7787 1.2552.0696.087.1372.1714.1885.245-.4008.1155-1.1208.3825-1.0552 1.717-.0123.1563-.0423.4469-.0834.8148-.0461.2077-.0702.4603-.0994.7662zm.8905-1.6211c-.0405-.8316.2691-.9185.5967-1.0105a2.8566 2.8566 0 0 0 .135-.0406 1.202 1.202 0 0 0 .1342.103c.5703.3765 1.5823.4213 3.0068.1344-.2016.1769-.5189.3994-.9533.6011-.4098.1903-1.0957.333-1.7473.3636-.7197.0336-1.0859-.0807-1.1721-.151zm.5695-9.2712c-.0059.3508-.0542.6692-.1054 1.0017-.055.3576-.112.7274-.1264 1.1762-.0142.4368.0404.8909.0932 1.3301.1066.887.216 1.8003-.2075 2.7014a3.5272 3.5272 0 0 1-.1876-.3856c-.0527-.1276-.1669-.3326-.3251-.6162-.6156-1.1041-2.0574-3.6896-1.3193-4.7446.3795-.5427 1.3408-.5661 2.1781-.463zm.2284 7.0137a12.3762 12.3762 0 0 0-.0853-.1074l-.0355-.0444c.7262-1.1995.5842-2.3862.4578-3.4385-.0519-.4318-.1009-.8396-.0885-1.2226.0129-.4061.0666-.7543.1185-1.0911.0639-.415.1288-.8443.1109-1.3505.0134-.0531.0188-.1158.0118-.1902-.0457-.4855-.5999-1.938-1.7294-3.253-.6076-.7073-1.4896-1.4972-2.6889-2.0395.5251-.1066 1.2328-.2035 2.0244-.1859 2.0515.0456 3.6746.8135 4.8242 2.2824a.908.908 0 0 1 .0667.1002c.7231 1.3556-.2762 6.2751-2.9867 10.5405zm-8.8166-6.1162c-.025.1794-.3089.4225-.6211.4225a.5821.5821 0 0 1-.0809-.0056c-.1873-.026-.3765-.144-.5059-.3156-.0458-.0605-.1203-.178-.1055-.2844.0055-.0401.0261-.0985.0925-.1488.1182-.0894.3518-.1226.6096-.0867.3163.0441.6426.1938.6113.4186zm7.9305-.4114c.0111.0792-.049.201-.1531.3102-.0683.0717-.212.1961-.4079.2232a.5456.5456 0 0 1-.075.0052c-.2935 0-.5414-.2344-.5607-.3717-.024-.1765.2641-.3106.5611-.352.297-.0414.6111.0088.6356.1851z",
  redis: "M22.71 13.145c-1.66 2.092-3.452 4.483-7.038 4.483-3.203 0-4.397-2.825-4.48-5.12.701 1.484 2.073 2.685 4.214 2.63 4.117-.133 6.94-3.852 6.94-7.239 0-4.05-3.022-6.972-8.268-6.972-3.752 0-8.4 1.428-11.455 3.685C2.59 6.937 3.885 9.958 4.35 9.626c2.648-1.904 4.748-3.13 6.784-3.744C8.12 9.244.886 17.05 0 18.425c.1 1.261 1.66 4.648 2.424 4.648.232 0 .431-.133.664-.365a100.49 100.49 0 0 0 5.54-6.765c.222 3.104 1.748 6.898 6.014 6.898 3.819 0 7.604-2.756 9.33-8.965.2-.764-.73-1.361-1.261-.73zm-4.349-5.013c0 1.959-1.926 2.922-3.685 2.922-.941 0-1.664-.247-2.235-.568 1.051-1.592 2.092-3.225 3.21-4.973 1.972.334 2.71 1.43 2.71 2.619z",
  mongo: "M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0 1 11.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 0 0 3.639-8.464c.01-.814-.103-1.662-.197-2.218zm-5.336 8.195s0-8.291.275-8.29c.213 0 .49 10.695.49 10.695-.381-.045-.765-1.76-.765-2.405z",
  nats: "M12.004 0H.404v18.807h9.938l1.714 1.602v-.026L15.966 24v-5.193h7.63V0H12.003zm7.578 14.45H15.38L6.898 6.519v7.93H4.116V4.376h4.349l8.344 7.784V4.375h2.773V14.45z",
  meili: "m6.505 18.998 4.434-11.345a4.168 4.168 0 0 1 3.882-2.651h2.674l-4.434 11.345a4.169 4.169 0 0 1-3.883 2.651H6.505Zm6.505 0 4.434-11.345a4.169 4.169 0 0 1 3.883-2.651H24l-4.434 11.345a4.168 4.168 0 0 1-3.882 2.651H13.01Zm-13.01 0L4.434 7.653a4.168 4.168 0 0 1 3.882-2.651h2.674L6.556 16.347a4.169 4.169 0 0 1-3.883 2.651H0Z",
};
/* LuPackage — the project's S3 icon (lucide, stroke-based) */
const PackageIco = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 4.27l9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M3.3 7l8.7 5 8.7-5" /><path d="M12 22v-10" /></svg>
);
const CodeIco = () => (
  <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 5L2 9l3.5 4M12.5 5L16 9l-3.5 4" /></svg>
);
const DbIco = ({ s = 17 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="9" cy="4.5" rx="6" ry="2.3" /><path d="M3 4.5v9c0 1.3 2.7 2.3 6 2.3s6-1 6-2.3v-9M3 9c0 1.3 2.7 2.3 6 2.3s6-1 6-2.3" /></svg>
);
const LayersIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M9 2.5L16 6 9 9.5 2 6zM3.5 9.5L9 12.2l5.5-2.7M3.5 13L9 15.7l5.5-2.7" /></svg>
);
const GearIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="3.2" /><path d="M9 2v2.2M9 13.8V16M2 9h2.2M13.8 9H16M4.2 4.2l1.5 1.5M12.3 12.3l1.5 1.5M13.8 4.2l-1.5 1.5M5.7 12.3l-1.5 1.5" /></svg>
);
const RocketIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 15V6M9 6l3.5 3.5M9 6L5.5 9.5" /><circle cx="9" cy="9" r="7" /></svg>
);
const PlaneIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M2 9.5L16 3l-4 12-3.2-4.3zM8.8 10.7L16 3" /></svg>
);
const SearchIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8" cy="8" r="4.6" /><path d="M11.6 11.6L15.5 15.5" /></svg>
);
const BucketIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><ellipse cx="9" cy="4.5" rx="6" ry="2" /><path d="M3 4.5l1.8 9.5c.1.8 2 1.5 4.2 1.5s4.1-.7 4.2-1.5L15 4.5" /></svg>
);
const LockIco = ({ s = 17 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="8" width="10" height="7" rx="1.5" /><path d="M6 8V6a3 3 0 016 0v2" /></svg>
);
const ClockIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="6.5" /><path d="M9 5.5V9l2.5 1.8" /></svg>
);
const ChartIco = ({ s = 17 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 14.5l4-5.5 3 3 5.5-7.5" /></svg>
);
const BugIco = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="10" r="4.5" /><path d="M6 6.5L4 4M12 6.5L14 4M3 10h2M13 10h2M4.5 14.5l1.8-1.4M13.5 14.5l-1.8-1.4" /></svg>
);
const RobotIco = ({ s = 17 }) => (
  <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="6.5" width="10" height="8" rx="2" /><path d="M9 3.5v3" /><circle cx="9" cy="3" r="0.8" /><circle cx="7" cy="10.5" r="0.9" fill="currentColor" /><circle cx="11" cy="10.5" r="0.9" fill="currentColor" /></svg>
);
const PuzzleIco = () => (
  <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="7" width="10" height="8" rx="1.5" /><circle cx="9" cy="5.5" r="2" /></svg>
);

const StatusDot = ({ color }) => (
  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 7px 1.5px ${color}99` }} />
);

/* ── interstitial title cards (black bg, glitch + scramble) ── */
const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>*#$@";
function scramble(str, reveal, seed, t) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === ' ') { out += ' '; continue; }
    const settleAt = (i / str.length) * 0.72;
    if (reveal >= settleAt + 0.28) out += ch;
    else {
      const r = prand(seed + i * 7.31 + Math.floor(t * 26));
      out += SCRAMBLE[Math.floor(r * SCRAMBLE.length)];
    }
  }
  return out;
}
/* RGB-split glitchy text — three stacked layers that separate during bursts */
function GlitchType({ text, size, weight = 800, color = '#fff', split, jitter }) {
  const base = { position: split > 0.01 ? 'absolute' : 'static', left: 0, top: 0, right: 0, fontSize: size, fontWeight: weight, lineHeight: 1.03, letterSpacing: '-0.02em', margin: 0, whiteSpace: 'pre-wrap' };
  if (split <= 0.01) return <div style={{ ...base, color }}>{text}</div>;
  const dx = split * 6;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ ...base, color: '#ff2e63', transform: `translate(${-dx + jitter}px, ${-dx * 0.4}px)`, opacity: 0.9, mixBlendMode: 'screen' }}>{text}</div>
      <div style={{ ...base, color: '#11a32a', transform: `translate(${dx - jitter}px, ${dx * 0.4}px)`, opacity: 0.9, mixBlendMode: 'screen' }}>{text}</div>
      <div style={{ ...base, color }}>{text}</div>
    </div>
  );
}
/* scanline + noise texture overlay for the black cards */
function CardTexture({ t, seed }) {
  const bars = [];
  for (let i = 0; i < 4; i++) {
    const r = prand(seed + i * 3.1 + Math.floor(t * 9));
    if (r > 0.62) bars.push({ y: prand(seed + i * 11.7 + Math.floor(t * 9)) * 100, h: 2 + r * 26, op: (r - 0.6) * 0.5 });
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)' }} />
      {bars.map((b, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${b.y}%`, height: b.h, background: '#11a32a', opacity: b.op, mixBlendMode: 'screen' }} />
      ))}
    </div>
  );
}
/* Dot-grid + bass-ripple background — mirrors the pods-canvas technique:
   a radial-gradient dot grid, with green dots revealed inside expanding
   rings. Rings are emitted on every beat of a 120 BPM bass pulse (0.5s),
   with a sharp kick attack + decay so it reads like the track's low end. */
function DotWaveBg({ t, intensity = 1, cx = 960, cy = 540 }) {
  const GRID = 26, MAXR = 4200, W = 700, LIFE = 3.2;
  // ── live audio mode: drive rings off the real bass beats + level ──
  const audio = typeof document !== 'undefined' && document.getElementById('bgm');
  const live = audio && !audio.paused && window.__usBeats;
  const rings = [];
  let beat, bloomBoost;
  if (live) {
    const now = audio.currentTime;
    const bass = window.__usBass || 0;
    beat = 0.4 + 0.6 * bass;
    bloomBoost = bass;
    const beats = window.__usBeats;
    for (let b = beats.length - 1; b >= 0; b--) {
      const age = now - beats[b];
      if (age < 0 || age > LIFE) continue;
      const p = age / LIFE;
      const R = eo(p) * MAXR;
      const env = Math.pow(1 - p, 1.5);
      const a = (1.0 * env * intensity).toFixed(3);
      const ext = R + W;
      const s1 = (Math.max(0, R - W) / ext * 100).toFixed(1);
      const s2 = (Math.max(0, R - W * 0.5) / ext * 100).toFixed(1);
      const s3 = (R / ext * 100).toFixed(1);
      const s4 = (Math.min(ext, R + W * 0.5) / ext * 100).toFixed(1);
      rings.push(`radial-gradient(circle ${ext.toFixed(0)}px at ${cx}px ${cy}px, transparent ${s1}%, rgba(0,0,0,${(a * 0.4).toFixed(3)}) ${s2}%, rgba(0,0,0,${a}) ${s3}%, rgba(0,0,0,${(a * 0.4).toFixed(3)}) ${s4}%, transparent 100%)`);
    }
  } else {
    // ── fallback (silent export): deterministic 120 BPM kick ──
    const BEAT = 0.5;
    const ph = (t % BEAT) / BEAT;
    const kick = Math.pow(1 - ph, 2.4);
    beat = 0.45 + 0.55 * kick; bloomBoost = kick;
    const nBeats = Math.ceil(LIFE / BEAT);
    const beatIdx = Math.floor(t / BEAT);
    for (let b = 0; b <= nBeats; b++) {
      const age = t - (beatIdx - b) * BEAT;
      if (age < 0 || age > LIFE) continue;
      const p = age / LIFE;
      const R = eo(p) * MAXR;
      const env = Math.pow(1 - p, 1.6) * (b === 0 ? kick : 1);
      const a = (1.0 * env * intensity).toFixed(3);
      const ext = R + W;
      const s1 = (Math.max(0, R - W) / ext * 100).toFixed(1);
      const s2 = (Math.max(0, R - W * 0.5) / ext * 100).toFixed(1);
      const s3 = (R / ext * 100).toFixed(1);
      const s4 = (Math.min(ext, R + W * 0.5) / ext * 100).toFixed(1);
      rings.push(`radial-gradient(circle ${ext.toFixed(0)}px at ${cx}px ${cy}px, transparent ${s1}%, rgba(0,0,0,${(a * 0.4).toFixed(3)}) ${s2}%, rgba(0,0,0,${a}) ${s3}%, rgba(0,0,0,${(a * 0.4).toFixed(3)}) ${s4}%, transparent 100%)`);
    }
  }
  const bloomR = 260 + 120 * bloomBoost * intensity;
  rings.push(`radial-gradient(circle ${bloomR.toFixed(0)}px at ${cx}px ${cy}px, rgba(0,0,0,${(0.9 * intensity).toFixed(3)}) 0%, transparent 100%)`);
  const mask = rings.join(', ');
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: `${GRID}px ${GRID}px` }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${C.accent} 1.8px, transparent 1.8px)`, backgroundSize: `${GRID}px ${GRID}px`, maskImage: mask, WebkitMaskImage: mask, opacity: 0.8 + 0.2 * beat }} />
    </div>
  );
}
/* Full-screen title card. Reads copy from the scene entry (eyebrow/title/kicker). */
function Interstitial() {
  const { localTime: t, dur, scene } = useScene();
  const inEnd = Math.min(0.55, dur * 0.38), outStart = dur - Math.min(0.45, dur * 0.32);
  // glitch/RGB-split strong at entrance + exit, calm in the middle
  const split = c01((1 - seg(t, 0.25, inEnd)) + seg(t, outStart, dur - 0.1));
  const gBursts = [[0, 0.32], [outStart + 0.1, dur]];
  const gx = glitchState(t, gBursts, (scene.seed || 3) * 13);
  const jitter = gx.on ? gx.dx : 0;
  const reveal = eo(seg(t, 0.12, inEnd));
  const exitRev = 1 - seg(t, outStart, dur - 0.05);   // scramble back out
  const title = scene.title || '';
  const shown = scramble(title, t >= outStart ? exitRev : reveal, (scene.seed || 3) * 5, t);
  const eyeOp = flickerIn(t, 0.05, 0.3) * (1 - seg(t, outStart, dur - 0.15));
  const kickOp = flickerIn(t, inEnd + 0.05, 0.35) * (1 - seg(t, outStart, dur - 0.2));
  const barW = eo(seg(t, 0.2, inEnd + 0.2)) * (1 - seg(t, outStart, dur));
  const vign = 0.6 + 0.2 * split;
  const bgIntensity = flickerIn(t, 0.02, 0.4) * (1 - 0.5 * seg(t, outStart, dur));
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0d0d0d', overflow: 'hidden', fontFamily: F.sans }}>
      <DotWaveBg t={t} intensity={bgIntensity} />
      <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 260px rgba(0,0,0,${vign})` }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 1400, transform: `translate(calc(-50% + ${jitter}px), -50%)`, textAlign: 'center', padding: '0 80px', boxSizing: 'border-box' }}>
        <div style={{ fontFamily: F.mono, fontSize: 17, fontWeight: 700, letterSpacing: '0.42em', color: C.accent, textTransform: 'uppercase', marginBottom: 26, opacity: eyeOp }}>{scene.eyebrow}</div>
        <GlitchType text={shown} size={scene.size || 92} split={split} jitter={jitter} />
        <div style={{ height: 3, background: C.accent, width: `${barW * 120}px`, margin: '30px auto 0', boxShadow: `0 0 16px ${C.accent}`, opacity: barW }} />
        {scene.kicker && <div style={{ fontSize: 25, fontWeight: 500, color: C.text2, marginTop: 26, opacity: kickOp }}>{scene.kicker}</div>}
      </div>
    </div>
  );
}

/* ══ SCENE 1 — logo glitch intro ══ */
function LogoScene() {
  const { localTime: t, dur } = useScene();
  const show = t >= 0.2 && t < 1.95;
  const g = glitchState(t, [[0.2, 0.7], [1.05, 1.17], [1.5, 1.95]], 11);
  let op = flickerIn(t, 0.2);
  if (t >= 1.5) op = flickerOut(t, 1.5, 0.42);
  const push = 1 + 0.12 * seg(t, 0, dur); // slow cinematic push-in
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {show && (
        <div style={{ transform: `scale(${push})`, textAlign: 'center' }}>
          <Glitch id="g-logo1" g={g} style={{ opacity: op }}>
            <img src={window.__resources && window.__resources.logo || "/commercial/logo.svg"} alt="usectl" style={{ display: 'block', height: 110, width: 110 * (230 / 37) }} />
          </Glitch>
          <div style={{ fontFamily: F.sans, fontSize: 34, fontWeight: 500, color: C.text2, marginTop: 34, letterSpacing: '0.01em', opacity: op * flickerIn(t, 0.55, 0.3) }}>
            Deploy anything. <span style={{ color: C.accent, fontWeight: 700 }}>In seconds.</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ SCENE 2 — login + Google sign-in ══ */
function LoginBtn({ label, icon, pop, hovered, pressed }) {
  const s = 0.9 + 0.1 * eo(pop);
  return (
    <div style={{
      display: pop > 0 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '12px 0', width: '100%', borderRadius: 8, boxSizing: 'border-box',
      background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
      border: `1px solid ${hovered ? C.borderHover : C.border}`,
      color: C.text, fontSize: 14.4, fontWeight: 500,
      opacity: eo(pop), transform: `scale(${pressed ? s * 0.97 : s})`,
    }}>
      {icon}<span>{label}</span>
    </div>
  );
}
function LoginScene() {
  const { localTime: t } = useScene();
  const CLICK = 1.1, SWAP = 1.35;
  const phaseB = false;
  const g = glitchState(t, [[0.12, 0.47], [1.2, 1.53]], 23);
  const gLogo = glitchState(t, [[0.2, 0.6], [SWAP, SWAP + 0.4]], 31);
  const boxOp = t < 0.12 ? 0 : flickerIn(t, 0.12);
  const rise = eo(seg(t, 0.2, 0.45));
  const hoverGoogle = !phaseB && t >= 0.8;
  const pressed = t >= CLICK && t < CLICK + 0.18;
  const wp = [{ t: 0.35, x: 1180, y: 700 }, { t: 0.8, x: 668, y: 409 }];
  const cam = camAt([
    { t: 0, x: 640, y: 360, z: 1 }, { t: 0.5, x: 640, y: 360, z: 1 },
    { t: 0.95, x: 668, y: 420, z: 1.5 }, { t: 2.5, x: 668, y: 420, z: 1.5 },
  ], t);
  return (
    <Screen cam={cam}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Glitch id="g-login" g={g} style={{ opacity: boxOp, width: 420 }}>
          <div style={{ border: '1px solid #ffffff1a', borderRadius: 12, padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
            <Glitch id="g-login-logo" g={gLogo} style={{ marginBottom: 8, opacity: t >= 0.3 ? 1 : 0 }}>
              <img src={window.__resources && window.__resources.logo || "/commercial/logo.svg"} alt="usectl" style={{ display: 'block', height: 28, width: 28 * (230 / 37) }} />
            </Glitch>
            <div style={{ fontSize: 14.4, color: C.text2, marginBottom: 32, textAlign: 'center', opacity: rise, transform: `translateY(${16 * (1 - rise)}px)` }}>
              {phaseB ? 'Signing in with Google...' : 'Welcome to usectl'}
            </div>
            {!phaseB ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <LoginBtn label="Continue with GitHub" icon={<GithubIco />} pop={seg(t, 0.4, 0.7)} />
                <LoginBtn label="Continue with Google" icon={<GoogleIco />} pop={seg(t, 0.5, 0.8)} hovered={hoverGoogle} pressed={pressed} />
              </div>
            ) : (
              <div style={{ width: '100%', textAlign: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: 14.4, color: C.text2 }}>Please wait while we complete your sign-in.</div>
                <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center', gap: 7 }}>
                  {[0, 1, 2].map(i => {
                    const ph = Math.sin(Math.PI * 2 * ((t * 0.9 + i * 0.22) % 1));
                    return <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, opacity: 0.25 + 0.75 * c01(ph) }} />;
                  })}
                </div>
              </div>
            )}
          </div>
        </Glitch>
      </div>
      <Cursor wp={wp} t={t} clicks={[CLICK]} />
    </Screen>
  );
}

/* ══ shared page chrome (navbar + toolbar) ══ */
function NavLink({ label, icon, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 13.6, fontWeight: 500, color: active ? C.accent : C.text2 }}>
      {icon}{label}
    </div>
  );
}
function PageChrome({ t, machineName, dotColor, plusPulse, selGlitch, logoGlitch, pods }) {
  const pulse = plusPulse ? Math.sin(Math.PI * ((t % 1.8) / 1.8)) : 0;
  const podPulse = pods && pods.pulse ? Math.sin(Math.PI * ((t % 1.8) / 1.8)) : 0;
  return (
    <div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 32px', boxSizing: 'border-box' }}>
        <Glitch id="g-sel" g={selGlitch}>
          <div style={{ width: 184, height: 42, border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', boxSizing: 'border-box', background: 'transparent' }}>
            <StatusDot color={dotColor} />
            <span style={{ fontSize: 13.6, fontWeight: 600, letterSpacing: '0.03em', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{machineName}</span>
            <span style={{ color: C.muted, display: 'flex' }}><CaretIco s={15} /></span>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0,
              background: `rgba(17,163,42,${0.18 * pulse})`, boxShadow: `0 0 0 ${6 * pulse}px rgba(17,163,42,${0.12 * pulse})`,
            }}><PlusIco s={17} /></span>
          </div>
        </Glitch>
        {pods && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 14 }}>
            {[['CPU', '0.0/4', '#818cf8'], ['MEMORY', '0.00/4GiB', '#fdcb6e'], ['STORAGE', '0GB/1GB', '#34d399']].map(([lb, v, col]) => (
              <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10.4, fontWeight: 700, letterSpacing: '0.05em', color: C.muted, whiteSpace: 'nowrap' }}>{lb}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{v}</span>
                <span style={{ width: 64, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', flexShrink: 0 }}>
                  <span style={{ display: 'block', width: '2%', height: '100%', borderRadius: 3, background: col }} />
                </span>
              </div>
            ))}
          </div>
        )}
        {pods && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12.8, fontWeight: 600, color: '#8fd69c', background: 'rgba(17,163,42,0.22)' }}>All</span>
            <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12.8, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Ungrouped</span>
            <span style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.5)', padding: '0 2px' }}><PlusIco s={14} /></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${C.border}`, color: C.text2, fontSize: 13.4, fontWeight: 500, boxSizing: 'border-box' }}>
              <FilterIco /> Filters
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px', borderRadius: 8,
              background: '#0e8222', border: '1px solid #0e8222', color: '#fff', fontSize: 13.4, fontWeight: 700, boxSizing: 'border-box',
              boxShadow: `0 0 0 ${6 * podPulse}px rgba(17,163,42,${0.14 * podPulse})`,
              transform: `scale(${pods.pressed ? 0.96 : 1})`,
            }}><PlusIco s={15} /> Add Pod</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ EmptyMachineHint — glitch entrance, connector draw, glow loop, exit ══ */
const HINT = {
  x: 426, w: 428, railX: 366, btnY: 85, btnRight: 206,
  cards: [{ top: 150, h: 128 }, { top: 292, h: 232 }, { top: 542, h: 146 }],
};
const HINT_MIDS = HINT.cards.map(c => c.top + c.h / 2);
const GLOW_P = 7.2;

function glowFor(gt, start, dur) {
  if (gt < start || gt >= start + dur) return null;
  const p = (gt - start) / dur;
  return { p: p * 100, op: 0.6 * Math.sin(Math.PI * p) };
}
function HGlow({ glow, dir }) {
  if (!glow) return null;
  const left = dir === 'rtl' ? `${100 - glow.p}%` : `${glow.p}%`;
  return <div style={{ position: 'absolute', top: -3, bottom: -3, width: 90, left, transform: 'translateX(-50%)', background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, filter: 'blur(4px)', opacity: glow.op, pointerEvents: 'none' }} />;
}
function StepRow({ label, state }) {
  const col = state === 'done' ? C.accent : state === 'active' ? '#fff' : C.text;
  const icoCol = state === 'done' ? C.accent : state === 'active' ? '#fff' : C.muted;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 0', fontSize: 14.4, color: col, transition: 'color 0.4s ease-in-out' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, border: `1px dashed ${icoCol}`, borderRadius: 6, color: icoCol, flexShrink: 0, transition: 'color 0.4s ease-in-out, border-color 0.4s ease-in-out' }}>
        {state === 'done' ? <CheckIco s={16} /> : <ArrowIco />}
      </span>
      <span>{label}</span>
    </div>
  );
}
const EYEBROW = { fontSize: 11.2, fontWeight: 600, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 };
const CARD = { position: 'absolute', left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', boxSizing: 'border-box', overflow: 'hidden' };

function EmptyHint({ t, inStart, outStart = 1e9, glowStart, k = 1 }) {
  const g = glitchState(t, [[inStart, inStart + 0.6 * k]], 47);
  const inDone = t >= inStart + 2.4 * k;
  const exiting = t >= outStart;
  const wrapOp = t < inStart ? 0 : exiting ? 1 - seg(t, outStart + 0.55 * k, outStart + 0.8 * k) : 1;
  if (wrapOp <= 0) return null;
  const textOp = exiting ? 1 - seg(t, outStart + 0.35 * k, outStart + 0.65 * k) : seg(t, inStart + 0.6 * k, inStart + 1.0 * k);
  const lineSX = (i) => exiting
    ? 1 - seg(t, outStart + (0.35 + i * 0.08) * k, outStart + (0.65 + i * 0.08) * k)
    : seg(t, inStart + (0.6 + (2 - i) * 0.1) * k, inStart + (1.0 + (2 - i) * 0.1) * k);
  const railSY = exiting ? 1 - seg(t, outStart + 0.3 * k, outStart + 0.55 * k) : seg(t, inStart + 1.2 * k, inStart + 1.6 * k);
  const hlineSX = exiting ? 1 - seg(t, outStart + 0.15 * k, outStart + 0.4 * k) : seg(t, inStart + 1.6 * k, inStart + 2.0 * k);
  const gt = inDone && !exiting ? ((t - glowStart) % GLOW_P + GLOW_P) % GLOW_P : -1;
  const glows = {
    lines: [glowFor(gt, 0.2, 1.0), glowFor(gt, 0.1, 1.0), glowFor(gt, 0, 1.0)],
    rail: glowFor(gt, 1.0, 3.2),
    hline: glowFor(gt, 4.0, 3.2),
  };
  const railH = HINT_MIDS[2] - HINT.btnY;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: wrapOp, transform: g.on ? `translate(${g.dx}px, ${g.dy}px)` : 'none', clipPath: g.on ? 'url(#g-hint-clip)' : 'none', zIndex: 10 }}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs><clipPath id="g-hint-clip" clipPathUnits="objectBoundingBox"><path d={g.d} transform="scale(0.0025, 0.0025)" /></clipPath></defs>
      </svg>
      {/* hline: + button → rail top */}
      <div style={{ position: 'absolute', left: HINT.btnRight, top: HINT.btnY, width: HINT.railX - HINT.btnRight + 1, height: 2, background: C.accent, opacity: 0.6, transform: `scaleX(${hlineSX})`, transformOrigin: 'right center', overflowX: 'clip', overflowY: 'visible' }}>
        <HGlow glow={glows.hline} dir="rtl" />
      </div>
      {/* rail: down to last card mid */}
      <div style={{ position: 'absolute', left: HINT.railX, top: HINT.btnY + 2, width: 2, height: railH, background: C.accent, opacity: 0.6, transform: `scaleY(${railSY})`, transformOrigin: 'center bottom', overflowY: 'clip', overflowX: 'visible' }}>
        {glows.rail && <div style={{ position: 'absolute', left: -3, right: -3, height: 90, top: `${100 - glows.rail.p}%`, transform: 'translateY(-50%)', background: `linear-gradient(180deg, transparent, ${C.accent}, transparent)`, filter: 'blur(4px)', opacity: glows.rail.op }} />}
      </div>
      {/* card connector stubs */}
      {HINT_MIDS.map((my, i) => (
        <div key={i} style={{ position: 'absolute', left: HINT.railX + 1, top: my - 1, width: HINT.x - HINT.railX - 1, height: 2, background: C.accent, opacity: 0.5, transform: `scaleX(${lineSX(i)})`, transformOrigin: 'right center', overflowX: 'clip', overflowY: 'visible' }}>
          <HGlow glow={glows.lines[i]} dir="rtl" />
        </div>
      ))}
      <div style={{ position: 'absolute', left: HINT.x, width: HINT.w, top: 0, bottom: 0 }}>
        <div style={{ ...CARD, top: HINT.cards[0].top, height: HINT.cards[0].h }}>
          <div style={{ opacity: textOp }}>
            <div style={EYEBROW}>Welcome</div>
            <div style={{ fontSize: 16.8, fontWeight: 700, color: C.text, marginBottom: 8 }}>Your Machine is Empty</div>
            <div style={{ fontSize: 13.6, lineHeight: 1.45, color: C.muted }}>let's deploy your first machine. hit the Add new machine button above to get started.</div>
          </div>
        </div>
        <div style={{ ...CARD, top: HINT.cards[1].top, height: HINT.cards[1].h }}>
          <div style={{ opacity: textOp }}>
            <div style={EYEBROW}>How it works · 3 steps</div>
            <StepRow label="Click add new Machine" state="active" />
            <StepRow label="Create Machine name" state="idle" />
            <StepRow label="Select Resources" state="idle" />
            <StepRow label="Machine is created" state="idle" />
          </div>
        </div>
        <div style={{ ...CARD, top: HINT.cards[2].top, height: HINT.cards[2].h }}>
          <div style={{ opacity: textOp }}>
            <div style={EYEBROW}>Trust signal</div>
            {['30 day free trial', 'No credit card required', 'Encrypted at rest'].map(l => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 14.4, color: C.accent }}>
                <CheckboxIco /><span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ SCENE 3 — empty machines page ══ */
function MachinesScene() {
  const { localTime: t } = useScene();
  const noG = { on: false, d: GLITCH_PATHS[0], dx: 0, dy: 0 };
  return (
    <Screen>
      <PageChrome t={t} machineName="No Machines" dotColor={C.blue} plusPulse selGlitch={noG} logoGlitch={glitchState(t, [[0.1, 0.45]], 53)} />
      <EmptyHint t={t} inStart={0.15} glowStart={1.2} k={0.4} />
    </Screen>
  );
}

/* ══ SCENE 4 — add machine: open, config, create ══ */
const MODAL = { x: 580, w: 600, top: 80 };
const NAME = 'my-machine';
const T = { plusClick: 0.45, modalIn: 0.7, fieldClick: 1.15, typeStart: 1.3, typeStep: 0.09, resStart: 3.0, createHover: 4.35, createClick: 4.65, modalOut: 5.25, done: 5.6 };
const TV = [3.0, 3.14, 3.28];   // vCPU + clicks → 4 cores
const TR = [3.55, 3.69, 3.83];  // RAM + clicks → 4 GB

function nameHelper(n) {
  if (n === 0) return { txt: '3–40 chars, lowercase. Letters, digits, hyphens', col: 'rgba(255,255,255,0.7)' };
  const s = NAME.slice(0, n);
  if (s.length < 3) return { txt: 'Too short — minimum 3 characters.', col: C.danger };
  if (!/[a-z0-9]$/.test(s)) return { txt: 'Must end with a letter or digit.', col: C.danger };
  return { txt: `Will be reachable at https://${s}.usectl.com`, col: C.accent };
}
function ResourceRow({ label, desc, valTxt, price, pct, plusHot, glowT, glowSalt }) {
  const btn = (ico, hot) => (
    <span style={{ width: 30, height: 30, border: `1px solid ${hot ? C.accent : C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, background: hot ? 'rgba(17,163,42,0.1)' : 'transparent', boxSizing: 'border-box' }}>{ico}</span>
  );
  const gp = ((glowT + glowSalt) % 4.5) / 4.5 * 130 - 15;
  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>{desc}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {btn(<MinusIco />, false)}
          <span style={{ width: 56, textAlign: 'center', fontSize: 13.6, fontWeight: 600, color: C.text }}>{valTxt}</span>
          {btn(<PlusIco s={14} />, plusHot)}
          <span style={{ fontSize: 13, color: C.accent, fontWeight: 600, minWidth: 70, textAlign: 'right' }}>{price}/mo</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 12, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: C.border, borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 0, width: `${Math.max(pct, 0.5)}%`, height: 2, background: C.accent, borderRadius: 1, overflow: 'hidden' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, height: 8, top: 2, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: 110, left: `${gp}%`, background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, filter: 'blur(4px)', opacity: 0.28 }} />
        </div>
        <div style={{ position: 'absolute', left: `calc(${Math.max(pct, 0.5)}% - 6px)`, width: 12, height: 12, borderRadius: '50%', background: C.accent }} />
      </div>
    </div>
  );
}
function SideSteps({ t }) {
  const nameDoneT = T.typeStart + 3 * T.typeStep + 0.05; // valid at 4th char
  const st = (i) => {
    if (t >= T.createClick + 0.15) return 'done';
    if (i === 0) return 'done';
    if (i === 1) return t >= nameDoneT ? 'done' : 'active';
    if (i === 2) return t >= T.resStart ? 'done' : t >= nameDoneT ? 'active' : 'idle';
    return 'idle';
  };
  return (
    <div>
      <div style={{ ...CARD, position: 'relative', marginBottom: 18 }}>
        <div style={EYEBROW}>How it works · 3 steps</div>
        <StepRow label="Click add new Machine" state={st(0)} />
        <StepRow label="Create Machine name" state={st(1)} />
        <StepRow label="Select Resources" state={st(2)} />
        <StepRow label="Machine is created" state={st(3)} />
      </div>
      <div style={{ ...CARD, position: 'relative' }}>
        <div style={EYEBROW}>Trust signal</div>
        {['30 day free trial', 'No credit card required', 'Encrypted at rest'].map(l => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 14.4, color: C.accent }}>
            <CheckboxIco /><span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function CreateScene() {
  const { localTime: t } = useScene();
  const created = t >= T.done;
  const n = t < T.typeStart ? 0 : Math.min(NAME.length, 1 + Math.floor((t - T.typeStart) / T.typeStep));
  const typed = NAME.slice(0, n);
  const helper = nameHelper(n);
  const focused = t >= T.fieldClick && t < T.createClick;
  const caretOn = focused && n < NAME.length + 1 && (t % 0.7) < 0.4;
  const vcpu = 1 + TV.filter(c => t >= c).length;
  const ram = 1 + TR.filter(c => t >= c).length;
  const creating = t >= T.createClick;
  const modalOp = seg(t, T.modalIn, T.modalIn + 0.35) * (1 - seg(t, T.modalOut, T.modalOut + 0.35));
  const modalY = 12 * (1 - eo(seg(t, T.modalIn, T.modalIn + 0.4)));
  const createHov = t >= T.createHover && !creating;
  const selGlitch = glitchState(t, [[T.done, T.done + 0.4]], 71);
  const wp = [
    { t: 0.05, x: 1180, y: 660 }, { t: 0.4, x: 194, y: 85 },        // → + button
    { t: 0.7, x: 194, y: 85 }, { t: 1.0, x: 880, y: 216 },          // → name field
    { t: 2.6, x: 880, y: 216 }, { t: 2.95, x: 1064, y: 424 },       // → vCPU +
    { t: 3.33, x: 1064, y: 424 }, { t: 3.5, x: 1064, y: 500 },      // → RAM +
    { t: 3.9, x: 1064, y: 500 }, { t: 4.35, x: 1066, y: 668 },      // → Create Machine
    { t: 5.15, x: 1066, y: 668 }, { t: 5.8, x: 1320, y: 720 },      // exit
  ];
  const rowGlowT = t;
  const cam = camAt([
    { t: 0, x: 640, y: 360, z: 1 }, { t: 0.15, x: 640, y: 360, z: 1 },
    { t: 0.45, x: 240, y: 140, z: 1.5 }, { t: 0.65, x: 240, y: 140, z: 1.5 },    // + button
    { t: 1.0, x: 800, y: 380, z: 1.12 },                                        // modal overview
    // z 1.25 shots keep the side-hint checklist in frame with the modal target
    { t: 1.35, x: 647, y: 288, z: 1.25 }, { t: 2.6, x: 647, y: 288, z: 1.25 },  // name field + steps
    { t: 3.0, x: 647, y: 380, z: 1.25 }, { t: 4.0, x: 647, y: 380, z: 1.25 },   // resources + steps
    { t: 4.4, x: 647, y: 432, z: 1.25 }, { t: 5.1, x: 647, y: 432, z: 1.25 },   // create btn + steps
    { t: 5.7, x: 640, y: 360, z: 1 },
  ], t);
  return (
    <Screen cam={cam}>
      <PageChrome t={t} machineName={created ? NAME : 'No Machines'} dotColor={created ? C.accent : C.blue}
        plusPulse={t < T.plusClick} selGlitch={selGlitch} logoGlitch={{ on: false, d: GLITCH_PATHS[0], dx: 0, dy: 0 }} />
      <EmptyHint t={t} inStart={-99} outStart={T.plusClick} glowStart={-3.1} k={0.7} />
      {/* backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', opacity: modalOp, zIndex: 200, display: modalOp > 0 ? 'block' : 'none' }} />
      {modalOp > 0 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 300, opacity: modalOp }}>
          {/* side hint */}
          <div style={{ position: 'absolute', left: 116, top: MODAL.top, width: 428 }}>
            <SideSteps t={t} />
          </div>
          {/* modal */}
          <div style={{ position: 'absolute', left: MODAL.x, top: MODAL.top + modalY, width: MODAL.w, background: C.card, border: '1px solid #333', borderRadius: 12, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 600, fontSize: 16.8, color: C.text }}>New Machine</span>
              <span style={{ color: C.text2, display: 'flex' }}><CloseIco /></span>
            </div>
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ color: 'rgba(17,163,42,0.72)', fontSize: 14.7, fontWeight: 700, marginBottom: 10 }}>Basic</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginBottom: 5 }}>Machine Name</div>
              <div style={{
                height: 44, border: `1px solid ${focused ? C.accent : C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', padding: '0 14px',
                boxShadow: focused ? `0 0 0 2px ${C.glow}` : 'none', boxSizing: 'border-box',
              }}>
                <span style={{ fontFamily: F.mono, fontSize: 13.6, color: typed ? C.text : 'rgba(255,255,255,0.3)' }}>{typed || 'my-app'}</span>
                {caretOn && <span style={{ width: 1.5, height: 18, background: C.text, marginLeft: 1 }} />}
              </div>
              <div style={{ fontSize: 11.5, color: helper.col, margin: '5px 0 0' }}>{helper.txt}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', margin: '14px 0 5px' }}>Organization</div>
              <div style={{ height: 40, border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', boxSizing: 'border-box' }}>
                <span style={{ fontSize: 13.6, color: C.text }}>Personal</span>
                <span style={{ color: C.muted, display: 'flex' }}><CaretIco s={14} /></span>
              </div>
              <div style={{ height: 1, background: C.border, opacity: 0.7, margin: '16px 0 12px' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ color: 'rgba(17,163,42,0.72)', fontSize: 14.7, fontWeight: 700 }}>Resources</span>
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Pick now — change anytime later.</span>
              </div>
              <ResourceRow label="vCPU" desc="Dedicated compute cores" valTxt={`${vcpu}`} price={`$${(10 * vcpu).toFixed(2)}`} pct={(vcpu - 1) / 15 * 100}
                plusHot={t >= TV[0] - 0.15 && t < TV[TV.length - 1] + 0.25} glowT={rowGlowT} glowSalt={0} />
              <ResourceRow label="RAM" desc="Memory (GB)" valTxt={`${ram}GB`} price={`$${(5 * ram).toFixed(2)}`} pct={(ram - 1) / 63 * 100}
                plusHot={t >= TR[0] - 0.15 && t < TR[TR.length - 1] + 0.25} glowT={rowGlowT} glowSalt={1.5} />
              <ResourceRow label="Storage" desc="NVMe SSD (GB)" valTxt="1GB" price="$0.01" pct={0} glowT={rowGlowT} glowSalt={3} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 22, padding: '12px 24px', borderTop: `1px solid ${C.border}`, marginTop: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 22px', borderRadius: 8,
                background: createHov ? '#11A32A90' : '#11a329e1', color: '#fff', fontSize: 14.7, fontWeight: 600,
                border: '1px solid rgba(17,163,42,0.5)',
                boxShadow: createHov ? '0 0 35px rgba(17,163,42,0.5)' : '0 0 20px rgba(17,163,42,0.3)',
                transform: `scale(${createHov ? 1.02 : t >= T.createClick && t < T.createClick + 0.15 ? 0.97 : 1})`,
                opacity: creating ? 0.6 : 1,
              }}>{creating ? 'Creating...' : 'Create Machine'}</div>
            </div>
          </div>
        </div>
      )}
      <Cursor wp={wp} t={t} clicks={[T.plusClick, T.fieldClick, ...TV, ...TR, T.createClick]} fade={1 - seg(t, 5.5, 5.95)} />
    </Screen>
  );
}

/* ══ pods-side helpers ══ */
const CanvasDots = () => (
  <div style={{ position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
);
const POD_STEPS = ['Click Add Pod', 'Choose Pod Type', 'Configure & deploy', 'Pod is running'];
function PodSideCards({ states }) {
  return (
    <div>
      <div style={{ ...CARD, position: 'relative', marginBottom: 18 }}>
        <div style={EYEBROW}>How it works · 3 steps</div>
        {POD_STEPS.map((l, i) => <StepRow key={l} label={l} state={states[i]} />)}
      </div>
      <div style={{ ...CARD, position: 'relative' }}>
        <div style={EYEBROW}>Trust signal</div>
        {['30 day free trial', 'No credit card required', 'Encrypted at rest'].map(l => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 14.4, color: C.accent }}>
            <CheckboxIco /><span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ PodsHint — "No pods yet" helper, connector runs RIGHT to the Add Pod button ══ */
const PH = { x: 426, w: 428, railX: 914, btnX: 1194, btnY: 85, interY: 160, cards: [{ top: 160, h: 106 }, { top: 284, h: 232 }, { top: 534, h: 146 }] };
const PH_MIDS = PH.cards.map(c => c.top + c.h / 2);
const PGLOW_P = 5.4;
function PodsHint({ t, inStart, outStart = 1e9, glowStart }) {
  const k = 0.5;
  const g = glitchState(t, [[inStart, inStart + 0.6 * k]], 61);
  const inDone = t >= inStart + 2.4 * k;
  const exiting = t >= outStart;
  const wrapOp = t < inStart ? 0 : exiting ? 1 - seg(t, outStart + 0.39, outStart + 0.56) : 1;
  if (wrapOp <= 0) return null;
  const textOp = exiting ? 1 - seg(t, outStart + 0.25, outStart + 0.46) : seg(t, inStart + 0.42, inStart + 0.7);
  const lineSX = (i) => exiting
    ? 1 - seg(t, outStart + 0.25 + i * 0.06, outStart + 0.46 + i * 0.06)
    : seg(t, inStart + 0.42 + (2 - i) * 0.07, inStart + 0.7 + (2 - i) * 0.07);
  const railSY = exiting ? 1 - seg(t, outStart + 0.21, outStart + 0.39) : seg(t, inStart + 0.84, inStart + 1.12);
  const hlineSX = exiting ? 1 - seg(t, outStart + 0.1, outStart + 0.28) : seg(t, inStart + 1.12, inStart + 1.4);
  const rail2SY = exiting ? 1 - seg(t, outStart, outStart + 0.18) : seg(t, inStart + 1.4, inStart + 1.68);
  const gt = inDone && !exiting ? ((t - glowStart) % PGLOW_P + PGLOW_P) % PGLOW_P : -1;
  const glows = {
    lines: [glowFor(gt, 0.2, 1.0), glowFor(gt, 0.1, 1.0), glowFor(gt, 0, 1.0)],
    rail: glowFor(gt, 1.0, 1.6), hline: glowFor(gt, 2.5, 1.6), rail2: glowFor(gt, 4.0, 1.0),
  };
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: wrapOp, transform: g.on ? `translate(${g.dx}px, ${g.dy}px)` : 'none', clipPath: g.on ? 'url(#g-podhint-clip)' : 'none', zIndex: 10 }}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs><clipPath id="g-podhint-clip" clipPathUnits="objectBoundingBox"><path d={g.d} transform="scale(0.0025, 0.0025)" /></clipPath></defs>
      </svg>
      {/* card stubs → rail (rightward) */}
      {PH_MIDS.map((my, i) => (
        <div key={i} style={{ position: 'absolute', left: PH.x + PH.w, top: my - 1, width: PH.railX - (PH.x + PH.w) - 1, height: 2, background: C.accent, opacity: 0.5, transform: `scaleX(${lineSX(i)})`, transformOrigin: 'left center', overflowX: 'clip', overflowY: 'visible' }}>
          <HGlow glow={glows.lines[i]} dir="ltr" />
        </div>
      ))}
      {/* rail: last-card mid up to the corner */}
      <div style={{ position: 'absolute', left: PH.railX, top: PH.interY + 2, width: 2, height: PH_MIDS[2] - PH.interY, background: C.accent, opacity: 0.6, transform: `scaleY(${railSY})`, transformOrigin: 'center bottom', overflowY: 'clip', overflowX: 'visible' }}>
        {glows.rail && <div style={{ position: 'absolute', left: -3, right: -3, height: 90, top: `${100 - glows.rail.p}%`, transform: 'translateY(-50%)', background: `linear-gradient(180deg, transparent, ${C.accent}, transparent)`, filter: 'blur(4px)', opacity: glows.rail.op }} />}
      </div>
      {/* hline: corner → under the Add Pod button */}
      <div style={{ position: 'absolute', left: PH.railX, top: PH.interY, width: PH.btnX - PH.railX + 1, height: 2, background: C.accent, opacity: 0.6, transform: `scaleX(${hlineSX})`, transformOrigin: 'left center', overflowX: 'clip', overflowY: 'visible' }}>
        <HGlow glow={glows.hline} dir="ltr" />
      </div>
      {/* rail2: up to the Add Pod button */}
      <div style={{ position: 'absolute', left: PH.btnX, top: PH.btnY + 2, width: 2, height: PH.interY - PH.btnY, background: C.accent, opacity: 0.6, transform: `scaleY(${rail2SY})`, transformOrigin: 'center bottom', overflowY: 'clip', overflowX: 'visible' }}>
        {glows.rail2 && <div style={{ position: 'absolute', left: -3, right: -3, height: 70, top: `${100 - glows.rail2.p}%`, transform: 'translateY(-50%)', background: `linear-gradient(180deg, transparent, ${C.accent}, transparent)`, filter: 'blur(4px)', opacity: glows.rail2.op }} />}
      </div>
      <div style={{ position: 'absolute', left: PH.x, width: PH.w, top: 0, bottom: 0 }}>
        <div style={{ ...CARD, top: PH.cards[0].top, height: PH.cards[0].h }}>
          <div style={{ opacity: textOp }}>
            <div style={{ fontSize: 16.8, fontWeight: 700, color: C.text, marginBottom: 8 }}>No pods yet</div>
            <div style={{ fontSize: 13.6, lineHeight: 1.45, color: C.muted }}>Spin up your first pod to start serving traffic. Hit the + Add Pod button above to get started.</div>
          </div>
        </div>
        <div style={{ ...CARD, top: PH.cards[1].top, height: PH.cards[1].h }}>
          <div style={{ opacity: textOp }}>
            <div style={EYEBROW}>How it works · 3 steps</div>
            {POD_STEPS.map((l, i) => <StepRow key={l} label={l} state={i === 0 ? 'active' : 'idle'} />)}
          </div>
        </div>
        <div style={{ ...CARD, top: PH.cards[2].top, height: PH.cards[2].h }}>
          <div style={{ opacity: textOp }}>
            <div style={EYEBROW}>Trust signal</div>
            {['30 day free trial', 'No credit card required', 'Encrypted at rest'].map(l => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 14.4, color: C.accent }}>
                <CheckboxIco /><span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ SCENE 5 — machine page, empty pods helper ══ */
function PodsScene() {
  const { localTime: t } = useScene();
  const noG = { on: false, d: GLITCH_PATHS[0], dx: 0, dy: 0 };
  return (
    <Screen>
      <PageChrome t={t} machineName="my-machine" dotColor={C.accent} selGlitch={noG} logoGlitch={glitchState(t, [[0.1, 0.45]], 67)} pods={{ pulse: true }} />
      <CanvasDots />
      <PodsHint t={t} inStart={0.15} glowStart={1.5} />
    </Screen>
  );
}

/* ══ SCENE 6 — Add Pod modal: every category dropdown, pick GitHub Repo ══ */
const CATS = [
  { label: 'Applications', icon: <MI d={MUI_D.code} s={16} />, items: [[<GithubIco key="i" />, 'GitHub Repo'], [<MI key="i" d={MUI_D.build} />, 'Background Worker'], [<MI key="i" d={MUI_D.rocket} />, 'Release Task']] },
  { label: 'Databases', icon: <MI d={MUI_D.storage} s={16} />, items: [[<MI key="i" d={SI_D.postgres} />, 'PostgreSQL'], [<MI key="i" d={SI_D.redis} />, 'Redis'], [<MI key="i" d={SI_D.mongo} />, 'MongoDB'], [<MI key="i" d={MUI_D.storage} />, 'SQL Server']] },
  { label: 'Services', icon: <MI d={MUI_D.extension} s={16} />, items: [[<MI key="i" d={SI_D.nats} />, 'NATS'], [<MI key="i" d={SI_D.meili} />, 'Meilisearch'], [<PackageIco key="i" />, 'S3 Storage'], [<MI key="i" d={MUI_D.lock} />, 'OAuth2 Proxy'], [<MI key="i" d={MUI_D.schedule} />, 'Cron Jobs']] },
  { label: 'Observability', icon: <MI d={MUI_D.insights} s={16} />, items: [[<MI key="i" d={MUI_D.insights} />, 'Grafana'], [<MI key="i" d={MUI_D.bug} />, 'GlitchTip']] },
  { label: 'AI', icon: <MI d={MUI_D.robot} s={16} />, items: [[<MI key="i" d={MUI_D.robot} />, 'Devo AI']] },
];
const OPEN_SEQ = [[0, 1.5], [1, 2.8], [2, 4.1], [3, 5.4], [4, 6.7]];
const AP = { x: 580, w: 520 };
function AddPodScene() {
  const { localTime: t } = useScene();
  const noG = { on: false, d: GLITCH_PATHS[0], dx: 0, dy: 0 };
  let ai = -1;
  for (let i = 0; i < OPEN_SEQ.length; i++) if (t >= OPEN_SEQ[i][1]) ai = i;
  const p = ai >= 0 ? seg(t, OPEN_SEQ[ai][1], OPEN_SEQ[ai][1] + 0.3) : 0;
  const openP = (i) => (ai >= 0 && OPEN_SEQ[ai][0] === i ? p : 0) + (ai > 0 && OPEN_SEQ[ai - 1][0] === i ? 1 - p : 0);
  const itemsH = (i) => CATS[i].items.length * 41;
  let acc = 0; const hOff = CATS.map((c, i) => { const o = acc; acc += itemsH(i) * openP(i); return o; });
  const modalH = 56 + 5 * 46 + acc + 8;
  const MT = Math.max(66, (720 - modalH) / 2);
  const hY = (i) => MT + 56 + i * 46 + hOff[i];
  const modalOp = seg(t, 1.05, 1.35);
  const modalRise = 12 * (1 - eo(seg(t, 1.05, 1.4)));
  const hovWin = (i) => OPEN_SEQ.some(([ci, ct]) => ci === i && t >= ct - 0.3 && t < ct + 0.35);
  const ghHov = false;
  const chosen = false;
  const wp = [
    { t: 0.1, x: 1180, y: 640 }, { t: 0.6, x: 1194, y: 85 },
    { t: 1.15, x: 1194, y: 85 }, { t: 1.45, x: 640, y: hY(0) + 23 },
    { t: 2.5, x: 640, y: hY(0) + 23 }, { t: 2.75, x: 640, y: hY(1) + 23 },
    { t: 3.8, x: 640, y: hY(1) + 23 }, { t: 4.05, x: 640, y: hY(2) + 23 },
    { t: 5.1, x: 640, y: hY(2) + 23 }, { t: 5.35, x: 640, y: hY(3) + 23 },
    { t: 6.4, x: 640, y: hY(3) + 23 }, { t: 6.65, x: 640, y: hY(4) + 23 },
    { t: 7.7, x: 640, y: hY(4) + 23 }, { t: 8.2, x: 1320, y: 700 },
  ];
  // camera: punch to Add Pod, then a tight follow-cam that tracks each opened
  // category down the list, then pull back for the pick + checklist
  let cam = camAt([
    { t: 0, x: 640, y: 360, z: 1 }, { t: 0.35, x: 640, y: 360, z: 1 },
    { t: 0.7, x: 1100, y: 120, z: 1.45 }, { t: 1.05, x: 1100, y: 120, z: 1.45 },
    { t: 1.5, x: 655, y: 320, z: 1.28 }, { t: 7.6, x: 655, y: 320, z: 1.28 },
    { t: 8.2, x: 640, y: 360, z: 1 },
  ], t);
  if (t > 1.55 && t < 7.55 && ai >= 0) {
    const yFor = (i) => hY(i) + 23 + itemsH(i) / 2;
    const yPrev = ai > 0 ? yFor(OPEN_SEQ[ai - 1][0]) : yFor(OPEN_SEQ[ai][0]);
    const yCur = yFor(OPEN_SEQ[ai][0]);
    cam = { x: 655, y: yPrev + (yCur - yPrev) * eio(p), z: 1.28 };
  }
  // side hint fades out while the follow-cam is tight on the categories
  const hintOp = 1 - seg(t, 1.5, 1.8);
  return (
    <Screen cam={cam}>
      <PageChrome t={t} machineName="my-machine" dotColor={C.accent} selGlitch={noG} logoGlitch={noG}
        pods={{ pulse: t < 0.75, pressed: t >= 0.75 && t < 0.9 }} />
      <CanvasDots />
      <PodsHint t={t} inStart={-99} outStart={0.75} glowStart={-2.2} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', opacity: modalOp, zIndex: 200, display: modalOp > 0 ? 'block' : 'none' }} />
      {modalOp > 0 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 300, opacity: modalOp }}>
          <div style={{ position: 'absolute', left: 96, top: MT, width: 428, opacity: hintOp }}>
            <PodSideCards states={['done', chosen ? 'done' : 'active', chosen ? 'active' : 'idle', 'idle']} />
          </div>
          {/* left-side commercial titles that swap per opened dropdown, with glitch */}
          {ai >= 0 && t >= 1.4 && t < 7.6 && (() => {
            const CAT_COPY = [
              { e: 'Applications', tt: 'Ship your\napps.', s: 'Repos, workers & release tasks.' },
              { e: 'Databases', tt: 'Managed\ndatabases.', s: 'Postgres, Redis, Mongo, SQL Server.' },
              { e: 'Services', tt: 'Plug in\nservices.', s: 'NATS, Meili, S3, OAuth2, Cron.' },
              { e: 'Observability', tt: 'See\neverything.', s: 'Grafana + GlitchTip, built in.' },
              { e: 'AI', tt: 'Meet\nDevo AI.', s: 'Your AI copilot for ops.' },
            ];
            const copy = ai === 5 ? { e: 'One menu', tt: 'Your whole\nstack.', s: 'Deploy anything in one click.' } : CAT_COPY[OPEN_SEQ[ai][0]];
            const ct = OPEN_SEQ[ai][1];
            const reveal = eo(seg(t, ct, ct + 0.4));
            const split = 1 - seg(t, ct, ct + 0.34);
            const gb = glitchState(t, [[ct, ct + 0.3]], (ai + 1) * 17);
            const jit = gb.on ? gb.dx : 0;
            const shown = scramble(copy.tt, reveal, (ai + 3) * 9, t);
            return (
              <div style={{ position: 'absolute', left: 168, top: cam.y - 92, width: 360, textAlign: 'left', transform: `translateX(${jit}px)`, pointerEvents: 'none' }}>
                <div style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.24em', color: C.accent, textTransform: 'uppercase', marginBottom: 12, opacity: flickerIn(t, ct + 0.02, 0.26) }}>{copy.e}</div>
                <GlitchType text={shown} size={54} split={split} jitter={jit} />
                <div style={{ fontSize: 16, fontWeight: 500, color: C.text2, marginTop: 16, opacity: flickerIn(t, ct + 0.14, 0.3) }}>{copy.s}</div>
              </div>
            );
          })()}
          <div style={{ position: 'absolute', left: AP.x, top: MT + modalRise, width: AP.w, background: C.card, border: '1px solid #333', borderRadius: 12, boxSizing: 'border-box', overflow: 'hidden', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 24px', borderBottom: `1px solid ${C.border}`, boxSizing: 'border-box' }}>
              <span style={{ fontWeight: 600, fontSize: 16.8, color: C.text }}>Add Pod</span>
              <span style={{ color: C.text2, display: 'flex' }}><CloseIco /></span>
            </div>
            {CATS.map((cat, i) => {
              const o = openP(i);
              return (
                <div key={cat.label}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 24px', boxSizing: 'border-box',
                    borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 14.7, fontWeight: 600, color: C.text,
                    background: o > 0.5 ? 'rgba(17,163,42,0.04)' : hovWin(i) ? 'rgba(255,255,255,0.03)' : 'transparent',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.text }}>
                      <span style={{ color: C.accent, display: 'flex' }}>{cat.icon}</span> {cat.label}
                    </span>
                    <span style={{ display: 'flex', opacity: 0.5, transform: `rotate(${-90 + 90 * o}deg)` }}><CaretIco s={15} /></span>
                  </div>
                  <div style={{ height: itemsH(i) * o, overflow: 'hidden', borderBottom: o > 0.02 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    {cat.items.map(([ico, label]) => (
                      <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: 12, height: 41, padding: '0 24px 0 44px', boxSizing: 'border-box',
                        fontSize: 14.4, fontWeight: 500, color: C.text,
                        background: i === 0 && label === 'GitHub Repo' && ghHov ? 'rgba(255,255,255,0.04)' : 'transparent',
                      }}>
                        <span style={{ color: C.accent, display: 'flex' }}>{ico}</span> {label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Cursor wp={wp} t={t} clicks={[0.75, 1.5, 2.8, 4.1, 5.4, 6.7]} fade={1 - seg(t, 7.9, 8.3)} />
    </Screen>
  );
}

/* ══ SCENE 7 — GitHub Repo config: connect, pick repo, deploy ══ */
const PNL = { x: 560, top: 124, w: 712, bottom: 712 };
const FIELD = { height: 38, border: `1px solid ${C.border}`, borderRadius: 8, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', boxSizing: 'border-box', fontSize: 13.6, color: C.text };
const FLABEL = { fontSize: 12.5, fontWeight: 600, color: C.text2, margin: '12px 0 5px' };
function Spinner({ t }) {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" style={{ transform: `rotate(${(t * 260) % 360}deg)` }}>
      <circle cx="9" cy="9" r="6.5" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeDasharray="26 15" strokeLinecap="round" />
    </svg>
  );
}
const GH_REPOS = [['user/my-app', false], ['user/api-service', true], ['user/landing-page', false], ['user/worker-queue', true], ['user/docs-site', false]];
const FIELD2 = { height: 34, border: `1px solid ${C.border}`, borderRadius: 8, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', boxSizing: 'border-box', fontSize: 13, color: C.text };
const FLABEL2 = { fontSize: 12, fontWeight: 600, color: C.text2, margin: '10px 0 4px' };
const CFG_CARD = { background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, boxSizing: 'border-box' };
const CFG_TITLE = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)' };
const CheckRow = ({ label, checked }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#fff', marginTop: 10 }}>
    {checked ? <CheckboxIco /> : <span style={{ width: 15, height: 15, border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 3, boxSizing: 'border-box' }} />}
    {label}
  </div>
);
function ConnectScene() {
  const { localTime: t } = useScene();
  const noG = { on: false, d: GLITCH_PATHS[0], dx: 0, dy: 0 };
  const slide = 740 * (1 - eo(seg(t, 0.05, 0.4)));
  const connecting = t >= 1.0 && t < 1.55;
  const connected = t >= 1.55;
  const ddOp = seg(t, 2.15, 2.3) * (1 - seg(t, 2.75, 2.9));
  const picked = t >= 2.75;
  const named = t >= 2.9;
  const branchShown = t >= 2.85;
  const chipShown = t >= 3.5;
  const saveHov = t >= 4.45 && t < 4.85;
  const working = t >= 4.85;
  const panelOp = 1 - seg(t, 5.85, 6.25);
  const cam = camAt([
    { t: 0, x: 640, y: 360, z: 1 }, { t: 0.45, x: 640, y: 360, z: 1 },
    { t: 0.8, x: 526, y: 300, z: 1.45 }, { t: 1.85, x: 526, y: 300, z: 1.45 },  // connect (hint in frame)
    { t: 2.1, x: 640, y: 420, z: 1.05 }, { t: 3.0, x: 640, y: 420, z: 1.05 },   // repo dropdown — pulled back to overview
    { t: 3.45, x: 640, y: 430, z: 1.02 }, { t: 5.5, x: 640, y: 430, z: 1.02 },  // whole form + save button in frame
    { t: 6.15, x: 640, y: 360, z: 1 },
  ], t);
  const wp = [
    { t: 0.1, x: 900, y: 500 }, { t: 0.85, x: 665, y: 295 },
    { t: 1.85, x: 665, y: 295 }, { t: 2.1, x: 750, y: 353 },
    { t: 2.45, x: 750, y: 353 }, { t: 2.65, x: 700, y: 391 },
    { t: 3.4, x: 700, y: 391 }, { t: 4.45, x: 1164, y: 684 },
    { t: 5.35, x: 1164, y: 684 }, { t: 6.1, x: 1320, y: 740 },
  ];
  return (
    <Screen cam={cam}>
      <PageChrome t={t} machineName="my-machine" dotColor={C.accent} selGlitch={noG} logoGlitch={noG} pods={{}} />
      <CanvasDots />
      {/* helper checklist — visible the whole scene */}
      <div style={{ position: 'absolute', left: 96, top: PNL.top, width: 428, opacity: panelOp, zIndex: 250 }}>
        <PodSideCards states={['done', 'done', working ? 'done' : 'active', t >= 5.25 ? 'done' : 'idle']} />
      </div>
      {/* config panel — full create form, 2 columns */}
      <div style={{ position: 'absolute', left: PNL.x, top: PNL.top, width: PNL.w, height: PNL.bottom - PNL.top, background: '#1e1d1d', border: `1px solid ${C.border}`, borderRadius: 12, boxSizing: 'border-box', transform: `translateX(${slide}px)`, opacity: panelOp, zIndex: 240, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 12px' }}>
          <span style={{ fontSize: 16.8, fontWeight: 700, color: C.text }}>GitHub Repo</span>
          <span style={{ color: C.muted, display: 'flex' }}><CloseIco /></span>
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '2px 24px 0' }}>
          {/* left column */}
          <div style={{ width: 331, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={CFG_CARD}>
              <div style={CFG_TITLE}><GithubIco /> GitHub Repository</div>
              {!connected ? (
                <div>
                  <div style={{ fontSize: 13, color: C.text2, margin: '10px 0', lineHeight: 1.4 }}>Connect your GitHub account to select a repository</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: connecting ? C.accentHover : C.accent, color: '#fff', borderRadius: 4, padding: '6px 13px', fontSize: 12.4, fontWeight: 600 }}>
                    {connecting ? <Spinner t={t} /> : <GithubIco />}
                    {connecting ? 'Connecting...' : 'Connect GitHub'}
                  </span>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.2, margin: '10px 0 0' }}>
                    <CheckIco s={14} c={C.accent} />
                    <span style={{ color: C.accent, flex: 1, whiteSpace: 'nowrap' }}>Connected as <b>@user</b></span>
                    <span style={{ border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, color: C.muted }}>Reconnect</span>
                  </div>
                  <div style={FLABEL2}>Account</div>
                  <div style={FIELD2}><span>user (User)</span><span style={{ color: C.muted, display: 'flex' }}><CaretIco s={12} /></span></div>
                  <div style={FLABEL2}>Repository</div>
                  <div style={{ ...FIELD2, border: `1px solid ${t >= 2.05 && t < 2.9 ? C.accent : C.border}` }}>
                    <span style={{ color: picked ? C.text : C.muted, fontFamily: picked ? F.mono : F.sans }}>{picked ? 'user/my-app' : 'Search repositories...'}</span>
                    <span style={{ color: C.muted, display: 'flex' }}><CaretIco s={12} /></span>
                  </div>
                  {branchShown && (
                    <div style={{ opacity: seg(t, 2.85, 3.1) }}>
                      <div style={FLABEL2}>Branch</div>
                      <div style={FIELD2}><span style={{ fontFamily: F.mono }}>main</span><span style={{ color: C.muted, display: 'flex' }}><CaretIco s={12} /></span></div>
                    </div>
                  )}
                  {t >= 2.9 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, opacity: seg(t, 2.9, 3.15) }}>
                      {!chipShown ? (
                        <>
                          <span style={{ width: 80, height: 20, borderRadius: 999, background: 'rgba(255,255,255,0.06)', opacity: 0.5 + 0.4 * Math.sin(t * 6) }} />
                          <span style={{ width: 120, height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.06)', opacity: 0.5 + 0.4 * Math.sin(t * 6 + 1) }} />
                        </>
                      ) : (
                        <>
                          <span style={{ padding: '2px 11px', borderRadius: 999, background: 'rgba(17,163,42,0.12)', border: '1px solid rgba(17,163,42,0.35)', color: C.accent, fontSize: 11.5, fontWeight: 600 }}>Next.js</span>
                          <span style={{ fontSize: 11, color: C.muted }}>Detected · default port 3000</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={CFG_CARD}>
              <div style={CFG_TITLE}><MI d={MUI_D.rocket} s={14} /> Deploy Settings</div>
              <CheckRow label="Auto-deploy on push" checked />
              <CheckRow label="Enable PR preview environments" checked={false} />
            </div>
          </div>
          {/* right column */}
          <div style={{ flex: 1 }}>
            <div style={CFG_CARD}>
              <div style={CFG_TITLE}><MI d={MUI_D.settings} s={14} /> App Configuration</div>
              <div style={FLABEL2}>App Name</div>
              <div style={{ ...FIELD2, border: `1px solid ${named && t < 3.5 ? C.accent : C.border}` }}>
                <span style={{ color: named ? C.text : 'rgba(255,255,255,0.3)', fontFamily: named ? F.mono : F.sans }}>{named ? 'my-app' : 'e.g. frontend'}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={FLABEL2}>Port</div>
                  <div style={FIELD2}><span style={{ fontFamily: F.mono }}>3000</span></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={FLABEL2}>Replicas</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34 }}>
                    <span style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`, borderRadius: 4, color: '#fff' }}><MinusIco s={12} /></span>
                    <span style={{ minWidth: 18, textAlign: 'center', fontSize: 13.6, fontWeight: 600, color: C.text }}>1</span>
                    <span style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`, borderRadius: 4, color: '#fff' }}><PlusIco s={12} /></span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: C.accent, marginTop: 10 }}>+ Add extra port</div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'flex-end', padding: '12px 24px', borderTop: `1px solid ${C.border}`, background: '#1e1d1d' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8,
            background: saveHov ? '#11A32A90' : '#11a329e1', color: '#fff', fontSize: 13.4, fontWeight: 700,
            border: '1px solid rgba(17,163,42,0.5)', boxShadow: saveHov ? '0 0 30px rgba(17,163,42,0.5)' : '0 0 16px rgba(17,163,42,0.3)',
            opacity: working ? 0.7 : 1, transform: `scale(${saveHov ? 1.02 : t >= 4.85 && t < 5.0 ? 0.97 : 1})`,
          }}>{working && <Spinner t={t} />}{working ? 'Working...' : 'Save & Deploy'}</span>
        </div>
      </div>
      {/* repo dropdown overlay */}
      {ddOp > 0 && (
        <div style={{ position: 'absolute', left: 600, top: 374, width: 324, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', zIndex: 260, opacity: ddOp, padding: '4px 0' }}>
          {GH_REPOS.map(([name, priv], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', fontSize: 12.6, fontFamily: F.mono, color: C.text, background: i === 0 && t >= 2.5 ? 'rgba(17,163,42,0.12)' : 'transparent' }}>
              <span>{name}</span>{priv && <span style={{ color: C.muted, display: 'flex' }}><LockIco s={12} /></span>}
            </div>
          ))}
        </div>
      )}
      <Cursor wp={wp} t={t} clicks={[1.0, 2.15, 2.75, 4.85]} fade={1 - seg(t, 5.9, 6.3)} />
    </Screen>
  );
}

/* ══ SCENE 8 — deployed: pod card running on the canvas ══ */
function DeployedScene() {
  const { localTime: t } = useScene();
  const noG = { on: false, d: GLITCH_PATHS[0], dx: 0, dy: 0 };
  const g = glitchState(t, [[0.25, 0.75]], 83);
  const cardOp = t < 0.25 ? 0 : flickerIn(t, 0.25);
  const running = t >= 1.3;
  const outro = 0;
  const logoShow = t >= 2.95 && t < 4.97;
  const gLogo = glitchState(t, [[2.95, 3.5], [3.9, 4.02], [4.35, 4.97]], 91);
  let logoOp = flickerIn(t, 2.95);
  if (t >= 4.35) logoOp = flickerOut(t, 4.35, 0.62);
  const cam = camAt([
    { t: 0, x: 640, y: 360, z: 1 }, { t: 0.4, x: 640, y: 360, z: 1 },
    { t: 1.0, x: 650, y: 350, z: 1.18 }, { t: 1.9, x: 650, y: 350, z: 1.18 },
    { t: 2.5, x: 640, y: 360, z: 1 },
  ], t);
  return (
    <Screen cam={cam}>
      <PageChrome t={t} machineName="my-machine" dotColor={C.accent} selGlitch={noG} logoGlitch={noG} pods={{}} />
      <CanvasDots />
      <Glitch id="g-podcard" g={g} style={{ position: 'absolute', left: 490, top: 300, width: 300, opacity: cardOp }}>
        <div style={{ background: '#1e1d1d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: C.accent, display: 'flex' }}><GithubIco /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.4, fontWeight: 600, color: C.text }}>my-app</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2, fontFamily: F.mono }}>user/my-app · main</div>
            </div>
            <span style={{
              padding: '2px 10px', borderRadius: 999, fontSize: 10.8, fontWeight: 700, textTransform: 'lowercase',
              background: running ? 'rgba(17,163,42,0.12)' : 'rgba(253,203,110,0.12)',
              color: running ? C.accent : '#fdcb6e',
              border: `1px solid ${running ? 'rgba(17,163,42,0.35)' : 'rgba(253,203,110,0.35)'}`,
              transition: 'color 0.3s, background 0.3s, border-color 0.3s',
            }}>{running ? 'running' : 'building'}</span>
          </div>
        </div>
      </Glitch>
      {/* outro — logo glitch, same treatment as the intro */}
      {outro > 0 && (
        <div style={{ position: 'absolute', inset: 0, background: C.bg, opacity: outro, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {logoShow && (
            <div style={{ transform: `scale(${1 + 0.1 * seg(t, 2.6, 5.0)})`, textAlign: 'center' }}>
              <Glitch id="g-logo-out" g={gLogo} style={{ opacity: logoOp }}>
                <img src={window.__resources && window.__resources.logo || "/commercial/logo.svg"} alt="usectl" style={{ display: 'block', height: 74, width: 74 * (230 / 37) }} />
              </Glitch>
              <div style={{ fontSize: 23, fontWeight: 500, color: C.text2, marginTop: 24, opacity: logoOp * flickerIn(t, 3.2, 0.3) }}>
                Deploy anything. <span style={{ color: C.accent, fontWeight: 700 }}>In seconds.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}

/* ══ piece root ══ */
function UsectlCommercial() {
  return (
    <SceneStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#0d0d0d">
      {{ Logo: LogoScene, Login: LoginScene, Machines: MachinesScene, Create: CreateScene, Pods: PodsScene, AddPod: AddPodScene, Connect: ConnectScene, Deployed: DeployedScene, Card: Interstitial }}
    </SceneStage>
  );
}
window.UsectlCommercial = UsectlCommercial;
