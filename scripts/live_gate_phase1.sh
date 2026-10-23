#!/bin/bash
# Phase 1 gate, live at 60x against the running stack.
out=evidence/phase1/live_gate_60x.txt; : > $out
for sc in ph_excursion heatwave; do
  info=$(curl -s -X POST localhost:8000/replay/start -H 'content-type: application/json' -d "{\"scenario\":\"$sc\",\"speed\":60}")
  sid=$(echo "$info" | python -c "import json,sys;print(json.load(sys.stdin)['session_id'])")
  echo "== $sc session $sid started $(date +%T)" >> $out
  while [ "$(curl -s localhost:8000/replay/state | python -c "import json,sys;print(json.load(sys.stdin)['finished'])")" != "True" ]; do sleep 15; done
  sleep 20
  echo "finished $(date +%T)" >> $out
  curl -s "localhost:3001/api/audit" | SID=$sid python -c "
import json,sys,os
sid=os.environ['SID']; e=[x for x in json.load(sys.stdin)['entries'] if str(x.get('run_id','')).startswith(sid) or str(x.get('proposal',{}).get('id','')) and False]
disp=[x for x in e if x['type']=='dispatched']; summ=[x for x in e if x.get('kind')=='shift_summary']
vids={v['proposal_id'] for s in summ for v in s['verdicts']}
vetoes=[v.get('invariant') for s in summ for v in s['verdicts'] if v['verdict']=='veto']
kinds=sorted({d['kind'] for s in summ for d in s['dispatched']})
print('runs audited', len(summ), '| dispatched', len(disp), kinds, '| vetoes', vetoes)
print('every dispatched action has a verdict:', all(d['proposal_id'] in vids for d in disp))
print('every dispatched action has an audit entry:', len(disp)==sum(len(s['dispatched']) for s in summ))
" >> $out
done
cat $out
