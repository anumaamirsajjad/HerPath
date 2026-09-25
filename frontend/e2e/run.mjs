// Runs every e2e/*.mjs test file in turn; exits non-zero if any check failed.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const dir = dirname(fileURLToPath(import.meta.url));
let failed = false;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".mjs") && !["lib.mjs", "run.mjs"].includes(f)).sort()) {
  console.log(`== ${f}`);
  try { execFileSync(process.execPath, [`${dir}/${f}`], { stdio: "inherit" }); } catch { failed = true; }
}
process.exit(failed ? 1 : 0);
