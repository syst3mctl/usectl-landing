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

# QUANTIZE ONLY WHAT THE PAGE DOES NOT TAKE APART.
# gltf-transform's quantize rewrites positions into integer space and puts
# the compensating scale/offset on the NODE. Any code that lifts a
# geometry out of its node and re-uses it — the page instances qblock's
# mesh for the faq's mario boxes — then draws integer coordinates as if
# they were metres: the blocks came out shredded on the phone build while
# the desktop build was clean ("our mario ? boxes in mobile are broken").
# The whole vertex-memory win lives in the city and the racks anyway; the
# props are a rounding error, so they keep their float32 geometry.
build () {   # name ratio texsize quantize(0|1)
  n=$1; ratio=$2; tex=$3; q=$4
  src=public/models/$n.glb
  a=$T/$n.a.glb; b=$T/$n.b.glb; c=$T/$n.c.glb
  if [ "$ratio" = "1" ]; then cp "$src" "$a"; else $GT simplify "$src" "$a" --ratio "$ratio" --error 0.004 >/dev/null 2>&1; fi
  $GT resize "$a" "$b" --width "$tex" --height "$tex" >/dev/null 2>&1 || cp "$a" "$b"
  if [ "$q" = "1" ]; then $GT quantize "$b" "$c" >/dev/null 2>&1 || cp "$b" "$c"; else cp "$b" "$c"; fi
  $GT meshopt "$c" public/models/m/$n.glb >/dev/null 2>&1 || cp "$c" public/models/m/$n.glb
  s0=$(stat -f%z "$src"); s1=$(stat -f%z public/models/m/$n.glb)
  printf "  %-28s %6.2fMB → %6.2fMB  (ratio %s, tex %s)\n" "$n" "$(echo "scale=2;$s0/1048576"|bc)" "$(echo "scale=2;$s1/1048576"|bc)" "$ratio" "$tex"
}

echo "building phone asset set:"
# A prop that needs neither decimation nor a smaller sheet is COPIED, not
# re-encoded: the originals are draco, and running them through meshopt
# without quantization only makes them bigger on the wire (pcb 0.88 →
# 1.78MB) for no runtime gain at all.
copy () { cp "public/models/$1.glb" "public/models/m/$1.glb"
  printf "  %-28s %6.2fMB → copied as-is\n" "$1" "$(echo "scale=2;$(stat -f%z public/models/$1.glb)/1048576"|bc)"; }

#     name                    ratio tex  quantize
# the city and the racks carry the geometry bill and are used whole —
# they simplify and quantize. everything else is a prop the page may take
# apart, and its quality is what the visitor looks AT: untouched geometry,
# full-size sheets, no quantization.
build virtual-city            0.55  1024 1
build server_racking_system   0.7   1024 1
copy pcb
copy calculator
copy sci-fi_control_panel
copy laptop
copy door
copy terminal
copy card
copy qblock
echo "total:"; du -sh public/models/m
echo ""
echo "REMINDER: models changed -> bump VERSION in public/sw.js or return"
echo "visitors keep serving the OLD models from Cache Storage forever."
