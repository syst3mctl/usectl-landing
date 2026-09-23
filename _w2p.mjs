import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
const [,, inp, out] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(inp);
let n=0;
for (const tex of doc.getRoot().listTextures()){
  if (tex.getMimeType() === 'image/webp'){ tex.setImage(await sharp(Buffer.from(tex.getImage())).png().toBuffer()).setMimeType('image/png'); n++; }
}
await io.write(out, doc); console.log('webp->png', n);
