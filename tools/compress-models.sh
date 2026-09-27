#!/bin/bash
# Precompress every .glb under public/models into .glb.gz AND .glb.br
# siblings. The pages fetch a sibling and inflate it themselves with
# DecompressionStream (see the loader wrappers) — Cloudflare/nginx never
# compress application/octet-stream on their own, so without this the
# models ship raw. The extension is picked ONCE per page load
# (window.__mdlExt): '.br' where DecompressionStream('brotli') exists
# (Safari 18.4+), '.gz' elsewhere (Chrome has no brotli stream yet).
# UNIFORMITY IS LOAD-BEARING: the picker assumes the sibling exists for
# EVERY .glb — a missing .br would 404 and silently fall back to the RAW
# file (worse than .gz), so both siblings are emitted for all of them.
# brotli -q 11 ~= 10% smaller than gzip -9 on these meshopt/draco buffers.
# Rerun after any model changes (mobile-assets.sh does).
set -e
cd /Users/wazzap/Sites/usectl-landing
find public/models -name '*.glb' | while read -r f; do
  gzip -9 -c "$f" > "$f.gz"
  brotli -q 11 -f -o "$f.br" "$f"
  printf "  %-52s %7d -> gz %7d / br %7d KB\n" "${f#public/}" \
    "$(( $(stat -f%z "$f") / 1024 ))" \
    "$(( $(stat -f%z "$f.gz") / 1024 ))" \
    "$(( $(stat -f%z "$f.br") / 1024 ))"
done
