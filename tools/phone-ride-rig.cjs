// phone-profile ride rig for variants/12-webgpu.html — headless Chrome with real WebGPU (ANGLE/Metal),
// phone viewport (390x844 @3, mobile UA, touch), CPU throttled 4x, then a synthesized full-page ride
// that records rAF gaps, render-pipeline creations, device.lost / uncapturederror / navigations, the
// page's own __stallLog, and (optionally) a CPU profile. found the first-scroll compile storm, 2026-10-03.
//   usage: URL=http://127.0.0.1:5173/variants/12-webgpu.html?nosw WAIT=2 node tools/phone-ride-rig.cjs
//   env: WAIT (s after veil before riding; 0 = like a visitor), PAUSE="1400:7,4200:7" (reading pauses),
//        SHOT=1 (screenshots before/after each pause), PROFILE=0 (skip the CPU profile), CPU=4, PX=14,
//        TAG=name (output files are written next to this script). needs puppeteer-core (path below).
// never run this against the user's own Chrome window — it launches its own headless instance.
const fs = require('fs');
// puppeteer-core comes from the npx cache (not a dependency of this repo —
// the rig is a tool, not part of the build). PUPPETEER= overrides the path.
const puppeteer = require(process.env.PUPPETEER || '/Users/wazzap/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core');
const SP = __dirname;
const URL = process.env.URL || 'http://127.0.0.1:5179/variants/12-webgpu.html?nosw';
const WAIT = +(process.env.WAIT || 2);
const CPU = +(process.env.CPU || 4);
const PX = +(process.env.PX || 14);
const W = +(process.env.W || 390), H = +(process.env.H || 844), DSF = +(process.env.DSF || 3);
const TAG = process.env.TAG || 'run';
const PROFILE = process.env.PROFILE !== '0';
const PAUSES = (process.env.PAUSE || '').split(',').filter(Boolean).map(x => x.split(':')).map(([y, s]) => [+y, +s]);
const log = (...a) => console.log(((performance.now() / 1000).toFixed(1) + 's').padStart(7), ...a);
(async () => {
  const prof = SP + '/prof-' + TAG + '-' + Date.now();
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--no-first-run', '--window-size=' + W + ',' + H, '--user-data-dir=' + prof, '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage();
  await page.emulate({
    viewport: {width: W, height: H, deviceScaleFactor: DSF, isMobile: true, hasTouch: true},
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
  });
  const client = await page.createCDPSession();
  await client.send('Emulation.setCPUThrottlingRate', {rate: CPU});
  await page.evaluateOnNewDocument(() => {
    window.__pipes = 0; window.__pipeLog = [];
    try {
      const P = GPUDevice.prototype;
      for (const k of ['createRenderPipeline', 'createRenderPipelineAsync']) {
        const o = P[k];
        P[k] = function (d) { window.__pipes++; return o.call(this, d); };
      }
    } catch (e) {}
  });
  page.on('console', m => { const t = m.text(); if (/12-webgpu|watchdog|probe|rung|DEVICE|error|lost/i.test(t)) log('  >', t.slice(0, 200)); });
  page.on('framenavigated', f => { if (f === page.mainFrame()) log('  !! NAVIGATED to', f.url().slice(0, 120)); });
  await page.evaluateOnNewDocument(() => {
    try {
      const rd = GPUAdapter.prototype.requestDevice;
      GPUAdapter.prototype.requestDevice = async function () { const d = await rd.apply(this, arguments); d.lost.then(i => console.log('DEVICE LOST reason=' + i.reason + ' msg=' + i.message)); d.addEventListener('uncapturederror', e => console.log('GPU uncapturederror: ' + String(e.error && e.error.message).slice(0, 200))); return d; };
    } catch (e) {}
  });
  page.on('pageerror', e => log('  !! pageerror', String(e).slice(0, 300)));
  await page.evaluateOnNewDocument(() => { window.addEventListener('error', e => { window.__lastErr = String(e.message).slice(0, 200); }); });
  const t0 = Date.now();
  await page.goto(URL, {waitUntil: 'domcontentloaded', timeout: 120000});
  await page.waitForFunction('window.__veilDown === true', {timeout: 180000, polling: 250});
  const veilAt = (Date.now() - t0) / 1000;
  const boot = await page.evaluate(() => ({pipes: window.__pipes, steps: window.__sweepSteps, len: window.__sweepLen, mq: window.__mq && window.__mq.info()}));
  log('veil down at', veilAt.toFixed(1) + 's', 'pipelines so far', boot.pipes, 'sweep', boot.steps + '/' + boot.len, 'rung', boot.mq && boot.mq.tier, 'dpr', boot.mq && (+boot.mq.dpr).toFixed(2), 'why', boot.mq && boot.mq.why);
  await new Promise(r => setTimeout(r, WAIT * 1000));
  const pre = await page.evaluate(() => ({pipes: window.__pipes, warmY: window.__warmY, steps: window.__sweepSteps, len: window.__sweepLen, y: window.pageYOffset}));
  log('ride starts: pipelines', pre.pipes, 'deferred sweep', pre.warmY != null ? 'RUNNING ' + pre.steps + '/' + pre.len : 'idle', 'y', pre.y);
  if (PROFILE) { await client.send('Profiler.enable'); await client.send('Profiler.setSamplingInterval', {interval: 500}); await client.send('Profiler.start'); }
  // the ride runs in segments: [from, to) per pause point; between segments the page sits still
  const segs = []; let segFrom = 0;
  for (const [py, ps] of PAUSES) { segs.push([segFrom, py, ps]); segFrom = py; }
  segs.push([segFrom, 1e9, 0]);
  let ride = {gaps: [], stalls: [], maxY: 0};
  for (const [from, to, pauseS] of segs) {
    // a segment that never resolves (the page's rAF stopped: gpu process gone, tab frozen) must not hang the rig
    const part = await Promise.race([page.evaluate((PX, from, to) => new Promise(res => {
      const maxY = document.documentElement.scrollHeight - innerHeight;
      const gaps = []; let y = from, last = performance.now(), p0 = window.__pipesRideBase == null ? (window.__pipesRideBase = window.__pipes) : window.__pipesRideBase;
      const stallsBefore = (window.__stallLog || []).length;
      function f(now) {
        const dt = now - last; last = now;
        gaps.push([Math.round(y), Math.round(dt), window.__pipes - p0, window.__mq ? window.__mq.tier : -1]);
        y += PX;
        if (y >= maxY || y >= to) { res({gaps, maxY, stalls: (window.__stallLog || []).slice(stallsBefore), tier: window.__mq && window.__mq.tier, why: window.__mq && window.__mq.why}); return; }
        window.scrollTo(0, y);
        requestAnimationFrame(f);
      }
      requestAnimationFrame(f);
    }), PX, from, to), new Promise((_, rej) => setTimeout(() => rej(new Error('segment ' + from + '-' + to + ' timed out (page rAF stopped?)')), 120000))]);
    ride.gaps.push(...part.gaps); ride.stalls.push(...part.stalls); ride.maxY = part.maxY; ride.tier = part.tier; ride.why = part.why;
    if (pauseS > 0) {
      const st0 = await page.evaluate(() => ({pipes: window.__pipes, steps: window.__sweepSteps, warm: window.__warmY, y: Math.round(pageYOffset), pace: window.__mq && window.__mq.pace}));
      if (process.env.SHOT) await page.screenshot({path: SP + '/shot-' + TAG + '-y' + to + '-pre.png'});
      await new Promise(r => setTimeout(r, pauseS * 1000));
      const st1 = await page.evaluate(() => ({pipes: window.__pipes, steps: window.__sweepSteps, len: window.__sweepLen, warm: window.__warmY, y: Math.round(pageYOffset), pace: window.__mq && window.__mq.pace, err: window.__lastErr || null}));
      log('PAUSE at y', to, pauseS + 's: pipelines', st0.pipes, '->', st1.pipes, 'sweep', st0.steps, '->', st1.steps + '/' + st1.len, 'warmY now', st1.warm, 'y', st1.y, 'pace', st1.pace);
      if (process.env.SHOT) { await new Promise(r => setTimeout(r, 700)); await page.screenshot({path: SP + '/shot-' + TAG + '-y' + to + '-post.png'}); }
    }
  }
  let profile = null;
  if (PROFILE) { profile = (await client.send('Profiler.stop')).profile; }
  const g = ride.gaps.map(x => x[1]).sort((a, b) => a - b);
  const pct = q => g[Math.min(g.length - 1, Math.floor(g.length * q))];
  const over = n => ride.gaps.filter(x => x[1] > n).length;
  const total = g.reduce((a, b) => a + b, 0) / 1000;
  log('RIDE', TAG, 'maxY', ride.maxY, 'frames', g.length, 'time', total.toFixed(1) + 's', 'median', pct(0.5) + 'ms', 'p95', pct(0.95) + 'ms', 'worst', g[g.length - 1] + 'ms', '>50ms', over(50), '>100ms', over(100), '>200ms', over(200), 'pipelines', ride.gaps[ride.gaps.length - 1][2], 'end rung', ride.tier, '(' + ride.why + ')');
  const worst = [...ride.gaps].sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => 'y' + x[0] + ':' + x[1] + 'ms/p' + x[2] + '/r' + x[3]);
  log('worst frames (y:ms/pipelines-so-far/rung):', worst.join('  '));
  // pipelines per 500px band
  const bands = {}; let lastP = 0;
  for (const x of ride.gaps) { const b = Math.floor(x[0] / 500) * 500; bands[b] = (bands[b] || 0) + (x[2] - lastP); lastP = x[2]; }
  log('pipelines per 500px band:', Object.entries(bands).filter(([, v]) => v > 0).map(([k, v]) => k + ':' + v).join(' '));
  // stall log: per-function time inside frames >40ms
  const agg = {};
  for (const s of ride.stalls) for (const k in s) if (!/^(gap|y|at)$/.test(k)) agg[k] = (agg[k] || 0) + s[k];
  log('stall-log function totals (ms inside >40ms frames):', JSON.stringify(agg), 'stalls', ride.stalls.length);
  if (profile) {
    const self = new Map(); const byId = new Map(profile.nodes.map(n => [n.id, n]));
    const dts = profile.timeDeltas; let tsum = 0;
    for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]); const d = (dts[i] || 0) / 1000; tsum += d; const cf = n.callFrame; const key = (cf.functionName || '(anon)') + ' @' + (cf.url || '').split('/').pop().split('?')[0] + ':' + (cf.lineNumber + 1); self.set(key, (self.get(key) || 0) + d); }
    const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
    log('CPU PROFILE total', tsum.toFixed(0) + 'ms; top self-time:');
    for (const [k, v] of top) console.log('   ' + v.toFixed(0).padStart(6) + 'ms  ' + (100 * v / tsum).toFixed(1).padStart(5) + '%  ' + k);
    fs.writeFileSync(SP + '/profile-' + TAG + '.cpuprofile', JSON.stringify(profile));
  }
  fs.writeFileSync(SP + '/ride-' + TAG + '.json', JSON.stringify(ride));
  await browser.close();
  try { fs.rmSync(prof, {recursive: true, force: true}); } catch (e) {}
})().catch(e => { console.error('RIG FAILED', e); process.exit(1); });
