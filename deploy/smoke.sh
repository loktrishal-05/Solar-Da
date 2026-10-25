#!/bin/sh
# Smoke test for the container: docker run -p 7860:7860 solarda, then sh deploy/smoke.sh [base-url]
B=${1:-http://localhost:7860}; fail=0
for u in / /api/health /agents/health /agents/scenarios /vision/metrics; do
  c=$(curl -s -o /dev/null -w '%{http_code}' "$B$u"); echo "$c $u"; [ "$c" = 200 ] || fail=1
done
curl -s -F "image=@data/demo_images/tomato_late_blight_plantvillage.jpg" "$B/vision/classify" | grep -q Late_blight || { echo "FAIL classify"; fail=1; }
exit $fail
