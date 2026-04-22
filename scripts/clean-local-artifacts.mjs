import { existsSync } from "node:fs";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const mode = process.argv[2] ?? "artifacts";
const dryRun = process.argv.includes("--dry-run");

const validModes = new Set(["artifacts", "cache", "all"]);

if (!validModes.has(mode)) {
  console.error(
    `Unknown mode "${mode}". Use one of: ${Array.from(validModes).join(", ")}.`,
  );
  process.exit(1);
}

const stats = {
  moved: 0,
  removed: 0,
  skipped: 0,
};

function logAction(action, target, detail = "") {
  const suffix = detail ? ` (${detail})` : "";
  console.log(`${action}: ${path.relative(projectRoot, target) || "."}${suffix}`);
}

function assertInsideProject(targetPath) {
  const relative = path.relative(projectRoot, targetPath);

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative === ""
  ) {
    throw new Error(`Refusing to touch unsafe path: ${targetPath}`);
  }
}

async function removePath(targetPath) {
  assertInsideProject(targetPath);

  if (!existsSync(targetPath)) {
    stats.skipped += 1;
    logAction("skip", targetPath, "not found");
    return;
  }

  if (dryRun) {
    stats.removed += 1;
    logAction("remove", targetPath, "dry-run");
    return;
  }

  await rm(targetPath, { force: true, recursive: true });
  stats.removed += 1;
  logAction("remove", targetPath);
}

async function ensureDir(targetPath) {
  assertInsideProject(targetPath);
  await mkdir(targetPath, { recursive: true });
}

async function movePath(fromPath, toPath) {
  assertInsideProject(fromPath);
  assertInsideProject(toPath);

  if (!existsSync(fromPath)) {
    stats.skipped += 1;
    logAction("skip", fromPath, "not found");
    return;
  }

  await ensureDir(path.dirname(toPath));

  if (dryRun) {
    stats.moved += 1;
    logAction("move", fromPath, `dry-run -> ${path.relative(projectRoot, toPath)}`);
    return;
  }

  await rename(fromPath, toPath);
  stats.moved += 1;
  logAction("move", fromPath, `-> ${path.relative(projectRoot, toPath)}`);
}

async function organizePlaywrightOutput() {
  const playwrightOutputRoot = path.join(projectRoot, "output", "playwright");

  if (!existsSync(playwrightOutputRoot)) {
    stats.skipped += 1;
    logAction("skip", playwrightOutputRoot, "not found");
    return;
  }

  const entries = await readdir(playwrightOutputRoot, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(playwrightOutputRoot, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === ".playwright-cli" ||
        entry.name.startsWith("workspace-session-") ||
        /^tasks-.*-url$/u.test(entry.name)
      ) {
        await removePath(entryPath);
      }

      continue;
    }

    if (entry.isFile()) {
      if (entry.name.endsWith(".log")) {
        await removePath(entryPath);
        continue;
      }

      if (entry.name.endsWith("-report.json")) {
        await movePath(
          entryPath,
          path.join(playwrightOutputRoot, "reports", entry.name),
        );
        continue;
      }

      if (entry.name.endsWith(".png")) {
        await movePath(
          entryPath,
          path.join(playwrightOutputRoot, "screenshots", "adhoc", entry.name),
        );
      }
    }
  }
}

async function main() {
  if (mode === "artifacts" || mode === "all") {
    await removePath(path.join(projectRoot, ".playwright-cli"));
    await organizePlaywrightOutput();
  }

  if (mode === "cache" || mode === "all") {
    await removePath(path.join(projectRoot, ".next"));
    await removePath(path.join(projectRoot, "tsconfig.tsbuildinfo"));
  }

  console.log(
    `Done. removed=${stats.removed} moved=${stats.moved} skipped=${stats.skipped}${dryRun ? " (dry-run)" : ""}`,
  );
}

await main();
