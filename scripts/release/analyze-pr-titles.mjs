import process from "node:process";
import { getReleaseData } from "./pr-release-data.mjs";

const { releaseType } = await getReleaseData();
if (!releaseType) {
  process.exit(0);
}

process.stdout.write(releaseType);
