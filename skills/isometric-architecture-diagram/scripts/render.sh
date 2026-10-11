#!/usr/bin/env bash
# Render a generated .html/.svg to PNG with headless Chrome at 2x.
# Usage: render.sh diagram.html out.png [width] [height]
set -euo pipefail
IN=$(realpath "$1"); OUT=$(realpath -m "$2"); W=${3:-1920}; H=${4:-1080}
CHROME=${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser || echo "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")}
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --window-size="$W,$H" --screenshot="$OUT" "file://$IN" >/dev/null 2>&1
echo "rendered $OUT ($((W*2))x$((H*2)))"
