#!/usr/bin/env bash
# Usage: gen-block.sh <source.html>  -> mt-integration/<name>.block.html
# Extracts <main>..</main>, rewrites image paths to Vercel absolute URLs,
# adds CSS links + body-class script + full-bleed breakout wrapper.
set -e
BASE="https://print-world-blond.vercel.app"
SRC="$1"
NAME="$(basename "$SRC" .html)"
OUT="mt-integration/${NAME}.block.html"

BODYCLASS="$(grep -oE '<body class="[^"]+"' "$SRC" | head -1 | sed -E 's/.*class="([^"]+)".*/\1/')"
MSTART="$(grep -nE '<main' "$SRC" | head -1 | cut -d: -f1)"
MEND="$(grep -nE '</main>' "$SRC" | head -1 | cut -d: -f1)"

{
  echo '<!-- ============================================================ -->'
  echo "<!-- Print World / ${NAME}  (メーカータウン「HTML直書き」貼付用)     -->"
  echo '<!-- CSS・画像はVercel参照 / 全幅ブレイクアウト対応                 -->'
  echo '<!-- ============================================================ -->'
  echo "<link rel=\"stylesheet\" href=\"$BASE/styles.css\">"
  echo "<link rel=\"stylesheet\" href=\"$BASE/mobile.css\">"
  echo "<script>document.body.classList.add('${BODYCLASS}');</script>"
  echo ''
  echo '<div style="width:100vw;position:relative;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);text-align:left;">'
  echo ''
  sed -n "${MSTART},${MEND}p" "$SRC" | sed "s#\(src\|srcset\)=\"images/#\1=\"$BASE/images/#g; s#url('images/#url('$BASE/images/#g; s#url(images/#url($BASE/images/#g"
  echo ''
  echo '</div>'
} > "$OUT"
echo "OK  $OUT  (body=${BODYCLASS}, main lines ${MSTART}-${MEND}, $(wc -l < "$OUT") lines)"
