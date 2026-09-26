#!/bin/bash
# Precompress every .glb under public/models into a .glb.gz sibling.
# functions/_middleware.js serves the sibling with Content-Encoding: gzip
# (encodeBody manual) whenever the client accepts gzip — Cloudflare never
# compresses application/octet-stream on its own, so without this the
# models ship raw. Rerun after any model changes (mobile-assets.sh does).
set -e
cd /Users/wazzap/Sites/usectl-landing
find public/models -name '*.glb' | while read -r f; do
  gzip -9 -c "$f" > "$f.gz"
  printf "  %-52s %7d -> %7d KB\n" "${f#public/}" "$(( $(stat -f%z "$f") / 1024 ))" "$(( $(stat -f%z "$f.gz") / 1024 ))"
done
