# Removing tracked `node_modules/` and `dist/` from branch tip

These directories were committed historically. MCP cannot practically delete thousands of `node_modules` blobs; `gh` was not authenticated in the executor for a shallow-clone cleanup.

## Operator command

```bash
git clone --depth 1 -b prod-readiness/phase-3 https://github.com/brasseaux93-web/Avelis---Facilitator-Operating-System.git
cd Avelis---Facilitator-Operating-System
git rm -rf node_modules dist
git commit -m "chore: stop tracking node_modules and dist"
git push origin prod-readiness/phase-3
```

`.gitignore` already lists `node_modules/` and `dist/`.
