# Removing tracked node_modules/ and dist/ from branch tip

These directories were committed historically. MCP cannot practically delete thousands of node_modules blobs.

## Operator command (maturity-10)

```bash
git clone --depth 1 -b prod-readiness/maturity-10-onto-main https://github.com/brasseaux93-web/Avelis---Facilitator-Operating-System.git
cd Avelis---Facilitator-Operating-System
git rm -rf node_modules dist
git commit -m "chore: stop tracking node_modules and dist"
git push origin prod-readiness/maturity-10-onto-main
```

.gitignore already lists node_modules/ and dist/.
