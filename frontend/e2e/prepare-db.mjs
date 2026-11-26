import { copyFileSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "../../backend/instance/helpdesk.db");
const target = "/tmp/opencode/helpdesk-e2e.db";

if (!existsSync(source)) {
  throw new Error(`Development database not found: ${source}`);
}

for (const suffix of ["", "-wal", "-shm", "-journal"]) {
  rmSync(`${target}${suffix}`, { force: true });
}

copyFileSync(source, target);
console.log(`E2E database ready: ${target}`);
