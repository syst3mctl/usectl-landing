#!/bin/bash
# Build the phone/tablet asset set: public/models/m/*.glb
#
#   simplify (where the triangle bill is real) → resize textures → quantize → meshopt
#
# WHY each step, measured on the page at a 390x844 dsf3 phone profile:
#   simplify  city 3.13M → 1.41M triangles (the wire overlay rides the same
#             geometry, so it thins with it — checked against shots)
#   resize    the props' 1024² sheets are more than a 390px frame resolves;
#             the KTX2 close-ups (calculator, control panel) pass through
#   quantize  KHR_mesh_quantization — position i16, normal i8, colour u8:
#             198MB → 38MB of vertex attributes, the single biggest win
#   meshopt   replaces draco: slightly larger on the wire, MUCH cheaper to
#             decode on a phone cpu, and it keeps the quantized types in vram
#             (draco decodes back to float32 and throws the win away)
#
# Run after changing anything in public/models/. Needs @gltf-transform/cli
# (devDependency). The page picks the set by viewport+pointer — see
# MODEL_DIR / SMALL_ASSETS and the paired <link rel=preload> tags.
set -e
cd /Users/wazzap/Sites/usectl-landing
T=$(mktemp -d)
GT="npx --no-install gltf-transform"
mkdir -p public/models/m "$T"

build () {   # name ratio texsize
  n=$1; ratio=$2; tex=$3
  src=public/models/$n.glb
  a=$T/$n.a.glb; b=$T/$n.b.glb; c=$T/$n.c.glb
  if [ "$ratio" = "1" ]; then cp "$src" "$a"; else $GT simplify "$src" "$a" --ratio "$ratio" --error 0.004 >/dev/null 2>&1; fi
  $GT resize "$a" "$b" --width "$tex" --height "$tex" >/dev/null 2>&1 || cp "$a" "$b"
  $GT quantize "$b" "$c" >/dev/null 2>&1 || cp "$b" "$c"
  $GT meshopt "$c" public/models/m/$n.glb >/dev/null 2>&1 || cp "$c" public/models/m/$n.glb
  s0=$(stat -f%z "$src"); s1=$(stat -f%z public/models/m/$n.glb)
  printf "  %-28s %6.2fMB → %6.2fMB  (ratio %s, tex %s)\n" "$n" "$(echo "scale=2;$s0/1048576"|bc)" "$(echo "scale=2;$s1/1048576"|bc)" "$ratio" "$tex"
}

echo "building phone asset set:"
build virtual-city            0.45 1024
build server_racking_system   0.6  512
build pcb                     0.7  512
build calculator              0.85 1024
build sci-fi_control_panel    0.85 1024
build laptop                  0.8  512
build door                    0.8  512
build terminal                0.8  512
build card                    1    512
build qblock                  1    512
echo "total:"; du -sh public/models/m
