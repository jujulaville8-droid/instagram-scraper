---
name: leads
description: Show a summary of recent Instagram leads. Usage: /leads
---

Show a quick summary of high-score leads in the database.

## How to run
Query the leads API from the insta-lead-finder project:

```bash
cd ~/Claude/insta-lead-finder && curl -s -H "Authorization: Bearer $(grep API_SECRET .env.local | cut -d= -f2)" "http://localhost:3000/api/leads?sort=score&min_score=70" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');const j=JSON.parse(d);console.log(\`\nHigh-score leads (70+): ${j.count}\n\`);(j.leads||[]).slice(0,10).forEach(l=>console.log(\`  [${l.lead_score}] ${l.instagram_handle} - ${l.display_name||'Unknown'} (${l.status})\`))"
```

Requires the dev server to be running (`npm run dev`).
