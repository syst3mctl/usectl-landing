// webp-lossless.mjs <in.glb> <out.glb> — re-encode PNG textures as LOSSLESS
// WebP (bit-exact pixels; every loader in play handles EXT_texture_webp,
// including the vendored r128 GLTFLoader). KTX2/JPEG textures untouched.
// Found by the 2026-09-26 weight audit: sci-fi_control_panel.glb is 84% one
// 1.27MB 1024² PNG -> 0.88MB total after this pass. Lossless WebP decodes
// into a canvas identically, so the page's canvas-read of the panel's
// emissive map keeps working.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { textureCompress } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync } from 'fs';

const [,, IN, OUT] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
});
const doc = await io.read(IN);
await doc.transform(textureCompress({
  encoder: sharp,
  targetFormat: 'webp',
  lossless: true,
  formats: /^image\/png$/,
}));
await io.write(OUT, doc);
console.log(IN, '->', OUT, (statSync(IN).size / 1024 | 0) + 'KB ->', (statSync(OUT).size / 1024 | 0) + 'KB');
