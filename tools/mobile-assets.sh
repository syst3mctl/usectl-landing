#!/bin/bash
# Build the model sets. Two outputs per heavy model:
#
#   public/models/<name>.glb     desktop — dedup + dead-attribute prune + draco
#                                (render-identical; the city was 9.83MB of
#                                which ~5MB was 9x-replicated tiles and dead
#                                Float32 UVs no material ever sampled)
#   public/models/m/<name>.glb   phone/tablet — same passes + per-class
#                                simplify (wires/far ring 0.35, buildings
#                                keep 0.55) + KHR_mesh_quantization + meshopt
#
# The heavy lifting lives in tools/model-diet.mjs — read its header for the
# measured numbers and the WHY of every pass.
#
# SOURCES: the pristine city lives at variant_sources/virtual-city.orig.glb
# (the deployed desktop file is itself a diet build now). The rack's deployed
# desktop file IS the pristine source (its diet found nothing to cut).
#
# QUANTIZE ONLY WHAT THE PAGE DOES NOT TAKE APART (round-37 law: the page
# instances qblock's mesh for the faq blocks — quantized integer positions
# drew as metres and shredded the cubes). City and rack are used whole; every
# prop is COPIED as-is (their originals are draco; meshopt-without-quantize
# made them BIGGER on the wire: pcb 0.88 -> 1.78MB).
set -e
cd /Users/wazzap/Sites/usectl-landing
mkdir -p public/models/m

echo "city (desktop + phone):"
node tools/model-diet.mjs variant_sources/virtual-city.orig.glb public/models/virtual-city.glb
node tools/model-diet.mjs variant_sources/virtual-city.orig.glb public/models/m/virtual-city.glb mobile 0.55
# png textures -> lossless webp, bit-exact (tools/webp-lossless.mjs header)
node tools/webp-lossless.mjs public/models/virtual-city.glb public/models/virtual-city.glb
node tools/webp-lossless.mjs public/models/m/virtual-city.glb public/models/m/virtual-city.glb

echo "rack (phone; desktop file is already minimal):"
node tools/model-diet.mjs public/models/server_racking_system.glb public/models/m/server_racking_system.glb mobile 0.7

copy () { cp "public/models/$1.glb" "public/models/m/$1.glb"
  printf "  %-28s %6.2fMB copied as-is\n" "$1" "$(echo "scale=2;$(stat -f%z public/models/$1.glb)/1048576"|bc)"; }
copy pcb
copy calculator
copy sci-fi_control_panel
copy laptop
copy door
copy terminal
copy card
copy qblock

# .glb.gz siblings for every model — Cloudflare never compresses .glb on the
# fly, so functions/_middleware.js serves these pre-compressed (meshopt and
# draco payloads still gzip 20-45% smaller; the mobile city is 4.58 -> 3.72MB)
tools/compress-models.sh

echo "total:"; du -sh public/models/m
echo ""
echo "REMINDER: models changed -> bump VERSION in public/sw.js or return"
echo "visitors keep serving the OLD models from Cache Storage forever."
