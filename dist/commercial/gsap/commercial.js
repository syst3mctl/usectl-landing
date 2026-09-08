/* usectl commercial — pure GSAP build (no React, no Babel, no per-frame VDOM).
   Faithful port of public/commercial/usectl-scenes.jsx choreography onto one
   master gsap.timeline. GPU discipline:
     - the timeline only ANIMATES transform / opacity / clip-path (compositor);
     - state flips (hover colors, borders, text) are one-off .set()/.call()s —
       a single repaint, never a per-frame paint;
     - continuous glows/pulses are pre-built blurred layers moved with
       transforms, never animated box-shadow / background / left-top;
     - the whole stage scales with a single transform; playback pauses
       offscreen and honors prefers-reduced-motion.
   Scene slots mirror the authored OM_SCENES (dur = slot seconds, nat =
   authored choreography seconds; each scene timeline is authored in nat time
   and timeScale'd into its slot exactly like the v2 engine's time-stretch). */
(function () {
  'use strict';

  var SCENES = [
    { name: 'Login',    dur: 2.6, nat: 2.5 },
    { name: 'Machines', dur: 3.0, nat: 2.0 },
    { name: 'Create',   dur: 8.5, nat: 5.8 },
    { name: 'Pods',     dur: 2.0, nat: 2.0 },
    { name: 'AddPod',   dur: 7.8, nat: 7.6 },
    { name: 'Connect',  dur: 6.6, nat: 6.4 },
    { name: 'Deployed', dur: 3.2, nat: 3.2 }
  ];

  var C = {
    bg: '#1e1d1d', card: '#1a1a1a', border: '#2a2a2a', borderHover: '#3a3a3a',
    text: '#b7b6b6', text2: '#b4b4b4', muted: 'rgba(255,255,255,0.52)',
    accent: '#11a32a', accentHover: '#0ec435', danger: '#e74c3c', blue: '#74b9ff'
  };
  var MONO = "'JetBrains Mono',monospace";
  var LOGO = '/commercial/logo.svg';

  /* ── deterministic helpers (identical math to the source) ── */
  function prand(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  var SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>*#$@';
  function scrambleText(str, reveal, seed, t) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === ' ' || ch === '\n') { out += ch; continue; }
      var settleAt = i / str.length * 0.72;
      if (reveal >= settleAt + 0.28) out += ch;
      else out += SCRAMBLE[Math.floor(prand(seed + i * 7.31 + Math.floor(t * 26)) * SCRAMBLE.length)];
    }
    return out;
  }

  /* the three glitch clip shapes (objectBoundingBox, scaled 0.0025) */
  var GLITCH_PATHS = ["M400,21.66V10.49h-116.29V0H39.36V54.56H0v36.09H101.25v9.77H.23v5.52H101.25v14.44H22.77v15.29H13.82v39.06H.23v6.79H13.82v15.29h60.63v20.81H10.25v51.17H.23v26.75H61.69v30.57h-29.35v12.1H0v30.57H22.77v31.36H400v-25.41h-31.43v-5.95h31.43v-8.28h-31.43v-15.92h-9.57v-14.65h32.56v-13.38h8.44v-10.83h-8.44v-52.23h-79.37v-21.02h69.78v-7.64h18.03v-24.7h-8.44v-52.58h-22.99v-11.89h31.43v-15.29h-31.43v-36.3h31.43V35.03h-116.29v-13.38h116.29ZM138.57,120.38h15.14v15.29h-15.14v-15.29ZM74.45,386.85v-18.08h39.56v14.01h144.19v4.06H74.45Zm89.32-42.28v-6.37h-34.45v-12.1h48.49v18.47h-14.04Zm56.73-25.48h-5.05v-2.55h5.05v2.55Zm-5.05-13.38v-10.19h5.05v10.19h-5.05Z", "M398.2,238.77v-14.06h2.28v-24.74h-2.28v-37.76h-8.45v-4.24H215.93v-3.23h178.76v-61.25H254.7v-3.19h33.11v-11.59h102.55V29.58h-52.25V0H93.75V13.18H0v11.19H39.84v29.77H.48v36.15H39.84v28.22H18.22v6.81h5.04v10.06H14.3v61.25h60.63v2.12H1.05v56.57H29.76v21.71H96.62v3.81h4.79v7.66h-3.83v-6.14H.6v14.67H62.17v13.8H.48v30.62H82.37v3.83h35.94v8.77H15.17v13.3H118.31v8.77H.48v23.84H244.84v-12.97h134.3v-18.11h21.34v-8.29h-21.34v-26.19h19.02v-25.45h-42.19v-26.19h18.5v-1.93h26.01v-10.85h-26.01v-25.51h-71.49v-5.73h95.22Zm-171.06-75.27v14.95h-11.21v-14.95h11.21Zm-88.09-38.17h38.45v-5.25h15.55v15.31h-54.01v-10.06Zm76.88,189.34v-3.83h40.42v14.92h-10.22v-11.09h-30.21Zm-45.94,30.62h7.52v8.77h-7.52v-8.77Zm0,22.07h7.52v8.77h-7.52v-8.77Z", "M400.21,112.61v-15.31H234.82v-9.04h52.51v-6.59h112.67V32.54h-33.6V6.06h-95.3V0H69.47V2.36H29.34V13.55h40.13v7.51H32.34v20.87h-12.38v10.18H0v36.15H19.96v49.37h18.2v23.05H13.82v11.8H.23v6.81H13.82v37.96h18.52v22.74H13.14v13.3h19.2v8.96h106.23v4.44H.23v26.8H61.69v30.62h-29.35v14.67H114.47v11.23H17.55v30.62h18.3v17.63h51.68v-17.63h26.94v11.98h143.72v5.65h141.81v-25.45h-114.47v-5.21h101.25v-.75h13.22v-8.29h-13.22v-29.24h-17.58v-10.32h30.72v-10.85h-30.72v-5.11h30.72v-31.26h-16.99v-29.1h17.08v-24.74h-60.14v-6.74h-24.11v-8.11h70.6v-61.25h-20.92v-29.24h34.78Zm-164.97,180.87v-8.94h88.66v12.37h-108.46v-3.43h19.79Zm-50.53-151.63v18.82h-30.76v-23.05h71.6v4.23h-40.84Z"];

  /* ── svg icon strings ── */
  function svgP(vb, s, body, extra) {
    return '<svg width="' + s + '" height="' + s + '" viewBox="' + vb + '" ' + (extra || '') + '>' + body + '</svg>';
  }
  var STK = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  var ico = {
    github: function (s) { return svgP('0 0 16 16', s || 19, '<path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>'); },
    google: function (s) { return svgP('0 0 24 24', s || 19, '<path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>'); },
    caret: function (s) { return svgP('0 0 18 18', s || 14, '<path d="M4.5 7l4.5 4.5L13.5 7" ' + STK + ' stroke-width="1.8"/>'); },
    plus: function (s) { return svgP('0 0 18 18', s || 18, '<path d="M9 3v12M3 9h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'); },
    minus: function (s) { return svgP('0 0 18 18', s || 14, '<path d="M3 9h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'); },
    close: function (s) { return svgP('0 0 18 18', s || 15, '<path d="M4 4l10 10M14 4L4 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'); },
    check: function (s, c) { return svgP('0 0 18 18', s || 16, '<path d="M3.5 9.5l4 4 7.5-8.5" fill="none" stroke="' + (c || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'); },
    arrow: function (s) { return svgP('0 0 18 18', s || 14, '<path d="M2.5 9h12M9.5 3.5L15 9l-5.5 5.5" ' + STK + ' stroke-width="1.8"/>'); },
    checkbox: function () { return svgP('0 0 18 18', 17, '<rect x="1" y="1" width="16" height="16" rx="3" fill="' + C.accent + '"/><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'); },
    filter: function () { return svgP('0 0 24 24', 15, '<path fill="currentColor" d="M10 18h4v-2h-4zM3 6v2h18V6zm3 7h12v-2H6z"/>'); },
    lock: function (s) { return svgP('0 0 18 18', s || 17, '<rect x="4" y="8" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 8V6a3 3 0 016 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/>'); },
    pkg: function (s) { return svgP('0 0 24 24', s || 18, '<path d="M7.5 4.27l9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7l8.7 5 8.7-5"/><path d="M12 22v-10"/>', STK + ' stroke-width="2"'); },
    mi: function (d, s) {
      var ps = (Array.isArray(d) ? d : [d]).map(function (p) { return '<path d="' + p + '"/>'; }).join('');
      return svgP('0 0 24 24', s || 18, ps, 'fill="currentColor"');
    },
    spinner: function () { return '<svg class="uc-spin" width="14" height="14" viewBox="0 0 18 18"><circle cx="9" cy="9" r="6.5" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-dasharray="26 15" stroke-linecap="round"/></svg>'; },
    cursor: function () { return '<svg width="27" height="31" viewBox="0 0 14 17"><path d="M1.5 1 L1.5 13.6 L4.7 10.7 L6.8 15.6 L9.2 14.5 L7.1 9.8 L11.4 9.6 Z" fill="#101010" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/></svg>'; }
  };
  var MUI = {
    code: 'M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6z',
    build: 'm22.7 19-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4',
    rocket: 'M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55zM11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.3-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83zm6.48-2.19c-2.29 2.04-5.58 3.44-5.89 3.57L13.31 22l4.05-4.05c.47-.47.68-1.15.55-1.81zM9 18c0 .83-.34 1.58-.88 2.12C6.94 21.3 2 22 2 22s.7-4.94 1.88-6.12C4.42 15.34 5.17 15 6 15c1.66 0 3 1.34 3 3m4-9c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2',
    storage: 'M2 20h20v-4H2zm2-3h2v2H4zM2 4v4h20V4zm4 3H4V5h2zm-4 7h20v-4H2zm2-3h2v2H4z',
    extension: 'M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11',
    lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1z',
    schedule: ['M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8', 'M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z'],
    insights: ['M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2', 'm15 9 .94-2.07L18 6l-2.06-.93L15 3l-.92 2.07L12 6l2.08.93zM3.5 11 4 9l2-.5L4 8l-.5-2L3 8l-2 .5L3 9z'],
    bug: 'M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20zm-6 8h-4v-2h4zm0-4h-4v-2h4z',
    robot: 'M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3M7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5M16 17H8v-2h8zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13',
    settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'
  };
  var SI = {
    postgres: 'M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698z',
    redis: 'M22.71 13.145c-1.66 2.092-3.452 4.483-7.038 4.483-3.203 0-4.397-2.825-4.48-5.12.701 1.484 2.073 2.685 4.214 2.63 4.117-.133 6.94-3.852 6.94-7.239 0-4.05-3.022-6.972-8.268-6.972-3.752 0-8.4 1.428-11.455 3.685C2.59 6.937 3.885 9.958 4.35 9.626c2.648-1.904 4.748-3.13 6.784-3.744C8.12 9.244.886 17.05 0 18.425c.1 1.261 1.66 4.648 2.424 4.648.232 0 .431-.133.664-.365a100.49 100.49 0 0 0 5.54-6.765c.222 3.104 1.748 6.898 6.014 6.898 3.819 0 7.604-2.756 9.33-8.965.2-.764-.73-1.361-1.261-.73zm-4.349-5.013c0 1.959-1.926 2.922-3.685 2.922-.941 0-1.664-.247-2.235-.568 1.051-1.592 2.092-3.225 3.21-4.973 1.972.334 2.71 1.43 2.71 2.619z',
    mongo: 'M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0 1 11.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 0 0 3.639-8.464c.01-.814-.103-1.662-.197-2.218zm-5.336 8.195s0-8.291.275-8.29c.213 0 .49 10.695.49 10.695-.381-.045-.765-1.76-.765-2.405z',
    nats: 'M12.004 0H.404v18.807h9.938l1.714 1.602v-.026L15.966 24v-5.193h7.63V0H12.003zm7.578 14.45H15.38L6.898 6.519v7.93H4.116V4.376h4.349l8.344 7.784V4.375h2.773V14.45z',
    meili: 'm6.505 18.998 4.434-11.345a4.168 4.168 0 0 1 3.882-2.651h2.674l-4.434 11.345a4.169 4.169 0 0 1-3.883 2.651H6.505Zm6.505 0 4.434-11.345a4.169 4.169 0 0 1 3.883-2.651H24l-4.434 11.345a4.168 4.168 0 0 1-3.882 2.651H13.01Zm-13.01 0L4.434 7.653a4.168 4.168 0 0 1 3.882-2.651h2.674L6.556 16.347a4.169 4.169 0 0 1-3.883 2.651H0Z'
  };

  /* ── shared HTML builders ── */
  function stepRowHtml(label, state) {
    return '<div class="uc-step ' + state + '"><span class="box"><span class="i-check">' + ico.check(16) + '</span><span class="i-arrow">' + ico.arrow(14) + '</span></span><span>' + label + '</span></div>';
  }
  function trustCardHtml(styleAttr, cls) {
    var rows = ['30 day free trial', 'No credit card required', 'Encrypted at rest'].map(function (l) {
      return '<div class="uc-trust-row">' + ico.checkbox() + '<span>' + l + '</span></div>';
    }).join('');
    return '<div class="uc-card ' + (cls || '') + '" ' + (styleAttr || '') + '><div class="fade"><div class="uc-eyebrow">Trust signal</div>' + rows + '</div></div>';
  }
  function stepsCardHtml(steps, states, styleAttr, cls) {
    return '<div class="uc-card ' + (cls || '') + '" ' + (styleAttr || '') + '><div class="fade"><div class="uc-eyebrow">How it works · 3 steps</div>' +
      steps.map(function (l, i) { return stepRowHtml(l, states[i]); }).join('') + '</div></div>';
  }
  var MACHINE_STEPS = ['Click add new Machine', 'Create Machine name', 'Select Resources', 'Machine is created'];
  var POD_STEPS = ['Click Add Pod', 'Choose Pod Type', 'Configure & deploy', 'Pod is running'];

  function chromeHtml(opts) {
    var h = '<div class="uc-nav">';
    h += '<div class="uc-sel-g"><div class="uc-sel">' +
      '<span class="uc-dot ' + opts.dot + '"></span>' +
      '<span class="uc-sel-name">' + opts.name + '</span>' +
      '<span class="caret">' + ico.caret(15) + '</span>' +
      '<span class="uc-plus"><span class="pulse-ring"></span><span class="pulse-fill"></span>' + ico.plus(17) + '</span>' +
      '</div></div>';
    if (opts.pods) {
      h += '<div class="uc-meters">' + [['CPU', '0.0/4', '#818cf8'], ['MEMORY', '0.00/4GiB', '#fdcb6e'], ['STORAGE', '0GB/1GB', '#34d399']].map(function (m) {
        return '<div class="uc-meter"><span class="lb">' + m[0] + '</span><span class="v">' + m[1] + '</span><span class="bar"><i style="background:' + m[2] + '"></i></span></div>';
      }).join('') + '</div>';
      h += '<div class="uc-nav-right"><span class="uc-chip-all">All</span><span class="uc-chip-ung">Ungrouped</span>' +
        '<span style="display:flex;align-items:center;color:rgba(255,255,255,0.5);padding:0 2px">' + ico.plus(14) + '</span>' +
        '<span class="uc-filters">' + ico.filter() + ' Filters</span>' +
        '<span class="uc-addpod"><span class="pulse-ring"></span>' + ico.plus(15) + ' Add Pod</span></div>';
    }
    return h + '</div>';
  }

  /* EmptyMachineHint geometry (Machines / Create).
     btnY targets the + button's center in the 60px nav (no header above it):
     selector is 42px tall centered in the nav, plus circle centered at y=30. */
  var HINT = { x: 426, w: 428, railX: 366, btnY: 30, btnRight: 206, cards: [{ top: 150, h: 128 }, { top: 292, h: 232 }, { top: 542, h: 146 }] };
  var HINT_MIDS = HINT.cards.map(function (c) { return c.top + c.h / 2; });
  function emptyHintHtml() {
    var hlW = HINT.railX - HINT.btnRight + 1, railH = HINT_MIDS[2] - HINT.btnY;
    var h = '<div class="uc-hint" style="position:absolute;inset:0;opacity:0;z-index:10">';
    h += '<div class="uc-line h hline" style="left:' + HINT.btnRight + 'px;top:' + HINT.btnY + 'px;width:' + hlW + 'px;opacity:0.6;transform:scaleX(0);transform-origin:right center"><div class="uc-glow-h"></div></div>';
    h += '<div class="uc-line v rail" style="left:' + HINT.railX + 'px;top:' + (HINT.btnY + 2) + 'px;height:' + railH + 'px;opacity:0.6;transform:scaleY(0);transform-origin:center bottom"><div class="uc-glow-v"></div></div>';
    HINT_MIDS.forEach(function (my, i) {
      h += '<div class="uc-line h ml' + i + '" style="left:' + (HINT.railX + 1) + 'px;top:' + (my - 1) + 'px;width:' + (HINT.x - HINT.railX - 1) + 'px;opacity:0.5;transform:scaleX(0);transform-origin:right center"><div class="uc-glow-h"></div></div>';
    });
    h += '<div style="position:absolute;left:' + HINT.x + 'px;width:' + HINT.w + 'px;top:0;bottom:0">';
    h += '<div class="uc-card" style="top:' + HINT.cards[0].top + 'px;height:' + HINT.cards[0].h + 'px"><div class="fade"><div class="uc-eyebrow">Welcome</div><div class="uc-hint-title">Your Machine is Empty</div><div class="uc-hint-copy">let’s deploy your first machine. hit the Add new machine button above to get started.</div></div></div>';
    h += stepsCardHtml(MACHINE_STEPS, ['active', 'idle', 'idle', 'idle'], 'style="top:' + HINT.cards[1].top + 'px;height:' + HINT.cards[1].h + 'px"');
    h += trustCardHtml('style="top:' + HINT.cards[2].top + 'px;height:' + HINT.cards[2].h + 'px"');
    return h + '</div></div>';
  }

  /* PodsHint geometry (Pods / AddPod).
     btnY is the Add Pod button's bottom edge (34px button centered in the
     60px nav → bottom at y=47), so the riser meets the button. */
  var PH = { x: 426, w: 428, railX: 914, btnX: 1194, btnY: 47, interY: 160, cards: [{ top: 160, h: 106 }, { top: 284, h: 232 }, { top: 534, h: 146 }] };
  var PH_MIDS = PH.cards.map(function (c) { return c.top + c.h / 2; });
  function podsHintHtml() {
    var h = '<div class="uc-hint" style="position:absolute;inset:0;opacity:0;z-index:10">';
    PH_MIDS.forEach(function (my, i) {
      h += '<div class="uc-line h ml' + i + '" style="left:' + (PH.x + PH.w) + 'px;top:' + (my - 1) + 'px;width:' + (PH.railX - (PH.x + PH.w) - 1) + 'px;opacity:0.5;transform:scaleX(0);transform-origin:left center"><div class="uc-glow-h"></div></div>';
    });
    h += '<div class="uc-line v rail" style="left:' + PH.railX + 'px;top:' + (PH.interY + 2) + 'px;height:' + (PH_MIDS[2] - PH.interY) + 'px;opacity:0.6;transform:scaleY(0);transform-origin:center bottom"><div class="uc-glow-v"></div></div>';
    h += '<div class="uc-line h hline" style="left:' + PH.railX + 'px;top:' + PH.interY + 'px;width:' + (PH.btnX - PH.railX + 1) + 'px;opacity:0.6;transform:scaleX(0);transform-origin:left center"><div class="uc-glow-h"></div></div>';
    h += '<div class="uc-line v rail2" style="left:' + PH.btnX + 'px;top:' + (PH.btnY + 2) + 'px;height:' + (PH.interY - PH.btnY) + 'px;opacity:0.6;transform:scaleY(0);transform-origin:center bottom"><div class="uc-glow-v"></div></div>';
    h += '<div style="position:absolute;left:' + PH.x + 'px;width:' + PH.w + 'px;top:0;bottom:0">';
    h += '<div class="uc-card" style="top:' + PH.cards[0].top + 'px;height:' + PH.cards[0].h + 'px"><div class="fade"><div class="uc-hint-title">No pods yet</div><div class="uc-hint-copy">Spin up your first pod to start serving traffic. Hit the + Add Pod button above to get started.</div></div></div>';
    h += stepsCardHtml(POD_STEPS, ['active', 'idle', 'idle', 'idle'], 'style="top:' + PH.cards[1].top + 'px;height:' + PH.cards[1].h + 'px"');
    h += trustCardHtml('style="top:' + PH.cards[2].top + 'px;height:' + PH.cards[2].h + 'px"');
    return h + '</div></div>';
  }

  function cursorHtml() { return '<div class="uc-cursor">' + ico.cursor() + '</div>'; }
  function ringHtml(x, y, n) { return '<div class="uc-ring rg' + n + '" style="left:' + x + 'px;top:' + y + 'px"></div>'; }

  /* ── timeline helpers (all times in scene-local NAT seconds) ── */

  /* clip-path glitch bursts — pre-baked .set() steps, no per-frame JS */
  function addGlitch(tl, target, bursts, seed) {
    bursts.forEach(function (b) {
      var s = b[0], e = b[1];
      for (var f = 0; s + f * 0.08 < e; f++) {
        var r1 = prand(seed * 97.3 + f * 13.7 + 1), r2 = prand(seed * 97.3 + f * 13.7 + 2), r3 = prand(seed * 97.3 + f * 13.7 + 3);
        tl.set(target, { clipPath: 'url(#uc-gp' + (Math.floor(r1 * 3) % 3) + ')', x: r2 * 6 - 3, y: r3 * 4 - 2 }, s + f * 0.08);
      }
      tl.set(target, { clipPath: 'none', x: 0, y: 0 }, e);
    });
  }
  function addFlickerIn(tl, target, s, d) {
    d = d || 0.35;
    [[0, 0], [0.08, 1], [0.22, 0.35], [0.34, 1], [0.52, 0.6], [0.64, 1]].forEach(function (kv) {
      tl.set(target, { opacity: kv[1] }, s + kv[0] * d);
    });
  }
  function addFlickerOut(tl, target, s, d) {
    d = d || 0.5;
    [[0.15, 0.3], [0.3, 1], [0.45, 0.45], [0.6, 0.9], [0.75, 0]].forEach(function (kv) {
      tl.set(target, { opacity: kv[1] }, s + kv[0] * d);
    });
  }

  /* virtual camera on the 1280x720 surface — proxy tweens, transform-only */
  function addCam(tl, surf, keys) {
    var st = { x: keys[0].x, y: keys[0].y, z: keys[0].z };
    var apply = function () {
      var z = 1 + (st.z - 1) * 0.5, S = 1.5 * z, hx = 640 / z, hy = 360 / z;
      var fx = Math.max(hx, Math.min(1280 - hx, st.x));
      var fy = Math.max(hy, Math.min(720 - hy, st.y));
      gsap.set(surf, { scale: S, x: (960 / S - fx) * S, y: (540 / S - fy) * S, force3D: true });
    };
    tl.call(function () { st.x = keys[0].x; st.y = keys[0].y; st.z = keys[0].z; apply(); }, null, 0);
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (a.x === b.x && a.y === b.y && a.z === b.z) continue;
      tl.to(st, { x: b.x, y: b.y, z: b.z, duration: b.t - a.t, ease: 'power4.inOut', onUpdate: apply }, a.t);
    }
    return { st: st, apply: apply };
  }

  /* cursor waypoints + click rings + press bumps */
  function addCursor(tl, layer, wp, clicks, fadeAt) {
    var cur = layer.querySelector('.uc-cursor');
    var svg = cur.querySelector('svg');
    tl.set(cur, { x: wp[0].x, y: wp[0].y, autoAlpha: 0 }, 0);
    tl.set(cur, { autoAlpha: 1 }, wp[0].t);
    for (var i = 0; i < wp.length - 1; i++) {
      var a = wp[i], b = wp[i + 1];
      if (a.x === b.x && a.y === b.y) continue;
      tl.to(cur, { x: b.x, y: b.y, duration: b.t - a.t, ease: 'power4.inOut' }, a.t);
    }
    (clicks || []).forEach(function (c, n) {
      var ring = layer.querySelector('.rg' + n);
      if (ring) {
        tl.fromTo(ring, { scale: 0.17, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, c);
      }
      tl.to(svg, { scale: 0.86, duration: 0.1, ease: 'sine.out' }, c - 0.06);
      tl.to(svg, { scale: 1, duration: 0.1, ease: 'sine.in' }, c + 0.04);
    });
    if (fadeAt) tl.to(cur, { opacity: 0, duration: fadeAt[1] - fadeAt[0], ease: 'none' }, fadeAt[0]);
    return cur;
  }

  /* nav pulse (plus button / Add Pod button): scale+opacity rings, 1.8s beat */
  function addPulse(tl, host, from, until) {
    var fill = host.querySelector('.pulse-fill'), ring = host.querySelector('.pulse-ring');
    for (var t = from; t < until; t += 1.8) {
      var d = Math.min(0.9, (until - t) / 2);
      if (fill) {
        tl.fromTo(fill, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'sine.inOut' }, t);
        tl.to(fill, { opacity: 0, duration: 0.9, ease: 'sine.inOut' }, t + 0.9);
      }
      if (ring) {
        tl.fromTo(ring, { scale: 1, opacity: 0 }, { scale: 1.5, opacity: 1, duration: 0.9, ease: 'sine.inOut' }, t);
        tl.to(ring, { opacity: 0, duration: 0.9, ease: 'sine.inOut' }, t + 0.9);
      }
    }
    if (fill) tl.set(fill, { opacity: 0 }, until);
    if (ring) tl.set(ring, { opacity: 0 }, until);
  }

  /* traveling glow sweep along a connector line (transform + opacity only) */
  function addLineSweep(tl, glowEl, at, dur, dist, dir, vertical) {
    var fromV = dir === 'rtl' || dir === 'btt' ? dist : 0;
    var toV = dir === 'rtl' || dir === 'btt' ? 0 : dist;
    var props = {};
    props[vertical ? 'y' : 'x'] = toV;
    var fromProps = { opacity: 0 };
    fromProps[vertical ? 'y' : 'x'] = fromV;
    fromProps[vertical ? 'xPercent' : 'yPercent'] = 0;
    fromProps[vertical ? 'yPercent' : 'xPercent'] = -50;
    tl.fromTo(glowEl, fromProps, Object.assign({ duration: dur, ease: 'none' }, props), at);
    tl.fromTo(glowEl, { opacity: 0 }, { opacity: 0.6, duration: dur / 2, ease: 'sine.out' }, at);
    tl.to(glowEl, { opacity: 0, duration: dur / 2, ease: 'sine.in' }, at + dur / 2);
  }

  /* blinking caret between t0..t1 (0.7s period, 0.4 on) */
  function addCaret(tl, el, t0, t1) {
    for (var t = t0; t < t1; t += 0.7) {
      tl.set(el, { opacity: 1 }, t);
      tl.set(el, { opacity: 0 }, Math.min(t + 0.4, t1));
    }
    tl.set(el, { opacity: 0 }, t1);
  }

  /* spinner rotation (260deg/s, linear) */
  function addSpin(tl, el, t0, t1) {
    tl.set(el, { display: 'block', rotation: 0 }, t0);
    tl.to(el, { rotation: 260 * (t1 - t0), duration: t1 - t0, ease: 'none' }, t0);
    tl.set(el, { display: 'none' }, t1);
  }

  /* scramble-in a GlitchType block: base + RGB split layers */
  function addGlitchType(tl, block, text, ct, seed, aiSeed) {
    var base = block.querySelector('.b'), r = block.querySelector('.r'), g = block.querySelector('.g');
    var proxy = { p: 0, split: 1 };
    tl.set([r, g], { opacity: 0.9 }, ct);
    tl.to(proxy, {
      p: 1, duration: 0.4, ease: 'none',
      onStart: function () { proxy.p = 0; },
      onUpdate: function () {
        var reveal = 1 - Math.pow(1 - proxy.p, 3);
        var s = scrambleText(text, reveal, seed, ct + proxy.p * 0.4);
        base.textContent = s; r.textContent = s; g.textContent = s;
      },
      onComplete: function () { base.textContent = text; r.textContent = text; g.textContent = text; }
    }, ct);
    tl.to(proxy, {
      split: 0, duration: 0.34, ease: 'none',
      onStart: function () { proxy.split = 1; },
      onUpdate: function () {
        var dx = proxy.split * 6;
        gsap.set(r, { x: -dx, y: -dx * 0.4 });
        gsap.set(g, { x: dx, y: dx * 0.4 });
      }
    }, ct);
    tl.set([r, g], { opacity: 0 }, ct + 0.34);
    /* jitter burst on the block, same rhythm as the source */
    addGlitch(tl, block, [[ct, ct + 0.3]], aiSeed);
  }

  /* ════════════════════ SCENE 1 — Login ════════════════════ */
  function loginHtml() {
    var btn = function (cls, icon, label) {
      return '<div class="' + cls + '" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 0;width:100%;border-radius:8px;border:1px solid ' + C.border + ';color:' + C.text + ';font-size:14.4px;font-weight:500;opacity:0">' + icon + '<span>' + label + '</span></div>';
    };
    return '<div class="uc-scene" data-s="Login"><div class="uc-surface">' +
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">' +
      '<div class="lg-box" style="opacity:0;width:420px">' +
      '<div style="border:1px solid #ffffff1a;border-radius:12px;padding:40px 32px;display:flex;flex-direction:column;align-items:center">' +
      '<div class="lg-logo" style="margin-bottom:8px;opacity:0"><img src="' + LOGO + '" alt="usectl" style="display:block;height:28px;width:174px"></div>' +
      '<div class="lg-welcome" style="font-size:14.4px;color:' + C.text2 + ';margin-bottom:32px;text-align:center;opacity:0">Welcome to usectl</div>' +
      '<div style="width:100%;display:flex;flex-direction:column;gap:12px">' +
      btn('lg-gh', ico.github(), 'Continue with GitHub') +
      btn('lg-gg', ico.google(), 'Continue with Google') +
      '</div></div></div></div>' +
      ringHtml(668, 409, 0) + cursorHtml() +
      '</div></div>';
  }
  function loginBuild(tl, layer) {
    var q = function (s) { return layer.querySelector(s); };
    var box = q('.lg-box'), logo = q('.lg-logo'), wel = q('.lg-welcome'), gh = q('.lg-gh'), gg = q('.lg-gg');
    /* init (loop-safe) */
    tl.set(box, { opacity: 0, clipPath: 'none', x: 0, y: 0 }, 0);
    tl.set(logo, { opacity: 0, clipPath: 'none', x: 0, y: 0 }, 0);
    tl.set(wel, { opacity: 0, y: 16 }, 0);
    tl.set([gh, gg], { opacity: 0, scale: 0.9 }, 0);
    tl.call(function () {
      gg.style.background = 'transparent'; gg.style.borderColor = C.border;
    }, null, 0);

    addFlickerIn(tl, box, 0.12);
    addGlitch(tl, box, [[0.12, 0.47], [1.2, 1.53]], 23);
    tl.set(logo, { opacity: 1 }, 0.3);
    addGlitch(tl, logo, [[0.2, 0.6], [1.35, 1.75]], 31);
    tl.to(wel, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.2);
    tl.to(gh, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.4);
    tl.to(gg, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.5);
    /* hover + press are instant state flips in the source — cheap one-off sets */
    tl.call(function () { gg.style.background = 'rgba(255,255,255,0.04)'; gg.style.borderColor = C.borderHover; }, null, 0.8);
    tl.to(gg, { scale: 0.97, duration: 0.06, ease: 'power1.out' }, 1.1);
    tl.to(gg, { scale: 1, duration: 0.08, ease: 'power1.in' }, 1.28);

    addCam(tl, q('.uc-surface'), [
      { t: 0, x: 640, y: 360, z: 1 }, { t: 0.5, x: 640, y: 360, z: 1 },
      { t: 0.95, x: 668, y: 420, z: 1.5 }, { t: 2.5, x: 668, y: 420, z: 1.5 }
    ]);
    addCursor(tl, layer, [{ t: 0.35, x: 1180, y: 700 }, { t: 0.8, x: 668, y: 409 }], [1.1]);
  }

  /* ════════════════════ EmptyHint build (shared by Machines/Create) ════ */
  function emptyHintDrawIn(tl, hint, inStart, k) {
    var q = function (s) { return hint.querySelector(s); };
    tl.set(hint, { opacity: 1 }, inStart);
    addGlitch(tl, hint, [[inStart, inStart + 0.6 * k]], 47);
    tl.to(hint.querySelectorAll('.fade'), { opacity: 1, duration: 0.4 * k, ease: 'none' }, inStart + 0.6 * k);
    for (var i = 0; i < 3; i++) {
      tl.to(q('.ml' + i), { scaleX: 1, duration: 0.4 * k, ease: 'none' }, inStart + (0.6 + (2 - i) * 0.1) * k);
    }
    tl.to(q('.rail'), { scaleY: 1, duration: 0.4 * k, ease: 'none' }, inStart + 1.2 * k);
    tl.to(q('.hline'), { scaleX: 1, duration: 0.4 * k, ease: 'none' }, inStart + 1.6 * k);
  }
  function emptyHintSetDrawn(tl, hint) {
    tl.set(hint, { opacity: 1, clipPath: 'none', x: 0, y: 0 }, 0);
    tl.set(hint.querySelectorAll('.fade'), { opacity: 1 }, 0);
    tl.set(hint.querySelectorAll('.uc-line.h'), { scaleX: 1 }, 0);
    tl.set(hint.querySelectorAll('.uc-line.v'), { scaleY: 1 }, 0);
  }
  function emptyHintSetHidden(tl, hint) {
    tl.set(hint, { opacity: 0, clipPath: 'none', x: 0, y: 0 }, 0);
    tl.set(hint.querySelectorAll('.fade'), { opacity: 0 }, 0);
    tl.set(hint.querySelectorAll('.uc-line.h'), { scaleX: 0 }, 0);
    tl.set(hint.querySelectorAll('.uc-line.v'), { scaleY: 0 }, 0);
  }

  /* ════════════════════ SCENE 2 — Machines ════════════════════ */
  function machinesHtml() {
    return '<div class="uc-scene" data-s="Machines"><div class="uc-surface">' +
      chromeHtml({ name: 'No Machines', dot: 'blue', pods: false }) +
      emptyHintHtml() +
      '</div></div>';
  }
  function machinesBuild(tl, layer) {
    var hint = layer.querySelector('.uc-hint');
    emptyHintSetHidden(tl, hint);
    addPulse(tl, layer.querySelector('.uc-plus'), 0, 2.0);
    emptyHintDrawIn(tl, hint, 0.15, 0.4);
    /* glow loop head: three line sweeps starting at gt 0/0.1/0.2 (t = 1.2+) */
    addLineSweep(tl, hint.querySelector('.ml0 .uc-glow-h'), 1.4, 1.0, 59, 'rtl');
    addLineSweep(tl, hint.querySelector('.ml1 .uc-glow-h'), 1.3, 1.0, 59, 'rtl');
    addLineSweep(tl, hint.querySelector('.ml2 .uc-glow-h'), 1.2, 1.0, 59, 'rtl');
    addCam(tl, layer.querySelector('.uc-surface'), [{ t: 0, x: 640, y: 360, z: 1 }]);
  }

  /* ════════════════════ SCENE 3 — Create machine ════════════════════ */
  var NAME = 'my-machine';
  var CT = { plusClick: 0.45, modalIn: 0.7, fieldClick: 1.15, typeStart: 1.3, typeStep: 0.09, resStart: 3.0, createHover: 4.35, createClick: 4.65, modalOut: 5.25, done: 5.6 };
  var TV = [3.0, 3.14, 3.28], TR = [3.55, 3.69, 3.83];
  function resRowHtml(cls, label, desc, val, price) {
    return '<div class="uc-res-row ' + cls + '"><div class="uc-res-top"><div><div class="uc-res-lb">' + label + '</div><div class="uc-res-desc">' + desc + '</div></div>' +
      '<div class="uc-res-ctl"><span class="uc-res-btn">' + ico.minus() + '</span><span class="uc-res-val">' + val + '</span><span class="uc-res-btn pb"><span class="hot"></span>' + ico.plus(14) + '</span><span class="uc-res-price">' + price + '/mo</span></div></div>' +
      '<div class="uc-slider"><div class="track"></div><div class="fill"></div><div class="sweep"><i></i></div><div class="knob"></div></div></div>';
  }
  function createHtml() {
    var modal = '<div class="uc-modal cm-modal" style="left:580px;top:80px;width:600px">' +
      '<div class="uc-modal-head"><span class="ttl">New Machine</span><span class="x">' + ico.close() + '</span></div>' +
      '<div style="padding:20px 24px 0">' +
      '<div class="uc-sect" style="margin-bottom:10px">Basic</div>' +
      '<div class="uc-flabel">Machine Name</div>' +
      '<div class="uc-input cm-input"><span class="txt">my-app</span><span class="uc-caret"></span></div>' +
      '<div class="uc-helper cm-helper">3–40 chars, lowercase. Letters, digits, hyphens</div>' +
      '<div class="uc-flabel" style="margin:14px 0 5px">Organization</div>' +
      '<div class="uc-select"><span>Personal</span><span class="caret" style="color:' + C.muted + ';display:flex">' + ico.caret(14) + '</span></div>' +
      '<div style="height:1px;background:' + C.border + ';opacity:0.7;margin:16px 0 12px"></div>' +
      '<div style="display:flex;align-items:baseline;gap:8px"><span class="uc-sect">Resources</span><span style="font-size:11.5px;color:rgba(255,255,255,0.7)">Pick now — change anytime later.</span></div>' +
      resRowHtml('cm-cpu', 'vCPU', 'Dedicated compute cores', '1', '$10.00') +
      resRowHtml('cm-ram', 'RAM', 'Memory (GB)', '1GB', '$5.00') +
      resRowHtml('cm-sto', 'Storage', 'NVMe SSD (GB)', '1GB', '$0.01') +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:flex-end;gap:22px;padding:12px 24px;border-top:1px solid ' + C.border + ';margin-top:10px">' +
      '<div class="uc-cta cm-create" style="padding:14px 22px;font-size:14.7px"><span class="glow-a"></span><span class="glow-b"></span><span class="lbl">Create Machine</span></div>' +
      '</div></div>';
    return '<div class="uc-scene" data-s="Create"><div class="uc-surface">' +
      chromeHtml({ name: 'No Machines', dot: 'blue', pods: false }) +
      emptyHintHtml() +
      '<div class="uc-dim"></div>' +
      '<div class="uc-modal-wrap cm-wrap" style="visibility:hidden">' +
      '<div class="cm-side" style="position:absolute;left:116px;top:80px;width:428px">' +
      stepsCardHtml(MACHINE_STEPS, ['done', 'active', 'idle', 'idle'], '', 'rel cm-steps') + trustCardHtml('', 'rel') +
      '</div>' + modal + '</div>' +
      ringHtml(194, 30, 0) + ringHtml(880, 216, 1) +
      ringHtml(1064, 424, 2) + ringHtml(1064, 424, 3) + ringHtml(1064, 424, 4) +
      ringHtml(1064, 500, 5) + ringHtml(1064, 500, 6) + ringHtml(1064, 500, 7) +
      ringHtml(1066, 668, 8) + cursorHtml() +
      '</div></div>';
  }
  function nameHelperFor(n) {
    if (n === 0) return { txt: '3–40 chars, lowercase. Letters, digits, hyphens', col: 'rgba(255,255,255,0.7)' };
    var s = NAME.slice(0, n);
    if (s.length < 3) return { txt: 'Too short — minimum 3 characters.', col: C.danger };
    if (!/[a-z0-9]$/.test(s)) return { txt: 'Must end with a letter or digit.', col: C.danger };
    return { txt: 'Will be reachable at https://' + s + '.usectl.com', col: C.accent };
  }
  function addSliderStep(tl, row, at, pct, valTxt, price, rowW) {
    tl.set(row.querySelector('.fill'), { scaleX: Math.max(pct, 0.5) / 100 }, at);
    tl.set(row.querySelector('.knob'), { x: Math.max(pct, 0.5) / 100 * rowW }, at);
    tl.call(function () {
      row.querySelector('.uc-res-val').textContent = valTxt;
      row.querySelector('.uc-res-price').textContent = price + '/mo';
    }, null, at);
  }
  function addSweepLoop(tl, el, salt, dur) {
    /* gp = ((t+salt) % 4.5)/4.5*130 - 15, % of a 552px row, sweep width 110 */
    var xFor = function (gp) { return gp / 100 * 552 + 110; };
    var first = 4.5 - (salt % 4.5);
    tl.fromTo(el, { x: xFor((salt % 4.5) / 4.5 * 130 - 15) }, { x: xFor(115), duration: first, ease: 'none' }, 0);
    for (var t = first; t < dur; t += 4.5) {
      tl.fromTo(el, { x: xFor(-15) }, { x: xFor(115), duration: Math.min(4.5, dur - t), ease: 'none' }, t);
    }
  }
  function createBuild(tl, layer) {
    var q = function (s) { return layer.querySelector(s); };
    var hint = q('.uc-hint'), dim = q('.uc-dim'), wrap = q('.cm-wrap'), modal = q('.cm-modal');
    var input = q('.cm-input'), txtEl = q('.cm-input .txt'), caret = q('.uc-caret'), helper = q('.cm-helper');
    var create = q('.cm-create'), createLbl = q('.cm-create .lbl'), glowB = q('.cm-create .glow-b');
    var selName = q('.uc-sel-name'), dot = q('.uc-dot'), selG = q('.uc-sel-g');
    var steps = q('.cm-steps').querySelectorAll('.uc-step');
    var k = 0.7, oS = CT.plusClick;

    /* init (loop-safe) */
    emptyHintSetDrawn(tl, hint);
    tl.set(dim, { opacity: 0 }, 0);
    tl.set(wrap, { autoAlpha: 0 }, 0);
    tl.set(modal, { y: 12 }, 0);
    tl.set(glowB, { opacity: 0 }, 0);
    tl.set(create, { scale: 1, opacity: 1 }, 0);
    tl.set(selG, { clipPath: 'none', x: 0, y: 0 }, 0);
    tl.call(function () {
      txtEl.textContent = 'my-app'; txtEl.style.color = 'rgba(255,255,255,0.3)';
      helper.textContent = '3–40 chars, lowercase. Letters, digits, hyphens'; helper.style.color = 'rgba(255,255,255,0.7)';
      input.style.borderColor = C.border; input.style.boxShadow = 'none';
      createLbl.textContent = 'Create Machine';
      create.style.background = '#11a329e1';
      selName.textContent = 'No Machines'; dot.className = 'uc-dot blue';
      steps.forEach(function (r, i) { r.className = 'uc-step ' + (i === 0 ? 'done' : i === 1 ? 'active' : 'idle'); });
      ['.cm-cpu', '.cm-ram'].forEach(function (rc) {
        var row = q(rc);
        row.querySelector('.hot').style.opacity = 0;
      });
    }, null, 0);
    addSliderStep(tl, q('.cm-cpu'), 0, 0, '1', '$10.00', 552);
    addSliderStep(tl, q('.cm-ram'), 0, 0, '1GB', '$5.00', 552);
    addSliderStep(tl, q('.cm-sto'), 0, 0, '1GB', '$0.01', 552);

    addPulse(tl, q('.uc-plus'), 0, CT.plusClick);

    /* EmptyHint exit after the + click */
    tl.to(hint.querySelector('.hline'), { scaleX: 0, duration: 0.25 * k, ease: 'none' }, oS + 0.15 * k);
    tl.to(hint.querySelector('.rail'), { scaleY: 0, duration: 0.25 * k, ease: 'none' }, oS + 0.3 * k);
    for (var i = 0; i < 3; i++) {
      tl.to(hint.querySelector('.ml' + i), { scaleX: 0, duration: 0.3 * k, ease: 'none' }, oS + (0.35 + i * 0.08) * k);
    }
    tl.to(hint.querySelectorAll('.fade'), { opacity: 0, duration: 0.3 * k, ease: 'none' }, oS + 0.35 * k);
    tl.to(hint, { opacity: 0, duration: 0.25 * k, ease: 'none' }, oS + 0.55 * k);

    /* modal in */
    tl.to(dim, { opacity: 1, duration: 0.35, ease: 'none' }, CT.modalIn);
    tl.to(wrap, { autoAlpha: 1, duration: 0.35, ease: 'none' }, CT.modalIn);
    tl.to(modal, { y: 0, duration: 0.4, ease: 'power2.out' }, CT.modalIn);

    /* field focus + typing */
    tl.call(function () { input.style.borderColor = C.accent; input.style.boxShadow = '0 0 0 2px rgba(17,163,42,0.25)'; }, null, CT.fieldClick);
    addCaret(tl, caret, CT.fieldClick, CT.createClick);
    var nameDoneT = CT.typeStart + 3 * CT.typeStep + 0.05;
    for (var n = 1; n <= NAME.length; n++) {
      (function (n) {
        var at = CT.typeStart + (n - 1) * CT.typeStep;
        var h = nameHelperFor(n);
        tl.call(function () {
          txtEl.textContent = NAME.slice(0, n);
          txtEl.style.color = C.text;
          helper.textContent = h.txt; helper.style.color = h.col;
        }, null, at);
      })(n);
    }
    tl.call(function () { steps[1].className = 'uc-step done'; steps[2].className = 'uc-step active'; }, null, nameDoneT);
    tl.call(function () { steps[2].className = 'uc-step done'; }, null, CT.resStart);
    tl.call(function () { steps.forEach(function (r) { r.className = 'uc-step done'; }); }, null, CT.createClick + 0.15);

    /* resource clicks (instant steps, like the source) */
    var cpu = q('.cm-cpu'), ram = q('.cm-ram');
    TV.forEach(function (c, ci) {
      var v = ci + 2;
      addSliderStep(tl, cpu, c, (v - 1) / 15 * 100, String(v), '$' + (10 * v).toFixed(2), 552);
    });
    TR.forEach(function (c, ci) {
      var v = ci + 2;
      addSliderStep(tl, ram, c, (v - 1) / 63 * 100, v + 'GB', '$' + (5 * v).toFixed(2), 552);
    });
    tl.set(cpu.querySelector('.hot'), { opacity: 1 }, TV[0] - 0.15);
    tl.set(cpu.querySelector('.hot'), { opacity: 0 }, TV[2] + 0.25);
    tl.set(ram.querySelector('.hot'), { opacity: 1 }, TR[0] - 0.15);
    tl.set(ram.querySelector('.hot'), { opacity: 0 }, TR[2] + 0.25);
    addSweepLoop(tl, q('.cm-cpu .sweep i'), 0, 5.8);
    addSweepLoop(tl, q('.cm-ram .sweep i'), 1.5, 5.8);
    addSweepLoop(tl, q('.cm-sto .sweep i'), 3, 5.8);

    /* create button: hover → click → creating */
    tl.call(function () { create.style.background = '#11A32A90'; }, null, CT.createHover);
    tl.set(glowB, { opacity: 1 }, CT.createHover);
    tl.to(create, { scale: 1.02, duration: 0.1, ease: 'power1.out' }, CT.createHover);
    tl.to(create, { scale: 0.97, duration: 0.06, ease: 'power1.out' }, CT.createClick);
    tl.to(create, { scale: 1, duration: 0.1, ease: 'power1.in' }, CT.createClick + 0.15);
    tl.call(function () { create.style.background = '#11a329e1'; createLbl.textContent = 'Creating...'; }, null, CT.createClick);
    tl.set(glowB, { opacity: 0 }, CT.createClick);
    tl.set(create, { opacity: 0.6 }, CT.createClick);

    /* modal out + done */
    tl.to([dim, wrap], { opacity: 0, duration: 0.35, ease: 'none' }, CT.modalOut);
    tl.set(wrap, { visibility: 'hidden' }, CT.modalOut + 0.35);
    tl.call(function () { selName.textContent = NAME; dot.className = 'uc-dot green'; }, null, CT.done);
    addGlitch(tl, selG, [[CT.done, 5.8]], 71);

    addCam(tl, q('.uc-surface'), [
      { t: 0, x: 640, y: 360, z: 1 }, { t: 0.15, x: 640, y: 360, z: 1 },
      { t: 0.45, x: 240, y: 140, z: 1.5 }, { t: 0.65, x: 240, y: 140, z: 1.5 },
      { t: 1.0, x: 800, y: 380, z: 1.12 }, { t: 1.35, x: 647, y: 288, z: 1.25 },
      { t: 2.6, x: 647, y: 288, z: 1.25 }, { t: 3.0, x: 647, y: 380, z: 1.25 },
      { t: 4.0, x: 647, y: 380, z: 1.25 }, { t: 4.4, x: 647, y: 432, z: 1.25 },
      { t: 5.1, x: 647, y: 432, z: 1.25 }, { t: 5.7, x: 640, y: 360, z: 1 }
    ]);
    addCursor(tl, layer, [
      { t: 0.05, x: 1180, y: 660 }, { t: 0.4, x: 194, y: 30 }, { t: 0.7, x: 194, y: 30 },
      { t: 1.0, x: 880, y: 216 }, { t: 2.6, x: 880, y: 216 }, { t: 2.95, x: 1064, y: 424 },
      { t: 3.33, x: 1064, y: 424 }, { t: 3.5, x: 1064, y: 500 }, { t: 3.9, x: 1064, y: 500 },
      { t: 4.35, x: 1066, y: 668 }, { t: 5.15, x: 1066, y: 668 }, { t: 5.8, x: 1320, y: 720 }
    ], [CT.plusClick, CT.fieldClick].concat(TV, TR, [CT.createClick]), [5.5, 5.95]);
  }

  /* ════════════════════ SCENE 4 — Pods (empty) ════════════════════ */
  function podsHtml() {
    return '<div class="uc-scene" data-s="Pods"><div class="uc-surface">' +
      chromeHtml({ name: 'my-machine', dot: 'green', pods: true }) +
      '<div class="uc-dots-bg"></div>' + podsHintHtml() +
      '</div></div>';
  }
  function podsHintDrawIn(tl, hint, inStart) {
    var q = function (s) { return hint.querySelector(s); };
    tl.set(hint, { opacity: 1 }, inStart);
    addGlitch(tl, hint, [[inStart, inStart + 0.3]], 61);
    tl.to(hint.querySelectorAll('.fade'), { opacity: 1, duration: 0.28, ease: 'none' }, inStart + 0.42);
    for (var i = 0; i < 3; i++) {
      tl.to(q('.ml' + i), { scaleX: 1, duration: 0.28, ease: 'none' }, inStart + 0.42 + (2 - i) * 0.07);
    }
    tl.to(q('.rail'), { scaleY: 1, duration: 0.28, ease: 'none' }, inStart + 0.84);
    tl.to(q('.hline'), { scaleX: 1, duration: 0.28, ease: 'none' }, inStart + 1.12);
    tl.to(q('.rail2'), { scaleY: 1, duration: 0.28, ease: 'none' }, inStart + 1.4);
  }
  function podsBuild(tl, layer) {
    var hint = layer.querySelector('.uc-hint');
    emptyHintSetHidden(tl, hint);
    addPulse(tl, layer.querySelector('.uc-addpod'), 0, 2.0);
    podsHintDrawIn(tl, hint, 0.15);
    /* glow loop head (glowStart 1.5): line sweeps at gt 0/0.1/0.2 */
    addLineSweep(tl, hint.querySelector('.ml0 .uc-glow-h'), 1.7, 1.0, 59, 'ltr');
    addLineSweep(tl, hint.querySelector('.ml1 .uc-glow-h'), 1.6, 1.0, 59, 'ltr');
    addLineSweep(tl, hint.querySelector('.ml2 .uc-glow-h'), 1.5, 1.0, 59, 'ltr');
    addCam(tl, layer.querySelector('.uc-surface'), [{ t: 0, x: 640, y: 360, z: 1 }]);
  }

  /* ════════════════════ SCENE 5 — Add Pod (accordion) ════════════════════ */
  var CATS = [
    { label: 'Applications', icon: ico.mi(MUI.code, 16), items: [[ico.github(19), 'GitHub Repo'], [ico.mi(MUI.build), 'Background Worker'], [ico.mi(MUI.rocket), 'Release Task']] },
    { label: 'Databases', icon: ico.mi(MUI.storage, 16), items: [[ico.mi(SI.postgres), 'PostgreSQL'], [ico.mi(SI.redis), 'Redis'], [ico.mi(SI.mongo), 'MongoDB'], [ico.mi(MUI.storage), 'SQL Server']] },
    { label: 'Services', icon: ico.mi(MUI.extension, 16), items: [[ico.mi(SI.nats), 'NATS'], [ico.mi(SI.meili), 'Meilisearch'], [ico.pkg(18), 'S3 Storage'], [ico.mi(MUI.lock), 'OAuth2 Proxy'], [ico.mi(MUI.schedule), 'Cron Jobs']] },
    { label: 'Observability', icon: ico.mi(MUI.insights, 16), items: [[ico.mi(MUI.insights), 'Grafana'], [ico.mi(MUI.bug), 'GlitchTip']] },
    { label: 'AI', icon: ico.mi(MUI.robot, 16), items: [[ico.mi(MUI.robot), 'Devo AI']] }
  ];
  var OPEN_SEQ = [[0, 1.5], [1, 2.8], [2, 4.1], [3, 5.4], [4, 6.7]];
  var ITEMS_H = CATS.map(function (c) { return c.items.length * 41; });
  /* settled modal y (recenters as the open row changes) */
  var AP_MT = ITEMS_H.map(function (h) { return Math.max(66, (720 - (294 + h)) / 2); }); /* per open cat */
  var AP_MT0 = Math.max(66, (720 - 294) / 2); /* nothing open */
  var CAT_COPY = [
    { e: 'Applications', tt: 'Ship your\napps.', s: 'Repos, workers & release tasks.' },
    { e: 'Databases', tt: 'Managed\ndatabases.', s: 'Postgres, Redis, Mongo, SQL Server.' },
    { e: 'Services', tt: 'Plug in\nservices.', s: 'NATS, Meili, S3, OAuth2, Cron.' },
    { e: 'Observability', tt: 'See\neverything.', s: 'Grafana + GlitchTip, built in.' },
    { e: 'AI', tt: 'Meet\nDevo AI.', s: 'Your AI copilot for ops.' }
  ];
  /* cursor y at rest on category k's row, before/after its open transition */
  function apRowY(k, state /* 'before'|'after' */) {
    if (state === 'before') {
      var mt = k === 0 ? AP_MT0 : AP_MT[k - 1];
      var off = k === 0 ? 0 : ITEMS_H[k - 1];
      return mt + 56 + 46 * k + off + 23;
    }
    return AP_MT[k] + 56 + 46 * k + 23;
  }
  function apCamY(k) { return AP_MT[k] + 56 + 46 * k + 23 + ITEMS_H[k] / 2; }

  function addPodHtml() {
    var cats = CATS.map(function (cat, i) {
      var items = cat.items.map(function (it) {
        return '<div class="uc-cat-item"><span class="ci">' + it[0] + '</span> ' + it[1] + '</div>';
      }).join('');
      return '<div><div class="uc-cat-row cr' + i + '"><span class="lft"><span class="ci">' + cat.icon + '</span> ' + cat.label + '</span><span class="cc">' + ico.caret(15) + '</span></div>' +
        '<div class="uc-cat-items cl' + i + '">' + items + '</div></div>';
    }).join('');
    var copies = CAT_COPY.map(function (c, i) {
      return '<div class="uc-copy cp' + i + '" style="top:0">' +
        '<div class="eyeb">' + c.e + '</div>' +
        '<div class="gt"><div class="ly r"></div><div class="ly g"></div><div class="b" style="position:relative">' + c.tt + '</div></div>' +
        '<div class="sub">' + c.s + '</div></div>';
    }).join('');
    return '<div class="uc-scene" data-s="AddPod"><div class="uc-surface">' +
      chromeHtml({ name: 'my-machine', dot: 'green', pods: true }) +
      '<div class="uc-dots-bg"></div>' + podsHintHtml() +
      '<div class="uc-dim"></div>' +
      '<div class="uc-modal-wrap ap-wrap" style="visibility:hidden">' +
      '<div class="ap-side" style="position:absolute;left:96px;top:' + AP_MT0 + 'px;width:428px">' +
      stepsCardHtml(POD_STEPS, ['done', 'active', 'idle', 'idle'], '', 'rel') + trustCardHtml('', 'rel') +
      '</div>' +
      '<div class="ap-copy-wrap" style="position:absolute;inset:0;will-change:transform">' + copies + '</div>' +
      '<div class="uc-modal ap-modal" style="left:580px;top:0;width:520px;overflow:hidden;padding-bottom:8px">' +
      '<div class="uc-modal-head" style="height:56px;padding:0 24px"><span class="ttl">Add Pod</span><span class="x">' + ico.close() + '</span></div>' +
      cats + '</div></div>' +
      ringHtml(1194, 30, 0) + ringHtml(640, 292, 1) + ringHtml(640, 399.5, 2) +
      ringHtml(640, 466, 3) + ringHtml(640, 532.5, 4) + ringHtml(640, 517, 5) +
      cursorHtml() +
      '</div></div>';
  }
  function addPodBuild(tl, layer) {
    var q = function (s) { return layer.querySelector(s); };
    var hint = q('.uc-hint'), dim = q('.uc-dim'), wrap = q('.ap-wrap'), modal = q('.ap-modal');
    var side = q('.ap-side'), copyWrap = q('.ap-copy-wrap'), addBtn = q('.uc-addpod');

    /* init: hint fully drawn, modal hidden, all cats closed */
    tl.set(hint, { opacity: 1, clipPath: 'none', x: 0, y: 0 }, 0);
    tl.set(hint.querySelectorAll('.fade'), { opacity: 1 }, 0);
    tl.set(hint.querySelectorAll('.uc-line.h'), { scaleX: 1 }, 0);
    tl.set(hint.querySelectorAll('.uc-line.v'), { scaleY: 1 }, 0);
    tl.set(dim, { opacity: 0 }, 0);
    tl.set(wrap, { autoAlpha: 0 }, 0);
    tl.set(modal, { y: AP_MT0 + 12 }, 0);
    tl.set(side, { opacity: 1 }, 0);
    tl.set(addBtn, { scale: 1 }, 0);
    CATS.forEach(function (c, i) {
      tl.set(q('.cl' + i), { height: 0 }, 0);
      tl.set(q('.cr' + i + ' .cc'), { rotation: -90 }, 0);
      tl.call(function () { q('.cr' + i).style.background = 'transparent'; }, null, 0);
    });
    CAT_COPY.forEach(function (c, i) {
      var blk = q('.cp' + i);
      tl.set(blk, { autoAlpha: 0, clipPath: 'none', x: 0, y: 0 }, 0);
      tl.set(blk.querySelectorAll('.eyeb,.sub'), { opacity: 0 }, 0);
    });

    addPulse(tl, addBtn, 0, 0.75);
    tl.to(addBtn, { scale: 0.96, duration: 0.05, ease: 'power1.out' }, 0.75);
    tl.to(addBtn, { scale: 1, duration: 0.08, ease: 'power1.in' }, 0.9);

    /* PodsHint exit after the Add Pod press (outStart 0.75) */
    tl.to(hint.querySelector('.rail2'), { scaleY: 0, duration: 0.18, ease: 'none' }, 0.75);
    tl.to(hint.querySelector('.hline'), { scaleX: 0, duration: 0.18, ease: 'none' }, 0.85);
    tl.to(hint.querySelector('.rail'), { scaleY: 0, duration: 0.18, ease: 'none' }, 0.96);
    for (var i = 0; i < 3; i++) {
      tl.to(hint.querySelector('.ml' + i), { scaleX: 0, duration: 0.21, ease: 'none' }, 1.0 + i * 0.06);
    }
    tl.to(hint.querySelectorAll('.fade'), { opacity: 0, duration: 0.21, ease: 'none' }, 1.0);
    tl.to(hint, { opacity: 0, duration: 0.17, ease: 'none' }, 1.14);

    /* modal in */
    tl.to(dim, { opacity: 1, duration: 0.3, ease: 'none' }, 1.05);
    tl.to(wrap, { autoAlpha: 1, duration: 0.3, ease: 'none' }, 1.05);
    tl.to(modal, { y: AP_MT0, duration: 0.35, ease: 'power2.out' }, 1.05);
    tl.to(side, { opacity: 0, duration: 0.3, ease: 'none' }, 1.5);

    /* accordion walk */
    OPEN_SEQ.forEach(function (seq, k) {
      var ci = seq[0], ct = seq[1];
      var row = q('.cr' + ci), items = q('.cl' + ci), cc = q('.cr' + ci + ' .cc');
      tl.call(function () { row.style.background = 'rgba(255,255,255,0.03)'; }, null, ct - 0.3);
      tl.call(function () { row.style.background = 'rgba(17,163,42,0.04)'; items.style.borderBottomColor = 'rgba(255,255,255,0.04)'; }, null, ct + 0.15);
      tl.to(items, { height: ITEMS_H[ci], duration: 0.3, ease: 'none' }, ct);
      tl.to(cc, { rotation: 0, duration: 0.3, ease: 'none' }, ct);
      if (k > 0) {
        var pi = OPEN_SEQ[k - 1][0];
        var prow = q('.cr' + pi), pitems = q('.cl' + pi), pcc = q('.cr' + pi + ' .cc');
        tl.to(pitems, { height: 0, duration: 0.3, ease: 'none' }, ct);
        tl.to(pcc, { rotation: -90, duration: 0.3, ease: 'none' }, ct);
        tl.call(function () { prow.style.background = 'transparent'; pitems.style.borderBottomColor = 'rgba(255,255,255,0)'; }, null, ct + 0.15);
      }
      /* modal recenter follows the open heights (linear, like the source) */
      tl.to(modal, { y: AP_MT[ci], duration: 0.3, ease: 'none' }, ct);
      /* side copy block for this category */
      var blk = q('.cp' + ci);
      tl.set(blk, { autoAlpha: 1 }, ct);
      addFlickerIn(tl, blk.querySelector('.eyeb'), ct + 0.02, 0.26);
      addGlitchType(tl, blk, CAT_COPY[ci].tt, ct, (ci + 3) * 9, (k + 1) * 17);
      addFlickerIn(tl, blk.querySelector('.sub'), ct + 0.14, 0.3);
      var end = k < OPEN_SEQ.length - 1 ? OPEN_SEQ[k + 1][1] : 7.6;
      tl.set(blk, { autoAlpha: 0 }, end);
    });

    /* camera + copy container: punch in, then follow-cam down the list */
    var cam = addCam(tl, q('.uc-surface'), [
      { t: 0, x: 640, y: 360, z: 1 }, { t: 0.35, x: 640, y: 360, z: 1 },
      { t: 0.7, x: 1100, y: 120, z: 1.45 }, { t: 1.05, x: 1100, y: 120, z: 1.45 },
      { t: 1.5, x: 655, y: 320, z: 1.28 }
    ]);
    var followY = function (at, y) {
      tl.to(cam.st, { y: y, duration: 0.3, ease: 'power4.inOut', onUpdate: cam.apply }, at);
      tl.to(copyWrap, { y: y - 92, duration: 0.3, ease: 'power4.inOut' }, at);
    };
    /* copy container baseline: top ≡ camY-92; camY 320 at t1.5 → wrap y 228 */
    tl.set(copyWrap, { y: 228 }, 0);
    followY(1.55, apCamY(0));
    for (var kk = 1; kk < OPEN_SEQ.length; kk++) followY(OPEN_SEQ[kk][1], apCamY(OPEN_SEQ[kk][0]));

    /* cursor: to the button, then down the rows, following the relayouts */
    var cur = addCursor(tl, layer, [
      { t: 0.1, x: 1180, y: 640 }, { t: 0.6, x: 1194, y: 30 }, { t: 1.15, x: 1194, y: 30 },
      { t: 1.45, x: 640, y: apRowY(0, 'before') }
    ], [0.75, 1.5, 2.8, 4.1, 5.4, 6.7]);
    var moveRow = function (fromT, toT, y) { tl.to(cur, { x: 640, y: y, duration: toT - fromT, ease: 'power4.inOut' }, fromT); };
    var follow = function (at, y) { tl.to(cur, { y: y, duration: 0.3, ease: 'none' }, at); };
    follow(1.5, apRowY(0, 'after'));
    moveRow(2.5, 2.75, apRowY(1, 'before')); follow(2.8, apRowY(1, 'after'));
    moveRow(3.8, 4.05, apRowY(2, 'before')); follow(4.1, apRowY(2, 'after'));
    moveRow(5.1, 5.35, apRowY(3, 'before')); follow(5.4, apRowY(3, 'after'));
    moveRow(6.4, 6.65, apRowY(4, 'before')); follow(6.7, apRowY(4, 'after'));
  }

  /* ════════════════════ SCENE 6 — Connect GitHub repo ════════════════════ */
  var GH_REPOS = [['user/my-app', false], ['user/api-service', true], ['user/landing-page', false], ['user/worker-queue', true], ['user/docs-site', false]];
  function connectHtml() {
    var repoRows = GH_REPOS.map(function (r, i) {
      return '<div class="uc-repo-row rr' + i + '"><span>' + r[0] + '</span>' + (r[1] ? '<span class="lk">' + ico.lock(12) + '</span>' : '') + '</div>';
    }).join('');
    var panel = '<div class="cn-panel" style="position:absolute;left:560px;top:124px;width:712px;height:588px;background:#1e1d1d;border:1px solid ' + C.border + ';border-radius:12px;z-index:240;overflow:hidden">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px 12px"><span style="font-size:16.8px;font-weight:700;color:' + C.text + '">GitHub Repo</span><span style="color:' + C.muted + ';display:flex">' + ico.close() + '</span></div>' +
      '<div style="display:flex;gap:14px;padding:2px 24px 0">' +
      '<div style="width:331px;flex-shrink:0;display:flex;flex-direction:column;gap:14px">' +
      '<div class="uc-cfg-card"><div class="uc-cfg-title">' + ico.github() + ' GitHub Repository</div>' +
      '<div class="cn-notconn"><div style="font-size:13px;color:' + C.text2 + ';margin:10px 0;line-height:1.4">Connect your GitHub account to select a repository</div>' +
      '<span class="uc-ghbtn cn-ghbtn"><span class="gi">' + ico.github() + '</span>' + ico.spinner() + '<span class="lbl">Connect GitHub</span></span></div>' +
      '<div class="cn-conn" style="display:none">' +
      '<div style="display:flex;align-items:center;gap:6px;font-size:12.2px;margin:10px 0 0">' + ico.check(14, C.accent) + '<span style="color:' + C.accent + ';flex:1;white-space:nowrap">Connected as <b>@user</b></span><span style="border:1px solid ' + C.border + ';border-radius:4px;padding:2px 8px;font-size:11px;color:' + C.muted + '">Reconnect</span></div>' +
      '<div class="uc-f2label">Account</div><div class="uc-field2"><span>user (User)</span><span class="caret">' + ico.caret(12) + '</span></div>' +
      '<div class="uc-f2label">Repository</div><div class="uc-field2 cn-repof"><span class="rv" style="color:' + C.muted + '">Search repositories...</span><span class="caret">' + ico.caret(12) + '</span></div>' +
      '<div class="cn-branch" style="opacity:0"><div class="uc-f2label">Branch</div><div class="uc-field2"><span style="font-family:' + MONO + '">main</span><span class="caret">' + ico.caret(12) + '</span></div></div>' +
      '<div class="cn-detect" style="display:flex;align-items:center;gap:8px;margin-top:10px;opacity:0">' +
      '<span class="sk1 uc-chip-skel" style="width:80px;height:20px"></span><span class="sk2 uc-chip-skel" style="width:120px;height:11px"></span>' +
      '<span class="ch1 uc-chip-next" style="display:none">Next.js</span><span class="ch2" style="display:none;font-size:11px;color:' + C.muted + '">Detected · default port 3000</span>' +
      '</div></div></div>' +
      '<div class="uc-cfg-card"><div class="uc-cfg-title">' + ico.mi(MUI.rocket, 14) + ' Deploy Settings</div>' +
      '<div class="uc-checkrow">' + ico.checkbox() + 'Auto-deploy on push</div>' +
      '<div class="uc-checkrow"><span class="empty"></span>Enable PR preview environments</div></div>' +
      '</div>' +
      '<div style="flex:1"><div class="uc-cfg-card"><div class="uc-cfg-title">' + ico.mi(MUI.settings, 14) + ' App Configuration</div>' +
      '<div class="uc-f2label">App Name</div><div class="uc-field2 cn-appname"><span class="av" style="color:rgba(255,255,255,0.3)">e.g. frontend</span></div>' +
      '<div style="display:flex;gap:12px"><div style="flex:1"><div class="uc-f2label">Port</div><div class="uc-field2"><span style="font-family:' + MONO + '">3000</span></div></div>' +
      '<div style="flex:1"><div class="uc-f2label">Replicas</div><div style="display:flex;align-items:center;gap:8px;height:34px">' +
      '<span style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.08);border:1px solid ' + C.border + ';border-radius:4px;color:#fff">' + ico.minus(12) + '</span>' +
      '<span style="min-width:18px;text-align:center;font-size:13.6px;font-weight:600;color:' + C.text + '">1</span>' +
      '<span style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.08);border:1px solid ' + C.border + ';border-radius:4px;color:#fff">' + ico.plus(12) + '</span>' +
      '</div></div></div>' +
      '<div style="font-size:11.5px;color:' + C.accent + ';margin-top:10px">+ Add extra port</div>' +
      '</div></div></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:flex-end;padding:12px 24px;border-top:1px solid ' + C.border + ';background:#1e1d1d">' +
      '<span class="uc-cta cn-save" style="padding:10px 18px;font-size:13.4px;font-weight:700"><span class="glow-a"></span><span class="glow-b"></span>' + ico.spinner() + '<span class="lbl">Save & Deploy</span></span>' +
      '</div></div>';
    return '<div class="uc-scene" data-s="Connect"><div class="uc-surface">' +
      chromeHtml({ name: 'my-machine', dot: 'green', pods: true }) +
      '<div class="uc-dots-bg"></div>' +
      '<div class="cn-side" style="position:absolute;left:96px;top:124px;width:428px;z-index:250">' +
      stepsCardHtml(POD_STEPS, ['done', 'done', 'active', 'idle'], '', 'rel cn-steps') + trustCardHtml('', 'rel') +
      '</div>' + panel +
      '<div class="uc-repo-dd">' + repoRows + '</div>' +
      ringHtml(665, 295, 0) + ringHtml(750, 353, 1) + ringHtml(700, 391, 2) + ringHtml(1164, 684, 3) +
      cursorHtml() +
      '</div></div>';
  }
  function connectBuild(tl, layer) {
    var q = function (s) { return layer.querySelector(s); };
    var panel = q('.cn-panel'), side = q('.cn-side'), dd = q('.uc-repo-dd');
    var ghbtn = q('.cn-ghbtn'), ghIco = q('.cn-ghbtn .gi'), ghSpin = q('.cn-ghbtn .uc-spin'), ghLbl = q('.cn-ghbtn .lbl');
    var notconn = q('.cn-notconn'), conn = q('.cn-conn'), repof = q('.cn-repof'), rv = q('.cn-repof .rv');
    var branch = q('.cn-branch'), detect = q('.cn-detect'), appname = q('.cn-appname'), av = q('.cn-appname .av');
    var save = q('.cn-save'), saveSpin = q('.cn-save .uc-spin'), saveLbl = q('.cn-save .lbl'), saveGlowB = q('.cn-save .glow-b');
    var steps = q('.cn-steps').querySelectorAll('.uc-step');

    /* init */
    tl.set(panel, { x: 740, opacity: 1 }, 0);
    tl.set(side, { opacity: 1 }, 0);
    tl.set(dd, { opacity: 0 }, 0);
    tl.set(branch, { opacity: 0 }, 0);
    tl.set(detect, { opacity: 0 }, 0);
    tl.set(saveGlowB, { opacity: 0 }, 0);
    tl.set(save, { scale: 1, opacity: 1 }, 0);
    tl.call(function () {
      notconn.style.display = 'block'; conn.style.display = 'none';
      ghLbl.textContent = 'Connect GitHub'; ghbtn.style.background = C.accent; ghIco.style.display = 'flex';
      rv.textContent = 'Search repositories...'; rv.style.color = C.muted; rv.style.fontFamily = '';
      repof.style.borderColor = C.border;
      av.textContent = 'e.g. frontend'; av.style.color = 'rgba(255,255,255,0.3)'; av.style.fontFamily = '';
      appname.style.borderColor = C.border;
      q('.sk1').style.display = 'inline-block'; q('.sk2').style.display = 'inline-block';
      q('.ch1').style.display = 'none'; q('.ch2').style.display = 'none';
      q('.rr0').style.background = 'transparent';
      saveLbl.textContent = 'Save & Deploy'; save.style.background = '#11a329e1';
      steps.forEach(function (r, i) { r.className = 'uc-step ' + (i < 2 ? 'done' : i === 2 ? 'active' : 'idle'); });
    }, null, 0);

    tl.to(panel, { x: 0, duration: 0.35, ease: 'power2.out' }, 0.05);

    /* connect flow */
    tl.call(function () { ghLbl.textContent = 'Connecting...'; ghbtn.style.background = C.accentHover; ghIco.style.display = 'none'; }, null, 1.0);
    addSpin(tl, ghSpin, 1.0, 1.55);
    tl.call(function () { notconn.style.display = 'none'; conn.style.display = 'block'; }, null, 1.55);

    /* repo pick */
    tl.call(function () { repof.style.borderColor = C.accent; }, null, 2.05);
    tl.to(dd, { opacity: 1, duration: 0.15, ease: 'none' }, 2.15);
    tl.call(function () { q('.rr0').style.background = 'rgba(17,163,42,0.12)'; }, null, 2.5);
    tl.to(dd, { opacity: 0, duration: 0.15, ease: 'none' }, 2.75);
    tl.call(function () { rv.textContent = 'user/my-app'; rv.style.color = C.text; rv.style.fontFamily = MONO; }, null, 2.75);
    tl.to(branch, { opacity: 1, duration: 0.25, ease: 'none' }, 2.85);
    tl.call(function () { repof.style.borderColor = C.border; }, null, 2.9);
    tl.call(function () { av.textContent = 'my-app'; av.style.color = C.text; av.style.fontFamily = MONO; appname.style.borderColor = C.accent; }, null, 2.9);
    tl.call(function () { appname.style.borderColor = C.border; }, null, 3.5);
    tl.to(detect, { opacity: 1, duration: 0.25, ease: 'none' }, 2.9);
    /* skeleton shimmer (sin t*6) then the detected chip */
    var sk1 = q('.sk1'), sk2 = q('.sk2');
    tl.fromTo(sk1, { opacity: 0.9 }, { opacity: 0.1, duration: 0.52, ease: 'sine.inOut', repeat: 1, yoyo: true }, 2.9);
    tl.fromTo(sk2, { opacity: 0.7 }, { opacity: 0.15, duration: 0.45, ease: 'sine.inOut', repeat: 1, yoyo: true }, 2.95);
    tl.call(function () {
      sk1.style.display = 'none'; sk2.style.display = 'none';
      q('.ch1').style.display = 'inline-block'; q('.ch2').style.display = 'inline';
    }, null, 3.5);

    /* save & deploy */
    tl.call(function () { save.style.background = '#11A32A90'; }, null, 4.45);
    tl.set(saveGlowB, { opacity: 1 }, 4.45);
    tl.to(save, { scale: 1.02, duration: 0.1, ease: 'power1.out' }, 4.45);
    tl.to(save, { scale: 0.97, duration: 0.06, ease: 'power1.out' }, 4.85);
    tl.to(save, { scale: 1, duration: 0.1, ease: 'power1.in' }, 5.0);
    tl.call(function () { save.style.background = '#11a329e1'; saveLbl.textContent = 'Working...'; }, null, 4.85);
    tl.set(saveGlowB, { opacity: 0 }, 4.85);
    tl.set(save, { opacity: 0.7 }, 4.85);
    addSpin(tl, saveSpin, 4.85, 6.4);
    tl.call(function () { steps[2].className = 'uc-step done'; steps[3].className = 'uc-step active'; }, null, 4.85);
    tl.call(function () { steps[3].className = 'uc-step done'; }, null, 5.25);

    tl.to([panel, side], { opacity: 0, duration: 0.4, ease: 'none' }, 5.85);

    addCam(tl, q('.uc-surface'), [
      { t: 0, x: 640, y: 360, z: 1 }, { t: 0.45, x: 640, y: 360, z: 1 },
      { t: 0.8, x: 526, y: 300, z: 1.45 }, { t: 1.85, x: 526, y: 300, z: 1.45 },
      { t: 2.1, x: 640, y: 420, z: 1.05 }, { t: 3.0, x: 640, y: 420, z: 1.05 },
      { t: 3.45, x: 640, y: 430, z: 1.02 }, { t: 5.5, x: 640, y: 430, z: 1.02 },
      { t: 6.15, x: 640, y: 360, z: 1 }
    ]);
    addCursor(tl, layer, [
      { t: 0.1, x: 900, y: 500 }, { t: 0.85, x: 665, y: 295 }, { t: 1.85, x: 665, y: 295 },
      { t: 2.1, x: 750, y: 353 }, { t: 2.45, x: 750, y: 353 }, { t: 2.65, x: 700, y: 391 },
      { t: 3.4, x: 700, y: 391 }, { t: 4.45, x: 1164, y: 684 }, { t: 5.35, x: 1164, y: 684 },
      { t: 6.1, x: 1320, y: 740 }
    ], [1.0, 2.15, 2.75, 4.85], [5.9, 6.3]);
  }

  /* ════════════════════ SCENE 7 — Deployed ════════════════════ */
  function deployedHtml() {
    return '<div class="uc-scene" data-s="Deployed"><div class="uc-surface">' +
      chromeHtml({ name: 'my-machine', dot: 'green', pods: true }) +
      '<div class="uc-dots-bg"></div>' +
      '<div class="dp-card" style="position:absolute;left:490px;top:300px;width:300px;opacity:0">' +
      '<div style="background:#1e1d1d;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px 16px">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
      '<span style="color:' + C.accent + ';display:flex">' + ico.github() + '</span>' +
      '<div style="flex:1;min-width:0"><div style="font-size:14.4px;font-weight:600;color:' + C.text + '">my-app</div>' +
      '<div style="font-size:11.5px;color:' + C.muted + ';margin-top:2px;font-family:' + MONO + '">user/my-app · main</div></div>' +
      '<span style="position:relative"><span class="uc-badge building">building</span><span class="uc-badge running">running</span></span>' +
      '</div></div></div>' +
      '</div></div>';
  }
  function deployedBuild(tl, layer) {
    var q = function (s) { return layer.querySelector(s); };
    var card = q('.dp-card'), badgeB = q('.uc-badge.building'), badgeR = q('.uc-badge.running');
    tl.set(card, { opacity: 0, clipPath: 'none', x: 0, y: 0 }, 0);
    tl.set(badgeB, { opacity: 1 }, 0);
    tl.set(badgeR, { opacity: 0 }, 0);
    addFlickerIn(tl, card, 0.25);
    addGlitch(tl, card, [[0.25, 0.75]], 83);
    tl.to(badgeB, { opacity: 0, duration: 0.3, ease: 'none' }, 1.3);
    tl.to(badgeR, { opacity: 1, duration: 0.3, ease: 'none' }, 1.3);
    addCam(tl, q('.uc-surface'), [
      { t: 0, x: 640, y: 360, z: 1 }, { t: 0.4, x: 640, y: 360, z: 1 },
      { t: 1.0, x: 650, y: 350, z: 1.18 }, { t: 1.9, x: 650, y: 350, z: 1.18 },
      { t: 2.5, x: 640, y: 360, z: 1 }
    ]);
  }

  /* ════════════════════ stage assembly ════════════════════ */
  var BUILDERS = {
    Login: { html: loginHtml, build: loginBuild },
    Machines: { html: machinesHtml, build: machinesBuild },
    Create: { html: createHtml, build: createBuild },
    Pods: { html: podsHtml, build: podsBuild },
    AddPod: { html: addPodHtml, build: addPodBuild },
    Connect: { html: connectHtml, build: connectBuild },
    Deployed: { html: deployedHtml, build: deployedBuild }
  };

  function stageHtml() {
    var clips = GLITCH_PATHS.map(function (d, i) {
      return '<clipPath id="uc-gp' + i + '" clipPathUnits="objectBoundingBox"><path d="' + d + '" transform="scale(0.0025,0.0025)"/></clipPath>';
    }).join('');
    return '<div class="uc-stage">' +
      '<svg style="position:absolute;width:0;height:0" aria-hidden="true"><defs>' + clips + '</defs></svg>' +
      SCENES.map(function (s) { return BUILDERS[s.name].html(); }).join('') +
      '</div>';
  }

  function mount(container) {
    if (!window.gsap) { console.error('usectl commercial: gsap not loaded'); return null; }
    container.classList.add('uc-mount');
    container.innerHTML = stageHtml();
    var stage = container.querySelector('.uc-stage');

    /* fit the 1920x1080 stage into the container with one transform */
    var fit = function () {
      var w = container.clientWidth || 1;
      gsap.set(stage, { scale: w / 1920, force3D: true });
    };
    fit();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(container);

    var master = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: 'none' } });
    var t0 = 0;
    SCENES.forEach(function (s) {
      var layer = container.querySelector('.uc-scene[data-s="' + s.name + '"]');
      master.set(layer, { display: 'block' }, t0);
      var tl = gsap.timeline({ defaults: { ease: 'none' } });
      BUILDERS[s.name].build(tl, layer);
      tl.timeScale(s.nat / s.dur);
      master.add(tl, t0);
      master.set(layer, { display: 'none' }, t0 + s.dur - 0.001);
      t0 += s.dur;
    });
    /* pin the master's duration to the full slot sum so the loop wrap is exact */
    master.call(function () {}, null, t0);

    var reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      master.progress(32.0 / 33.7).pause(); /* settled "deployed" frame */
    } else {
      master.play(0);
      /* don't burn GPU when the commercial is offscreen */
      if (typeof IntersectionObserver !== 'undefined') {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) master.play(); else master.pause();
        }, { threshold: 0.05 }).observe(container);
      }
    }
    return master;
  }

  window.UsectlCommercialGSAP = { mount: mount, SCENES: SCENES };
})();
