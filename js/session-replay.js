// Session replay (OpenReplay, self-hosted at analytics.usectl.com, admin-only).
//
// Records clicks, scrolls and page structure so we can see where visitors get
// stuck. Typed input is never recorded (defaultInputMode 2), emails and digits
// in text are masked, URLs lose their query string and hash. Only runs on the
// production hosts — previews and localhost stay silent.
//
// Links into the dashboard carry ?lsid=<this session id>; the dashboard tracker
// stores it as `landingSession` metadata, which joins a landing visit to the
// signup that follows it.
//
// The tracker is fetched as its own chunk once the page is idle, so it never
// competes with the hero and the 3D scenes for the first paint.

const HOSTS = new Set(['usectl.com', 'www.usectl.com']);
const PROJECT_KEY = 'DfkHZqqNNpgulYasVwNQ';
const INGEST_POINT = 'https://analytics.usectl.com/ingest';
const DASHBOARD_HOST = 'manager.usectl.com';

let tracker = null;

// Appends lsid to a manager.usectl.com URL; anything else passes through.
// Exposed for the inline scripts that navigate with window.location.href.
export function withLandingSession(href) {
  try {
    const u = new URL(href, window.location.href);
    const sid = tracker?.isActive() ? tracker.getSessionID() : null;
    if (u.hostname !== DASHBOARD_HOST || !sid) return href;
    u.searchParams.set('lsid', sid);
    return u.toString();
  } catch {
    return href;
  }
}
window.usectlWithLandingSession = withLandingSession;

async function start() {
  ({ tracker } = await import('@openreplay/tracker'));
  tracker.configure({
    projectKey: PROJECT_KEY,
    ingestPoint: INGEST_POINT,
    respectDoNotTrack: true,
    captureIFrames: false,
    consoleMethods: ['error'],
    defaultInputMode: 2,
    obscureInputEmails: true,
    obscureInputNumbers: true,
    obscureTextEmails: true,
    network: { capturePayload: false, ignoreHeaders: true, sessionTokenHeader: false, failuresOnly: false, captureInIframes: false },
    canvas: { disableCanvas: true },
    urls: { urlSanitizer: (url) => url.split(/[?#]/)[0] },
  });
  await tracker.start();
}

if (HOSTS.has(window.location.hostname)) {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  const go = () => idle(() => start().catch(() => { /* blocked or opted out — the page works without it */ }));
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });

  // Capture phase: rewrite the href before the browser follows the link.
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (a) a.href = withLandingSession(a.href);
  }, true);
}
