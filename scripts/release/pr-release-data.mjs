import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const runGit = (args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

const getLastTag = () => {
  try {
    return runGit(["describe", "--tags", "--abbrev=0"]);
  } catch {
    return "";
  }
};

const getPrNumbersFromRange = (range) => {
  const rawLog = runGit(["log", "--format=%H%x1f%B%x1e", range]);
  const entries = rawLog.split("\x1e");
  const prNumbers = new Set();
  const patterns = [
    /merge pull request '?#?(\d+)'?/gi,
    /pull request #(\d+)/gi,
    /\(#(\d+)\)/g,
  ];

  for (const entry of entries) {
    if (!entry.trim()) {
      continue;
    }

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(entry)) !== null) {
        prNumbers.add(Number.parseInt(match[1], 10));
      }
    }
  }

  return [...prNumbers];
};

export const parseReleaseTypeFromTitle = (title) => {
  const conventional = title.match(/^([a-z]+)(\([^)]+\))?(!)?:\s.+$/i);
  if (!conventional) {
    return null;
  }

  const type = conventional[1].toLowerCase();
  const scope = conventional[2]
    ? conventional[2].slice(1, -1).toLowerCase()
    : "";
  const isBreaking = Boolean(conventional[3]) || /BREAKING CHANGE/i.test(title);
  if (isBreaking) {
    return "major";
  }

  if (type === "feat") {
    return "minor";
  }

  if (type === "fix" || type === "perf" || type === "revert") {
    return "patch";
  }

  if (type === "chore" && scope === "deps") {
    return "patch";
  }

  return null;
};

const precedence = {
  major: 3,
  minor: 2,
  patch: 1,
};

const chooseHighest = (types) => {
  let selected = null;
  for (const type of types) {
    if (!type) {
      continue;
    }

    if (!selected || precedence[type] > precedence[selected]) {
      selected = type;
    }
  }

  return selected;
};

const formatReleaseNotes = (pullRequests) => {
  if (pullRequests.length === 0) {
    return "";
  }

  const lines = ["### Pull Requests", ""];
  for (const pullRequest of pullRequests) {
    const number = pullRequest.number;
    const title = pullRequest.title ?? `PR #${number}`;
    const url = pullRequest.html_url ?? pullRequest.url;
    lines.push(`- ${title} ([#${number}](${url}))`);
  }

  return `${lines.join("\n")}\n`;
};

const getCachePath = () => {
  const headSha = runGit(["rev-parse", "HEAD"]);
  const repo = process.env.GITHUB_REPOSITORY ?? "repo";
  const slug = repo.replace(/[^a-zA-Z0-9._-]/g, "_");
  const baseDir = process.env.RUNNER_TEMP ?? os.tmpdir();
  return path.join(baseDir, `semantic-release-pr-data-${slug}-${headSha}.json`);
};

const readCachedReleaseData = async () => {
  try {
    const cachePath = getCachePath();
    const payload = await readFile(cachePath, "utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

const writeCachedReleaseData = async (data) => {
  const cachePath = getCachePath();
  await writeFile(cachePath, JSON.stringify(data), "utf8");
};

export const getReleaseData = async ({ useCache = true } = {}) => {
  if (useCache) {
    const cached = await readCachedReleaseData();
    if (cached) {
      return cached;
    }
  }

  const server = process.env.GITEA_URL ?? process.env.GITHUB_SERVER_URL;
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITEA_TOKEN ?? process.env.GITHUB_TOKEN;

  if (!server || !repo || !token) {
    throw new Error("Missing Gitea server URL, repository, or token.");
  }

  const lastTag = getLastTag();
  const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
  const prNumbers = getPrNumbersFromRange(range);
  if (prNumbers.length === 0) {
    const empty = {
      releaseType: null,
      releaseNotes: "",
      pullRequests: [],
    };
    await writeCachedReleaseData(empty);
    return empty;
  }

  const pullRequests = await Promise.all(
    prNumbers.map(async (prNumber) => {
      const response = await fetch(
        `${server}/api/v1/repos/${repo}/pulls/${prNumber}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch PR #${prNumber} (${response.status} ${response.statusText}).`,
        );
      }

      return response.json();
    }),
  );

  const sortedPullRequests = pullRequests.sort((a, b) => {
    const left = a.merged_at ?? a.updated_at ?? a.created_at ?? "";
    const right = b.merged_at ?? b.updated_at ?? b.created_at ?? "";
    return left.localeCompare(right);
  });

  const releaseType = chooseHighest(
    sortedPullRequests.map((pullRequest) =>
      parseReleaseTypeFromTitle(pullRequest.title ?? ""),
    ),
  );
  const releaseNotes = formatReleaseNotes(sortedPullRequests);

  const data = {
    releaseType,
    releaseNotes,
    pullRequests: sortedPullRequests,
  };
  await writeCachedReleaseData(data);
  return data;
};
