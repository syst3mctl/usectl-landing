// bake-laptop.mjs — bake the laptop's two one-shot runtime canvas edits into
// the shipped textures, then encode ALL FOUR 2048² sheets as ETC1S KTX2.
//
//   node tools/bake-laptop.mjs [in.glb] [out.glb] [--png-out <path>] [--no-ktx2]
//   defaults: public/models/_orig/laptop.glb -> public/models/laptop.glb
//
// WHY: the page scrubbed the laptop's baked-in serial texts at LOAD TIME with
// canvas pixel passes (12-webgpu.html "the bake's serial texts" block; same
// block in 11-yoozap.html) — and a canvas can only read a DECODABLE image, so
// the laptop was the one close-up prop stuck on webp (round 30): 4 × 2048²
// rgba sheets ≈ 89MB of raw gpu upload on first draw. With the edits baked
// here the sheets can ship gpu-compressed (ETC1S ≈ 5.6MB, no runtime scrub),
// and phones get the FULL 2048 instead of the round-44 governor caps.
//
// THE TWO EDITS — replicated texel-exact from the page (do not "improve"):
//   ALBEDO (baseColorTexture, sRGB, has alpha): the deck's side slivers are
//     punched-out alpha windows with serial glyphs floating DARK-GREEN inside
//     them. In each of three rects (2048-space, scaled by width/2048 with
//     Math.round exactly like the page):
//         [1494,300,46,160]  [1588,295,52,170]  [548,288,54,155]
//     any texel with  alpha > 8  &&  g > r + 8  gets alpha = 0 — green-
//     dominance selects exactly the glyphs; window borders and deck are grey.
//   ORM (occlusion+metallicRoughness — ONE shared texture, linear, no alpha):
//     the touchpad island holds a watermark row. Band 412,1194 792×52
//     (2048-space); a reference row is sampled per-column 8px BELOW the band
//     (y = 1194+52+8 — above the band sits the magenta seam); any band texel
//     with  b < 150  takes the reference row's rgb (the seam's blue/magenta
//     is spared; alpha untouched).
//
// PIPELINE: read draco glb (codec registered, model-diet.mjs setup) → decode
// webp with sharp → apply the two edits → re-encode PNG (KTX-Software cannot
// read webp, round-30 trick; alpha kept only on the albedo — the other slots
// never sample A and `ktx create` gets an exact-channel input) → drop
// EXT_texture_webp → gltf-transform toktx(ETC1S, CLI defaults: qlevel 128,
// mipmaps, per-slot srgb/linear + no-rdo on the normal map) → draco() →
// write. Geometry passes through the same read+write draco path model-diet
// uses. The `ktx` binary (>= 4.4.0) must be on PATH, or set KTX_DIR to an
// extracted KTX-Software prefix (default /tmp/ktxbin — pkgutil --expand-full
// of the Darwin .pkg; DYLD_FALLBACK_LIBRARY_PATH is set for its libktx).
//
// SAFETY RAILS: refuses a source that is not the pristine original (wrong
// mime/size, or ZERO punch candidates in the albedo rects = already baked).
// --png-out writes the baked-but-uncompressed intermediate for pixel-level
// verification against an independent reimplementation of the page's loops.
//
// AFTER THIS SHIPS the runtime scrub blocks MUST be guarded (a compressed
// texture's .image is not drawable — lapClone's drawImage throws): skip when
// lapAlb/lapOrm .isCompressedTexture in 12-webgpu.html; v11 has no KTX2Loader
// at all, so 11-yoozap.html must load /models/_orig/laptop.glb (the pristine
// webp build, same pattern as its calculator/control-panel _orig loads).
import { NodeIO, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import { toktx, Mode } from '@gltf-transform/cli';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import { statSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';

const args = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--png-out') flags.pngOut = args[++i];
  else if (args[i] === '--no-ktx2') flags.noKtx2 = true;
  else if (args[i] === '--verbose') flags.verbose = true;
  else positional.push(args[i]);
}
const IN = positional[0] || 'public/models/_orig/laptop.glb';
const OUT = positional[1] || 'public/models/laptop.glb';

// ── ktx binary: PATH first, KTX_DIR (default /tmp/ktxbin) as fallback ──
function ktxOk() {
  const r = spawnSync('ktx', ['--version'], { encoding: 'utf8' });
  return r.status === 0 && /4\./.test(r.stdout + r.stderr);
}
if (!flags.noKtx2 && !ktxOk()) {
  const dir = process.env.KTX_DIR || '/tmp/ktxbin';
  if (existsSync(dir + '/bin/ktx')) {
    process.env.PATH = dir + '/bin:' + process.env.PATH;
    process.env.DYLD_FALLBACK_LIBRARY_PATH =
      dir + '/lib' + (process.env.DYLD_FALLBACK_LIBRARY_PATH ? ':' + process.env.DYLD_FALLBACK_LIBRARY_PATH : '');
  }
  if (!ktxOk()) {
    console.error('FATAL: no working `ktx` (KTX-Software >= 4.4) on PATH and none under ' + dir + '.\n' +
      'Download the macOS .pkg from https://github.com/KhronosGroup/KTX-Software/releases,\n' +
      'extract WITHOUT installing:  pkgutil --expand-full KTX-Software-*.pkg /tmp/ktxpkg\n' +
      'then point KTX_DIR at the payload prefix holding bin/ktx and lib/libktx.dylib.');
    process.exit(1);
  }
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(IN);
doc.setLogger(new Logger(flags.verbose ? Logger.Verbosity.DEBUG : Logger.Verbosity.WARN));
const root = doc.getRoot();

// ── resolve the four sheets by SLOT (the page resolves via material keys) ──
const mats = root.listMaterials();
if (mats.length !== 1) fail(`expected 1 material, found ${mats.length}`);
const mat = mats[0];
const alb = mat.getBaseColorTexture();
const orm = mat.getMetallicRoughnessTexture();
const emi = mat.getEmissiveTexture();
const nrm = mat.getNormalTexture();
if (!alb || !orm || !emi || !nrm) fail('missing one of baseColor/metallicRoughness/emissive/normal textures');
if (mat.getOcclusionTexture() !== orm)
  fail('occlusionTexture !== metallicRoughnessTexture — the page edits ONE shared ORM; source layout changed');
for (const [n, t] of [['albedo', alb], ['orm', orm], ['emissive', emi], ['normal', nrm]]) {
  if (t.getMimeType() !== 'image/webp') fail(`${n} is ${t.getMimeType()}, not the pristine webp — wrong source file?`);
  const [w, h] = t.getSize();
  if (w !== 2048 || h !== 2048) fail(`${n} is ${w}x${h}, expected the 2048² sheet`);
}

async function decodeRGBA(tex) {
  const { data, info } = await sharp(Buffer.from(tex.getImage()))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { d: data, W: info.width, H: info.height };
}

// ── EDIT 1: the albedo alpha punch (page: three rects, a>8 && g>r+8 → a=0) ──
const A = await decodeRGBA(alb);
const aS = A.W / 2048;   // rects measured on the 2k bake (page keeps this scale-safe)
let punched = 0;
[[1494, 300, 46, 160], [1588, 295, 52, 170], [548, 288, 54, 155]].forEach(function (R) {
  const rx = Math.round(R[0] * aS), ry = Math.round(R[1] * aS),
        rw = Math.round(R[2] * aS), rh = Math.round(R[3] * aS);
  let hit = 0;
  for (let y = ry; y < ry + rh; y++)
    for (let x = rx; x < rx + rw; x++) {
      const i = (y * A.W + x) * 4;
      if (A.d[i + 3] > 8 && A.d[i + 1] > A.d[i] + 8) { A.d[i + 3] = 0; hit++; }
    }
  if (hit === 0) fail(`albedo rect [${R}] has ZERO punch candidates — source already baked? refusing`);
  console.log(`albedo rect [${R}]: punched ${hit} texels`);
  punched += hit;
});

// ── EDIT 2: the ORM green flood (page: band 412,1194 792x52, ref row below) ──
const O = await decodeRGBA(orm);
const oS = O.W / 2048;
const orx = Math.round(412 * oS), ory = Math.round(1194 * oS),
      orw = Math.round(792 * oS), orh = Math.round(52 * oS);
const refY = ory + orh + Math.round(8 * oS);
let flooded = 0;
for (let oy = 0; oy < orh; oy++)
  for (let ox = 0; ox < orw; ox++) {
    const i = ((ory + oy) * O.W + (orx + ox)) * 4;
    const r = (refY * O.W + (orx + ox)) * 4;
    if (O.d[i + 2] < 150) {
      O.d[i] = O.d[r]; O.d[i + 1] = O.d[r + 1]; O.d[i + 2] = O.d[r + 2];
      flooded++;
    }
  }
if (flooded === 0) fail('ORM band has ZERO flood candidates — source already baked? refusing');
console.log(`orm band [${orx},${ory},${orw},${orh}]: flooded ${flooded} texels (ref row y=${refY})`);

// ── write the edits back as PNG (ktx can read that; webp it cannot) ──
async function toPng(px, keepAlpha) {
  let s = sharp(px.d, { raw: { width: px.W, height: px.H, channels: 4 } });
  if (!keepAlpha) s = s.removeAlpha();   // slot never samples A; exact-channel input for `ktx create`
  return s.png({ compressionLevel: 9 }).toBuffer();
}
alb.setImage(await toPng(A, true)).setMimeType('image/png');
orm.setImage(await toPng(O, false)).setMimeType('image/png');
// the untouched sheets ride along webp→png (lossless: webp decode is exact)
for (const t of [emi, nrm]) {
  const px = await decodeRGBA(t);
  t.setImage(await toPng(px, false)).setMimeType('image/png');
}
// no webp images remain — drop the extension or the writer keeps it required
for (const e of root.listExtensionsUsed())
  if (e.extensionName === 'EXT_texture_webp') e.dispose();

if (flags.pngOut) {
  await io.write(flags.pngOut, doc);
  console.log('png intermediate:', flags.pngOut, kb(flags.pngOut));
}

// ── ETC1S KTX2, all four sheets (gltf-transform defaults = the round-30 recipe) ──
if (!flags.noKtx2) {
  await doc.transform(toktx({ mode: Mode.ETC1S }));
  for (const t of root.listTextures())
    if (t.getMimeType() !== 'image/ktx2')
      fail(`texture "${t.getName() || listSlot(t)}" stayed ${t.getMimeType()} — ktx encode failed (rerun with --verbose)`);
}

await doc.transform(draco());   // same explicit encode model-diet ships desktop glbs with
await io.write(OUT, doc);
console.log(`in:  ${IN} ${kb(IN)}`);
console.log(`out: ${OUT} ${kb(OUT)}  (albedo punched ${punched}, orm flooded ${flooded}, 4 sheets ${flags.noKtx2 ? 'png' : 'ETC1S ktx2'})`);

function kb(p) { return (statSync(p).size / 1024).toFixed(0) + 'KB'; }
function fail(msg) { console.error('FATAL: ' + msg); process.exit(1); }
function listSlot() { return 'texture'; }
