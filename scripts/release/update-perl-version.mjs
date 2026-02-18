import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const nextVersion = process.argv[2];
if (!nextVersion) {
  throw new Error("Missing next release version argument.");
}

const modulePath = "lib/Google/GeoCoder/Smart.pm";
const source = await readFile(modulePath, "utf8");
const pattern = /our \$VERSION = '([^']+)';/;
if (!pattern.test(source)) {
  throw new Error(`Could not find $VERSION assignment in ${modulePath}.`);
}

const updated = source.replace(pattern, `our $VERSION = '${nextVersion}';`);
await writeFile(modulePath, updated, "utf8");
