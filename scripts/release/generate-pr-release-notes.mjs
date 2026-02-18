import process from "node:process";
import { getReleaseData } from "./pr-release-data.mjs";

const { releaseNotes } = await getReleaseData();
if (!releaseNotes) {
  process.exit(0);
}

process.stdout.write(releaseNotes);
