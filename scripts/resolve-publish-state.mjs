import process from "node:process";
import { pathToFileURL } from "node:url";

export function resolvePublishState(localVersion, publishedVersion) {
  const local = parseStableVersion(localVersion);
  const published = parseStableVersion(publishedVersion);

  for (let index = 0; index < local.length; index += 1) {
    if (local[index] > published[index]) return true;
    if (local[index] < published[index]) {
      throw new Error(`Local version ${localVersion} is behind npm ${publishedVersion}`);
    }
  }

  return false;
}

function parseStableVersion(value) {
  if (!/^\d+\.\d+\.\d+$/u.test(value)) throw new Error(`Unsupported version: ${value}`);
  return value.split(".").map(Number);
}

function main() {
  const [, , localVersion, publishedVersion] = process.argv;
  if (localVersion === undefined || publishedVersion === undefined) {
    throw new Error("Usage: node scripts/resolve-publish-state.mjs <local-version> <published-version>");
  }
  process.stdout.write(resolvePublishState(localVersion, publishedVersion) ? "true" : "false");
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) main();
