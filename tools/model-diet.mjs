// model-diet.mjs — the quality-free part of the model bill, plus the phone cut.
//
//   node tools/model-diet.mjs <in.glb> <out.glb>          desktop: dedup + prune + draco
//   node tools/model-diet.mjs <in.glb> <out.glb> mobile [nearRatio]
//
// WHAT IT FOUND ON virtual-city.glb (2026-09-26), and why each pass exists:
//   dedup    the city is a 3x3 tile grid + outer ring REPLICATED as separate
//            meshes — 9 copies of a ~4.1MB tile stored byte-identically.
//            dedup makes them shared instances: 77 -> 37 stored meshes,
//            134 -> 55MB of attributes. drawn pixels identical.
//   prune    almost every city material has NO textures (vertex-color art),
//            yet every mesh carried a Float32 TEXCOORD_0 — the LARGEST
//            attribute on the file, entirely dead. keepAttributes:false
//            drops what no material samples. render-identical.
//   simplify (mobile only) per CLASS, not one global ratio: the hanging
//            wires are hair-thin strokes (sub-pixel at 390px) and the outer
//            ring reads as skyline — both take 0.35 where the close-up
//            buildings keep the shipped 0.55 ("we dont see it far in mobile").
//   quantize (mobile only) KHR_mesh_quantization, position i16 / normal i8 —
//            NEVER on a model the page takes apart (round-37 law; city and
//            rack are used whole).
//   meshopt/draco  meshopt decodes cheap on a phone cpu and keeps quantized
//            types in vram; draco stays for desktop (r128 + r186 both decode
//            it, decoder already vendored).
//
// MEASURED: desktop city 9.83 -> 4.79MB (render-identical);
//           mobile city 9.39 -> 4.58MB raw, 3.72MB gzipped on the wire.
// Verified by full-page shot pairs (phone dsf3 + desktop dsf2): hero, split,
// machine, faq — no visible change; tower carve + rack placement intact
// (the page finds the tower BY MESH NAME — names survive these passes).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, simplifyPrimitive, weldPrimitive, quantize, draco, meshopt } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { statSync } from 'fs';

const [,, IN, OUT, MODE, NEAR] = process.argv;
if (!IN || !OUT) { console.error('usage: node tools/model-diet.mjs <in.glb> <out.glb> [mobile] [nearRatio]'); process.exit(1); }
const NEAR_RATIO = NEAR ? parseFloat(NEAR) : 0.55;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
});
const doc = await io.read(IN);

// the source is draco-compressed; on the meshopt path the extension must GO
// once decoded, or the writer re-encodes a second (orphan) draco copy of
// every mesh into the same file — measured +3.7MB of dead buffer views.
if (MODE === 'mobile') {
  for (const e of doc.getRoot().listExtensionsUsed()) {
    if (e.extensionName === 'KHR_draco_mesh_compression') e.dispose();
  }
}

function stats(tag) {
  let attrBytes = 0, tris = 0;
  const seen = new Set();
  for (const mesh of doc.getRoot().listMeshes()) {
    if (seen.has(mesh)) continue; seen.add(mesh);
    for (const prim of mesh.listPrimitives()) {
      for (const a of prim.listAttributes()) attrBytes += a.getArray().byteLength;
      const idx = prim.getIndices();
      if (idx) { attrBytes += idx.getArray().byteLength; tris += idx.getCount() / 3; }
    }
  }
  console.log(`${tag}: meshes=${seen.size} storedTris=${Math.round(tris / 1000)}k attr+idx=${(attrBytes / 1048576).toFixed(1)}MB`);
}

stats('in');
await doc.transform(dedup());
stats('dedup');
await doc.transform(prune({ keepAttributes: false, keepLeaves: false, keepSolidTextures: false }));
stats('prune');

if (MODE === 'mobile') {
  await MeshoptSimplifier.ready;
  const classes = { wire: [0.35, 0.008], far: [0.35, 0.01], near: [NEAR_RATIO, 0.004] };
  const byClass = (name) => /Wire_geo/.test(name) ? 'wire'
    : /geo01[0-8]/.test(name) ? 'far' : 'near';
  const seen = new Set();
  for (const mesh of doc.getRoot().listMeshes()) {
    if (seen.has(mesh)) continue; seen.add(mesh);
    const [ratio, error] = classes[byClass(mesh.getName() || '')];
    for (const prim of mesh.listPrimitives()) {
      weldPrimitive(prim);
      simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio, error });
    }
  }
  await doc.transform(prune({ keepAttributes: false, keepLeaves: false }));
  stats('simplify');
  await doc.transform(quantize({ quantizeNormal: 8 }));
  stats('quantize');
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
} else {
  await doc.transform(draco());
}
await io.write(OUT, doc);
console.log('out:', OUT, (statSync(OUT).size / 1048576).toFixed(2) + 'MB');
